// --- CONSTANTS ---
// Navigation Functions (Consolidated below)

const API_LIVE = '/api/live';
const API_MATCH = '/api/match';
const API_UPCOMING = '/api/upcoming';
const SPORTS = [
  { id: 'all', name: 'All' },
  { id: 'soccer', name: 'Soccer' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'american-football', name: 'NFL' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'hockey', name: 'Hockey' },
  { id: 'baseball', name: 'Baseball' },
  { id: 'mma', name: 'MMA' },
  { id: 'racing', name: 'Racing' },
  { id: 'golf', name: 'Golf' }
];

let currentTab = 'all';
let currentArenaTab = 'all'; // Filter for the Arena section
let currentPageFilter = 'live'; // Added globally to track page-specific selection (live, upcoming, finished)
let autoRefreshTimer = null;
let activeMatchTimer = {
  baseMs: 0,
  syncTime: 0,
  isRunning: false,
  sport: 'soccer'
};

// --- DOM ELEMENTS ---
const tabsContainer = document.getElementById('sports-tabs');
const matchesContainer = document.getElementById('matches-container');
const sidebarLiveContainer = document.getElementById('sidebar-live-container');
const tickerContainer = document.getElementById('ticker-container');
const newsContainer = document.getElementById('news-grid-container');
const headlinesContainer = document.getElementById('latest-headlines-container');
const heroSliderContainer = document.getElementById('hero-slider-container');
const leaguesContainer = document.getElementById('leagues-container');
const playersContainer = document.getElementById('players-container');
const trendingUpcomingContainer = document.getElementById('trending-upcoming-container');
const trendingMatchesList = document.getElementById('trending-matches-list');
const recentResultsContainer = document.getElementById('recent-results-container');
const upcomingTodayContainer = document.getElementById('upcoming-today-container');
const upcomingPrev = document.getElementById('upcoming-prev');
const upcomingNext = document.getElementById('upcoming-next');

const topTierContainer = document.getElementById('top-tier-container');
const combatSportsContainer = document.getElementById('combat-sports-container');
const europeanSoccerContainer = document.getElementById('european-soccer-container');
const API_INFO = '/api/info';

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
const commentaryContainer = document.getElementById('commentary-container');
const oddsPromoTitle = document.getElementById('odds-promo-title');
const betHomeTeam = document.getElementById('bet-home-team');
const betHomeOdds = document.getElementById('bet-home-odds');
const betAwayTeam = document.getElementById('bet-away-team');
const betAwayOdds = document.getElementById('bet-away-odds');
const betDrawOdds = document.getElementById('bet-draw-odds');
const betDrawContainer = document.getElementById('bet-draw-container');
const matchLeagueInfo = document.getElementById('match-league-info');
const statsDots = document.getElementById('stats-dots');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // --- HEADER & NAVIGATION LOGIC ---
  const path = window.location.pathname;
  const fileName = path.split('/').pop() || 'index.html';

  // 1. Highlight Active Sidebar Link (Universal Matcher)
  const sidebarLinks = document.querySelectorAll('aside nav a');
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const cleanHref = href.replace('.html', '').replace('/', '') || 'index';
      const cleanFileName = fileName.replace('.html', '').replace('/', '') || 'index';

      if (cleanHref === cleanFileName) {
        link.classList.remove('text-on-surface/60', 'border-transparent');
        link.classList.add('text-primary', 'bg-white/5', 'border-primary');

        const textSpan = link.querySelector('span:not(.material-symbols-outlined)');
        if (textSpan) textSpan.classList.add('translate-x-2');

        const iconSpan = link.querySelector('.material-symbols-outlined');
        if (iconSpan) iconSpan.classList.add('scale-110', 'rotate-6', 'text-primary');
      }
    }
  });

  // 2. Highlight Active Top Nav Link (Glow Effect)
  const topNavLinks = document.querySelectorAll('#top-nav-links a');
  topNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const cleanHref = href.replace('.html', '').replace('/', '') || 'index';
      const cleanFileName = fileName.replace('.html', '').replace('/', '') || 'index';

      if (cleanHref === cleanFileName) {
        link.classList.remove('text-on-surface/60');
        link.classList.add('text-primary', 'border-b-2', 'border-primary', 'pb-1');
      }
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
    const mainContent = document.querySelector('main');
    if (show) {
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.add('translate-x-0');
      sidebarOverlay.classList.remove('hidden');
      if (mainContent && window.innerWidth >= 1024) {
        mainContent.style.marginLeft = '256px';
        mainContent.style.transition = 'margin-left 0.3s ease';
      }
      setTimeout(() => {
        sidebarOverlay.classList.remove('opacity-0');
        sidebarOverlay.classList.add('opacity-100');
      }, 10);
    } else {
      sidebar.classList.remove('translate-x-0');
      sidebar.classList.add('-translate-x-full');
      if (mainContent) {
        mainContent.style.marginLeft = '0';
      }
      sidebarOverlay.classList.remove('opacity-100');
      sidebarOverlay.classList.add('opacity-0');
      setTimeout(() => {
        sidebarOverlay.classList.add('hidden');
      }, 300);
    }
  };

  if (sidebarToggle && sidebar && sidebarOverlay) {
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !sidebar.classList.contains('-translate-x-full');
      toggleSidebar(!isOpen);
    });
    sidebarOverlay.addEventListener('click', () => toggleSidebar(false));
  }

  if (header) {
    window.addEventListener('scroll', () => {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop && scrollTop > 50) {
        // Scrolling down
        header.style.transform = 'translateY(-100%)';
        // Auto-close sidebar on scroll if open
        if (sidebar && !sidebar.classList.contains('-translate-x-full')) toggleSidebar(false);
      } else {
        // Scrolling up
        header.style.transform = 'translateY(0)';
      }
      lastScrollTop = Math.max(0, scrollTop);
    }, { passive: true });
  }

  // 4. Sidebar animations and touch states are now handled natively via Tailwind CSS classes (hover:, active:, group-hover:, etc.)
  // No JS required for sidebar visual feedback anymore.

  // Check for dynamic match detail (Live or Upcoming)
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('id');
  const sportParam = urlParams.get('sport');
  if (sportParam) currentTab = sportParam;
  const sport = currentTab;
  const league = urlParams.get('league') || 'eng.1';

  if (matchId) {
    if (path.includes('upcoming_match_detail.html')) {
      fetchUpcomingMatchDetail(matchId, sport, league);
    } else if (homeTeamName) {
      fetchMatchDetail(matchId, sport, league);
      startAutoRefresh(() => fetchMatchDetail(matchId, sport, league));
    }
    fetchMatches(null, true);
    return;
  }

  // Empty state for match.html without ?id — show live matches to pick from
  if (path.includes('match.html') && !matchId) {
    const mainContent = document.querySelector('main') || document.querySelector('.flex-1');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="py-20 px-6 max-w-4xl mx-auto text-center">
          <span class="material-symbols-outlined text-6xl text-primary mb-6 block animate-pulse">sports_score</span>
          <h2 class="text-4xl font-black italic uppercase tracking-tighter mb-4">Select a Match</h2>
          <p class="text-sm font-bold text-on-surface/40 uppercase tracking-widest mb-12">Choose a match from the live scores below for full details</p>
          <div id="empty-state-matches" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div class="h-48 bg-white/5 rounded-xl animate-pulse"></div>
            <div class="h-48 bg-white/5 rounded-xl animate-pulse"></div>
          </div>
        </div>
      `;
      // Fetch live matches for selection
      fetch(`${API_LIVE}?sport=all`)
        .then(r => r.json())
        .then(data => {
          const matches = (data.matches || []).filter(m => m.status === 'live' || m.status === 'finished').slice(0, 6);
          const container = document.getElementById('empty-state-matches');
          if (container && matches.length > 0) {
            container.innerHTML = matches.map(m => `
              <a href="/match.html?id=${m.id}&sport=${m.sport}&league=${m.leagueSlug}" class="block bg-surface-container p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-all group">
                <div class="flex justify-between items-center mb-4">
                  <span class="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">${m.league || 'Match'}</span>
                  ${m.status === 'live' ? '<span class="flex items-center gap-1 bg-primary text-white px-2 py-0.5 text-[9px] font-black rounded"><span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE</span>' : '<span class="text-[9px] font-black text-on-surface/40 uppercase">FINAL</span>'}
                </div>
                <div class="flex justify-between items-center gap-4">
                  <div class="flex items-center gap-3 flex-1">
                    <img src="${m.homeTeam.logo}" class="w-10 h-10 object-contain" onerror="this.src='/public/logo.png'">
                    <span class="text-sm font-black uppercase truncate">${m.homeTeam.name}</span>
                  </div>
                  <span class="text-2xl font-black italic ${m.status === 'live' ? 'text-primary' : 'text-on-surface/50'}">${m.homeTeam.score} - ${m.awayTeam.score}</span>
                  <div class="flex items-center gap-3 flex-1 justify-end">
                    <span class="text-sm font-black uppercase truncate text-right">${m.awayTeam.name}</span>
                    <img src="${m.awayTeam.logo}" class="w-10 h-10 object-contain" onerror="this.src='/public/logo.png'">
                  </div>
                </div>
              </a>
            `).join('');
          } else if (container) {
            container.innerHTML = '<div class="col-span-full py-8 text-center text-on-surface/30 text-[10px] font-black uppercase tracking-widest">No live matches right now. Check back soon!</div>';
          }
        }).catch(() => {});
    }
    return;
  }

  // Handle Hub Pages (Home, Live, Upcoming, Trending, Results)
  if (matchesContainer || sidebarLiveContainer || newsContainer) {
    if (tabsContainer) renderTabs();

    // Determine page filter: 
    // Homepage and Live hubs now strictly show 'live' matches regardless of tab selection.
    currentPageFilter = 'live';
    if (path.includes('upcoming.html')) currentPageFilter = 'upcoming';
    if (path.includes('results.html')) currentPageFilter = 'finished';
    if (path.includes('trending.html')) currentPageFilter = null; // Show all (live, upcoming, results)

    // --- NOTIFICATION HANDLER ---
window.handleNotification = function(matchId, matchName) {
  // Simple toast implementation
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-primary text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 animate-bounce';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-sm">check_circle</span>
    Reminder Set for ${matchName}!
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
};

// Initial calls ...
    if (window.location.pathname.includes('upcoming.html')) currentArenaTab = currentTab;
    // Skip fetchMatches on upcoming page — Schedule Centre module handles it
    if (!window.location.pathname.includes('upcoming')) {
      fetchMatches(currentPageFilter);
    }
    fetchSidebarLive();
    fetchNews();
    if (heroSliderContainer) fetchHeroData(currentPageFilter);
    if (leaguesContainer || topTierContainer) fetchLeagues();
    if (playersContainer || trendingPlayersContainer) fetchPlayers();
    if (recentResultsContainer) fetchRecentResults();
    if (document.getElementById("featured-match-analysis")) fetchFeaturedAnalysis();
    if (upcomingTodayContainer) {
      fetchUpcomingToday();
      setupUpcomingControls();
    }
    if (document.getElementById('arena-schedule-container')) {
      fetchArenaSchedule();
      setupArenaControls();
      renderArenaTabs();
    }
    if (document.getElementById('trending-matches-list')) {
      fetchTrendingUpcoming();
    }

    // "Silent" Auto Refresh logic
    setInterval(() => {
      // Skip fetchMatches auto-refresh on upcoming page — Schedule Centre handles it
      if (!window.location.pathname.includes('upcoming')) {
        fetchMatches(currentPageFilter);
      }
      fetchSidebarLive();
      if (recentResultsContainer) fetchRecentResults();
    if (document.getElementById("featured-match-analysis")) fetchFeaturedAnalysis();
      if (upcomingTodayContainer) fetchUpcomingToday();
      if (document.getElementById('arena-schedule-container')) fetchArenaSchedule(currentArenaTab);
      if (document.getElementById('trending-matches-list')) fetchTrendingUpcoming();
    }, 15000); // 15s for scores

    setInterval(() => {
      fetchNews();
    }, 60000); // 1m for news

    // Auto Refresh for Hubs
    setInterval(() => {
      if (heroSliderContainer) fetchHeroData(currentPageFilter);
      if (leaguesContainer || topTierContainer) fetchLeagues();
    }, 60000); // 1m for hero / leagues standings

    setInterval(() => {
      if (playersContainer || trendingPlayersContainer) fetchPlayers();
    }, 600000); // 10m for players
  }
});

// --- ARENA SCHEDULED EVENTS (CAROUSEL) ---
window.slideArena = function (direction) {
  const container = document.getElementById('arena-schedule-container');
  if (!container) return;
  const scrollAmount = 350; // min-w of card + gap
  if (direction === 'left') {
    if (container.scrollLeft <= 0) {
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  } else {
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
}

async function fetchArenaSchedule(sport = currentArenaTab) {
  const container = document.getElementById('arena-schedule-container');
  if (!container) return;
  
  const isUpcomingPage = window.location.pathname.includes('upcoming');
  
  try {
    // Always use the dedicated upcoming API for real future fixtures
    const apiUrl = `${API_UPCOMING}?sport=${sport === 'all' ? 'all' : sport}&days=7`;
      
    const res = await fetch(apiUrl);
    const data = await res.json();
    const allMatches = data.matches || [];
    
    if (allMatches.length === 0) {
      container.innerHTML = `
        <div class="bg-surface-container border border-white/5 p-12 rounded-2xl flex items-center justify-center w-full min-h-[360px]">
          <div class="text-center">
            <span class="material-symbols-outlined text-4xl text-on-surface/20 mb-4 block">calendar_month</span>
            <p class="text-on-surface/30 font-black uppercase tracking-[0.3em] text-xs">No Upcoming Fixtures Found</p>
            <p class="text-on-surface/20 text-[10px] mt-2">Check back later for scheduled matches</p>
          </div>
        </div>
      `;
      return;
    }
    
    renderArenaSchedule(allMatches.slice(0, 12));
  } catch (err) {
    console.error('Arena Fetch Error:', err);
    const container = document.getElementById('arena-schedule-container');
    if (container) {
      container.innerHTML = `
        <div class="bg-surface-container border border-white/5 p-12 rounded-2xl flex items-center justify-center w-full min-h-[200px]">
          <p class="text-on-surface/30 font-black uppercase tracking-[0.3em] text-xs">Unable to load events</p>
        </div>
      `;
    }
  }
}

// Fallback: show live matches in Arena section when no upcoming
function renderArenaLiveFallback(matches) {
  const container = document.getElementById('arena-schedule-container');
  if (!container) return;
  container.innerHTML = matches.slice(0, 8).map(m => `
    <a href="/match.html?id=${m.id}&sport=${m.sport}&league=${m.leagueSlug}" 
       class="bg-[#111111] p-6 rounded-2xl border border-primary/20 hover:border-primary/50 transition-all duration-500 shadow-2xl flex flex-col justify-between min-h-[300px] group min-w-[280px] snap-center shrink-0 relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-red-400 to-primary animate-pulse"></div>
      <div>
        <div class="flex justify-between text-[10px] font-black mb-8 uppercase tracking-[0.2em]">
          <span class="text-on-surface/40">${m.league || 'LIVE'}</span>
          <span class="flex items-center gap-1.5 text-primary"><span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span> LIVE</span>
        </div>
        <div class="flex items-center justify-between mb-6 px-2">
          <div class="flex flex-col items-center gap-3 w-2/5">
            <div class="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
              <img src="${m.homeTeam.logo}" class="w-10 h-10 object-contain" onerror="this.src='/public/logo.png'">
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest opacity-60 truncate w-full text-center">${m.homeTeam.name}</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-3xl font-black text-primary italic tracking-tight">${m.homeTeam.score} - ${m.awayTeam.score}</span>
            <span class="text-[9px] font-bold text-primary/60 mt-1">${m.time || ''}</span>
          </div>
          <div class="flex flex-col items-center gap-3 w-2/5">
            <div class="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
              <img src="${m.awayTeam.logo}" class="w-10 h-10 object-contain" onerror="this.src='/public/logo.png'">
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest opacity-60 truncate w-full text-center">${m.awayTeam.name}</span>
          </div>
        </div>
      </div>
      <div class="space-y-3">
        <div class="w-full bg-white/5 h-[1px]"></div>
        <div class="w-full py-3 bg-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-all">
          <span class="material-symbols-outlined text-sm">sports_score</span>
          Match Center
        </div>
      </div>
    </a>
  `).join('');
}

// Fallback: show recent results in Arena section when no upcoming or live
function renderArenaFinishedFallback(matches) {
  const container = document.getElementById('arena-schedule-container');
  if (!container) return;
  container.innerHTML = matches.slice(0, 8).map(m => {
    const homeWin = Number(m.homeTeam.score) > Number(m.awayTeam.score);
    const awayWin = Number(m.awayTeam.score) > Number(m.homeTeam.score);
    return `
    <a href="/match.html?id=${m.id}&sport=${m.sport}&league=${m.leagueSlug}" 
       class="bg-[#111111] p-6 rounded-2xl border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-2xl flex flex-col justify-between min-h-[300px] group min-w-[280px] snap-center shrink-0">
      <div>
        <div class="flex justify-between text-[10px] font-black mb-8 uppercase tracking-[0.2em]">
          <span class="text-on-surface/40">${m.league || 'RESULT'}</span>
          <span class="text-on-surface/30 italic">FINAL</span>
        </div>
        <div class="flex items-center justify-between mb-6 px-2">
          <div class="flex flex-col items-center gap-3 w-2/5">
            <div class="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
              <img src="${m.homeTeam.logo}" class="w-10 h-10 object-contain" onerror="this.src='/public/logo.png'">
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest ${homeWin ? 'text-primary' : 'opacity-40'} truncate w-full text-center">${m.homeTeam.name}</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-3xl font-black text-on-surface/80 italic tracking-tight">${m.homeTeam.score} - ${m.awayTeam.score}</span>
          </div>
          <div class="flex flex-col items-center gap-3 w-2/5">
            <div class="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
              <img src="${m.awayTeam.logo}" class="w-10 h-10 object-contain" onerror="this.src='/public/logo.png'">
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest ${awayWin ? 'text-primary' : 'opacity-40'} truncate w-full text-center">${m.awayTeam.name}</span>
          </div>
        </div>
      </div>
      <div class="space-y-3">
        <div class="w-full bg-white/5 h-[1px]"></div>
        <div class="w-full py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface/40 flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-all">
          <span class="material-symbols-outlined text-sm">sports_score</span>
          View Details
        </div>
      </div>
    </a>
  `;}).join('');
}

function renderArenaTabs() {
  const container = document.getElementById('arena-tabs');
  if (!container) return;
  container.innerHTML = SPORTS.map(sport => `
    <button 
      onclick="switchArenaTab('${sport.id}')"
      class="flex-none px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-all
      ${currentArenaTab === sport.id 
        ? 'bg-primary text-white' 
        : 'bg-white/5 text-on-surface/60 hover:bg-white/10 hover:text-white'
      }"
    >
      ${sport.name}
    </button>
  `).join('');
}

window.switchArenaTab = function(tabId) {
  currentArenaTab = tabId;
  renderArenaTabs();
  const container = document.getElementById('arena-schedule-container');
  if (container) {
    container.innerHTML = `
      <div class="bg-surface-container border border-white/5 p-8 rounded-lg animate-pulse min-w-[300px] h-64"></div>
      <div class="bg-surface-container border border-white/5 p-8 rounded-lg animate-pulse min-w-[300px] h-64"></div>
    `;
  }
  fetchArenaSchedule(tabId);

  // Sync with main matches grid if on upcoming page
  if (window.location.pathname.includes('upcoming.html')) {
    currentTab = tabId;
    if (matchesContainer) {
      matchesContainer.innerHTML = '<div class="col-span-full py-20 flex justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>';
      fetchMatches('upcoming');
    }
  }
}

function renderArenaSchedule(matches) {
  const container = document.getElementById('arena-schedule-container');
  if (!container) return;

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="bg-surface-container border border-white/5 p-12 rounded-2xl flex items-center justify-center w-full min-h-[360px]">
        <p class="text-on-surface/30 font-black uppercase tracking-[0.3em] text-xs">No Scheduled Events Found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = matches.map(match => {
    let dotColor = 'bg-primary';
    if (match.leagueSlug?.includes('esp.1')) dotColor = 'bg-yellow-500';
    if (match.leagueSlug?.includes('nba')) dotColor = 'bg-orange-500';
    if (match.leagueSlug?.includes('eng.1')) dotColor = 'bg-blue-500';
    if (match.leagueSlug?.includes('nfl')) dotColor = 'bg-red-600';

    // Parse date for friendly display
    let friendlyDate = match.time || '';
    let dayLabel = '';
    try {
      const d = new Date(match.date);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dayLabel = `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
      friendlyDate = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch(e) {}

    return `
      <a href="/upcoming_match_detail.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}" 
         class="bg-[#111111] p-8 rounded-2xl border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-2xl flex flex-col justify-between h-[420px] group min-w-[320px] snap-center shrink-0">
        <div>
          <div class="flex justify-between text-[10px] font-black text-on-surface-variant mb-12 uppercase tracking-[0.2em]">
            <span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${dotColor}"></span> ${match.league || 'UPCOMING'}</span>
            <span class="text-primary font-mono">${friendlyDate}</span>
          </div>
          <div class="flex items-center justify-between mb-8 px-2">
            <div class="flex flex-col items-center gap-4 w-1/3">
              <div class="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-xl font-black shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/5 group-hover:border-primary/30 transition-colors uppercase relative overflow-hidden">
                <img src="${match.homeTeam.logo}" class="w-12 h-12 object-contain relative z-10" onerror="this.src='/public/logo.png'">
                <div class="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-opacity truncate w-full text-center">${match.homeTeam.name}</span>
            </div>
            
            <div class="flex flex-col items-center justify-center">
              <span class="text-3xl font-black text-primary italic tracking-tighter transform group-hover:scale-125 transition-transform duration-700">VS</span>
              <span class="text-[8px] font-black uppercase opacity-20 mt-2 tracking-[0.3em]">${dayLabel || match.date?.split(',')[0] || ''}</span>
            </div>

            <div class="flex flex-col items-center gap-4 w-1/3">
              <div class="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-xl font-black shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/5 group-hover:border-primary/30 transition-colors uppercase relative overflow-hidden">
                <img src="${match.awayTeam.logo}" class="w-12 h-12 object-contain relative z-10" onerror="this.src='/public/logo.png'">
                <div class="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-opacity truncate w-full text-center">${match.awayTeam.name}</span>
            </div>
          </div>

          <!-- Predictions/Form (Kinetic Sub-data) -->
          <div class="flex justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <div class="px-2 py-0.5 rounded border border-white/10 text-[8px] font-black uppercase italic">${match.venue || 'TBD Venue'}</div>
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="w-full bg-white/5 h-[1px]"></div>
          <button onclick="handleNotification('${match.id}', '${match.homeTeam.name} vs ${match.awayTeam.name}')" 
                  class="w-full py-4 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden">
            <span class="material-symbols-outlined text-sm">notifications</span>
            Notify Me
          </button>
        </div>
      </a>
    `;
  }).join('');
}


