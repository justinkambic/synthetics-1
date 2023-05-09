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
import type { CliArgs, RunOptions } from './common_types';
export declare function normalizeOptions(cliArgs: CliArgs): RunOptions;
/**
 * Parses the throttling CLI settings with `{download: 5, upload: 3, latency:
 * 20}` format
 *
 * Since throttling is disabled for now, we warn the users if throttling/nothrottling
 * flag is passed to the CLI
 */
export declare function parseThrottling(): void;
export declare function getCommonCommandOpts(): {
    params: import("commander").Option;
    playwrightOpts: import("commander").Option;
    pattern: import("commander").Option;
    tags: import("commander").Option;
    match: import("commander").Option;
};
//# sourceMappingURL=options.d.ts.map