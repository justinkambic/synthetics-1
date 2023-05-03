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
const promises_1 = require("fs/promises");
const path_1 = require("path");
const helpers_1 = require("../helpers");
const base_1 = __importDefault(require("./base"));
/**
 * JUnit Reporting Format - https://llg.cubic.org/docs/junit/
 */
class JUnitReporter extends base_1.default {
    totalTests = 0;
    totalFailures = 0;
    totalSkipped = 0;
    #journeyMap = new Map();
    onJourneyStart(journey, {}) {
        if (!this.#journeyMap.has(journey.name)) {
            const entry = {
                name: 'testsuite',
                attributes: {
                    name: journey.name,
                    tests: 0,
                    failures: 0,
                    skipped: 0,
                    errors: 0,
                },
                children: [],
            };
            this.#journeyMap.set(journey.name, entry);
        }
    }
    onStepEnd(journey, step, { status, error, start, end }) {
        if (!this.#journeyMap.has(journey.name)) {
            return;
        }
        const entry = this.#journeyMap.get(journey.name);
        const caseEntry = {
            name: 'testcase',
            attributes: {
                name: step.name,
                classname: journey.name + ' ' + step.name,
                time: end - start,
            },
            children: [],
        };
        entry.attributes.tests++;
        if (status === 'failed') {
            const { name, message, stack } = (0, helpers_1.formatError)(error);
            caseEntry.children.push({
                name: 'failure',
                attributes: {
                    message,
                    type: name,
                },
                text: stack,
            });
            entry.attributes.failures++;
        }
        else if (status === 'skipped') {
            caseEntry.children.push({
                name: 'skipped',
                attributes: {
                    message: 'previous step failed',
                },
            });
            entry.attributes.skipped++;
        }
        entry.children.push(caseEntry);
    }
    onJourneyEnd(journey, {}) {
        if (!this.#journeyMap.has(journey.name)) {
            return;
        }
        const { attributes } = this.#journeyMap.get(journey.name);
        this.totalTests += attributes.tests;
        this.totalFailures += attributes.failures;
        this.totalSkipped += attributes.skipped;
    }
    async onEnd() {
        const root = {
            name: 'testsuites',
            attributes: {
                name: '',
                tests: this.totalTests,
                failures: this.totalFailures,
                skipped: this.totalSkipped,
                errors: 0,
                time: parseInt(String((0, helpers_1.now)())) / 1000,
            },
            children: [...this.#journeyMap.values()],
        };
        const output = serializeEntries(root).join('\n');
        /**
         * write the xml output to a file if specified via env flag
         */
        const fileName = process.env['SYNTHETICS_JUNIT_FILE'];
        if (fileName) {
            await (0, promises_1.mkdir)((0, path_1.dirname)(fileName), { recursive: true });
            await (0, promises_1.writeFile)(fileName, output);
        }
        else {
            this.write(output);
        }
    }
}
exports.default = JUnitReporter;
function escape(text) {
    return text
        .replace(/"/g, '&quot;')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function serializeEntries(entry, tokens = [], space = '') {
    tokens.push((0, helpers_1.indent)(`<${entry.name} ${Object.entries(entry.attributes || {})
        .map(([key, value]) => `${key}="${escape(String(value))}"`)
        .join(' ')}>`, space));
    for (const child of entry.children || []) {
        serializeEntries(child, tokens, space + '   ');
    }
    if (entry.text)
        tokens.push((0, helpers_1.indent)(escape(entry.text), space));
    tokens.push((0, helpers_1.indent)(`</${entry.name}>`, space));
    return tokens;
}
//# sourceMappingURL=junit.js.map