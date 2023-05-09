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
exports.getMonitorManagementURL = exports.removeTrailingSlash = exports.warn = exports.done = exports.error = exports.apiProgress = exports.liveProgress = exports.progress = exports.write = exports.safeNDJSONParse = exports.wrapFnWithLocation = exports.THROTTLING_WARNING_MSG = exports.getNetworkConditions = exports.DEFAULT_THROTTLING_OPTIONS = exports.megabitsToBytes = exports.getDurationInUs = exports.CACHE_PATH = exports.SYNTHETICS_PATH = exports.formatError = exports.rewriteErrorStack = exports.rewriteErrorMessage = exports.findPWLogsIndexes = exports.totalist = exports.findPkgJsonByTraversing = exports.isFile = exports.isDirectory = exports.isDepInstalled = exports.runParallel = exports.now = exports.getTimestamp = exports.microSecsToSeconds = exports.monotonicTimeInSeconds = exports.generateTempPath = exports.generateUniqueId = exports.symbols = exports.indent = exports.noop = void 0;
const colors_1 = require("kleur/colors");
const os_1 = __importDefault(require("os"));
const path_1 = require("path");
const fs_1 = __importDefault(require("fs"));
const promises_1 = require("fs/promises");
const perf_hooks_1 = require("perf_hooks");
const source_map_support_1 = __importDefault(require("source-map-support"));
const SEPARATOR = '\n';
function noop() { }
exports.noop = noop;
function indent(lines, tab = '   ') {
    return lines.replace(/^/gm, tab);
}
exports.indent = indent;
/**
 *  Disable unicode symbols for windows, the underlying
 *  FS stream has a known issue in windows
 */
const NO_UTF8_SUPPORT = process.platform === 'win32';
exports.symbols = {
    warning: (0, colors_1.yellow)(NO_UTF8_SUPPORT ? '!' : '⚠'),
    skipped: (0, colors_1.cyan)('-'),
    progress: (0, colors_1.cyan)('>'),
    succeeded: (0, colors_1.green)(NO_UTF8_SUPPORT ? 'ok' : '✓'),
    failed: (0, colors_1.red)(NO_UTF8_SUPPORT ? 'x' : '✖'),
};
function generateUniqueId() {
    return `${Date.now() + Math.floor(Math.random() * 1e13)}`;
}
exports.generateUniqueId = generateUniqueId;
function generateTempPath() {
    return (0, path_1.join)(os_1.default.tmpdir(), `synthetics-${generateUniqueId()}`);
}
exports.generateTempPath = generateTempPath;
/**
 * Get Monotonically increasing time in seconds since
 * an arbitrary point in the past.
 *
 * We internally use the monotonically increasing clock timing
 * similar to the chrome devtools protocol network events for
 * journey,step start/end fields to make querying in the UI easier
 */
function monotonicTimeInSeconds() {
    const hrTime = process.hrtime(); // [seconds, nanoseconds]
    return hrTime[0] * 1 + hrTime[1] / 1e9;
}
exports.monotonicTimeInSeconds = monotonicTimeInSeconds;
/**
 * Converts the trace events timestamp field from microsecond
 * resolution to monotonic seconds timestamp similar to other event types (journey, step, etc)
 * Reference - https://github.com/samccone/chrome-trace-event/blob/d45bc8af3b5c53a3adfa2c5fc107b4fae054f579/lib/trace-event.ts#L21-L22
 *
 * Tested and verified on both Darwin and Linux
 */
function microSecsToSeconds(ts) {
    return ts / 1e6;
}
exports.microSecsToSeconds = microSecsToSeconds;
/**
 * Timestamp at which the current node process began.
 */
const processStart = perf_hooks_1.performance.timeOrigin;
function getTimestamp() {
    return (processStart + now()) * 1000;
}
exports.getTimestamp = getTimestamp;
/**
 * Relative current time from the start of the current node process
 */
function now() {
    return perf_hooks_1.performance.now();
}
exports.now = now;
/**
 * Execute all the hooks callbacks in parallel using Promise.all
 */
async function runParallel(callbacks, args) {
    const promises = callbacks.map(cb => cb(args));
    return await Promise.all(promises);
}
exports.runParallel = runParallel;
function isDepInstalled(dep) {
    try {
        return require.resolve(dep);
    }
    catch (e) {
        return false;
    }
}
exports.isDepInstalled = isDepInstalled;
function isDirectory(path) {
    return fs_1.default.existsSync(path) && fs_1.default.statSync(path).isDirectory();
}
exports.isDirectory = isDirectory;
function isFile(filePath) {
    return fs_1.default.existsSync(filePath) && fs_1.default.statSync(filePath).isFile();
}
exports.isFile = isFile;
/**
 * Traverse the directory tree up from the cwd until we find
 * package.json file to check if the user is invoking our script
 * from an NPM project.
 */
