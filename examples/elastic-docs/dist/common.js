"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const synthetics_1 = require("@elastic/synthetics");
exports.goToElasticHome = () => {
    synthetics_1.step('go to elastic homepage', async ({ page }) => {
        await page.goto('https://www.elastic.co');
    });
};
exports.goToDocsHome = () => {
    synthetics_1.step('go to elastic homepage', async ({ page }) => {
        await page.goto('https://www.elastic.co/guide/index.html');
    });
};
//# sourceMappingURL=common.js.map