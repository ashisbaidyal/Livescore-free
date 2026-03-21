const fs = require('fs');
let code = fs.readFileSync('js/ui-pages.js', 'utf8');

code = code.replace(
  '<button class="text-primary border-b-2 border-primary pb-1 font-black text-[10px] tracking-widest uppercase">ALL SPORTS</button>',
  '<button onclick="window.filterLiveCategory(\'all\', event)" class="live-filter-btn active text-primary border-b-2 border-primary pb-1 font-black text-[10px] tracking-widest uppercase" data-sport="all">ALL SPORTS</button>'
).replace(
  '<a href="/sport/${key}" data-link class="text-on-surface/50 hover:text-primary font-bold text-[10px] tracking-widest uppercase transition-colors">${escapeHtml(sport.label)}</a>',
  '<button onclick="window.filterLiveCategory(\'${key}\', event)" class="live-filter-btn text-on-surface/50 hover:text-primary pb-1 font-bold text-[10px] tracking-widest uppercase transition-colors" data-sport="${key}">${escapeHtml(sport.label)}</button>'
);

fs.writeFileSync('js/ui-pages.js', code);
console.log('Patched Filter Nav correctly.');
