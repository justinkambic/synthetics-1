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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatherScreenshots = exports.getScreenshotBlocks = exports.formatNetworkFields = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = require("crypto");
const base_1 = __importDefault(require("./base"));
const helpers_1 = require("../helpers");
const snakecase_keys_1 = __importDefault(require("snakecase-keys"));
/* eslint-disable @typescript-eslint/no-var-requires */
const { version, name } = require('../../package.json');
function getMetadata() {
    return {
        os: {
            platform: process.platform,
        },
        package: {
            name,
            version,
        },
    };
}
function formatTLS(tls) {
    if (!tls || !tls.protocol) {
        return;
    }
    const [name, version] = tls.protocol.toLowerCase().split(' ');
    return {
        server: {
            x509: {
                issuer: {
                    common_name: tls.issuer,
                },
                subject: {
                    common_name: tls.subjectName,
                },
                not_after: new Date(tls.validTo * 1000).toISOString(),
                not_before: new Date(tls.validFrom * 1000).toISOString(),
            },
        },
        version_protocol: name,
        version,
    };
}
function formatNetworkFields(network) {
    const { request, response, url, browser } = network;
    const ecs = {
        // URL would be parsed and mapped by heartbeat
        url,
        user_agent: {
            name: browser.name,
            version: browser.version,
            original: request.headers?.['User-Agent'],
        },
        http: {
            request,
            response,
        },
        tls: formatTLS(response?.securityDetails),
    };
    const pickItems = [
        'browser',
        'type',
        'isNavigationRequest',
        'requestSentTime',
        'responseReceivedTime',
        'loadEndTime',
        'transferSize',
        'resourceSize',
        'timings',
    ];
    const payload = pickItems.reduce((acc, value) => {
        network[value] && (acc[value] = network[value]);
        return acc;
    }, {});
    return { ecs, payload };
}
exports.formatNetworkFields = formatNetworkFields;
function journeyInfo(journey, type, status) {
    if (!journey) {
        return;
    }
    return {
        name: journey.name,
        id: journey.id,
        tags: journey.tags,
        status: type === 'journey/end' ? status : undefined,
    };
}
function stepInfo(step, type, status) {
    if (!step) {
        return;
    }
    return {
        name: step.name,
        index: step.index,
        status: type === 'step/end' ? status : undefined,
        duration: step.duration,
    };
}
async function getScreenshotBlocks(screenshot) {
    const { width, height } = await (0, sharp_1.default)(screenshot).metadata();
    /**
     * Chop the screenshot image (1280*720) which is the default
     * viewport size in to 64 equal blocks for a given image
     * which can be acheived by keeping the division to 8
     *
     * Changing division to 16 would yield us 256 smaller blocks, but it is not
     * optimal for caching in the ES and proved out to be bad, so we stick to 8
     */
    const divisions = 8;
    const blockWidth = Math.floor(width / divisions);
    const blockHeight = Math.floor(height / divisions);
    const reference = {
        width,
        height,
        blocks: [],
    };
    const blocks = [];
    for (let row = 0; row < divisions; row++) {
        const top = row * blockHeight;
        for (let col = 0; col < divisions; col++) {
            const left = col * blockWidth;
            // We create a new sharp instance for each block to avoid
            // running in to extraction/orientation issues
            const buf = await (0, sharp_1.default)(screenshot, { sequentialRead: true })
                .extract({ top, left, width: blockWidth, height: blockHeight })
                .jpeg()
                .toBuffer();
            const hash = (0, crypto_1.createHash)('sha1').update(buf).digest('hex');
            blocks.push({
                blob: buf.toString('base64'),
                id: hash,
            });
            /**
             * We dont write the width, height of individual blocks on the
             * reference as we use similar sized blocks for each extraction,
             * we would need to send the width and height here if we decide to
             * go with dynamic block extraction.
             */
            reference.blocks.push({
                hash,
                top,
                left,
                width: blockWidth,
                height: blockHeight,
            });
        }
    }
    return { blocks, reference, blob_mime: 'image/jpeg' };
}
exports.getScreenshotBlocks = getScreenshotBlocks;
/**
 * Get all the screenshots from the cached screenshot location
 * at the end of each journey and construct equally sized blocks out
 * of the individual screenshot image.
 */
