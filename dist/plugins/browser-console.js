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
exports.BrowserConsole = void 0;
const logger_1 = require("../core/logger");
const helpers_1 = require("../helpers");
const defaultMessageLimit = 1000;
class BrowserConsole {
    driver;
    messages = [];
    _currentStep = null;
    constructor(driver) {
        this.driver = driver;
    }
    consoleEventListener = msg => {
        if (!this._currentStep) {
            return;
        }
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
            const { name, index } = this._currentStep;
            this.messages.push({
                timestamp: (0, helpers_1.getTimestamp)(),
                text: msg.text(),
                type,
                step: { name, index },
            });
            this.enforceMessagesLimit();
        }
    };
    pageErrorEventListener = (error) => {
        if (!this._currentStep) {
            return;
        }
        const { name, index } = this._currentStep;
        this.messages.push({
            timestamp: (0, helpers_1.getTimestamp)(),
            text: error.message,
            type: 'error',
            step: { name, index },
            error,
        });
        this.enforceMessagesLimit();
    };
    enforceMessagesLimit() {
        if (this.messages.length > defaultMessageLimit) {
            this.messages.splice(0, 1);
        }
    }
    start() {
        (0, logger_1.log)(`Plugins: started collecting console events`);
        this.driver.page.on('console', this.consoleEventListener);
        this.driver.page.on('pageerror', this.pageErrorEventListener);
    }
    stop() {
        this.driver.page.off('console', this.consoleEventListener);
        this.driver.page.off('pageerror', this.pageErrorEventListener);
        (0, logger_1.log)(`Plugins: stopped collecting console events`);
        return this.messages;
    }
}
exports.BrowserConsole = BrowserConsole;
//# sourceMappingURL=browser-console.js.map