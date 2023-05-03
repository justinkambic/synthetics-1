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
import { Journey } from '../dsl/journey';
import { Step } from '../dsl/step';
import { HooksCallback, Params, HooksArgs, Driver, RunOptions, JourneyResult, StepResult } from '../common_types';
import { PluginManager } from '../plugins';
import { Monitor, MonitorConfig } from '../dsl/monitor';
declare type HookType = 'beforeAll' | 'afterAll';
export declare type SuiteHooks = Record<HookType, Array<HooksCallback>>;
declare type JourneyContext = {
    params?: Params;
    start: number;
    driver: Driver;
    pluginManager: PluginManager;
};
declare type RunResult = Record<string, JourneyResult>;
export default class Runner {
    #private;
    journeys: Journey[];
    hooks: SuiteHooks;
    hookError: Error | undefined;
    monitor?: Monitor;
    static screenshotPath: string;
    static createContext(options: RunOptions): Promise<JourneyContext>;
    captureScreenshot(page: Driver['page'], step: Step): Promise<void>;
    get currentJourney(): Journey;
    addHook(type: HookType, callback: HooksCallback): void;
    updateMonitor(config: MonitorConfig): void;
    addJourney(journey: Journey): void;
    setReporter(options: RunOptions): void;
    runBeforeAllHook(args: HooksArgs): Promise<void>;
    runAfterAllHook(args: HooksArgs): Promise<void>;
    runBeforeHook(journey: Journey, args: HooksArgs): Promise<void>;
    runAfterHook(journey: Journey, args: HooksArgs): Promise<void>;
    runStep(step: Step, context: JourneyContext, options: RunOptions): Promise<StepResult>;
    runSteps(journey: Journey, context: JourneyContext, options: RunOptions): Promise<StepResult[]>;
    registerJourney(journey: Journey, context: JourneyContext): void;
    endJourney(journey: any, result: JourneyContext & JourneyResult, options: RunOptions): Promise<void>;
    /**
     * Simulate a journey run to capture errors in the beforeAll hook
     */
    runFakeJourney(journey: Journey, options: RunOptions): Promise<JourneyResult>;
    runJourney(journey: Journey, options: RunOptions): Promise<JourneyResult>;
    init(options: RunOptions): Promise<void>;
    buildMonitors(options: RunOptions): Monitor[];
    run(options: RunOptions): Promise<RunResult>;
    reset(): Promise<void>;
}
export {};
//# sourceMappingURL=runner.d.ts.map