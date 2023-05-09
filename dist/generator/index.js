"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Generator = exports.CONFIG_PATH = exports.REGULAR_FILES_PATH = void 0;
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
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const colors_1 = require("kleur/colors");
const path_1 = require("path");
// @ts-ignore-next-line: has no exported member 'Input'
const enquirer_1 = require("enquirer");
const helpers_1 = require("../helpers");
const utils_1 = require("./utils");
const locations_1 = require("../locations");
const monitor_1 = require("../dsl/monitor");
// Templates that are required for setting up new synthetics project
const templateDir = (0, path_1.join)(__dirname, '..', '..', 'templates');
// exported for testing
exports.REGULAR_FILES_PATH = [
    'journeys/example.journey.ts',
    'journeys/advanced-example-helpers.ts',
    'journeys/advanced-example.journey.ts',
    'lightweight/heartbeat.yml',
    '.github/workflows/run-synthetics.yml',
    'README.md',
];
exports.CONFIG_PATH = 'synthetics.config.ts';
class Generator {
    projectDir;
    pkgManager = 'npm';
    constructor(projectDir) {
        this.projectDir = projectDir;
    }
    async directory() {
        (0, helpers_1.progress)(`Initializing Synthetics project in '${(0, path_1.relative)(process.cwd(), this.projectDir) || '.'}'`);
        if (!(0, fs_1.existsSync)(this.projectDir)) {
            await (0, promises_1.mkdir)(this.projectDir);
        }
    }
    async questions() {
        if (process.env.TEST_QUESTIONS) {
            return JSON.parse(process.env.TEST_QUESTIONS);
        }
        const { onCloud } = await (0, enquirer_1.prompt)({
            type: 'confirm',
            name: 'onCloud',
            initial: 'y',
            message: 'Do you use Elastic Cloud',
        });
        const url = await new enquirer_1.Input({
            header: onCloud
                ? (0, colors_1.yellow)('Get cloud.id from your deployment https://www.elastic.co/guide/en/cloud/current/ec-cloud-id.html')
                : '',
            message: onCloud
                ? 'What is your cloud.id'
                : 'What is the url of your Kibana instance',
            name: 'url',
            required: true,
            result(value) {
                return onCloud ? (0, utils_1.cloudIDToKibanaURL)(value) : value;
            },
        }).run();
        const auth = await new enquirer_1.Input({
            name: 'auth',
            header: (0, colors_1.yellow)(`Generate API key from Kibana ${(0, helpers_1.getMonitorManagementURL)(url)}`),
            required: true,
            message: 'What is your API key',
        }).run();
        const allLocations = await (0, locations_1.getLocations)({ url, auth });
        const locChoices = (0, locations_1.formatLocations)(allLocations);
        if (locChoices.length === 0) {
            throw 'Follow the docs to set up your first private locations - https://www.elastic.co/guide/en/observability/current/uptime-set-up-choose-agent.html#private-locations';
        }
        const monitorQues = [
            {
                type: 'select',
                name: 'locations',
                hint: '(Use <space> to select, <return> to submit)',
                message: 'Select the locations where you want to run monitors',
                choices: locChoices,
                multiple: true,
                validate(value) {
                    return value.length === 0 ? `Select at least one option.` : true;
                },
            },
            {
                type: 'select',
                name: 'schedule',
                message: 'Set default schedule in minutes for all monitors',
                initial: 3,
                choices: monitor_1.ALLOWED_SCHEDULES.map(String),
                required: true,
                result(value) {
                    return Number(value);
                },
            },
            {
                type: 'input',
                name: 'id',
                message: 'Choose project id to logically group monitors',
                initial: (0, path_1.basename)(this.projectDir),
            },
            {
                type: 'input',
                name: 'space',
                message: 'Choose the target Kibana space',
                initial: 'default',
            },
        ];
        // Split and group private and public locations from the answered list.
        const answers = await (0, enquirer_1.prompt)(monitorQues);
        const { locations, privateLocations } = (0, locations_1.groupLocations)(answers.locations);
        return { ...answers, url, locations, privateLocations };
    }
    async files(answers) {
        const fileMap = new Map();
        // Setup Synthetics config file
        fileMap.set(exports.CONFIG_PATH, (0, utils_1.replaceTemplates)(await (0, promises_1.readFile)((0, path_1.join)(templateDir, exports.CONFIG_PATH), 'utf-8'), answers));
        // Setup non-templated files
        Promise.all(exports.REGULAR_FILES_PATH.map(async (file) => {
            fileMap.set(file, await (0, promises_1.readFile)((0, path_1.join)(templateDir, file), 'utf-8'));
        })).catch(e => {
            throw e;
        });
        // Create files
        for (const [relativePath, content] of fileMap) {
            await this.createFile(relativePath, content);
        }
    }
    async createFile(relativePath, content, override = false) {
        const absolutePath = (0, path_1.join)(this.projectDir, relativePath);
        if (!override && (0, fs_1.existsSync)(absolutePath)) {
            const { override } = await (0, enquirer_1.prompt)({
                type: 'confirm',
                name: 'override',
                message: `File ${relativePath} already exists. Override it?`,
                initial: false,
            });
            if (!override)
                return;
        }
        (0, helpers_1.progress)(`Writing ${(0, path_1.relative)(process.cwd(), absolutePath)}.`);
        await (0, promises_1.mkdir)((0, path_1.dirname)(absolutePath), { recursive: true });
        await (0, promises_1.writeFile)(absolutePath, content, 'utf-8');
    }
    async package() {
        this.pkgManager = await (0, utils_1.getPackageManager)(this.projectDir);
        const commands = new Map();
        commands.set(`Setting up project using ${this.pkgManager == 'yarn' ? 'Yarn' : 'NPM'}`, this.pkgManager == 'yarn' ? 'yarn init -y' : 'npm init -y');
        const pkgName = '@elastic/synthetics';
        commands.set(`Installing @elastic/synthetics library`, this.pkgManager == 'yarn'
            ? `yarn add -dev ${pkgName} --silent`
            : `npm i -d ${pkgName} --quiet`);
        // Execute commands
        for (const [name, command] of commands) {
            (0, helpers_1.progress)(`${name}...`);
            (0, child_process_1.execSync)(command, {
                stdio: 'inherit',
                cwd: this.projectDir,
            });
        }
    }
    async patchPkgJSON() {
        const filename = 'package.json';
        const pkgJSON = JSON.parse(await (0, promises_1.readFile)((0, path_1.join)(this.projectDir, filename), 'utf-8'));
        if (!pkgJSON.scripts) {
            pkgJSON.scripts = {};
        }
        // Add test command
        if (!pkgJSON.scripts.test) {
            pkgJSON.scripts.test = 'npx @elastic/synthetics journeys';
        }
        // Add push command
        if (!pkgJSON.scripts.push) {
            pkgJSON.scripts.push = 'npx @elastic/synthetics push';
        }
        await this.createFile(filename, JSON.stringify(pkgJSON, null, 2) + '\n', true);
    }
    async patchGitIgnore() {
        const gitIgnorePath = (0, path_1.join)(this.projectDir, '.gitignore');
        let gitIgnore = '';
        if ((0, fs_1.existsSync)(gitIgnorePath)) {
            const contents = await (0, promises_1.readFile)(gitIgnorePath, 'utf-8');
            gitIgnore += contents.trimEnd() + '\n';
        }
        if (!gitIgnore.includes('node_modules')) {
            gitIgnore += 'node_modules/\n';
        }
        if (!gitIgnore.includes('.synthetics')) {
            gitIgnore += '.synthetics/\n';
        }
        await (0, promises_1.writeFile)(gitIgnorePath, gitIgnore, 'utf-8');
    }
    banner() {
        (0, helpers_1.write)((0, colors_1.bold)(`
All set, you can run below commands inside: ${this.projectDir}:

  Run synthetic tests: ${(0, colors_1.cyan)((0, utils_1.runCommand)(this.pkgManager, 'test'))}

  Push monitors to Kibana: ${(0, colors_1.cyan)('SYNTHETICS_API_KEY=<value> ' + (0, utils_1.runCommand)(this.pkgManager, 'push'))}

  ${(0, colors_1.yellow)('Make sure to configure the SYNTHETICS_API_KEY before pushing monitors to Kibana.')}

Visit https://www.elastic.co/guide/en/observability/current/synthetic-run-tests.html to learn more.
    `));
    }
    async setup() {
        await this.directory();
        const answers = await this.questions();
        await this.package();
        await this.files(answers);
        await this.patchPkgJSON();
        await this.patchGitIgnore();
        this.banner();
    }
}
exports.Generator = Generator;
//# sourceMappingURL=index.js.map