"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warnIfThrottled = exports.pushLegacy = exports.catchIncorrectSettings = exports.validateSettings = exports.loadSettings = exports.formatDuplicateError = exports.push = void 0;
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
const semver_1 = __importDefault(require("semver"));
const promises_1 = require("fs/promises");
const enquirer_1 = require("enquirer");
const colors_1 = require("kleur/colors");
const monitor_1 = require("./monitor");
const monitor_2 = require("../dsl/monitor");
const helpers_1 = require("../helpers");
const config_1 = require("../config");
const kibana_api_1 = require("./kibana_api");
const utils_1 = require("./utils");
async function push(monitors, options) {
    const duplicates = trackDuplicates(monitors);
    if (duplicates.size > 0) {
        throw (0, helpers_1.error)(formatDuplicateError(duplicates));
    }
    (0, helpers_1.progress)(`Pushing monitors for project: ${options.id}`);
    const stackVersion = await (0, kibana_api_1.getVersion)(options);
    const isV2 = semver_1.default.satisfies(stackVersion, '>=8.6.0');
    if (!isV2) {
        return await pushLegacy(monitors, options, stackVersion);
    }
    const local = (0, monitor_1.getLocalMonitors)(monitors);
    const { monitors: remote } = await (0, kibana_api_1.bulkGetMonitors)(options);
    const { newIDs, changedIDs, removedIDs, unchangedIDs } = (0, monitor_1.diffMonitors)(local, remote);
    (0, utils_1.logDiff)(newIDs, changedIDs, removedIDs, unchangedIDs);
    const updatedMonitors = new Set([...changedIDs, ...newIDs]);
    if (updatedMonitors.size > 0) {
        const toBundle = monitors.filter(m => updatedMonitors.has(m.config.id));
        (0, helpers_1.progress)(`bundling ${toBundle.length} monitors`);
        const schemas = await (0, monitor_1.buildMonitorSchema)(toBundle, true);
        const chunks = (0, utils_1.getChunks)(schemas, kibana_api_1.CHUNK_SIZE);
        for (const chunk of chunks) {
            await (0, helpers_1.liveProgress)((0, kibana_api_1.bulkPutMonitors)(options, chunk), `creating or updating ${chunk.length} monitors`);
        }
    }
    if (removedIDs.size > 0) {
        if (updatedMonitors.size === 0 && unchangedIDs.size === 0) {
            await promptConfirmDeleteAll(options);
        }
        const chunks = (0, utils_1.getChunks)(Array.from(removedIDs), kibana_api_1.CHUNK_SIZE);
        for (const chunk of chunks) {
            await (0, helpers_1.liveProgress)((0, kibana_api_1.bulkDeleteMonitors)(options, chunk), `deleting ${chunk.length} monitors`);
        }
    }
    (0, helpers_1.done)(`Pushed: ${(0, colors_1.grey)((0, helpers_1.getMonitorManagementURL)(options.url))}`);
}
exports.push = push;
async function promptConfirmDeleteAll(options) {
    (0, helpers_1.write)('');
    const { deleteAll } = await (0, enquirer_1.prompt)({
        type: 'confirm',
        skip() {
            if (options.yes) {
                this.initial = process.env.TEST_OVERRIDE ?? true;
                return true;
            }
            return false;
        },
        name: 'deleteAll',
        message: `Pushing without any monitors will delete all monitors associated with the project.\n Do you want to continue?`,
        initial: false,
    });
    if (!deleteAll) {
        throw (0, helpers_1.warn)('Push command Aborted');
    }
}
function trackDuplicates(monitors) {
    const monitorMap = new Map();
    const duplicates = new Set();
    for (const monitor of monitors) {
        const id = monitor.config.id;
        if (monitorMap.has(id)) {
            duplicates.add(monitorMap.get(id));
            duplicates.add(monitor);
        }
        monitorMap.set(id, monitor);
    }
    return duplicates;
}
function formatDuplicateError(monitors) {
    let outer = (0, colors_1.bold)(`Aborted: Duplicate monitors found\n`);
    let inner = '';
    for (const monitor of monitors) {
        const { config, source } = monitor;
        inner += `* ${config.id} - ${source.file}:${source.line}:${source.column}\n`;
    }
    outer += (0, helpers_1.indent)(inner);
    return outer;
}
exports.formatDuplicateError = formatDuplicateError;
const INSTALLATION_HELP = `Run 'npx @elastic/synthetics init' to create project with default settings.`;
async function loadSettings() {
    try {
        const config = await (0, config_1.readConfig)(process.env['NODE_ENV'] || 'development');
        // Missing config file, fake throw to capture as missing file
        if (Object.keys(config).length === 0) {
            throw '';
        }
        return config.project || {};
    }
    catch (e) {
        throw (0, helpers_1.error)(`Aborted (missing synthetics config file), Project not set up correctly.

${INSTALLATION_HELP}`);
    }
}
exports.loadSettings = loadSettings;
function validateSettings(opts) {
    const INVALID = 'Aborted. Invalid synthetics project settings.';
    let reason = '';
    if (!opts.id) {
        reason = `Set project id via
  - CLI '--id <id>'
  - Config file 'project.id' field`;
    }
    else if (!opts.locations && !opts.privateLocations) {
        reason = `Set default location for all monitors via
  - CLI '--locations <values...> or --privateLocations <values...>'
  - Config file 'monitors.locations' | 'monitors.privateLocations' field`;
    }
    else if (!opts.schedule) {
        reason = `Set default schedule in minutes for all monitors via
  - CLI '--schedule <mins>'
  - Config file 'monitors.schedule' field`;
    }
    else if (opts.schedule && !monitor_2.ALLOWED_SCHEDULES.includes(opts.schedule)) {
        reason = `Set default schedule(${opts.schedule}) to one of the allowed values - ${monitor_2.ALLOWED_SCHEDULES.join(',')}`;
    }
    if (!reason)
        return;
    throw (0, helpers_1.error)(`${INVALID}

${reason}

${INSTALLATION_HELP}`);
}
exports.validateSettings = validateSettings;
async function overrideSettings(oldValue, newValue) {
    const cwd = process.cwd();
    const configPath = await (0, config_1.findSyntheticsConfig)(cwd, cwd);
    if (!configPath) {
        throw (0, helpers_1.warn)(`Unable to find synthetics config file: ${configPath}`);
    }
    const config = await (0, promises_1.readFile)(configPath, 'utf-8');
    const updatedConfig = config.replace(`id: '${oldValue}'`, `id: '${newValue}'`);
    await (0, promises_1.writeFile)(configPath, updatedConfig, 'utf-8');
}
async function catchIncorrectSettings(settings, options) {
    let override = !settings.id;
    if (settings.id && settings.id !== options.id) {
        // Add an extra line to make it easier to read the prompt
        (0, helpers_1.write)('');
        ({ override } = await (0, enquirer_1.prompt)({
            type: 'confirm',
            name: 'override',
            skip() {
                if (options.yes) {
                    this.initial = process.env.TEST_OVERRIDE ?? true;
                    return true;
                }
                return false;
            },
            message: `Monitors were pushed under the '${settings.id}' project. Are you sure you want to push them under the new '${options.id}' (note that this will duplicate the monitors, the old ones being orphaned)`,
            initial: false,
        }));
        if (!override) {
            throw (0, helpers_1.warn)('Push command Aborted');
        }
    }
    if (override) {
        await overrideSettings(settings.id, options.id);
    }
}
exports.catchIncorrectSettings = catchIncorrectSettings;
async function pushLegacy(monitors, options, version) {
    const noLightWeightSupport = semver_1.default.satisfies(version, '<8.5.0');
    if (noLightWeightSupport &&
        monitors.some(monitor => monitor.type !== 'browser')) {
        throw (0, helpers_1.error)(`Aborted: Lightweight monitors are not supported in ${version}. Please upgrade to 8.5.0 or above.`);
    }
    let schemas = [];
    if (monitors.length > 0) {
        (0, helpers_1.progress)(`bundling ${monitors.length} monitors`);
        schemas = await (0, monitor_1.buildMonitorSchema)(monitors, false);
        const chunks = (0, utils_1.getChunks)(schemas, 10);
        for (const chunk of chunks) {
            await (0, helpers_1.liveProgress)((0, kibana_api_1.createMonitorsLegacy)({ schemas: chunk, keepStale: true, options }), `creating or updating ${chunk.length} monitors`);
        }
    }
    else {
        await promptConfirmDeleteAll(options);
    }
    await (0, helpers_1.liveProgress)((0, kibana_api_1.createMonitorsLegacy)({ schemas, keepStale: false, options }), `deleting all stale monitors`);
    (0, helpers_1.done)(`Pushed: ${(0, colors_1.grey)((0, helpers_1.getMonitorManagementURL)(options.url))}`);
}
exports.pushLegacy = pushLegacy;
// prints warning if any of the monitors has throttling settings enabled during push
function warnIfThrottled(monitors) {
    const throttled = monitors.some(monitor => monitor.config.throttling != null);
    if (throttled) {
        (0, helpers_1.warn)(helpers_1.THROTTLING_WARNING_MSG);
    }
}
exports.warnIfThrottled = warnIfThrottled;
//# sourceMappingURL=index.js.map