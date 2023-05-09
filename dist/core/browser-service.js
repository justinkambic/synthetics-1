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
exports.BrowserService = void 0;
const url_1 = require("url");
const http_1 = require("http");
const http_proxy_1 = require("http-proxy");
const playwright_chromium_1 = require("playwright-chromium");
const logger_1 = require("./logger");
class BrowserService {
    options;
    closeCallbacks = [];
    proxyServer = (0, http_1.createServer)();
    constructor(options = { port: 9322 }) {
        this.options = options;
    }
    init() {
        const proxy = (0, http_proxy_1.createProxyServer)();
        this.proxyServer.on('upgrade', async (req, socket, head) => {
            const browserServer = await playwright_chromium_1.chromium.launchServer({ headless: true });
            const wsEndpoint = browserServer.wsEndpoint();
            const { pathname, origin } = new url_1.URL(wsEndpoint);
            req.url = pathname;
            (0, logger_1.log)(`New browser: ${wsEndpoint}`);
            proxy.ws(req, socket, head, { target: origin });
            const closeBrowser = async () => {
                const index = this.closeCallbacks.indexOf(closeBrowser);
                if (index >= 0) {
                    this.closeCallbacks.splice(index, 1);
                }
                await browserServer.close();
                (0, logger_1.log)(`Socket closed: ${wsEndpoint}`);
            };
            this.closeCallbacks.push(closeBrowser);
            socket.on('close', closeBrowser);
            socket.on('error', closeBrowser);
        });
        this.proxyServer.listen(this.options.port, () => {
            (0, logger_1.log)(`Listening on port: ${this.options.port}`);
        });
    }
    async dispose() {
        for (let i = 0; i < this.closeCallbacks.length; i++) {
            const callback = this.closeCallbacks[i];
            await callback();
        }
        this.closeCallbacks = [];
        await new Promise(resolve => {
            this.proxyServer.close(resolve);
        });
    }
}
exports.BrowserService = BrowserService;
//# sourceMappingURL=browser-service.js.map