"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const promises_1 = require("fs/promises");
const reporters_1 = require("../reporters");
const helpers_1 = require("../helpers");
const gatherer_1 = require("./gatherer");
const logger_1 = require("./logger");
const monitor_1 = require("../dsl/monitor");
class Runner {
    #active = false;
    #reporter;
    #currentJourney = null;
    journeys = [];
    hooks = { beforeAll: [], afterAll: [] };
    hookError;
    monitor;
    static screenshotPath = (0, path_1.join)(helpers_1.CACHE_PATH, 'screenshots');
    static async createContext(options) {
        const driver = await gatherer_1.Gatherer.setupDriver(options);
        /**
         * Do not include browser launch/context creation duration
         * as part of journey duration
         */
        const start = (0, helpers_1.monotonicTimeInSeconds)();
        const pluginManager = await gatherer_1.Gatherer.beginRecording(driver, options);
        /**
         * For each journey we create the screenshots folder for
         * caching all screenshots and clear them at end of each journey
         */
        await (0, promises_1.mkdir)(this.screenshotPath, { recursive: true });
        return {
            start,
            params: options.params,
            driver,
            pluginManager,
        };
    }
    async captureScreenshot(page, step) {
        const buffer = await page
            .screenshot({
            type: 'jpeg',
            quality: 80,
            timeout: 5000,
        })
            .catch(() => { });
        /**
         * Write the screenshot image buffer with additional details (step
         * information) which could be extracted at the end of
         * each journey without impacting the step timing information
         */
        if (buffer) {
            const fileName = `${(0, helpers_1.generateUniqueId)()}.json`;
            const screenshot = {
                step,
                timestamp: (0, helpers_1.getTimestamp)(),
                data: buffer.toString('base64'),
            };
            await (0, promises_1.writeFile)((0, path_1.join)(Runner.screenshotPath, fileName), JSON.stringify(screenshot));
            (0, logger_1.log)(`Runner: captured screenshot for (${step.name})`);
        }
    }
    get currentJourney() {
        return this.#currentJourney;
    }
    addHook(type, callback) {
        this.hooks[type].push(callback);
    }
    updateMonitor(config) {
        if (!this.monitor) {
            this.monitor = new monitor_1.Monitor(config);
            return;
        }
        this.monitor.update(config);
    }
    addJourney(journey) {
        this.journeys.push(journey);
        this.#currentJourney = journey;
    }
    setReporter(options) {
        /**
         * Set up the corresponding reporter and fallback
         * to default reporter if not provided
         */
        const { reporter, outfd } = options;
        const Reporter = typeof reporter === 'function'
            ? reporter
            : reporters_1.reporters[reporter] || reporters_1.reporters['default'];
        this.#reporter = new Reporter({ fd: outfd });
    }
    async runBeforeAllHook(args) {
        (0, logger_1.log)(`Runner: beforeAll hooks`);
        await (0, helpers_1.runParallel)(this.hooks.beforeAll, args);
    }
    async runAfterAllHook(args) {
        (0, logger_1.log)(`Runner: afterAll hooks`);
        await (0, helpers_1.runParallel)(this.hooks.afterAll, args);
    }
    async runBeforeHook(journey, args) {
        (0, logger_1.log)(`Runner: before hooks for (${journey.name})`);
        await (0, helpers_1.runParallel)(journey.hooks.before, args);
    }
    async runAfterHook(journey, args) {
        (0, logger_1.log)(`Runner: after hooks for (${journey.name})`);
        await (0, helpers_1.runParallel)(journey.hooks.after, args);
    }
    async runStep(step, context, options) {
        const data = {
            status: 'succeeded',
        };
        (0, logger_1.log)(`Runner: start step (${step.name})`);
        const { metrics, screenshots, filmstrips, trace } = options;
        const { driver, pluginManager } = context;
        /**
         * URL needs to be the first navigation request of any step
         * Listening for request solves the case where `about:blank` would be
         * reported for failed navigations
         */
        const captureUrl = req => {
            if (!data.url && req.isNavigationRequest()) {
                data.url = req.url();
            }
            driver.context.off('request', captureUrl);
        };
        driver.context.on('request', captureUrl);
        const traceEnabled = trace || filmstrips;
        try {
            /**
             * Set up plugin manager context and also register
             * step level plugins
             */
            pluginManager.onStep(step);
            traceEnabled && (await pluginManager.start('trace'));
            // call the step definition
            await step.callback();
        }
        catch (error) {
            data.status = 'failed';
            data.error = error;
        }
        finally {
            /**
             * Collect all step level metrics and trace events
             */
            if (metrics) {
                data.pagemetrics = await pluginManager.get('performance').getMetrics();
            }
            if (traceEnabled) {
                const traceOutput = await pluginManager.stop('trace');
                Object.assign(data, traceOutput);
            }
            /**
             * Capture screenshot for the newly created pages
             * via popup or new windows/tabs
             *
             * Last open page will get us the correct screenshot
             */
            const pages = driver.context.pages();
            const page = pages[pages.length - 1];
            if (page) {
                data.url ??= page.url();
                if (screenshots && screenshots !== 'off') {
                    await this.captureScreenshot(page, step);
                }
            }
        }
        (0, logger_1.log)(`Runner: end step (${step.name})`);
        return data;
    }
    async runSteps(journey, context, options) {
        const results = [];
        let skipStep = false;
        for (const step of journey.steps) {
            const start = (0, helpers_1.monotonicTimeInSeconds)();
            this.#reporter?.onStepStart?.(journey, step);
            let data = { status: 'succeeded' };
            if (skipStep) {
                data.status = 'skipped';
            }
            else {
                data = await this.runStep(step, context, options);
                /**
                 * skip next steps if the previous step returns error
                 */
                if (data.error)
                    skipStep = true;
            }
            this.#reporter?.onStepEnd?.(journey, step, {
                start,
                end: (0, helpers_1.monotonicTimeInSeconds)(),
                ...data,
            });
            if (options.pauseOnError && data.error) {
                await new Promise(r => process.stdin.on('data', r));
            }
            results.push(data);
        }
        return results;
    }
    registerJourney(journey, context) {
        this.#currentJourney = journey;
        const timestamp = (0, helpers_1.getTimestamp)();
        const { params } = context;
        this.#reporter?.onJourneyStart?.(journey, {
            timestamp,
            params,
        });
        /**
         * Exeucute the journey callback which would
         * register the steps for the current journey
         */
        journey.callback({ ...context.driver, params });
    }
    async endJourney(journey, result, options) {
        const end = (0, helpers_1.monotonicTimeInSeconds)();
        const { pluginManager, start, status, error } = result;
        const pluginOutput = await pluginManager.output();
        await this.#reporter?.onJourneyEnd?.(journey, {
            status,
            error,
            start,
            end,
            timestamp: (0, helpers_1.getTimestamp)(),
            options,
            ...pluginOutput,
            browserconsole: status == 'failed' ? pluginOutput.browserconsole : [],
        });
        // clear screenshots cache after each journey
        await (0, promises_1.rm)(Runner.screenshotPath, { recursive: true, force: true });
    }
    /**
     * Simulate a journey run to capture errors in the beforeAll hook
     */
    async runFakeJourney(journey, options) {
        const start = (0, helpers_1.monotonicTimeInSeconds)();
        this.#reporter.onJourneyStart?.(journey, {
            timestamp: (0, helpers_1.getTimestamp)(),
            params: options.params,
        });
        const result = {
            status: 'failed',
            error: this.hookError,
        };
        await this.#reporter.onJourneyEnd?.(journey, {
            timestamp: (0, helpers_1.getTimestamp)(),
            start,
            options,
            end: (0, helpers_1.monotonicTimeInSeconds)(),
            ...result,
        });
        return result;
    }
    async runJourney(journey, options) {
        const result = { status: 'succeeded' };
        const context = await Runner.createContext(options);
        (0, logger_1.log)(`Runner: start journey (${journey.name})`);
        try {
            this.registerJourney(journey, context);
            const hookArgs = {
                env: options.environment,
                params: options.params,
            };
            await this.runBeforeHook(journey, hookArgs);
            const stepResults = await this.runSteps(journey, context, options);
            /**
             * Mark journey as failed if any intermediate step fails
             */
            for (const stepResult of stepResults) {
                if (stepResult.status === 'failed') {
                    result.status = stepResult.status;
                    result.error = stepResult.error;
                }
            }
            await this.runAfterHook(journey, hookArgs);
        }
        catch (e) {
            result.status = 'failed';
            result.error = e;
        }
        finally {
            await this.endJourney(journey, { ...context, ...result }, options);
            await gatherer_1.Gatherer.dispose(context.driver);
        }
        (0, logger_1.log)(`Runner: end journey (${journey.name})`);
        return result;
    }
    async init(options) {
        this.setReporter(options);
        this.#reporter.onStart?.({
            numJourneys: this.journeys.length,
            networkConditions: options.networkConditions,
        });
        /**
         * Set up the directory for caching screenshots
         */
        await (0, promises_1.mkdir)(helpers_1.CACHE_PATH, { recursive: true });
    }
    buildMonitors(options) {
        /**
         * Update the global monitor configuration required for
         * setting defaults
         */
        this.updateMonitor({
            throttling: options.throttling,
            schedule: options.schedule,
            locations: options.locations,
            privateLocations: options.privateLocations,
            params: options.params,
            playwrightOptions: options.playwrightOptions,
        });
        const { match, tags } = options;
        const monitors = [];
        for (const journey of this.journeys) {
            if (!journey.isMatch(match, tags)) {
                continue;
            }
            this.#currentJourney = journey;
            /**
             * Execute dummy callback to get all monitor specific
             * configurations for the current journey
             */
            journey.callback({ params: options.params });
            journey.monitor.update(this.monitor?.config);
            journey.monitor.validate();
            monitors.push(journey.monitor);
        }
        return monitors;
    }
    async run(options) {
        const result = {};
        if (this.#active) {
            return result;
        }
        this.#active = true;
        (0, logger_1.log)(`Runner: run ${this.journeys.length} journeys`);
        this.init(options);
        await this.runBeforeAllHook({
            env: options.environment,
            params: options.params,
        }).catch(e => (this.hookError = e));
        const { dryRun, match, tags } = options;
        for (const journey of this.journeys) {
            /**
             * Used by heartbeat to gather all registered journeys
             */
            if (dryRun) {
                this.#reporter.onJourneyRegister?.(journey);
                continue;
            }
            if (!journey.isMatch(match, tags)) {
                continue;
            }
            const journeyResult = this.hookError
                ? await this.runFakeJourney(journey, options)
                : await this.runJourney(journey, options);
            result[journey.name] = journeyResult;
        }
        await gatherer_1.Gatherer.stop();
        await this.runAfterAllHook({
            env: options.environment,
            params: options.params,
        });
        await this.reset();
        return result;
    }
    async reset() {
        this.#currentJourney = null;
        this.journeys = [];
        this.#active = false;
        /**
         * Clear all cache data stored for post processing by
         * the current synthetic agent run
         */
        await (0, promises_1.rm)(helpers_1.CACHE_PATH, { recursive: true, force: true });
        await this.#reporter?.onEnd?.();
    }
}
exports.default = Runner;
//# sourceMappingURL=runner.js.map