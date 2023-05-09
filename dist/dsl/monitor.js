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
exports.Monitor = exports.ALLOWED_SCHEDULES = exports.SyntheticsLocations = void 0;
const crypto_1 = require("crypto");
const deepmerge_1 = __importDefault(require("deepmerge"));
const colors_1 = require("kleur/colors");
const helpers_1 = require("../helpers");
const public_locations_1 = require("../locations/public-locations");
exports.SyntheticsLocations = Object.keys(public_locations_1.LocationsMap);
exports.ALLOWED_SCHEDULES = [
    1, 3, 5, 10, 15, 20, 30, 60, 120, 240,
];
class Monitor {
    config;
    content;
    source;
    filter;
    constructor(config = {}) {
        this.config = config;
    }
    /**
     * Treat the creation time config with `monitor.use` as source of truth by
     * merging the values coming from CLI and Synthetics config file
     */
    update(globalOpts = {}) {
        this.config = (0, deepmerge_1.default)(globalOpts, this.config, {
            arrayMerge(target, source) {
                return [...new Set(source)];
            },
        });
    }
    get type() {
        return this.config.type;
    }
    setSource(source) {
        this.source = source;
    }
    /**
     * The underlying journey code of the monitor
     */
    setContent(content = '') {
        this.content = content;
    }
    /**
     * If journey files are colocated within the same file during
     * push command, when we invoke synthetics from HB we rely on
     * this filter for running that specific journey alone instead of
     * all journeys on the file
     */
    setFilter(filter) {
        this.filter = filter;
    }
    /**
     * Hash is used to identify if the monitor has changed since the last time
     * it was pushed to Kibana. Change is based on three factors:
     * - Monitor configuration
     * - Code changes
     * - File path changes
     */
    hash() {
        const hash = (0, crypto_1.createHash)('sha256');
        return hash
            .update(JSON.stringify(this.config))
            .update(this.content || '')
            .update(this.source?.file || '')
            .digest('base64');
    }
    validate() {
        const schedule = this.config.schedule;
        if (exports.ALLOWED_SCHEDULES.includes(schedule)) {
            return;
        }
        const { config, source } = this;
        let outer = (0, colors_1.bold)(`Invalid schedule: ${schedule}, allowed values are ${exports.ALLOWED_SCHEDULES.join(',')}\n`);
        if (source) {
            const inner = `* ${config.id} - ${source.file}:${source.line}:${source.column}\n`;
            outer += (0, helpers_1.indent)(inner);
        }
        throw (0, colors_1.red)(outer);
    }
}
exports.Monitor = Monitor;
//# sourceMappingURL=monitor.js.map