function findPkgJsonByTraversing(resolvePath, cwd) {
    const packageJSON = (0, path_1.resolve)(resolvePath, 'package.json');
    if (isFile(packageJSON)) {
        return packageJSON;
    }
    const parentDirectory = (0, path_1.dirname)(resolvePath);
    /**
     * We are in the system root and package.json does not exist
     */
    if (resolvePath === parentDirectory) {
        throw (0, colors_1.red)(`Could not find package.json file in: "${cwd}"\n` +
            `It is recommended to run the agent in an NPM project.\n` +
            `You can create one by running "npm init -y" in the project folder.`);
    }
    return findPkgJsonByTraversing(parentDirectory, cwd);
}
exports.findPkgJsonByTraversing = findPkgJsonByTraversing;
/**
 * Modified version of `totalist` package that handles the symlink issue
 * and avoids infinite recursion
 *
 * Based on code from totalist!
 * https://github.com/lukeed/totalist/blob/44379974e535afe9c38e8d643dd64c59101a14b9/src/async.js#L8
 */
async function totalist(dir, callback, pre = '') {
    dir = (0, path_1.resolve)('.', dir);
    await (0, promises_1.readdir)(dir).then(arr => {
        return Promise.all(arr.map(str => {
            const abs = (0, path_1.join)(dir, str);
            return (0, promises_1.lstat)(abs).then(stats => stats.isDirectory()
                ? totalist(abs, callback, (0, path_1.join)(pre, str))
                : callback((0, path_1.join)(pre, str), abs));
        }));
    });
}
exports.totalist = totalist;
/**
 * Find index of Playwright specific Error logs that is thrown
 * as part of the custom error message/stack
 */
function findPWLogsIndexes(msgOrStack) {
    let startIndex = 0;
    let endIndex = 0;
    if (!msgOrStack) {
        return [startIndex, endIndex];
    }
    const lines = String(msgOrStack).split(SEPARATOR);
    const logStart = /[=]{3,} logs [=]{3,}/;
    const logEnd = /[=]{10,}/;
    lines.forEach((line, index) => {
        if (logStart.test(line)) {
            startIndex = index;
        }
        else if (logEnd.test(line)) {
            endIndex = index;
        }
    });
    return [startIndex, endIndex];
}
exports.findPWLogsIndexes = findPWLogsIndexes;
function rewriteErrorMessage(message, start) {
    if (start === 0) {
        return message;
    }
    return message.split(SEPARATOR).slice(0, start).join(SEPARATOR);
}
exports.rewriteErrorMessage = rewriteErrorMessage;
function rewriteErrorStack(stack, indexes) {
    const [start, end] = indexes;
    /**
     * Do not rewrite if its not a playwright error
     */
    if (start === 0 && end === 0) {
        return stack;
    }
    const linesToKeep = start + 3;
    if (start > 0 && linesToKeep < end) {
        const lines = stack.split(SEPARATOR);
        return lines
            .slice(0, linesToKeep)
            .concat(...lines.slice(end))
            .join(SEPARATOR);
    }
    return stack;
}
exports.rewriteErrorStack = rewriteErrorStack;
// formatError prefers receiving proper Errors, but since at runtime
// non Error exceptions can be thrown, it tolerates though. The
// redundant type Error | any expresses that.
function formatError(error) {
    if (error === undefined || error === null) {
        return;
    }
    if (!(error instanceof Error)) {
        return {
            message: `Error "${error}" received, with type "${typeof error}". (Do not throw exceptions without using \`new Error("my message")\`)`,
            name: '',
            stack: '',
        };
    }
    const { name, message, stack } = error;
    const indexes = findPWLogsIndexes(message);
    return {
        name,
        message: rewriteErrorMessage(message, indexes[0]),
        stack: rewriteErrorStack(stack, indexes),
    };
}
exports.formatError = formatError;
const cwd = process.cwd();
/**
 * All the settings that are related to the Synthetics is stored
 * under this directory
 * Examples: Screenshots, Project setup
 */
exports.SYNTHETICS_PATH = (0, path_1.join)(cwd, '.synthetics');
/**
 * Synthetics cache path that is based on the process id to make sure
 * each process does not modify the caching layer used by other process
 * once we move to executing journeys in parallel
 */
