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
import LighthouseTraceProcessor from './lh-trace-processor';
import { PerfMetrics } from '../common_types';
/**
 * Trace Event Format
 * https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU
 */
export declare type TraceEvent = {
    name: string;
    cat: string;
    pid: number;
    tid: number;
    ph?: string;
    args?: {
        snapshot?: string;
        frame: string;
        data: {
            had_recent_input: boolean;
            is_main_frame: boolean;
            cumulative_score: number;
            score: number;
            weighted_score_delta: number;
        } & Record<string, unknown>;
    };
    /**
     * Platform specific monotonic non decreasing clock time
     * https://source.chromium.org/chromium/chromium/src/+/master:base/time/time.h;l=936;bpv=0;bpt=0
     *
     * The tracing clock timestamp of the event. The timestamps are provided at microsecond granularity.
     */
    ts: number;
};
/**
 * Exported data from Lighthouse trace processor
 */
declare type LHTraceTime = {
    timeOrigin: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    largestContentfulPaintAllFrames: number;
    domContentLoaded: number;
    load: number;
    traceEnd: number;
};
export declare type LHProcessedNavigation = {
    domContentLoadedEvt: TraceEvent;
    firstContentfulPaintEvt: TraceEvent;
    largestContentfulPaintEvt: TraceEvent;
    loadEvt: TraceEvent;
    timestamps: LHTraceTime;
    timings: LHTraceTime;
    lcpInvalidated: boolean;
};
export declare type LHProcessedTrace = {
    processEvents: Array<TraceEvent>;
    frameEvents: Array<TraceEvent>;
    mainThreadEvents: Array<TraceEvent>;
    frameTreeEvents: Array<TraceEvent>;
    timeOriginEvt: TraceEvent;
    timestamps: Partial<LHTraceTime>;
    timings: Partial<LHTraceTime>;
};
/**
 * Extends the lighthouse trace processor which extracts all the meaningful trace
 * events in chronological order from the tab's process
 *
 * We extend Lighthouse Processor instead of calling it directy as we want to control
 * what is the interest event for Navigation start and also in future we want to measure
 * metrics based on multiple navigations instead of a single navigation.
 */
export declare class TraceProcessor extends LighthouseTraceProcessor {
    static _isNavigationStartOfInterest(event: any): boolean;
    static computeTrace(traceEvents: Array<TraceEvent>): {
        traces: import("../common_types").TraceOutput[];
        metrics: Partial<PerfMetrics>;
    } | {
        traces?: undefined;
        metrics?: undefined;
    };
}
export {};
//# sourceMappingURL=trace-processor.d.ts.map