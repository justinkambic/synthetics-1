#!/usr/bin/env node
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
const commander_1 = require("commander");
const process_1 = require("process");
const reporters_1 = require("./reporters");
const options_1 = require("./options");
const loader_1 = require("./loader");
const _1 = require("./");
const core_1 = require("./core");
const monitor_1 = require("./dsl/monitor");
const push_1 = require("./push");
const locations_1 = require("./locations");
const path_1 = require("path");
const generator_1 = require("./generator");
const helpers_1 = require("./helpers");
const public_locations_1 = require("./locations/public-locations");
const monitor_2 = require("./push/monitor");
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const { name, version } = require('../package.json');
const { params, pattern, tags, match, playwrightOpts } = (0, options_1.getCommonCommandOpts)();
commander_1.program
    .name(`npx ${name}`)
    .usage('[options] [dir] [files] file')
    .option('-c, --config <path>', 'configuration path (default: synthetics.config.js)')
    .addOption(pattern)
    .addOption(tags)
    .addOption(match)
    .addOption(params)
    .addOption(new commander_1.Option('--reporter <value>', `output reporter format`).choices(Object.keys(reporters_1.reporters)))
    .option('--inline', 'Run inline journeys from heartbeat')
    .option('-r, --require <modules...>', 'module(s) to preload')
    .option('--sandbox', 'enable chromium sandboxing')
    .option('--rich-events', 'Mimics a heartbeat run')
    .option('--capability <features...>', 'Enable capabilities through feature flags')
    .addOption(new commander_1.Option('--screenshots [flag]', 'take screenshots at end of each step')
    .choices(['on', 'off', 'only-on-failure'])
    .default('on'))
    .option('--dry-run', "don't actually execute anything, report only registered journeys")
    .option('--outfd <fd>', 'specify a file descriptor for logs. Default is stdout', parseInt)
    .option('--ws-endpoint <endpoint>', 'Browser WebSocket endpoint to connect to')
    .option('--pause-on-error', 'pause on error until a keypress is made in the console. Useful during development')
    .option('--ignore-https-errors', 'ignores any HTTPS errors in sites being tested, including ones related to unrecognized certs or signatures. This can be insecure!')
    .option('--quiet-exit-code', 'always return 0 as an exit code status, regardless of test pass / fail. Only return > 0 exit codes on internal errors where the suite could not be run')
    .option('--throttling <config>', 'JSON object to throttle network conditions for download and upload throughput in megabits/second and latency in milliseconds. Ex: { "download": 10, "upload": 5, "latency": 200 }.', options_1.parseThrottling)
    .option('--no-throttling', 'Turns off default network throttling.', options_1.parseThrottling)
    .addOption(playwrightOpts)
    .version(version)
    .description('Run synthetic tests')
    .action(async (cliArgs) => {
    const tearDown = await (0, loader_1.globalSetup)(cliArgs, commander_1.program.args);
    try {
        const options = (0, options_1.normalizeOptions)(cliArgs);
        const results = await (0, _1.run)(options);
        /**
         * Exit with error status if any journey fails
         */
        if (!options.quietExitCode) {
            for (const result of Object.values(results)) {
                if (result.status === 'failed') {
                    process.exit(1);
                }
            }
        }
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
    finally {
        tearDown();
    }
});
// Push command
commander_1.program
    .command('push')
    .description('Push all journeys in the current directory to create monitors within the Kibana monitor management UI')
    .addOption(new commander_1.Option('--auth <auth>', 'API key used for Kibana authentication(https://www.elastic.co/guide/en/kibana/master/api-keys.html).')
    .env('SYNTHETICS_API_KEY')
    .makeOptionMandatory(true))
    .option('--schedule <time-in-minutes>', "schedule in minutes for the pushed monitors. Setting `10`, for example, configures monitors which don't have an interval defined to run every 10 minutes.", parseInt)
    .addOption(new commander_1.Option('--locations <locations...>', 'default list of locations from which your monitors will run.').choices(monitor_1.SyntheticsLocations))
    .option('--private-locations <locations...>', 'default list of private locations from which your monitors will run.')
    .option('--url <url>', 'Kibana URL to upload the monitors')
    .option('--id <id>', 'project id that will be used for logically grouping monitors')
    .option('--space <space>', 'the target Kibana spaces for the pushed monitors — spaces help you organise pushed monitors.')
    .option('-y, --yes', 'skip all questions and run non-interactively')
    .addOption(pattern)
    .addOption(tags)
    .addOption(match)
    .addOption(params)
    .addOption(playwrightOpts)
    .action(async (cmdOpts) => {
    const workDir = (0, process_1.cwd)();
    const tearDown = await (0, loader_1.globalSetup)({ inline: false, ...commander_1.program.opts() }, [
        workDir,
    ]);
    try {
        const settings = await (0, push_1.loadSettings)();
        const options = (0, options_1.normalizeOptions)({
            ...commander_1.program.opts(),
            ...settings,
            ...cmdOpts,
        });
        (0, push_1.validateSettings)(options);
        await (0, push_1.catchIncorrectSettings)(settings, options);
        const monitors = core_1.runner.buildMonitors(options);
        if (options.throttling == null) {
            (0, push_1.warnIfThrottled)(monitors);
        }
        monitors.push(...(await (0, monitor_2.createLightweightMonitors)(workDir, options)));
        await (0, push_1.push)(monitors, options);
    }
    catch (e) {
        e && console.error(e);
        process.exit(1);
    }
    finally {
        tearDown();
    }
});
// Init command
commander_1.program
    .command('init [dir]')
    .description('Initialize Elastic synthetics project')
    .action(async (dir = '') => {
    try {
        const generator = await new generator_1.Generator((0, path_1.resolve)(process.cwd(), dir));
        await generator.setup();
    }
    catch (e) {
        e && (0, helpers_1.error)(e);
        process.exit(1);
    }
});
// Locations command
commander_1.program
    .command('locations')
    .description(`List all locations to run the synthetics monitors. Pass optional '--url' and '--auth' to list private locations.`)
    .option('--url <url>', 'Kibana URL to fetch all public and private locations')
    .option('--auth <auth>', 'API key used for Kibana authentication(https://www.elastic.co/guide/en/kibana/master/api-keys.html).')
    .action(async (cmdOpts) => {
    try {
        let locations = Object.keys(public_locations_1.LocationsMap);
        if (cmdOpts.auth && cmdOpts.url) {
            const allLocations = await (0, locations_1.getLocations)(cmdOpts);
            locations = (0, locations_1.formatLocations)(allLocations);
        }
        (0, locations_1.renderLocations)(locations);
    }
    catch (e) {
        e && (0, helpers_1.error)(e);
        process.exit(1);
    }
});
commander_1.program.parse(process.argv);
//# sourceMappingURL=cli.js.map