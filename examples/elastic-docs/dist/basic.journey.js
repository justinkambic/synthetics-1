"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const synthetics_1 = require("@elastic/synthetics");
const common_1 = require("./common");
const expect = require("expect");
synthetics_1.journey('Navigate to docs', () => {
    common_1.goToElasticHome();
    synthetics_1.step('hover on learn', async ({ page }) => {
        await page.hover('[data-nav-item=learn]');
    });
    synthetics_1.step('click on docs in menu', async ({ page }) => {
        await page.click('a[href="/guide"]');
    });
});
synthetics_1.journey('check that docs mention cloud', () => {
    common_1.goToDocsHome();
    synthetics_1.step('check for expected product titles', async ({ page }) => {
        expect(await page.innerHTML('body')).toMatch(/cloud/i);
    });
});
//# sourceMappingURL=basic.journey.js.map