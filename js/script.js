// --- CONSTANTS ---
// Navigation Functions (Consolidated below)

const API_LIVE = '/api/live';
const API_MATCH = '/api/match';
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
      // No auto-refresh for upcoming details unless status is close to live
    } else if (homeTeamName) {
      fetchMatchDetail(matchId, sport, league);
      startAutoRefresh(() => fetchMatchDetail(matchId, sport, league));
    }
    // Also fetch sidebar live scores
    fetchMatches(null, true);
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

    // Initial fetches
    if (window.location.pathname.includes('upcoming.html')) currentArenaTab = currentTab;
    fetchMatches(currentPageFilter);
    fetchSidebarLive();
    fetchNews();
    if (heroSliderContainer) fetchHeroData(currentPageFilter);
    if (leaguesContainer) fetchLeagues();
    if (playersContainer || trendingPlayersContainer) fetchPlayers();
    if (recentResultsContainer) fetchRecentResults();
    if (upcomingTodayContainer) {
      fetchUpcomingToday();
      setupUpcomingControls();
    }
    if (document.getElementById('arena-schedule-container')) {
      fetchArenaSchedule();
      setupArenaControls();
      renderArenaTabs();
    }

    // "Silent" Auto Refresh logic
    setInterval(() => {
      fetchMatches(currentPageFilter);
      fetchSidebarLive();
      if (recentResultsContainer) fetchRecentResults();
      if (upcomingTodayContainer) fetchUpcomingToday();
      if (document.getElementById('arena-schedule-container')) fetchArenaSchedule(currentArenaTab);
    }, 15000); // 15s for scores

    setInterval(() => {
      fetchNews();
    }, 60000); // 1m for news

    // Auto Refresh for Hubs
    setInterval(() => {
      if (heroSliderContainer) fetchHeroData(currentPageFilter);
      if (leaguesContainer) fetchLeagues();
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
  
  try {
    // Fetch upcoming matches for selected sport
    const res = await fetch(`${API_LIVE}?status=upcoming&sport=${sport}`);
    const data = await res.json();
    const upcoming = data.matches || [];
    renderArenaSchedule(upcoming);
  } catch (err) {
    console.error('Arena Fetch Error:', err);
  }
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

    return `
      <a href="/upcoming_match_detail.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}" 
         class="bg-[#111111] p-8 rounded-2xl border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-2xl flex flex-col justify-between h-[360px] group min-w-[320px] snap-center shrink-0">
        <div>
          <div class="flex justify-between text-[10px] font-black text-on-surface-variant mb-12 uppercase tracking-[0.2em]">
            <span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${dotColor}"></span> ${match.league || 'UPCOMING'}</span>
            <span class="text-primary">${match.time}</span>
          </div>
          <div class="flex items-center justify-between mb-12 px-2">
            <div class="flex flex-col items-center gap-4">
              <div class="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-xl font-black shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/5 group-hover:border-primary/30 transition-colors uppercase">
                <img src="${match.homeTeam.logo}" class="w-12 h-12 object-contain" onerror="this.src='/public/logo.png'">
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-opacity truncate w-24 text-center">${match.homeTeam.name}</span>
            </div>
            
            <div class="flex flex-col items-center">
              <span class="text-3xl font-black text-primary italic tracking-tighter transform group-hover:scale-125 transition-transform duration-700">VS</span>
            </div>

            <div class="flex flex-col items-center gap-4">
              <div class="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-xl font-black shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/5 group-hover:border-primary/30 transition-colors uppercase">
                <img src="${match.awayTeam.logo}" class="w-12 h-12 object-contain" onerror="this.src='/public/logo.png'">
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-opacity truncate w-24 text-center">${match.awayTeam.name}</span>
            </div>
          </div>
        </div>
        <button class="w-full py-4 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-primary transition-colors">Notify Me</button>
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
    const res = await fetch(`${API_LIVE}?sport=all`);
    const data = await res.json();
    let matches = data.matches || [];

    if (statusFilter === 'live') {
      // Strictly live for pages that request it (like Leagues or when user wants strict Live)
      matches = matches.filter(m => m.status === 'live');
    } else if (statusFilter) {
      matches = matches.filter(m => m.status === statusFilter);
    } else {
      // On Home/Trending, prioritize Live. 
      // Removed upcoming fallback to satisfy "hide when live not available" request
      matches = matches.filter(m => m.status === 'live');
    }

    renderHeroSlider(matches.slice(0, 3), statusFilter);
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
    <div class="relative w-full h-full">
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

// --- FETCH LEAGUES ---
async function fetchLeagues() {
  if (!leaguesContainer && !topTierContainer) return;
  try {
    // Fetch live matches first for status badges
    const liveRes = await fetch(`${API_LIVE}?sport=all`);
    const liveData = await liveRes.json();
    const liveMatches = liveData.matches || [];

    // Fetch standings for key leagues
    const [eplRes, laligaRes] = await Promise.all([
      fetch(`${API_INFO}?type=standings&sport=soccer&league=eng.1`),
      fetch(`${API_INFO}?type=standings&sport=soccer&league=esp.1`)
    ]);

    const eplData = await eplRes.json();
    const laligaData = await laligaRes.json();

    const allStandings = {
      'eng.1': (eplData.standings?.[0]?.entries || eplData.children?.[0]?.standings?.entries || []),
      'esp.1': (laligaData.standings?.[0]?.entries || laligaData.children?.[0]?.standings?.entries || [])
    };
    
    renderLeaguesHub(allStandings, liveMatches);
  } catch (err) {
    console.error('Leagues error:', err);
  }
}

function renderLeaguesHub(standingsMap, liveMatches) {
  // 1. Top Tier (Elite)
  if (topTierContainer) {
    const topLeagues = [
      { name: 'Premier League', slug: 'eng.1', country: 'England', sport: 'soccer', icon: 'sports_soccer' },
      { name: 'NBA', slug: 'nba', country: 'USA', sport: 'basketball', icon: 'sports_basketball' },
      { name: 'NFL', slug: 'nfl', country: 'USA', sport: 'american-football', icon: 'sports_football' },
      { name: 'LALIGA', slug: 'esp.1', country: 'Spain', sport: 'soccer', icon: 'sports_soccer' }
    ];
    topTierContainer.innerHTML = topLeagues.map(l => {
      const isLive = liveMatches.some(m => m.leagueSlug === l.slug && m.status === 'live');
      return `
        <div class="bg-surface-container-high border border-white/5 rounded p-5 hover:bg-surface-container-highest transition-colors group relative overflow-hidden">
          <div class="flex justify-between items-start mb-6">
            <div class="w-12 h-12 bg-white/5 rounded flex items-center justify-center">
              <span class="material-symbols-outlined text-primary text-3xl">${l.icon}</span>
            </div>
            ${isLive ? '<div class="bg-secondary-container/20 text-secondary-container border border-secondary-container/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase animate-pulse">Live Now</div>' : ''}
          </div>
          <h3 class="text-lg font-black uppercase tracking-tight mb-1">${l.name}</h3>
          <p class="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest mb-6">${l.country} • ${l.sport}</p>
          <button onclick="switchTab('${l.sport}')" class="w-full py-3 bg-white/5 group-hover:bg-primary group-hover:text-on-primary transition-all text-[10px] font-black uppercase tracking-widest rounded">View Hub</button>
        </div>
      `;
    }).join('');
  }

  // 2. Combat Sports
  if (combatSportsContainer) {
    const combatLeagues = [
      { id: 'ufc', name: 'UFC', sport: 'mma', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvIyeKN8pU6Tv8l7j-RmQf1mq1YYkRNanPO1kQCTkfpqO1lnOXuSXrM1XtkhkolcZdhEQS_PmMYnlFeWJFN7mnloZTh5Ma37GUcum0oXBwzOPT1dOb1NzKoEbQCIqJwLILR8GSq3XEkvk0bb5iUu5SRjqqNa7LiEsFgaTh6sCpPyjm97xrCouooxKwVn_5v4A8rEfd35QrTnsB3tXr4X7sBhD0favzvQsyRibEZUQ48Y_Zkq1Jop3gjDYtR4ex2BmQWkhgcDR589xC' },
      { id: 'boxing', name: 'Boxing', sport: 'mma', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDch9QidtmtgyAuKOhBwokTeBFsRbDLkH0wFQjZhtJLDO9QCp6s4LrnaeRYyVXfjZbefQVmOHoMq1wSdEnhGjfTdwC8mUQGZwhyug-EnBbdPSaiIUbN9-cs51DDEzNE_B6liCVR92OWeoEHj86EllurkqqM_w2DjPnkcOYojy7BbXRQV7wpvYR8gZQqUCEQMtlIzBgQXByX4rqtAKsAW5xeNAp5h-sxvkwucT08VJYZzbUttb0wrkNwvi2OPZZLFsvKTmzj30BGI6ZL' }
    ];
    combatSportsContainer.innerHTML = combatLeagues.map(l => {
        const isLive = liveMatches.some(m => m.sport === l.sport && m.status === 'live');
        return `
        <div class="h-64 relative bg-surface-container-high rounded overflow-hidden group">
          <img class="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" src="${l.img}" onerror="this.src='/public/hero-fallback.jpg'">
          <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest to-transparent"></div>
          <div class="relative h-full p-8 flex flex-col justify-center max-w-xs">
            <div class="w-16 h-8 bg-white/10 backdrop-blur flex items-center justify-center mb-4">
              <span class="font-black italic text-sm ${l.name === 'WBC' ? 'text-[#FFD700]' : ''}">${l.name}</span>
            </div>
            <h3 class="text-2xl font-black uppercase tracking-tighter leading-none mb-2">${isLive ? 'MAIN EVENT LIVE' : 'Fight Night Schedule'}</h3>
            <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-6">${isLive ? 'WATCH NOW IN 4K' : 'SATURDAY • LIVE PPV'}</p>
            <button onclick="switchTab('${l.sport}')" class="self-start px-6 py-2 kinetic-gradient text-[10px] font-black uppercase tracking-widest rounded">View ${l.name}</button>
          </div>
        </div>
        `;
    }).join('');
  }

  // 3. European Soccer
  if (europeanSoccerContainer) {
     const euroLeagues = [
        { name: 'Serie A', country: 'Italy', slug: 'ita.1' },
        { name: 'Bundesliga', country: 'Germany', slug: 'ger.1' },
        { name: 'Ligue 1', country: 'France', slug: 'fra.1' },
        { name: 'Eredivisie', country: 'Netherlands', slug: 'ned.1' },
        { name: 'Primeira Liga', country: 'Portugal', slug: 'por.1' },
        { name: 'Super Lig', country: 'Turkey', slug: 'tur.1' }
     ];
     europeanSoccerContainer.innerHTML = euroLeagues.map(l => {
        const isLive = liveMatches.some(m => m.leagueSlug === l.slug && m.status === 'live');
        return `
        <div class="bg-surface-container border border-white/5 p-4 rounded text-center hover:border-primary/50 transition-all cursor-pointer group relative" onclick="switchTab('soccer')">
          ${isLive ? '<span class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse"></span>' : ''}
          <span class="material-symbols-outlined text-2xl text-on-surface/40 group-hover:text-primary mb-3">sports_soccer</span>
          <h4 class="text-xs font-black uppercase tracking-tight">${l.name}</h4>
          <p class="text-[9px] font-bold text-on-surface/30 uppercase mt-1">${l.country}</p>
        </div>
        `;
     }).join('');
  }

  // 4. Standings Section (Tabbed between EPL and LaLiga)
  const standingsTableContainer = document.getElementById('standings-table-container');
  if (standingsTableContainer) {
    const activeLeague = window.currentStandingsLeague || (standingsMap['eng.1'].length > 0 ? 'eng.1' : 'esp.1');
    const standings = standingsMap[activeLeague] || [];
    const leagueName = activeLeague === 'eng.1' ? 'Premier League' : 'LaLiga EA Sports';

    standingsTableContainer.innerHTML = `
      <div class="flex items-end justify-between mb-8 border-l-4 border-primary pl-4">
        <div>
          <h2 class="text-3xl font-black italic uppercase tracking-tighter">Live Standings</h2>
          <p class="text-xs font-bold text-on-surface opacity-40 uppercase tracking-widest">${leagueName} Table</p>
        </div>
        <div class="flex gap-4">
           <button onclick="window.currentStandingsLeague='eng.1'; fetchLeagues()" class="text-[10px] font-black ${activeLeague === 'eng.1' ? 'text-primary' : 'text-on-surface/40'} uppercase tracking-widest hover:text-primary transition-colors">EPL</button>
           <button onclick="window.currentStandingsLeague='esp.1'; fetchLeagues()" class="text-[10px] font-black ${activeLeague === 'esp.1' ? 'text-primary' : 'text-on-surface/40'} uppercase tracking-widest hover:text-primary transition-colors">LaLiga</button>
           <button onclick="fetchLeagues()" class="text-[10px] font-black text-on-surface/20 uppercase tracking-widest hover:text-primary transition-colors ml-4">Refresh</button>
        </div>
      </div>
      <div class="bg-surface-container border border-white/5 rounded-xl overflow-hidden">
        <table class="w-full text-left text-[10px] uppercase font-black">
          <thead class="bg-white/5 border-b border-white/5">
            <tr>
              <th class="px-6 py-4">Pos</th>
              <th class="px-6 py-4">Club</th>
              <th class="px-6 py-4">PL</th>
              <th class="px-6 py-4">GD</th>
              <th class="px-6 py-4">PTS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${standings.slice(0, 10).map(e => `
              <tr class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-4 text-on-surface/40">${e.stats.find(s => s.name === 'rank')?.value || '-'}</td>
                <td class="px-6 py-4 flex items-center gap-3">
                  <img src="${e.team.logos?.[0]?.href}" class="w-4 h-4 object-contain" onerror="this.src='/public/logo.png'">
                  <span class="truncate max-w-[120px]">${e.team.displayName}</span>
                </td>
                <td class="px-6 py-4">${e.stats.find(s => s.name === 'gamesPlayed')?.value || '0'}</td>
                <td class="px-6 py-4 ${e.stats.find(s => s.name === 'pointDifferential')?.value >= 0 ? 'text-primary' : 'text-on-surface/40'}">${e.stats.find(s => s.name === 'pointDifferential')?.displayValue || '0'}</td>
                <td class="px-6 py-4 text-primary">${e.stats.find(s => s.name === 'points')?.value || '0'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

// --- FETCH PLAYERS ---
async function fetchPlayers() {
  if (!playersContainer && !trendingPlayersContainer) return;
  try {
    const res = await fetch(`${API_INFO}?type=players&sport=soccer&league=eng.1`);
    const data = await res.json();
    // Athletics data is complex, for now we show featured ones
    renderPlayers(data.athletes || []);
  } catch (err) {
    console.error('Players error:', err);
  }
}

function renderPlayers(athletes) {
  // Players section is now handled by Trending Upcoming on Home, 
  // but we keep the logic for players.html or other hubs if needed.
  if (playersContainer) {
    playersContainer.innerHTML = athletes.slice(0, 10).map(a => `
      <div class="bg-surface-container p-4 rounded-lg flex items-center gap-4">
        <img src="${a.headshot?.href || '/public/logo.png'}" class="w-12 h-12 rounded-full grayscale hover:grayscale-0 transition-all">
        <div>
          <h4 class="font-black uppercase text-xs">${a.fullName}</h4>
          <p class="text-[10px] opacity-40 uppercase font-black">${a.position?.displayName || 'Player'}</p>
        </div>
      </div>
    `).join('');
  }
}

// --- RENDER TRENDING UPCOMING (HOME SIDEBAR) ---
function renderTrendingUpcoming(matches) {
  if (!trendingMatchesList) return;

  if (matches.length === 0) {
    trendingMatchesList.innerHTML = '<p class="text-[10px] font-black uppercase tracking-widest opacity-20 py-10">No upcoming matches discovered</p>';
    return;
  }

  trendingMatchesList.innerHTML = matches.map(match => `
    <a href="/upcoming_match_detail.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}" class="flex items-center gap-6 p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group border border-white/5 hover:border-primary/20">
      <div class="flex flex-col items-center gap-2 shrink-0">
        <img src="${match.homeTeam.logo}" class="w-8 h-8 object-contain opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">
        <img src="${match.awayTeam.logo}" class="w-8 h-8 object-contain opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1 line-clamp-1">${match.league}</div>
        <h4 class="text-xs font-bold uppercase truncate mb-1">${match.homeTeam.name} VS ${match.awayTeam.name}</h4>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[10px] text-on-surface/40">schedule</span>
          <span class="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">${match.time}</span>
        </div>
      </div>
    </a>
  `).join('');
}

// --- FETCH & RENDER NEWS ---
async function fetchNews() {
  if (!newsContainer && !headlinesContainer) return;
  try {
    const res = await fetch(`${API_INFO}?type=news&sport=${currentTab === 'all' ? 'soccer' : currentTab}`);
    const data = await res.json();
    renderNews(data.articles || []);
  } catch (err) {
    console.error('News fetch error:', err);
  }
}

function renderNews(articles) {
  if (articles.length === 0) return;

  // 1. Render Top News Grid (First 4 items)
  if (newsContainer) {
    const gridArticles = articles.slice(0, 4);
    newsContainer.innerHTML = gridArticles.map(article => `
      <article class="relative bg-surface-container rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all group cursor-pointer flex flex-col h-full" onclick="window.open('${article.links?.web?.href || '#'}', '_blank')">
        <div class="aspect-video bg-cover bg-center transition-transform duration-[1.5s] group-hover:scale-110" 
             style="background-image: linear-gradient(to top, rgba(14,14,14,0.9), transparent), url('${article.images?.[0]?.url || 'https://livescorefree.online/logo.png'}')"></div>
        <div class="p-6 relative flex flex-col flex-1">
          <div class="flex justify-between items-center mb-4">
            <span class="bg-primary text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">${article.categories?.[0]?.name || 'SPORTS'}</span>
            <span class="text-[10px] font-bold text-on-surface/40 uppercase">${timeAgo(new Date(article.published))}</span>
          </div>
          <h3 class="text-xl font-black italic uppercase leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-4 drop-shadow-md">
            ${article.headline}
          </h3>
        </div>
      </article>
    `).join('');
  }

  // 2. Render Scalable Headlines (Expansion Area)
  if (headlinesContainer) {
    const detailArticles = articles.slice(4);
    headlinesContainer.innerHTML = detailArticles.map((article, idx) => `
      <article class="flex flex-col md:flex-row gap-8 group cursor-pointer border-b border-white/5 pb-12 last:border-0 opacity-0 translate-y-10 transition-all duration-700 headline-expansion-item" onclick="window.open('${article.links?.web?.href || '#'}', '_blank')">
        <div class="md:w-1/4 aspect-[16/9] bg-cover bg-center rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg" 
             style="background-image: url('${article.images?.[0]?.url || 'https://livescorefree.online/logo.png'}')"></div>
        <div class="flex-1 space-y-4">
          <div class="flex items-center gap-3">
             <span class="text-primary text-[10px] font-black uppercase tracking-widest">${article.categories?.[0]?.name || 'HUB'}</span>
             <span class="text-white/20">•</span>
             <span class="text-[10px] font-black text-white/40 uppercase tracking-widest font-body">${article.published ? new Date(article.published).toLocaleDateString() : 'REALTIME'}</span>
          </div>
          <h4 class="text-2xl font-black italic uppercase italic leading-none group-hover:text-primary transition-all tracking-tighter">${article.headline}</h4>
          <p class="text-sm text-on-surface/60 font-medium leading-relaxed line-clamp-2 max-w-3xl">${article.description || ''}</p>
        </div>
      </article>
    `).join('');

    // Setup Expansion Observer
    setupNewsExpansion();
  }
}

function setupNewsExpansion() {
  const trigger = document.getElementById('news-scroll-trigger');
  const items = document.querySelectorAll('.headline-expansion-item');
  
  if (!trigger || items.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Reveal all items in the expanded container
        items.forEach((item, idx) => {
          setTimeout(() => {
            item.classList.remove('opacity-0', 'translate-y-10');
            item.classList.add('opacity-100', 'translate-y-0');
          }, idx * 100);
        });
        // We only expand once per data refresh for this specific design
        // For infinite scroll, we would fetch more data here.
        trigger.style.display = 'none'; 
      }
    });
  }, { threshold: 0.1 });

  observer.observe(trigger);
}

// Helper for time ago
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
    const liveMatches = (data.matches || []).filter(m => m.status === 'live').slice(0, 5);
    renderSidebarLive(liveMatches);

    if (tickerContainer) {
      const allLive = (data.matches || []).filter(m => m.status === 'live');
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
  try {
    const res = await fetch(`${API_LIVE}?sport=${currentTab}`);
    const data = await res.json();
    let matches = data.matches || [];

    // Always render sidebar live scores if container exists
    if (sidebarLiveContainer) {
      const liveMatches = matches.filter(m => m.status === 'live').slice(0, 5);
      renderSidebarLive(liveMatches);
    }

    // Always render ticker if container exists
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

    // Render Trending Upcoming (Most 2-3 immediate matches)
    if (trendingMatchesList) {
      const upcoming = (data.matches || []).filter(m => m.status === 'upcoming');
      upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
      renderTrendingUpcoming(upcoming.slice(0, 3));
    }
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

    return `
      <a href="/match.html?id=${match.id}&sport=${match.sport}&league=${match.leagueSlug}" class="block group h-full">
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
  if (matchClock) matchClock.textContent = data.time || '00:00';

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
      <div class="flex items-center space-x-2">
        <span class="text-primary font-medium text-sm lg:text-base">${g.player.split('at')[0]}</span>
        <span class="material-symbols-outlined text-sm text-primary" style="font-variation-settings: 'FILL' 1;">sports_soccer</span>
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
                        
                        <div class="flex items-center w-full">
                            <!-- Left Side (Home) -->
                            <div class="w-1/2 pr-8 text-right flex flex-col items-end">
                                ${isHome ? `
                                    <div class="flex items-center space-x-3 gap-2">
                                        <div class="flex flex-col items-end">
                                            <span class="text-xs font-bold text-white">${event.player}</span>
                                            <span class="text-[9px] font-black uppercase text-white/40 tracking-widest">${event.type.toUpperCase()}</span>
                                        </div>
                                        <span class="text-xl">${icon}</span>
                                    </div>
                                ` : ''}
                            </div>

                            <!-- Center Time -->
                            <div class="flex-none w-12 flex justify-center">
                                <span class="bg-surface-container px-2 py-1 rounded text-[10px] font-black border border-white/5 text-primary">${event.time}</span>
                            </div>

                            <!-- Right Side (Away) -->
                            <div class="w-1/2 pl-8 text-left flex flex-col items-start">
                                ${isAway ? `
                                    <div class="flex items-center space-x-3 gap-2">
                                        <span class="text-xl">${icon}</span>
                                        <div class="flex flex-col items-start">
                                            <span class="text-xs font-bold text-white">${event.player}</span>
                                            <span class="text-[9px] font-black uppercase text-white/40 tracking-widest">${event.type.toUpperCase()}</span>
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
