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
import { Journey, JourneyCallback, JourneyOptions } from '../dsl';
import Runner from './runner';
import { VoidCallback, HooksCallback } from '../common_types';
import { MonitorConfig } from '../dsl/monitor';
export declare const runner: Runner;
export declare const journey: (options: string | JourneyOptions, callback: JourneyCallback) => Journey;
export declare const step: (name: string, callback: VoidCallback) => import("../dsl").Step;
export declare const monitor: {
    use: (config: MonitorConfig) => void;
};
export declare const beforeAll: (callback: HooksCallback) => void;
export declare const afterAll: (callback: HooksCallback) => void;
export declare const before: (callback: HooksCallback) => void;
export declare const after: (callback: HooksCallback) => void;
//# sourceMappingURL=index.d.ts.map