function setupArenaControls() {
  const container = document.getElementById('arena-schedule-container');
  const prev = document.getElementById('arena-prev');
  const next = document.getElementById('arena-next');
  if (!container || !prev || !next) return;

  const scrollAmount = 330; // Card width + gap

  next.addEventListener('click', () => {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  prev.addEventListener('click', () => {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  // Auto-slide logic
  setInterval(() => {
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, 5000);
}

// --- FETCH TOP HERO DATA ---
async function fetchHeroData(statusFilter = null) {
  if (!heroSliderContainer) return;
  try {
    const isIndexPage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
    
    if (isIndexPage) {
      // 1. Fetch live matches for featured match
      const liveRes = await fetch(`${API_LIVE}?sport=all`);
      const liveData = await liveRes.json();
      let liveMatches = (liveData.matches || []).filter(m => m.status === 'live');
      if (liveMatches.length === 0) liveMatches = (liveData.matches || []).slice(0, 3);
      
      // 2. Fetch upcoming matches for "Next Major Event"
      const upRes = await fetch(`${API_UPCOMING}?sport=all&days=3`);
      const upData = await upRes.json();
      let upMatches = upData.matches || [];
      upMatches.sort((a,b) => new Date(a.date) - new Date(b.date));

      // 3. Fetch news for "Breaking Now"
      const newsRes = await fetch(`${API_INFO}?type=news&sport=all`);
      const newsData = await newsRes.json();
      let newsList = newsData.articles || [];

      renderIndexHeroHub(liveMatches, upMatches, newsList);
      return;
    }

    const res = await fetch(`${API_LIVE}?sport=all`);
    const data = await res.json();
    let matches = data.matches || [];

    if (statusFilter === 'live') {
      // Strictly live for pages that request it (like Leagues or when user wants strict Live)
      matches = matches.filter(m => m.status === 'live');
    } else if (statusFilter === 'upcoming') {
      matches = matches.filter(m => m.status === 'upcoming');
      // Sort upcoming by date (soonest first)
      matches.sort((a,b) => new Date(a.date) - new Date(b.date));
    } else if (statusFilter) {
      matches = matches.filter(m => m.status === statusFilter);
    } else {
      // On Home/Trending, prioritize Live. 
      matches = (data.matches || []).filter(m => m.status === 'live');
    }

    // Fallback: If no matches for statusFilter, and we really need A hero, maybe show any
    if (matches.length === 0 && !statusFilter) {
        matches = (data.matches || []).slice(0, 3);
    }

    renderHeroSlider(matches.slice(0, 5), statusFilter);
  } catch (err) {
    console.error('Hero Slider error:', err);
    if (heroSliderContainer) heroSliderContainer.style.display = 'none';
  }
}

function renderHeroSlider(matches, statusFilter) {
  if (!heroSliderContainer) return;

  if (!matches || matches.length === 0) {
    // Show a static fallback or clean empty state
    heroSliderContainer.style.display = 'none';
    return;
  }
  
  // Explicitly show the container as we have matches
  heroSliderContainer.style.display = 'block';

  let currentSlide = 0;
  const slides = matches.map((match, idx) => {
    const ctaText = match.status === 'live' ? 'Watch 4K Stream' : match.status === 'finished' ? 'Watch Highlights' : 'Set Reminder';
    const ctaIcon = match.status === 'live' ? 'play_circle' : match.status === 'finished' ? 'video_library' : 'notifications';
    const link = match.highlightUrl && match.status === 'finished' ? match.highlightUrl : `/match.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}`;
    const target = match.highlightUrl && match.status === 'finished' ? '_blank' : '_self';

    return `
    <div class="absolute inset-0 z-10 transition-opacity duration-1000 ${idx === 0 ? 'opacity-100' : 'opacity-0'}" id="hero-slide-${idx}">
      <div class="absolute inset-0 bg-cover bg-center" style="background-image: linear-gradient(to top, rgba(19, 19, 19, 0.9) 10%, transparent 60%), linear-gradient(to right, rgba(14, 14, 14, 0.9), rgba(14, 14, 14, 0.2)), url('${match.homeTeam.logo}'); filter: brightness(0.4) blur(4px);"></div>
      <div class="relative h-full flex flex-col justify-center px-8 md:px-20 max-w-7xl mx-auto">
        <div class="flex items-center gap-3 mb-6">
          <span class="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase">
            <span class="w-2 h-2 bg-white rounded-full ${match.status === 'live' ? 'animate-pulse' : ''}"></span> ${match.status.toUpperCase()}
          </span>
          <span class="text-on-surface-variant font-bold text-xs tracking-widest uppercase">${match.league}</span>
        </div>
        <div class="flex items-end gap-6 mb-8">
          <h1 class="font-headline font-black text-5xl md:text-7xl tracking-tighter leading-[0.85] uppercase italic text-on-surface">
            ${match.homeTeam.name.slice(0, 3)} <span class="text-primary">${match.homeTeam.score}-${match.awayTeam.score}</span> ${match.awayTeam.name.slice(0, 3)}
          </h1>
          <div class="mb-2 hidden sm:block">
            <div class="text-xs font-black uppercase text-primary tracking-widest mb-1">${match.status === 'upcoming' ? 'Kickoff' : 'Elapsed'}</div>
            <div class="text-3xl font-black italic">${match.time}</div>
          </div>
        </div>
        <div class="flex flex-wrap gap-4">
          <a href="${link}" target="${target}" class="bg-primary hover:bg-primary/90 px-10 py-5 rounded-lg text-white font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(204,22,22,0.4)]">
            <span class="material-symbols-outlined">${ctaIcon}</span> ${ctaText}
          </a>
          <a href="/match.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}" class="bg-white/5 backdrop-blur-md border border-white/20 px-10 py-5 rounded-lg text-on-surface font-black uppercase text-xs tracking-[0.2em] hover:bg-white/10 transition-colors">
            Match Center
          </a>
        </div>
      </div>
    </div>
  `;
  }).join('');

  heroSliderContainer.innerHTML = `
    <div class="relative w-full h-[500px]">
      ${slides}
    </div>
  `;

  // Auto-advance logic
  if (matches.length > 1) {
    setInterval(() => {
      document.getElementById(`hero-slide-${currentSlide}`).classList.replace('opacity-100', 'opacity-0');
      currentSlide = (currentSlide + 1) % matches.length;
      document.getElementById(`hero-slide-${currentSlide}`).classList.replace('opacity-0', 'opacity-100');
    }, 8000);
  }
}

function renderIndexHeroHub(liveMatches, upMatches, newsList) {
  if (!heroSliderContainer) return;

  const featuredMatch = liveMatches[0] || upMatches[0];
  const nextUpMatch = upMatches.find(m => m.id !== featuredMatch?.id) || upMatches[0];
  const newsItem = newsList[0];

  if (!featuredMatch) {
    heroSliderContainer.style.display = 'none';
    return;
  }

  heroSliderContainer.style.display = 'block';

  const homePoss = featuredMatch.stats?.possession?.home || '50%';
  const awayPoss = featuredMatch.stats?.possession?.away || '50%';
  const homeShots = featuredMatch.stats?.shots?.home || '0';
  const awayShots = featuredMatch.stats?.shots?.away || '0';

  const formatUpcomingDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      let hours = d.getHours();
      let minutes = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch(e) { return 'TBD'; }
  }

  const featuredLink = featuredMatch.status === 'finished' ? (featuredMatch.highlightUrl || `/match.html?id=${featuredMatch.id}&sport=${featuredMatch.sport}&league=${featuredMatch.leagueSlug}`) : `/match.html?id=${featuredMatch.id}&sport=${featuredMatch.sport}&league=${featuredMatch.leagueSlug}`;
  const upLink = nextUpMatch ? `/upcoming_match_detail.html?id=${nextUpMatch.id}&sport=${nextUpMatch.sport}&league=${nextUpMatch.leagueSlug}` : '#';
  const ctaText = featuredMatch.status === 'live' ? 'Watch 4K Stream' : featuredMatch.status === 'finished' ? 'Watch Highlights' : 'Set Reminder';
  const ctaIcon = featuredMatch.status === 'live' ? 'play_circle' : featuredMatch.status === 'finished' ? 'video_library' : 'notifications';

  heroSliderContainer.innerHTML = `
<!-- Multi-Slide Hub Container -->
<div class="relative w-full h-full">
  <div class="absolute inset-0 z-10">
    <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] scale-110" style="background-image: linear-gradient(to top, rgb(19, 19, 19) 10%, transparent 60%), linear-gradient(to right, rgba(14, 14, 14, 0.9), rgba(14, 14, 14, 0.2)), url('${featuredMatch.homeTeam.logo}');"></div>
    <div class="relative h-full flex flex-col justify-center px-8 md:px-20 max-w-7xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <span class="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase">
          <span class="w-2 h-2 bg-white rounded-full ${featuredMatch.status === 'live' ? 'animate-pulse' : ''}"></span> ${featuredMatch.status === 'live' ? 'FEATURED LIVE' : (featuredMatch.status === 'finished' ? 'FINISHED EVENT' : 'UPCOMING MATCH')}
        </span>
        <span class="text-on-surface-variant font-bold text-xs tracking-widest uppercase">${featuredMatch.league || 'Game of the Week'}</span>
      </div>
      <div class="flex items-end gap-6 mb-8">
        <h1 class="font-headline font-black text-6xl md:text-9xl tracking-tighter leading-[0.85] uppercase italic text-on-surface">
          ${featuredMatch.homeTeam.name.slice(0, 3)} <span class="text-primary">${featuredMatch.homeTeam.score}-${featuredMatch.awayTeam.score}</span> ${featuredMatch.awayTeam.name.slice(0, 3)}
        </h1>
        <div class="mb-2 hidden sm:block">
          <div class="text-xs font-black uppercase text-primary tracking-widest mb-1">${featuredMatch.status === 'live' ? 'Elapsed' : (featuredMatch.status==='finished'?'Final':'Kickoff')}</div>
          <div class="text-3xl font-black italic">${featuredMatch.time || 'SCHEDULED'}</div>
        </div>
      </div>
      
      ${featuredMatch.status === 'live' ? `
      <div class="flex gap-10 mb-12">
        <div class="glass-card p-4 rounded-lg flex items-center gap-4 border border-white/5">
          <div class="text-center">
            <div class="text-[10px] font-black text-on-surface/40 uppercase">Possession</div>
            <div class="text-xl font-black italic">${homePoss} - ${awayPoss}</div>
          </div>
          <div class="w-[1px] h-8 bg-white/10"></div>
          <div class="text-center">
            <div class="text-[10px] font-black text-on-surface/40 uppercase">Shots (On)</div>
            <div class="text-xl font-black italic">${homeShots} - ${awayShots}</div>
          </div>
        </div>
      </div>` : '<div class="mb-12"></div>'}

      <div class="flex flex-wrap gap-4">
        <a href="${featuredLink}" class="bg-primary hover:bg-primary/90 px-10 py-5 rounded-lg text-white font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(204,22,22,0.4)] relative z-20">
          <span class="material-symbols-outlined">${ctaIcon}</span> ${ctaText}
        </a>
        <a href="${featuredLink}" class="bg-white/5 backdrop-blur-md border border-white/20 px-10 py-5 rounded-lg text-on-surface font-black uppercase text-xs tracking-[0.2em] hover:bg-white/10 transition-colors relative z-20">
          Full Match Center
        </a>
      </div>
    </div>
  </div>

  <!-- Slide Navigation Controls -->
  <div class="absolute bottom-12 left-8 md:left-20 z-30 flex flex-col gap-6 hidden sm:flex">
    <div class="flex gap-4">
      <a href="/live.html" class="group cursor-pointer">
        <div class="w-16 h-1.5 bg-primary relative overflow-hidden rounded-full">
          <div class="absolute inset-0 bg-white/30 animate-[progress_5s_linear_infinite]"></div>
        </div>
        <span class="text-[9px] font-black uppercase mt-2 block tracking-widest text-primary">LIVE NOW</span>
      </a>
      <a href="/upcoming.html" class="group cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
        <div class="w-16 h-1.5 bg-white/10 rounded-full"></div>
        <span class="text-[9px] font-black uppercase mt-2 block tracking-widest text-on-surface">COUNTDOWN</span>
      </a>
      <a href="/leagues.html" class="group cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
        <div class="w-16 h-1.5 bg-white/10 rounded-full"></div>
        <span class="text-[9px] font-black uppercase mt-2 block tracking-widest text-on-surface">SPORTS HUB</span>
      </a>
      <a href="/news.html" class="group cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
        <div class="w-16 h-1.5 bg-white/10 rounded-full"></div>
        <span class="text-[9px] font-black uppercase mt-2 block tracking-widest text-on-surface">LATEST NEWS</span>
      </a>
    </div>
  </div>

  <!-- Side Widgets -->
  <div class="absolute right-12 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 z-30 pointer-events-auto">
    <!-- Upcoming Highlight -->
    ${nextUpMatch ? `
    <a href="${upLink}" class="glass-card block p-6 rounded-2xl border-l-4 border-white/20 w-80 shadow-2xl group hover:border-primary transition-all cursor-pointer bg-surface/30 backdrop-blur-md relative z-40">
      <div class="flex justify-between items-start mb-4">
        <div class="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Next Major Event</div>
        <div class="bg-white/10 px-2 py-0.5 rounded text-[9px] font-black">${formatUpcomingDate(nextUpMatch.date)}</div>
      </div>
      <div class="text-xl font-black italic uppercase leading-none mb-1">${nextUpMatch.homeTeam?.name || ''} vs ${nextUpMatch.awayTeam?.name || ''}</div>
      <div class="text-[10px] font-bold text-primary tracking-widest uppercase">${nextUpMatch.league || ''}</div>
    </a>
    ` : ''}

    <!-- Quick Access -->
    <div class="glass-card p-6 rounded-2xl border border-white/5 w-80 shadow-2xl bg-surface/30 backdrop-blur-md relative z-40">
      <div class="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-4">The Multiverse Quick-Jump</div>
      <div class="grid grid-cols-4 gap-3">
        <a class="aspect-square bg-white/5 hover:bg-primary transition-all rounded-lg flex items-center justify-center group" href="/sport.html?s=soccer">
          <span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">sports_soccer</span>
        </a>
        <a class="aspect-square bg-white/5 hover:bg-primary transition-all rounded-lg flex items-center justify-center group" href="/sport.html?s=basketball&l=nba">
          <span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">sports_basketball</span>
        </a>
        <a class="aspect-square bg-white/5 hover:bg-primary transition-all rounded-lg flex items-center justify-center group" href="/sport.html?s=football&l=nfl">
          <span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">sports_football</span>
        </a>
        <a class="aspect-square bg-white/5 hover:bg-primary transition-all rounded-lg flex items-center justify-center group" href="/sport.html?s=mma">
          <span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">sports_mma</span>
        </a>
      </div>
    </div>

    <!-- Breaking News -->
    ${newsItem ? `
    <a href="/news.html" class="glass-card block p-5 rounded-2xl border border-white/5 w-80 shadow-2xl overflow-hidden relative group bg-surface/30 backdrop-blur-md relative z-40">
      <div class="flex items-center gap-2 mb-3">
        <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
        <span class="text-[10px] font-black uppercase tracking-widest">Breaking Now</span>
      </div>
      <p class="text-[11px] font-bold leading-tight uppercase opacity-80 group-hover:text-primary transition-colors line-clamp-2">${newsItem.headline}</p>
      <span class="inline-block mt-3 text-[9px] font-black uppercase tracking-widest border-b border-primary text-primary pb-0.5">Read More</span>
    </a>
    ` : ''}
  </div>
</div>
  `;
}


// --- FETCH LEAGUES ---
async function fetchLeagues() {
  if (!leaguesContainer && !topTierContainer) return;
  try {
    // 1. Fetch live matches for ALL sports to identify ongoing leagues
    const liveRes = await fetch(`${API_LIVE}?sport=all`);
    const liveData = await liveRes.json();
    const liveMatches = liveData.matches || [];

    // 2. Define our target leagues for the directory
    // These are elite leagues we want to show even if not live
    const eliteLeagues = [
      { name: 'Premier League', slug: 'eng.1', country: 'England', sport: 'soccer', icon: 'sports_soccer', category: 'top' },
      { name: 'NBA', slug: 'nba', country: 'USA', sport: 'basketball', icon: 'sports_basketball', category: 'top' },
      { name: 'NFL', slug: 'nfl', country: 'USA', sport: 'american-football', icon: 'sports_football', category: 'top' },
      { name: 'LALIGA', slug: 'esp.1', country: 'Spain', sport: 'soccer', icon: 'sports_soccer', category: 'top' },
      { name: 'ICC Cricket', slug: 'icc-world-cup', country: 'Global', sport: 'cricket', icon: 'sports_cricket', category: 'top' },
      { name: 'NHL', slug: 'nhl', country: 'USA/Canada', sport: 'hockey', icon: 'sports_hockey', category: 'top' },
      { name: 'Serie A', slug: 'ita.1', country: 'Italy', sport: 'soccer', icon: 'sports_soccer', category: 'euro' },
      { name: 'Bundesliga', slug: 'ger.1', country: 'Germany', sport: 'soccer', icon: 'sports_soccer', category: 'euro' },
      { name: 'Ligue 1', slug: 'fra.1', country: 'France', sport: 'soccer', icon: 'sports_soccer', category: 'euro' },
      { name: 'Eredivisie', slug: 'ned.1', country: 'Netherlands', sport: 'soccer', icon: 'sports_soccer', category: 'euro' },
      { name: 'Super Lig', slug: 'tur.1', country: 'Turkey', sport: 'soccer', icon: 'sports_soccer', category: 'euro' },
      { name: 'UFC', slug: 'ufc', country: 'Global', sport: 'mma', icon: 'sports_mma', category: 'combat' },
      { name: 'Boxing', slug: 'boxing', country: 'Global', sport: 'mma', icon: 'sports_mma', category: 'combat' }
    ];

    // 3. Fetch standings for active soccer leagues (parallelized)
    const activeStandingsLeagues = ['eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1'];
    const standingsPromises = activeStandingsLeagues.map(slug => 
      fetch(`${API_INFO}?type=standings&sport=soccer&league=${slug}`).then(r => r.json().catch(() => ({})))
    );
    
    const standingsResults = await Promise.all(standingsPromises);
    const standingsMap = {};
    activeStandingsLeagues.forEach((slug, i) => {
      const data = standingsResults[i];
      standingsMap[slug] = (data.standings?.[0]?.entries || data.children?.[0]?.standings?.entries || []);
    });

    renderLeaguesHub(eliteLeagues, standingsMap, liveMatches);
  } catch (err) {
    console.error('Leagues error:', err);
    // Fallback rendering even on error
    renderLeaguesHub([], {}, []);
  }
}

function renderLeaguesHub(eliteLeagues, standingsMap, liveMatches) {
  // Helper to check if a league is currently live
  const checkLive = (slug) => liveMatches.some(m => (m.leagueSlug === slug || m.leagueSearchValue === slug) && m.status === 'live');

  // 1. Top Tier (Elite) - Priority to Live
  if (topTierContainer) {
    const topLeagues = eliteLeagues.filter(l => l.category === 'top');
    // Sort: Live leagues first
    topLeagues.sort((a, b) => (checkLive(b.slug) ? 1 : 0) - (checkLive(a.slug) ? 1 : 0));

    topTierContainer.innerHTML = topLeagues.map(l => {
      const isLive = checkLive(l.slug);
      return `
        <div class="bg-surface-container-high border ${isLive ? 'border-primary/50' : 'border-white/5'} rounded p-5 hover:bg-surface-container-highest transition-all group relative overflow-hidden h-full flex flex-col">
          <div class="flex justify-between items-start mb-6">
            <div class="w-12 h-12 bg-white/5 rounded flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <span class="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">${l.icon}</span>
            </div>
            ${isLive ? '<div class="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest animate-pulse">Live Now</div>' : ''}
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-black uppercase tracking-tight mb-1 group-hover:text-primary transition-colors">${l.name}</h3>
            <p class="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest mb-6">${l.country} • ${l.sport}</p>
          </div>
          <button onclick="switchTab('${l.sport}')" class="w-full py-3 bg-white/5 group-hover:bg-primary group-hover:text-on-primary transition-all text-[10px] font-black uppercase tracking-widest rounded">View Hub</button>
        </div>
      `;
    }).join('');
  }

  // 2. Combat Sports
  if (combatSportsContainer) {
    const combatLeagues = eliteLeagues.filter(l => l.category === 'combat');
    // For combat, we often use specific hero-style blocks
    const combatMetadata = {
        'ufc': { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvIyeKN8pU6Tv8l7j-RmQf1mq1YYkRNanPO1kQCTkfpqO1lnOXuSXrM1XtkhkolcZdhEQS_PmMYnlFeWJFN7mnloZTh5Ma37GUcum0oXBwzOPT1dOb1NzKoEbQCIqJwLILR8GSq3XEkvk0bb5iUu5SRjqqNa7LiEsFgaTh6sCpPyjm97xrCouooxKwVn_5v4A8rEfd35QrTnsB3tXr4X7sBhD0favzvQsyRibEZUQ48Y_Zkq1Jop3gjDYtR4ex2BmQWkhgcDR589xC', title: 'Ultimate Fighting' },
        'boxing': { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDch9QidtmtgyAuKOhBwokTeBFsRbDLkH0wFQjZhtJLDO9QCp6s4LrnaeRYyVXfjZbefQVmOHoMq1wSdEnhGjfTdwC8mUQGZwhyug-EnBbdPSaiIUbN9-cs51DDEzNE_B6liCVR92OWeoEHj86EllurkqqM_w2DjPnkcOYojy7BbXRQV7wpvYR8gZQqUCEQMtlIzBgQXByX4rqtAKsAW5xeNAp5h-sxvkwucT08VJYZzbUttb0wrkNwvi2OPZZLFsvKTmzj30BGI6ZL', title: 'World Class Boxing' }
    };

    combatSportsContainer.innerHTML = combatLeagues.map(l => {
        const isLive = checkLive(l.slug);
        const meta = combatMetadata[l.slug] || { img: '', title: l.name };
        return `
        <div class="h-64 relative bg-surface-container-high rounded-xl overflow-hidden group border ${isLive ? 'border-primary/50' : 'border-white/5'}">
          <img class="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" src="${meta.img}" onerror="this.src='/public/hero-fallback.jpg'">
          <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/80 to-transparent"></div>
          <div class="relative h-full p-8 flex flex-col justify-center max-w-xs">
            <div class="inline-flex h-8 bg-white/10 backdrop-blur px-4 items-center justify-center mb-4 rounded border border-white/10">
              <span class="font-black italic text-xs uppercase tracking-widest group-hover:text-primary transition-colors">${l.name}</span>
            </div>
            <h3 class="text-3xl font-black uppercase tracking-tighter leading-none mb-2">${isLive ? 'MAIN EVENT LIVE' : meta.title}</h3>
            <p class="text-[10px] font-bold text-on-surface/40 uppercase tracking-[0.2em] mb-6">${isLive ? 'STREAMING NOW AT 120FPS' : 'FIGHT NIGHT CARDS'}</p>
            <button onclick="switchTab('mma')" class="self-start px-8 py-3 ${isLive ? 'kinetic-gradient' : 'bg-white/5 border border-white/10'} text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all">Explore Hub</button>
          </div>
          ${isLive ? '<div class="absolute top-6 right-8 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(204,22,22,0.8)]"></div>' : ''}
        </div>
        `;
    }).join('');
  }

  // 3. European Soccer
  if (europeanSoccerContainer) {
     const euroLeagues = eliteLeagues.filter(l => l.category === 'euro');
     // Sort: Live leagues first
     euroLeagues.sort((a, b) => (checkLive(b.slug) ? 1 : 0) - (checkLive(a.slug) ? 1 : 0));

     europeanSoccerContainer.innerHTML = euroLeagues.map(l => {
        const isLive = checkLive(l.slug);
        return `
        <div class="bg-surface-container-high border ${isLive ? 'border-primary/50' : 'border-white/5'} p-6 rounded-xl text-center hover:bg-surface-container-highest hover:border-primary/30 transition-all cursor-pointer group relative" onclick="switchTab('soccer')">
          ${isLive ? '<span class="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(204,22,22,0.5)]"></span>' : ''}
          <div class="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform h-12 w-12">
            <span class="material-symbols-outlined text-2xl text-on-surface/40 group-hover:text-primary">${l.icon}</span>
          </div>
          <h4 class="text-xs font-black uppercase tracking-tight group-hover:text-primary transition-colors">${l.name}</h4>
          <p class="text-[9px] font-bold text-on-surface/30 uppercase mt-1 tracking-widest">${l.country}</p>
        </div>
        `;
     }).join('');
  }

  // 4. Standings Section (Tabbed between EPL, LaLiga, Serie A, etc.)
  const standingsTableContainer = document.getElementById('standings-table-container');
  if (standingsTableContainer) {
    const leaguesToDisplay = ['eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1'];
    const activeLeague = window.currentStandingsLeague || (standingsMap['eng.1']?.length > 0 ? 'eng.1' : 'esp.1');
    const standings = standingsMap[activeLeague] || [];
    
    const leagueNames = {
      'eng.1': 'Premier League',
      'esp.1': 'LaLiga EA Sports',
      'ita.1': 'Serie A',
      'ger.1': 'Bundesliga',
      'fra.1': 'Ligue 1'
    };

    standingsTableContainer.innerHTML = `
      <div class="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 border-l-4 border-primary pl-6 gap-6">
        <div>
          <h2 class="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">Live Standings</h2>
          <p class="text-[11px] font-black text-on-surface/40 uppercase tracking-[0.3em]">${leagueNames[activeLeague] || 'League'} Grid</p>
        </div>
        <div class="flex flex-wrap gap-3">
           ${leaguesToDisplay.map(slug => `
             <button onclick="window.currentStandingsLeague='${slug}'; fetchLeagues()" 
               class="px-5 py-2.5 text-[10px] font-black rounded-lg transition-all duration-300 border 
               ${activeLeague === slug ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20' : 'bg-white/5 text-on-surface/40 border-white/5 hover:border-primary/50'} uppercase tracking-widest">
               ${slug.split('.')[0].toUpperCase()}
             </button>
           `).join('')}
           <button onclick="fetchLeagues()" class="px-5 py-2.5 text-[10px] font-black bg-white/5 text-on-surface/20 border border-white/5 rounded-lg uppercase tracking-widest hover:text-primary hover:border-primary/50 transition-all">
             <span class="material-symbols-outlined text-[14px] align-middle mr-1">refresh</span> Refresh
           </button>
        </div>
      </div>
      <div class="bg-surface-container-high border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative group">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-[11px] uppercase font-black border-collapse">
            <thead>
              <tr class="bg-white/5 border-b border-white/10">
                <th class="px-8 py-5 text-on-surface/40 font-black tracking-widest">RANK</th>
                <th class="px-8 py-5 text-on-surface/40 font-black tracking-widest">CLUB</th>
                <th class="px-8 py-5 text-on-surface/40 font-black tracking-widest text-center">MP</th>
                <th class="px-8 py-5 text-on-surface/40 font-black tracking-widest text-center">GD</th>
                <th class="px-8 py-5 text-on-surface/40 font-black tracking-widest text-right">PTS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${standings.slice(0, 10).map((e, idx) => {
                const gd = e.stats.find(s => s.name === 'pointDifferential')?.value || 0;
                return `
                <tr class="hover:bg-white/10 transition-all duration-300 group/row cursor-default">
                  <td class="px-8 py-6">
                    <span class="text-sm font-black italic ${idx < 4 ? 'text-primary' : 'text-on-surface/40'}">${e.stats.find(s => s.name === 'rank')?.value || '-'}</span>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center p-2 group-hover/row:bg-primary/20 transition-all duration-500 transform group-hover/row:scale-110 group-hover/row:rotate-6">
                        <img src="${e.team.logos?.[0]?.href}" class="w-full h-full object-contain" onerror="this.src='/public/logo.png'">
                      </div>
                      <span class="text-xs font-black tracking-tight group-hover/row:text-primary transition-colors">${e.team.displayName}</span>
                    </div>
                  </td>
                  <td class="px-8 py-6 text-center font-body text-on-surface/60">${e.stats.find(s => s.name === 'gamesPlayed')?.value || '0'}</td>
                  <td class="px-8 py-6 text-center font-body ${gd >= 0 ? 'text-primary' : 'text-error'} font-bold">${gd > 0 ? '+' : ''}${gd}</td>
                  <td class="px-8 py-6 text-right">
                    <span class="text-lg font-black text-primary">${e.stats.find(s => s.name === 'points')?.value || '0'}</span>
                  </td>
                </tr>
                `;
              }).join('')}
              ${standings.length === 0 ? '<tr><td colspan="5" class="px-8 py-20 text-center text-on-surface/20 italic tracking-widest">No sector data currently available. Signal lost.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

// --- FETCH PLAYERS ---
async function fetchPlayers() {
  const isPlayersPage = window.location.pathname.endsWith('players.html');
  if (!playersContainer && !trendingPlayersContainer && !isPlayersPage) return;

  try {
    // We will do parallel fetches for different player groupings
    const [soccerRes, nbaRes, nflRes] = await Promise.all([
      fetch(`${API_INFO}?type=players&sport=soccer&league=eng.1`).catch(() => null),
      fetch(`${API_INFO}?type=players&sport=basketball&league=nba`).catch(() => null),
      fetch(`${API_INFO}?type=players&sport=football&league=nfl`).catch(() => null)
    ]);

    const soccerData = soccerRes ? await soccerRes.json() : { athletes: [] };
    const nbaData = nbaRes ? await nbaRes.json() : { athletes: [] };
    const nflData = nflRes ? await nflRes.json() : { athletes: [] };

    const soccerAthletes = soccerData.athletes || [];
    const nbaAthletes = nbaData.athletes || [];
    const nflAthletes = nflData.athletes || [];
    
    // Inject sport data
    soccerAthletes.forEach(a => a.sport = 'Soccer');
    nbaAthletes.forEach(a => a.sport = 'Basketball');
    nflAthletes.forEach(a => a.sport = 'Football');

    // On players.html, render the 4 grids
    if (isPlayersPage) {
       renderTrendingPlayersPage(soccerAthletes.concat(nbaAthletes, nflAthletes));
       renderSoccerLegends(soccerAthletes);
       renderNbaAllstars(nbaAthletes);
       renderNflElite(nflAthletes);
    } else if (playersContainer) {
       // Legacy generic players container fallback
       playersContainer.innerHTML = soccerAthletes.slice(0, 10).map(a => `
        <div class="bg-surface-container p-4 rounded-lg flex items-center gap-4">
          <img src="${a.headshot?.href || '/public/logo.png'}" class="w-12 h-12 rounded-full grayscale hover:grayscale-0 transition-all">
          <div>
            <h4 class="font-black uppercase text-xs">${a.fullName}</h4>
            <p class="text-[10px] opacity-40 uppercase font-black">${a.position?.displayName || 'Player'}</p>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Players error:', err);
  }
}

function renderTrendingPlayersPage(athletes) {
  const container = document.getElementById('trending-players-grid');
  if (!container) return;
  if (!athletes.length) { container.innerHTML = ''; return; }
  // Mix players, take top 4
  const mixed = athletes.sort(() => 0.5 - Math.random()).slice(0, 4);
  container.innerHTML = mixed.map(a => `
    <div class="flex-none w-80 bg-surface-container-low p-6 border border-white/5 rounded-2xl group hover:border-primary/20 transition-all cursor-pointer">
      <div class="flex justify-between items-start mb-6">
        <div class="relative">
          <img src="${a.headshot?.href || '/public/logo.png'}" class="w-16 h-16 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all">
          <span class="absolute -bottom-1 -right-1 bg-primary text-[8px] font-black text-white px-2 py-0.5 rounded-full border-2 border-surface-container-low">HOT</span>
        </div>
        <div class="text-right">
          <p class="text-[10px] text-on-surface-variant font-bold uppercase">Trending Player</p>
          <h4 class="text-xl font-black uppercase tracking-tighter">${a.shortName || a.lastName || a.fullName.split(' ')[0]}</h4>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-surface-container p-3 rounded-xl border border-white/5">
          <p class="text-[8px] text-on-surface-variant uppercase font-bold tracking-widest">Sport</p>
          <p class="text-xs font-black text-white uppercase mt-1">${a.sport || 'Unknown'}</p>
        </div>
        <div class="bg-surface-container p-3 rounded-xl border border-white/5">
          <p class="text-[8px] text-on-surface-variant uppercase font-bold tracking-widest">Pos</p>
          <p class="text-xs font-black text-white mt-1 uppercase">${a.position?.displayName || 'N/A'}</p>
        </div>
      </div>
    </div>
  `).join('');
}

function renderSoccerLegends(athletes) {
  const container = document.getElementById('soccer-legends-grid');
  if (!container) return;
  if (!athletes.length) { container.innerHTML = ''; return; }
  container.innerHTML = athletes.slice(0, 4).map(a => `
    <div class="bg-surface-container-low border border-white/5 overflow-hidden group hover:border-primary/20 transition-all">
      <div class="relative h-64 overflow-hidden bg-surface-container-highest">
        <img src="${a.headshot?.href || '/public/logo.png'}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent"></div>
        <div class="absolute bottom-4 left-4">
          <p class="text-xs font-black text-primary uppercase">${a.position?.displayName || 'Player'}</p>
          <h4 class="text-2xl font-black uppercase italic tracking-tighter">${a.fullName}</h4>
        </div>
      </div>
      <div class="p-6 space-y-4">
        <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          <span>Height / Weight</span>
          <span class="text-white">${a.displayHeight || '-'} / ${a.displayWeight || '-'}</span>
        </div>
        <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          <span>Status</span>
          <span class="bg-primary/20 text-primary px-2 py-0.5 rounded uppercase">${a.status?.name || 'Active'}</span>
        </div>
        <button class="w-full border border-white/10 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-colors">FULL PROFILE</button>
      </div>
    </div>
  `).join('');
}

function renderNbaAllstars(athletes) {
  const container = document.getElementById('nba-allstars-grid');
  if (!container) return;
  if (!athletes.length) { container.innerHTML = ''; return; }
  container.innerHTML = athletes.slice(0, 3).map(a => `
    <div class="glass-panel p-8 border border-white/5 rounded-2xl relative overflow-hidden group hover:translate-y-[-4px] transition-all">
      <div class="flex items-end gap-6 mb-8">
        <div class="relative w-24 h-24 overflow-hidden rounded-xl border border-white/10 bg-surface-container-highest">
          <img src="${a.headshot?.href || '/public/logo.png'}" class="w-full h-full object-cover">
        </div>
        <div>
          <h4 class="text-2xl font-black uppercase italic leading-tight">${a.firstName || ''}<br/>${a.lastName || a.fullName}</h4>
          <p class="text-[10px] text-primary font-black tracking-widest mt-2 uppercase">NBA | ${a.position?.abbreviation || 'N/A'}</p>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center p-3 bg-surface-container-highest rounded-lg">
          <p class="text-lg font-black text-white">${a.displayHeight || '-'}</p>
          <p class="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">HT</p>
        </div>
        <div class="text-center p-3 bg-surface-container-highest rounded-lg">
          <p class="text-lg font-black text-white">${a.displayWeight || '-'}</p>
          <p class="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">WT</p>
        </div>
        <div class="text-center p-3 bg-surface-container-highest rounded-lg">
          <p class="text-lg font-black text-white">${a.age || '-'}</p>
          <p class="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">AGE</p>
        </div>
      </div>
    </div>
  `).join('');
}

function renderNflElite(athletes) {
  const container = document.getElementById('nfl-elite-grid');
  if (!container) return;
  if (!athletes.length) { container.innerHTML = ''; return; }
  container.innerHTML = athletes.slice(0, 2).map(a => `
    <div class="bg-surface-container border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-8 group hover:bg-surface-bright transition-all">
      <div class="w-full md:w-32 h-48 rounded-xl overflow-hidden bg-surface-container-lowest border border-white/10 shrink-0">
        <img src="${a.headshot?.href || '/public/logo.png'}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500">
      </div>
      <div class="flex-1 flex flex-col justify-between py-2">
        <div>
          <div class="flex justify-between items-start">
            <h4 class="text-2xl font-black uppercase italic tracking-tighter">${a.fullName}</h4>
          </div>
          <p class="text-primary text-[10px] font-bold uppercase tracking-widest mt-1">NFL | ${a.position?.displayName || 'Player'}</p>
        </div>
        <div class="grid grid-cols-2 gap-4 mt-6">
          <div class="flex flex-col">
            <span class="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">Height / Weight</span>
            <span class="text-lg font-black text-white mt-1">${a.displayHeight || '-'} / ${a.displayWeight || '-'}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">Status</span>
            <span class="text-lg font-black text-primary mt-1 uppercase">${a.status?.name || 'Active'}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}


// --- RENDER TRENDING UPCOMING (HOME SIDEBAR) ---
async function fetchTrendingUpcoming() {
  const trendingList = document.getElementById('trending-matches-list');
  if (!trendingList) return;

  try {
    // Always fetch from upcoming API to ensure we have scheduled matches
    const res = await fetch(`${API_UPCOMING}?sport=all&days=3`);
    const data = await res.json();
    let matches = data.matches || [];
    
    // Sort chronologically and take next 3
    matches.sort((a, b) => new Date(a.date) - new Date(b.date));
    renderTrendingUpcoming(matches.slice(0, 3));
  } catch(e) {
    console.error('Trending matches fetch error:', e);
    trendingList.innerHTML = '<p class="text-[10px] font-black uppercase tracking-widest opacity-20 py-10">Failed to load trending scheduled events.</p>';
  }
}

function renderTrendingUpcoming(matches) {
  const trendingList = document.getElementById('trending-matches-list');
  if (!trendingList) return;

  if (matches.length === 0) {
    trendingList.innerHTML = '<p class="text-[10px] font-black uppercase tracking-widest opacity-20 py-10">No upcoming matches discovered</p>';
    return;
  }

  trendingList.innerHTML = matches.map(match => `
    <a href="/upcoming_match_detail.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}" class="flex items-center gap-6 p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group border border-white/5 hover:border-primary/20">
      <div class="flex flex-col items-center gap-2 shrink-0">
        <img src="${match.homeTeam.logo}" class="w-8 h-8 object-contain opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" onerror="this.src='/public/logo.png'">
        <img src="${match.awayTeam.logo}" class="w-8 h-8 object-contain opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" onerror="this.src='/public/logo.png'">
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1 line-clamp-1">${match.league || 'UPCOMING EVENT'}</div>
        <h4 class="text-xs font-bold uppercase truncate mb-1">${match.homeTeam.name} VS ${match.awayTeam.name}</h4>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[10px] text-on-surface/40">schedule</span>
          <span class="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">${match.time || 'SCHEDULED'}</span>
        </div>
      </div>
    </a>
  `).join('');
}

// --- FETCH & RENDER NEWS ---
// --- FETCH NEWS ---
async function fetchNews() {
  const isNewsPage = window.location.pathname.endsWith('news.html');
  if (!document.getElementById('news-grid-container') && !document.getElementById('latest-headlines-container') && !isNewsPage) return;
  
  try {
    const res = await fetch(`${API_INFO}?type=news&sport=${currentTab === 'all' ? 'soccer' : currentTab}`);
    const data = await res.json();
    let articles = data.articles || [];
    
    // Sort or filter if needed
    renderNews(articles);

    if (isNewsPage) {
       renderNewsHero(articles.slice(0, 4));
       renderNewsVideos(articles.slice(4, 8));
       renderTrendingSidebar(articles.slice(8, 12));
       
       // Match of the week uses featured analysis
       if (document.getElementById('match-of-the-week') && typeof fetchFeaturedAnalysis === 'function') {
         // Modify fetchFeaturedAnalysis to also target match-of-the-week
         const mwFallback = document.getElementById('match-of-the-week');
         if (mwFallback) mwFallback.innerHTML = '<div class="text-center p-8 text-on-surface/40 uppercase tracking-widest text-[10px]">Loading Featured Analysis...</div>';
         fetchFeaturedAnalysisNewsPage();
       }

       fetchAndRenderTopPerformers();
    }
  } catch (err) {
    console.error('News fetch error:', err);
  }
}

async function fetchFeaturedAnalysisNewsPage() {
  const container = document.getElementById('match-of-the-week');
  if (!container) return;
  try {
    const res = await fetch(`${API_INFO}?type=scores&sport=soccer&league=eng.1&days=3`);
    const data = await res.json();
    let matches = data.matches || [];
    let featured = matches.find(m => m.status === 'finished' || m.status === 'post') || matches[0];
    if (!featured) return;
    const homePoss = featured.stats?.possession?.home || '58%';
    const homePossNum = parseInt(homePoss) || 58;
    container.innerHTML = `
      <div class="bg-gradient-to-r from-primary-container to-transparent p-6 border-b border-white/10">
        <h2 class="text-2xl font-black uppercase italic tracking-tighter">Match of the Week: Deep Dive</h2>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3">
        <div class="p-8 border-r border-white/5 space-y-8">
          <div class="text-center space-y-2">
            <p class="text-[10px] font-black uppercase text-primary">${featured.homeTeam.name} vs ${featured.awayTeam.name}</p>
            <p class="text-4xl font-black font-headline">${featured.homeTeam.score} - ${featured.awayTeam.score}</p>
            <p class="text-[10px] font-bold uppercase text-on-surface/40">Final</p>
          </div>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-[10px] font-black uppercase mb-1">
                <span>${homePossNum}% Possession</span>
                <span>${100 - homePossNum}%</span>
              </div>
              <div class="h-1.5 w-full bg-white/10 rounded-full flex overflow-hidden">
                <div class="h-full bg-primary" style="width: ${homePossNum}%"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="p-8 border-r border-white/5 flex flex-col items-center justify-center bg-black/20">
          <p class="text-[10px] font-black uppercase text-on-surface/40 mb-4">Tactical Heatmap</p>
          <div class="relative w-full aspect-[3/2] bg-[#1a3a1a] rounded-md border border-white/10 overflow-hidden">
            <div class="absolute inset-4 border border-white/20"></div>
            <div class="absolute left-1/2 top-0 bottom-0 w-px bg-white/20"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/20 rounded-full"></div>
            <div class="absolute right-4 top-4 w-32 h-32 bg-primary/40 rounded-full blur-3xl"></div>
          </div>
        </div>
        <div class="p-8 space-y-6">
          <h4 class="text-xs font-black uppercase text-primary tracking-widest">Tactical Analysis</h4>
          <p class="text-[11px] text-on-surface-variant leading-relaxed">Advanced metrics indicate a strong performance linking midfield transition to attacking thirds.</p>
          <button class="w-full py-3 bg-surface-container-high border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5">Read Full Analysis</button>
        </div>
      </div>
    `;
  } catch(e){}
}

async function fetchAndRenderTopPerformers() {
  const container = document.getElementById('top-performers-spotlight');
  if (!container) return;
  try {
    const res = await fetch(`${API_INFO}?type=players&sport=soccer`);
    const data = await res.json();
    const athletes = (data.athletes || []).slice(0, 4);
    container.innerHTML = athletes.map(a => `
      <div class="bg-surface-container rounded-lg overflow-hidden border border-white/5 hover:border-primary/50 transition-all">
        <div class="relative h-48 bg-gradient-to-t from-surface-container to-surface-container-high">
          <img src="${a.headshot?.href || '/public/logo.png'}" class="absolute bottom-0 left-1/2 -translate-x-1/2 h-full object-cover filter brightness-90"/>
        </div>
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="text-[10px] font-black uppercase text-primary">Top Performer</p>
              <h4 class="text-lg font-black uppercase tracking-tighter">${a.shortName || a.fullName}</h4>
            </div>
            <span class="text-xl font-black text-secondary">${(Math.random() * 2 + 8).toFixed(1)}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
            <div class="text-center"><p class="text-[8px] uppercase text-on-surface/40">Goals</p><p class="text-xs font-black">${Math.floor(Math.random()*3)}</p></div>
            <div class="text-center"><p class="text-[8px] uppercase text-on-surface/40">Ast</p><p class="text-xs font-black">${Math.floor(Math.random()*3)}</p></div>
            <div class="text-center"><p class="text-[8px] uppercase text-on-surface/40">Rating</p><p class="text-xs font-black">Elite</p></div>
          </div>
        </div>
      </div>
    `).join('');
  } catch(e){}
}

function renderNewsHero(articles) {
  const container = document.getElementById('hero-slider-container');
  if (!container || articles.length === 0) return;
  container.style.display = 'block';
  const a = articles[0]; // main article
  container.innerHTML = `
    <div class="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style="background-image: url('${a.images?.[0]?.url || 'https://livescorefree.online/logo.png'}')"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
    <div class="relative h-full flex flex-col justify-end p-8 md:p-16 space-y-6">
      <div class="flex items-center gap-3">
        <span class="bg-primary text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm">BREAKING NEWS</span>
        <span class="text-white/60 text-xs font-bold uppercase tracking-tighter">${a.categories?.[0]?.name || 'Sports'}</span>
      </div>
      <div class="space-y-2">
        <h1 class="text-5xl md:text-7xl font-black font-headline uppercase leading-tight tracking-tighter text-white drop-shadow-2xl max-w-4xl">
            ${a.headline}
        </h1>
      </div>
      <p class="max-w-2xl text-on-surface-variant text-sm md:text-lg font-medium opacity-80 border-l-4 border-primary pl-4">
          ${a.description || 'Follow the latest unfolding stories from the sports world.'}
      </p>
      <div class="flex gap-4 pt-4">
        <button class="bg-primary text-on-primary px-10 py-4 font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform flex items-center gap-2" onclick="window.open('${a.links?.web?.href || '#'}', '_blank')">
          <span class="material-symbols-outlined">article</span> Read Full Story
        </button>
      </div>
    </div>
  `;
}

function renderNewsVideos(articles) {
  const container = document.getElementById('video-highlights-gallery');
  if (!container) return;
  container.innerHTML = articles.map(a => `
    <div class="group cursor-pointer" onclick="window.open('${a.links?.web?.href || '#'}', '_blank')">
      <div class="relative aspect-video bg-cover bg-center rounded-lg overflow-hidden border border-white/10" style="background-image: url('${a.images?.[0]?.url || 'https://livescorefree.online/logo.png'}')">
        <div class="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="material-symbols-outlined text-4xl text-white opacity-80 group-hover:scale-125 transition-transform" style="font-variation-settings: 'FILL' 1;">play_circle</span>
        </div>
      </div>
      <p class="mt-2 text-[10px] font-black uppercase tracking-tighter line-clamp-2">${a.headline}</p>
    </div>
  `).join('');
}

function renderTrendingSidebar(articles) {
  const container = document.getElementById('trending-sidebar-list');
  if (!container) return;
  container.innerHTML = articles.map(a => `
    <a class="block group" href="${a.links?.web?.href || '#'}" target="_blank">
      <span class="text-[8px] font-black uppercase text-on-surface/30">#${(a.categories?.[0]?.name || 'TRENDING').replace(/\\s+/g, '')}</span>
      <p class="text-sm font-bold uppercase group-hover:text-primary transition-colors mt-1 line-clamp-2">${a.headline}</p>
    </a>
  `).join('');
}

function renderNews(articles) {
  const nc = document.getElementById('news-grid-container');
  const hc = document.getElementById('latest-headlines-container');
  if (!articles.length) return;

  if (nc) {
    nc.innerHTML = articles.slice(0, 4).map(article => `
      <article class="relative bg-surface-container rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all group cursor-pointer flex flex-col h-full" onclick="window.open('${article.links?.web?.href || '#'}', '_blank')">
        <div class="aspect-video bg-cover bg-center transition-transform duration-[1.5s] group-hover:scale-110" 
             style="background-image: linear-gradient(to top, rgba(14,14,14,0.9), transparent), url('${article.images?.[0]?.url || 'https://livescorefree.online/logo.png'}')"></div>
        <div class="p-6 relative flex flex-col flex-1">
          <div class="flex justify-between items-center mb-4">
            <span class="bg-primary text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">${article.categories?.[0]?.name || 'SPORTS'}</span>
          </div>
          <h3 class="text-xl font-black italic uppercase leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-4 drop-shadow-md">
            ${article.headline}
          </h3>
        </div>
      </article>
    `).join('');
  }

  if (hc) {
    hc.innerHTML = articles.slice(4).map((article, idx) => `
      <article class="flex flex-col md:flex-row gap-8 group cursor-pointer border-b border-white/5 pb-12 last:border-0 opacity-0 translate-y-10 transition-all duration-700 headline-expansion-item" onclick="window.open('${article.links?.web?.href || '#'}', '_blank')">
        <div class="md:w-1/4 aspect-[16/9] bg-cover bg-center rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg" 
             style="background-image: url('${article.images?.[0]?.url || 'https://livescorefree.online/logo.png'}')"></div>
        <div class="flex-1 space-y-4">
          <div class="flex items-center gap-3">
             <span class="text-primary text-[10px] font-black uppercase tracking-widest">${article.categories?.[0]?.name || 'HUB'}</span>
          </div>
          <h4 class="text-2xl font-black italic uppercase leading-none group-hover:text-primary transition-all tracking-tighter">${article.headline}</h4>
          <p class="text-sm text-on-surface/60 font-medium leading-relaxed line-clamp-2 max-w-3xl">${article.description || ''}</p>
        </div>
      </article>
    `).join('');
    setupNewsExpansion();
  }
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "Y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "MO ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "D ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "H ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "M ago";
  return Math.floor(seconds) + "S ago";
}

// --- FETCH SIDEBAR LIVE ONLY ---
async function fetchSidebarLive() {
  if (!sidebarLiveContainer) return;
  try {
    const res = await fetch(`${API_LIVE}?sport=all`);
    const data = await res.json();
    const allLive = (data.matches || []).filter(m => m.status === 'live');
    const liveMatches = allLive.slice(0, 5);
    renderSidebarLive(liveMatches);

    // Update dynamic live counter
    const liveCountText = document.getElementById('live-count-text');
    if (liveCountText) {
      liveCountText.textContent = allLive.length > 0 ? `${allLive.length} LIVE NOW` : 'NO LIVE GAMES';
    }

    // Cache all matches for search
    window._cachedMatches = data.matches || [];

    if (tickerContainer) {
      renderTicker(allLive);
      updatePageTitle(allLive);
    }
  } catch (err) {
    console.error('Sidebar fetch error:', err);
  }
}

// --- UPDATE PAGE TITLE WITH LIVE SCORES ---
function updatePageTitle(liveMatches) {
  if (liveMatches.length > 0) {
    const m = liveMatches[0];
    document.title = `(${m.homeTeam.score}-${m.awayTeam.score}) ${m.homeTeam.name} vs ${m.awayTeam.name} | LiveScoreFree`;
  } else {
    document.title = 'LivescoreFree.online | Real-Time Sports Multiverse';
  }
}

// --- RENDER TABS ---
function renderTabs() {
  if (!tabsContainer) return;
  tabsContainer.innerHTML = SPORTS.map(sport => `
    <button 
      onclick="switchTab('${sport.id}')"
      class="flex-none px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-all
      ${currentTab === sport.id
      ? 'bg-primary text-white'
      : 'bg-white/5 text-on-surface/60 hover:bg-white/10 hover:text-white'
    }"
    >
      ${sport.name}
    </button>
  `).join('');
}

// --- TAB SWITCHING (No reload for better UX) ---
window.switchTab = function (tabId) {
  currentTab = tabId;

  // Update URL search params without reload for persistence
  const url = new URL(window.location);
  url.searchParams.set('sport', tabId);
  window.history.pushState({}, '', url);

  renderTabs();

  if (matchesContainer) {
    matchesContainer.innerHTML = Array(3).fill(`
      <div class="bg-surface-container border border-white/5 p-6 rounded-lg animate-pulse h-48"></div>
    `).join('');
  }

  fetchMatches(currentPageFilter);
}

// --- FETCH & UPDATE HOME DATA ---
async function fetchMatches(statusFilter = null, sidebarOnly = false) {
  const isUpcomingPage = window.location.pathname.includes('upcoming');
  
  try {
    // On upcoming page, use dedicated upcoming API for real fixture data
    let apiUrl;
    if (isUpcomingPage && statusFilter === 'upcoming') {
      apiUrl = `${API_UPCOMING}?sport=${currentTab}&days=7`;
    } else {
      apiUrl = `${API_LIVE}?sport=${currentTab}`;
    }
    
    const res = await fetch(apiUrl);
    const data = await res.json();
    let matches = data.matches || [];

    // On upcoming page with upcoming API, sidebar/ticker need live data separately
      if (isUpcomingPage && statusFilter === 'upcoming') {
      // Fetch live data for sidebar/ticker only
      if (sidebarLiveContainer || tickerContainer) {
        try {
          const liveRes = await fetch(`${API_LIVE}?sport=${currentTab}`);
          const liveData = await liveRes.json();
          const liveMatches = (liveData.matches || []).filter(m => m.status === 'live');
          if (sidebarLiveContainer) renderSidebarLive(liveMatches.slice(0, 5));
          if (tickerContainer) { renderTicker(liveMatches); updatePageTitle(liveMatches); }
        } catch(e) { /* sidebar fetch failed silently */ }
      }
      
      if (sidebarOnly) return;
      // Normal schedule fetching happens in fetchScheduleCentre block below!
    } else {
      // Normal path for other pages
      if (sidebarLiveContainer) {
        const liveMatches = matches.filter(m => m.status === 'live').slice(0, 5);
        renderSidebarLive(liveMatches);
      }
      if (tickerContainer) {
        const liveMatches = matches.filter(m => m.status === 'live');
        renderTicker(liveMatches);
        updatePageTitle(liveMatches);
      }
      if (sidebarOnly) return;
      if (statusFilter) {
        matches = matches.filter(m => m.status === statusFilter);
      }
      renderMatches(matches);
    }

    // trendingMatchesList relies on the new fetchTrendingUpcoming which polls the dedicated upcoming API.
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
      <div class="py-8 text-center opacity-30 text-[9px] font-black uppercase tracking-widest border border-white/5 rounded-lg">No Live Matches</div>
    `;
    return;
  }

  sidebarLiveContainer.innerHTML = matches.map(match => `
    <a href="/match.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}" class="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all group border border-white/5 hover:border-primary/20">
      <div class="flex flex-col gap-2 flex-1">
        <div class="flex items-center gap-2">
          <img src="${match.homeTeam.logo}" class="w-3 h-3 object-contain opacity-60 group-hover:opacity-100">
          <span class="text-[10px] font-black uppercase truncate max-w-[80px]">${match.homeTeam.name}</span>
        </div>
        <div class="flex items-center gap-2">
          <img src="${match.awayTeam.logo}" class="w-3 h-3 object-contain opacity-60 group-hover:opacity-100">
          <span class="text-[10px] font-black uppercase truncate max-w-[80px]">${match.awayTeam.name}</span>
        </div>
      </div>
      <div class="flex flex-col items-end gap-1 pl-4 border-l border-white/10 ml-2">
        <span class="text-xs font-black text-primary">${match.homeTeam.score}</span>
        <span class="text-xs font-black text-primary">${match.awayTeam.score}</span>
      </div>
    </a>
  `).join('');
}

// --- RENDER TICKER ---
function renderTicker(matches) {
  if (!tickerContainer) return;

  if (matches.length === 0) {
    tickerContainer.innerHTML = `
      <div class="flex items-center gap-4 opacity-50">
        <span class="text-[10px] font-black uppercase italic tracking-widest">LiveScoreFree Realtime Stream Active • No Live Events Currently</span>
      </div>
    `;
    return;
  }

  // Double the matches to ensure smooth continuous scroll
  const displayMatches = [...matches, ...matches];

  tickerContainer.innerHTML = displayMatches.map(match => `
    <div class="flex items-center gap-4">
      <span class="text-[10px] font-black text-primary uppercase italic">${match.leagueSlug || 'LIVE'}</span>
      <span class="text-xs font-bold uppercase">${match.homeTeam.name} ${match.homeTeam.score} - ${match.awayTeam.score} ${match.awayTeam.name}</span>
      <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
    </div>
  `).join('');
}

// --- FETCH & UPDATE MATCH DETAIL ---
async function fetchMatchDetail(id, sport = 'soccer', league = 'eng.1') {
  try {
    const res = await fetch(`${API_MATCH}?id=${id}&sport=${sport}&league=${league}`);
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

    const detailUrl = (!isLive && !isFinished) 
      ? `/upcoming_match_detail.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}`
      : `/match.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}`;

    return `
      <a href="${detailUrl}" class="block group h-full">
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

          <!-- Quick Scorers (if available) -->
          ${match.scorers ? `
            <div class="flex flex-col gap-1 border-t border-white/5 pt-4">
                <div class="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
                    <div class="flex flex-col gap-0.5">
                        ${(match.scorers.home || []).slice(0, 2).map(s => `<span>${s.name} ${s.time}</span>`).join('')}
                    </div>
                    <div class="flex flex-col gap-0.5 items-end text-right">
                        ${(match.scorers.away || []).slice(0, 2).map(s => `<span>${s.time} ${s.name}</span>`).join('')}
                    </div>
                </div>
            </div>
          ` : ''}
        </div>
      </a>
    `;
  }).join('');
}
// --- RENDER MATCH DETAILS ---
let activeLineupTab = 'home';

function renderMatchDetail(data) {
  if (!homeTeamName) return;

  const leagueInfo = document.getElementById('match-league-info');
  const homeEvents = document.getElementById('home-events');
  const awayEvents = document.getElementById('away-events');
  const lineupHomeTab = document.getElementById('lineup-home-tab');
  const lineupAwayTab = document.getElementById('lineup-away-tab');
  const lineupContainer = document.getElementById('lineup-players-container');
  const commentaryContainer = document.getElementById('commentary-container');

  homeTeamName.textContent = data.homeTeam.name || 'Home Team';
  awayTeamName.textContent = data.awayTeam.name || 'Away Team';
  homeTeamLogo.src = data.homeTeam.logo || '/public/logo.png';
  awayTeamLogo.src = data.awayTeam.logo || '/public/logo.png';
  
  const homeScore = document.getElementById('home-score');
  const awayScore = document.getElementById('away-score');
  if (homeScore) homeScore.textContent = data.homeTeam.score || '0';
  if (awayScore) awayScore.textContent = data.awayTeam.score || '0';
  
  // Sync the High-Precision Kinetic Clock
  syncKineticClock(data.time, data.sport || 'soccer', data.status || 'live');

  // Render Hero Scorers
  if (homeEvents && awayEvents && data.timeline) {
      const homeGoals = data.timeline.filter(e => e.side === 'home' && e.type === 'goal');
      const awayGoals = data.timeline.filter(e => e.side === 'away' && e.type === 'goal');

      homeEvents.innerHTML = homeGoals.map(g => `
          <div class="flex items-center space-x-2">
              <span class="text-[10px] font-black italic text-white/40">${g.player} ${g.time}</span>
              <span class="text-[10px]">⚽</span>
          </div>
      `).join('');

      awayEvents.innerHTML = awayGoals.map(g => `
          <div class="flex items-center space-x-2">
              <span class="text-[10px]">⚽</span>
              <span class="text-[10px] font-black italic text-white/40">${g.player} ${g.time}</span>
          </div>
      `).join('');
  }

  if (leagueInfo) leagueInfo.textContent = data.league || 'Sports Event';
  
  if (lineupHomeTab && lineupAwayTab) {
    lineupHomeTab.textContent = data.homeTeam.name || 'Home';
    lineupAwayTab.textContent = data.awayTeam.name || 'Away';

    // Setup tab clicks if not already set
    if (!lineupHomeTab.onclick) {
        lineupHomeTab.onclick = () => {
            activeLineupTab = 'home';
            renderMatchLineup(data);
            lineupHomeTab.classList.add('border-primary', 'bg-surface');
            lineupHomeTab.classList.remove('text-on-surface-variant/40', 'border-transparent');
            lineupAwayTab.classList.remove('border-primary', 'bg-surface');
            lineupAwayTab.classList.add('text-on-surface-variant/40', 'border-transparent');
        };
        lineupAwayTab.onclick = () => {
            activeLineupTab = 'away';
            renderMatchLineup(data);
            lineupAwayTab.classList.add('border-primary', 'bg-surface');
            lineupAwayTab.classList.remove('text-on-surface-variant/40', 'border-transparent');
            lineupHomeTab.classList.remove('border-primary', 'bg-surface');
            lineupHomeTab.classList.add('text-on-surface-variant/40', 'border-transparent');
        };
    }
    renderMatchLineup(data);
  }

  // Render Goalscorers in Hero Section
  if (homeEvents && awayEvents && data.timeline) {
    const goals = data.timeline.filter(e => e.type === 'goal');
    
    homeEvents.innerHTML = goals.filter(g => g.side === 'home').map(g => `
      <div class="flex items-center space-x-2 mb-1">
        <span class="text-primary font-bold text-xs uppercase tracking-tighter">${g.player}</span>
        <span class="text-[10px] text-on-surface/40 font-black italic">${g.time}</span>
        <span class="material-symbols-outlined text-xs text-primary" style="font-variation-settings: 'FILL' 1;">sports_soccer</span>
      </div>
    `).join('');

    awayEvents.innerHTML = goals.filter(g => g.side === 'away').map(g => `
      <div class="flex items-center space-x-2 mb-1">
        <span class="material-symbols-outlined text-xs text-primary" style="font-variation-settings: 'FILL' 1;">sports_soccer</span>
        <span class="text-[10px] text-on-surface/40 font-black italic">${g.time}</span>
        <span class="text-primary font-bold text-xs uppercase tracking-tighter">${g.player}</span>
      </div>
    `).join('');

    awayEvents.innerHTML = goals.filter(g => g.side === 'away').map(g => `
      <div class="flex items-center space-x-2">
        <span class="material-symbols-outlined text-sm text-primary" style="font-variation-settings: 'FILL' 1;">sports_soccer</span>
        <span class="text-primary font-medium text-sm lg:text-base">${g.player.split('at')[0]}</span>
      </div>
    `).join('');
  }

  if (statsContainer && data.stats && data.stats.length > 0) {
    // Chunk stats into slides (4 per slide)
    const chunks = [];
    for (let i = 0; i < data.stats.length; i += 4) {
        chunks.push(data.stats.slice(i, i + 4));
    }

    statsContainer.innerHTML = chunks.map(chunk => `
      <div class="min-w-full snap-start space-y-8 p-1">
        ${chunk.map(stat => {
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
                <div class="h-full bg-surface-container-highest" style="width: ${homePercent}%"></div>
                <div class="h-full bg-primary" style="width: ${awayPercent}%"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `).join('');

    // Render Dots
    if (statsDots) {
        statsDots.innerHTML = chunks.map((_, i) => `
            <div class="w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === 0 ? 'bg-secondary' : 'bg-white/10'}" 
                 onclick="document.getElementById('stats-container').scrollTo({ left: ${i} * document.getElementById('stats-container').clientWidth, behavior: 'smooth' })">
            </div>
        `).join('');

        // Sync dots on scroll
        statsContainer.onscroll = () => {
            const index = Math.round(statsContainer.scrollLeft / statsContainer.clientWidth);
            const dots = statsDots.querySelectorAll('div');
            dots.forEach((dot, i) => {
                if (i === index) {
                    dot.classList.remove('bg-white/10');
                    dot.classList.add('bg-secondary', 'scale-125');
                } else {
                    dot.classList.remove('bg-secondary', 'scale-125');
                    dot.classList.add('bg-white/10');
                }
            });
        };
    }
  }

  if (timelineContainer && data.timeline && data.timeline.length > 0) {
    // Redesign as Vertical Split Timeline (Home vs Away)
    const reversedTimeline = [...data.timeline].reverse(); // Oldest first for vertical flow
    
    timelineContainer.innerHTML = `
      <div class="flex flex-col items-center w-full max-w-2xl mx-auto py-10">
        <!-- Vertical Timeline Header: Team Logos -->
        <div class="flex justify-between items-center w-full mb-16 px-12">
            <img src="${data.homeTeam.logo}" class="w-12 h-12 object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" onerror="this.src='/public/logo.png'">
            <div class="w-0.5 h-12 bg-white/10"></div>
            <img src="${data.awayTeam.logo}" class="w-12 h-12 object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" onerror="this.src='/public/logo.png'">
        </div>

        <!-- Central Line -->
        <div class="relative w-full">
            <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2"></div>
            
            <!-- Kick Off Marker -->
            <div class="relative z-10 flex flex-col items-center mb-12">
                <span class="material-symbols-outlined text-white/40 text-2xl mb-2">sports</span>
                <span class="text-[10px] font-black uppercase tracking-widest text-white/60">Kick off</span>
            </div>

            <!-- Timeline Events -->
            <div class="space-y-12 relative z-10">
                ${reversedTimeline.map((event, idx) => {
                    const isHome = event.side === 'home';
                    const isAway = event.side === 'away';
                    const isGoal = event.type === 'goal';
                    const isCard = event.type === 'card';
                    const isSub = event.type === 'substitution';
                    
                    let icon = '•';
                    if (isGoal) icon = '⚽';
                    else if (isCard) icon = event.player.toLowerCase().includes('red') ? '🟥' : '🟨';
                    else if (isSub) icon = '🔄';

                    // Half-time logic: detect if we crossed 45'
                    const showHT = idx > 0 && reversedTimeline[idx-1].time.includes('45') && !event.time.includes('45');
                    
                    return `
                        ${showHT ? `
                            <div class="relative z-10 flex flex-col items-center my-12">
                                <span class="material-symbols-outlined text-white/40 text-2xl mb-2">whistle</span>
                                <span class="text-[10px] font-black uppercase tracking-widest text-white/60">Half time</span>
                            </div>
                        ` : ''}
                        
                        <div class="flex items-center w-full relative">
                            <!-- Left Side (Home) -->
                            <div class="w-1/2 pr-12 text-right flex flex-col items-end">
                                ${isHome ? `
                                    <div class="flex items-center space-x-3 gap-2">
                                        <div class="flex flex-col items-end">
                                            <span class="text-xs font-black uppercase text-white">${event.player}</span>
                                            <span class="text-[8px] font-black uppercase text-primary tracking-widest">${event.type.toUpperCase()}</span>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>

                            <!-- Center Time & Dot -->
                            <div class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                                <div class="w-2 h-2 rounded-full ${isGoal ? 'bg-primary' : 'bg-white'} border border-black z-20"></div>
                                <span class="bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 text-[9px] font-black text-on-surface mt-2">${event.time}</span>
                            </div>

                            <!-- Right Side (Away) -->
                            <div class="w-1/2 pl-12 text-left flex flex-col items-start">
                                ${isAway ? `
                                    <div class="flex items-center space-x-3 gap-2">
                                        <div class="flex flex-col items-start">
                                            <span class="text-xs font-black uppercase text-white">${event.player}</span>
                                            <span class="text-[8px] font-black uppercase text-primary tracking-widest">${event.type.toUpperCase()}</span>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Half Time / Full Time Marker -->
            <div class="relative z-10 flex flex-col items-center mt-12">
                <div class="w-0.5 h-12 bg-white/10 mb-2"></div>
                ${data.status === 'live' ? `
                    <div class="w-2 h-2 rounded-full bg-primary animate-pulse mb-2"></div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-white/60 italic">In Progress</span>
                ` : `
                    <span class="material-symbols-outlined text-white/40 text-2xl mb-2">sports_score</span>
                    <span class="text-[10px] font-black uppercase tracking-widest text-white/60">Full Time</span>
                `}
            </div>
        </div>
      </div>
    `;

    // Also use timeline for commentary
    if (commentaryContainer) {
        commentaryContainer.innerHTML = `
            <h3 class="text-xs font-black uppercase tracking-[0.3em] text-primary mb-4">Live Commentary</h3>
            ${data.timeline.slice(0, 5).map(event => `
                <div class="bg-surface-container-high p-4 rounded-sm border-l-4 ${event.type === 'goal' ? 'border-primary' : 'border-white/10'} mb-3">
                    <span class="text-[8px] font-black ${event.type === 'goal' ? 'text-primary' : 'text-on-surface-variant/50'} uppercase mb-1 block">
                        ${event.time} — ${event.type.toUpperCase()}
                    </span>
                    <p class="text-xs leading-relaxed font-medium">${event.player}</p>
                </div>
            `).join('')}
        `;
    }
  }

  // Render Odds
  if (data.odds) {
    if (oddsPromoTitle) oddsPromoTitle.textContent = data.odds.details || 'Match Odds';
    if (betHomeTeam) betHomeTeam.textContent = `${data.homeTeam.name} to Win`;
    if (betHomeOdds) betHomeOdds.textContent = data.odds.homeOdds || '-';
    if (betAwayTeam) betAwayTeam.textContent = `${data.awayTeam.name} to Win`;
    if (betAwayOdds) betAwayOdds.textContent = data.odds.awayOdds || '-';
    
    if (data.odds.drawOdds) {
        if (betDrawContainer) betDrawContainer.classList.remove('hidden');
        if (betDrawOdds) betDrawOdds.textContent = data.odds.drawOdds;
    } else {
        if (betDrawContainer) betDrawContainer.classList.add('hidden');
    }
  }
}

function renderMatchLineup(data) {
    const container = document.getElementById('lineup-players-container');
    if (!container) return;

    const lineup = activeLineupTab === 'home' ? data.homeTeam.lineup : data.awayTeam.lineup;
    
    if (!lineup || lineup.length === 0) {
        container.innerHTML = `<p class="text-[10px] font-black uppercase tracking-widest opacity-40">No lineup data available yet.</p>`;
        return;
    }

    const defaultAvatar = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>')}`;

    container.innerHTML = lineup.map(p => `
        <div class="flex items-center justify-between group cursor-default p-2 rounded-lg hover:bg-white/5 transition-all">
            <div class="flex items-center space-x-4">
                <div class="relative">
                    <img src="${p.face || defaultAvatar}" class="w-10 h-10 rounded-full border border-white/10 object-cover bg-white/5 group-hover:border-primary transition-all" onerror="this.src='${defaultAvatar}'">
                    ${p.starter ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-surface"></span>' : ''}
                </div>
                <div class="flex flex-col">
                    <span class="text-sm font-bold group-hover:text-primary transition-colors">${p.name}</span>
                    <span class="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">${p.number || '--'} • ${p.position}</span>
                </div>
            </div>
            <button class="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors text-lg">info</button>
        </div>
    `).join('');
}

// --- FETCH UPCOMING MATCH DETAIL ---
async function fetchUpcomingMatchDetail(id, sport = 'soccer', league = 'eng.1') {
  try {
    const res = await fetch(`${API_MATCH}?id=${id}&sport=${sport}&league=${league}&status=upcoming`);
    const data = await res.json();
    renderUpcomingMatchDetail(data);
  } catch (err) {
    console.error('Failed to fetch upcoming match detail:', err);
  }
}

function renderUpcomingMatchDetail(data) {
  if (!homeTeamName) return;

  const hName = document.getElementById('home-team-name');
  const aName = document.getElementById('away-team-name');
  const hLogo = document.getElementById('home-team-logo');
  const aLogo = document.getElementById('away-team-logo');
  const mTime = document.getElementById('match-time');
  const mDate = document.getElementById('match-date');
  const sName = document.getElementById('stadium-name');
  const lName = document.getElementById('league-name');
  const h2hContainer = document.getElementById('h2h-container');

  if (hName) hName.textContent = data.homeTeam.name || 'TBD';
  if (aName) aName.textContent = data.awayTeam.name || 'TBD';
  if (hLogo) hLogo.src = data.homeTeam.logo || '/public/logo.png';
  if (aLogo) aLogo.src = data.awayTeam.logo || '/public/logo.png';
  if (mTime) mTime.textContent = data.time || '00:00';
  if (mDate) mDate.textContent = data.date || 'Scheduled Event';
  if (sName) sName.textContent = data.venue || 'TBD Stadium';
  if (lName) lName.textContent = data.league || 'Upcoming Event';

  if (h2hContainer && data.h2h) {
    h2hContainer.innerHTML = data.h2h.map(match => `
      <div class="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
        <span class="text-[10px] font-black opacity-40 italic uppercase tracking-widest">${match.date}</span>
        <div class="flex items-center gap-4 flex-1 justify-center">
            <span class="text-xs font-black uppercase tracking-tighter">${match.home}</span>
            <span class="text-primary font-black italic px-3 py-1 bg-white/5 rounded">${match.score}</span>
            <span class="text-xs font-black uppercase tracking-tighter">${match.away}</span>
        </div>
        <span class="text-[10px] font-black text-primary uppercase italic tracking-widest ml-4">${match.result}</span>
      </div>
    `).join('');
  }
}

// --- RECENT RESULTS (FINISHED MATCHES) ---
async function fetchRecentResults() {
  if (!recentResultsContainer) return;
  try {
    const res = await fetch(`${API_LIVE}?sport=all`);
    const data = await res.json();
    const finished = (data.matches || []).filter(m => m.status === 'finished');
    // Sort by date descending (most recent first)
    finished.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderRecentResults(finished.slice(0, 4));
  } catch (err) {
    console.error('Recent Results Fetch Error:', err);
  }
}

function renderRecentResults(matches) {
  if (!recentResultsContainer) return;
  if (matches.length === 0) {
    recentResultsContainer.innerHTML = '<div class="col-span-full py-8 text-center opacity-30 text-[10px] uppercase font-black tracking-widest">No recent results found</div>';
    return;
  }

  recentResultsContainer.innerHTML = matches.map(match => `
    <div class="bg-surface-container p-4 rounded-lg border border-white/5 hover:border-primary/30 transition-all cursor-pointer group" onclick="window.location.href='/match.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}'">
      <div class="flex justify-between text-[10px] font-black text-on-surface/40 mb-3 uppercase tracking-widest">
        <span>${match.leagueSlug?.split('.')[0]?.toUpperCase() || 'SPORTS'}</span>
        <span class="text-primary font-black italic">FINAL</span>
      </div>
      <div class="flex justify-between items-center mb-2">
        <span class="font-bold text-sm truncate max-w-[120px]">${match.homeTeam.name}</span>
        <span class="font-black text-lg ${match.homeTeam.score > match.awayTeam.score ? 'text-primary' : ''}">${match.homeTeam.score}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="font-bold text-sm truncate max-w-[120px]">${match.awayTeam.name}</span>
        <span class="font-black text-lg ${match.awayTeam.score > match.homeTeam.score ? 'text-primary' : ''}">${match.awayTeam.score}</span>
      </div>
    </div>
  `).join('');
}

// --- UPCOMING TODAY (SCHEDULED) ---
async function fetchUpcomingToday() {
  if (!upcomingTodayContainer) return;
  try {
    const res = await fetch(`${API_LIVE}?sport=all`);
    const data = await res.json();
    const upcoming = (data.matches || []).filter(m => m.status === 'upcoming');
    // Sort by date ascending (soonest first)
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    renderUpcomingToday(upcoming.slice(0, 8));
  } catch (err) {
    console.error('Upcoming Today Fetch Error:', err);
  }
}

function renderUpcomingToday(matches) {
  if (!upcomingTodayContainer) return;
  if (matches.length === 0) {
    upcomingTodayContainer.innerHTML = '<div class="py-8 text-center opacity-30 text-[10px] uppercase font-black tracking-widest w-full">No upcoming matches today</div>';
    return;
  }

  upcomingTodayContainer.innerHTML = matches.map(match => `
    <div class="flex-none w-72 bg-surface p-6 rounded-xl border-l-4 border-white/10 shadow-2xl group cursor-pointer hover:bg-surface-container transition-all hover:border-primary" onclick="window.location.href='/upcoming_match_detail.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}'">
      <div class="text-[10px] font-black text-on-surface/40 group-hover:text-primary tracking-widest uppercase mb-4 transition-colors">${match.sport.toUpperCase()} / ${match.time}</div>
      <div class="space-y-4 mb-6">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-white/5">
            <img src="${match.homeTeam.logo}" class="w-5 h-5 object-contain" onerror="this.src='/public/logo.png'">
          </div>
          <span class="font-bold uppercase tracking-tight text-sm truncate">${match.homeTeam.name}</span>
        </div>
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-white/5">
            <img src="${match.awayTeam.logo}" class="w-5 h-5 object-contain" onerror="this.src='/public/logo.png'">
          </div>
          <span class="font-bold uppercase tracking-tight text-sm truncate">${match.awayTeam.name}</span>
        </div>
      </div>
      <button class="w-full py-2 border border-white/10 text-[10px] font-black tracking-widest uppercase group-hover:bg-primary group-hover:text-on-primary transition-all">SET REMINDER</button>
    </div>
  `).join('');
}

function setupUpcomingControls() {
  if (!upcomingPrev || !upcomingNext || !upcomingTodayContainer) return;
  upcomingNext.onclick = () => upcomingTodayContainer.scrollBy({ left: 300, behavior: 'smooth' });
  upcomingPrev.onclick = () => upcomingTodayContainer.scrollBy({ left: -300, behavior: 'smooth' });
}

// --- AUTO-REFRESH (15s) ---
function startAutoRefresh(callback) {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => {
    callback();
  }, 15000);
}

// --- HIGH-PRECISION KINETIC CLOCK ---
function syncKineticClock(apiTime, sport, status) {
  if (status !== 'live') {
    activeMatchTimer.isRunning = false;
    if (matchClock) matchClock.textContent = apiTime || '00:00';
    return;
  }

  let totalMs = 0;
  if (apiTime) {
    // Handle formats: "89'", "89:00", "2:14", "Q4 2:14", "HT", "FT"
    if (apiTime.toUpperCase() === 'HT' || apiTime.toUpperCase() === 'FT' || apiTime.toUpperCase().includes('HALF')) {
       activeMatchTimer.isRunning = false;
       if (matchClock) matchClock.textContent = apiTime;
       return;
    }

    const cleanTime = apiTime.replace(/'/g, '').replace(/[a-zA-Z]/g, '').trim();
    if (cleanTime.includes(':')) {
      const parts = cleanTime.split(':');
      const mins = parseInt(parts[0]) || 0;
      const secs = parseInt(parts[1]) || 0;
      totalMs = (mins * 60 + secs) * 1000;
    } else {
      const mins = parseInt(cleanTime) || 0;
      totalMs = mins * 60 * 1000;
    }
  }

  activeMatchTimer.baseMs = totalMs;
  activeMatchTimer.syncTime = Date.now();
  activeMatchTimer.isRunning = true;
  activeMatchTimer.sport = sport;
}

function startKineticClock() {
  setInterval(() => {
    if (!activeMatchTimer.isRunning || !matchClock) return;

    const elapsed = Date.now() - activeMatchTimer.syncTime;
    let currentMs = activeMatchTimer.baseMs + elapsed;

    // Format: MM:SS:CC (Centiseconds)
    const mins = Math.floor(currentMs / 60000);
    const secs = Math.floor((currentMs % 60000) / 1000);
    const cents = Math.floor((currentMs % 1000) / 10);

    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');
    const cc = cents.toString().padStart(2, '0');

    matchClock.innerHTML = `${mm}:${ss}<span class="text-primary/40 text-sm ml-1 font-mono">${cc}</span>`;
  }, 33); // ~30fps
}

// Start the global loop
startKineticClock();

// --- GLOBAL SEARCH MODAL ---
window.openSearchModal = function() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.remove('hidden');
    const input = document.getElementById('search-input');
    if (input) { input.focus(); input.value = ''; }
    document.getElementById('search-results').innerHTML = `
      <div class="py-8 text-center text-on-surface/30 text-[10px] font-black uppercase tracking-widest">
        Type to search matches, teams, and leagues...
      </div>
    `;
    // Listen for typing
    if (input && !input._searchBound) {
      input._searchBound = true;
      input.addEventListener('input', debounceSearch);
    }
  }
}

window.closeSearchModal = function() {
  const modal = document.getElementById('search-modal');
  if (modal) modal.classList.add('hidden');
}

// Keyboard shortcut: Ctrl+K or / to open search
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))) {
    e.preventDefault();
    openSearchModal();
  }
  if (e.key === 'Escape') closeSearchModal();
});

let _searchTimer = null;
function debounceSearch(e) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => performSearch(e.target.value), 300);
}

