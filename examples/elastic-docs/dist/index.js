"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const synthetics_1 = require("@elastic/synthetics");
const child_process_1 = require("child_process");
const axios_1 = require("axios");
const process_1 = require("process");
// Import your test files here
require("./basic.journey");
require("./cloud_docs");
// Default parameters for running the suite. These can be overriden with the '--suite-params' option'
// customize these as you like!
const defaultSuiteParams = {
    development: {
        homepage: 'http://localhost:4567'
    },
    staging: {
        homepage: 'http://staging.localhost:4567'
    },
    production: {
        homepage: 'http://prod.localhost:4567'
    }
};
// Change the contents of this function to determine when the service you're testing is ready to run the suite
async function waitForApp(suiteParams) {
    const homepage = suiteParams.homepage;
    console.log(`Waiting for service homepage to come up: ${homepage}`);
    let timeout = 60000; // time in millis to wait for app to start
    let lastError;
    while (timeout > 0) {
        const started = new Date().getTime();
        try {
            const res = await axios_1.default.get(homepage);
            if (res.status >= 200 && res.status < 400) {
                // App is OK!
                return;
            }
            lastError = new Error(`Invalid status code: ${res.status}`);
        }
        catch (e) {
            lastError = e;
        }
        finally {
            const durationMs = new Date().getTime() - started;
            timeout -= durationMs;
        }
    }
    throw lastError;
}
// Code to run before and after the full suite
// By default you shouldn't need to edit this,
// simply edit 'start_service.sh' to start your service(s)
// This will run that, and send a SIGTERM after the
// suite is over
async function runSuites() {
    const environment = process.env['NODE_ENV'] || 'development';
    const suiteParams = { ...defaultSuiteParams[environment] };
    // By default we run the script start_service.sh
    //const proc = await startService(environment, suiteParams)
    // Run the actual test suite
    await synthetics_1.run({ params: suiteParams, environment });
    //stopService(proc);
}
async function startService(environment, suiteParams) {
    let childProcess;
    if (environment === 'development') {
        console.log('Starting service from `./start_service.sh`');
        const childProcess = child_process_1.spawn('./hooks/start_service.sh');
        childProcess.stdout.on('data', chunk => {
            console.log(chunk);
        });
        childProcess.stderr.on('data', chunk => {
            console.warn(chunk);
        });
        childProcess.on('close', code => {
            console.debug(`child process for service exited with ${code}`);
        });
        // Wait for the service to start successfully (you can change the logic here)
        try {
            await waitForApp(suiteParams);
        }
        catch (e) {
            console.error('Service did not start successfully in time, failed waiting for initial service health check');
            console.error(e);
            process_1.exit(123);
        }
    }
    return childProcess;
}
async function stopService(childProcess) {
    // Clean up the script started with start_service.sh
    if (childProcess) {
        console.log('Terminating service with SIGTERM');
        childProcess.kill('SIGTERM');
    }
}
// Do not remove below this line!
(async () => {
    await runSuites();
})();
//# sourceMappingURL=index.js.map