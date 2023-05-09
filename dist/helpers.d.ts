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
import { HooksArgs, HooksCallback, NetworkConditions, Location, ThrottlingOptions } from './common_types';
export declare function noop(): void;
export declare function indent(lines: string, tab?: string): string;
export declare const symbols: {
    warning: string;
    skipped: string;
    progress: string;
    succeeded: string;
    failed: string;
};
export declare function generateUniqueId(): string;
export declare function generateTempPath(): string;
/**
 * Get Monotonically increasing time in seconds since
 * an arbitrary point in the past.
 *
 * We internally use the monotonically increasing clock timing
 * similar to the chrome devtools protocol network events for
 * journey,step start/end fields to make querying in the UI easier
 */
export declare function monotonicTimeInSeconds(): number;
/**
 * Converts the trace events timestamp field from microsecond
 * resolution to monotonic seconds timestamp similar to other event types (journey, step, etc)
 * Reference - https://github.com/samccone/chrome-trace-event/blob/d45bc8af3b5c53a3adfa2c5fc107b4fae054f579/lib/trace-event.ts#L21-L22
 *
 * Tested and verified on both Darwin and Linux
 */
export declare function microSecsToSeconds(ts: number): number;
export declare function getTimestamp(): number;
/**
 * Relative current time from the start of the current node process
 */
export declare function now(): number;
/**
 * Execute all the hooks callbacks in parallel using Promise.all
 */
export declare function runParallel(callbacks: Array<HooksCallback>, args: HooksArgs): Promise<void[]>;
export declare function isDepInstalled(dep: any): string | false;
export declare function isDirectory(path: any): boolean;
export declare function isFile(filePath: any): boolean;
/**
 * Traverse the directory tree up from the cwd until we find
 * package.json file to check if the user is invoking our script
 * from an NPM project.
 */
export declare function findPkgJsonByTraversing(resolvePath: any, cwd: any): any;
/**
 * Modified version of `totalist` package that handles the symlink issue
 * and avoids infinite recursion
 *
 * Based on code from totalist!
 * https://github.com/lukeed/totalist/blob/44379974e535afe9c38e8d643dd64c59101a14b9/src/async.js#L8
 */
export declare function totalist(dir: string, callback: (relPath: string, absPath: string) => any, pre?: string): Promise<void>;
/**
 * Find index of Playwright specific Error logs that is thrown
 * as part of the custom error message/stack
 */
export declare function findPWLogsIndexes(msgOrStack: string): [number, number];
export declare function rewriteErrorMessage(message: string, start: number): string;
export declare function rewriteErrorStack(stack: string, indexes: [number, number]): string;
export declare function formatError(error: Error | any): {
    message: string;
    name: string;
    stack: string;
};
/**
 * All the settings that are related to the Synthetics is stored
 * under this directory
 * Examples: Screenshots, Project setup
 */
export declare const SYNTHETICS_PATH: string;
/**
 * Synthetics cache path that is based on the process id to make sure
 * each process does not modify the caching layer used by other process
 * once we move to executing journeys in parallel
 */
export declare const CACHE_PATH: string;
export declare function getDurationInUs(duration: number): number;
export declare function megabitsToBytes(megabytes: number): number;
export declare const DEFAULT_THROTTLING_OPTIONS: ThrottlingOptions;
/**
 * Transforms the CLI throttling arguments in to format
 * expected by Chrome devtools protocol NetworkConditions
 */
export declare function getNetworkConditions(throttlingOpts: ThrottlingOptions): NetworkConditions;
export declare const THROTTLING_WARNING_MSG = "Throttling may not be active when the tests run - see\nhttps://github.com/elastic/synthetics/blob/main/docs/throttling.md for more details";
export declare function wrapFnWithLocation<A extends unknown[], R>(func: (location: Location, ...args: A) => R): (...args: A) => R;
export declare function safeNDJSONParse(data: string | string[]): any[];
export declare function write(message: string, live?: boolean): void;
export declare function progress(message: string): void;
export declare function liveProgress(promise: Promise<any>, message: string): Promise<any>;
export declare function apiProgress(message: string, live?: boolean): void;
export declare function error(message: string): void;
export declare function done(message: string): void;
export declare function warn(message: string): void;
export declare function removeTrailingSlash(url: string): string;
export declare function getMonitorManagementURL(url: any): string;
//# sourceMappingURL=helpers.d.ts.map