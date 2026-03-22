// --- CONSTANTS ---
const API_LIVE = '/api/live'; 
const API_MATCH = '/api/match';
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
const sidebarLiveContainer = document.getElementById('sidebar-live-container');

// Specific Match Detail Elements
const homeTeamName = document.getElementById('home-team-name');
const awayTeamName = document.getElementById('away-team-name');
const homeTeamLogo = document.getElementById('home-team-logo');
const awayTeamLogo = document.getElementById('away-team-logo');
const homeScore = document.getElementById('home-score');
const awayScore = document.getElementById('away-score');
const matchClock = document.getElementById('match-clock');
const statsContainer = document.getElementById('stats-container');
const timelineContainer = document.getElementById('timeline-container');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // --- HEADER & NAVIGATION LOGIC ---
  const path = window.location.pathname;
  const fileName = path.split('/').pop() || 'index.html';
  
  // 1. Highlight Active Sidebar Link
  const sidebarLinks = document.querySelectorAll('aside nav a');
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (fileName === href || (fileName === 'index.html' && href === '/'))) {
      link.classList.remove('text-on-surface/60');
      link.classList.add('text-primary', 'bg-white/5', 'border-l-2', 'border-primary', 'pl-5');
      link.style.paddingLeft = '1.25rem';
    }
  });

  // 2. Highlight Active Top Nav Link (Glow Effect)
  const topNavLinks = document.querySelectorAll('#top-nav-links a');
  topNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (fileName === href || (fileName === 'index.html' && href === '/'))) {
      link.classList.remove('text-on-surface/60');
      link.classList.add('text-primary', 'border-b-2', 'border-primary', 'pb-1');
    }
  });

  // 3. Header Scroll Behavior (Hide on scroll down, show on scroll up)
  const header = document.getElementById('main-header');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  let lastScrollTop = 0;
  
  // Toggle Sidebar Function
  const toggleSidebar = (show) => {
    if (show) {
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.add('translate-x-0');
      sidebarOverlay.classList.remove('hidden');
      setTimeout(() => {
        sidebarOverlay.classList.remove('opacity-0');
        sidebarOverlay.classList.add('opacity-100');
      }, 10);
    } else {
      sidebar.classList.remove('translate-x-0');
      sidebar.classList.add('-translate-x-full');
      sidebarOverlay.classList.remove('opacity-100');
      sidebarOverlay.classList.add('opacity-0');
      setTimeout(() => {
        sidebarOverlay.classList.add('hidden');
      }, 300);
    }
  };

  if (sidebarToggle && sidebar && sidebarOverlay) {
    sidebarToggle.addEventListener('click', () => toggleSidebar(true));
    sidebarOverlay.addEventListener('click', () => toggleSidebar(false));
  }
  
  if (header) {
    window.addEventListener('scroll', () => {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        header.style.transform = 'translateY(-100%)';
        // Auto-close sidebar on scroll if open
        if (sidebar && sidebar.classList.contains('translate-x-0')) toggleSidebar(false);
      } else {
        // Scrolling up
        header.style.transform = 'translateY(0)';
      }
      lastScrollTop = Math.max(0, scrollTop);
    }, { passive: true });
  }

  // 4. Sidebar Item "Team Profile" Animation
  const navItems = document.querySelectorAll('aside nav a');
  navItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateX(8px)';
      item.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      const icon = item.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.style.transform = 'scale(1.2) rotate(5deg)';
        icon.style.color = '#FF1E1E';
      }
    });
    item.addEventListener('mouseleave', () => {
      if (!item.classList.contains('text-primary')) {
        item.style.transform = 'translateX(0)';
        item.style.backgroundColor = 'transparent';
        const icon = item.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.style.transform = 'scale(1) rotate(0deg)';
          icon.style.color = '';
        }
      } else {
        item.style.transform = 'translateX(0)';
      }
    });

    // Touch support for mobile "auto" animation feel
    item.addEventListener('touchstart', () => {
      item.style.backgroundColor = 'rgba(204, 22, 22, 0.1)';
    }, { passive: true });
    item.addEventListener('touchend', () => {
      item.style.backgroundColor = '';
    }, { passive: true });
  });

  // Check for dynamic match detail first
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('id');
  
  if (matchId && homeTeamName) {
    fetchMatchDetail(matchId);
    startAutoRefresh(() => fetchMatchDetail(matchId));
    // Also fetch sidebar live scores
    fetchMatches(null, true);
    return;
  }

  // Handle Hub Pages (Home, Live, Upcoming, Trending, Results)
  if (matchesContainer || sidebarLiveContainer) {
    if (tabsContainer) renderTabs();
    
    // Determine page filter
    let statusFilter = null;
    if (path.includes('live.html')) statusFilter = 'live';
    if (path.includes('upcoming.html')) statusFilter = 'upcoming';
    if (path.includes('results.html')) statusFilter = 'finished';

    fetchMatches(statusFilter);
    startAutoRefresh(() => fetchMatches(statusFilter));
  }

  // News Hub logic (placeholder for now)
  const newsContainer = document.getElementById('news-container');
  if (newsContainer) {
    newsContainer.innerHTML = '<div class="col-span-full py-20 text-center opacity-50 font-black uppercase tracking-widest text-xs">Loading Kinetic News Stream...</div>';
  }
});

