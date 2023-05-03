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
import { BrowserContextOptions, LaunchOptions, CDPSession, ChromiumBrowser, ChromiumBrowserContext, Page, APIRequestContext } from 'playwright-chromium';
import { Step } from './dsl';
import { BuiltInReporterName, ReporterInstance } from './reporters';
import { MonitorConfig } from './dsl/monitor';
export declare type VoidCallback = () => void;
export declare type Location = {
    file: string;
    line: number;
    column: number;
};
export declare type Params = Record<string, any>;
export declare type HooksArgs = {
    env: string;
    params: Params;
};
export declare type HooksCallback = (args: HooksArgs) => void;
export declare type StatusValue = 'succeeded' | 'failed' | 'skipped';
export declare type NetworkConditions = {
    offline: boolean;
    downloadThroughput: number;
    uploadThroughput: number;
    latency: number;
};
export declare type Driver = {
    browser: ChromiumBrowser;
    context: ChromiumBrowserContext;
    page: Page;
    client: CDPSession;
    request: APIRequestContext;
};
export declare type TraceOutput = {
    name: string;
    type: string;
    start: MetricDuration;
    duration?: MetricDuration;
    score?: number;
};
declare type MetricDuration = {
    us: number;
};
export declare type PerfMetrics = {
    fcp: MetricDuration;
    lcp: MetricDuration;
    dcl: MetricDuration;
    load: MetricDuration;
    cls: number;
};
export declare type Filmstrip = {
    start: MetricDuration;
    blob: string;
    mime: string;
};
export declare type DefaultPluginOutput = {
    step?: Partial<Step>;
    timestamp: number;
};
export declare type BrowserInfo = {
    name: string;
    version: string;
};
export declare type Screenshot = {
    timestamp: number;
    step: Step;
    data: string;
};
export declare type SecurityDetails = {
    issuer?: string;
    protocol?: string;
    subjectName?: string;
    validFrom?: number;
    validTo?: number;
};
export declare type Request = {
    method: string;
    url: string;
    headers: Record<string, string>;
    bytes?: number;
    body?: {
        bytes: number;
    };
    referrer?: string;
};
export declare type Response = {
    url?: string;
    status: number;
    statusText?: string;
    mimeType?: string;
    headers: Record<string, string>;
    bytes?: number;
    body?: {
        bytes: number;
    };
    transferSize?: number;
    redirectURL?: string;
    securityDetails?: SecurityDetails;
    remoteIPAddress?: string;
    remotePort?: number;
    fromServiceWorker?: boolean;
};
export declare type NetworkInfo = {
    url: string;
    browser: BrowserInfo;
    type: string;
    request: Request;
    response: Response;
    isNavigationRequest: boolean;
    requestSentTime: number;
    loadEndTime: number;
    responseReceivedTime: number;
    resourceSize: number;
    transferSize: number;
    timings: {
        blocked: number;
        dns: number;
        ssl: number;
        connect: number;
        send: number;
        wait: number;
        receive: number;
        total: number;
    };
} & DefaultPluginOutput;
export declare type PageMetrics = Record<string, number>;
export declare type BrowserMessage = {
    text: string;
    type: string;
    error?: Error;
} & DefaultPluginOutput;
export declare type PluginOutput = {
    filmstrips?: Array<Filmstrip>;
    networkinfo?: Array<NetworkInfo>;
    browserconsole?: Array<BrowserMessage>;
    traces?: Array<TraceOutput>;
    metrics?: PerfMetrics;
};
export declare type ScreenshotOptions = 'on' | 'off' | 'only-on-failure';
export declare type ThrottlingOptions = {
    download?: number;
    upload?: number;
    latency?: number;
};
declare type BaseArgs = {
    params?: Params;
    screenshots?: ScreenshotOptions;
    dryRun?: boolean;
    match?: string;
    tags?: Array<string>;
    outfd?: number;
    wsEndpoint?: string;
    pauseOnError?: boolean;
    ignoreHttpsErrors?: boolean;
    playwrightOptions?: PlaywrightOptions;
    quietExitCode?: boolean;
    throttling?: MonitorConfig['throttling'];
    schedule?: MonitorConfig['schedule'];
    locations?: MonitorConfig['locations'];
    privateLocations?: MonitorConfig['privateLocations'];
};
export declare type CliArgs = BaseArgs & {
    config?: string;
    reporter?: BuiltInReporterName;
    pattern?: string;
    inline?: boolean;
    require?: Array<string>;
    sandbox?: boolean;
    richEvents?: boolean;
    capability?: Array<string>;
    ignoreHttpsErrors?: boolean;
};
export declare type RunOptions = BaseArgs & {
    metrics?: boolean;
    ssblocks?: boolean;
    network?: boolean;
    trace?: boolean;
    filmstrips?: boolean;
    environment?: string;
    playwrightOptions?: PlaywrightOptions;
    networkConditions?: NetworkConditions;
    reporter?: BuiltInReporterName | ReporterInstance;
};
export declare type PushOptions = Partial<ProjectSettings> & {
    auth: string;
    schedule?: MonitorConfig['schedule'];
    locations?: MonitorConfig['locations'];
    privateLocations?: MonitorConfig['privateLocations'];
    yes?: boolean;
};
export declare type ProjectSettings = {
    id: string;
    url: string;
    space: string;
};
export declare type PlaywrightOptions = LaunchOptions & BrowserContextOptions & {
    testIdAttribute?: string;
    actionTimeout?: number;
    navigationTimeout?: number;
};
export declare type SyntheticsConfig = {
    params?: Params;
    playwrightOptions?: PlaywrightOptions;
    monitor?: MonitorConfig;
    project?: ProjectSettings;
};
/** Runner Payload types */
export declare type JourneyResult = {
    status: StatusValue;
    error?: Error;
    networkinfo?: PluginOutput['networkinfo'];
    browserconsole?: PluginOutput['browserconsole'];
};
export declare type StepResult = {
    status: StatusValue;
    url?: string;
    error?: Error;
    pagemetrics?: PageMetrics;
    filmstrips?: PluginOutput['filmstrips'];
    metrics?: PluginOutput['metrics'];
    traces?: PluginOutput['traces'];
};
/** Reporter and Runner contract */
export declare type StartEvent = {
    numJourneys: number;
    networkConditions?: NetworkConditions;
};
export declare type JourneyStartResult = {
    timestamp: number;
    params?: Params;
};
export declare type JourneyEndResult = JourneyStartResult & JourneyResult & {
    start: number;
    end: number;
    options: RunOptions;
    timestamp: number;
};
export declare type StepEndResult = StepResult & {
    start: number;
    end: number;
};
export {};
//# sourceMappingURL=common_types.d.ts.map