async function gatherScreenshots(screenshotsPath, callback) {
    if ((0, helpers_1.isDirectory)(screenshotsPath)) {
        await (0, helpers_1.totalist)(screenshotsPath, async (_, absPath) => {
            try {
                const content = (0, fs_1.readFileSync)(absPath, 'utf8');
                const screenshot = JSON.parse(content);
                await callback(screenshot);
            }
            catch (_) {
                // TODO: capture progarammatic synthetic errors under different type
            }
        });
    }
}
exports.gatherScreenshots = gatherScreenshots;
class JSONReporter extends base_1.default {
    onStart(event) {
        /**
         * report the number of journeys that exists on a suite which
         * could be used for better sharding
         */
        this.writeJSON({
            type: 'synthetics/metadata',
            root_fields: {
                num_journeys: event.numJourneys,
            },
            payload: event.networkConditions
                ? {
                    network_conditions: event.networkConditions,
                }
                : undefined,
        });
    }
    onJourneyRegister(journey) {
        this.writeJSON({
            type: 'journey/register',
            journey,
        });
    }
    onJourneyStart(journey, { timestamp }) {
        this.writeJSON({
            type: 'journey/start',
            journey,
            timestamp,
            payload: { source: journey.callback.toString() },
        });
    }
    onStepEnd(journey, step, { start, end, error, url, status, pagemetrics, traces, metrics, filmstrips, }) {
        this.writeMetrics(journey, step, 'relative_trace', traces);
        this.writeMetrics(journey, step, 'experience', metrics);
        if (filmstrips) {
            // Write each filmstrip separately so that we don't get documents that are too large
            filmstrips.forEach((strip, index) => {
                this.writeJSON({
                    type: 'step/filmstrips',
                    journey,
                    step,
                    payload: { index },
                    root_fields: {
                        browser: { relative_trace: { start: strip.start } },
                    },
                    blob: strip.blob,
                    blob_mime: strip.mime,
                });
            });
        }
        this.writeJSON({
            type: 'step/end',
            journey,
            step: {
                ...step,
                duration: {
                    us: (0, helpers_1.getDurationInUs)(end - start),
                },
            },
            url,
            error,
            payload: {
                source: step.callback.toString(),
                url,
                status,
                pagemetrics,
            },
        });
    }
    async onJourneyEnd(journey, { timestamp, start, end, networkinfo, browserconsole, status, error, options, }) {
        const { ssblocks, screenshots } = options;
        const writeScreenshots = screenshots === 'on' ||
            (screenshots === 'only-on-failure' && status === 'failed');
        if (writeScreenshots) {
            await gatherScreenshots((0, path_1.join)(helpers_1.CACHE_PATH, 'screenshots'), async (screenshot) => {
                const { data, timestamp, step } = screenshot;
                if (!data) {
                    return;
                }
                if (ssblocks) {
                    await this.writeScreenshotBlocks(journey, screenshot);
                }
                else {
                    this.writeJSON({
                        type: 'step/screenshot',
                        timestamp,
                        journey,
                        step,
                        blob: data,
                        blob_mime: 'image/jpeg',
                    });
                }
            });
        }
        if (networkinfo) {
            networkinfo.forEach(ni => {
                const { ecs, payload } = formatNetworkFields(ni);
                this.writeJSON({
                    type: 'journey/network_info',
                    journey,
                    timestamp: ni.timestamp,
                    root_fields: (0, snakecase_keys_1.default)(ecs),
                    step: ni.step,
                    payload: (0, snakecase_keys_1.default)(payload),
                });
            });
        }
        if (browserconsole) {
            browserconsole.forEach(({ timestamp, text, type, step, error }) => {
                this.writeJSON({
                    type: 'journey/browserconsole',
                    journey,
                    timestamp,
                    step,
                    error,
                    payload: {
                        text,
                        type,
                    },
                });
            });
        }
        this.writeJSON({
            type: 'journey/end',
            journey,
            timestamp,
            error,
            payload: {
                start,
                end,
                status,
            },
        });
    }
    onEnd() {
        this.stream.flushSync();
    }
    async writeScreenshotBlocks(journey, screenshot) {
        const { blob_mime, blocks, reference } = await getScreenshotBlocks(Buffer.from(screenshot.data, 'base64'));
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            this.writeJSON({
                type: 'screenshot/block',
                timestamp: screenshot.timestamp,
                _id: block.id,
                blob: block.blob,
                blob_mime,
            });
        }
        this.writeJSON({
            type: 'step/screenshot_ref',
            timestamp: screenshot.timestamp,
            journey,
            step: screenshot.step,
            root_fields: {
                screenshot_ref: reference,
            },
        });
    }
    writeMetrics(journey, step, type, events) {
        const metrics = Array.isArray(events) ? events : [events];
        metrics.forEach(event => {
            event &&
                this.writeJSON({
                    type: 'step/metrics',
                    journey,
                    step,
                    root_fields: {
                        browser: {
                            [type]: event,
                        },
                    },
                });
        });
    }
    // Writes a structured synthetics event
    // Note that blob is ultimately stored in ES as a base64 encoded string. You must base 64 encode
    // it before passing it into this function!
    // The payload field is an un-indexed field with no ES mapping, so users can put arbitary structured
    // stuff in there
    writeJSON({ _id, journey, type, timestamp, step, root_fields, error, payload, blob, blob_mime, url, }) {
        this.write({
            type,
            _id,
            '@timestamp': timestamp || (0, helpers_1.getTimestamp)(),
            journey: journeyInfo(journey, type, payload?.status),
            step: stepInfo(step, type, payload?.status),
            root_fields: { ...(root_fields || {}), ...getMetadata() },
            payload,
            blob,
            blob_mime,
            error: (0, helpers_1.formatError)(error),
            url,
            package_version: version,
        });
    }
}
exports.default = JSONReporter;
//# sourceMappingURL=json.js.map