const fs = require('fs');
const path = require('path');

const srcDir = 'd:/YTB/livescorefree-v2-production/lsf';
const indexFile = path.join(srcDir, 'index.html');
const tempStitchFile = path.join(srcDir, 'temp_stitch.html');
const uiPagesFile = path.join(srcDir, 'js/ui-pages.js');
const uiCoreFile = path.join(srcDir, 'js/ui-core.js');

const stitchHtml = fs.readFileSync(tempStitchFile, 'utf8');

// Extract parts from stitched file
const headMatch = stitchHtml.match(/<head>([\s\S]*?)<\/head>/i);
const headContent = headMatch ? headMatch[1] : '';

const navMatch = stitchHtml.match(/(<nav class="fixed top-0 w-full z-50[^>]*>[\s\S]*?<\/nav>)/i);
const topNav = navMatch ? navMatch[1] : '';

const sidebarMatch = stitchHtml.match(/(<aside class="hidden lg:flex[^>]*>[\s\S]*?<\/aside>)/i);
const sideNav = sidebarMatch ? sidebarMatch[1] : '';

const footerMatch = stitchHtml.match(/(<footer class="w-full border-t border-white\/10[^>]*>[\s\S]*?<\/footer>)/i);
const footer = footerMatch ? footerMatch[1] : '';

const mainMatch = stitchHtml.match(/<main class="flex-1 w-full bg-surface">([\s\S]*?)<\/main>/i);
let mainContent = mainMatch ? mainMatch[1] : '';

// 1. Update index.html
let indexHtml = fs.readFileSync(indexFile, 'utf8');

// Inject tailwind stuff in head
indexHtml = indexHtml.replace('</head>', `
<!-- Tailwind & Fonts from Design System -->
${headContent}
</head>`);

// Replace body start to main start
const bodyStart = indexHtml.indexOf('<header class="site-header">');
const mainStart = indexHtml.indexOf('<main class="main" id="main" aria-live="polite"></main>');

if (bodyStart !== -1 && mainStart !== -1) {
    const layoutWrapperStart = `\n<div class="flex pt-16 min-h-screen">\n${sideNav}\n`;
    indexHtml = indexHtml.substring(0, bodyStart) 
                + topNav 
                + layoutWrapperStart
                + '<main class="flex-1 w-full bg-surface" id="main" aria-live="polite"></main>\n'
                + indexHtml.substring(mainStart + '<main class="main" id="main" aria-live="polite"></main>'.length);
}

// Replace footer
const footerOldStart = indexHtml.indexOf('<footer class="site-footer" id="main-footer">');
const appDockStart = indexHtml.indexOf('<nav class="app-dock" aria-label="Mobile primary">');

if (footerOldStart !== -1 && appDockStart !== -1) {
    indexHtml = indexHtml.substring(0, footerOldStart)
                + '\n</div><!-- End layout flex -->\n'
                + footer
                + '\n'
                + indexHtml.substring(appDockStart);
}

// Ensure the old CSS continues to work but Tailwind is injected
// Rename livescoreFree.online text where present to Match

fs.writeFileSync(indexFile, indexHtml);

// 2. Wrap main content inside ui-pages.js renderHomePage
let uiPagesHtml = fs.readFileSync(uiPagesFile, 'utf8');

// We replace the renderHomePage body
const homePageFnStartRegex = /async function renderHomePage\(container\) \{[\s\S]*?\/\/\s*livescoreFree\.online Layout Construction/m;
const matchStart = uiPagesHtml.match(homePageFnStartRegex);

if (matchStart) {
   let startIdx = matchStart.index + matchStart[0].length;
   // we have to replace the container.innerHTML = ` ... `; 
   const innerHtmlRegex = /container\.innerHTML\s*=\s*`([\s\S]*?)`;/;
   const innerMatch = uiPagesHtml.substring(startIdx).match(innerHtmlRegex);
   if (innerMatch) {
       // Replace the content with temp_stitch.html content wrapped in template generic 
       // We keep `mainContent` as string but escape backticks
       let escapedContent = mainContent.replace(/\`/g, '\\`').replace(/\$\{/g, '\\${');
       
       const replaceContent = `container.innerHTML = \`\n${escapedContent}\n\`;`;
       uiPagesHtml = uiPagesHtml.substring(0, startIdx + innerMatch.index) + replaceContent + uiPagesHtml.substring(startIdx + innerMatch.index + innerMatch[0].length);
       fs.writeFileSync(uiPagesFile, uiPagesHtml);
   }
}

// 3. Rename any occurrences of "GoalStream" or "GOALSTREAM" to "LivescoreFree.Online"
function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let replaced = content.replace(/GOALSTREAM/g, 'LIVESCOREFREE.ONLINE');
    replaced = replaced.replace(/GoalStream/g, 'LivescoreFree.Online');
    if (content !== replaced) {
        fs.writeFileSync(filePath, replaced);
    }
}

replaceInFile(indexFile);
replaceInFile(uiPagesFile);
replaceInFile(uiCoreFile);
replaceInFile(path.join(srcDir, 'styles.css'));

console.log("Migration Complete.");
