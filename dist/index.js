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
exports.expect = exports.after = exports.before = exports.afterAll = exports.beforeAll = exports.monitor = exports.step = exports.journey = exports.run = void 0;
const core_1 = require("./core");
async function run(options) {
    return core_1.runner.run(options);
}
exports.run = run;
/**
 * Export all core module functions
 */
var core_2 = require("./core");
Object.defineProperty(exports, "journey", { enumerable: true, get: function () { return core_2.journey; } });
Object.defineProperty(exports, "step", { enumerable: true, get: function () { return core_2.step; } });
Object.defineProperty(exports, "monitor", { enumerable: true, get: function () { return core_2.monitor; } });
Object.defineProperty(exports, "beforeAll", { enumerable: true, get: function () { return core_2.beforeAll; } });
Object.defineProperty(exports, "afterAll", { enumerable: true, get: function () { return core_2.afterAll; } });
Object.defineProperty(exports, "before", { enumerable: true, get: function () { return core_2.before; } });
Object.defineProperty(exports, "after", { enumerable: true, get: function () { return core_2.after; } });
var expect_1 = require("./core/expect");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return expect_1.expect; } });
//# sourceMappingURL=index.js.map