exports.CACHE_PATH = (0, path_1.join)(exports.SYNTHETICS_PATH, process.pid.toString());
function getDurationInUs(duration) {
    return Math.trunc(duration * 1e6);
}
exports.getDurationInUs = getDurationInUs;
function megabitsToBytes(megabytes) {
    return (megabytes * 1024 * 1024) / 8;
}
exports.megabitsToBytes = megabitsToBytes;
exports.DEFAULT_THROTTLING_OPTIONS = {
    download: 5,
    upload: 3,
    latency: 20,
};
/**
 * Transforms the CLI throttling arguments in to format
 * expected by Chrome devtools protocol NetworkConditions
 */
function getNetworkConditions(throttlingOpts) {
    return {
        downloadThroughput: megabitsToBytes(throttlingOpts.download),
        uploadThroughput: megabitsToBytes(throttlingOpts.upload),
        latency: throttlingOpts.latency,
        offline: false,
    };
}
exports.getNetworkConditions = getNetworkConditions;
exports.THROTTLING_WARNING_MSG = `Throttling may not be active when the tests run - see
https://github.com/elastic/synthetics/blob/main/docs/throttling.md for more details`;
const dstackTraceLimit = 10;
// Uses the V8 Stacktrace API to get the function location
// information - https://v8.dev/docs/stack-trace-api#customizing-stack-traces
function wrapFnWithLocation(func) {
    return (...args) => {
        const _prepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stackFrames) => {
            // Deafult CallSite would not map to the original transpiled source
            // correctly, So we use source-map-support to map the CallSite to the
            // original source from our cached source map
            const frame = source_map_support_1.default.wrapCallSite(stackFrames[1]);
            return {
                file: frame.getFileName(),
                line: frame.getLineNumber(),
                column: frame.getColumnNumber(),
            };
        };
        Error.stackTraceLimit = 2;
        const obj = {};
        Error.captureStackTrace(obj);
        const location = obj.stack;
        Error.stackTraceLimit = dstackTraceLimit;
        Error.prepareStackTrace = _prepareStackTrace;
        return func(location, ...args);
    };
}
exports.wrapFnWithLocation = wrapFnWithLocation;
// Safely parse ND JSON (Newline delimitted JSON) chunks
function safeNDJSONParse(data) {
    // data may not be at proper newline boundaries, so we make sure everything is split
    // on proper newlines
    const chunks = Array.isArray(data) ? data : [data];
    const lines = chunks.join('\n').split(/\r?\n/);
    return lines
        .filter(l => l.match(/\S/)) // remove blank lines
        .map(line => {
        try {
            return JSON.parse(line);
        }
        catch (e) {
            throw `Error ${e} could not parse data '${line}'`;
        }
    });
}
exports.safeNDJSONParse = safeNDJSONParse;
// Console helpers
function write(message, live) {
    process.stderr.write(message + (live ? '\r' : '\n'));
}
exports.write = write;
function progress(message) {
    write((0, colors_1.cyan)((0, colors_1.bold)(`${exports.symbols.progress} ${message}`)));
}
exports.progress = progress;
async function liveProgress(promise, message) {
    const start = now();
    const interval = setInterval(() => {
        apiProgress(`${message} (${Math.trunc(now() - start)}ms)`, true);
    }, 500);
    promise.finally(() => clearInterval(interval));
    const result = await promise;
    apiProgress(`${message} (${Math.trunc(now() - start)}ms)`);
    return result;
}
exports.liveProgress = liveProgress;
function apiProgress(message, live = false) {
    write((0, colors_1.grey)(`> ${message}`), live);
}
exports.apiProgress = apiProgress;
function error(message) {
    write((0, colors_1.red)(message));
}
exports.error = error;
function done(message) {
    write((0, colors_1.bold)((0, colors_1.green)(`${exports.symbols['succeeded']} ${message}`)));
}
exports.done = done;
function warn(message) {
    write((0, colors_1.bold)((0, colors_1.yellow)(`${exports.symbols['warning']} ${message}`)));
}
exports.warn = warn;
function removeTrailingSlash(url) {
    return url.replace(/\/+$/, '');
}
exports.removeTrailingSlash = removeTrailingSlash;
function getMonitorManagementURL(url) {
    return removeTrailingSlash(url) + '/app/uptime/manage-monitors/all';
}
exports.getMonitorManagementURL = getMonitorManagementURL;
//# sourceMappingURL=helpers.js.map