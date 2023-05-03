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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonCommandOpts = exports.parseThrottling = exports.normalizeOptions = void 0;
const deepmerge_1 = __importDefault(require("deepmerge"));
const commander_1 = require("commander");
const config_1 = require("./config");
const helpers_1 = require("./helpers");
function normalizeOptions(cliArgs) {
    const options = {
        ...cliArgs,
        environment: process.env['NODE_ENV'] || 'development',
    };
    /**
     * Group all events that can be consumed by heartbeat and
     * eventually by the Synthetics UI.
     */
    if (cliArgs.richEvents) {
        options.reporter = cliArgs.reporter ?? 'json';
        options.ssblocks = true;
        options.network = true;
        options.trace = true;
        options.quietExitCode = true;
    }
    if (cliArgs.capability) {
        const supportedCapabilities = [
            'trace',
            'network',
            'filmstrips',
            'metrics',
            'ssblocks',
        ];
        /**
         * trace - record chrome trace events(LCP, FCP, CLS, etc.) for all journeys
         * network - capture network information for all journeys
         * filmstrips - record detailed filmstrips for all journeys
         * metrics - capture performance metrics (DOM Nodes, Heap size, etc.) for each step
         * ssblocks - Dedupes the screenshots in to blocks to save storage space
         */
        for (const flag of cliArgs.capability) {
            if (supportedCapabilities.includes(flag)) {
                options[flag] = true;
            }
            else {
                console.warn(`Missing capability "${flag}", current supported capabilities are ${supportedCapabilities.join(', ')}`);
            }
        }
    }
    /**
     * Validate and read synthetics config file
     * based on the environment
     */
    const config = cliArgs.config || !cliArgs.inline
        ? (0, config_1.readConfig)(options.environment, cliArgs.config)
        : {};
    /**
     * Order of preference for options that are used while running are
     * 1. Local options configured via Runner API
     * 2. CLI flags
     * 3. Configuration file
     */
    options.params = Object.freeze((0, deepmerge_1.default)(config.params, cliArgs.params || {}));
    /**
     * Merge playwright options from CLI and Synthetics config
     * and prefer individual options over other option
     */
    const playwrightOpts = (0, deepmerge_1.default)(config.playwrightOptions, cliArgs.playwrightOptions || {});
    options.playwrightOptions = {
        ...playwrightOpts,
        chromiumSandbox: cliArgs.sandbox ?? playwrightOpts?.chromiumSandbox,
        ignoreHTTPSErrors: cliArgs.ignoreHttpsErrors ?? playwrightOpts?.ignoreHTTPSErrors,
    };
    /**
     * Get the default monitor config from synthetics.config.ts file
     */
    const monitor = config.monitor;
    if (cliArgs.throttling) {
        const throttleConfig = deepmerge_1.default.all([
            helpers_1.DEFAULT_THROTTLING_OPTIONS,
            toObject(monitor?.throttling),
            toObject(cliArgs.throttling),
        ]);
        if (monitor?.throttling !== false) {
            options.throttling = throttleConfig;
            options.networkConditions = (0, helpers_1.getNetworkConditions)(throttleConfig);
        }
        else {
            /**
             * If the throttling is disabled via Project monitor config, use it a source
             * of truth and disable it for pushing those monitors.
             */
            options.throttling = false;
        }
    }
    else {
        /**
         * Do not apply throttling when `--no-throttling` flag is passed
         */
        options.throttling = false;
    }
    options.schedule = cliArgs.schedule ?? monitor?.schedule;
    options.locations = cliArgs.locations ?? monitor?.locations;
    options.privateLocations =
        cliArgs.privateLocations ?? monitor?.privateLocations;
    return options;
}
exports.normalizeOptions = normalizeOptions;
function toObject(value) {
    const defaulVal = {};
    if (typeof value === 'boolean') {
        return defaulVal;
    }
    return value || defaulVal;
}
/**
 * Parses the throttling CLI settings and also
 * adapts to the format to keep the backwards compatability
 * - Accepts old format `<5d/3u/20l>`
 * - Processess new format otherwise `{download: 5, upload: 3, latency: 20}`
 */
function parseThrottling(value, prev) {
    const THROTTLING_REGEX = /([0-9]{1,}u)|([0-9]{1,}d)|([0-9]{1,}l)/gm;
    if (THROTTLING_REGEX.test(value)) {
        const throttling = {};
        const conditions = value.split('/');
        conditions.forEach(condition => {
            const setting = condition.slice(0, condition.length - 1);
            const token = condition.slice(-1);
            switch (token) {
                case 'd':
                    throttling.download = Number(setting);
                    break;
                case 'u':
                    throttling.upload = Number(setting);
                    break;
                case 'l':
                    throttling.latency = Number(setting);
                    break;
            }
        });
        return throttling;
    }
    return JSON.parse(value || prev);
}
exports.parseThrottling = parseThrottling;
function getCommonCommandOpts() {
    const params = (0, commander_1.createOption)('-p, --params <jsonstring>', 'JSON object that gets injected to all journeys');
    params.argParser(JSON.parse);
    const playwrightOpts = (0, commander_1.createOption)('--playwright-options <jsonstring>', 'JSON object to pass in custom Playwright options for the agent. Options passed will be merged with Playwright options defined in your synthetics.config.js file.');
    playwrightOpts.argParser(JSON.parse);
    const pattern = (0, commander_1.createOption)('--pattern <pattern>', 'RegExp pattern to look for journey files that are different from the default (ex: /*.journey.(ts|js)$/)');
    const tags = (0, commander_1.createOption)('--tags <name...>', 'run only journeys with a tag that matches the glob');
    const match = (0, commander_1.createOption)('--match <name>', 'run only journeys with a name or tag that matches the glob');
    return {
        params,
        playwrightOpts,
        pattern,
        tags,
        match,
    };
}
exports.getCommonCommandOpts = getCommonCommandOpts;
//# sourceMappingURL=options.js.map