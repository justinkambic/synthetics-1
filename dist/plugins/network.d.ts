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
import { NetworkInfo, Driver } from '../common_types';
import { Step } from '../dsl';
/**
 * Used as a key in each Network Request to identify the
 * associated request across distinct lifecycle events
 */
export declare const NETWORK_ENTRY_SUMBOL: unique symbol;
export declare class NetworkManager {
    private driver;
    private _browser;
    private _barrierPromises;
    results: Array<NetworkInfo>;
    _currentStep: Partial<Step>;
    constructor(driver: Driver);
    /**
     * Adds a protection barrier aganist all asynchronous extract operations from
     * request/response object that are happening during page lifecycle, If the
     * page is closed during the extraction, the barrier enforces those operations
     * to not result in exception
     */
    private _addBarrier;
    start(): Promise<void>;
    private _findNetworkEntry;
    private _onRequest;
    private _onResponse;
    private _onRequestCompleted;
    /**
     * Calculates the total time for the network request based on the ResourceTiming
     * data from Playwright. Fallbacks to the event timings if ResourceTiming data
     * is not available.
     */
    private _calcTotalTime;
    stop(): Promise<NetworkInfo[]>;
}
//# sourceMappingURL=network.d.ts.map