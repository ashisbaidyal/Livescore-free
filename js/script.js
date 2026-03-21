// --- CONSTANTS ---
const API_BASE = '/api/live'; 
const SPORTS = [
  { id: 'all', name: 'All' },
  { id: 'football', name: 'Football' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'tennis', name: 'Tennis' }
];

let currentTab = 'all';
let autoRefreshTimer = null;

// --- DOM ELEMENTS ---
const tabsContainer = document.getElementById('sports-tabs');
const matchesContainer = document.getElementById('matches-container');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  if (tabsContainer && matchesContainer) {
    renderTabs();
    fetchMatches();
    startAutoRefresh();
  }
});

// --- RENDER TABS ---
function renderTabs() {
  tabsContainer.innerHTML = SPORTS.map(sport => `
    <button 
      onclick="switchTab('${sport.id}')"
      class="px-5 py-2 whitespace-nowrap rounded-full text-sm font-bold uppercase tracking-wider transition-colors border
      ${currentTab === sport.id 
        ? 'bg-foreground text-surface border-foreground' 
        : 'bg-surface-soft text-muted border-line hover:border-brand/40'
      }"
    >
      ${sport.name}
    </button>
  `).join('');
}

// --- TAB SWITCHING ---
window.switchTab = function(tabId) {
  currentTab = tabId;
  renderTabs();
  
  // Show skeleton loader
  matchesContainer.innerHTML = Array(4).fill(`
    <div class="bg-surface rounded-xl border border-line p-5 w-full animate-pulse h-40"></div>
  `).join('');

  fetchMatches();
}

// --- FETCH & UPDATE DATA ---
async function fetchMatches() {
  try {
    const res = await fetch(`${API_BASE}?sport=${currentTab}`);
    const data = await res.json();
    renderMatches(data.matches || []);
  } catch (err) {
    console.error('Failed to fetch matches:', err);
    matchesContainer.innerHTML = `
      <div class="col-span-full py-12 text-center bg-surface-soft rounded-xl border border-line">
        <p class="text-muted font-sans flex items-center justify-center gap-2">
          <i data-lucide="alert-triangle" class="w-5 h-5 text-accent"></i> Failed to connect to live network. Retrying...
        </p>
      </div>
    `;
    lucide.createIcons();
  }
}

// --- RENDER MATCH CARDS ---
function renderMatches(matches) {
  if (matches.length === 0) {
    matchesContainer.innerHTML = `
      <div class="col-span-full py-12 text-center bg-surface-soft rounded-xl border border-line">
        <p class="text-muted font-sans font-bold uppercase tracking-wider">No active fixtures right now</p>
      </div>
    `;
    return;
  }

  matchesContainer.innerHTML = matches.map(match => {
    const isLive = match.status === 'live';
    const timeDisplay = isLive 
      ? `<span class="text-accent font-bold animate-pulse-fast ml-auto">${match.time}</span>` 
      : `<span class="text-muted ml-auto">${match.time}</span>`;

    return `
      <a href="/match.html?id=${match.id}" class="block group cursor-pointer h-full">
        <div class="bg-surface h-full rounded-xl p-5 border ${isLive ? 'border-accent/40 shadow-[0_0_15px_rgba(255,94,91,0.1)]' : 'border-line'} hover:border-brand/40 transition-colors">
          
          <div class="flex items-center justify-between mb-4 text-xs font-bold tracking-widest uppercase">
            <div class="flex items-center gap-2 text-muted">
              ${isLive ? '<div class="w-2 h-2 rounded-full bg-accent animate-pulse-fast"></div>' : ''}
              ${match.league || 'Int. Friendly'}
            </div>
          </div>
          
          <div class="space-y-4">
            <!-- Home Team -->
            <div class="flex items-center gap-3">
              <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}" class="w-8 h-8 object-contain" onerror="this.src='/public/logo.png'">
              <span class="font-display font-medium text-lg leading-none ${isLive ? 'text-foreground' : 'text-muted'}">${match.homeTeam.name}</span>
              ${isLive || match.status === 'finished' ? `<span class="ml-auto font-display font-bold text-2xl leading-none text-foreground">${match.homeTeam.score}</span>` : ''}
            </div>
            
            <!-- Away Team -->
            <div class="flex items-center gap-3">
              <img src="${match.awayTeam.logo}" alt="${match.awayTeam.name}" class="w-8 h-8 object-contain" onerror="this.src='/public/logo.png'">
              <span class="font-display font-medium text-lg leading-none ${isLive ? 'text-foreground' : 'text-muted'}">${match.awayTeam.name}</span>
              ${isLive || match.status === 'finished' ? `<span class="ml-auto font-display font-bold text-2xl leading-none text-foreground">${match.awayTeam.score}</span>` : timeDisplay}
            </div>
          </div>

        </div>
      </a>
    `;
  }).join('');

  lucide.createIcons();
}

// --- AUTO-REFRESH (15s) ---
function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => {
    fetchMatches();
  }, 15000);
}
