"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const synthetics_1 = require("@elastic/synthetics");
synthetics_1.journey({ name: 'Old Login' }, () => {
    synthetics_1.step('Go to home page', async ({ page, params }) => {
        await page.goto(params.homepage);
    });
    synthetics_1.step('Go to login page', async ({ page }) => {
        await page.click('a');
    });
    synthetics_1.step('Enter username and password', async ({ page }) => {
        await page.fill('input[name=username]', 'hamid');
        await page.fill('input[name=password]', 'test-pass');
    });
    synthetics_1.step('submit form', async ({ page }) => {
        await (await page.$('form')).evaluate(form => form.submit());
    });
});
synthetics_1.journey({ name: 'New Login' }, () => {
    synthetics_1.step('Go to home page', async ({ page, params }) => {
        await page.goto(params.homepage);
    });
    synthetics_1.step('Go to login page', async ({ page }) => {
        await page.click('a');
    });
});
synthetics_1.journey('Visit a non-existant page', () => {
    synthetics_1.step('go to home', async ({ page, params }) => {
        await page.goto(params.homepage);
    });
    synthetics_1.step('go to home', async ({ page, params }) => {
        await page.goto(params.homepage + '/non-existant');
    });
});
//# sourceMappingURL=test.journey.js.map