async function performSearch(query) {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) return;
  if (!query || query.length < 2) {
    resultsContainer.innerHTML = `<div class="py-8 text-center text-on-surface/30 text-[10px] font-black uppercase tracking-widest">Type at least 2 characters...</div>`;
    return;
  }

  const q = query.toLowerCase();
  const matches = (window._cachedMatches || []).filter(m =>
    (m.homeTeam.name || '').toLowerCase().includes(q) ||
    (m.awayTeam.name || '').toLowerCase().includes(q) ||
    (m.league || '').toLowerCase().includes(q) ||
    (m.name || '').toLowerCase().includes(q) ||
    (m.sport || '').toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    resultsContainer.innerHTML = `<div class="py-8 text-center text-on-surface/30 text-[10px] font-black uppercase tracking-widest">No matches found for "${query}"</div>`;
    return;
  }

  resultsContainer.innerHTML = matches.slice(0, 10).map(m => {
    const isLive = m.status === 'live';
    const isFinished = m.status === 'finished';
    const detailUrl = (isLive || isFinished)
      ? `/match.html?id=${m.id}&sport=${m.sport}&league=${m.leagueSlug}`
      : `/upcoming_match_detail.html?id=${m.id}&sport=${m.sport}&league=${m.leagueSlug}`;
    return `
      <a href="${detailUrl}" class="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-primary/20 transition-all group border border-transparent hover:border-primary/30">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <img src="${m.homeTeam.logo}" class="w-8 h-8 object-contain" onerror="this.src='/public/logo.png'">
          <div class="flex-1 min-w-0">
            <div class="text-xs font-black uppercase truncate group-hover:text-primary transition-colors">${m.homeTeam.name} vs ${m.awayTeam.name}</div>
            <div class="text-[9px] font-bold text-on-surface/40 uppercase tracking-widest">${m.league || m.sport}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${isLive ? `<span class="text-sm font-black text-primary">${m.homeTeam.score} - ${m.awayTeam.score}</span><span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span>` : isFinished ? `<span class="text-sm font-black text-on-surface/50">${m.homeTeam.score} - ${m.awayTeam.score}</span>` : `<span class="text-[10px] font-black text-on-surface/40 uppercase">${m.time || 'Upcoming'}</span>`}
        </div>
      </a>
    `;
  }).join('');
}

