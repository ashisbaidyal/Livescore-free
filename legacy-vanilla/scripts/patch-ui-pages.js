const fs = require('fs');

const uiPagesPath = 'd:/YTB/livescorefree-v2-production/lsf/js/ui-pages.js';
const newRenderPath = 'd:/YTB/livescorefree-v2-production/lsf/scripts/new-render.js';

let uiPages = fs.readFileSync(uiPagesPath, 'utf8');
let newRender = fs.readFileSync(newRenderPath, 'utf8');

const startStr = 'async function renderHomePage(container) {';
const endStr = 'function renderLsfHero(match) {';

const startIdx = uiPages.indexOf(startStr);
const endIdx = uiPages.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    uiPages = uiPages.substring(0, startIdx) + newRender + "\n\n" + uiPages.substring(endIdx);
    fs.writeFileSync(uiPagesPath, uiPages);
    console.log("Successfully patched js/ui-pages.js");
} else {
    console.log("Failed to find start or end bounds.");
}
