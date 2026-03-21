const fs = require("fs");
let c = fs.readFileSync("js/ui-pages.js", "utf8");

c = c.replace(
  `<span class="text-[9px] font-bold text-on-surface/40 uppercase mt-1 tracking-widest">\${escapeHtml(m.statusLabel || 'Live')}</span>`,
  `<span class="text-[9px] font-bold text-on-surface/40 uppercase mt-1 tracking-widest" id="match-\${m.sportGroup}-\${m.slug}-status">\${escapeHtml(m.statusLabel || 'Live')}</span>`
);

c = c.replace(
  `<span class="text-primary font-black text-xs italic tracking-tighter">\${m.statusDetail || 'In Progress'}</span>`,
  `<span class="text-primary font-black text-xs italic tracking-tighter" id="match-\${m.sportGroup}-\${m.slug}-status-detail">\${m.statusDetail || 'In Progress'}</span>`
);

c = c.replace(
  `<span class="text-3xl font-black italic text-primary">\${m.homeScore || 0}</span>`,
  `<span class="text-3xl font-black italic text-primary" id="match-\${m.sportGroup}-\${m.slug}-home-score">\${m.homeScore || 0}</span>`
);

c = c.replace(
  `<span class="text-3xl font-black italic text-primary">\${m.awayScore || 0}</span>`,
  `<span class="text-3xl font-black italic text-primary" id="match-\${m.sportGroup}-\${m.slug}-away-score">\${m.awayScore || 0}</span>`
);

fs.writeFileSync("js/ui-pages.js", c);
console.log("Patch successfully applied with backticks.");