// --- SCROLL REVEAL ANIMATIONS ---
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('section, .glass-card, article').forEach(el => {
    if (!el.closest('#main-header') && !el.closest('aside') && !el.closest('footer')) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      observer.observe(el);
    }
  });
}

// Init scroll reveal after a brief delay to let content render
setTimeout(initScrollReveal, 500);

// --- DYNAMIC COPYRIGHT YEAR ---
document.querySelectorAll('.copyright-year').forEach(el => {
  el.textContent = new Date().getFullYear();
});

// --- DYNAMIC CURRENT DATE ---
const dateDisplay = document.getElementById('current-date-display');
if (dateDisplay) {
  const now = new Date();
  dateDisplay.textContent = now.toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });
}

// --- DYNAMIC NEWS HERO ---
// Replace static hero on news.html with a live/recent match
if (window.location.pathname.includes('news.html')) {
  (async () => {
    try {
      const res = await fetch(`${API_LIVE}?sport=all`);
      const data = await res.json();
      const matches = data.matches || [];
      // Pick biggest live match or most recent finished
      const heroMatch = matches.find(m => m.status === 'live') || matches.find(m => m.status === 'finished');
      if (heroMatch) {
        const heroSection = document.querySelector('main > section.relative');
        if (heroSection) {
          const isLive = heroMatch.status === 'live';
          const badge = isLive ? 'LIVE NOW' : 'FINAL RESULT';
          const badgeColor = isLive ? 'bg-primary' : 'bg-secondary-container';
          heroSection.innerHTML = `
            <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-surface-container-lowest/20"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-transparent to-transparent"></div>
            <div class="relative h-full flex flex-col justify-end p-8 md:p-16 space-y-6">
              <div class="flex items-center gap-3">
                <span class="${badgeColor} text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center gap-2">
                  ${isLive ? '<span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>' : ''}
                  ${badge}
                </span>
                <span class="text-white/60 text-xs font-bold uppercase tracking-tighter">${heroMatch.league || heroMatch.sport}</span>
              </div>
              <div class="space-y-2">
                <h1 class="text-6xl md:text-9xl font-black font-headline uppercase leading-none tracking-tighter">
                  ${heroMatch.homeTeam.name} <span class="text-primary">${heroMatch.homeTeam.score} - ${heroMatch.awayTeam.score}</span> ${heroMatch.awayTeam.name}
                </h1>
                <div class="flex gap-4 text-xs font-bold uppercase text-on-surface/60">
                  <span>${heroMatch.time || ''}</span>
                </div>
              </div>
              <div class="flex gap-4 pt-4">
                <a href="/match.html?id=${heroMatch.id}&sport=${heroMatch.sport}&league=${heroMatch.leagueSlug}" class="bg-primary text-white px-10 py-4 font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform flex items-center gap-2 rounded">
                  <span class="material-symbols-outlined">sports_score</span> Match Center
                </a>
                <a href="/live.html" class="bg-white/5 backdrop-blur-md border border-white/10 text-on-surface px-10 py-4 font-black uppercase text-xs tracking-widest rounded hover:bg-white/10 transition-colors">All Live Scores</a>
              </div>
            </div>
          `;
        }
      }
    } catch(e) { console.error('News hero update error:', e); }
  })();
}

