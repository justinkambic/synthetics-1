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
/// <reference types="node" />
import BaseReporter from './base';
import { Journey, Step } from '../dsl';
import { NetworkInfo, NetworkConditions, TraceOutput, StatusValue, PerfMetrics, Screenshot, StartEvent, JourneyStartResult, StepEndResult, JourneyEndResult, PageMetrics } from '../common_types';
declare type OutputType = 'synthetics/metadata' | 'journey/register' | 'journey/start' | 'screenshot/block' | 'step/screenshot_ref' | 'step/screenshot' | 'step/metrics' | 'step/filmstrips' | 'step/end' | 'journey/network_info' | 'journey/browserconsole' | 'journey/end';
declare type Payload = {
    source?: string;
    start?: number;
    end?: number;
    url?: string;
    status?: StatusValue;
    pagemetrics?: PageMetrics;
    type?: OutputType;
    text?: string;
    index?: number;
    network_conditions?: NetworkConditions;
};
declare type OutputFields = {
    type: OutputType;
    _id?: string;
    journey?: Journey;
    timestamp?: number;
    url?: string;
    step?: Partial<Step> & {
        duration?: {
            us: number;
        };
    };
    error?: Error;
    root_fields?: Record<string, unknown>;
    payload?: Payload;
    blob?: string;
    blob_mime?: string;
};
declare type ScreenshotBlob = {
    blob: string;
    id: string;
};
declare type ScreenshotReference = {
    width: number;
    height: number;
    blocks: Array<{
        hash: string;
        top: number;
        left: number;
        width: number;
        height: number;
    }>;
};
export declare function formatNetworkFields(network: NetworkInfo): {
    ecs: {
        url: string;
        user_agent: {
            name: string;
            version: string;
            original: string;
        };
        http: {
            request: import("../common_types").Request;
            response: import("../common_types").Response;
        };
        tls: {
            server: {
                x509: {
                    issuer: {
                        common_name: string;
                    };
                    subject: {
                        common_name: string;
                    };
                    not_after: string;
                    not_before: string;
                };
            };
            version_protocol: string;
            version: string;
        };
    };
    payload: Partial<NetworkInfo>;
};
export declare function getScreenshotBlocks(screenshot: Buffer): Promise<{
    blocks: ScreenshotBlob[];
    reference: ScreenshotReference;
    blob_mime: string;
}>;
/**
 * Get all the screenshots from the cached screenshot location
 * at the end of each journey and construct equally sized blocks out
 * of the individual screenshot image.
 */
export declare function gatherScreenshots(screenshotsPath: string, callback: (data: Screenshot) => Promise<void>): Promise<void>;
export default class JSONReporter extends BaseReporter {
    onStart(event: StartEvent): void;
    onJourneyRegister(journey: Journey): void;
    onJourneyStart(journey: Journey, { timestamp }: JourneyStartResult): void;
    onStepEnd(journey: Journey, step: Step, { start, end, error, url, status, pagemetrics, traces, metrics, filmstrips, }: StepEndResult): void;
    onJourneyEnd(journey: Journey, { timestamp, start, end, networkinfo, browserconsole, status, error, options, }: JourneyEndResult): Promise<void>;
    onEnd(): void;
    writeScreenshotBlocks(journey: Journey, screenshot: Screenshot): Promise<void>;
    writeMetrics(journey: Journey, step: Step, type: string, events: Array<TraceOutput> | PerfMetrics): void;
    writeJSON({ _id, journey, type, timestamp, step, root_fields, error, payload, blob, blob_mime, url, }: OutputFields): void;
}
export {};
//# sourceMappingURL=json.d.ts.map