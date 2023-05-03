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
import { ChromiumBrowser, BrowserContext } from 'playwright-chromium';
import { PluginManager } from '../plugins';
import { Driver, NetworkConditions, RunOptions } from '../common_types';
/**
 * Purpose of the Gatherer is to set up the necessary browser driver
 * related capabilities for the runner to run all journeys
 */
export declare class Gatherer {
    static browser: ChromiumBrowser;
    static setupDriver(options: RunOptions): Promise<Driver>;
    static getUserAgent(userAgent?: string): Promise<string>;
    static setNetworkConditions(context: BrowserContext, networkConditions: NetworkConditions): void;
    static closeBrowser(): Promise<void>;
    /**
     * Starts recording all events related to the v8 devtools protocol
     * https://chromedevtools.github.io/devtools-protocol/v8/
     */
    static beginRecording(driver: Driver, options: RunOptions): Promise<PluginManager>;
    static dispose(driver: Driver): Promise<void>;
    static stop(): Promise<void>;
}
//# sourceMappingURL=gatherer.d.ts.map