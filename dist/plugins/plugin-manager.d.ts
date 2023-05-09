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
import { PluginOutput, Driver } from '../common_types';
import { BrowserConsole, NetworkManager, PerformanceManager, Tracing, TraceOptions } from './';
import { Step } from '../dsl';
declare type PluginType = 'network' | 'trace' | 'performance' | 'browserconsole';
declare type Plugin = NetworkManager | Tracing | PerformanceManager | BrowserConsole;
declare type PluginOptions = TraceOptions;
export declare class PluginManager {
    private driver;
    protected plugins: Map<PluginType, Plugin>;
    PLUGIN_TYPES: Array<PluginType>;
    constructor(driver: Driver);
    register(type: PluginType, options: PluginOptions): Plugin;
    registerAll(options: PluginOptions): void;
    unregisterAll(): void;
    stop(type: PluginType): Promise<void | import("../common_types").NetworkInfo[] | import("../common_types").BrowserMessage[] | Partial<PluginOutput>>;
    start(type: PluginType): Promise<Plugin>;
    get(type: PluginType): Plugin;
    onStep(step: Step): void;
    output(): Promise<PluginOutput>;
}
export {};
//# sourceMappingURL=plugin-manager.d.ts.map