"use strict";
/**
 * MIT License
 *
 * Copyright (c) 2020-present, Elastic NV
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkManager = exports.NETWORK_ENTRY_SUMBOL = void 0;
const logger_1 = require("../core/logger");
const helpers_1 = require("../helpers");
/**
 * Kibana UI expects the requestStartTime and loadEndTime to be baseline
 * in seconds as they have the logic to convert it to milliseconds before
 * using for offset calculation
 */
function epochTimeInSeconds() {
    return (0, helpers_1.getTimestamp)() / 1e6;
}
/**
 * Find the first positive number in an array for Resource timing data
 */
const firstPositive = (numbers) => {
    for (let i = 0; i < numbers.length; ++i) {
        if (numbers[i] > 0) {
            return numbers[i];
        }
    }
    return null;
};
const roundMilliSecs = (value) => {
    return Math.floor(value * 1000) / 1000;
};
/**
 * Used as a key in each Network Request to identify the
 * associated request across distinct lifecycle events
 */
exports.NETWORK_ENTRY_SUMBOL = Symbol.for('NetworkEntry');
class NetworkManager {
    driver;
    _browser;
    _barrierPromises = new Set();
    results = [];
    _currentStep = null;
    constructor(driver) {
        this.driver = driver;
    }
    /**
     * Adds a protection barrier aganist all asynchronous extract operations from
     * request/response object that are happening during page lifecycle, If the
     * page is closed during the extraction, the barrier enforces those operations
     * to not result in exception
     */
    _addBarrier(page, promise) {
        if (!page)
            return;
        const race = Promise.race([
            new Promise(resolve => page.on('close', () => {
                this._barrierPromises.delete(race);
                resolve();
            })),
            promise,
        ]);
        this._barrierPromises.add(race);
        race.then(() => this._barrierPromises.delete(race));
    }
    async start() {
        (0, logger_1.log)(`Plugins: started collecting network events`);
        const { client, context } = this.driver;
        const { product } = await client.send('Browser.getVersion');
        const [name, version] = product.split('/');
        this._browser = { name, version };
        /**
         * Listen for all network events from PW context
         */
        context.on('request', this._onRequest.bind(this));
        context.on('response', this._onResponse.bind(this));
        context.on('requestfinished', this._onRequestCompleted.bind(this));
        context.on('requestfailed', this._onRequestCompleted.bind(this));
    }
    _findNetworkEntry(request) {
        return request[exports.NETWORK_ENTRY_SUMBOL];
    }
    _onRequest(request) {
        const url = request.url();
        /**
         * Data URI should not show up as network requests
         */
        if (url.startsWith('data:')) {
            return;
        }
        const timestamp = (0, helpers_1.getTimestamp)();
        const networkEntry = {
            browser: this._browser,
            step: this._currentStep,
            timestamp,
            url,
            type: request.resourceType(),
            request: {
                url,
                method: request.method(),
                headers: request.headers(),
                body: {
                    bytes: request.postDataBuffer()?.length || 0,
                },
            },
            response: {
                status: -1,
                headers: {},
                mimeType: 'x-unknown',
                redirectURL: '',
            },
            isNavigationRequest: request.isNavigationRequest(),
            requestSentTime: epochTimeInSeconds(),
            loadEndTime: -1,
            responseReceivedTime: -1,
            resourceSize: 0,
            transferSize: 0,
            timings: {
                blocked: -1,
                dns: -1,
                ssl: -1,
                connect: -1,
                send: -1,
                wait: -1,
                receive: -1,
                total: -1,
            },
        };
        if (request.redirectedFrom()) {
            const fromEntry = this._findNetworkEntry(request.redirectedFrom());
            if (fromEntry)
                fromEntry.response.redirectURL = request.url();
        }
        request[exports.NETWORK_ENTRY_SUMBOL] = networkEntry;
        this.results.push(networkEntry);
    }
    async _onResponse(response) {
        const request = response.request();
        const networkEntry = this._findNetworkEntry(request);
        if (!networkEntry)
            return;
        networkEntry.responseReceivedTime = epochTimeInSeconds();
        networkEntry.response = {
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            headers: {},
            mimeType: 'x-unknown',
            redirectURL: networkEntry.response.redirectURL,
        };
        // Gather all resource timing information up until the
        // TTFB(Time to first byte) is received
        const timing = request.timing();
        const blocked = roundMilliSecs(firstPositive([
            timing.domainLookupStart,
            timing.connectStart,
            timing.requestStart,
        ])) || -1;
        const dns = timing.domainLookupEnd !== -1
            ? roundMilliSecs(timing.domainLookupEnd - timing.domainLookupStart)
            : -1;
        const connect = timing.connectEnd !== -1
            ? roundMilliSecs(timing.connectEnd - timing.connectStart)
            : -1;
        const ssl = timing.secureConnectionStart !== -1
            ? roundMilliSecs(timing.connectEnd - timing.secureConnectionStart)
            : -1;
        const wait = timing.responseStart !== -1
            ? roundMilliSecs(timing.responseStart - timing.requestStart)
            : -1;
        networkEntry.timings = {
            blocked,
            dns,
            ssl,
            connect,
            send: 0,
            wait,
            receive: -1,
            total: -1,
        };
        this._calcTotalTime(networkEntry, timing);
        const page = request.frame().page();
        this._addBarrier(page, request.allHeaders().then(reqHeaders => {
            networkEntry.request.headers = reqHeaders;
            networkEntry.request.referrer = reqHeaders?.referer;
        }));
        this._addBarrier(page, response.allHeaders().then(resHeaders => {
            networkEntry.response.headers = resHeaders;
            const contentType = resHeaders['content-type'];
            if (contentType)
                networkEntry.response.mimeType = contentType.split(';')[0];
        }));
        this._addBarrier(page, response.serverAddr().then(server => {
            networkEntry.response.remoteIPAddress = server?.ipAddress;
            networkEntry.response.remotePort = server?.port;
        }));
        this._addBarrier(page, response.securityDetails().then(details => {
            if (details)
                networkEntry.response.securityDetails = details;
        }));
    }
    async _onRequestCompleted(request) {
        const networkEntry = this._findNetworkEntry(request);
        if (!networkEntry)
            return;
        networkEntry.loadEndTime = epochTimeInSeconds();
        // responseEnd is fired after the last byte of the response is received.
        const timing = request.timing();
        const receive = timing.responseEnd !== -1
            ? roundMilliSecs(timing.responseEnd - timing.responseStart)
            : -1;
        networkEntry.timings.receive = receive;
        this._calcTotalTime(networkEntry, timing);
        // For aborted/failed requests sizes will not be present
        if (timing.startTime <= 0) {
            return;
        }
        const page = request.frame().page();
        this._addBarrier(page, request.sizes().then(sizes => {
            networkEntry.request.bytes =
                sizes.requestHeadersSize + sizes.requestBodySize;
            networkEntry.request.body = {
                bytes: sizes.requestBodySize,
            };
            const transferSize = sizes.responseHeadersSize + sizes.responseBodySize;
            networkEntry.transferSize = transferSize;
            networkEntry.response.bytes = transferSize;
            networkEntry.response.body = {
                bytes: sizes.responseBodySize,
            };
        }));
    }
    /**
     * Calculates the total time for the network request based on the ResourceTiming
     * data from Playwright. Fallbacks to the event timings if ResourceTiming data
     * is not available.
     */
    _calcTotalTime(entry, rtiming) {
        const timings = entry.timings;
        entry.timings.total = [
            timings.blocked,
            timings.dns,
            timings.connect,
            timings.wait,
            timings.receive,
        ].reduce((pre, cur) => ((cur || -1) > 0 ? cur + pre : pre), 0);
        // fallback when ResourceTiming data is not available
        if (rtiming.startTime <= 0) {
            const end = entry.loadEndTime ||
                entry.responseReceivedTime ||
                entry.requestSentTime;
            const total = roundMilliSecs((end - entry.requestSentTime) * 1000);
            entry.timings.total = total <= 0 ? -1 : total;
        }
    }
    async stop() {
        /**
         * Waiting for all network events is error prone and might hang the tests
         * from getting closed forever when there are upstream bugs in browsers or
         * Playwright. So we log and drop these events once the test run is completed
         */
        if (this._barrierPromises.size > 0) {
            (0, logger_1.log)(`Plugins: dropping ${this._barrierPromises.size} network events`);
        }
        const context = this.driver.context;
        context.off('request', this._onRequest.bind(this));
        context.off('response', this._onResponse.bind(this));
        context.off('requestfinished', this._onRequestCompleted.bind(this));
        context.off('requestfailed', this._onRequestCompleted.bind(this));
        this._barrierPromises.clear();
        (0, logger_1.log)(`Plugins: stopped collecting network events`);
        return this.results;
    }
}
exports.NetworkManager = NetworkManager;
//# sourceMappingURL=network.js.map