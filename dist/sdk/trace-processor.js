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
exports.TraceProcessor = void 0;
const lh_trace_processor_1 = __importDefault(require("./lh-trace-processor"));
const trace_metrics_1 = require("./trace-metrics");
const logger_1 = require("../core/logger");
const ACCEPTABLE_NAVIGATION_URL_REGEX = /^(file|https?):/;
/**
 * Extends the lighthouse trace processor which extracts all the meaningful trace
 * events in chronological order from the tab's process
 *
 * We extend Lighthouse Processor instead of calling it directy as we want to control
 * what is the interest event for Navigation start and also in future we want to measure
 * metrics based on multiple navigations instead of a single navigation.
 */
class TraceProcessor extends lh_trace_processor_1.default {
    static _isNavigationStartOfInterest(event) {
        return (event.name === 'navigationStart' &&
            (!event.args.data ||
                !event.args.data.documentLoaderURL ||
                ACCEPTABLE_NAVIGATION_URL_REGEX.test(event.args.data.documentLoaderURL)));
    }
    static computeTrace(traceEvents) {
        // Origin of the trace is based on the last navigation event
        const options = {
            timeOriginDeterminationMethod: 'lastNavigationStart',
        };
        try {
            const processedTrace = this.processTrace({ traceEvents }, options);
            const processedNavigation = this.processNavigation(processedTrace);
            const userTiming = trace_metrics_1.UserTimings.compute(processedTrace);
            const { traces: expTraces, metrics } = trace_metrics_1.ExperienceMetrics.compute(processedNavigation);
            const { cls, traces: layoutTraces } = trace_metrics_1.CumulativeLayoutShift.compute(processedTrace);
            const perfMetrics = { cls, ...metrics };
            return {
                traces: userTiming.concat(expTraces, layoutTraces),
                metrics: perfMetrics,
            };
        }
        catch (e) {
            (0, logger_1.log)(e);
            return {};
        }
    }
}
exports.TraceProcessor = TraceProcessor;
//# sourceMappingURL=trace-processor.js.map