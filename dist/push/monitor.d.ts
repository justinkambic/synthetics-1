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
import { Monitor, MonitorConfig } from '../dsl/monitor';
import { PushOptions } from '../common_types';
export declare type MonitorSchema = Omit<MonitorConfig, 'locations'> & {
    locations: string[];
    content?: string;
    filter?: Monitor['filter'];
    hash?: string;
};
export declare type MonitorHashID = {
    journey_id?: string;
    hash?: string;
};
declare class RemoteDiffResult {
    newIDs: Set<string>;
    changedIDs: Set<string>;
    removedIDs: Set<string>;
    unchangedIDs: Set<string>;
}
export declare function diffMonitors(local: MonitorHashID[], remote: MonitorHashID[]): RemoteDiffResult;
export declare function getLocalMonitors(monitors: Monitor[]): MonitorHashID[];
export declare function buildMonitorSchema(monitors: Monitor[], isV2: boolean): Promise<MonitorSchema[]>;
export declare function createLightweightMonitors(workDir: string, options: PushOptions): Promise<Monitor[]>;
export declare function buildMonitorFromYaml(config: MonitorConfig, options: PushOptions): Monitor;
export declare const parseAlertConfig: (config: MonitorConfig) => {
    status: {
        enabled: any;
    };
};
export declare function parseSchedule(schedule: string): 1 | 3 | 5 | 20 | 10 | 15 | 30 | 60 | 120 | 240;
export {};
//# sourceMappingURL=monitor.d.ts.map