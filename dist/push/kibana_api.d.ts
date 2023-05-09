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
import { PushOptions } from '../common_types';
import { MonitorHashID, MonitorSchema } from './monitor';
import { APIMonitorError } from './request';
export declare const CHUNK_SIZE = 100;
export declare type PutResponse = {
    createdMonitors: string[];
    updatedMonitors: string[];
    failedMonitors: APIMonitorError[];
};
export declare function bulkPutMonitors(options: PushOptions, schemas: MonitorSchema[]): Promise<PutResponse>;
export declare type GetResponse = {
    total: number;
    monitors: MonitorHashID[];
    after_key?: string;
};
export declare function bulkGetMonitors(options: PushOptions): Promise<GetResponse>;
export declare type DeleteResponse = {
    deleted_monitors: string[];
};
export declare function bulkDeleteMonitors(options: PushOptions, monitorIDs: string[]): Promise<DeleteResponse>;
export declare function getVersion(options: PushOptions): Promise<number>;
export declare type LegacyAPISchema = {
    project: string;
    keep_stale: boolean;
    monitors: MonitorSchema[];
};
export declare function createMonitorsLegacy({ schemas, keepStale, options, }: {
    schemas: MonitorSchema[];
    keepStale: boolean;
    options: PushOptions;
}): Promise<void>;
//# sourceMappingURL=kibana_api.d.ts.map