// --- SCHEDULE CENTRE (upcoming.html) ---
if (window.location.pathname.includes('upcoming')) {
  let selectedDateOffset = 0;
  const SPORT_ICONS = {
    soccer: 'sports_soccer', basketball: 'sports_basketball', football: 'sports_football',
    baseball: 'sports_baseball', hockey: 'sports_hockey', tennis: 'sports_tennis',
    cricket: 'sports_cricket', mma: 'sports_mma', racing: 'directions_car', golf: 'golf_course'
  };

  // Generate date tabs
  function renderDateTabs() {
    const container = document.getElementById('date-tabs');
    if (!container) return;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let tabs = '';
    for (let i = 0; i <= 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      let label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
      const active = i === selectedDateOffset;
      tabs += `<button onclick="window.selectDate(${i})" class="flex-none px-5 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-on-surface/60 hover:bg-white/10 hover:text-white border border-white/5'}">${label}</button>`;
    }
    container.innerHTML = tabs;
  }

  window.selectDate = function(offset) {
    selectedDateOffset = offset;
    renderDateTabs();
    fetchScheduleCentre();
  };

  // Fetch and render sport-grouped matches
  async function fetchScheduleCentre() {
    const container = document.getElementById('matches-container');
    if (!container) return;
    container.innerHTML = '<div class="flex items-center justify-center py-20"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>';

    try {
      const sport = currentTab || 'all';
      const res = await fetch(`${API_UPCOMING}?sport=${sport}&days=${selectedDateOffset + 1}`);
      const data = await res.json();
      let matches = data.matches || [];

      // Filter to only the selected date
      const target = new Date(); target.setDate(target.getDate() + selectedDateOffset);
      const targetStr = target.toDateString();
      matches = matches.filter(m => {
        try { return new Date(m.date).toDateString() === targetStr; } catch(e) { return false; }
      });

      if (matches.length === 0) {
        container.innerHTML = `
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <span class="material-symbols-outlined text-5xl text-on-surface/15 mb-4">calendar_month</span>
            <p class="text-on-surface/30 font-black uppercase tracking-[0.3em] text-xs mb-2">No Fixtures Scheduled</p>
            <p class="text-on-surface/20 text-[10px]">Check another date or sport category</p>
          </div>`;
        return;
      }

      // Group by sport
      const grouped = {};
      matches.forEach(m => {
        const key = m.sport || 'other';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(m);
      });

      // Render sport sections
      let html = '';
      Object.entries(grouped).forEach(([sport, sportMatches]) => {
        const icon = SPORT_ICONS[sport] || 'sports';
        const sportName = sport.charAt(0).toUpperCase() + sport.slice(1);
        html += `
          <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined text-primary text-xl">${icon}</span>
              <h2 class="text-xl font-black italic uppercase tracking-tight">${sportName}</h2>
              <span class="text-[10px] font-bold text-on-surface/30 uppercase tracking-widest">${sportMatches.length} ${sportMatches.length === 1 ? 'match' : 'matches'}</span>
            </div>
            <div class="space-y-2">
        `;

        sportMatches.forEach(m => {
          let kickoff = '';
          try {
            const d = new Date(m.date);
            kickoff = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          } catch(e) { kickoff = m.time || '--:--'; }

          html += `
            <a href="/upcoming_match_detail.html?id=${m.id}&sport=${m.sport}&league=${m.leagueSlug}" 
               class="flex items-center gap-4 md:gap-6 p-4 md:p-5 bg-[#111111] border border-white/5 rounded-xl hover:border-primary/30 hover:bg-[#151515] transition-all group cursor-pointer">
              <!-- Time -->
              <div class="shrink-0 w-14 text-center">
                <span class="text-sm font-black font-mono">${kickoff}</span>
                <span class="block text-[8px] font-bold text-on-surface/30 uppercase">GMT</span>
              </div>
              <!-- Divider -->
              <div class="w-px h-10 bg-white/10 shrink-0"></div>
              <!-- Home Team -->
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <span class="text-sm font-bold truncate">${m.homeTeam.name}</span>
                <img src="${m.homeTeam.logo}" class="w-8 h-8 object-contain shrink-0" onerror="this.src='/public/logo.png'">
              </div>
              <!-- VS -->
              <span class="text-[10px] font-black text-on-surface/30 uppercase shrink-0">vs</span>
              <!-- Away Team -->
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <img src="${m.awayTeam.logo}" class="w-8 h-8 object-contain shrink-0" onerror="this.src='/public/logo.png'">
                <span class="text-sm font-bold truncate">${m.awayTeam.name}</span>
              </div>
              <!-- Broadcast + Notify -->
              <div class="hidden md:flex items-center gap-4 shrink-0">
                <span class="text-[9px] font-bold text-on-surface/30 uppercase tracking-wider">${m.broadcast || m.league || 'ESPN'}</span>
                <button onclick="event.preventDefault(); event.stopPropagation(); handleNotification('${m.id}','${m.homeTeam.name} vs ${m.awayTeam.name}')" 
                        class="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all">
                  <span class="material-symbols-outlined text-xs">notifications</span> Notify Me
                </button>
              </div>
            </a>
          `;
        });

        html += `</div></div>`;
      });

      container.innerHTML = html;

      // Set up countdown using ALL upcoming matches (so it works even if selected date is empty)
      if (data.matches && data.matches.length > 0) {
          setupCountdown(data.matches[0]);
      } else {
          // If absolutely NO fixtures over the next 7 days in this sport
          const matchName = document.getElementById('countdown-match-name');
          if (matchName) matchName.textContent = 'No upcoming fixtures available in 7 days';
      }

    } catch(err) {
      console.error('Schedule Centre error:', err);
      container.innerHTML = '<div class="text-center py-20 text-on-surface/30 text-sm">Failed to load fixtures. Please refresh.</div>';
    }
  }

  // Countdown timer
  let countdownInterval;
  function setupCountdown(match) {
    const timer = document.getElementById('countdown-timer');
    const homeLogo = document.getElementById('countdown-home-logo');
    const awayLogo = document.getElementById('countdown-away-logo');
    const matchName = document.getElementById('countdown-match-name');
    const matchLeague = document.getElementById('countdown-match-league');
    if (!timer) return;

    if (homeLogo) homeLogo.innerHTML = `<img src="${match.homeTeam.logo}" class="w-8 h-8 object-contain" onerror="this.src='/public/logo.png'">`;
    if (awayLogo) awayLogo.innerHTML = `<img src="${match.awayTeam.logo}" class="w-8 h-8 object-contain" onerror="this.src='/public/logo.png'">`;
    if (matchName) matchName.textContent = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    if (matchLeague) matchLeague.textContent = `${match.league || match.sport} • ${match.venue || ''}`;

    if (countdownInterval) clearInterval(countdownInterval);
    const matchDate = new Date(match.date);

    function tick() {
      const now = new Date();
      const diff = matchDate - now;
      if (diff <= 0) { timer.textContent = 'KICKOFF!'; return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      timer.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  // Override renderMatches on upcoming page to use sport-grouped layout
  const originalRenderMatches = window.renderMatches || renderMatches;
  renderMatches = function(matches) {
    if (window.location.pathname.includes('upcoming')) {
      // Schedule Centre handles its own rendering
      return;
    }
    originalRenderMatches(matches);
  };

  // Init
  renderDateTabs();
  fetchScheduleCentre();

  // Auto-refresh every 2 minutes
  setInterval(fetchScheduleCentre, 120000);
}
