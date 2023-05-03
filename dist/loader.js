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
exports.loadTestFiles = exports.globalSetup = void 0;
const process_1 = require("process");
const path_1 = require("path");
const core_1 = require("./core");
const logger_1 = require("./core/logger");
const expect_1 = require("./core/expect");
const helpers_1 = require("./helpers");
const transform_1 = require("./core/transform");
const resolvedCwd = (0, process_1.cwd)();
/**
 * Perform global setup process required for running the test suites
 * and also for bundling the monitors. The process includes
 * - Transpiling the TS/JS test files
 * - Loading these files for running test suites
 */
async function globalSetup(options, args) {
    const revert = (0, transform_1.installTransform)();
    await loadTestFiles(options, args);
    return () => {
        revert();
    };
}
exports.globalSetup = globalSetup;
async function loadTestFiles(options, args) {
    /**
     * Preload modules before running the tests
     */
    const modules = [].concat(options.require || []).filter(Boolean);
    for (const name of modules) {
        if ((0, helpers_1.isDepInstalled)(name)) {
            require(name);
        }
        else {
            throw new Error(`cannot find module '${name}'`);
        }
    }
    if (options.inline) {
        const source = await readStdin();
        loadInlineScript(source);
        return;
    }
    /**
     * Handle piped files by reading the STDIN
     * ex: ls example/suites/*.js | npx @elastic/synthetics
     */
    const files = args.length > 0 ? args : (await readStdin()).split('\n').filter(Boolean);
    const suites = await prepareSuites(files, options.pattern);
    requireSuites(suites);
}
exports.loadTestFiles = loadTestFiles;
const loadInlineScript = source => {
    const scriptFn = new Function('step', 'page', 'context', 'browser', 'params', 'expect', 'request', source);
    (0, core_1.journey)('inline', ({ page, context, browser, params, request }) => {
        scriptFn.apply(null, [
            core_1.step,
            page,
            context,
            browser,
            params,
            expect_1.expect,
            request,
        ]);
    });
};
/**
 * Read the input from STDIN and run it as inline journey
 */
async function readStdin() {
    const chunks = [];
    process_1.stdin.resume();
    process_1.stdin.setEncoding('utf-8');
    for await (const chunk of process_1.stdin) {
        chunks.push(chunk);
    }
    return chunks.join();
}
function requireSuites(suites) {
    for (const suite of suites) {
        require(suite);
    }
}
/**
 * Handle both directory and files that are passed through TTY
 * and add them to suites
 */
async function prepareSuites(inputs, filePattern) {
    const suites = new Set();
    const addSuite = absPath => {
        (0, logger_1.log)(`Processing file: ${absPath}`);
        suites.add(require.resolve(absPath));
    };
    /**
     * Match all files inside the directory with the
     * .journey.{mjs|cjs|js|ts) extensions
     */
    const pattern = filePattern
        ? new RegExp(filePattern, 'i')
        : /.+\.journey\.([mc]js|[jt]s?)$/;
    /**
     * Ignore node_modules by default when running suites
     */
    const ignored = /node_modules/i;
    for (const input of inputs) {
        const absPath = (0, path_1.resolve)(resolvedCwd, input);
        /**
         * Validate for package.json file before running
         * the suites
         */
        (0, helpers_1.findPkgJsonByTraversing)(absPath, resolvedCwd);
        if ((0, helpers_1.isDirectory)(absPath)) {
            await (0, helpers_1.totalist)(absPath, (rel, abs) => {
                if (pattern.test(rel) && !ignored.test(rel)) {
                    addSuite(abs);
                }
            });
        }
        else {
            addSuite(absPath);
        }
    }
    return suites.values();
}
//# sourceMappingURL=loader.js.map