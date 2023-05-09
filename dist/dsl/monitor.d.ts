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
import { ThrottlingOptions, Location, ScreenshotOptions, Params, PlaywrightOptions } from '../common_types';
import { LocationsMap } from '../locations/public-locations';
export declare type SyntheticsLocationsType = keyof typeof LocationsMap;
export declare const SyntheticsLocations: ("japan" | "india" | "singapore" | "australia_east" | "united_kingdom" | "germany" | "canada_east" | "brazil" | "us_east" | "us_west")[];
export declare const ALLOWED_SCHEDULES: readonly [1, 3, 5, 10, 15, 20, 30, 60, 120, 240];
export declare type MonitorConfig = {
    id?: string;
    name?: string;
    type?: string;
    tags?: string[];
    schedule?: typeof ALLOWED_SCHEDULES[number];
    enabled?: boolean;
    locations?: SyntheticsLocationsType[];
    privateLocations?: string[];
    /**
     * @deprecated This option is ignored.
     * Network throttling via chrome devtools is ignored at the moment.
     * See https://github.com/elastic/synthetics/blob/main/docs/throttling.md for more details.
     */
    throttling?: boolean | ThrottlingOptions;
    screenshot?: ScreenshotOptions;
    params?: Params;
    playwrightOptions?: PlaywrightOptions;
    alert?: {
        status: {
            enabled: boolean;
        };
    };
};
declare type MonitorFilter = {
    match: string;
    tags?: string[];
};
export declare class Monitor {
    config: MonitorConfig;
    content?: string;
    source?: Location;
    filter: MonitorFilter;
    constructor(config?: MonitorConfig);
    /**
     * Treat the creation time config with `monitor.use` as source of truth by
     * merging the values coming from CLI and Synthetics config file
     */
    update(globalOpts?: MonitorConfig): void;
    get type(): string;
    setSource(source: Location): void;
    /**
     * The underlying journey code of the monitor
     */
    setContent(content?: string): void;
    /**
     * If journey files are colocated within the same file during
     * push command, when we invoke synthetics from HB we rely on
     * this filter for running that specific journey alone instead of
     * all journeys on the file
     */
    setFilter(filter: MonitorFilter): void;
    /**
     * Hash is used to identify if the monitor has changed since the last time
     * it was pushed to Kibana. Change is based on three factors:
     * - Monitor configuration
     * - Code changes
     * - File path changes
     */
    hash(): string;
    validate(): void;
}
export {};
//# sourceMappingURL=monitor.d.ts.map