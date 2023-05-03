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
exports.SyntheticsGenerator = exports.actionTitle = exports.quote = void 0;
const javascript_1 = require("playwright-core/lib/server/recorder/javascript");
function toAssertCall(pageAlias, action) {
    const { command, selector, value } = action;
    switch (command) {
        case 'textContent':
        case 'innerText':
            return `expect(await ${pageAlias}.${command}(${quote(selector ?? '')})).toMatch(${quote(value ?? '')});`;
        case 'isVisible':
        case 'isHidden':
        case 'isChecked':
        case 'isEditable':
        case 'isEnabled':
        case 'isDisabled':
            return `expect(await ${pageAlias}.${command}(${quote(selector ?? '')})).toBeTruthy();`;
    }
}
function toSignalMap(action) {
    let waitForNavigation;
    let assertNavigation;
    let popup;
    let download;
    let dialog;
    for (const signal of action.signals) {
        if (signal.name === 'navigation' && signal.isAsync)
            waitForNavigation = signal;
        else if (signal.name === 'navigation' && !signal.isAsync)
            assertNavigation = signal;
        else if (signal.name === 'popup')
            popup = signal;
        else if (signal.name === 'download')
            download = signal;
        else if (signal.name === 'dialog')
            dialog = signal;
    }
    return {
        waitForNavigation,
        assertNavigation,
        popup,
        download,
        dialog,
    };
}
function quote(text, char = "'") {
    const stringified = JSON.stringify(text);
    const escapedText = stringified
        .substring(1, stringified.length - 1)
        .replace(/\\"/g, '"');
    if (char === "'")
        return char + escapedText.replace(/[']/g, "\\'") + char;
    if (char === '"')
        return char + escapedText.replace(/["]/g, '\\"') + char;
    if (char === '`')
        return char + escapedText.replace(/[`]/g, '`') + char;
    throw new Error('Invalid escape char');
}
exports.quote = quote;
function isFormattable(value) {
    return (typeof value === 'string' ||
        (Array.isArray(value) && value.every(v => typeof v === 'string')) ||
        typeof value === 'object');
}
function formatObject(value, indent = '  ') {
    if (typeof value === 'string')
        return quote(value);
    if (Array.isArray(value))
        return `[${value.map(o => formatObject(o)).join(', ')}]`;
    if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (!keys.length)
            return '{}';
        const tokens = [];
        for (const key of keys) {
            const child = value[key];
            if (child === undefined || !isFormattable(child))
                continue;
            tokens.push(`${key}: ${formatObject(child)}`);
        }
        return `{\n${indent}${tokens.join(`,\n${indent}`)}\n}`;
    }
    return String(value);
}
/**
 * Generates an appropriate title string based on the action type/data.
 * @param action Playwright action IR
 * @returns title string
 */
function actionTitle(action) {
    switch (action.name) {
        case 'openPage':
            return `Open new page`;
        case 'closePage':
            return `Close page`;
        case 'check':
            return `Check ${action.selector}`;
        case 'uncheck':
            return `Uncheck ${action.selector}`;
        case 'click': {
            if (action.clickCount === 1)
                return `Click ${action.selector}`;
            if (action.clickCount === 2)
                return `Double click ${action.selector}`;
            if (action.clickCount === 3)
                return `Triple click ${action.selector}`;
            return `${action.clickCount}× click`;
        }
        case 'fill':
            return `Fill ${action.selector}`;
        case 'setInputFiles':
            if (action.files?.length === 0)
                return `Clear selected files`;
            else
                return `Upload ${action.files?.join(', ')}`;
        case 'navigate':
            return `Go to ${action.url}`;
        case 'press':
            return (`Press ${action.key}` + (action.modifiers ? ' with modifiers' : ''));
        case 'select':
            return `Select ${action.options?.join(', ')}`;
        case 'assert':
            return `Assert ${action.selector} ${action.command}`;
    }
}
exports.actionTitle = actionTitle;
class SyntheticsGenerator extends javascript_1.JavaScriptLanguageGenerator {
    isProject;
    previousContext;
    insideStep;
    varsToHoist;
    constructor(isProject) {
        console.log('hi from constructor');
        super(true);
        this.isProject = isProject;
        this.insideStep = false;
        this.previousContext = undefined;
        this.varsToHoist = [];
    }
    /**
     * Generate code for an action.
     * @param actionInContext The action to create code for.
     * @returns the strings generated for the action.
     */
    generateAction(actionInContext) {
        const { action } = actionInContext;
        const { pageAlias } = actionInContext.frame;
        if (action.name === 'openPage') {
            return '';
        }
        // Don't cleanup page object managed by Synthetics
        const isCleanUp = action.name === 'closePage' && pageAlias === 'page';
        if (isCleanUp) {
            return '';
        }
        const stepIndent = this.insideStep ? 2 : 0;
        const offset = this.isProject ? 2 + stepIndent : 0 + stepIndent;
        const formatter = new javascript_1.JavaScriptFormatter(offset);
        let subject;
        if (actionInContext.frame.isMainFrame) {
            subject = pageAlias;
        }
        else if (actionInContext.frame.selectorsChain &&
            action.name !== 'navigate') {
            const locators = actionInContext.frame.selectorsChain.map(selector => `.frameLocator(${quote(selector)})`);
            subject = `${pageAlias}${locators.join('')}`;
        }
        else if (actionInContext.frame.name) {
            subject = `${pageAlias}.frame(${formatObject({
                name: actionInContext.frame.name,
            })})`;
        }
        else {
            subject = `${pageAlias}.frame(${formatObject({
                url: actionInContext.frame.url,
            })})`;
        }
        const signals = toSignalMap(action);
        if (signals.dialog) {
            formatter.add(`  ${pageAlias}.once('dialog', dialog => {
    console.log(\`Dialog message: $\{dialog.message()}\`);
    dialog.dismiss().catch(() => {});
  });`);
        }
        if (signals.popup)
            formatter.add(`const ${signals.popup.popupAlias}Promise = ${pageAlias}.waitForEvent('popup');`);
        if (signals.download)
            formatter.add(`const download${signals.download.downloadAlias}Promise = ${pageAlias}.waitForEvent('download');`);
        // Add assertion from Synthetics.
        const isAssert = action.name === 'assert' && action.isAssert;
        if (isAssert && action.command) {
            formatter.add(toAssertCall(pageAlias, action));
        }
        else {
            const actionCall = super._generateActionCall(action);
            formatter.add(`await ${subject}.${actionCall};`);
        }
        if (signals.popup)
            formatter.add(`${signals.popup.popupAlias} = await ${signals.popup.popupAlias}Promise;`);
        if (signals.download)
            formatter.add(`download${signals.download.downloadAlias} = await download${signals.download.downloadAlias}Promise;`);
        this.previousContext = actionInContext;
        return formatter.format();
    }
    isNewStep(actioninContext) {
        const { action, frame } = actioninContext;
        if (action.name === 'navigate') {
            return true;
        }
        else if (action.name === 'click') {
            return (this.previousContext?.frame.url === frame.url &&
                action.signals.length > 0);
        }
        return false;
    }
    generateStepStart(name) {
        this.insideStep = true;
        const formatter = new javascript_1.JavaScriptFormatter(this.getDefaultOffset());
        formatter.add(`step(${quote(name)}, async () => {`);
        return formatter.format();
    }
    generateStepEnd() {
        if (!this.insideStep) {
            return '';
        }
        this.insideStep = false;
        const formatter = new javascript_1.JavaScriptFormatter(this.getDefaultOffset());
        formatter.add(`});`);
        return formatter.format();
    }
    generateHeader() {
        const formatter = new javascript_1.JavaScriptFormatter(0);
        formatter.add(`
      const { journey, step, expect } = require('@elastic/synthetics');

      journey('Recorded journey', async ({ page, context }) => {`);
        return formatter.format();
    }
    generateFooter() {
        return `});`;
    }
    /**
     * Generates JavaScript code from a custom set of steps and nested actions.
     *
     * This function makes no assumptions about where steps should be created,
     * and instead follows the step definitions the caller has defined.
     * @param steps IR to use for code generation
     * @returns a list of the code strings outputted by the generator
     */
    generateFromSteps(steps) {
        console.log('hi from generate steps');
        return 'HEllo world';
        const text = [];
        if (this.isProject) {
            text.push(this.generateHeader());
        }
        this.varsToHoist = this.findVarsToHoist(steps);
        text.push(this.generateHoistedVars());
        for (const step of steps) {
            if (step.actions.length === 0)
                throw Error('Cannot process an empty step');
            const name = step.name ??
                step.actions[0].title ??
                actionTitle(step.actions[0].action);
            text.push(this.generateStepStart(name ?? ''));
            for (const action of step.actions) {
                const actionText = this.generateAction(action);
                if (actionText.length)
                    text.push(actionText);
            }
            text.push(this.generateStepEnd());
        }
        if (this.isProject) {
            text.push(this.generateFooter());
        }
        return text.filter(s => !!s).join('\n');
    }
    generateHoistedVars() {
        const formatter = new javascript_1.JavaScriptFormatter(this.getDefaultOffset());
        for (const varName of this.varsToHoist) {
            formatter.add(`let ${varName};`);
        }
        return formatter.format();
    }
    isVarHoisted(varName) {
        return this.varsToHoist.indexOf(varName) >= 0;
    }
    getDefaultOffset() {
        return this.isProject ? 2 : 0;
    }
    /**
     * We need to hoist any page or popup alias that appears in more than one step.
     * @param steps the step IR to evaluate
     * @returns an array that contains the names of all variables that need to be hoisted
     */
    findVarsToHoist(steps) {
        const aliasSet = new Set();
        for (const step of steps) {
            for (const actionContext of step.actions) {
                actionContext.action.signals
                    .filter(({ name, popupAlias }) => name === 'popup' && popupAlias)
                    .forEach(({ popupAlias }) => aliasSet.add(popupAlias));
                aliasSet.add(actionContext.frame.pageAlias);
            }
        }
        return Array.from(aliasSet).filter(alias => alias !== 'page');
    }
}
exports.SyntheticsGenerator = SyntheticsGenerator;
//# sourceMappingURL=javascript.js.map