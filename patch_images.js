const fs = require('fs');
let content = fs.readFileSync('js/ui-pages.js', 'utf8');

const regexMap = [
  // Context 1: Hero bg in renderHomePage / renderTrendingPage / renderSchedulesHubPage
  { regex: /url\('https:\/\/images.unsplash.com\/photo-1574629810360-7efbbe195018\?[^']+'\)/g, replacement: "url('/bg-stadium-night-1.svg')" },
  // Context 2: News items placeholder image (item.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076')
  { regex: /'https:\/\/images\.unsplash\.com\/photo-1574629810360-7efbbe195018\?[^']+'/g, replacement: "getSportImagePath('football')" },
  // Context 3: Top leagues directory header
  { regex: /"https:\/\/images\.unsplash\.com\/photo-1574629810360-7efbbe195018\?[^"]+"/g, replacement: "getSportImagePath('football')" },
  // Context 4: Upcoming match overlay
  { regex: /"https:\/\/images\.unsplash\.com\/photo-1540747913346-19e3adcc174b\?[^"]+"/g, replacement: "getSportImagePath('football')" },
  // Context 5: News detail hero
  { regex: /"https:\/\/images\.unsplash\.com\/photo-1517466787929-bc90951d0974\?[^"]+"/g, replacement: "'/bg-stadium-night-2.svg'" },
  // Context 6: Other placeholders
  { regex: /"https:\/\/images\.unsplash\.com\/photo-1543351611-[^"]+"/g, replacement: "'/bg-stadium-day-1.svg'" },
  { regex: /"https:\/\/images\.unsplash\.com\/photo-1577223625816-[^"]+"/g, replacement: "'/bg-stadium-night-3.svg'" },
  { regex: /url\('https:\/\/images\.unsplash\.com\/photo-1504450758481-[^']+'\)/g, replacement: "url('/bg-stadium-night-2.svg')" },
  { regex: /"https:\/\/images\.unsplash\.com\/photo-1540747913346-19e32dc3e97e\?[^"]+"/g, replacement: "'/bg-stadium-day-2.svg'" },
  { regex: /url\('https:\/\/images\.unsplash\.com\/photo-1489944440615-[^']+'\)/g, replacement: "url('/bg-stadium-night-3.svg')" },
  { regex: /url\('https:\/\/images\.unsplash\.com\/photo-1431324155629-[^']+'\)/g, replacement: "url('/bg-stadium-day-3.svg')" }
];

let patches = 0;
regexMap.forEach(rule => {
  const matches = content.match(rule.regex);
  if (matches) {
    patches += matches.length;
    content = content.replace(rule.regex, rule.replacement);
  }
});

fs.writeFileSync('js/ui-pages.js', content, 'utf8');
console.log(`Successfully patched ${patches} occurrences of unsplash placeholder URLs in ui-pages.js`);
