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
exports.createMonitorsLegacy = exports.getVersion = exports.bulkDeleteMonitors = exports.bulkGetMonitors = exports.bulkPutMonitors = exports.CHUNK_SIZE = void 0;
const helpers_1 = require("../helpers");
const request_1 = require("./request");
const utils_1 = require("./utils");
// Default chunk size for bulk put / delete
exports.CHUNK_SIZE = 100;
async function bulkPutMonitors(options, schemas) {
    const resp = await (0, request_1.sendReqAndHandleError)({
        url: (0, utils_1.generateURL)(options, 'bulk_update') + '/_bulk_update',
        method: 'PUT',
        auth: options.auth,
        body: JSON.stringify({ monitors: schemas }),
    });
    const { failedMonitors } = resp;
    if (failedMonitors && failedMonitors.length > 0) {
        throw (0, request_1.formatFailedMonitors)(failedMonitors);
    }
    return resp;
}
exports.bulkPutMonitors = bulkPutMonitors;
async function bulkGetMonitors(options) {
    const allMonitors = [];
    const resp = await fetchMonitors(options);
    allMonitors.push(...resp.monitors);
    let afterKey = resp.afterKey;
    const total = resp.total;
    while (allMonitors.length < total) {
        const resp = await fetchMonitors(options, afterKey);
        allMonitors.push(...resp.monitors);
        afterKey = resp.afterKey;
    }
    return {
        total,
        monitors: allMonitors,
    };
}
exports.bulkGetMonitors = bulkGetMonitors;
const fetchMonitors = async (options, afterKey) => {
    let url = (0, utils_1.generateURL)(options, 'bulk_get');
    if (afterKey) {
        url += `?search_after=${afterKey}`;
    }
    const resp = await (0, request_1.sendReqAndHandleError)({
        url,
        method: 'GET',
        auth: options.auth,
    });
    return {
        afterKey: resp.after_key,
        total: resp.total,
        monitors: resp.monitors,
    };
};
async function bulkDeleteMonitors(options, monitorIDs) {
    return await (0, request_1.sendReqAndHandleError)({
        url: (0, utils_1.generateURL)(options, 'bulk_delete') + '/_bulk_delete',
        method: 'DELETE',
        auth: options.auth,
        body: JSON.stringify({ monitors: monitorIDs }),
    });
}
exports.bulkDeleteMonitors = bulkDeleteMonitors;
async function getVersion(options) {
    const data = await (0, request_1.sendReqAndHandleError)({
        url: (0, utils_1.generateURL)(options, 'status'),
        method: 'GET',
        auth: options.auth,
    });
    return data.version.number;
}
exports.getVersion = getVersion;
async function createMonitorsLegacy({ schemas, keepStale, options, }) {
    const schema = {
        project: options.id,
        keep_stale: keepStale,
        monitors: schemas,
    };
    const url = (0, utils_1.generateURL)(options, 'legacy');
    const { body, statusCode } = await (0, request_1.sendRequest)({
        url,
        method: 'PUT',
        auth: options.auth,
        body: JSON.stringify(schema),
    });
    const resBody = await (0, request_1.handleError)(statusCode, url, body);
    const allchunks = [];
    for await (const data of resBody) {
        allchunks.push(Buffer.from(data));
    }
    const chunks = (0, helpers_1.safeNDJSONParse)(Buffer.concat(allchunks).toString('utf-8'));
    // Its kind of hacky for now where Kibana streams the response by
    // writing the data as NDJSON events (data can be interleaved), we
    // distinguish the final data by checking if the event was a progress vs complete event
    for (const chunk of chunks) {
        if (typeof chunk === 'string') {
            // Ignore the progress from Kibana as we chunk the requests
            continue;
        }
        const { failedMonitors, failedStaleMonitors } = chunk;
        if (failedMonitors && failedMonitors.length > 0) {
            throw (0, request_1.formatFailedMonitors)(failedMonitors);
        }
        if (failedStaleMonitors.length > 0) {
            throw (0, request_1.formatStaleMonitors)(failedStaleMonitors);
        }
    }
}
exports.createMonitorsLegacy = createMonitorsLegacy;
//# sourceMappingURL=kibana_api.js.map