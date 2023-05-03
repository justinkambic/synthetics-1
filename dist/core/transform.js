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
exports.installTransform = exports.transform = exports.commonOptions = void 0;
const pirates_1 = require("pirates");
const esbuild_1 = require("esbuild");
const path_1 = __importDefault(require("path"));
const source_map_support_1 = __importDefault(require("source-map-support"));
// Cache that holds the sourcemap content for each file
const sourceMaps = new Map();
// Register the source-map-support library to resolve the sourcemaps
// for the files that are transpiled by esbuild
/**
 * Register the source-map-support library to resolve the sourcemaps
 * for the files that are transpiled by esbuild and cache the sourcemaps
 * for each file.
 *
 * Caching the sourcemap file is important, as it is used by the Synthetics agent
 * to resolve the stack traces of journey, monitor and step functions.
 */
source_map_support_1.default.install({
    environment: 'node',
    handleUncaughtExceptions: false,
    retrieveSourceMap(source) {
        if (!sourceMaps.has(source))
            return null;
        return {
            map: JSON.parse(sourceMaps.get(source)),
            url: source,
        };
    },
});
/**
 * Default list of files and corresponding loaders we support
 * while pushing project based monitors
 */
const LOADERS = {
    '.ts': 'ts',
    '.js': 'js',
    '.mjs': 'js',
    '.cjs': 'js',
};
const getLoader = (filename) => {
    const ext = path_1.default.extname(filename);
    return LOADERS[ext] || 'default';
};
function commonOptions() {
    /**
     * We are not minifying the code as we want it to be in sync with previous
     * transformation phase and introduce it later.
     */
    return {
        minify: false,
        minifyIdentifiers: false,
        minifySyntax: false,
        minifyWhitespace: false,
        sourcemap: 'both',
        sourcesContent: false,
        platform: 'node',
        logLevel: 'silent',
        format: 'cjs',
        target: `node${process.version.slice(1)}`,
    };
}
exports.commonOptions = commonOptions;
/**
 * Transform the given code using esbuild and save the corresponding
 * map file in memory to be retrived later.
 */
function transform(code, filename, options = {}) {
    const result = (0, esbuild_1.transformSync)(code, {
        ...commonOptions(),
        sourcefile: filename,
        loader: getLoader(filename),
        /**
         * Add this only for the transformation phase, using it on
         * bundling phase would disable tree shaking and uncessary bloat
         *
         * Ensures backwards compatability with tsc's implicit strict behaviour
         */
        tsconfigRaw: {
            compilerOptions: {
                alwaysStrict: true,
            },
        },
        ...options,
    });
    const warnings = result.warnings;
    if (warnings && warnings.length > 0) {
        for (const warning of warnings) {
            console.log(warning.location);
            console.log(warning.text);
        }
    }
    /**
     * Cache the sourcemap contents in memory, so we can look it up
     * later when we try to resolve the sourcemap for a given file.
     *
     * Every time the synthetics agent is started, we register the source-map-support
     * library to resolve the sourcemaps for the files that are transpiled by esbuild.
     */
    if (result.map) {
        sourceMaps.set(filename, result.map);
    }
    return result;
}
exports.transform = transform;
/**
 * Install the pirates hook to transform the code on the fly
 * for all of the imported files.
 */
function installTransform() {
    const revertPirates = (0, pirates_1.addHook)((source, filename) => {
        const { code } = transform(source, filename);
        return code;
    }, { exts: ['.ts', '.js', '.mjs', '.cjs'] });
    return () => {
        revertPirates();
    };
}
exports.installTransform = installTransform;
//# sourceMappingURL=transform.js.map