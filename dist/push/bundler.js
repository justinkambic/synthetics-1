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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bundler = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const esbuild = __importStar(require("esbuild"));
const archiver_1 = __importDefault(require("archiver"));
const transform_1 = require("../core/transform");
const plugin_1 = require("./plugin");
const SIZE_LIMIT_KB = 800;
function relativeToCwd(entry) {
    return path_1.default.relative(process.cwd(), entry);
}
class Bundler {
    moduleMap = new Map();
    constructor() { }
    async prepare(absPath) {
        const options = {
            ...(0, transform_1.commonOptions)(),
            ...{
                entryPoints: [absPath],
                bundle: true,
                write: false,
                sourcemap: 'inline',
                external: ['@elastic/synthetics'],
                plugins: [(0, plugin_1.SyntheticsBundlePlugin)()],
            },
        };
        const result = await esbuild.build(options);
        if (result.errors.length > 0) {
            throw result.errors;
        }
        this.moduleMap.set(absPath, result.outputFiles[0].text);
    }
    async zip(outputPath) {
        return new Promise((fulfill, reject) => {
            const output = (0, fs_1.createWriteStream)(outputPath);
            const archive = (0, archiver_1.default)('zip', {
                zlib: { level: 9 },
            });
            archive.on('error', reject);
            output.on('close', fulfill);
            archive.pipe(output);
            for (const [path, content] of this.moduleMap.entries()) {
                const relativePath = relativeToCwd(path);
                // Date is fixed to Unix epoch so the file metadata is
                // not modified everytime when files are bundled
                archive.append(content, {
                    name: relativePath,
                    date: new Date('1970-01-01'),
                });
            }
            archive.finalize();
        });
    }
    async build(entry, output) {
        await this.prepare(entry);
        await this.zip(output);
        const data = await this.encode(output);
        await this.checkSize(output);
        await this.cleanup(output);
        return data;
    }
    async encode(outputPath) {
        return await (0, promises_1.readFile)(outputPath, 'base64');
    }
    async checkSize(outputPath) {
        const { size } = await (0, promises_1.stat)(outputPath);
        const sizeKb = size / 1024;
        if (sizeKb > SIZE_LIMIT_KB) {
            throw new Error(`You have monitors whose size exceeds the ${SIZE_LIMIT_KB}KB limit.`);
        }
    }
    async cleanup(outputPath) {
        this.moduleMap = new Map();
        await (0, promises_1.unlink)(outputPath);
    }
}
exports.Bundler = Bundler;
//# sourceMappingURL=bundler.js.map