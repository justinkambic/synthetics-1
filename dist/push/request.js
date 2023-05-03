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
exports.formatStaleMonitors = exports.formatFailedMonitors = exports.formatAPIError = exports.formatNotFoundError = exports.ok = exports.handleError = exports.sendReqAndHandleError = exports.sendRequest = void 0;
const colors_1 = require("kleur/colors");
const undici_1 = require("undici");
const helpers_1 = require("../helpers");
/* eslint-disable @typescript-eslint/no-var-requires */
const { version } = require('../../package.json');
async function sendRequest(options) {
    return await (0, undici_1.request)(options.url, {
        method: options.method,
        body: options.body,
        headers: {
            authorization: `ApiKey ${options.auth}`,
            'content-type': 'application/json',
            'user-agent': `Elastic/Synthetics ${version}`,
            'kbn-xsrf': 'true',
        },
        headersTimeout: 60 * 1000,
    });
}
exports.sendRequest = sendRequest;
async function sendReqAndHandleError(options) {
    const { statusCode, body } = await sendRequest(options);
    return await (await handleError(statusCode, options.url, body)).json();
}
exports.sendReqAndHandleError = sendReqAndHandleError;
// Handle bad status code errors from Kibana API and format the
// error message to be displayed to the user.
// returns the response stream if no error is found
async function handleError(statusCode, url, body) {
    if (statusCode === 404) {
        throw formatNotFoundError(url, await body.text());
    }
    else if (!ok(statusCode)) {
        let parsed;
        try {
            parsed = await body.json();
        }
        catch (e) {
            throw formatAPIError(statusCode, 'unexpected non-JSON error', await body.text());
        }
        throw formatAPIError(statusCode, parsed.error, parsed.message);
    }
    return body;
}
exports.handleError = handleError;
function ok(statusCode) {
    return statusCode >= 200 && statusCode <= 299;
}
exports.ok = ok;
function formatNotFoundError(url, message) {
    return (0, colors_1.red)((0, colors_1.bold)(`${helpers_1.symbols['failed']} Please check your kibana url: ${url} and try again - 404:${message}`));
}
exports.formatNotFoundError = formatNotFoundError;
function formatAPIError(statuCode, error, message) {
    let outer = (0, colors_1.bold)(`${helpers_1.symbols['failed']} Error\n`);
    let inner = (0, colors_1.bold)(`${helpers_1.symbols['failed']} monitor creation failed - ${statuCode}:${error}\n`);
    inner += (0, helpers_1.indent)(message, '    ');
    outer += (0, helpers_1.indent)(inner);
    return (0, colors_1.red)(outer);
}
exports.formatAPIError = formatAPIError;
function formatMonitorError(errors) {
    let outer = '';
    for (const error of errors) {
        const monitorId = error.id ? `: monitor(${error.id})` : '';
        let inner = (0, colors_1.bold)(`> ${error.reason}${monitorId}\n`);
        inner += (0, helpers_1.indent)(error.details, '    ');
        outer += (0, helpers_1.indent)(inner) + '\n';
        outer += '\n';
    }
    return outer;
}
function formatFailedMonitors(errors) {
    const heading = (0, colors_1.bold)(`${helpers_1.symbols['failed']} Error\n`);
    return (0, colors_1.red)(heading + formatMonitorError(errors));
}
exports.formatFailedMonitors = formatFailedMonitors;
function formatStaleMonitors(errors) {
    const heading = (0, colors_1.bold)(`${helpers_1.symbols['warning']} Warnings\n`);
    return (0, colors_1.yellow)(heading + formatMonitorError(errors));
}
exports.formatStaleMonitors = formatStaleMonitors;
//# sourceMappingURL=request.js.map