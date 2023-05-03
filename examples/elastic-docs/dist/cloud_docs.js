"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const synthetics_1 = require("@elastic/synthetics");
const common_1 = require("./common");
const expect = require("expect");
synthetics_1.journey('a failing journey', () => {
    common_1.goToDocsHome();
    synthetics_1.step('check for value that does not exist product titles', async ({ page }) => {
        expect(await page.innerHTML('body')).toMatch(/thisstringisnotinthepageiguaranteeit/);
    });
});
//# sourceMappingURL=cloud_docs.js.map