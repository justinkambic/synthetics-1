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
exports.after = exports.before = exports.afterAll = exports.beforeAll = exports.monitor = exports.step = exports.journey = exports.runner = void 0;
const dsl_1 = require("../dsl");
const runner_1 = __importDefault(require("./runner"));
const helpers_1 = require("../helpers");
const logger_1 = require("./logger");
/**
 * Use a gloabl Runner which would be accessed by the runtime and
 * required to handle the local vs global invocation through CLI
 */
const SYNTHETICS_RUNNER = Symbol.for('SYNTHETICS_RUNNER');
if (!global[SYNTHETICS_RUNNER]) {
    global[SYNTHETICS_RUNNER] = new runner_1.default();
}
exports.runner = global[SYNTHETICS_RUNNER];
exports.journey = (0, helpers_1.wrapFnWithLocation)((location, options, callback) => {
    (0, logger_1.log)(`Journey register: ${JSON.stringify(options)}`);
    if (typeof options === 'string') {
        options = { name: options, id: options };
    }
    const j = new dsl_1.Journey(options, callback, location);
    exports.runner.addJourney(j);
    return j;
});
exports.step = (0, helpers_1.wrapFnWithLocation)((location, name, callback) => {
    (0, logger_1.log)(`Step register: ${name}`);
    return exports.runner.currentJourney?.addStep(name, callback, location);
});
exports.monitor = {
    use: (0, helpers_1.wrapFnWithLocation)((location, config) => {
        /**
         * If the context is inside journey, then set it to journey context
         * otherwise set to the global monitor which will be used for all journeys
         */
        if (exports.runner.currentJourney) {
            exports.runner.currentJourney.updateMonitor(config);
        }
        else {
            exports.runner.updateMonitor(config);
        }
    }),
};
const beforeAll = (callback) => {
    exports.runner.addHook('beforeAll', callback);
};
exports.beforeAll = beforeAll;
const afterAll = (callback) => {
    exports.runner.addHook('afterAll', callback);
};
exports.afterAll = afterAll;
const before = (callback) => {
    if (!exports.runner.currentJourney) {
        throw new Error('before is called outside of the journey context');
    }
    return exports.runner.currentJourney.addHook('before', callback);
};
exports.before = before;
const after = (callback) => {
    if (!exports.runner.currentJourney) {
        throw new Error('after is called outside of the journey context');
    }
    return exports.runner.currentJourney.addHook('after', callback);
};
exports.after = after;
//# sourceMappingURL=index.js.map