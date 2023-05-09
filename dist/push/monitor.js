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
exports.parseSchedule = exports.parseAlertConfig = exports.buildMonitorFromYaml = exports.createLightweightMonitors = exports.buildMonitorSchema = exports.getLocalMonitors = exports.diffMonitors = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const yaml_1 = require("yaml");
const colors_1 = require("kleur/colors");
const bundler_1 = require("./bundler");
const helpers_1 = require("../helpers");
const public_locations_1 = require("../locations/public-locations");
const monitor_1 = require("../dsl/monitor");
function translateLocation(locations) {
    if (!locations)
        return [];
    return locations.map(loc => public_locations_1.LocationsMap[loc] || loc).filter(Boolean);
}
class RemoteDiffResult {
    // The set of monitor IDs that have been added
    newIDs = new Set();
    // Monitor IDs that are different locally than remotely
    changedIDs = new Set();
    // Monitor IDs that are no longer present locally
    removedIDs = new Set();
    // Monitor IDs that are identical on the remote server
    unchangedIDs = new Set();
}
function diffMonitors(local, remote) {
    const result = new RemoteDiffResult();
    const localMonitorsIDToHash = new Map();
    for (const hashID of local) {
        localMonitorsIDToHash.set(hashID.journey_id, hashID.hash);
    }
    const remoteMonitorsIDToHash = new Map();
    for (const hashID of remote) {
        remoteMonitorsIDToHash.set(hashID.journey_id, hashID.hash);
    }
    // Compare local to remote
    for (const [localID, localHash] of localMonitorsIDToHash) {
        // Hash is reset to '' when a monitor is edited on the UI
        if (!remoteMonitorsIDToHash.has(localID)) {
            result.newIDs.add(localID);
        }
        else {
            const remoteHash = remoteMonitorsIDToHash.get(localID);
            if (remoteHash != localHash) {
                result.changedIDs.add(localID);
            }
            else if (remoteHash === localHash) {
                result.unchangedIDs.add(localID);
            }
        }
        // We no longer need to process this ID, removing it here
        // reduces the numbers considered in the next phase
        remoteMonitorsIDToHash.delete(localID);
    }
    for (const [id] of remoteMonitorsIDToHash) {
        result.removedIDs.add(id);
    }
    return result;
}
exports.diffMonitors = diffMonitors;
function getLocalMonitors(monitors) {
    const data = [];
    for (const monitor of monitors) {
        data.push({
            journey_id: monitor.config.id,
            hash: monitor.hash(),
        });
    }
    return data;
}
exports.getLocalMonitors = getLocalMonitors;
async function buildMonitorSchema(monitors, isV2) {
    /**
     * Set up the bundle artifacts path which can be used to
     * create the bundles required for uploading journeys
     */
    const bundlePath = (0, path_1.join)(helpers_1.SYNTHETICS_PATH, 'bundles');
    await (0, promises_1.mkdir)(bundlePath, { recursive: true });
    const bundler = new bundler_1.Bundler();
    const schemas = [];
    for (const monitor of monitors) {
        const { source, config, filter, type } = monitor;
        const schema = {
            ...config,
            locations: translateLocation(config.locations),
        };
        if (isV2) {
            schema.hash = monitor.hash();
        }
        if (type === 'browser') {
            const outPath = (0, path_1.join)(bundlePath, config.name + '.zip');
            const content = await bundler.build(source.file, outPath);
            Object.assign(schema, { content, filter });
        }
        schemas.push(schema);
    }
    await (0, promises_1.rm)(bundlePath, { recursive: true });
    return schemas;
}
exports.buildMonitorSchema = buildMonitorSchema;
async function createLightweightMonitors(workDir, options) {
    const lwFiles = new Set();
    const ignore = /(node_modules|.github)/;
    await (0, helpers_1.totalist)(workDir, (rel, abs) => {
        if (!ignore.test(rel) && /.(yml|yaml)$/.test(rel)) {
            lwFiles.add(abs);
        }
    });
    let warnOnce = false;
    const monitors = [];
    for (const file of lwFiles.values()) {
        const content = await (0, promises_1.readFile)(file, 'utf-8');
        const lineCounter = new yaml_1.LineCounter();
        const parsedDoc = (0, yaml_1.parseDocument)(content, {
            lineCounter,
            keepSourceTokens: true,
        });
        // Skip other yml files that are not relevant
        const monitorSeq = parsedDoc.get('heartbeat.monitors');
        if (!monitorSeq) {
            continue;
        }
        // Warn users about schedule that are less than 60 seconds
        if (!warnOnce) {
            (0, helpers_1.warn)('Lightweight monitor schedules will be adjusted to their nearest frequency supported by our synthetics infrastructure.');
            warnOnce = true;
        }
        for (const monNode of monitorSeq.items) {
            // Skip browser monitors and disabled monitors from pushing
            if (monNode.get('type') === 'browser' ||
                monNode.get('enabled') === false) {
                continue;
            }
            const config = monNode.toJSON();
            const { line, col } = lineCounter.linePos(monNode.srcToken.offset);
            try {
                const mon = buildMonitorFromYaml(config, options);
                mon.setSource({ file, line, column: col });
                monitors.push(mon);
            }
            catch (e) {
                let outer = (0, colors_1.bold)(`Aborted: ${e}\n`);
                outer += (0, helpers_1.indent)(`* ${config.id || config.name} - ${file}:${line}:${col}\n`);
                throw (0, colors_1.red)(outer);
            }
        }
    }
    return monitors;
}
exports.createLightweightMonitors = createLightweightMonitors;
const REQUIRED_MONITOR_FIELDS = ['id', 'name'];
function buildMonitorFromYaml(config, options) {
    // Validate required fields
    for (const field of REQUIRED_MONITOR_FIELDS) {
        if (!config[field]) {
            throw `Monitor ${field} is required`;
        }
    }
    const schedule = config.schedule && parseSchedule(String(config.schedule));
    const privateLocations = config['private_locations'] || options.privateLocations;
    delete config['private_locations'];
    const alertConfig = (0, exports.parseAlertConfig)(config);
    return new monitor_1.Monitor({
        locations: options.locations,
        ...config,
        privateLocations,
        schedule: schedule || options.schedule,
        alert: alertConfig,
    });
}
exports.buildMonitorFromYaml = buildMonitorFromYaml;
const parseAlertConfig = (config) => {
    if (config['alert.status.enabled'] !== undefined) {
        const value = config['alert.status.enabled'];
        delete config['alert.status.enabled'];
        return {
            status: {
                enabled: value,
            },
        };
    }
    return config.alert;
};
exports.parseAlertConfig = parseAlertConfig;
function parseSchedule(schedule) {
    const EVERY_SYNTAX = '@every';
    if (!(schedule + '').startsWith(EVERY_SYNTAX)) {
        throw `Monitor schedule format(${schedule}) not supported: use '@every' syntax instead`;
    }
    const duration = schedule.substring(EVERY_SYNTAX.length + 1);
    // split between non-digit (\D) and a digit (\d)
    const durations = duration.split(/(?<=\D)(?=\d)/g);
    let minutes = 0;
    for (const dur of durations) {
        // split between a digit and non-digit
        const [value, format] = dur.split(/(?<=\d)(?=\D)/g);
        // Calculate based on the duration symbol
        const scheduleValue = parseInt(value, 10);
        switch (format) {
            case 's':
                minutes += Math.round(scheduleValue / 60);
                break;
            case 'm':
                minutes += scheduleValue;
                break;
            case 'h':
                minutes += scheduleValue * 60;
                break;
            case 'd':
                minutes += scheduleValue * 24 * 60;
                break;
        }
    }
    return nearestSchedule(minutes);
}
exports.parseSchedule = parseSchedule;
// Find the nearest schedule that is supported by the platform
// from the parsed schedule value
function nearestSchedule(minutes) {
    let nearest = monitor_1.ALLOWED_SCHEDULES[0];
    let prev = Math.abs(nearest - minutes);
    for (let i = 1; i < monitor_1.ALLOWED_SCHEDULES.length; i++) {
        const curr = Math.abs(monitor_1.ALLOWED_SCHEDULES[i] - minutes);
        if (curr <= prev) {
            nearest = monitor_1.ALLOWED_SCHEDULES[i];
            prev = curr;
        }
    }
    return nearest;
}
//# sourceMappingURL=monitor.js.map