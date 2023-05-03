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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Journey = void 0;
const micromatch_1 = __importStar(require("micromatch"));
const step_1 = require("./step");
const monitor_1 = require("./monitor");
class Journey {
    name;
    id;
    tags;
    callback;
    location;
    steps = [];
    hooks = { before: [], after: [] };
    monitor;
    constructor(options, callback, location) {
        this.name = options.name;
        this.id = options.id || options.name;
        this.tags = options.tags;
        this.callback = callback;
        this.location = location;
        this.updateMonitor({});
    }
    addStep(name, callback, location) {
        const step = new step_1.Step(name, this.steps.length + 1, callback, location);
        this.steps.push(step);
        return step;
    }
    addHook(type, callback) {
        this.hooks[type].push(callback);
    }
    updateMonitor(config) {
        /**
         * Use defaults values from journey for monitor object (id, name and tags)
         */
        this.monitor = new monitor_1.Monitor({
            name: this.name,
            id: this.id,
            type: 'browser',
            tags: this.tags ?? [],
            ...config,
        });
        this.monitor.setSource(this.location);
        this.monitor.setContent(this.callback.toString());
        this.monitor.setFilter({ match: this.name });
    }
    /**
     * Matches journeys based on the provided args. Proitize tags over match
     * - tags pattern that matches only tags
     * - match pattern that matches both name and tags
     */
    isMatch(matchPattern, tagsPattern) {
        if (tagsPattern) {
            return this.tagsMatch(tagsPattern);
        }
        if (matchPattern) {
            return (0, micromatch_1.isMatch)(this.name, matchPattern) || this.tagsMatch(matchPattern);
        }
        return true;
    }
    tagsMatch(pattern) {
        const matchess = (0, micromatch_1.default)(this.tags || ['*'], pattern);
        return matchess.length > 0;
    }
}
exports.Journey = Journey;
//# sourceMappingURL=journey.js.map