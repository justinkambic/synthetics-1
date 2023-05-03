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
exports.log = void 0;
const colors_1 = require("kleur/colors");
const helpers_1 = require("../helpers");
/**
 * Set debug based on DEBUG ENV and namespace - synthetics
 */
if (process.env.DEBUG && process.env.DEBUG.includes('synthetics')) {
    process.env['__SYNTHETICS__DEBUG__'] = '1';
}
function log(msg) {
    if (!process.env['__SYNTHETICS__DEBUG__'] || !msg) {
        return;
    }
    if (typeof msg === 'object') {
        msg = JSON.stringify(msg);
    }
    const time = (0, colors_1.dim)((0, colors_1.cyan)(`at ${parseInt(String((0, helpers_1.now)()))} ms `));
    process.stderr.write(time + (0, colors_1.italic)((0, colors_1.grey)(msg)) + '\n');
}
exports.log = log;
//# sourceMappingURL=logger.js.map