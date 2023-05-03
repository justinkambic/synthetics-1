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
exports.generateURL = exports.getChunks = exports.logDiff = void 0;
const helpers_1 = require("../helpers");
const colors_1 = require("kleur/colors");
function logDiff(newIDs, changedIDs, removedIDs, unchangedIDs) {
    (0, helpers_1.progress)('Monitor Diff: ' +
        (0, colors_1.green)(`Added(${newIDs.size}) `) +
        (0, colors_1.yellow)(`Updated(${changedIDs.size}) `) +
        (0, colors_1.red)(`Removed(${removedIDs.size}) `) +
        (0, colors_1.grey)(`Unchanged(${unchangedIDs.size})`));
}
exports.logDiff = logDiff;
function getChunks(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
exports.getChunks = getChunks;
function generateURL(options, operation) {
    const url = (0, helpers_1.removeTrailingSlash)(options.url);
    switch (operation) {
        case 'status':
            return `${url}/s/${options.space}/api/status`;
        case 'bulk_get':
        case 'bulk_update':
        case 'bulk_delete':
            return `${url}/s/${options.space}/api/synthetics/project/${options.id}/monitors`;
        case 'legacy':
            return `${url}/s/${options.space}/api/synthetics/service/project/monitors`;
        case 'location':
            return `${url}/internal/uptime/service/locations`;
        default:
            throw new Error('Invalid operation');
    }
}
exports.generateURL = generateURL;
//# sourceMappingURL=utils.js.map