// --- RENDER TABS ---
function renderTabs() {
  if (!tabsContainer) return;
  tabsContainer.innerHTML = SPORTS.map(sport => `
    <button 
      onclick="switchTab('${sport.id}')"
      class="flex items-center gap-2 px-4 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-all
      ${currentTab === sport.id 
        ? 'bg-primary text-white' 
        : 'bg-white/5 text-on-surface/60 hover:bg-white/10 hover:text-white'
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
  
  if (matchesContainer) {
    matchesContainer.innerHTML = Array(3).fill(`
      <div class="bg-surface-container border border-white/5 p-6 rounded-lg animate-pulse h-48"></div>
    `).join('');
  }

  fetchMatches();
}

// --- FETCH & UPDATE HOME DATA ---
async function fetchMatches(statusFilter = null, sidebarOnly = false) {
  try {
    const res = await fetch(`${API_LIVE}?sport=${currentTab}`);
    const data = await res.json();
    let matches = data.matches || [];
    
    // Always render sidebar live scores if container exists
    if (sidebarLiveContainer) {
      const liveMatches = matches.filter(m => m.status === 'live').slice(0, 5);
      renderSidebarLive(liveMatches);
    }

    if (sidebarOnly) return;

    if (statusFilter) {
      matches = matches.filter(m => m.status === statusFilter);
    }
    
    renderMatches(matches);
  } catch (err) {
    console.error('Failed to fetch matches:', err);
    if (!sidebarOnly && matchesContainer) {
      matchesContainer.innerHTML = `
        <div class="col-span-full py-12 text-center bg-surface-container rounded-lg border border-white/5">
          <p class="text-on-surface/40 font-black uppercase tracking-widest text-[10px]">Failed to fetch matches. Retrying...</p>
        </div>
      `;
    }
  }
}

// --- RENDER SIDEBAR LIVE ---
function renderSidebarLive(matches) {
  if (!sidebarLiveContainer) return;

  if (matches.length === 0) {
    sidebarLiveContainer.innerHTML = `
      <div class="py-4 text-center opacity-30 text-[9px] font-black uppercase tracking-widest">No Live Matches</div>
    `;
    return;
  }

  sidebarLiveContainer.innerHTML = matches.map(match => `
    <a href="/match.html?id=${match.id}" class="flex flex-col gap-2 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group">
      <div class="flex justify-between items-center">
        <span class="text-[8px] font-black text-primary uppercase italic tracking-tighter">${match.league || 'LIVE'}</span>
        <span class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col gap-1 flex-1">
          <div class="flex items-center gap-2">
            <img src="${match.homeTeam.logo}" class="w-3 h-3 object-contain opacity-70" onerror="this.src='/public/logo.png'">
            <span class="text-[9px] font-bold text-on-surface/80 truncate">${match.homeTeam.name}</span>
          </div>
          <div class="flex items-center gap-2">
            <img src="${match.awayTeam.logo}" class="w-3 h-3 object-contain opacity-70" onerror="this.src='/public/logo.png'">
            <span class="text-[9px] font-bold text-on-surface/80 truncate">${match.awayTeam.name}</span>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[10px] font-black text-primary">${match.homeTeam.score}</div>
          <div class="text-[10px] font-black text-primary">${match.awayTeam.score}</div>
        </div>
      </div>
    </a>
  `).join('');
}

// --- FETCH & UPDATE MATCH DETAIL ---
async function fetchMatchDetail(id) {
  try {
    const res = await fetch(`${API_MATCH}?id=${id}`);
    const data = await res.json();
    renderMatchDetail(data);
  } catch (err) {
    console.error('Failed to fetch match detail:', err);
  }
}

// --- RENDER MATCH CARDS (HOME) ---
function renderMatches(matches) {
  if (!matchesContainer) return;

  if (matches.length === 0) {
    matchesContainer.innerHTML = `
      <div class="col-span-full py-12 text-center bg-surface-container rounded-lg border border-white/5">
        <p class="text-on-surface/40 font-black uppercase tracking-widest text-[10px]">No active matches found.</p>
      </div>
    `;
    return;
  }

  matchesContainer.innerHTML = matches.map(match => {
    const isLive = match.status === 'live';
    const isFinished = match.status === 'finished';
    
    const statusLabel = isLive 
      ? `<span class="flex items-center gap-1.5 bg-primary text-white px-2.5 py-1 rounded-sm text-[9px] font-black italic">
          <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
         </span>` 
      : isFinished 
      ? `<span class="flex items-center gap-1.5 bg-white/10 text-white/50 px-2.5 py-1 rounded-sm text-[9px] font-black italic">FINAL</span>`
      : `<span class="flex items-center gap-1.5 bg-white/10 text-white/50 px-2.5 py-1 rounded-sm text-[9px] font-black italic">UPCOMING</span>`;

    return `
      <a href="/match.html?id=${match.id}" class="block group h-full">
        <div class="bg-surface-container border border-white/5 p-6 rounded-lg flex flex-col gap-6  
                    hover:border-primary/50 transition-all shadow-2xl relative overflow-hidden h-full">
          
          ${isLive ? '<div class="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none"></div>' : ''}
          
          <div class="flex justify-between items-center relative">
            <div class="flex items-center gap-2">
              <span class="${isLive ? 'text-primary' : 'text-on-surface/50'} font-black italic text-[10px] tracking-widest truncate max-w-[150px]">
                ${match.league || 'Event'}
              </span>
            </div>
            ${statusLabel}
          </div>
          
          <div class="flex justify-between items-center relative flex-1">
            <div class="flex flex-col items-center gap-3 w-1/3">
              <div class="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-black italic">
                <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}" class="w-8 h-8 object-contain" onerror="this.src='/public/logo.png'">
              </div>
              <span class="text-[10px] font-black uppercase italic tracking-tighter text-center line-clamp-2">
                ${match.homeTeam.name}
              </span>
            </div>
            
            <div class="flex flex-col items-center justify-center">
              ${isLive || isFinished 
                ? `<span class="text-4xl font-black italic ${isLive ? 'text-primary' : 'text-on-surface/50'}">${match.homeTeam.score} - ${match.awayTeam.score}</span>`
                : `<span class="text-4xl font-black italic text-on-surface/20">VS</span>`
              }
              <span class="text-[10px] font-black text-on-surface-variant mt-2 tracking-widest uppercase truncate max-w-[80px]">
                ${match.time}
              </span>
            </div>
            
            <div class="flex flex-col items-center gap-3 w-1/3">
              <div class="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-black italic">
                <img src="${match.awayTeam.logo}" alt="${match.awayTeam.name}" class="w-8 h-8 object-contain" onerror="this.src='/public/logo.png'">
              </div>
              <span class="text-[10px] font-black uppercase italic tracking-tighter text-center line-clamp-2">
                ${match.awayTeam.name}
              </span>
            </div>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

// --- RENDER MATCH DETAILS ---
function renderMatchDetail(data) {
  if (!homeTeamName) return;

  homeTeamName.textContent = data.homeTeam.name || 'Team A';
  awayTeamName.textContent = data.awayTeam.name || 'Team B';
  homeTeamLogo.src = data.homeTeam.logo || '/public/logo.png';
  awayTeamLogo.src = data.awayTeam.logo || '/public/logo.png';
  homeScore.textContent = data.homeTeam.score !== undefined ? data.homeTeam.score : '0';
  awayScore.textContent = data.awayTeam.score !== undefined ? data.awayTeam.score : '0';
  matchClock.textContent = data.time || 'LIVE';

  if (statsContainer && data.stats && data.stats.length > 0) {
    statsContainer.innerHTML = data.stats.map(stat => {
      const homeVal = parseFloat(stat.home) || 0;
      const awayVal = parseFloat(stat.away) || 0;
      const total = homeVal + awayVal || 1;
      const homePercent = (homeVal / total) * 100;
      const awayPercent = (awayVal / total) * 100;

      return `
        <div class="space-y-2">
          <div class="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
            <span>${stat.label}</span>
            <span class="text-primary">${stat.home} — ${stat.away}</span>
          </div>
          <div class="h-1.5 w-full bg-white/5 flex rounded-full overflow-hidden">
            <div class="h-full bg-on-surface" style="width: ${homePercent}%"></div>
            <div class="h-full bg-primary" style="width: ${awayPercent}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  if (timelineContainer && data.timeline && data.timeline.length > 0) {
    timelineContainer.innerHTML = `
      <div class="absolute left-0 right-0 h-0.5 bg-white/5 top-1/2 -translate-y-1/2"></div>
      <div class="relative flex justify-between items-center px-4 w-full overflow-x-auto gap-8">
        ${data.timeline.map(event => `
          <div class="flex flex-col items-center relative min-w-[60px]">
            <span class="material-symbols-outlined text-primary text-xl mb-1 ${event.type === 'goal' ? 'animate-bounce' : ''}" 
                  style="font-variation-settings: 'FILL' 1;">
              ${event.type === 'goal' ? 'sports_soccer' : (event.type === 'card' ? 'style' : 'history')}
            </span>
            <div class="w-1.5 h-1.5 rounded-full bg-white/20"></div>
            <span class="text-[8px] font-black mt-2 text-primary uppercase tracking-tighter text-center">
              ${event.time}' ${event.player || ''}
            </span>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// --- AUTO-REFRESH (15s) ---
function startAutoRefresh(callback) {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => {
    callback();
  }, 15000);
}
