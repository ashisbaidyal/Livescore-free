const fs = require('fs');
let c = fs.readFileSync('js/ui-pages.js', 'utf8');

c = c.replace(
  'class="group bg-surface-container-high rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative"',
  'data-sport-group="${m.sportGroup}" class="live-match-card-item group bg-surface-container-high rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative"'
);

c = c.replace(
  '<div class="col-span-full py-32 text-center flex flex-col items-center gap-6 opacity-20">',
  '<div id="live-empty-state" class="col-span-full py-32 text-center flex flex-col items-center gap-6 opacity-20">'
);

fs.writeFileSync('js/ui-pages.js', c);
console.log('Patched HTML templates.');
