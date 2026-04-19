// --- CONFIGURATION ---
// Synchronized with HTML-level externalized config
const LSF_CONFIG = window.LSF_CONFIG || {
  api: {
    live: "/api/live",
    match: "/api/match",
    upcoming: "/api/upcoming",
    results: "/api/results",
    info: "/api/info",
    blog: "/api/blog",
    standings: "/api/standings",
    teams: "/api/teams",
    players: "/api/players",
    news: "/api/news"
  },
  ws: {
    url: (window.location.protocol === "https:" ? "wss:" : "ws:") + "//" + window.location.host + "/api/ws"
  },
  refresh: {
    live: 8000,
    results: 60000,
    upcoming: 90000,
    standings: 300000,
    teams: 300000,
    players: 600000,
    news: 600000,
    blog: 600000,
    ticker: 15000,
    sidebar: 20000,
    hero: 60000
  },
  sources: [
    "https://site.api.espn.com/apis/site/v2/sports",
    "https://core.api.espn.com/v1/sports",
    "https://cdn.espn.com/core"
  ]
};

// Map configuration to easy-access constants
const API_LIVE = LSF_CONFIG.api.live;
const API_MATCH = LSF_CONFIG.api.match;
const API_UPCOMING = LSF_CONFIG.api.upcoming;
const API_RESULTS = LSF_CONFIG.api.results || "/api/results";
const API_INFO = LSF_CONFIG.api.info;
const API_BLOG = LSF_CONFIG.api.blog || "/api/blog";
const API_NEWS = LSF_CONFIG.api.news || "/api/news";
const API_STANDINGS = LSF_CONFIG.api.standings || "/api/standings";
const API_TEAMS = LSF_CONFIG.api.teams || "/api/teams";
const API_PLAYERS = LSF_CONFIG.api.players || "/api/players";
const REFRESH = LSF_CONFIG.refresh || {};
const DATA_SOURCES = LSF_CONFIG.sources || [];
const PWA_MANIFEST = '/manifest.webmanifest';
const SERVICE_WORKER_PATH = '/sw.js';
const FALLBACK_LOGO = '/icons/icon-192.png';
const FALLBACK_HERO_IMAGE = '/icons/hero-fallback.svg';
const SITE_REDESIGN_STYLESHEET = '/css/site-redesign.css';
const REMINDER_STORAGE_KEY = 'lsf-reminders';
const INSTALL_BANNER_DISMISSED_KEY = 'lsf-install-banner-dismissed';
const NETWORK_AD_SCRIPT_URL = 'https://pl28913139.profitablecpmratenetwork.com/01fac86ec9e3085bcb989e025d13aa86/invoke.js';
const NETWORK_AD_CONTAINER_ID = 'container-01fac86ec9e3085bcb989e025d13aa86';
const reminderTimerHandles = new Map();

window._cachedNews = [];
window._cachedUpcoming = [];
window._cachedResults = [];
window._cachedBlogPosts = [];
window._lsfHeroAutoplayHandle = null;
window._lsfTickerAutoplayHandle = null;
window._lsfHeroActiveKey = '';
window._lsfNetworkAdViewportObserver = null;
window._lsfNetworkAdMessageBound = false;

function isResultsHubPage() {
  return Boolean(
    document.getElementById('results-section-title')
    || document.getElementById('results-league-filter')
    || window.location.pathname.includes('results')
  );
}

function buildNetworkAdFrameMarkup(slotId = '', title = 'Sponsored placement') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      overflow: hidden;
    }
    body {
      display: block;
    }
    #${NETWORK_AD_CONTAINER_ID} {
      width: 100%;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <script async="async" data-cfasync="false" src="${NETWORK_AD_SCRIPT_URL}"></script>
  <div id="${NETWORK_AD_CONTAINER_ID}"></div>
  <script>
    (function () {
      var slotId = ${JSON.stringify(String(slotId || ''))};
      var container = document.getElementById(${JSON.stringify(NETWORK_AD_CONTAINER_ID)});
      function notify(state) {
        try {
          parent.postMessage({ type: 'lsf-network-ad-state', slotId: slotId, state: state }, '*');
        } catch (error) {}
      }
      function markReady() {
        if (!container) return;
        var hasNodes = container.childNodes && container.childNodes.length > 0;
        var hasText = (container.textContent || '').trim().length > 0;
        if (hasNodes || hasText) notify('ready');
      }
      if (container && 'MutationObserver' in window) {
        new MutationObserver(markReady).observe(container, { childList: true, subtree: true });
      }
      window.addEventListener('load', function () {
        notify('loading');
        window.setTimeout(markReady, 1500);
        window.setTimeout(markReady, 3500);
        window.setTimeout(markReady, 6000);
      });
    })();
  </script>
</body>
</html>`;
}

function findNetworkAdSlotById(slotId = '') {
  if (!slotId) return null;
  return Array.from(document.querySelectorAll('[data-lsf-network-ad][data-lsf-ad-slot-id]'))
    .find((slot) => slot.dataset.lsfAdSlotId === slotId) || null;
}

function bindNetworkAdMessageListener() {
  if (window._lsfNetworkAdMessageBound) return;
  window._lsfNetworkAdMessageBound = true;
  window.addEventListener('message', (event) => {
    const payload = event?.data;
    if (!payload || payload.type !== 'lsf-network-ad-state') return;
    const slot = findNetworkAdSlotById(payload.slotId);
    if (!slot) return;
    slot.dataset.state = payload.state === 'ready' ? 'ready' : 'loading';
  });
}

function mountNetworkAdSlot(slot) {
  if (!slot || slot.dataset.lsfAdMounted === 'true') return;
  const slotId = slot.dataset.lsfAdSlotId || `lsf-ad-${Math.random().toString(36).slice(2, 10)}`;
  const title = slot.dataset.adTitle || 'Sponsored placement';
  const frame = document.createElement('iframe');

  slot.dataset.lsfAdSlotId = slotId;
  slot.dataset.lsfAdMounted = 'true';
  slot.dataset.state = 'loading';

  frame.className = 'lsf-network-ad-frame';
  frame.loading = 'lazy';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.title = title;
  frame.setAttribute('aria-label', title);
  frame.setAttribute('scrolling', 'no');
  frame.srcdoc = buildNetworkAdFrameMarkup(slotId, title);

  slot.replaceChildren(frame);
}

function renderNetworkAdSlots(root = document) {
  if (!root?.querySelectorAll) return;
  const slots = Array.from(root.querySelectorAll('[data-lsf-network-ad]'));
  if (!slots.length) return;

  bindNetworkAdMessageListener();

  if (!window._lsfNetworkAdViewportObserver && 'IntersectionObserver' in window) {
    window._lsfNetworkAdViewportObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        mountNetworkAdSlot(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '320px 0px'
    });
  }

  if (window._lsfNetworkAdViewportObserver) {
    slots.forEach((slot) => {
      if (slot.dataset.lsfAdObserved === 'true' || slot.dataset.lsfAdMounted === 'true') return;
      slot.dataset.lsfAdObserved = 'true';
      slot.dataset.state = slot.dataset.state || 'loading';
      window._lsfNetworkAdViewportObserver.observe(slot);
    });
  } else {
    slots.forEach((slot, index) => {
      if (slot.dataset.lsfAdMounted === 'true') return;
      scheduleNonCritical(() => mountNetworkAdSlot(slot), 1200 + (index * 250));
    });
  }
}

// --- REALTIME MANAGER (WebSocket/SSE Hybrid) ---
class RealtimeManager {
  constructor() {
    this.socket = null;
    this.subscriptions = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
    this.fallbackTimer = null;
    this.wsUrl = LSF_CONFIG.ws.url;
  }

  connect() {
    if (this.socket || this.reconnectAttempts >= this.maxReconnectAttempts) return;

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        console.log('Realtime connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.syncSubscriptions();
        if (this.fallbackTimer) {
          clearInterval(this.fallbackTimer);
          this.fallbackTimer = null;
        }
      };

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.socket = null;
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
        this.startFallbackPolling();
      };

      this.socket.onerror = (err) => {
        console.error('WebSocket Error:', err);
        this.socket.close();
      };
    } catch (e) {
      this.startFallbackPolling();
    }
  }

  subscribe(target, options = {}) {
    const sub = { target, ...options };
    this.subscriptions.add(JSON.stringify(sub));
    if (this.isConnected) {
      this.socket.send(JSON.stringify({ type: 'subscribe', ...sub }));
    }
  }

  updateSubscription(target, options = {}) {
    // Clear old subscriptions of same target
    this.subscriptions.forEach(s => {
      const parsed = JSON.parse(s);
      if (parsed.target === target) this.subscriptions.delete(s);
    });
    this.subscribe(target, options);
  }

  syncSubscriptions() {
    this.subscriptions.forEach(subStr => {
      this.socket.send(JSON.stringify({ type: 'subscribe', ...JSON.parse(subStr) }));
    });
  }

  handleMessage(message) {
    if (message.type === 'live') {
      const matches = Array.isArray(message?.data?.matches) ? message.data.matches : null;
      if (!matches) return;
      broadcastLiveMatches(matches);
    } else if (message.type === 'match') {
      const match = message?.data;
      if (!match || match.notFound || !match.homeTeam || !match.awayTeam) return;
      if (typeof renderMatchDetail === 'function') renderMatchDetail(match);
    } else if (message.type === 'results') {
      const matches = Array.isArray(message?.data?.matches) ? message.data.matches : null;
      if (!matches) return;
      window._cachedResults = filterRenderableMatches(matches).filter((m) => m.status === 'finished');
      if (typeof renderMatches === 'function' && currentPageFilter === 'finished') {
        renderMatches(sortMatchesForDisplay(window._cachedResults, 'finished'));
      }
      if (typeof updateResultsSectionMeta === 'function') updateResultsSectionMeta(window._cachedResults);
    } else if (message.type === 'upcoming') {
      const matches = Array.isArray(message?.data?.matches) ? message.data.matches : null;
      if (!matches) return;
      window._cachedUpcoming = filterRenderableMatches(matches).filter((m) => m.status === 'upcoming');
      window._cachedUpcomingMatches = window._cachedUpcoming;
      if (typeof renderArenaSchedule === 'function' && document.getElementById('arena-schedule-container')) {
        renderArenaSchedule(window._cachedUpcoming.slice(0, 12));
      }
    } else if (message.type === 'standings') {
      if (typeof window._lsfDataBus !== 'undefined') {
        window._lsfDataBus._broadcast('standings', message.data);
      }
    } else if (message.type === 'teams') {
      if (typeof window._lsfDataBus !== 'undefined') {
        window._lsfDataBus._broadcast('teams', message.data);
      }
    } else if (message.type === 'players') {
      if (typeof window._lsfDataBus !== 'undefined') {
        window._lsfDataBus._broadcast('players', message.data);
      }
    } else if (message.type === 'news' || message.type === 'blog') {
      if (typeof window._lsfDataBus !== 'undefined') {
        window._lsfDataBus._broadcast('news', message.data);
      }
    }
  }

  startFallbackPolling() {
    if (this.fallbackTimer) return;
    this.fallbackTimer = setInterval(() => {
      if (typeof fetchLiveCount === 'function' && !this.isConnected) fetchLiveCount();
      if (typeof fetchMatches === 'function' && !window.location.pathname.includes('upcoming') && !this.isConnected) {
        fetchMatches(currentPageFilter);
      }
    }, 15000);
  }
}

const realtime = new RealtimeManager();
realtime.connect();

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
  { id: 'golf', name: 'Golf' },
  { id: 'rugby', name: 'Rugby' },
  { id: 'rugby-league', name: 'Rugby League' },
  { id: 'australian-football', name: 'Aussie Rules' },
  { id: 'lacrosse', name: 'Lacrosse' },
  { id: 'volleyball', name: 'Volleyball' },
  { id: 'water-polo', name: 'Water Polo' },
  { id: 'field-hockey', name: 'Field Hockey' }
];

// --- UTILITIES (Hoisted for Global Use) ---
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

function setupNewsExpansion() {
  const items = document.querySelectorAll('.headline-expansion-item');
  if (!items.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('opacity-0', 'translate-y-10');
        entry.target.classList.add('opacity-100', 'translate-y-0');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach(item => observer.observe(item));
}

function broadcastLiveMatches(matches) {
  const normalizedMatches = filterRenderableMatches(Array.isArray(matches) ? matches : []);
  const liveMatches = normalizedMatches.filter((match) => match.status === 'live');
  window._cachedMatches = normalizedMatches;
  window._cachedLiveMatches = liveMatches;

  const liveCountText = document.getElementById('live-count-text');
  const liveHeroCountText = document.getElementById('live-hero-count-text');
  const liveLabel = liveMatches.length > 0 ? `${liveMatches.length} LIVE NOW` : 'NO LIVE GAMES';
  if (liveCountText) liveCountText.textContent = liveLabel;
  if (liveHeroCountText) liveHeroCountText.textContent = liveLabel;

  // Update ALL live-aware components
  if (typeof renderTicker === 'function') renderTicker(normalizedMatches);
  if (typeof updatePageTitle === 'function') updatePageTitle(liveMatches);
  if (typeof renderMatches === 'function' && currentPageFilter === 'live') {
    renderMatches(sortMatchesForDisplay(liveMatches, 'live'));
  }
  if (typeof renderMatches === 'function' && isCurrentPage('trending')) {
    renderMatches(combineMatchPools(liveMatches, window._cachedUpcoming || window._cachedUpcomingMatches || [], window._cachedResults || []).slice(0, 18));
  }
  if (typeof renderSidebarLive === 'function') renderSidebarLive(liveMatches.slice(0, 5));
  
  // Update Hubs/Sliders
  if (typeof renderHeroSlider === 'function' && typeof heroSliderContainer !== 'undefined' && heroSliderContainer && currentPageFilter !== 'upcoming') {
      const heroPool = buildHeroMatchPool({
        liveMatches,
        upcomingMatches: window._cachedUpcoming || window._cachedUpcomingMatches || [],
        finishedMatches: window._cachedResults || [],
        statusFilter: currentPageFilter,
        limit: 5,
        isHomePage: isHomePath()
      });
      renderHeroSlider(heroPool, currentPageFilter, {
        isHomePage: isHomePath(),
        upcomingMatches: window._cachedUpcoming || window._cachedUpcomingMatches || [],
        newsList: window._cachedNews || [],
        finishedMatches: window._cachedResults || []
      });
  }
  
  if (typeof renderIndexHeroHub === 'function' && isHomePath()) {
      renderIndexHeroHub(normalizedMatches, window._cachedUpcoming || [], window._cachedNews || []);
  }

  if (
    typeof renderArenaLiveFallback === 'function' &&
    document.getElementById('arena-schedule-container') &&
    !(window._cachedUpcomingMatches || []).length &&
    liveMatches.length > 0
  ) {
      renderArenaLiveFallback(liveMatches);
  }

  if (typeof renderLeaguesHub === 'function' && isCurrentPage('leagues')) {
      const elite = window._eliteLeaguesCache || [];
      const standings = window._standingsMapCache || {};
      renderLeaguesHub(elite, standings, normalizedMatches);
  }
}

async function fetchLiveCount() {
  try {
    const res = await fetch(`${API_LIVE}?sport=all`);
    const data = await res.json();
    const matches = filterRenderableMatches(data.matches || []);
    const allLive = matches.filter(m => m.status === "live");
    updateFeedRibbon(data.meta || {}, {
      feedLabel: 'Global live board',
      matchCount: matches.length,
      liveCount: allLive.length
    });
    const badge = document.getElementById("live-count-text");
    const badgeHero = document.getElementById("live-hero-count-text");
    const label = allLive.length > 0 ? `${allLive.length} MATCHES LIVE NOW` : "NO LIVE GAMES";
    if (badge) badge.textContent = label;
    if (badgeHero) badgeHero.textContent = label;
    
    // Pass real matches to ALL widgets via standard broadcast
    broadcastLiveMatches(matches);
  } catch (e) {
    console.error("Ticker/LiveCount Error:", e);
  }
}

function renderTicker(matches = []) {
  if (!tickerContainer) return;

  const tickerMatches = buildTickerMatchPool(matches);
  clearInterval(window._lsfTickerAutoplayHandle);

  if (tickerMatches.length === 0) {
    tickerContainer.innerHTML = `
      <div class="flex items-center gap-8 px-2 sm:px-6">
        <span class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40">
          <span class="w-1.5 h-1.5 rounded-full bg-white/10"></span>
          Stay tuned for upcoming sports action across 17 global categories.
        </span>
      </div>
    `;
    return;
  }

  tickerContainer.innerHTML = `
    <div class="lsf-ticker-shell relative flex items-center gap-3 px-1 sm:px-3">
      <button type="button" class="lsf-ticker-nav hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 text-on-surface/60 hover:text-white hover:bg-white/10" data-ticker-dir="-1" aria-label="Previous matches">
        <span class="material-symbols-outlined text-lg">chevron_left</span>
      </button>
      <div class="lsf-ticker-rail flex-1 overflow-x-auto whitespace-nowrap snap-x snap-mandatory scroll-smooth px-0.5" data-ticker-rail>
        <div class="inline-flex items-center gap-3 min-w-full">
          ${tickerMatches.map((match) => {
            const statusText = match.status === 'live'
              ? (match.time || 'LIVE')
              : (match.status === 'upcoming' ? formatTickerDate(match) : 'FINAL');
            const statusTone = match.status === 'live'
              ? 'bg-primary animate-pulse'
              : (match.status === 'upcoming' ? 'bg-amber-400/80' : 'bg-white/20');
            return `
              <a href="${buildMatchUrl(match)}"
                 class="lsf-ticker-card inline-flex snap-start shrink-0 min-w-[280px] sm:min-w-[340px] items-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 hover:border-primary/30 transition-all group"
                 data-ticker-card>
                <span class="w-1.5 h-1.5 rounded-full ${statusTone}"></span>
                <span class="text-[10px] font-black uppercase tracking-widest text-on-surface/50">${(match.league || match.sport || 'MATCH').toUpperCase()}</span>
                <span class="flex items-center gap-2 min-w-0 flex-1">
                  <img src="${getSafeImageUrl(match.homeTeam.logo, FALLBACK_LOGO)}" class="w-4 h-4 object-contain opacity-70 group-hover:opacity-100" onerror="this.src='${FALLBACK_LOGO}'">
                  <span class="text-[10px] font-bold text-on-surface truncate">${match.homeTeam.abbreviation || match.homeTeam.name} ${match.homeTeam.score || '0'} - ${match.awayTeam.score || '0'} ${match.awayTeam.abbreviation || match.awayTeam.name}</span>
                  <img src="${getSafeImageUrl(match.awayTeam.logo, FALLBACK_LOGO)}" class="w-4 h-4 object-contain opacity-70 group-hover:opacity-100" onerror="this.src='${FALLBACK_LOGO}'">
                </span>
                <span class="text-[10px] font-black text-primary italic uppercase">${statusText}</span>
              </a>
            `;
          }).join('')}
        </div>
      </div>
      <button type="button" class="lsf-ticker-nav hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 text-on-surface/60 hover:text-white hover:bg-white/10" data-ticker-dir="1" aria-label="Next matches">
        <span class="material-symbols-outlined text-lg">chevron_right</span>
      </button>
    </div>
  `;

  const rail = tickerContainer.querySelector('[data-ticker-rail]');
  if (!rail) return;

  tickerContainer.querySelectorAll('[data-ticker-dir]').forEach((button) => {
    button.addEventListener('click', () => advanceTickerRail(rail, Number(button.dataset.tickerDir || '1')));
  });

  const pauseTicker = () => clearInterval(window._lsfTickerAutoplayHandle);
  const resumeTicker = () => {
    clearInterval(window._lsfTickerAutoplayHandle);
    if (tickerMatches.length < 2) return;
    window._lsfTickerAutoplayHandle = setInterval(() => advanceTickerRail(rail, 1), 4500);
  };

  rail.addEventListener('mouseenter', pauseTicker);
  rail.addEventListener('mouseleave', resumeTicker);
  rail.addEventListener('focusin', pauseTicker);
  rail.addEventListener('focusout', resumeTicker);
  rail.addEventListener('touchstart', pauseTicker, { passive: true });
  rail.addEventListener('touchend', resumeTicker, { passive: true });
  resumeTicker();
}

function buildTickerMatchPool(matches = []) {
  const mixedMatches = combineMatchPools(
    filterRenderableMatches(matches),
    window._cachedLiveMatches || [],
    window._cachedUpcoming || [],
    window._cachedUpcomingMatches || [],
    window._cachedResults || []
  );
  const liveMatches = mixedMatches.filter((match) => match.status === 'live').slice(0, 5);
  const upcomingMatches = mixedMatches.filter((match) => match.status === 'upcoming').slice(0, 4);
  const finishedMatches = mixedMatches.filter((match) => match.status === 'finished').slice(0, 3);
  return combineMatchPools(liveMatches, upcomingMatches, finishedMatches).slice(0, 12);
}

function advanceTickerRail(rail, direction = 1) {
  if (!rail) return;
  const cards = rail.querySelectorAll('[data-ticker-card]');
  if (!cards.length) return;
  const cardWidth = (cards[0].getBoundingClientRect().width || 320) + 12;
  const maxScroll = Math.max(rail.scrollWidth - rail.clientWidth, 0);
  let nextLeft = rail.scrollLeft + (cardWidth * direction);
  if (direction > 0 && nextLeft >= maxScroll - 8) {
    nextLeft = 0;
  } else if (direction < 0 && rail.scrollLeft <= 8) {
    nextLeft = maxScroll;
  }
  rail.scrollTo({ left: nextLeft, behavior: 'smooth' });
}

function formatTickerDate(match = {}) {
  if (!match?.date) return match?.time || 'UPCOMING';
  const parsedDate = new Date(match.date);
  if (Number.isNaN(parsedDate.getTime())) return match?.time || 'UPCOMING';
  return parsedDate.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(',', ' -').toUpperCase();
}

function getSafeImageUrl(url, fallback = FALLBACK_HERO_IMAGE) {
  if (!url || url.includes("unsplash.com")) return fallback;
  return url;
}

const SPORT_ALIASES = {
  'american-football': 'football',
  football: 'football',
  soccer: 'soccer',
  cricket: 'cricket',
  basketball: 'basketball',
  baseball: 'baseball',
  hockey: 'hockey',
  tennis: 'tennis',
  mma: 'mma',
  racing: 'racing',
  golf: 'golf',
  rugby: 'rugby',
  'rugby-league': 'rugby-league',
  volleyball: 'volleyball',
  'water-polo': 'water-polo',
  lacrosse: 'lacrosse',
  'field-hockey': 'field-hockey',
  'australian-football': 'australian-football'
};
const LEAGUE_ALIASES = {
  mls: 'usa.1',
  'saudi-pro-league': 'ksa.1',
  'j-league': 'jpn.1',
  'liga-mx': 'mex.1',
  eredivisie: 'ned.1',
  epl: 'eng.1',
  laliga: 'esp.1',
  bundesliga: 'ger.1',
  'serie-a': 'ita.1',
  'ligue-1': 'fra.1',
  'primeira-liga': 'por.1',
  'liga-portugal': 'por.1',
  'super-lig': 'tur.1',
  'champions-league': 'uefa.champions',
  'europa-league': 'uefa.europa',
  'conference-league': 'uefa.europa.conf',
  'icc-world-cup': '8039',
  'world-cup': 'fifa.world',
  nfl: 'nfl',
  nba: 'nba',
  nhl: 'nhl',
  mlb: 'mlb',
  atp: 'atp',
  wta: 'wta',
  ufc: 'ufc',
  f1: 'f1',
  ipl: 'ipl'
};
const TEAM_PROFILE_SPORT_BY_LEAGUE = {
  nfl: 'football',
  'college-football': 'football',
  nba: 'basketball',
  wnba: 'basketball',
  nhl: 'hockey',
  mlb: 'baseball',
  atp: 'tennis',
  wta: 'tennis',
  ufc: 'mma',
  f1: 'racing',
  pga: 'golf',
  afl: 'australian-football'
};
const RESULTS_LEAGUE_CATALOG = {
  soccer: [
    'eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1', 'usa.1', 'mex.1',
    'ned.1', 'por.1', 'bel.1', 'tur.1', 'arg.1', 'bra.1', 'ksa.1', 'jpn.1',
    'uefa.champions', 'uefa.europa', 'uefa.europa.conf', 'uefa.nations',
    'fifa.world', 'fifa.worldq.uefa', 'fifa.friendly', 'conmebol.america',
    'caf.nations', 'afc.asian.cup', 'concacaf.gold'
  ],
  football: ['nfl', 'college-football', 'ufl', 'xfl', 'cfl'],
  basketball: ['nba', 'wnba', 'mens-college-basketball', 'womens-college-basketball', 'fiba', 'nba-development', 'nbl', 'euroleague'],
  baseball: ['mlb', 'college-baseball', 'mexican-winter-league', 'dominican-winter-league', 'caribbean-series'],
  hockey: ['nhl', 'mens-college-hockey', 'womens-college-hockey', 'hockey-world-cup'],
  cricket: ['icc.t20', 'ipl', 'icc.odi', 'icc.test', 'bbl', 'psl', 'cpl'],
  tennis: ['atp', 'wta'],
  mma: ['ufc', 'bellator', 'ifc', 'lfa', 'ksw', 'cage-warriors'],
  racing: ['f1', 'irl', 'nascar-premier', 'nascar-secondary', 'nascar-truck'],
  golf: ['pga', 'lpga', 'champions-tour', 'dp-world-tour', 'liv', 'korn-ferry-tour'],
  rugby: ['164205', '180659', '267979', '242041', '289262'],
  'rugby-league': ['3'],
  volleyball: ['mens-college-volleyball', 'womens-college-volleyball'],
  'water-polo': ['mens-college-water-polo', 'womens-college-water-polo'],
  lacrosse: ['nll', 'pll', 'mens-college-lacrosse', 'womens-college-lacrosse'],
  'field-hockey': ['ncaa-womens-field-hockey'],
  'australian-football': ['afl']
};
const RESULTS_LEAGUE_LABELS = {
  'eng.1': 'Premier League',
  'esp.1': 'La Liga',
  'ger.1': 'Bundesliga',
  'ita.1': 'Serie A',
  'fra.1': 'Ligue 1',
  'usa.1': 'MLS',
  'mex.1': 'Liga MX',
  'ned.1': 'Eredivisie',
  'por.1': 'Primeira Liga',
  'bel.1': 'Belgian Pro League',
  'tur.1': 'Super Lig',
  'arg.1': 'Liga Profesional',
  'bra.1': 'Brasileirao',
  'ksa.1': 'Saudi Pro League',
  'jpn.1': 'J1 League',
  'uefa.champions': 'UEFA Champions League',
  'uefa.europa': 'UEFA Europa League',
  'uefa.europa.conf': 'UEFA Conference League',
  'uefa.nations': 'UEFA Nations League',
  'fifa.world': 'FIFA World Cup',
  'conmebol.america': 'Copa America',
  'caf.nations': 'Africa Cup of Nations',
  'afc.asian.cup': 'AFC Asian Cup',
  'concacaf.gold': 'Gold Cup',
  nfl: 'NFL',
  'college-football': 'College Football',
  ufl: 'UFL',
  xfl: 'XFL',
  cfl: 'CFL',
  nba: 'NBA',
  wnba: 'WNBA',
  'mens-college-basketball': 'Men\'s College Basketball',
  'womens-college-basketball': 'Women\'s College Basketball',
  fiba: 'FIBA',
  'nba-development': 'G League',
  nbl: 'NBL',
  euroleague: 'EuroLeague',
  mlb: 'MLB',
  'college-baseball': 'College Baseball',
  nhl: 'NHL',
  'mens-college-hockey': 'Men\'s College Hockey',
  'womens-college-hockey': 'Women\'s College Hockey',
  'icc.t20': 'ICC T20',
  ipl: 'IPL',
  'icc.odi': 'ICC ODI',
  'icc.test': 'ICC Test',
  bbl: 'Big Bash League',
  psl: 'PSL',
  cpl: 'CPL',
  atp: 'ATP Tour',
  wta: 'WTA Tour',
  ufc: 'UFC',
  bellator: 'Bellator',
  lfa: 'LFA',
  ksw: 'KSW',
  'cage-warriors': 'Cage Warriors',
  f1: 'Formula 1',
  irl: 'IndyCar',
  'nascar-premier': 'NASCAR Cup',
  'nascar-secondary': 'NASCAR Xfinity',
  'nascar-truck': 'NASCAR Truck',
  pga: 'PGA Tour',
  lpga: 'LPGA Tour',
  'champions-tour': 'Champions Tour',
  'dp-world-tour': 'DP World Tour',
  liv: 'LIV Golf',
  'korn-ferry-tour': 'Korn Ferry Tour',
  '164205': 'Premiership Rugby',
  '180659': 'United Rugby Championship',
  '267979': 'Top 14',
  '242041': 'Super Rugby Pacific',
  '289262': 'Six Nations',
  '3': 'Rugby League',
  nll: 'NLL',
  pll: 'PLL',
  afl: 'AFL'
};

let currentTab = 'all';
let currentLeagueFilter = '';
let currentArenaTab = 'all'; // Filter for the Arena section
let currentPageFilter = 'live'; // Added globally to track page-specific selection (live, upcoming, finished)
let autoRefreshTimer = null;
let deferredInstallPrompt = null;
let notificationPermissionState = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
let notificationPanelVisible = false;
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
const trendingPlayersContainer = document.getElementById('trending-players-grid');
const trendingUpcomingContainer = document.getElementById('trending-upcoming-container');
const trendingMatchesList = document.getElementById('trending-matches-list');
const recentResultsContainer = document.getElementById('recent-results-container');
const upcomingTodayContainer = document.getElementById('upcoming-today-container');
const resultsSectionTitle = document.getElementById('results-section-title');
const resultsSectionSubtitle = document.getElementById('results-section-subtitle');
const resultsLeagueFilter = document.getElementById('results-league-filter');
const resultsCountPill = document.getElementById('results-count-pill');
const upcomingPrev = document.getElementById('upcoming-prev');
const upcomingNext = document.getElementById('upcoming-next');

const topTierContainer = document.getElementById('top-tier-container');
const combatSportsContainer = document.getElementById('combat-sports-container');
const europeanSoccerContainer = document.getElementById('european-soccer-container');

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

function normalizeLeagueSlug(value = '') {
  return LEAGUE_ALIASES[String(value || '').toLowerCase()] || String(value || '');
}

function formatLeagueSlugLabel(slug = '') {
  const normalized = normalizeLeagueSlug(slug);
  if (!normalized) return 'League';
  if (RESULTS_LEAGUE_LABELS[normalized]) return RESULTS_LEAGUE_LABELS[normalized];
  return normalized
    .replace(/[._]/g, ' ')
    .replace(/\buefa\b/gi, 'UEFA')
    .replace(/\bfifa\b/gi, 'FIFA')
    .replace(/\bicc\b/gi, 'ICC')
    .replace(/\bnba\b/gi, 'NBA')
    .replace(/\bmlb\b/gi, 'MLB')
    .replace(/\bnfl\b/gi, 'NFL')
    .replace(/\bnhl\b/gi, 'NHL')
    .replace(/\batp\b/gi, 'ATP')
    .replace(/\bwta\b/gi, 'WTA')
    .replace(/\bufc\b/gi, 'UFC')
    .replace(/\bafl\b/gi, 'AFL')
    .replace(/\bipl\b/gi, 'IPL')
    .split(' ')
    .filter(Boolean)
    .map((part) => /^[A-Z0-9.]+$/.test(part) ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function normalizeSportSlug(value = '', league = '') {
  const sport = String(value || 'all').toLowerCase();
  if (sport === 'all') return 'all';
  if (SPORT_ALIASES[sport]) return SPORT_ALIASES[sport];
  if (sport === 'football' && league && !['nfl', 'college-football', 'cfl', 'ufl', 'xfl'].includes(normalizeLeagueSlug(league))) {
    return 'soccer';
  }
  return sport;
}

function getDefaultLeagueForSport(sport = 'soccer') {
  const normalizedSport = normalizeSportSlug(sport);
  if (normalizedSport === 'basketball') return 'nba';
  if (normalizedSport === 'football') return 'nfl';
  if (normalizedSport === 'hockey') return 'nhl';
  if (normalizedSport === 'baseball') return 'mlb';
  if (normalizedSport === 'cricket') return 'ipl';
  if (normalizedSport === 'tennis') return 'atp';
  if (normalizedSport === 'mma') return 'ufc';
  if (normalizedSport === 'racing') return 'f1';
  if (normalizedSport === 'golf') return 'pga';
  if (normalizedSport === 'rugby') return '164205';
  if (normalizedSport === 'rugby-league') return '3';
  if (normalizedSport === 'volleyball') return 'mens-college-volleyball';
  if (normalizedSport === 'water-polo') return 'mens-college-water-polo';
  if (normalizedSport === 'lacrosse') return 'nll';
  if (normalizedSport === 'australian-football') return 'afl';
  return 'eng.1';
}

function getSportDisplayName(sportId = 'all') {
  const normalized = normalizeSportSlug(sportId);
  const match = SPORTS.find((sport) => normalizeSportSlug(sport.id) === normalized);
  return match?.name || (normalized === 'all' ? 'All Sports' : formatLeagueSlugLabel(normalized));
}

function inferSportForLeague(league = '', fallbackSport = 'all') {
  const normalizedLeague = normalizeLeagueSlug(league);
  if (!normalizedLeague) return normalizeSportSlug(fallbackSport);
  const cachedMatch = getCachedMatches().find((match) => normalizeLeagueSlug(match.leagueSlug || '') === normalizedLeague);
  if (cachedMatch?.sport) return normalizeSportSlug(cachedMatch.sport, normalizedLeague);
  const catalogEntry = Object.entries(RESULTS_LEAGUE_CATALOG).find(([, leagues]) => leagues.includes(normalizedLeague));
  return catalogEntry?.[0] || normalizeSportSlug(fallbackSport, normalizedLeague);
}

function getLeagueDisplayName(slug = '', fallbackLabel = '', sport = '') {
  if (fallbackLabel && hasUsefulMatchText(fallbackLabel, ['event', 'match'])) return fallbackLabel;
  return formatLeagueSlugLabel(slug || getDefaultLeagueForSport(sport));
}

function buildResultLeagueOptions(matches = []) {
  const sourceMatches = currentTab === 'all'
    ? (window._cachedAllResultsMatches || matches)
    : matches;
  const map = new Map();
  const addOption = (slug, label, sport) => {
    const normalizedLeague = normalizeLeagueSlug(slug);
    const normalizedSport = normalizeSportSlug(sport, normalizedLeague);
    if (!normalizedLeague || !normalizedSport || normalizedSport === 'all') return;
    if (map.has(normalizedLeague)) return;
    const displayLabel = currentTab === 'all'
      ? `${label} - ${getSportDisplayName(normalizedSport)}`
      : label;
    map.set(normalizedLeague, {
      slug: normalizedLeague,
      label: displayLabel,
      sport: normalizedSport
    });
  };

  if (currentTab === 'all') {
    Object.entries(RESULTS_LEAGUE_CATALOG).forEach(([sport, leagues]) => {
      leagues.slice(0, sport === 'soccer' ? 5 : 2).forEach((leagueSlug) => {
        addOption(leagueSlug, getLeagueDisplayName(leagueSlug, '', sport), sport);
      });
    });
  } else {
    (RESULTS_LEAGUE_CATALOG[currentTab] || []).forEach((leagueSlug) => {
      addOption(leagueSlug, getLeagueDisplayName(leagueSlug, '', currentTab), currentTab);
    });
  }

  sourceMatches.forEach((match) => {
    addOption(
      match.leagueSlug || '',
      getLeagueDisplayName(match.leagueSlug, match.league, match.sport),
      match.sport || currentTab
    );
  });

  return [...map.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function updateResultsSectionMeta(matches = []) {
  if (resultsSectionTitle) {
    resultsSectionTitle.textContent = 'All Results';
  }

  if (resultsSectionSubtitle) {
    if (currentLeagueFilter) {
      resultsSectionSubtitle.textContent = `Recent final scorelines from ${getLeagueDisplayName(currentLeagueFilter, '', currentTab)}`;
    } else if (currentTab === 'all') {
      resultsSectionSubtitle.textContent = 'Recent final scorelines across every sport';
    } else {
      resultsSectionSubtitle.textContent = `Recent ${getSportDisplayName(currentTab).toLowerCase()} results across every league`;
    }
  }

  if (resultsCountPill) {
    const count = Array.isArray(matches) ? matches.length : 0;
    if (!count) {
      resultsCountPill.textContent = 'Waiting for result feed';
    } else if (currentLeagueFilter) {
      resultsCountPill.textContent = `${getLeagueDisplayName(currentLeagueFilter, '', currentTab)} - ${count} results`;
    } else if (currentTab !== 'all') {
      resultsCountPill.textContent = `${getSportDisplayName(currentTab)} - ${count} results`;
    } else {
      resultsCountPill.textContent = `${count} results loaded`;
    }
  }
}

function renderResultsLeagueFilter(matches = []) {
  if (!resultsLeagueFilter) return;
  if (currentTab === 'all' && !currentLeagueFilter && Array.isArray(matches) && matches.length) {
    window._cachedAllResultsMatches = matches;
  }

  const options = buildResultLeagueOptions(matches);
  resultsLeagueFilter.innerHTML = [
    '<option value="">All leagues</option>',
    ...options.map((option) => `<option value="${option.slug}" data-sport="${option.sport}">${option.label}</option>`)
  ].join('');
  resultsLeagueFilter.disabled = !options.length;
  resultsLeagueFilter.value = currentLeagueFilter || '';
  updateResultsSectionMeta(matches);
}

function initResultsLeagueFilter() {
  if (!resultsLeagueFilter || resultsLeagueFilter.dataset.bound === 'true') return;
  resultsLeagueFilter.dataset.bound = 'true';
  resultsLeagueFilter.addEventListener('change', (event) => {
    const selected = event.target.selectedOptions?.[0] || null;
    const nextLeague = normalizeLeagueSlug(event.target.value || '');
    const nextSport = nextLeague
      ? normalizeSportSlug(selected?.dataset?.sport || inferSportForLeague(nextLeague, currentTab), nextLeague)
      : currentTab;

    currentLeagueFilter = nextLeague;
    if (nextLeague && currentTab === 'all' && nextSport !== 'all') {
      currentTab = nextSport;
    }

    const url = new URL(window.location);
    if (currentTab && currentTab !== 'all') url.searchParams.set('s', currentTab);
    else url.searchParams.delete('s');
    if (currentLeagueFilter) url.searchParams.set('l', currentLeagueFilter);
    else url.searchParams.delete('l');
    url.searchParams.delete('sport');
    url.searchParams.delete('league');
    window.history.pushState({}, '', url);
    updateDefaultPageSeo();

    renderTabs();
    renderResultsLeagueFilter([]);
    fetchMatches('finished');
  });
}

function slugifyPathSegment(value = '') {
  return sanitizeDisplayText(String(value || ''))
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildMatchSeoSlug({ homeTeam = {}, awayTeam = {} } = {}) {
  const homeSlug = slugifyPathSegment(homeTeam?.fullName || homeTeam?.name || homeTeam?.abbreviation || '');
  const awaySlug = slugifyPathSegment(awayTeam?.fullName || awayTeam?.name || awayTeam?.abbreviation || '');
  if (!homeSlug || !awaySlug) return '';
  return `${homeSlug}-vs-${awaySlug}`;
}

function buildCanonicalMatchPath({ id = '', sport = '', league = '', upcoming = false, homeTeam = {}, awayTeam = {} } = {}) {
  const normalizedLeague = normalizeLeagueSlug(league || '') || 'all';
  const normalizedSport = normalizeSportSlug(sport || 'all', normalizedLeague) || 'all';
  const routeBase = upcoming ? '/upcoming-match' : '/match';
  const normalizedId = String(id || '').trim();
  if (!normalizedId) {
    return upcoming ? '/upcoming' : '/live';
  }
  const slug = buildMatchSeoSlug({ homeTeam, awayTeam });
  const detailSegment = slug ? `${slug}-${normalizedId}` : normalizedId;
  return `${routeBase}/${encodeURIComponent(normalizedSport)}/${encodeURIComponent(normalizedLeague)}/${encodeURIComponent(detailSegment)}`;
}

function extractMatchIdFromRouteSegment(segment = '') {
  const decoded = String(segment || '').trim();
  const trailingMatch = decoded.match(/(\d+)$/);
  return trailingMatch?.[1] || decoded;
}

function parsePrettyMatchRoute(pathname = window.location.pathname) {
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch (error) {
        return segment;
      }
    });

  if (segments[0] === 'match' && segments.length >= 4) {
    return {
      id: extractMatchIdFromRouteSegment(segments[3]),
      sport: segments[1],
      league: segments[2],
      upcoming: false
    };
  }

  if (segments[0] === 'upcoming-match' && segments.length >= 4) {
    return {
      id: extractMatchIdFromRouteSegment(segments[3]),
      sport: segments[1],
      league: segments[2],
      upcoming: true
    };
  }

  return null;
}

function normalizeLegacyMatchHref(rawHref = '') {
  if (!rawHref) return '';
  try {
    const url = new URL(rawHref, window.location.origin);
    const isMatch = /\/match(?:\.html)?$/i.test(url.pathname);
    const isUpcoming = /\/upcoming_match_detail(?:\.html)?$/i.test(url.pathname) || /\/upcoming-match$/i.test(url.pathname);
    if (!isMatch && !isUpcoming) return rawHref;

    const id = url.searchParams.get('id');
    if (!id) return rawHref;
    const sport = url.searchParams.get('sport') || url.searchParams.get('s') || 'all';
    const league = url.searchParams.get('league') || url.searchParams.get('l') || 'all';

    return buildCanonicalMatchPath({ id, sport, league, upcoming: isUpcoming });
  } catch (error) {
    return rawHref;
  }
}

function normalizeLegacyMatchLinks(root = document) {
  if (!root?.querySelectorAll) return;

  root.querySelectorAll('a[href*="match.html?id="], a[href*="/match?id="], a[href*="upcoming_match_detail.html?id="], a[href*="/upcoming-match?id="]').forEach((link) => {
    const existingHref = link.getAttribute('href') || '';
    const normalized = normalizeLegacyMatchHref(existingHref);
    if (normalized && normalized !== existingHref) {
      link.setAttribute('href', normalized);
    }
  });

  root.querySelectorAll('[onclick*="match.html?id="], [onclick*="/match?id="], [onclick*="upcoming_match_detail.html?id="], [onclick*="/upcoming-match?id="]').forEach((node) => {
    const onclickValue = node.getAttribute('onclick') || '';
    const legacyHref = onclickValue.match(/['"]([^'"]*(?:match(?:\.html)?|upcoming_match_detail(?:\.html)?|upcoming-match)\?[^'"]+)['"]/i)?.[1];
    if (!legacyHref) return;
    const normalized = normalizeLegacyMatchHref(legacyHref);
    if (!normalized || normalized === legacyHref) return;
    node.setAttribute('onclick', onclickValue.replace(legacyHref, normalized));
  });
}

function observeLegacyMatchLinks() {
  if (document.body.dataset.lsfMatchLinkObserverBound) return;
  document.body.dataset.lsfMatchLinkObserverBound = 'true';

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        normalizeLegacyMatchLinks(node);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function buildMatchUrl(match) {
  if (!match?.id) {
    if (match?.status === 'finished') return '/results';
    if (match?.status === 'upcoming') return '/upcoming';
    return '/live';
  }
  return buildCanonicalMatchPath({
    id: match?.id,
    sport: match?.sport,
    league: match?.leagueSlug,
    upcoming: match?.status === 'upcoming',
    homeTeam: match?.homeTeam,
    awayTeam: match?.awayTeam
  });
}

function buildTeamProfileUrl(team, sport = '', league = '') {
  const resolvedLeague = normalizeLeagueSlug(league) || normalizeLeagueSlug(team?.league || '') || getDefaultLeagueForSport(sport);
  const resolvedSport = normalizeSportSlug(sport || TEAM_PROFILE_SPORT_BY_LEAGUE[resolvedLeague] || team?.sport || '', resolvedLeague);
  const params = new URLSearchParams();
  if (team?.id) params.set('id', team.id);
  if (team?.name) params.set('name', team.name);
  if (resolvedSport) params.set('sport', resolvedSport);
  if (resolvedLeague) params.set('league', resolvedLeague);
  if (team?.logo) params.set('logo', team.logo);
  if (team?.record) params.set('record', team.record);
  if (team?.venue) params.set('venue', team.venue);
  const query = params.toString();
  return query ? `/team?${query}` : '/team';
}

function buildPlayerProfileUrl(athlete, sport = '', league = '') {
  const resolvedLeague = normalizeLeagueSlug(league) || normalizeLeagueSlug(athlete?.league || '') || getDefaultLeagueForSport(sport);
  const resolvedSport = normalizeSportSlug(sport || athlete?.sport || TEAM_PROFILE_SPORT_BY_LEAGUE[resolvedLeague] || '', resolvedLeague);
  const params = new URLSearchParams();
  if (athlete?.id) params.set('id', athlete.id);
  if (athlete?.fullName) params.set('name', athlete.fullName);
  if (resolvedSport) params.set('sport', resolvedSport);
  if (resolvedLeague) params.set('league', resolvedLeague);
  if (athlete?.team?.name) params.set('team', athlete.team.name);
  if (athlete?.position?.displayName || athlete?.position?.name) params.set('role', athlete.position?.displayName || athlete.position?.name);
  const query = params.toString();
  return query ? `/player?${query}` : '/player';
}

function buildApiUrl(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

class PublicApiDataStore {
  constructor() {
    this.entries = new Map();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.refreshActive();
    });
    window.addEventListener('online', () => this.refreshActive({ force: true }));
  }

  buildKey(path, params = {}) {
    const query = new URLSearchParams();
    Object.keys(params)
      .sort()
      .forEach((key) => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          query.set(key, value);
        }
      });
    const suffix = query.toString();
    return suffix ? `${path}?${suffix}` : path;
  }

  getEntry(path, params = {}) {
    const key = this.buildKey(path, params);
    if (!this.entries.has(key)) {
      this.entries.set(key, {
        key,
        path,
        params: { ...params },
        data: null,
        error: null,
        status: 'idle',
        updatedAt: 0,
        inflight: null,
        subscribers: new Map(),
        refreshMs: 0,
        maxAgeMs: 0,
        timer: null
      });
    }
    return this.entries.get(key);
  }

  createSnapshot(entry) {
    return {
      key: entry.key,
      url: buildApiUrl(entry.path, entry.params),
      data: entry.data,
      error: entry.error,
      status: entry.status,
      updatedAt: entry.updatedAt
    };
  }

  notify(entry) {
    const snapshot = this.createSnapshot(entry);
    entry.subscribers.forEach((config, listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error('LSFDataStore listener failed:', error);
      }
    });
  }

  isStale(entry, maxAgeMs = entry.maxAgeMs) {
    if (!entry.updatedAt) return true;
    if (!maxAgeMs || maxAgeMs < 0) return false;
    return Date.now() - entry.updatedAt >= maxAgeMs;
  }

  recalculateEntry(entry) {
    const configs = Array.from(entry.subscribers.values());
    entry.refreshMs = configs.reduce((min, cfg) => {
      if (!cfg.refreshMs || cfg.refreshMs <= 0) return min;
      return min ? Math.min(min, cfg.refreshMs) : cfg.refreshMs;
    }, 0);
    entry.maxAgeMs = configs.reduce((min, cfg) => {
      if (!cfg.maxAgeMs || cfg.maxAgeMs <= 0) return min;
      return min ? Math.min(min, cfg.maxAgeMs) : cfg.maxAgeMs;
    }, 0);

    if (entry.timer) {
      clearInterval(entry.timer);
      entry.timer = null;
    }

    if (!entry.subscribers.size || !entry.refreshMs) return;

    entry.timer = setInterval(() => {
      if (document.hidden) return;
      if (!this.isStale(entry)) return;
      this.fetchEntry(entry, { force: true }).catch(() => {});
    }, entry.refreshMs);
  }

  async fetchEntry(entry, options = {}) {
    const { force = false } = options;
    if (entry.inflight) return entry.inflight;
    if (!force && !this.isStale(entry)) return entry.data;

    entry.status = entry.data ? 'refreshing' : 'loading';
    entry.error = null;
    this.notify(entry);

    entry.inflight = fetch(buildApiUrl(entry.path, entry.params), { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        entry.data = data;
        entry.error = null;
        entry.status = 'success';
        entry.updatedAt = Date.now();
        return data;
      })
      .catch((error) => {
        entry.error = error;
        entry.status = entry.data ? 'stale' : 'error';
        throw error;
      })
      .finally(() => {
        entry.inflight = null;
        this.notify(entry);
      });

    return entry.inflight;
  }

  subscribe(options, listener) {
    const { path, params = {}, refreshMs = 0, maxAgeMs = 0 } = options || {};
    const entry = this.getEntry(path, params);
    entry.subscribers.set(listener, { refreshMs, maxAgeMs });
    this.recalculateEntry(entry);
    listener(this.createSnapshot(entry));

    if (entry.status === 'idle' || this.isStale(entry, maxAgeMs || entry.maxAgeMs)) {
      this.fetchEntry(entry, { force: true }).catch(() => {});
    }

    return () => {
      entry.subscribers.delete(listener);
      this.recalculateEntry(entry);
    };
  }

  fetch(options) {
    const entry = this.getEntry(options?.path, options?.params);
    return this.fetchEntry(entry, { force: options?.force === true });
  }

  peek(options) {
    const entry = this.getEntry(options?.path, options?.params);
    return this.createSnapshot(entry);
  }

  invalidate(options) {
    const entry = this.getEntry(options?.path, options?.params);
    entry.updatedAt = 0;
    entry.status = entry.data ? 'stale' : 'idle';
    if (entry.subscribers.size && !document.hidden) {
      this.fetchEntry(entry, { force: true }).catch(() => {});
    }
  }

  refreshActive(options = {}) {
    this.entries.forEach((entry) => {
      if (!entry.subscribers.size) return;
      if (!options.force && !this.isStale(entry)) return;
      this.fetchEntry(entry, { force: true }).catch(() => {});
    });
  }
}

window.LSFDataStore = window.LSFDataStore || new PublicApiDataStore();

function buildPageUrl(path = '/', params = null) {
  const query = params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params || {}).toString();
  return query ? `${path}?${query}` : path;
}

function buildSportHubUrl(sport = '', league = '') {
  const params = new URLSearchParams();
  const normalizedSport = normalizeSportSlug(sport, league);
  const normalizedLeague = normalizeLeagueSlug(league);
  if (normalizedSport === 'cricket' && normalizedLeague === 'ipl') {
    return '/ipl';
  }
  if (normalizedSport && normalizedSport !== 'all') params.set('s', normalizedSport);
  if (normalizedLeague) params.set('l', normalizedLeague);
  return buildPageUrl('/sport', params);
}

function buildBlogHubUrl(sport = '', league = '') {
  const params = new URLSearchParams();
  const normalizedSport = normalizeSportSlug(sport || 'all', league);
  const normalizedLeague = normalizeLeagueSlug(league);
  if (normalizedSport && normalizedSport !== 'all') params.set('s', normalizedSport);
  if (normalizedLeague) params.set('l', normalizedLeague);
  return buildPageUrl('/news', params);
}

function buildBlogArticleUrl(post = {}) {
  const params = new URLSearchParams();
  if (post.slug) params.set('slug', post.slug);
  if (post.sport) params.set('sport', post.sport);
  if (post.league) params.set('league', post.league);
  return buildPageUrl('/blog_article', params);
}

function escapeHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSourceFaviconUrl(source = {}) {
  if (source?.favicon) return source.favicon;
  const sourceUrl = source?.url || '';
  try {
    const domain = new URL(sourceUrl).hostname.replace(/^www\./, '');
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  } catch (error) {
    return FALLBACK_LOGO;
  }
}

function upsertHeadMeta(name, content, attribute = 'name') {
  if (!content) return;
  let node = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, name);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function upsertHeadLink(rel, href) {
  if (!href) return;
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
}

function upsertJsonLdScript(id, payload) {
  if (!id || !payload) return;
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement('script');
    node.type = 'application/ld+json';
    node.id = id;
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(payload);
}

function isHomePath(pathname = window.location.pathname) {
  return getPageKeyFromPath(pathname) === 'index';
}

function isCurrentPage(...keys) {
  const pageKey = getPageKeyFromPath(window.location.pathname);
  return keys.includes(pageKey);
}

function getSportSeoLabel(sport = 'all') {
  const normalizedSport = normalizeSportSlug(sport || 'all');
  if (!normalizedSport || normalizedSport === 'all') return 'Sports';
  const entry = SPORTS.find((item) => normalizeSportSlug(item.id) === normalizedSport);
  return sanitizeDisplayText(entry?.name || normalizedSport.replace(/-/g, ' '));
}

function getLeagueSeoLabel(league = '', sport = '') {
  const normalizedLeague = normalizeLeagueSlug(league);
  if (!normalizedLeague) return '';
  return sanitizeDisplayText(getLeagueDisplayName(normalizedLeague, '', sport || ''));
}

function buildFilteredHubPath(path = '/', sport = '', league = '') {
  const params = new URLSearchParams();
  const normalizedSport = normalizeSportSlug(sport || 'all', league);
  const normalizedLeague = normalizeLeagueSlug(league);
  if (normalizedSport && normalizedSport !== 'all') params.set('s', normalizedSport);
  if (normalizedLeague) params.set('l', normalizedLeague);
  return buildPageUrl(path, params);
}

function buildPageCanonicalPath(pageKey = getPageKeyFromPath(window.location.pathname), rawSearch = window.location.search) {
  const params = new URLSearchParams(rawSearch || '');
  const rawSport = params.get('s') || params.get('sport') || currentTab || 'all';
  const rawLeague = params.get('l') || params.get('league') || currentLeagueFilter || '';
  const sport = normalizeSportSlug(rawSport || 'all', rawLeague);
  const league = normalizeLeagueSlug(rawLeague || '');

  switch (pageKey) {
    case 'index':
      return '/';
    case 'live':
      return buildFilteredHubPath('/live', sport, league);
    case 'upcoming':
      return buildFilteredHubPath('/upcoming', sport, league);
    case 'results':
      return buildFilteredHubPath('/results', sport, league);
    case 'news':
      return buildFilteredHubPath('/news', sport, league);
    case 'sport':
      return buildSportHubUrl(sport, league);
    case 'team': {
      const canonicalParams = new URLSearchParams();
      ['id', 'name', 'sport', 'league'].forEach((key) => {
        const value = params.get(key);
        if (value) canonicalParams.set(key, value);
      });
      return buildPageUrl('/team', canonicalParams);
    }
    case 'player': {
      const canonicalParams = new URLSearchParams();
      ['id', 'name', 'sport', 'league', 'team', 'role'].forEach((key) => {
        const value = params.get(key);
        if (value) canonicalParams.set(key, value);
      });
      return buildPageUrl('/player', canonicalParams);
    }
    case 'info': {
      const canonicalParams = new URLSearchParams();
      const page = params.get('p');
      if (page) canonicalParams.set('p', page);
      return buildPageUrl('/info', canonicalParams);
    }
    case 'blog_article': {
      const canonicalParams = new URLSearchParams();
      ['slug', 'sport', 'league'].forEach((key) => {
        const value = params.get(key);
        if (value) canonicalParams.set(key, value);
      });
      return buildPageUrl('/blog_article', canonicalParams);
    }
    case 'blog_hub':
      return buildFilteredHubPath('/blog_hub', sport, league);
    case 'trending':
      return buildFilteredHubPath('/trending', sport, league);
    case 'leagues':
      return '/leagues';
    case 'teams':
      return buildFilteredHubPath('/teams', sport, league);
    case 'players':
      return buildFilteredHubPath('/players', sport, league);
    case 'standings':
      return buildFilteredHubPath('/standings', sport, league);
    case 'ipl':
      return '/ipl';
    case 'match':
      return buildCanonicalMatchPath({ id: params.get('id') || '', sport, league, upcoming: false });
    case 'upcoming_match_detail':
      return buildCanonicalMatchPath({ id: params.get('id') || '', sport, league, upcoming: true });
    default:
      return pageKey ? `/${pageKey}` : '/';
  }
}

function syncStaticCanonicalPath(pageKey = getPageKeyFromPath(window.location.pathname)) {
  if (pageKey === 'match' || pageKey === 'upcoming_match_detail') return null;
  const canonicalPath = buildPageCanonicalPath(pageKey, window.location.search);
  if (!canonicalPath) return null;
  const current = new URL(window.location.href);
  const target = new URL(canonicalPath, window.location.origin);
  if (`${current.pathname}${current.search}` !== `${target.pathname}${target.search}`) {
    window.history.replaceState({}, '', `${target.pathname}${target.search}${target.hash}`);
  }
  return target.toString();
}

function buildDefaultSeoState(pageKey = getPageKeyFromPath(window.location.pathname), rawSearch = window.location.search) {
  const params = new URLSearchParams(rawSearch || '');
  const rawSport = params.get('s') || params.get('sport') || currentTab || 'all';
  const rawLeague = params.get('l') || params.get('league') || currentLeagueFilter || '';
  const sport = normalizeSportSlug(rawSport || 'all', rawLeague);
  const league = normalizeLeagueSlug(rawLeague || '');
  const sportLabel = getSportSeoLabel(sport);
  const leagueLabel = getLeagueSeoLabel(league, sport);
  const canonicalPath = buildPageCanonicalPath(pageKey, rawSearch);
  const canonicalUrl = new URL(canonicalPath, window.location.origin).toString();
  const pageToken = params.get('p') || '';
  const infoLabelMap = {
    about: 'About LiveScoreFree',
    privacy: 'Privacy Policy',
    terms: 'Terms and Conditions',
    dmca: 'DMCA Policy',
    transparency: 'Transparency and Editorial Standards',
    contact: 'Contact and Support'
  };
  const teamName = sanitizeDisplayText(params.get('name') || 'Team');
  const playerName = sanitizeDisplayText(params.get('name') || 'Player');
  const teamLabel = sanitizeDisplayText(params.get('team') || '');
  const roleLabel = sanitizeDisplayText(params.get('role') || 'player');
  const articleSlug = sanitizeDisplayText((params.get('slug') || '').replace(/-/g, ' '));
  const articleLabel = articleSlug
    ? articleSlug.replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Editorial Story';
  const baseImage = new URL(FALLBACK_HERO_IMAGE, window.location.origin).toString();

  const defaults = {
    title: 'Live Scores, Match Centres, Schedules and Sports News | LiveScoreFree',
    description: 'Follow live scores, upcoming fixtures, final results, standings, trusted sports updates, and detailed match centres across football, cricket, basketball, tennis, baseball, hockey, and more on LiveScoreFree.',
    type: 'website'
  };

  switch (pageKey) {
    case 'live':
      defaults.title = leagueLabel
        ? `${leagueLabel} Live Scores and Match Centre | LiveScoreFree`
        : `${sportLabel} Live Scores and Match Centre | LiveScoreFree`;
      defaults.description = leagueLabel
        ? `Track ${leagueLabel} live scores, lineups, match timelines, and key stats in real time with LiveScoreFree.`
        : `Track ${sportLabel.toLowerCase()} live scores, match centres, verified timelines, and key stats in real time with LiveScoreFree.`;
      break;
    case 'upcoming':
      defaults.title = leagueLabel
        ? `${leagueLabel} Fixtures and Upcoming Matches | LiveScoreFree`
        : `${sportLabel} Fixtures and Upcoming Matches | LiveScoreFree`;
      defaults.description = leagueLabel
        ? `See ${leagueLabel} upcoming fixtures, kickoff times, venues, and pre-match context on LiveScoreFree.`
        : `See upcoming ${sportLabel.toLowerCase()} fixtures, kickoff times, venues, and match previews on LiveScoreFree.`;
      break;
    case 'results':
      defaults.title = leagueLabel
        ? `${leagueLabel} Results and Final Scores | LiveScoreFree`
        : `${sportLabel} Results and Final Scores | LiveScoreFree`;
      defaults.description = leagueLabel
        ? `Review ${leagueLabel} final scores, recent results, and match summaries with LiveScoreFree.`
        : `Review recent ${sportLabel.toLowerCase()} results, final scores, and match summaries with LiveScoreFree.`;
      break;
    case 'news':
      defaults.title = leagueLabel
        ? `${leagueLabel} News, Fan Guides and Match Stories | LiveScoreFree`
        : `${sportLabel} News, Fan Guides and Match Stories | LiveScoreFree`;
      defaults.description = leagueLabel
        ? `Read ${leagueLabel} news, rewritten fan guides, and source-linked sports stories curated by LiveScoreFree.`
        : `Read ${sportLabel.toLowerCase()} news, rewritten fan guides, and source-linked sports stories curated by LiveScoreFree.`;
      break;
    case 'sport':
      defaults.title = leagueLabel
        ? `${leagueLabel} Scores, Fixtures and Standings | LiveScoreFree`
        : `${sportLabel} Scores, Fixtures and Standings | LiveScoreFree`;
      defaults.description = leagueLabel
        ? `Track ${leagueLabel} live scores, standings, schedules, teams, and match coverage on LiveScoreFree.`
        : `Track ${sportLabel.toLowerCase()} live scores, standings, schedules, and match coverage on LiveScoreFree.`;
      break;
    case 'team':
      defaults.title = `${teamName} Team Profile and Match Context | LiveScoreFree`;
      defaults.description = leagueLabel
        ? `View the ${teamName} team profile with league context, identity details, and live match links for ${leagueLabel} on LiveScoreFree.`
        : `View the ${teamName} team profile with club identity, venue context, and live match links on LiveScoreFree.`;
      break;
    case 'player':
      defaults.title = `${playerName} Player Profile and Career Snapshot | LiveScoreFree`;
      defaults.description = `${playerName}${teamLabel ? ` of ${teamLabel}` : ''} with ${roleLabel} context, profile details, and connected match coverage on LiveScoreFree.`;
      break;
    case 'players':
      defaults.title = leagueLabel
        ? `${leagueLabel} Players, Profiles and Trending Athletes | LiveScoreFree`
        : `${sportLabel} Players, Profiles and Trending Athletes | LiveScoreFree`;
      defaults.description = `Explore ${sportLabel.toLowerCase()} player profiles, trending athletes, and quick career snapshots on LiveScoreFree.`;
      break;
    case 'teams':
      defaults.title = leagueLabel
        ? `${leagueLabel} Teams and Club Profiles | LiveScoreFree`
        : `${sportLabel} Teams and Club Profiles | LiveScoreFree`;
      defaults.description = `Browse ${sportLabel.toLowerCase()} team profiles, club identities, and match connections on LiveScoreFree.`;
      break;
    case 'standings':
      defaults.title = leagueLabel
        ? `${leagueLabel} Standings and Table Tracker | LiveScoreFree`
        : `${sportLabel} Standings and Table Tracker | LiveScoreFree`;
      defaults.description = leagueLabel
        ? `Follow the ${leagueLabel} table with points, wins, losses, form, and movement updates on LiveScoreFree.`
        : `Follow ${sportLabel.toLowerCase()} standings, rankings, and table movement updates on LiveScoreFree.`;
      break;
    case 'leagues':
      defaults.title = 'Sports Leagues Directory and Coverage Hubs | LiveScoreFree';
      defaults.description = 'Explore major football, cricket, basketball, baseball, hockey, tennis, MMA, and racing leagues with dedicated coverage hubs on LiveScoreFree.';
      break;
    case 'trending':
      defaults.title = leagueLabel
        ? `${leagueLabel} Trending Matches, Results and Headlines | LiveScoreFree`
        : 'Trending Matches, Results and Sports Headlines | LiveScoreFree';
      defaults.description = 'Track the trending sports pulse with live matches, fixtures, recent results, news, and standout athletes on LiveScoreFree.';
      break;
    case 'blog_hub':
      defaults.title = leagueLabel
        ? `${leagueLabel} Editorial Hub and Fan Guides | LiveScoreFree`
        : `${sportLabel} Editorial Hub and Fan Guides | LiveScoreFree`;
      defaults.description = 'Explore long-form sports fan guides, editorial explainers, and match-driven stories published by LiveScoreFree.';
      break;
    case 'blog_article':
      defaults.title = `${articleLabel} | LiveScoreFree Editorial`;
      defaults.description = `Read the LiveScoreFree editorial story on ${articleLabel.toLowerCase()} with source-linked context and match connections.`;
      defaults.type = 'article';
      break;
    case 'info':
      defaults.title = `${infoLabelMap[pageToken] || 'Information and Policies'} | LiveScoreFree`;
      defaults.description = 'Review LiveScoreFree policies, transparency notes, legal resources, and help information in one place.';
      break;
    case 'ipl':
      defaults.title = 'IPL Live Scores, Fixtures, Points Table and Team News | LiveScoreFree';
      defaults.description = 'Follow IPL live scores, schedules, results, team squads, commentary, and points table updates on LiveScoreFree.';
      break;
    case 'index':
      defaults.title = 'Live Scores, Match Centres, Fixtures and Sports News | LiveScoreFree';
      defaults.description = 'Follow live scores, fixtures, results, standings, and verified sports coverage across football, cricket, basketball, tennis, baseball, hockey, and more on LiveScoreFree.';
      break;
    default:
      break;
  }

  return {
    ...defaults,
    canonicalUrl,
    canonicalPath,
    image: baseImage
  };
}

function updateSiteSchemas(seoState = buildDefaultSeoState()) {
  const logoUrl = new URL(FALLBACK_LOGO, window.location.origin).toString();
  const pageSchemaType = seoState.type === 'article'
    ? 'Article'
    : (isHomePath() ? 'WebSite' : 'WebPage');
  upsertJsonLdScript('lsf-organization-schema', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LiveScoreFree',
    url: window.location.origin,
    logo: logoUrl
  });

  upsertJsonLdScript('lsf-webpage-schema', {
    '@context': 'https://schema.org',
    '@type': pageSchemaType,
    name: seoState.title,
    description: seoState.description,
    url: seoState.canonicalUrl,
    publisher: {
      '@type': 'Organization',
      name: 'LiveScoreFree',
      logo: {
        '@type': 'ImageObject',
        url: logoUrl
      }
    }
  });
}

function updateDefaultPageSeo(pageKey = getPageKeyFromPath(window.location.pathname)) {
  if (pageKey === 'match' || pageKey === 'upcoming_match_detail') return;
  const seoState = buildDefaultSeoState(pageKey, window.location.search);

  document.title = seoState.title;
  upsertHeadMeta('description', seoState.description);
  upsertHeadMeta('robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  upsertHeadMeta('author', 'LiveScoreFree Editorial Desk');
  upsertHeadMeta('publisher', 'LiveScoreFree');
  upsertHeadMeta('og:title', seoState.title, 'property');
  upsertHeadMeta('og:description', seoState.description, 'property');
  upsertHeadMeta('og:type', seoState.type, 'property');
  upsertHeadMeta('og:url', seoState.canonicalUrl, 'property');
  upsertHeadMeta('og:image', seoState.image, 'property');
  upsertHeadMeta('og:site_name', 'LiveScoreFree', 'property');
  upsertHeadMeta('twitter:card', 'summary_large_image', 'name');
  upsertHeadMeta('twitter:title', seoState.title, 'name');
  upsertHeadMeta('twitter:description', seoState.description, 'name');
  upsertHeadMeta('twitter:image', seoState.image, 'name');
  upsertHeadLink('canonical', seoState.canonicalUrl);
  updateSiteSchemas(seoState);
}

function syncMatchCanonicalPath(data = {}, upcoming = false) {
  const canonicalPath = buildCanonicalMatchPath({
    id: data?.id,
    sport: data?.sport,
    league: data?.leagueSlug,
    upcoming,
    homeTeam: data?.homeTeam,
    awayTeam: data?.awayTeam
  });
  if (!canonicalPath || window.location.pathname === canonicalPath) return canonicalPath;
  window.history.replaceState({}, '', canonicalPath);
  return canonicalPath;
}

function updateMatchSeo(data = {}, upcoming = false) {
  if (!data?.homeTeam || !data?.awayTeam) return;
  const homeDisplay = sanitizeDisplayText(data.homeTeam.fullName || data.homeTeam.name || 'Home Team');
  const awayDisplay = sanitizeDisplayText(data.awayTeam.fullName || data.awayTeam.name || 'Away Team');
  const matchup = `${homeDisplay} vs ${awayDisplay}`;
  const leagueLabel = sanitizeDisplayText(data.league || getLeagueDisplayName(data.leagueSlug || '', '', data.sport || ''));
  const status = String(data.status || '').toLowerCase();
  const title = upcoming
    ? `${matchup} | Upcoming Match Centre`
    : status === 'finished'
      ? `${matchup} | Final Score and Match Centre`
      : `${matchup} | Live Match Centre`;
  const description = upcoming
    ? `Track ${matchup} in the ${leagueLabel} with schedule, venue, lineup updates, and pre-match analysis on LiveScoreFree.`
    : status === 'finished'
      ? `Review ${matchup} in the ${leagueLabel} with the final score, key moments, match stats, and lineup details on LiveScoreFree.`
      : `Follow ${matchup} in the ${leagueLabel} with live scores, real-time commentary, match stats, and verified lineup data on LiveScoreFree.`;
  const image = getSafeImageUrl(data?.homeTeam?.logo || data?.awayTeam?.logo, FALLBACK_LOGO);
  const canonicalPath = syncMatchCanonicalPath(data, upcoming);
  const canonicalUrl = new URL(canonicalPath || buildCanonicalMatchPath({
    id: data?.id,
    sport: data?.sport,
    league: data?.leagueSlug,
    upcoming,
    homeTeam: data?.homeTeam,
    awayTeam: data?.awayTeam
  }), window.location.origin).toString();

  document.title = title;
  upsertHeadMeta('description', description);
  upsertHeadMeta('og:title', title, 'property');
  upsertHeadMeta('og:description', description, 'property');
  upsertHeadMeta('og:url', canonicalUrl, 'property');
  upsertHeadMeta('og:image', new URL(image, window.location.origin).toString(), 'property');
  upsertHeadMeta('og:type', 'website', 'property');
  upsertHeadMeta('twitter:card', 'summary_large_image', 'name');
  upsertHeadMeta('twitter:title', title, 'name');
  upsertHeadMeta('twitter:description', description, 'name');
  upsertHeadMeta('twitter:image', new URL(image, window.location.origin).toString(), 'name');
  upsertHeadLink('canonical', canonicalUrl);
  updateSiteSchemas({
    title,
    description,
    canonicalUrl,
    image: new URL(image, window.location.origin).toString(),
    type: 'website'
  });
}

function updateBlogSeo(post = {}, type = 'article') {
  const title = post?.seoTitle || post?.title || post?.headline || 'LivescoreFree sports blog';
  const description = post?.seoDescription || post?.excerpt || 'Evergreen sports fan guides and editorial recaps.';
  const image = post?.image || FALLBACK_HERO_IMAGE;
  const canonical = type === 'article' ? buildBlogArticleUrl(post) : buildBlogHubUrl(post?.sport || 'all', post?.league || '');

  document.title = title;
  upsertHeadMeta('description', description);
  upsertHeadMeta('og:title', title, 'property');
  upsertHeadMeta('og:description', description, 'property');
  upsertHeadMeta('og:image', new URL(image, window.location.origin).toString(), 'property');
  upsertHeadMeta('og:type', type === 'article' ? 'article' : 'website', 'property');
  upsertHeadMeta('twitter:card', 'summary_large_image', 'name');
  upsertHeadMeta('twitter:title', title, 'name');
  upsertHeadMeta('twitter:description', description, 'name');
  upsertHeadMeta('twitter:image', new URL(image, window.location.origin).toString(), 'name');
  upsertHeadLink('canonical', new URL(canonical, window.location.origin).toString());
  updateSiteSchemas({
    title,
    description,
    canonicalUrl: new URL(canonical, window.location.origin).toString(),
    image: new URL(image, window.location.origin).toString(),
    type: type === 'article' ? 'article' : 'website'
  });
}

function getCurrentFeedParams(overrides = {}) {
  const league = normalizeLeagueSlug(overrides.league ?? currentLeagueFilter ?? '');
  const rawSport = overrides.sport ?? currentTab ?? 'all';
  return {
    sport: league ? inferSportForLeague(league, rawSport) : normalizeSportSlug(rawSport, league),
    league
  };
}

function getCachedMatches() {
  return [
    ...(window._cachedUpcomingMatches || []),
    ...(window._cachedResults || []),
    ...(window._cachedMatches || []),
    ...(window._cachedLiveMatches || [])
  ];
}

function findCachedMatch(matchId = '') {
  return getCachedMatches().find((match) => String(match.id) === String(matchId)) || null;
}

function isGenericTeamLabel(value = '') {
  const label = String(value || '').trim().toLowerCase();
  return !label || ['home', 'away', 'tbd', 'to be determined', 'team home', 'team away', 'player 1', 'player 2'].includes(label);
}

function isPlaceholderTeam(team = {}) {
  const name = String(team?.name || team?.fullName || '').trim();
  const abbreviation = String(team?.abbreviation || '').trim().toLowerCase();
  return isGenericTeamLabel(name) || ['hom', 'awa', 'tbd'].includes(abbreviation);
}

function filterRenderableMatches(matches = []) {
  return matches.filter((match) => {
    if (!match?.id || !match?.homeTeam || !match?.awayTeam) return false;
    return !isPlaceholderTeam(match.homeTeam) && !isPlaceholderTeam(match.awayTeam);
  });
}

function buildTeamIdentitySet(team = {}) {
  return new Set(
    [
      team.id,
      team.abbreviation,
      team.name,
      team.fullName
    ]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean)
  );
}

function isSameMatchup(match = {}, homeTeam = {}, awayTeam = {}) {
  const homeKeys = buildTeamIdentitySet(homeTeam);
  const awayKeys = buildTeamIdentitySet(awayTeam);
  const matchHomeKeys = buildTeamIdentitySet(match.homeTeam || {});
  const matchAwayKeys = buildTeamIdentitySet(match.awayTeam || {});
  const intersects = (left, right) => [...left].some((value) => right.has(value));
  return (intersects(homeKeys, matchHomeKeys) && intersects(awayKeys, matchAwayKeys))
    || (intersects(homeKeys, matchAwayKeys) && intersects(awayKeys, matchHomeKeys));
}

function formatMatchDateLabel(value = '') {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildSyntheticMatchLineup(team = {}) {
  if (!team?.leader?.name && !team?.leader?.value) return [];
  return [{
    name: team.leader?.name || team.name || 'Key Player',
    number: '',
    position: 'Key Player',
    starter: true,
    face: team.logo || FALLBACK_LOGO
  }];
}

function sanitizeDisplayText(value = '') {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\u00c3\u0082\u00c2\u00b7|\u00c2\u00b7|\u00b7/g, ' - ')
    .replace(/\u00c3\u0083\u00c2\u00a2\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c3\u00a2\u20ac\u201d\u00c2\u009d|\u00c3\u00a2\u20ac\u201d|\u2014|\u2013/g, ' - ')
    .replace(/\u00c3\u0083\u00c2\u00a2\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c3\u201a\u00c2\u00a2|\u00c3\u00a2\u20ac\u00a2/g, ' - ')
    .replace(/\u00c3\u201a|\u00c2/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function sanitizePayloadText(value, seen = new WeakMap()) {
  if (typeof value === 'string') return sanitizeDisplayText(value);
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const next = value.map((entry) => sanitizePayloadText(entry, seen));
    seen.set(value, next);
    return next;
  }

  const next = {};
  seen.set(value, next);
  Object.entries(value).forEach(([key, entry]) => {
    next[key] = sanitizePayloadText(entry, seen);
  });
  return next;
}

function buildSyntheticMatchStats(match = {}) {
  const stats = [];
  if (match.homeTeam?.record || match.awayTeam?.record) {
    stats.push({
      label: 'Record',
      home: match.homeTeam?.record || '-',
      away: match.awayTeam?.record || '-'
    });
  }
  if (match.homeTeam?.leader || match.awayTeam?.leader) {
    stats.push({
      label: 'Top Performer',
      home: [match.homeTeam?.leader?.name, match.homeTeam?.leader?.value].filter(Boolean).join(' ') || '-',
      away: [match.awayTeam?.leader?.name, match.awayTeam?.leader?.value].filter(Boolean).join(' ') || '-'
    });
  }
  if (match.statusText || match.time) {
    stats.push({
      label: 'Match Status',
      home: match.statusText || match.time || match.status || 'Update',
      away: match.league || match.leagueSlug || 'League'
    });
  }
  return stats.slice(0, 6);
}

function buildSyntheticMatchTimeline(match = {}) {
  const items = [];
  if (match.statusText || match.time) {
    const text = match.statusText || match.time || `${match.status || 'scheduled'} update`;
    items.push({
      time: match.time || String(match.status || 'update').toUpperCase(),
      type: match.status === 'finished' ? 'result' : 'event',
      text,
      player: text,
      side: 'neutral'
    });
  }
  if (match.date) {
    const scheduled = new Date(match.date);
    if (!Number.isNaN(scheduled.getTime())) {
      const text = `Scheduled for ${scheduled.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
      items.push({
        time: 'DATE',
        type: 'event',
        text,
        player: text,
        side: 'neutral'
      });
    }
  }
  if (match.venue) {
    const text = `Venue: ${match.venue}`;
    items.push({
      time: 'VENUE',
      type: 'event',
      text,
      player: text,
      side: 'neutral'
    });
  }
  [
    { side: 'home', team: match.homeTeam || {} },
    { side: 'away', team: match.awayTeam || {} }
  ].forEach(({ side, team }) => {
    if (!team?.leader?.name && !team?.leader?.value) return;
    const text = [team.leader?.name, team.leader?.value].filter(Boolean).join(' ');
    items.push({
      time: 'STAR',
      type: 'event',
      text,
      player: text,
      side
    });
  });
  return items.slice(0, 6);
}

function buildSyntheticHeadToHead(match = {}, referenceMatches = []) {
  const sourceMatches = Array.isArray(referenceMatches) && referenceMatches.length
    ? referenceMatches
    : getCachedMatches();
  const candidates = filterRenderableMatches(sourceMatches)
    .filter((entry) => entry.status === 'finished')
    .filter((entry) => String(entry.id) !== String(match.id))
    .filter((entry) => isSameMatchup(entry, match.homeTeam || {}, match.awayTeam || {}))
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 5);

  return candidates.map((entry) => ({
    date: formatMatchDateLabel(entry.date),
    home: entry.homeTeam?.abbreviation || entry.homeTeam?.name || 'Home',
    away: entry.awayTeam?.abbreviation || entry.awayTeam?.name || 'Away',
    score: `${entry.homeTeam?.score || '0'} - ${entry.awayTeam?.score || '0'}`,
    result: entry.statusText || 'Final'
  }));
}

function formatHeroScoreMarkup(rawScore = '', sport = '') {
  const scoreText = String(rawScore || '0').trim();
  if (!scoreText) return '0';

  if (sport === 'cricket' || scoreText.includes('(') || scoreText.length > 8) {
    const [primary, remainder] = scoreText.split(/\s*\(/, 2);
    const trailing = remainder ? `(${remainder}` : '';
    return `
      <span class="block leading-none">${primary || '0'}</span>
      ${trailing ? `<span class="mt-2 block text-[0.28em] leading-tight tracking-normal text-on-surface/70">${trailing}</span>` : ''}
    `;
  }

  return scoreText;
}

function normalizeMatchDetailFallback(match = {}, referenceMatches = []) {
  return sanitizePayloadText({
    id: match.id || '',
    sport: normalizeSportSlug(match.sport || '', match.leagueSlug || ''),
    leagueSlug: normalizeLeagueSlug(match.leagueSlug || ''),
    league: match.league || 'Sports Event',
    status: match.status || 'upcoming',
    statusText: match.statusText || match.time || '',
    time: match.time || match.statusText || '',
    date: match.date || '',
    venue: match.venue || '',
    broadcast: match.broadcast || '',
    homeTeam: {
      ...(match.homeTeam || {}),
      name: match.homeTeam?.name || 'Home Team',
      logo: match.homeTeam?.logo || FALLBACK_LOGO,
      score: match.homeTeam?.score || '0',
      lineup: Array.isArray(match.homeTeam?.lineup) && match.homeTeam.lineup.length
        ? match.homeTeam.lineup
        : buildSyntheticMatchLineup(match.homeTeam || {})
    },
    awayTeam: {
      ...(match.awayTeam || {}),
      name: match.awayTeam?.name || 'Away Team',
      logo: match.awayTeam?.logo || FALLBACK_LOGO,
      score: match.awayTeam?.score || '0',
      lineup: Array.isArray(match.awayTeam?.lineup) && match.awayTeam.lineup.length
        ? match.awayTeam.lineup
        : buildSyntheticMatchLineup(match.awayTeam || {})
    },
    stats: buildSyntheticMatchStats(match),
    timeline: buildSyntheticMatchTimeline(match),
    commentary: buildSyntheticMatchTimeline(match).map((entry) => ({
      time: entry.time,
      text: entry.text || entry.player || '',
      type: entry.type || 'commentary'
    })),
    odds: null,
    h2h: buildSyntheticHeadToHead(match, referenceMatches),
    situation: null
  });
}

function hasUsefulMatchText(value, blocked = []) {
  const text = String(value || '').trim();
  if (!text) return false;
  return !blocked.some((candidate) => text.toLowerCase() === String(candidate || '').trim().toLowerCase());
}

function isUsefulMatchDateValue(value = '') {
  const text = String(value || '').trim();
  if (!text) return false;
  const normalized = text.toLowerCase();
  if (['loading...', 'scheduled event', 'regular season', 'preseason', 'postseason'].includes(normalized)) {
    return false;
  }
  return Number.isFinite(Date.parse(text));
}

function pickBestMatchText(primaryValue, fallbackValue, blocked = []) {
  if (hasUsefulMatchText(primaryValue, blocked)) return String(primaryValue).trim();
  if (hasUsefulMatchText(fallbackValue, blocked)) return String(fallbackValue).trim();
  return String(primaryValue || fallbackValue || '').trim();
}

function pickBestMatchDate(primaryValue, fallbackValue) {
  if (isUsefulMatchDateValue(primaryValue)) return String(primaryValue).trim();
  if (isUsefulMatchDateValue(fallbackValue)) return String(fallbackValue).trim();
  return pickBestMatchText(primaryValue, fallbackValue, ['loading...', 'scheduled event', 'regular season', 'preseason', 'postseason']);
}

function needsMatchFeedHydration(data = {}) {
  if (!data?.homeTeam || !data?.awayTeam) return true;
  if (isPlaceholderTeam(data.homeTeam) || isPlaceholderTeam(data.awayTeam)) return true;
  if (!hasUsefulMatchText(data.league, ['sports event', 'upcoming event'])) return true;
  if (!isUsefulMatchDateValue(data.date)) return true;
  if (!hasUsefulMatchText(data.time, ['00:00'])) return true;
  if (data.status === 'upcoming' && !hasUsefulMatchText(data.venue, ['tbd', 'tbd stadium', 'details unavailable'])) return true;
  const hasStats = Array.isArray(data.stats) && data.stats.length > 0;
  const hasTimeline = Array.isArray(data.timeline) && data.timeline.length > 0;
  const hasLineups = (Array.isArray(data.homeTeam?.lineup) && data.homeTeam.lineup.length > 0)
    || (Array.isArray(data.awayTeam?.lineup) && data.awayTeam.lineup.length > 0);
  if ((data.status === 'live' || data.status === 'finished') && (!hasStats || !hasTimeline || !hasLineups)) return true;
  if (data.status === 'upcoming' && (!Array.isArray(data.h2h) || !data.h2h.length)) return true;
  return false;
}

function mergeMatchDetailPayload(primary = {}, fallback = {}) {
  const primaryHome = primary.homeTeam || {};
  const primaryAway = primary.awayTeam || {};
  const fallbackHome = fallback.homeTeam || {};
  const fallbackAway = fallback.awayTeam || {};

  const useFallbackHomeIdentity = isPlaceholderTeam(primaryHome) && !isPlaceholderTeam(fallbackHome);
  const useFallbackAwayIdentity = isPlaceholderTeam(primaryAway) && !isPlaceholderTeam(fallbackAway);

  return sanitizePayloadText({
    ...fallback,
    ...primary,
    sport: normalizeSportSlug(primary.sport || fallback.sport || '', primary.leagueSlug || fallback.leagueSlug || ''),
    leagueSlug: normalizeLeagueSlug(primary.leagueSlug || fallback.leagueSlug || ''),
    league: pickBestMatchText(primary.league, fallback.league, ['sports event', 'upcoming event']),
    status: primary.status || fallback.status || 'upcoming',
    statusText: pickBestMatchText(primary.statusText, fallback.statusText),
    time: pickBestMatchText(primary.time, fallback.time, ['00:00']),
    date: pickBestMatchDate(primary.date, fallback.date),
    venue: pickBestMatchText(primary.venue, fallback.venue, ['tbd', 'tbd stadium']),
    broadcast: pickBestMatchText(primary.broadcast, fallback.broadcast),
    commentary: Array.isArray(primary.commentary) && primary.commentary.length ? primary.commentary : (fallback.commentary || []),
    stats: Array.isArray(primary.stats) && primary.stats.length ? primary.stats : (fallback.stats || []),
    timeline: Array.isArray(primary.timeline) && primary.timeline.length ? primary.timeline : (fallback.timeline || []),
    h2h: Array.isArray(primary.h2h) && primary.h2h.length ? primary.h2h : (fallback.h2h || []),
    odds: primary.odds || fallback.odds || null,
    situation: primary.situation || fallback.situation || null,
    homeTeam: {
      ...fallbackHome,
      ...primaryHome,
      name: useFallbackHomeIdentity ? (fallbackHome.name || primaryHome.name || 'Home Team') : (primaryHome.name || fallbackHome.name || 'Home Team'),
      fullName: useFallbackHomeIdentity ? (fallbackHome.fullName || primaryHome.fullName || fallbackHome.name || primaryHome.name || 'Home Team') : (primaryHome.fullName || fallbackHome.fullName || primaryHome.name || fallbackHome.name || 'Home Team'),
      logo: primaryHome.logo || fallbackHome.logo || FALLBACK_LOGO,
      score: primaryHome.score ?? fallbackHome.score ?? '0',
      lineup: Array.isArray(primaryHome.lineup) && primaryHome.lineup.length ? primaryHome.lineup : (fallbackHome.lineup || [])
    },
    awayTeam: {
      ...fallbackAway,
      ...primaryAway,
      name: useFallbackAwayIdentity ? (fallbackAway.name || primaryAway.name || 'Away Team') : (primaryAway.name || fallbackAway.name || 'Away Team'),
      fullName: useFallbackAwayIdentity ? (fallbackAway.fullName || primaryAway.fullName || fallbackAway.name || primaryAway.name || 'Away Team') : (primaryAway.fullName || fallbackAway.fullName || primaryAway.name || fallbackAway.name || 'Away Team'),
      logo: primaryAway.logo || fallbackAway.logo || FALLBACK_LOGO,
      score: primaryAway.score ?? fallbackAway.score ?? '0',
      lineup: Array.isArray(primaryAway.lineup) && primaryAway.lineup.length ? primaryAway.lineup : (fallbackAway.lineup || [])
    }
  });
}

async function resolveMatchDetailFromFeeds(id, sport = 'all', league = '') {
  const cachedMatch = findCachedMatch(id);
  if (cachedMatch) {
    return normalizeMatchDetailFallback(cachedMatch, getCachedMatches());
  }

  const candidates = [];
  const seen = new Set();
  const pushCandidate = (path, params = {}) => {
    const key = `${path}:${JSON.stringify(params)}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ path, params });
  };

  pushCandidate(API_RESULTS, { sport, league, days: 7 });
  pushCandidate(API_RESULTS, { sport, days: 7 });
  pushCandidate(API_LIVE, { sport, league });
  pushCandidate(API_LIVE, { sport });
  pushCandidate(API_UPCOMING, { sport, league, days: 7 });
  pushCandidate(API_UPCOMING, { sport, days: 7 });
  pushCandidate(API_RESULTS, { sport: 'all', days: 7 });
  pushCandidate(API_LIVE, { sport: 'all' });
  pushCandidate(API_UPCOMING, { sport: 'all', days: 7 });

  for (const candidate of candidates) {
    try {
      const response = await fetch(buildApiUrl(candidate.path, candidate.params), { cache: 'no-store' });
      if (!response.ok) continue;
      const payload = await response.json();
      const matches = filterRenderableMatches(payload.matches || []);
      const match = matches.find((entry) => String(entry.id) === String(id));
      if (match) {
        let referenceMatches = matches;
        if (match.status === 'upcoming' || !(referenceMatches || []).some((entry) => entry.status === 'finished')) {
          try {
            const finishedFeed = await fetchFinishedResultsFeed({
              sport: normalizeSportSlug(match.sport || sport, match.leagueSlug || league),
              league: normalizeLeagueSlug(match.leagueSlug || league || ''),
              days: 14
            });
            referenceMatches = [...matches, ...(finishedFeed.matches || [])];
          } catch (error) {
            referenceMatches = matches;
          }
        }
        return normalizeMatchDetailFallback(match, referenceMatches);
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

async function fetchMatchPayload(id, sport = 'soccer', league = 'eng.1') {
  const url = `${API_MATCH}?id=${encodeURIComponent(id)}&sport=${encodeURIComponent(sport)}&league=${encodeURIComponent(league)}`;
  let response = null;
  let data = null;
  let apiData = null;

  try {
    response = await fetch(url, { cache: 'no-store' });
    if (response.ok) {
      data = await response.json();
      if (data && !data.notFound && data.homeTeam && data.awayTeam) {
        apiData = data;
        if (!needsMatchFeedHydration(apiData)) {
          return { data: sanitizePayloadText(apiData), source: 'api', status: response.status };
        }
      }
    }
  } catch (error) {
    response = null;
  }

  const fallback = await resolveMatchDetailFromFeeds(id, sport, league)
    || await resolveMatchDetailFromFeeds(id, 'all', '');
  if (fallback && apiData) {
    return {
      data: sanitizePayloadText(mergeMatchDetailPayload(apiData, fallback)),
      source: 'api+feed-fallback',
      status: response?.status || 200
    };
  }
  if (fallback) {
    return { data: sanitizePayloadText(fallback), source: 'feed-fallback', status: response?.status || 200 };
  }
  if (apiData) {
    return { data: sanitizePayloadText(apiData), source: 'api-partial', status: response?.status || 200 };
  }

  return {
    data: null,
    source: 'none',
    status: response?.status || 0,
    notFound: Boolean(data?.notFound || response?.status === 404)
  };
}

function showRuntimeToast(message, tone = 'success') {
  const existing = document.querySelector('.lsf-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'lsf-toast';
  toast.dataset.tone = tone;
  toast.innerHTML = `<span class="material-symbols-outlined text-sm">${tone === 'error' ? 'error' : 'check_circle'}</span><span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 220ms ease';
    setTimeout(() => toast.remove(), 240);
  }, 2600);
}

function getPageKeyFromPath(pathname = window.location.pathname) {
  if (/^\/match(?:\/|$)/.test(pathname)) return 'match';
  if (/^\/upcoming-match(?:\/|$)/.test(pathname)) return 'upcoming_match_detail';
  const file = (pathname.split('/').pop() || 'index.html').replace('.html', '');
  return file || 'index';
}

function scheduleNonCritical(callback, timeout = 1200) {
  if (typeof callback !== 'function') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback(), { timeout });
    return;
  }
  window.setTimeout(callback, Math.min(timeout, 350));
}

function ensureFeedRibbon() {
  const ribbon = document.getElementById('lsf-feed-ribbon');
  if (ribbon) {
    ribbon.remove();
  }
  return null;
}

function updateFeedRibbon() {
  ensureFeedRibbon();
}

function getArticleImageUrl(article = {}) {
  const url = article.image || article.images?.[0]?.url || article.images?.[0]?.href || FALLBACK_HERO_IMAGE;
  return getSafeImageUrl(url, FALLBACK_HERO_IMAGE);
}

function getArticleLinkUrl(article = {}) {
  if (article?.slug) return buildBlogArticleUrl(article);
  return article.url || article.links?.web?.href || article.links?.api?.news?.href || '#';
}

function getArticleLinkTarget(article = {}) {
  return article?.slug ? '_self' : '_blank';
}

function dedupeMatchesById(matches = []) {
  const uniqueMatches = new Map();
  matches.forEach((match) => {
    if (!match?.id) return;
    const key = String(match.id);
    if (!uniqueMatches.has(key)) {
      uniqueMatches.set(key, match);
    }
  });
  return Array.from(uniqueMatches.values());
}

function getMatchDateValue(match = {}) {
  const parsed = new Date(match?.date || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getMatchStatusPriority(match = {}) {
  if (match?.status === 'live') return 0;
  if (match?.status === 'upcoming') return 1;
  if (match?.status === 'finished') return 2;
  return 3;
}

function combineMatchPools(...lists) {
  const uniqueMatches = dedupeMatchesById(
    lists.flat().filter((match) => match?.id && match?.homeTeam && match?.awayTeam)
  );

  return uniqueMatches.sort((left, right) => {
    const priorityDiff = getMatchStatusPriority(left) - getMatchStatusPriority(right);
    if (priorityDiff !== 0) return priorityDiff;
    if (left.status === 'finished' && right.status === 'finished') {
      return getMatchDateValue(right) - getMatchDateValue(left);
    }
    return getMatchDateValue(left) - getMatchDateValue(right);
  });
}

function getHeroSlideKey(entry = {}) {
  if (entry.kind === 'news') {
    return `news:${entry.article?.headline || entry.article?.url || 'headline'}`;
  }
  const match = entry.kind === 'match' ? entry.match : entry;
  return `match:${match?.id || ''}`;
}

function getHeroAccentColor(team = {}, fallback = 'rgba(204, 22, 22, 0.35)') {
  const rawColor = String(team?.color || '').trim();
  if (/^[0-9a-f]{3}$/i.test(rawColor) || /^[0-9a-f]{6}$/i.test(rawColor)) {
    return `#${rawColor}`;
  }
  return fallback;
}

function buildMatchBackdropStyle(match = {}) {
  const homeLogo = getSafeImageUrl(match?.homeTeam?.logo, FALLBACK_LOGO);
  const awayLogo = getSafeImageUrl(match?.awayTeam?.logo, FALLBACK_LOGO);
  const homeColor = getHeroAccentColor(match?.homeTeam, 'rgba(32, 64, 122, 0.35)');
  const awayColor = getHeroAccentColor(match?.awayTeam, 'rgba(18, 32, 54, 0.24)');
  return `
    background-image:
      linear-gradient(180deg, rgba(8,10,15,0.16) 0%, rgba(8,10,15,0.86) 88%),
      linear-gradient(90deg, rgba(10,13,21,0.92) 0%, rgba(10,13,21,0.52) 45%, rgba(10,13,21,0.78) 100%),
      radial-gradient(circle at 24% 36%, ${homeColor} 0%, transparent 32%),
      radial-gradient(circle at 78% 34%, ${awayColor} 0%, transparent 30%),
      url('${awayLogo}'),
      url('${homeLogo}');
    background-position:
      center,
      center,
      center,
      center,
      110% center,
      -10% center;
    background-size:
      cover,
      cover,
      cover,
      cover,
      42% auto,
      42% auto;
    background-repeat:
      no-repeat,
      no-repeat,
      no-repeat,
      no-repeat,
      no-repeat,
      no-repeat;
  `.replace(/\s+/g, ' ').trim();
}

function buildNewsBackdropStyle(article = {}) {
  const articleImage = getArticleImageUrl(article);
  return `
    background-image:
      linear-gradient(180deg, rgba(8,10,15,0.24) 0%, rgba(8,10,15,0.88) 88%),
      linear-gradient(90deg, rgba(10,13,21,0.92) 0%, rgba(10,13,21,0.36) 45%, rgba(10,13,21,0.82) 100%),
      url('${articleImage}');
    background-position: center, center, center;
    background-size: cover, cover, cover;
    background-repeat: no-repeat, no-repeat, no-repeat;
  `.replace(/\s+/g, ' ').trim();
}

function getHeroScoreText(match = {}) {
  const homeScore = match?.homeTeam?.score ?? '0';
  const awayScore = match?.awayTeam?.score ?? '0';
  if (match?.status === 'upcoming') return '0-0';
  return `${homeScore}-${awayScore}`;
}

function getHeroTeamLabel(team = {}) {
  return team?.abbreviation || team?.shortName || team?.name?.slice(0, 3) || 'TEAM';
}

function formatHeroClock(match = {}) {
  if (match?.status === 'live') return match?.time || 'LIVE';
  if (match?.status === 'finished') return match?.time || match?.statusText || 'FINAL';
  if (!match?.date) return match?.time || 'SCHEDULED';
  const parsedDate = new Date(match.date);
  if (Number.isNaN(parsedDate.getTime())) return match?.time || 'SCHEDULED';
  return parsedDate.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }).toUpperCase();
}

function getHeroPagerLabel(entry = {}, index = 0) {
  if (entry?.pagerLabel) return entry.pagerLabel;
  if (entry.kind === 'news') return 'Latest News';
  const match = entry.kind === 'match' ? entry.match : entry;
  if (match?.status === 'live') return index === 0 ? 'Live Now' : 'Hot Match';
  if (match?.status === 'upcoming') return index === 0 ? 'Countdown' : 'Next Up';
  if (match?.status === 'finished') return 'Finals';
  return 'Spotlight';
}

function buildHeroMatchPool({
  liveMatches = [],
  upcomingMatches = [],
  finishedMatches = [],
  statusFilter = null,
  limit = 5,
  isHomePage = false
} = {}) {
  const livePool = sortMatchesForDisplay(liveMatches.filter((match) => match.status === 'live'), 'live');
  const upcomingPool = sortMatchesForDisplay(upcomingMatches.filter((match) => match.status === 'upcoming'), 'upcoming');
  const finishedPool = sortMatchesForDisplay(finishedMatches.filter((match) => match.status === 'finished'), 'finished');

  if (statusFilter === 'upcoming') {
    return combineMatchPools(upcomingPool, livePool.slice(0, 1), finishedPool.slice(0, 1)).slice(0, limit);
  }
  if (statusFilter === 'finished') {
    return combineMatchPools(finishedPool, livePool.slice(0, 1), upcomingPool.slice(0, 1)).slice(0, limit);
  }
  if (statusFilter === 'live') {
    return combineMatchPools(livePool, upcomingPool.slice(0, 2), finishedPool.slice(0, 1)).slice(0, limit);
  }

  const homeMix = isHomePage
    ? [
        ...livePool.slice(0, 2),
        ...upcomingPool.slice(0, 2),
        ...finishedPool.slice(0, 1)
      ]
    : [
        ...livePool.slice(0, 3),
        ...upcomingPool.slice(0, 2),
        ...finishedPool.slice(0, 2)
      ];

  return combineMatchPools(homeMix).slice(0, limit);
}

function buildHomeHeroSlides(liveMatches = [], upcomingMatches = [], finishedMatches = [], newsList = []) {
  const slides = [];
  const seen = new Set();
  const pushMatchSlide = (match, pagerLabel) => {
    if (!match?.id || seen.has(String(match.id))) return;
    seen.add(String(match.id));
    slides.push({ kind: 'match', match, pagerLabel });
  };

  pushMatchSlide(liveMatches[0], 'Live Now');
  pushMatchSlide(upcomingMatches[0], 'Countdown');
  pushMatchSlide(finishedMatches[0], 'Finals');
  pushMatchSlide(combineMatchPools(liveMatches, upcomingMatches, finishedMatches)[1], 'Spotlight');

  const article = newsList[0];
  if (article?.headline) {
    slides.push({ kind: 'news', article, pagerLabel: 'News Blog' });
  }

  return slides.slice(0, 5);
}

async function fetchCompositeMatchFeeds(options = {}) {
  const sport = normalizeSportSlug(options.sport ?? currentTab ?? 'all', options.league ?? currentLeagueFilter ?? '');
  const league = normalizeLeagueSlug(options.league ?? currentLeagueFilter ?? '');
  const upcomingDays = options.upcomingDays ?? 4;
  const resultsDays = options.resultsDays ?? 4;
  const includeNews = Boolean(options.includeNews);

  const [liveResult, upcomingResult, resultsResult, newsResult] = await Promise.allSettled([
    fetch(buildApiUrl(API_LIVE, { sport, league: league || undefined }), { cache: 'no-store' }),
    fetch(buildApiUrl(API_UPCOMING, { sport, league: league || undefined, days: upcomingDays }), { cache: 'no-store' }),
    fetchFinishedResultsFeed({ sport, league, days: resultsDays }),
    includeNews
      ? fetch(buildApiUrl(API_BLOG, { sport, league: league || undefined, limit: 10 }), { cache: 'no-store' })
      : Promise.resolve(null)
  ]);

  let liveMatches = [];
  let upcomingMatches = [];
  let finishedMatches = [];
  let newsList = [];
  const meta = {};

  if (liveResult.status === 'fulfilled' && liveResult.value?.ok) {
    const payload = await liveResult.value.json();
    meta.live = payload.meta || {};
    liveMatches = filterRenderableMatches(payload.matches || []).filter((match) => match.status === 'live');
  }

  if (upcomingResult.status === 'fulfilled' && upcomingResult.value?.ok) {
    const payload = await upcomingResult.value.json();
    meta.upcoming = payload.meta || {};
    upcomingMatches = filterRenderableMatches(payload.matches || []).filter((match) => match.status === 'upcoming');
  }

  if (resultsResult.status === 'fulfilled') {
    meta.results = resultsResult.value?.meta || {};
    finishedMatches = filterRenderableMatches(resultsResult.value?.matches || []).filter((match) => match.status === 'finished');
  }

  if (includeNews && newsResult.status === 'fulfilled' && newsResult.value?.ok) {
    const payload = await newsResult.value.json();
    newsList = payload.posts || payload.trending || [];
  }

  const mixedMatches = combineMatchPools(liveMatches, upcomingMatches, finishedMatches);

  window._cachedLiveMatches = liveMatches;
  window._cachedUpcoming = upcomingMatches;
  window._cachedUpcomingMatches = upcomingMatches;
  window._cachedResults = finishedMatches;
  if (includeNews) window._cachedNews = newsList;

  return {
    liveMatches,
    upcomingMatches,
    finishedMatches,
    mixedMatches,
    newsList,
    meta
  };
}

function sortMatchesForDisplay(matches = [], statusFilter = null) {
  const list = [...matches];
  if (statusFilter === 'finished') {
    return list.sort((left, right) => new Date(right.date) - new Date(left.date));
  }
  return list.sort((left, right) => new Date(left.date) - new Date(right.date));
}

async function fetchFinishedResultsFeed(options = {}) {
  const sport = normalizeSportSlug(options.sport ?? currentTab ?? 'all', options.league ?? currentLeagueFilter ?? '');
  const league = normalizeLeagueSlug(options.league ?? currentLeagueFilter ?? '');
  const days = Math.max(1, Math.min(parseInt(options.days || '4', 10) || 4, 7));
  const candidates = [];
  const seen = new Set();
  const pushCandidate = (path, params = {}) => {
    const key = `${path}:${JSON.stringify(params)}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ path, params });
  };

  pushCandidate(API_RESULTS, { sport, league: league || undefined, days });
  if (sport !== 'all' && !league) {
    pushCandidate(API_RESULTS, { sport: 'all', days });
  }
  pushCandidate(API_LIVE, { sport, league: league || undefined });
  if (sport !== 'all' && !league) {
    pushCandidate(API_LIVE, { sport: 'all' });
  }

  for (const candidate of candidates) {
    try {
      const response = await fetch(buildApiUrl(candidate.path, candidate.params), { cache: 'no-store' });
      if (!response.ok) continue;
      const payload = await response.json();
      const finished = sortMatchesForDisplay(
        filterRenderableMatches(payload.matches || []).filter((match) => match.status === 'finished'),
        'finished'
      );
      if (finished.length) {
        return {
          matches: finished,
          meta: payload.meta || {}
        };
      }
    } catch (error) {
      continue;
    }
  }

  return {
    matches: sortMatchesForDisplay(
      filterRenderableMatches(getCachedMatches()).filter((match) => match.status === 'finished'),
      'finished'
    ),
    meta: {}
  };
}

function applyFallbackImage(srcValue) {
  if (!srcValue) return FALLBACK_LOGO;
  if (String(srcValue).includes('/public/logo.png')) return FALLBACK_LOGO;
  if (String(srcValue).includes('/public/hero-fallback.jpg')) return FALLBACK_HERO_IMAGE;
  return srcValue;
}

function patchLegacyImages(root = document) {
  root.querySelectorAll('img').forEach((img) => {
    img.src = applyFallbackImage(img.getAttribute('src') || img.src);
  });
}

function ensureHeadEnhancements() {
  if (!document.head.querySelector('base[href="/"]')) {
    const base = document.createElement('base');
    base.href = '/';
    document.head.prepend(base);
  }

  [
    ['preconnect', 'https://fonts.googleapis.com', false],
    ['preconnect', 'https://fonts.gstatic.com', true],
    ['dns-prefetch', 'https://fonts.googleapis.com', false],
    ['dns-prefetch', 'https://fonts.gstatic.com', false],
    ['dns-prefetch', 'https://pl28913139.profitablecpmratenetwork.com', false]
  ].forEach(([rel, href, crossOrigin]) => {
    if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (crossOrigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  if (!document.querySelector('link[href="/css/runtime-enhancements.css"]')) {
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/css/runtime-enhancements.css';
    document.head.appendChild(styleLink);
  }

  if (!document.querySelector(`link[href="${SITE_REDESIGN_STYLESHEET}"]`)) {
    const redesignLink = document.createElement('link');
    redesignLink.rel = 'stylesheet';
    redesignLink.href = SITE_REDESIGN_STYLESHEET;
    document.head.appendChild(redesignLink);
  }

  if (!document.querySelector(`link[href="${PWA_MANIFEST}"]`)) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = PWA_MANIFEST;
    document.head.appendChild(manifestLink);
  }

  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#0e0e0e';
    document.head.appendChild(meta);
  }

  if (!document.querySelector('meta[name="robots"]')) {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
    document.head.appendChild(meta);
  }
}

function hydrateNavigationLinks() {
  const cleanHrefMap = {
    'index.html': '/',
    '/index.html': '/',
    'live.html': '/live',
    '/live.html': '/live',
    'upcoming.html': '/upcoming',
    '/upcoming.html': '/upcoming',
    'results.html': '/results',
    '/results.html': '/results',
    'news.html': '/news',
    '/news.html': '/news',
    'trending.html': '/trending',
    '/trending.html': '/trending',
    'leagues.html': '/leagues',
    '/leagues.html': '/leagues',
    'teams.html': '/teams',
    '/teams.html': '/teams',
    'players.html': '/players',
    '/players.html': '/players',
    'standings.html': '/standings',
    '/standings.html': '/standings',
    'ipl.html': '/ipl',
    '/ipl.html': '/ipl',
    'sport.html': '/sport',
    '/sport.html': '/sport',
    'team.html': '/team',
    '/team.html': '/team',
    'player.html': '/player',
    '/player.html': '/player',
    'info.html': '/info',
    '/info.html': '/info',
    'blog_hub.html': '/blog_hub',
    '/blog_hub.html': '/blog_hub',
    'blog_article.html': '/blog_article',
    '/blog_article.html': '/blog_article'
  };

  document.querySelectorAll('a').forEach((link) => {
    const href = (link.getAttribute('href') || '').trim();
    if (cleanHrefMap[href]) {
      link.setAttribute('href', cleanHrefMap[href]);
    }

    const text = (link.textContent || '').trim().toLowerCase();
    if (!text) return;

    if (text.includes('all leagues') || text.includes('top league')) link.setAttribute('href', '/leagues');
    if (text.includes('standings')) link.setAttribute('href', '/standings');
    if (text.includes('teams hub')) link.setAttribute('href', '/teams');
    if (text.includes('team profile')) link.setAttribute('href', '/team');
    if (text.includes('player profile')) link.setAttribute('href', '/player');
    if (text === 'results') link.setAttribute('href', '/results');
  });
}

function registerGlobalImageFallbacks() {
  document.addEventListener(
    'error',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      const nextSrc = applyFallbackImage(target.getAttribute('src') || target.src);
      if (target.src !== nextSrc) {
        target.src = nextSrc;
        return;
      }
      if (target.src !== new URL(FALLBACK_LOGO, window.location.origin).toString()) {
        target.src = FALLBACK_LOGO;
      }
    },
    true
  );
}

registerGlobalImageFallbacks();

function appendHeaderActions() {
  const header = document.getElementById('main-header');
  if (!header) return;

  let notifyButton = Array.from(header.querySelectorAll('button')).find((button) =>
    (button.textContent || '').toLowerCase().includes('notifications')
  );

  if (!notifyButton) {
    const searchButton = Array.from(header.querySelectorAll('button')).find((button) =>
      (button.getAttribute('onclick') || '').includes('openSearchModal')
    );

    if (searchButton?.parentElement) {
      notifyButton = document.createElement('button');
      notifyButton.className = searchButton.className;
      searchButton.insertAdjacentElement('afterend', notifyButton);
    }
  }

  if (!notifyButton) return;

  notifyButton.id = 'lsf-notify-toggle';
  notifyButton.type = 'button';
  notifyButton.classList.add('lsf-header-icon-button');
  notifyButton.innerHTML = `
    <span class="material-symbols-outlined lsf-notify-icon">notifications</span>
    <span class="lsf-notify-dot" aria-hidden="true"></span>
    <span class="lsf-notify-badge" hidden>0</span>
  `;
  notifyButton.setAttribute('aria-label', 'Open alerts');
  notifyButton.setAttribute('title', 'Open alerts');
}

function prepareHeaderShell() {
  const header = document.getElementById('main-header');
  if (!header) return;

  const actionShell = header.querySelector(':scope > div > div:last-child');
  if (actionShell) actionShell.id = 'lsf-header-actions';

  const searchButton = Array.from(header.querySelectorAll('button')).find((button) =>
    (button.getAttribute('onclick') || '').includes('openSearchModal')
  );
  if (searchButton) searchButton.id = 'lsf-search-trigger';

  const liveText = document.getElementById('live-count-text');
  const liveIndicator = liveText?.parentElement;
  if (liveIndicator) {
    liveIndicator.id = 'lsf-live-indicator';
    const icon = liveIndicator.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = 'broadcast_on_personal';
  }
}

const MOBILE_PRIMARY_NAV = {
  index: { icon: 'home', label: 'Home' },
  live: { icon: 'flag', label: 'Live Score' },
  upcoming: { icon: 'calendar_month', label: 'Upcoming' },
  results: { icon: 'history', label: 'Results' }
};

function resolveNavPageKey(href = '') {
  if (!href) return 'index';
  try {
    const url = new URL(href, window.location.origin);
    if (url.pathname === '/' || url.pathname === '/index.html') return 'index';
    return getPageKeyFromPath(url.pathname);
  } catch (error) {
    const normalized = href.replace(window.location.origin, '');
    if (normalized === '/' || normalized === '/index.html' || normalized === 'index.html') return 'index';
    return getPageKeyFromPath(normalized.startsWith('/') ? normalized : `/${normalized}`);
  }
}

function createMobileTopNavLink(sourceLink, extraClass = '', { menu = false } = {}) {
  const href = sourceLink.getAttribute('href');
  if (!href) return null;
  const pageKey = resolveNavPageKey(href);
  const meta = MOBILE_PRIMARY_NAV[pageKey] || {
    icon: 'link',
    label: (sourceLink.textContent || '').trim()
  };

  const link = document.createElement('a');
  link.href = href;
  if (menu) {
    link.textContent = meta.label;
    link.className = `lsf-mobile-more-link ${extraClass}`.trim();
  } else {
    link.innerHTML = `
      <span class="material-symbols-outlined lsf-mobile-nav-icon">${meta.icon}</span>
      <span class="lsf-mobile-nav-label">${meta.label}</span>
    `;
    link.className = `lsf-mobile-top-nav-link ${extraClass}`.trim();
  }
  link.dataset.pageLink = 'true';
  link.dataset.pageKey = pageKey;
  link.setAttribute('aria-label', meta.label);
  return link;
}

function ensureMobileTopNav() {
  const header = document.getElementById('main-header');
  const desktopNav = document.getElementById('top-nav-links');
  if (!header || !desktopNav || document.getElementById('lsf-mobile-top-nav')) return;

  const mobileNav = document.createElement('nav');
  mobileNav.id = 'lsf-mobile-top-nav';
  mobileNav.className = 'lsf-mobile-top-nav lg:hidden';

  const rail = document.createElement('div');
  rail.className = 'lsf-mobile-top-nav-scroll';

  const desktopPrimaryLinks = new Map(
    Array.from(desktopNav.querySelectorAll(':scope > a[href]'))
      .map((link) => [resolveNavPageKey(link.getAttribute('href') || ''), link])
  );

  ['index', 'live', 'upcoming', 'results'].forEach((pageKey) => {
    const sourceLink = desktopPrimaryLinks.get(pageKey);
    if (!sourceLink) return;
    const link = createMobileTopNavLink(sourceLink);
    if (link) rail.append(link);
  });

  const moreGroup = desktopNav.querySelector('.group');
  const moreLinks = moreGroup ? Array.from(moreGroup.querySelectorAll('a[href]')) : [];
  if (moreLinks.length) {
    const moreShell = document.createElement('div');
    moreShell.className = 'lsf-mobile-more';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'lsf-mobile-top-nav-trigger';
    trigger.dataset.navMoreTrigger = 'true';
    trigger.innerHTML = `
      <span class="material-symbols-outlined lsf-mobile-nav-icon">more_horiz</span>
      <span class="lsf-mobile-nav-label">More</span>
    `;
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Open more menu');

    const menu = document.createElement('div');
    menu.className = 'lsf-mobile-more-menu';

    moreLinks.forEach((item) => {
      const link = createMobileTopNavLink(item, '', { menu: true });
      if (link) menu.append(link);
    });

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const nextState = !moreShell.classList.contains('is-open');
      moreShell.classList.toggle('is-open', nextState);
      trigger.setAttribute('aria-expanded', nextState ? 'true' : 'false');
    });

    document.addEventListener('click', (event) => {
      if (!moreShell.contains(event.target)) {
        moreShell.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    moreShell.append(trigger, menu);
    rail.append(moreShell);
  }

  if (!rail.children.length) return;

  mobileNav.append(rail);
  document.body.append(mobileNav);
  document.body.classList.add('lsf-mobile-nav-ready');
}

function isCompactMobileShell() {
  return window.matchMedia('(max-width: 1023px)').matches;
}

// Pretext-inspired canvas fitting: prepare text metrics once, then relayout on resize/update.
const PRETEXT_BASE_FONT_SIZE = 100;
const pretextPreparedCache = new Map();
const pretextMeasureCache = new Map();
let pretextCanvasContext = null;
let pretextLayoutFrame = 0;

function getPretextCanvasContext() {
  if (!pretextCanvasContext) {
    const canvas = document.createElement('canvas');
    pretextCanvasContext = canvas.getContext('2d');
  }
  return pretextCanvasContext;
}

function buildPretextFont(style, sizePx) {
  const fontStyle = style.fontStyle && style.fontStyle !== 'normal' ? `${style.fontStyle} ` : '';
  const fontWeight = style.fontWeight || '700';
  const fontFamily = style.fontFamily || 'Lexend, sans-serif';
  return `${fontStyle}${fontWeight} ${sizePx}px ${fontFamily}`;
}

function measurePretextText(text, font) {
  const cacheKey = `${font}::${text}`;
  if (pretextMeasureCache.has(cacheKey)) return pretextMeasureCache.get(cacheKey);
  const context = getPretextCanvasContext();
  if (!context) return text.length * PRETEXT_BASE_FONT_SIZE * 0.5;
  context.font = font;
  const width = context.measureText(text).width;
  pretextMeasureCache.set(cacheKey, width);
  return width;
}

function splitPretextTokens(text = '') {
  return String(text)
    .replace(/\r/g, '')
    .split(/(\n|\s+)/)
    .filter((token) => token.length);
}

function preparePretextText(text, style) {
  const normalizedText = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalizedText) return null;

  const font = buildPretextFont(style, PRETEXT_BASE_FONT_SIZE);
  const cacheKey = `${font}::${normalizedText}`;
  if (pretextPreparedCache.has(cacheKey)) return pretextPreparedCache.get(cacheKey);

  const prepared = {
    text: normalizedText,
    baseFontSize: PRETEXT_BASE_FONT_SIZE,
    font,
    totalWidth: measurePretextText(normalizedText, font),
    tokens: splitPretextTokens(normalizedText).map((token) => ({
      text: token,
      isSpace: /^\s+$/.test(token),
      isBreak: token === '\n',
      width: measurePretextText(token, font)
    }))
  };

  pretextPreparedCache.set(cacheKey, prepared);
  return prepared;
}

function layoutPretext(prepared, options) {
  if (!prepared) return { fits: true, size: 0, width: 0, lines: 0, height: 0 };

  const {
    fontSize,
    maxWidth,
    maxHeight = 0,
    maxLines = 1,
    mode = 'single',
    lineHeight = 1.05
  } = options;

  const scale = fontSize / prepared.baseFontSize;
  if (mode === 'single') {
    const width = prepared.totalWidth * scale;
    const height = fontSize * lineHeight;
    return {
      fits: width <= maxWidth + 0.5 && (!maxHeight || height <= maxHeight + 0.5),
      width,
      height,
      lines: 1
    };
  }

  let lineWidth = 0;
  let maxLineWidth = 0;
  let lineCount = 1;

  prepared.tokens.forEach((token) => {
    if (token.isBreak) {
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
      lineWidth = 0;
      lineCount += 1;
      return;
    }

    const tokenWidth = token.width * scale;
    const wouldOverflow = !token.isSpace && lineWidth > 0 && lineWidth + tokenWidth > maxWidth;
    if (wouldOverflow) {
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
      lineWidth = tokenWidth;
      lineCount += 1;
      return;
    }

    lineWidth += tokenWidth;
  });

  maxLineWidth = Math.max(maxLineWidth, lineWidth);
  const height = lineCount * fontSize * lineHeight;
  return {
    fits: maxLineWidth <= maxWidth + 0.5 && lineCount <= maxLines && (!maxHeight || height <= maxHeight + 0.5),
    width: maxLineWidth,
    height,
    lines: lineCount
  };
}

function primePretextTargets(root = document) {
  const targetSets = [
    ['#home-team-name, #away-team-name', { mode: 'single', min: '24' }],
    ['#home-score, #away-score', { mode: 'block', maxLines: '2', min: '22' }],
    ['#match-clock', { mode: 'single', min: '18' }],
    ['#match-time, #match-date', { mode: 'single', min: '18' }],
    ['#stadium-name, #league-name, #broadcast-name', { mode: 'block', maxLines: '2', min: '14' }],
    ['#lineup-home-tab, #lineup-away-tab, #bet-home-team, #bet-away-team', { mode: 'single', min: '10' }],
    ['.lsf-pretext-card-title', { mode: 'block', maxLines: '2', min: '9' }],
    ['.lsf-pretext-card-meta', { mode: 'single', min: '8' }],
    ['[data-hero-headline]', { mode: 'block', maxLines: '3', min: '24' }],
    ['[data-hero-clock]', { mode: 'block', maxLines: '2', min: '18' }]
  ];

  targetSets.forEach(([selector, options]) => {
    root.querySelectorAll(selector).forEach((node) => {
      if (!node.dataset.pretextFit) node.dataset.pretextFit = 'true';
      if (options.mode && !node.dataset.pretextMode) node.dataset.pretextMode = options.mode;
      if (options.maxLines && !node.dataset.pretextMaxLines) node.dataset.pretextMaxLines = options.maxLines;
      if (options.min && !node.dataset.pretextMin) node.dataset.pretextMin = options.min;
    });
  });
}

function fitElementWithPretext(element) {
  if (!(element instanceof HTMLElement)) return;

  const rawText = (element.textContent || '').replace(/\s+/g, ' ').trim();
  if (!rawText) return;

  const style = window.getComputedStyle(element);
  const computedFontSize = Number.parseFloat(style.fontSize) || 16;
  if (!element.dataset.pretextMax) {
    element.dataset.pretextMax = String(computedFontSize);
  }

  const maxSize = Number.parseFloat(element.dataset.pretextMax || '') || computedFontSize;
  const minSize = Number.parseFloat(element.dataset.pretextMin || '') || Math.max(10, maxSize * 0.55);
  const mode = element.dataset.pretextMode || 'single';
  const maxLines = Number.parseInt(element.dataset.pretextMaxLines || (mode === 'single' ? '1' : '2'), 10) || 1;
  const declaredHeight = Number.parseFloat(element.dataset.pretextHeight || '');
  const parentWidth = element.parentElement?.clientWidth || 0;
  const availableWidth = element.clientWidth || parentWidth;
  const availableHeight = Number.isFinite(declaredHeight) ? declaredHeight : 0;
  if (!availableWidth) return;

  const parsedLineHeight = Number.parseFloat(style.lineHeight);
  const lineHeightRatio = Number.isFinite(parsedLineHeight)
    ? parsedLineHeight / computedFontSize
    : 1.02;
  const prepared = preparePretextText(rawText, style);
  if (!prepared) return;

  let low = minSize;
  let high = maxSize;
  let best = minSize;

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const probe = (low + high) / 2;
    const layout = layoutPretext(prepared, {
      fontSize: probe,
      maxWidth: availableWidth,
      maxHeight: availableHeight,
      maxLines,
      mode,
      lineHeight: lineHeightRatio
    });

    if (layout.fits) {
      best = probe;
      low = probe;
    } else {
      high = probe;
    }
  }

  element.style.fontSize = `${best.toFixed(2)}px`;
  element.style.lineHeight = String(lineHeightRatio);
}

function runPretextLayout(root = document) {
  const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
  primePretextTargets(scope);
  scope.querySelectorAll('[data-pretext-fit]').forEach((element) => {
    fitElementWithPretext(element);
  });
}

function schedulePretextLayout(root = document) {
  const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
  cancelAnimationFrame(pretextLayoutFrame);
  pretextLayoutFrame = requestAnimationFrame(() => runPretextLayout(scope));
}

window.addEventListener('resize', () => schedulePretextLayout(document), { passive: true });

function readStoredReminders() {
  try {
    const reminders = JSON.parse(localStorage.getItem(REMINDER_STORAGE_KEY) || '[]');
    return Array.isArray(reminders) ? reminders.filter(Boolean) : [];
  } catch (error) {
    console.error('Reminder read failed:', error);
    return [];
  }
}

function writeStoredReminders(reminders = []) {
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders.slice(-30)));
  } catch (error) {
    console.error('Reminder write failed:', error);
  }
}

function getSavedReminders() {
  const now = Date.now();
  const stored = readStoredReminders();
  const active = stored
    .filter((reminder) => {
      const expiry = Number(reminder.kickoffAt || reminder.notifyAt || 0) + 6 * 60 * 60 * 1000;
      return !expiry || expiry > now;
    })
    .sort((left, right) => (left.notifyAt || left.kickoffAt || 0) - (right.notifyAt || right.kickoffAt || 0));

  if (active.length !== stored.length) {
    writeStoredReminders(active);
  }

  return active;
}

function formatReminderCountdown(reminder) {
  const kickoffAt = Number(reminder?.kickoffAt || 0);
  if (!Number.isFinite(kickoffAt) || kickoffAt <= 0) return 'Reminder queued';

  const diff = kickoffAt - Date.now();
  if (diff <= 0) return 'Starting now';

  const totalMinutes = Math.round(diff / 60000);
  if (totalMinutes < 60) return `Starts in ${totalMinutes}m`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return `Starts in ${hours}h ${String(minutes).padStart(2, '0')}m`;

  const days = Math.floor(hours / 24);
  return `Starts in ${days}d ${hours % 24}h`;
}

function formatReminderSchedule(reminder) {
  const kickoffAt = Number(reminder?.kickoffAt || 0);
  if (!Number.isFinite(kickoffAt) || kickoffAt <= 0) return 'Kickoff time pending';

  return new Date(kickoffAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function appendNotificationPanel() {
  if (document.getElementById('lsf-notify-panel')) return;

  const panel = document.createElement('aside');
  panel.id = 'lsf-notify-panel';
  panel.className = 'lsf-notify-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="lsf-notify-panel-header">
      <div>
        <div class="lsf-notify-panel-eyebrow">Realtime Alerts</div>
        <div class="lsf-notify-panel-title">Notification Centre</div>
      </div>
      <button type="button" class="lsf-panel-close" data-close-notifications aria-label="Close alerts">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div id="lsf-notify-permission" class="lsf-notify-panel-block"></div>
    <div id="lsf-notify-install-slot" class="lsf-notify-panel-block"></div>
    <div class="lsf-notify-panel-block">
      <div class="lsf-notify-panel-label">Saved reminders</div>
      <div id="lsf-notify-reminder-list" class="lsf-notify-reminder-list"></div>
    </div>
  `;
  document.body.appendChild(panel);

  panel.addEventListener('click', async (event) => {
    const closeButton = event.target.closest('[data-close-notifications]');
    if (closeButton) {
      toggleNotificationPanel(false);
      return;
    }

    const enableButton = event.target.closest('[data-enable-notifications]');
    if (enableButton) {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        showRuntimeToast('Browser alerts enabled');
      }
      renderNotificationPanel();
      return;
    }

    const installButton = event.target.closest('[data-prompt-install]');
    if (installButton) {
      await promptInstall();
      return;
    }

    const removeButton = event.target.closest('[data-remove-reminder]');
    if (removeButton) {
      removeSavedReminder(removeButton.dataset.removeReminder);
    }
  });
}

function removeSavedReminder(matchId, silent = false) {
  if (!matchId) return;
  const next = readStoredReminders().filter((reminder) => String(reminder.matchId) !== String(matchId));
  writeStoredReminders(next);
  updateNotificationButton();
  renderNotificationPanel();
  if (!silent) {
    showRuntimeToast('Reminder removed');
  }
}

function renderNotificationPanel() {
  const panel = document.getElementById('lsf-notify-panel');
  if (!panel) return;

  const permission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
  notificationPermissionState = permission;

  const permissionSlot = document.getElementById('lsf-notify-permission');
  const installSlot = document.getElementById('lsf-notify-install-slot');
  const reminderList = document.getElementById('lsf-notify-reminder-list');
  const reminders = getSavedReminders();

  if (permissionSlot) {
    if (permission === 'granted') {
      permissionSlot.innerHTML = `
        <div class="lsf-notify-status is-ready">
          <div>
            <div class="lsf-notify-status-title">Browser alerts enabled</div>
            <div class="lsf-notify-status-copy">Saved match reminders will fire before kickoff on supported browsers.</div>
          </div>
          <span class="material-symbols-outlined">notifications_active</span>
        </div>
      `;
    } else if (permission === 'denied') {
      permissionSlot.innerHTML = `
        <div class="lsf-notify-status is-blocked">
          <div>
            <div class="lsf-notify-status-title">Alerts blocked</div>
            <div class="lsf-notify-status-copy">Allow notifications in browser site settings to restore match reminders.</div>
          </div>
          <span class="material-symbols-outlined">notifications_off</span>
        </div>
      `;
    } else if (permission === 'unsupported') {
      permissionSlot.innerHTML = `
        <div class="lsf-notify-status">
          <div>
            <div class="lsf-notify-status-title">Alerts unsupported</div>
            <div class="lsf-notify-status-copy">This browser does not expose the notification API for reminders.</div>
          </div>
          <span class="material-symbols-outlined">error</span>
        </div>
      `;
    } else {
      permissionSlot.innerHTML = `
        <div class="lsf-notify-status">
          <div>
            <div class="lsf-notify-status-title">Enable alerts</div>
            <div class="lsf-notify-status-copy">Grant browser permission once, then save reminders from any upcoming fixture card.</div>
          </div>
          <button type="button" class="lsf-notify-action" data-enable-notifications>Enable</button>
        </div>
      `;
    }
  }

  if (installSlot) {
    installSlot.innerHTML = deferredInstallPrompt
      ? `
        <div class="lsf-install-panel">
          <div>
            <div class="lsf-notify-panel-label">Install app</div>
            <div class="lsf-notify-status-copy">Keep the score hub on your device with the same realtime alerts and offline shell.</div>
          </div>
          <button type="button" class="lsf-notify-action" data-prompt-install>Download</button>
        </div>
      `
      : '';
  }

  if (reminderList) {
    if (!reminders.length) {
      reminderList.innerHTML = `
        <div class="lsf-notify-empty">
          No reminders saved yet. Use "Set Reminder" on upcoming matches to queue kickoff alerts.
        </div>
      `;
    } else {
      reminderList.innerHTML = reminders
        .map((reminder) => `
          <div class="lsf-reminder-item">
            <a class="lsf-reminder-link" href="${reminder.url || '/upcoming'}">
              <div class="lsf-reminder-title">${reminder.title || 'Match Reminder'}</div>
              <div class="lsf-reminder-copy">${reminder.body || 'Saved match reminder from LivescoreFree.'}</div>
              <div class="lsf-reminder-meta">${formatReminderCountdown(reminder)} | ${formatReminderSchedule(reminder)}</div>
            </a>
            <button
              type="button"
              class="lsf-reminder-remove"
              data-remove-reminder="${reminder.matchId}"
              aria-label="Remove reminder"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        `)
        .join('');
    }
  }

  updateNotificationButton(permission);
}

function toggleNotificationPanel(force) {
  const panel = document.getElementById('lsf-notify-panel');
  if (!panel) return;

  const nextState = typeof force === 'boolean' ? force : !notificationPanelVisible;
  notificationPanelVisible = nextState;

  if (nextState) {
    renderNotificationPanel();
    panel.hidden = false;
    panel.classList.add('is-visible');
  } else {
    panel.classList.remove('is-visible');
    panel.hidden = true;
  }

  const button = document.getElementById('lsf-notify-toggle');
  if (button) {
    button.setAttribute('aria-expanded', String(notificationPanelVisible));
  }
}

function appendInstallBanner() {
  if (document.getElementById('lsf-install-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'lsf-install-banner';
  banner.className = 'lsf-install-banner';
  banner.hidden = true;
  banner.innerHTML = `
    <div>
      <div class="lsf-install-banner-title">Install LivescoreFree</div>
      <div class="lsf-install-banner-copy">Save the realtime score hub to your home screen for app-like navigation, offline access, and faster updates.</div>
    </div>
    <div class="lsf-install-banner-actions">
      <button id="lsf-install-banner-button" class="lsf-pwa-button" type="button">Download</button>
      <button id="lsf-install-banner-close" class="lsf-install-dismiss" type="button" aria-label="Close install prompt">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
  `;
  document.body.appendChild(banner);

  const fab = document.createElement('button');
  fab.id = 'lsf-install-fab';
  fab.className = 'lsf-pwa-fab';
  fab.type = 'button';
  fab.hidden = true;
  fab.textContent = 'Install';
  document.body.appendChild(fab);
}

function scheduleStoredReminder(reminder) {
  if (!reminder?.matchId || !reminder?.notifyAt) return;
  if (reminderTimerHandles.has(reminder.matchId)) {
    clearTimeout(reminderTimerHandles.get(reminder.matchId));
    reminderTimerHandles.delete(reminder.matchId);
  }
  const delay = reminder.notifyAt - Date.now();
  if (delay <= 0 || delay > 86400000) return;

  const timeoutId = window.setTimeout(async () => {
    reminderTimerHandles.delete(reminder.matchId);
    const url = reminder.url || '/upcoming';
    const title = reminder.title || 'Match Reminder';
    try {
      if (navigator.serviceWorker?.ready) {
        const registration = await navigator.serviceWorker.ready;
        if (Notification.permission === 'granted') {
          registration.showNotification(title, {
            body: reminder.body || 'Your saved reminder is ready.',
            icon: FALLBACK_LOGO,
            badge: FALLBACK_LOGO,
            data: { url }
          });
        }
      }
    } catch (error) {
      console.error('Reminder notification failed:', error);
    }
  }, delay);

  reminderTimerHandles.set(reminder.matchId, timeoutId);
}

function bootstrapSavedReminders() {
  try {
    const reminders = getSavedReminders();
    reminders.filter((reminder) => reminder.notifyAt > Date.now()).slice(0, 20).forEach(scheduleStoredReminder);
  } catch (error) {
    console.error('Reminder bootstrap failed:', error);
  }
}

function startReminderHeartbeat() {
  window.setInterval(() => {
    getSavedReminders().slice(0, 20).forEach(scheduleStoredReminder);
    updateNotificationButton();
    if (notificationPanelVisible) {
      renderNotificationPanel();
    }
  }, 30000);
}

function persistReminder(reminder) {
  try {
    const current = readStoredReminders();
    const next = current.filter((entry) => entry.matchId !== reminder.matchId);
    next.push(reminder);
    writeStoredReminders(next);
    updateNotificationButton();
    renderNotificationPanel();
  } catch (error) {
    console.error('Reminder persistence failed:', error);
  }
}

async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') {
    showRuntimeToast('Notifications unsupported', 'error');
    return 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  const permission = await Notification.requestPermission();
  notificationPermissionState = permission;
  updateNotificationButton(permission);
  renderNotificationPanel();
  return permission;
}

function updateNotificationButton(permission = notificationPermissionState) {
  const button = document.getElementById('lsf-notify-toggle');
  if (!button) return;

  const reminders = getSavedReminders();
  const soonCount = reminders.filter((reminder) => {
    const kickoffAt = Number(reminder.kickoffAt || 0);
    return Number.isFinite(kickoffAt) && kickoffAt > Date.now() && kickoffAt - Date.now() <= 30 * 60 * 1000;
  }).length;

  button.dataset.permission = permission;
  button.dataset.reminders = String(reminders.length);
  button.dataset.state = soonCount > 0 ? 'soon' : reminders.length > 0 ? 'scheduled' : 'idle';
  const icon = button.querySelector('.lsf-notify-icon') || button.querySelector('.material-symbols-outlined');
  const dot = button.querySelector('.lsf-notify-dot');
  const badge = button.querySelector('.lsf-notify-badge');

  if (permission === 'granted') {
    button.setAttribute('aria-pressed', 'true');
    if (icon) icon.textContent = 'notifications_active';
  } else if (permission === 'denied') {
    button.setAttribute('aria-pressed', 'false');
    if (icon) icon.textContent = 'notifications_off';
  } else {
    button.setAttribute('aria-pressed', 'false');
    if (icon) icon.textContent = 'notifications';
  }

  if (dot) dot.hidden = soonCount === 0;
  if (badge) {
    const badgeCount = soonCount > 0 ? soonCount : reminders.length;
    badge.hidden = badgeCount === 0;
    badge.textContent = badgeCount > 9 ? '9+' : String(badgeCount);
  }

  const stateTitle = permission === 'granted'
    ? 'Alerts enabled'
    : permission === 'denied'
      ? 'Alerts blocked'
      : permission === 'unsupported'
        ? 'Alerts unsupported'
        : 'Enable alerts';
  const reminderTitle = reminders.length
    ? soonCount > 0
      ? `${soonCount} reminder${soonCount === 1 ? '' : 's'} starting soon`
      : `${reminders.length} saved reminder${reminders.length === 1 ? '' : 's'}`
    : 'No saved reminders';
  button.setAttribute('aria-label', `${stateTitle}. ${reminderTitle}.`);
  button.setAttribute('title', `${stateTitle} | ${reminderTitle}`);
}

function updateInstallUi() {
  const installButton = document.getElementById('lsf-install-button');
  const banner = document.getElementById('lsf-install-banner');
  const bannerButton = document.getElementById('lsf-install-banner-button');
  const fab = document.getElementById('lsf-install-fab');
  const canInstall = Boolean(deferredInstallPrompt);
  const canShowInstall = canInstall && !isCompactMobileShell();
  const bannerDismissed = localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === '1';

  if (installButton) installButton.hidden = !canShowInstall;
  if (banner) banner.hidden = !canShowInstall || bannerDismissed;
  if (bannerButton) bannerButton.hidden = !canShowInstall || bannerDismissed;
  if (fab) fab.hidden = !canShowInstall;

  if (notificationPanelVisible) {
    renderNotificationPanel();
  }
}

function dismissInstallBanner() {
  localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, '1');
  updateInstallUi();
}

async function promptInstall() {
  if (!deferredInstallPrompt) return;
  localStorage.removeItem(INSTALL_BANNER_DISMISSED_KEY);
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice.catch(() => null);
  deferredInstallPrompt = null;
  updateInstallUi();
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  } catch (error) {
    console.error('Service worker registration failed:', error);
  }
}

function setupAppShell() {
  appendHeaderActions();
  prepareHeaderShell();
  appendInstallBanner();
  appendNotificationPanel();
  updateNotificationButton();
  updateInstallUi();

  const installButton = document.getElementById('lsf-install-button');
  const installBannerButton = document.getElementById('lsf-install-banner-button');
  const installBannerClose = document.getElementById('lsf-install-banner-close');
  const installFab = document.getElementById('lsf-install-fab');
  const notifyButton = document.getElementById('lsf-notify-toggle');

  [installButton, installBannerButton, installFab].filter(Boolean).forEach((button) => {
    button.addEventListener('click', promptInstall);
  });

  if (installBannerClose && !installBannerClose.dataset.bound) {
    installBannerClose.dataset.bound = 'true';
    installBannerClose.addEventListener('click', dismissInstallBanner);
  }

  if (notifyButton && !notifyButton.dataset.bound) {
    notifyButton.dataset.bound = 'true';
    notifyButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleNotificationPanel();
    });
  }

  if (!document.body.dataset.lsfPanelBound) {
    document.body.dataset.lsfPanelBound = 'true';
    document.addEventListener('click', (event) => {
      const panel = document.getElementById('lsf-notify-panel');
      const bell = document.getElementById('lsf-notify-toggle');
      if (!notificationPanelVisible || !panel) return;
      if (panel.contains(event.target) || bell?.contains(event.target)) return;
      toggleNotificationPanel(false);
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallUi();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    localStorage.removeItem(INSTALL_BANNER_DISMISSED_KEY);
    updateInstallUi();
    showRuntimeToast('App installed');
  });

  if (!document.body.dataset.lsfInstallResizeBound) {
    document.body.dataset.lsfInstallResizeBound = 'true';
    window.addEventListener('resize', updateInstallUi);
  }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  ensureHeadEnhancements();
  document.body.dataset.lsfPage = getPageKeyFromPath(window.location.pathname);
  hydrateNavigationLinks();
  patchLegacyImages();
  setupAppShell();
  ensureMobileTopNav();
  normalizeLegacyMatchLinks(document);
  observeLegacyMatchLinks();
  updateFeedRibbon();
  schedulePretextLayout(document);
  scheduleNonCritical(() => renderNetworkAdSlots(document), 1400);
  scheduleNonCritical(() => registerServiceWorker(), 2200);
  scheduleNonCritical(() => {
    bootstrapSavedReminders();
    startReminderHeartbeat();
  }, 1800);
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => schedulePretextLayout(document)).catch(() => {});
  }

  // --- HEADER & NAVIGATION LOGIC ---
  const path = window.location.pathname;
  const pageKey = getPageKeyFromPath(path);

  // 1. Highlight Active Sidebar Link (Universal Matcher)
  const sidebarLinks = document.querySelectorAll('aside nav a');
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const cleanHref = href.replace('.html', '').replace('/', '') || 'index';
      const cleanFileName = pageKey || 'index';

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
  const topNavLinks = document.querySelectorAll('#top-nav-links a, #lsf-mobile-top-nav a[data-page-link]');
  topNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const cleanHref = href.replace('.html', '').replace('/', '') || 'index';
      const cleanFileName = pageKey || 'index';

      if (cleanHref === cleanFileName) {
        if (link.classList.contains('lsf-mobile-top-nav-link') || link.classList.contains('lsf-mobile-more-link')) {
          link.classList.add('is-active');
        } else {
          link.classList.remove('text-on-surface/60');
          link.classList.add('text-primary', 'border-b-2', 'border-primary', 'pb-1');
        }
      }
    }
  });

  const mobileMoreTrigger = document.querySelector('#lsf-mobile-top-nav [data-nav-more-trigger]');
  if (mobileMoreTrigger) {
    const hasActiveMoreLink = Array.from(document.querySelectorAll('#lsf-mobile-top-nav .lsf-mobile-more-link')).some((link) =>
      link.classList.contains('is-active')
    );
    if (hasActiveMoreLink) mobileMoreTrigger.classList.add('is-active');
  }

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
  const prettyMatchRoute = parsePrettyMatchRoute(path);
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('id') || prettyMatchRoute?.id;
  const leagueParam = urlParams.get('league') || urlParams.get('l') || prettyMatchRoute?.league || '';
  const sportParam = urlParams.get('sport') || urlParams.get('s') || prettyMatchRoute?.sport || '';
  
  // Explicitly default to 'all' to show all sports by default
  currentTab = normalizeSportSlug(sportParam || 'all', leagueParam);
  currentLeagueFilter = normalizeLeagueSlug(leagueParam || '');
  
  const sport = currentTab;
  const league = currentLeagueFilter || getDefaultLeagueForSport(sport);
  const isUpcomingMatchPage = path.includes('upcoming_match_detail.html') || prettyMatchRoute?.upcoming;

  if (!matchId) {
    syncStaticCanonicalPath(pageKey);
    updateDefaultPageSeo(pageKey);
  }

  if (matchId) {
    const canonicalMatchPath = buildCanonicalMatchPath({
      id: matchId,
      sport,
      league,
      upcoming: Boolean(isUpcomingMatchPage)
    });

    if (window.location.pathname !== canonicalMatchPath && (urlParams.get('id') || path.endsWith('.html'))) {
      window.history.replaceState({}, '', canonicalMatchPath);
    }

    if (isUpcomingMatchPage) {
      fetchUpcomingMatchDetail(matchId, sport, league);
    } else if (homeTeamName) {
      fetchMatchDetail(matchId, sport, league);
      realtime.subscribe('match', { id: matchId, sport, league, isLive: true });
    }
    fetchMatches(null, true);
    return;
  }

  // Empty state for match.html without ?id - show live matches to pick from
  if (pageKey === 'match' && !matchId) {
    const mainContent = document.querySelector('main') || document.querySelector('.flex-1');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="py-20 px-6 max-w-4xl mx-auto text-center">
          <span class="material-symbols-outlined text-6xl text-primary mb-6 block animate-pulse">${sportParams.endIcon}</span>
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
              <a href="${buildMatchUrl(m)}" class="block bg-surface-container p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-all group">
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
  if (isResultsHubPage()) initResultsLeagueFilter();

    // Set page filter based on current file
    if (pageKey === 'upcoming') {
        currentPageFilter = 'upcoming';
        currentArenaTab = currentTab;
    } else if (isResultsHubPage()) {
        currentPageFilter = 'finished';
    } else if (pageKey === 'trending') {
        currentPageFilter = null;
    } else {
        currentPageFilter = 'live';
    }

    // --- INITIAL FETCHES ---
    fetchSidebarLive();
    
    // Skip fetchMatches on upcoming page - Schedule Centre module handles it
    if (!window.location.pathname.includes('upcoming')) {
      fetchMatches(currentPageFilter);
    }

    if (heroSliderContainer) {
      fetchHeroData(currentPageFilter);
      fetchLeaguesHero();
    }

    scheduleNonCritical(() => {
      setupNewsletter();
      if (newsContainer) fetchNews(currentTab);
      if (headlinesContainer) fetchNews(currentTab);
      if (playersContainer || document.getElementById('trending-players-container')) fetchPlayers(currentTab);
      if (leaguesContainer || topTierContainer) fetchLeagues && fetchLeagues(currentTab);
      if (recentResultsContainer) fetchRecentResults();
      if (document.getElementById("featured-match-analysis")) fetchFeaturedAnalysis();

      if (upcomingTodayContainer) {
        fetchUpcomingToday();
        setupUpcomingControls();
      }
      if (document.getElementById('arena-schedule-container')) {
        fetchArenaSchedule(currentArenaTab);
        setupArenaControls && setupArenaControls();
        renderArenaTabs && renderArenaTabs();
      }
      if (document.getElementById('trending-matches-list')) {
        fetchTrendingUpcoming();
      }
    }, 900);

    // --- REFRESH LOGIC (WebSocket Powered) ---
    realtime.subscribe('live', { sport: currentTab, isLive: true });

    // Secondary timers for less frequent data (News, Leagues)
    setInterval(() => {
      if (heroSliderContainer) fetchHeroData(currentPageFilter);
      if (newsContainer) fetchNews(currentTab);
      if (leaguesContainer || topTierContainer) fetchLeagues && fetchLeagues(currentTab);
    }, 60000);

    setInterval(() => {
      if (playersContainer) fetchPlayers(currentTab);
    }, 600000);
  }

  initSportEditorialSection();
  initBlogHubPage();
  initBlogArticlePage();
});

// --- NOTIFICATION HANDLER ---
window.handleNotification = async function(subject, detail) {
  if (detail === 'success' || detail === 'error') {
    showRuntimeToast(subject, detail);
    return;
  }

  const matchId = String(subject || '');
  if (!matchId) {
    showRuntimeToast('Reminder unavailable', 'error');
    return;
  }

  const match = findCachedMatch(matchId);
  const title = match
    ? `${match.homeTeam.name} vs ${match.awayTeam.name}`
    : (detail ? decodeURIComponent(detail) : 'Match Reminder');
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    showRuntimeToast('Allow alerts to save reminders', 'error');
    return;
  }

  const kickoffMs = match?.date ? new Date(match.date).getTime() : NaN;
  const reminder = {
    matchId,
    title: `${title} starting soon`,
    body: match
      ? `${match.league || match.sport} at ${match.time || 'scheduled time'}`
      : 'Saved match reminder from LivescoreFree.',
    kickoffAt: Number.isFinite(kickoffMs) ? kickoffMs : Date.now() + 15 * 60 * 1000,
    notifyAt: Number.isFinite(kickoffMs) ? Math.max(Date.now() + 5000, kickoffMs - 15 * 60 * 1000) : Date.now() + 5000,
    savedAt: Date.now(),
    url: match ? buildMatchUrl(match) : '/upcoming'
  };

  persistReminder(reminder);
  scheduleStoredReminder(reminder);
  showRuntimeToast(`Reminder saved for ${title}`);
};

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
    const allMatches = filterRenderableMatches(data.matches || []);
    window._cachedUpcomingMatches = allMatches;
    
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
    <a href="${buildMatchUrl(m)}" 
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
          <span class="material-symbols-outlined text-sm">${sportParams.endIcon}</span>
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
    <a href="${buildMatchUrl(m)}" 
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
          <span class="material-symbols-outlined text-sm">${sportParams.endIcon}</span>
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

window.switchArenaTab = function switchTab(tabId) {
  currentArenaTab = tabId;
  currentTab = tabId;
  renderArenaTabs();
  // Update Realtime subscription
  realtime.updateSubscription('live', { sport: currentTab, isLive: true });
  const container = document.getElementById('arena-schedule-container');
  if (container) {
    container.innerHTML = `
      <div class="bg-surface-container border border-white/5 p-8 rounded-lg animate-pulse min-w-[300px] h-64"></div>
      <div class="bg-surface-container border border-white/5 p-8 rounded-lg animate-pulse min-w-[300px] h-64"></div>
    `;
  }
  fetchArenaSchedule(tabId);

  // Sync with main matches grid if on upcoming page
  if (isCurrentPage('upcoming')) {
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

    // Friendly date/time logic
    let friendlyDate = match.time || '';
    let dayLabel = 'TODAY';
    try {
      const d = new Date(match.date);
      const now = new Date();
      if (d.getDate() !== now.getDate()) {
        dayLabel = 'TOMORROW';
      }
      friendlyDate = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch(e) {}

    const homeAbbr = match.homeTeam.abbreviation || match.homeTeam.name.substring(0, 3).toUpperCase();
    const awayAbbr = match.awayTeam.abbreviation || match.awayTeam.name.substring(0, 3).toUpperCase();

    return `
      <div class="bg-[#111111] p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-500 shadow-2xl flex flex-col justify-between h-[450px] group min-w-[320px] snap-center shrink-0">
        <div>
          <!-- Top Row: League & Time -->
          <div class="flex justify-between items-center mb-12">
            <span class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface/60">
              <span class="w-2 h-2 rounded-full ${dotColor}"></span>
              ${match.league || 'UPCOMING'}
            </span>
            <span class="text-[10px] font-black uppercase tracking-widest text-on-surface/40">
              ${friendlyDate} ${dayLabel}
            </span>
          </div>

          <!-- Middle Row: Team Circles & VS -->
          <div class="flex items-center justify-between mb-8 px-4">
            <!-- Home Team Circle -->
            <div class="flex flex-col items-center gap-4">
              <div class="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative group-hover:border-primary/50 transition-colors shadow-inner">
                <span class="text-xl font-black tracking-tighter uppercase text-on-surface/80">${homeAbbr}</span>
                <img src="${match.homeTeam.logo}" class="absolute w-12 h-12 object-contain opacity-10 group-hover:opacity-20 transition-opacity" onerror="this.style.display='none'">
              </div>
            </div>

            <!-- VS Element -->
            <div class="flex flex-col items-center">
              <span class="text-3xl font-black text-primary italic tracking-tight transform group-hover:scale-110 transition-transform duration-700">VS</span>
            </div>

            <!-- Away Team Circle -->
            <div class="flex flex-col items-center gap-4">
              <div class="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative group-hover:border-primary/50 transition-colors shadow-inner">
                <span class="text-xl font-black tracking-tighter uppercase text-on-surface/80">${awayAbbr}</span>
                <img src="${match.awayTeam.logo}" class="absolute w-12 h-12 object-contain opacity-10 group-hover:opacity-20 transition-opacity" onerror="this.style.display='none'">
              </div>
            </div>
          </div>

          <!-- Bottom Labels: Full Names -->
          <div class="flex justify-between px-2 text-center">
            <span class="text-[9px] font-black uppercase tracking-widest text-on-surface/30 truncate w-32">${match.homeTeam.name}</span>
            <span class="text-[9px] font-black uppercase tracking-widest text-on-surface/30 truncate w-32">${match.awayTeam.name}</span>
          </div>
        </div>

        <!-- Footer: Notify Button -->
        <div class="space-y-4">
          <div class="w-full h-px bg-white/5"></div>
          <button onclick="handleNotification('${match.id}', '${encodeURIComponent(`${match.homeTeam.name} vs ${match.awayTeam.name}`)}')" 
                  class="w-full py-4 bg-white/5 hover:bg-primary rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface/40 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2">
            NOTIFY ME
          </button>
        </div>
      </div>
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
    const isIndexPage = isHomePath();
    const feed = await fetchCompositeMatchFeeds({
      sport: isIndexPage ? 'all' : (currentTab || 'all'),
      league: isIndexPage ? '' : (currentLeagueFilter || ''),
      upcomingDays: isIndexPage ? 5 : 4,
      resultsDays: 4,
      includeNews: isIndexPage
    });

    const heroMatches = buildHeroMatchPool({
      liveMatches: feed.liveMatches,
      upcomingMatches: feed.upcomingMatches,
      finishedMatches: feed.finishedMatches,
      statusFilter,
      limit: isIndexPage ? 4 : 5,
      isHomePage: isIndexPage
    });

    const metaSource = statusFilter === 'finished'
      ? (feed.meta.results || {})
      : statusFilter === 'upcoming'
        ? (feed.meta.upcoming || {})
        : (feed.meta.live || feed.meta.upcoming || feed.meta.results || {});

    updateFeedRibbon(metaSource, {
      feedLabel: isIndexPage ? 'Homepage spotlight' : 'Hero spotlight',
      matchCount: heroMatches.length,
      liveCount: feed.liveMatches.length
    });
    if (tickerContainer) {
      renderTicker(feed.mixedMatches);
    }

    if (isIndexPage) {
      renderIndexHeroHub(feed.liveMatches, feed.upcomingMatches, feed.newsList);
      return;
    }

    renderHeroSlider(heroMatches, statusFilter, {
      liveMatches: feed.liveMatches,
      upcomingMatches: feed.upcomingMatches,
      finishedMatches: feed.finishedMatches,
      newsList: feed.newsList,
      isHomePage: false
    });
  } catch (err) {
    console.error('Hero Slider error:', err);
    if (heroSliderContainer) heroSliderContainer.style.display = 'none';
  }
}

function buildHeroPrimaryAction(match = {}) {
  if (match.status === 'upcoming') {
    return {
      type: 'button',
      label: 'Set Reminder',
      icon: 'notifications',
      action: `handleNotification('${String(match.id).replace(/'/g, "\\'")}', '${encodeURIComponent(`${match.homeTeam?.name || ''} vs ${match.awayTeam?.name || ''}`)}');`
    };
  }
  if (match.status === 'finished' && match.highlightUrl) {
    return {
      type: 'link',
      href: match.highlightUrl,
      target: '_blank',
      label: 'Watch Highlights',
      icon: 'video_library'
    };
  }
  return {
    type: 'link',
    href: buildMatchUrl(match),
    target: '_self',
    label: match.status === 'finished' ? 'View Final Recap' : 'Open Match Center',
    icon: match.status === 'finished' ? 'description' : 'radio_button_checked'
  };
}

function renderHeroPrimaryAction(match = {}) {
  const action = buildHeroPrimaryAction(match);
  if (action.type === 'button') {
    return `
      <button type="button"
              onclick="${action.action}"
              class="bg-primary hover:bg-primary/90 px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(204,22,22,0.4)]">
        <span class="material-symbols-outlined">${action.icon}</span> ${action.label}
      </button>
    `;
  }
  return `
    <a href="${action.href}" target="${action.target}"
       class="bg-primary hover:bg-primary/90 px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(204,22,22,0.4)]">
      <span class="material-symbols-outlined">${action.icon}</span> ${action.label}
    </a>
  `;
}

function renderHeroMatchSlide(entry, index, isHomePage = false) {
  const match = entry.match || entry;
  const homeCode = getHeroTeamLabel(match.homeTeam).toUpperCase();
  const awayCode = getHeroTeamLabel(match.awayTeam).toUpperCase();
  const scoreText = getHeroScoreText(match);
  const clockLabel = match.status === 'upcoming' ? 'Kickoff' : (match.status === 'finished' ? 'Final' : 'Live Clock');
  const badgeLabel = match.status === 'live' ? 'Live Match' : (match.status === 'finished' ? 'Final Result' : 'Upcoming Match');
  return `
    <article class="absolute inset-0 transition-opacity duration-700 ${index === 0 ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-10'}"
             data-hero-slide="${index}"
             data-hero-key="${getHeroSlideKey(entry)}">
      <div class="absolute inset-0" style="${buildMatchBackdropStyle(match)}"></div>
      <div class="absolute inset-0 opacity-60" style="background-image: radial-gradient(circle at 50% 72%, rgba(255,77,61,0.12) 0%, transparent 38%);"></div>
      <div class="relative h-full max-w-[1600px] mx-auto px-6 md:px-20 py-12 sm:py-16 flex items-center">
        <div class="w-full max-w-5xl pr-0 ${isHomePage ? 'xl:pr-[28rem]' : ''}">
          <div class="flex flex-wrap items-center gap-3 mb-6">
            <span class="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase">
              <span class="w-2 h-2 bg-white rounded-full ${match.status === 'live' ? 'animate-pulse' : ''}"></span> ${badgeLabel}
            </span>
            <span class="text-on-surface-variant font-bold text-xs tracking-widest uppercase">${match.league || match.sport || 'Feature'}</span>
          </div>
          <div class="flex flex-col lg:flex-row lg:items-end gap-6 mb-6">
            <h1 class="font-headline font-black text-5xl sm:text-6xl md:text-8xl tracking-tighter leading-[0.85] uppercase italic text-on-surface"
                data-hero-headline
                data-pretext-mode="block"
                data-pretext-max-lines="2"
                data-pretext-min="26">
              ${homeCode} <span class="text-primary">${scoreText}</span> ${awayCode}
            </h1>
            <div class="lg:mb-3">
              <div class="text-xs font-black uppercase text-primary tracking-widest mb-1">${clockLabel}</div>
              <div class="text-2xl sm:text-4xl font-black italic leading-tight"
                   data-hero-clock
                   data-pretext-mode="block"
                   data-pretext-max-lines="2"
                   data-pretext-min="18">${formatHeroClock(match)}</div>
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 max-w-3xl mb-8">
            <div class="bg-black/20 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-md">
              <div class="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 mb-2">Matchup</div>
              <p class="text-sm sm:text-base font-black uppercase leading-tight">${match.homeTeam.name} vs ${match.awayTeam.name}</p>
            </div>
            <div class="bg-black/20 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-md">
              <div class="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 mb-2">Venue</div>
              <p class="text-sm sm:text-base font-black uppercase leading-tight">${match.venue || match.broadcast || 'Global Coverage'}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-4">
            ${renderHeroPrimaryAction(match)}
            <a href="${buildMatchUrl(match)}" class="bg-white/5 backdrop-blur-md border border-white/20 px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-on-surface font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/10 transition-colors">
              Full Match Center
            </a>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderHeroNewsSlide(entry, index) {
  const article = entry.article || {};
  return `
    <article class="absolute inset-0 transition-opacity duration-700 ${index === 0 ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-10'}"
             data-hero-slide="${index}"
             data-hero-key="${getHeroSlideKey(entry)}">
      <div class="absolute inset-0" style="${buildNewsBackdropStyle(article)}"></div>
      <div class="relative h-full max-w-[1600px] mx-auto px-6 md:px-20 py-12 sm:py-16 flex items-center">
        <div class="w-full max-w-4xl">
          <div class="flex flex-wrap items-center gap-3 mb-6">
            <span class="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase">
              <span class="w-2 h-2 bg-white rounded-full"></span> News Blog
            </span>
            <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/60">
              <img src="${getSourceFaviconUrl(article.source)}" alt="" class="h-4 w-4 rounded-full" onerror="this.src='${FALLBACK_LOGO}'">
              ${(article.source?.domain || article.source?.name || article.sportLabel || 'Source')}
            </span>
          </div>
          <h1 class="font-headline font-black text-4xl sm:text-6xl md:text-7xl tracking-tighter leading-[0.9] uppercase italic text-on-surface max-w-4xl"
              data-hero-headline
              data-pretext-mode="block"
              data-pretext-max-lines="4"
              data-pretext-min="24">
            ${article.headline || 'Breaking Sports Update'}
          </h1>
          <p class="mt-6 text-base sm:text-lg max-w-3xl text-on-surface/65 font-bold leading-relaxed">
            ${article.description || article.summary || 'The homepage hero now rotates live action, upcoming fixtures, recent finals, and the latest headline feed.'}
          </p>
          <div class="flex flex-wrap gap-4 mt-8">
            <a href="${getArticleLinkUrl(article)}" target="${getArticleLinkTarget(article)}" class="bg-primary hover:bg-primary/90 px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(204,22,22,0.4)]">
              <span class="material-symbols-outlined">article</span> Read Blog Story
            </a>
            <a href="${buildBlogHubUrl(article.sport || currentTab || 'all', article.league || currentLeagueFilter || '')}" class="bg-white/5 backdrop-blur-md border border-white/20 px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-on-surface font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/10 transition-colors">
              Open News Hub
            </a>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderHomeHeroWidgets(upcomingMatches = [], newsList = []) {
  const nextUpMatch = sortMatchesForDisplay(upcomingMatches.filter((match) => match.status === 'upcoming'), 'upcoming')[0];
  const newsItem = newsList[0];
  return `
    <div class="absolute right-6 xl:right-12 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 z-30 pointer-events-auto">
      ${nextUpMatch ? `
        <a href="${buildMatchUrl(nextUpMatch)}" class="glass-card block p-6 rounded-2xl border border-white/10 w-80 shadow-2xl group hover:border-primary transition-all cursor-pointer bg-surface/30 backdrop-blur-md">
          <div class="flex justify-between items-start mb-4">
            <div class="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Next Major Event</div>
            <div class="bg-white/10 px-2 py-0.5 rounded text-[9px] font-black">${formatHeroClock(nextUpMatch)}</div>
          </div>
          <div class="text-2xl font-black italic uppercase leading-none mb-1">${nextUpMatch.homeTeam?.name || ''} vs ${nextUpMatch.awayTeam?.name || ''}</div>
          <div class="text-[10px] font-bold text-primary tracking-widest uppercase">${nextUpMatch.league || ''}</div>
        </a>
      ` : ''}
      <div class="glass-card p-6 rounded-2xl border border-white/10 w-80 shadow-2xl bg-surface/30 backdrop-blur-md">
        <div class="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-4">The Multiverse Quick-Jump</div>
        <div class="grid grid-cols-4 gap-3">
          <a class="aspect-square bg-white/5 hover:bg-primary transition-all rounded-lg flex items-center justify-center group" href="/sport?s=soccer"><span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">sports_soccer</span></a>
          <a class="aspect-square bg-white/5 hover:bg-primary transition-all rounded-lg flex items-center justify-center group" href="/sport?s=basketball&l=nba"><span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">sports_basketball</span></a>
          <a class="aspect-square bg-white/5 hover:bg-primary transition-all rounded-lg flex items-center justify-center group" href="/sport?s=football&l=nfl"><span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">sports_football</span></a>
          <a class="aspect-square bg-white/5 hover:bg-primary transition-all rounded-lg flex items-center justify-center group" href="/results.html"><span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">history</span></a>
        </div>
      </div>
      ${newsItem ? `
        <a href="${getArticleLinkUrl(newsItem)}" target="${getArticleLinkTarget(newsItem)}" class="glass-card block p-5 rounded-2xl border border-white/10 w-80 shadow-2xl overflow-hidden relative group bg-surface/30 backdrop-blur-md">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            <span class="text-[10px] font-black uppercase tracking-widest">News Blog</span>
          </div>
          <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-on-surface/45">
            <img src="${getSourceFaviconUrl(newsItem.source)}" alt="" class="h-4 w-4 rounded-full" onerror="this.src='${FALLBACK_LOGO}'">
            ${(newsItem.source?.domain || newsItem.source?.name || newsItem.sportLabel || 'Source')}
          </div>
          <p class="text-[11px] font-bold leading-tight uppercase opacity-80 group-hover:text-primary transition-colors line-clamp-3">${newsItem.headline}</p>
          <span class="inline-block mt-3 text-[9px] font-black uppercase tracking-widest border-b border-primary text-primary pb-0.5">Read Blog</span>
        </a>
      ` : ''}
    </div>
  `;
}

function renderHeroControls(slides = [], currentSlide = 0) {
  if (slides.length < 2) return '';
  return `
    <div class="absolute bottom-10 left-6 md:left-20 z-30 flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <button type="button" class="inline-flex items-center justify-center w-11 h-11 rounded-full border border-white/10 bg-black/20 backdrop-blur-md text-on-surface/70 hover:text-white hover:bg-white/10 transition-colors" data-hero-step="-1" aria-label="Previous hero slide"><span class="material-symbols-outlined text-lg">chevron_left</span></button>
        <button type="button" class="inline-flex items-center justify-center w-11 h-11 rounded-full border border-white/10 bg-black/20 backdrop-blur-md text-on-surface/70 hover:text-white hover:bg-white/10 transition-colors" data-hero-step="1" aria-label="Next hero slide"><span class="material-symbols-outlined text-lg">chevron_right</span></button>
      </div>
      <div class="flex flex-wrap gap-4">
        ${slides.map((entry, index) => `
          <button type="button" class="group cursor-pointer text-left ${index === currentSlide ? 'opacity-100' : 'opacity-40 hover:opacity-100'} transition-opacity" data-hero-goto="${index}">
            <div class="w-16 h-1.5 ${index === currentSlide ? 'bg-primary' : 'bg-white/10'} rounded-full"></div>
            <span class="text-[9px] font-black uppercase mt-2 block tracking-widest ${index === currentSlide ? 'text-primary' : 'text-on-surface'}">${getHeroPagerLabel(entry, index)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderHeroSlider(items, statusFilter, options = {}) {
  if (!heroSliderContainer) return;
  const slides = (items || [])
    .map((entry) => (entry?.kind ? entry : { kind: 'match', match: entry }))
    .filter((entry) => entry.kind === 'news' ? Boolean(entry.article?.headline) : Boolean(entry.match?.id));
  clearInterval(window._lsfHeroAutoplayHandle);

  if (!slides.length) {
    heroSliderContainer.style.display = 'none';
    return;
  }
  heroSliderContainer.style.display = 'block';
  const isHomePage = Boolean(options.isHomePage);
  const activeIndex = Math.max(slides.findIndex((entry) => getHeroSlideKey(entry) === window._lsfHeroActiveKey), 0);

  heroSliderContainer.innerHTML = `
    <div class="lsf-hero-shell relative w-full h-full min-h-[600px] overflow-hidden">
      ${slides.map((entry, index) => entry.kind === 'news' ? renderHeroNewsSlide(entry, index) : renderHeroMatchSlide(entry, index, isHomePage)).join('')}
      ${renderHeroControls(slides, activeIndex)}
      ${isHomePage ? renderHomeHeroWidgets(options.upcomingMatches || [], options.newsList || []) : ''}
    </div>
  `;
  schedulePretextLayout(heroSliderContainer);

  let currentSlide = activeIndex;
  const slideNodes = Array.from(heroSliderContainer.querySelectorAll('[data-hero-slide]'));
  const pagerNodes = Array.from(heroSliderContainer.querySelectorAll('[data-hero-goto]'));
  const shell = heroSliderContainer.querySelector('.lsf-hero-shell');

  const setActiveSlide = (index) => {
    currentSlide = (index + slides.length) % slides.length;
    slideNodes.forEach((slideNode, slideIndex) => {
      slideNode.classList.toggle('opacity-100', slideIndex === currentSlide);
      slideNode.classList.toggle('opacity-0', slideIndex !== currentSlide);
      slideNode.classList.toggle('pointer-events-none', slideIndex !== currentSlide);
      slideNode.classList.toggle('z-20', slideIndex === currentSlide);
      slideNode.classList.toggle('z-10', slideIndex !== currentSlide);
    });
    pagerNodes.forEach((pagerNode, pagerIndex) => {
      pagerNode.classList.toggle('opacity-100', pagerIndex === currentSlide);
      pagerNode.classList.toggle('opacity-40', pagerIndex !== currentSlide);
      const bar = pagerNode.querySelector('div');
      if (bar) {
        bar.classList.toggle('bg-primary', pagerIndex === currentSlide);
        bar.classList.toggle('bg-white/10', pagerIndex !== currentSlide);
      }
      const label = pagerNode.querySelector('span');
      if (label) {
        label.classList.toggle('text-primary', pagerIndex === currentSlide);
        label.classList.toggle('text-on-surface', pagerIndex !== currentSlide);
      }
    });
    window._lsfHeroActiveKey = getHeroSlideKey(slides[currentSlide]);
  };

  setActiveSlide(currentSlide);
  heroSliderContainer.querySelectorAll('[data-hero-goto]').forEach((button) => {
    button.addEventListener('click', () => setActiveSlide(Number(button.dataset.heroGoto || '0')));
  });
  heroSliderContainer.querySelectorAll('[data-hero-step]').forEach((button) => {
    button.addEventListener('click', () => setActiveSlide(currentSlide + Number(button.dataset.heroStep || '1')));
  });

  const stopAutoplay = () => clearInterval(window._lsfHeroAutoplayHandle);
  const startAutoplay = () => {
    clearInterval(window._lsfHeroAutoplayHandle);
    if (slides.length < 2) return;
    window._lsfHeroAutoplayHandle = setInterval(() => setActiveSlide(currentSlide + 1), isHomePage ? 7000 : 8000);
  };

  if (shell) {
    shell.addEventListener('mouseenter', stopAutoplay);
    shell.addEventListener('mouseleave', startAutoplay);
    shell.addEventListener('focusin', stopAutoplay);
    shell.addEventListener('focusout', startAutoplay);
    shell.addEventListener('touchstart', stopAutoplay, { passive: true });
    shell.addEventListener('touchend', startAutoplay, { passive: true });
  }
  startAutoplay();
}

function renderIndexHeroHub(liveMatches, upMatches, newsList) {
  if (!heroSliderContainer) return;
  const slides = buildHomeHeroSlides(liveMatches, upMatches, window._cachedResults || [], newsList || []);
  if (!slides.length) {
    heroSliderContainer.style.display = 'none';
    return;
  }
  renderHeroSlider(slides, null, {
    isHomePage: true,
    upcomingMatches: upMatches,
    newsList: newsList || [],
    liveMatches,
    finishedMatches: window._cachedResults || []
  });
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
      { name: 'IPL 2026', slug: 'ipl', country: 'India', sport: 'cricket', icon: 'sports_cricket', category: 'top' },
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
            <p class="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest mb-6">${l.country} - ${l.sport}</p>
          </div>
          <button onclick="window.location.href='${buildSportHubUrl(l.sport, l.slug)}'" class="w-full py-3 bg-white/5 group-hover:bg-primary group-hover:text-on-primary transition-all text-[10px] font-black uppercase tracking-widest rounded">View Hub</button>
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
            <button onclick="window.location.href='${buildSportHubUrl('mma', l.slug)}'" class="self-start px-8 py-3 ${isLive ? 'kinetic-gradient' : 'bg-white/5 border border-white/10'} text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all">Explore Hub</button>
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
        <div class="bg-surface-container-high border ${isLive ? 'border-primary/50' : 'border-white/5'} p-6 rounded-xl text-center hover:bg-surface-container-highest hover:border-primary/30 transition-all cursor-pointer group relative" onclick="window.location.href='${buildSportHubUrl('soccer', l.slug)}'">
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
                const teamUrl = buildTeamProfileUrl(
                  {
                    id: e.team?.id,
                    name: e.team?.displayName,
                    logo: e.team?.logos?.[0]?.href
                  },
                  activeLeague === 'nba' ? 'basketball' : activeLeague === 'nfl' ? 'football' : 'soccer',
                  activeLeague
                );
                return `
                <tr class="hover:bg-white/10 transition-all duration-300 group/row cursor-pointer" onclick="window.location.href='${teamUrl}'">
                  <td class="px-8 py-6">
                    <span class="text-sm font-black italic ${idx < 4 ? 'text-primary' : 'text-on-surface/40'}">${e.stats.find(s => s.name === 'rank')?.value || '-'}</span>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center p-2 group-hover/row:bg-primary/20 transition-all duration-500 transform group-hover/row:scale-110 group-hover/row:rotate-6">
                        <img src="${getSafeImageUrl(e.team.logos?.[0]?.href, FALLBACK_LOGO)}" class="w-full h-full object-contain" onerror="this.src='${FALLBACK_LOGO}'">
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
              ${standings.length === 0 ? '<tr><td colspan="5" class="px-8 py-24 text-center"><div class="flex flex-col items-center gap-4 opacity-30"><span class="material-symbols-outlined text-4xl">inventory_2</span><p class="text-[10px] font-black uppercase tracking-[0.3em]">No live standings available right now</p></div></td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

// --- FETCH PLAYERS ---
async function fetchPlayers() {
  const isPlayersPage = isCurrentPage('players');
  if (!playersContainer && !trendingPlayersContainer && !isPlayersPage) return;

  try {
    // We will do parallel fetches for different player groupings
    const [soccerRes, nbaRes, nflRes, nhlRes, cricketRes, tennisRes] = await Promise.all([
      fetch(`${API_INFO}?type=players&sport=soccer&league=eng.1`).catch(() => null),
      fetch(`${API_INFO}?type=players&sport=basketball&league=nba`).catch(() => null),
      fetch(`${API_INFO}?type=players&sport=football&league=nfl`).catch(() => null),
      fetch(`${API_INFO}?type=players&sport=hockey&league=nhl`).catch(() => null),
      fetch(`${API_INFO}?type=players&sport=cricket&league=ipl`).catch(() => null),
      fetch(`${API_INFO}?type=players&sport=tennis&league=atp`).catch(() => null)
    ]);

    const soccerData = soccerRes ? await soccerRes.json() : { athletes: [] };
    const nbaData = nbaRes ? await nbaRes.json() : { athletes: [] };
    const nflData = nflRes ? await nflRes.json() : { athletes: [] };
    const nhlData = nhlRes ? await nhlRes.json() : { athletes: [] };
    const cricketData = cricketRes ? await cricketRes.json() : { athletes: [] };
    const tennisData = tennisRes ? await tennisRes.json() : { athletes: [] };

    const soccerAthletes = soccerData.athletes || [];
    const nbaAthletes = nbaData.athletes || [];
    const nflAthletes = nflData.athletes || [];
    const nhlAthletes = nhlData.athletes || [];
    const cricketAthletes = cricketData.athletes || [];
    const tennisAthletes = tennisData.athletes || [];
    
    // Inject sport data
    soccerAthletes.forEach(a => { a.sport = 'soccer'; a.league = 'eng.1'; });
    nbaAthletes.forEach(a => { a.sport = 'basketball'; a.league = 'nba'; });
    nflAthletes.forEach(a => { a.sport = 'football'; a.league = 'nfl'; });
    nhlAthletes.forEach(a => { a.sport = 'hockey'; a.league = 'nhl'; });
    cricketAthletes.forEach(a => { a.sport = 'cricket'; a.league = 'ipl'; });
    tennisAthletes.forEach(a => { a.sport = 'tennis'; a.league = 'atp'; });

    // On players.html, render the 6 grids
    if (isPlayersPage) {
       renderTrendingPlayersPage(soccerAthletes.concat(nbaAthletes, nflAthletes, nhlAthletes, cricketAthletes, tennisAthletes));
       renderSoccerLegends(soccerAthletes);
       renderNbaAllstars(nbaAthletes);
       renderNflElite(nflAthletes);
       renderNhlStars(nhlAthletes);
       renderCricketIcons(cricketAthletes);
       renderTennisAces(tennisAthletes);
    } else if (trendingPlayersContainer && !playersContainer) {
       renderTrendingPlayersPage(soccerAthletes.concat(nbaAthletes, nflAthletes));
    } else if (playersContainer) {
       // Legacy generic players container fallback
       playersContainer.innerHTML = soccerAthletes.slice(0, 10).map(a => `
        <a href="${buildPlayerProfileUrl(a, a.sport, a.league)}" class="bg-surface-container p-4 rounded-lg flex items-center gap-4 border border-white/5 hover:border-primary/30 transition-all">
          <img src="${getSafeImageUrl(a.headshot?.href, FALLBACK_LOGO)}" class="w-12 h-12 rounded-full grayscale hover:grayscale-0 transition-all" onerror="this.src='${FALLBACK_LOGO}'">
          <div>
            <h4 class="font-black uppercase text-xs">${a.fullName}</h4>
            <p class="text-[10px] opacity-40 uppercase font-black">${a.position?.displayName || 'Player'}</p>
          </div>
        </a>
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
  const mixed = athletes.slice(0, 4);
  container.innerHTML = mixed.map(a => `
    <a href="${buildPlayerProfileUrl(a, a.sport, a.league)}" class="flex-none w-80 bg-surface-container-low p-6 border border-white/5 rounded-2xl group hover:border-primary/20 transition-all cursor-pointer block">
      <div class="flex justify-between items-start mb-6">
        <div class="relative">
          <img src="${getSafeImageUrl(a.headshot?.href, FALLBACK_LOGO)}" class="w-16 h-16 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" onerror="this.src='${FALLBACK_LOGO}'">
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
          <p class="text-xs font-black text-white uppercase mt-1">${(a.sport || 'Unknown').toUpperCase()}</p>
        </div>
        <div class="bg-surface-container p-3 rounded-xl border border-white/5">
          <p class="text-[8px] text-on-surface-variant uppercase font-bold tracking-widest">Pos</p>
          <p class="text-xs font-black text-white mt-1 uppercase">${a.position?.displayName || 'N/A'}</p>
        </div>
      </div>
    </a>
  `).join('');
}

function renderSoccerLegends(athletes) {
  const container = document.getElementById('soccer-legends-grid');
  if (!container) return;
  if (!athletes.length) { container.innerHTML = ''; return; }
  container.innerHTML = athletes.slice(0, 4).map(a => `
    <a href="${buildPlayerProfileUrl(a, a.sport, a.league)}" class="bg-surface-container-low border border-white/5 overflow-hidden group hover:border-primary/20 transition-all block">
      <div class="relative h-64 overflow-hidden bg-surface-container-highest">
        <img src="${getSafeImageUrl(a.headshot?.href, FALLBACK_LOGO)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onerror="this.src='${FALLBACK_LOGO}'">
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
        <div class="w-full border border-white/10 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-colors text-center">Full Profile</div>
      </div>
    </a>
  `).join('');
}

function renderNbaAllstars(athletes) {
  const container = document.getElementById('nba-allstars-grid');
  if (!container) return;
  if (!athletes.length) { container.innerHTML = ''; return; }
  container.innerHTML = athletes.slice(0, 3).map(a => `
    <a href="${buildPlayerProfileUrl(a, a.sport, a.league)}" class="glass-panel p-8 border border-white/5 rounded-2xl relative overflow-hidden group hover:translate-y-[-4px] transition-all block">
      <div class="flex items-end gap-6 mb-8">
        <div class="relative w-24 h-24 overflow-hidden rounded-xl border border-white/10 bg-surface-container-highest">
          <img src="${getSafeImageUrl(a.headshot?.href, FALLBACK_LOGO)}" class="w-full h-full object-cover" onerror="this.src='${FALLBACK_LOGO}'">
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
    </a>
  `).join('');
}

function renderNflElite(athletes) {
  const container = document.getElementById('nfl-elite-grid');
  if (!container) return;
  if (!athletes.length) { container.innerHTML = ''; return; }
  container.innerHTML = athletes.slice(0, 2).map(a => `
    <a href="${buildPlayerProfileUrl(a, a.sport, a.league)}" class="bg-surface-container border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-8 group hover:bg-surface-bright transition-all">
      <div class="w-full md:w-32 h-48 rounded-xl overflow-hidden bg-surface-container-lowest border border-white/10 shrink-0">
        <img src="${getSafeImageUrl(a.headshot?.href, FALLBACK_LOGO)}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" onerror="this.src='${FALLBACK_LOGO}'">
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
    </a>
  `).join('');
}

function renderNhlStars(athletes) {
  const container = document.getElementById('nhl-stars-grid');
  if (!container) return;
  if (!athletes.length) { container.innerHTML = ''; return; }
  container.innerHTML = athletes.slice(0, 3).map(a => `
    <a href="${buildPlayerProfileUrl(a, a.sport, a.league)}" class="glass-panel p-6 border border-white/5 rounded-2xl relative overflow-hidden group hover:bg-white/5 transition-all block">
      <div class="flex items-center gap-4 mb-4">
        <img src="${getSafeImageUrl(a.headshot?.href, FALLBACK_LOGO)}" class="w-16 h-16 rounded-full object-cover border border-white/10" onerror="this.src='${FALLBACK_LOGO}'">
        <div>
          <h4 class="text-xl font-black uppercase italic tracking-tighter">${a.fullName}</h4>
          <p class="text-[10px] text-primary font-black tracking-widest uppercase mt-1">NHL | ${a.position?.abbreviation || 'Player'}</p>
        </div>
      </div>
      <div class="flex justify-between items-center text-xs text-on-surface-variant font-bold uppercase tracking-widest">
        <span>Age: ${a.age || '-'}</span>
        <span>${a.displayHeight || '-'}</span>
      </div>
    </a>
  `).join('');
}

function renderCricketIcons(athletes) {
  const container = document.getElementById('cricket-icons-grid');
  if (!container) return;
  if (!athletes.length) { container.innerHTML = ''; return; }
  container.innerHTML = athletes.slice(0, 3).map(a => `
    <a href="${buildPlayerProfileUrl(a, a.sport, a.league)}" class="bg-surface-container border border-white/5 rounded-2xl p-6 relative group hover:border-primary/40 transition-all block">
      <div class="flex items-center gap-4 mb-4">
        <img src="${getSafeImageUrl(a.headshot?.href, FALLBACK_LOGO)}" class="w-16 h-16 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all border border-white/10" onerror="this.src='${FALLBACK_LOGO}'">
        <div>
          <h4 class="text-xl font-black uppercase italic tracking-tighter">${a.fullName}</h4>
          <p class="text-[10px] text-primary font-black tracking-widest uppercase mt-1">IPL | ${a.position?.abbreviation || 'Cricket'}</p>
        </div>
      </div>
      <div class="flex justify-between items-center text-xs text-on-surface-variant font-bold uppercase tracking-widest">
        <span>Age: ${a.age || '-'}</span>
        <span class="text-primary">${a.status?.name || 'Active'}</span>
      </div>
    </a>
  `).join('');
}

function renderTennisAces(athletes) {
  const container = document.getElementById('tennis-aces-grid');
  if (!container) return;
  if (!athletes.length) { container.innerHTML = ''; return; }
  container.innerHTML = athletes.slice(0, 3).map(a => `
    <a href="${buildPlayerProfileUrl(a, a.sport, a.league)}" class="glass-panel p-6 border border-white/5 rounded-2xl relative group hover:bg-white/5 transition-all block">
      <div class="flex items-center gap-4 mb-4">
        <img src="${getSafeImageUrl(a.headshot?.href, FALLBACK_LOGO)}" class="w-16 h-16 rounded-full object-cover border border-white/10" onerror="this.src='${FALLBACK_LOGO}'">
        <div>
          <h4 class="text-xl font-black uppercase italic tracking-tighter">${a.fullName}</h4>
          <p class="text-[10px] text-primary font-black tracking-widest uppercase mt-1">ATP | ${a.position?.displayName || 'Pro'}</p>
        </div>
      </div>
      <div class="flex justify-between items-center text-xs text-on-surface-variant font-bold uppercase tracking-widest border-t border-white/5 pt-3">
        <span>Age: ${a.age || '-'}</span>
        <span>${a.displayHeight || '-'}</span>
      </div>
    </a>
  `).join('');
}

// --- RENDER TRENDING UPCOMING (HOME SIDEBAR) ---
async function fetchTrendingUpcoming() {
  const trendingList = document.getElementById('trending-matches-list');
  if (!trendingList) return;

  try {
    const feed = await fetchCompositeMatchFeeds({
      sport: currentTab || 'all',
      league: currentLeagueFilter || '',
      upcomingDays: 4,
      resultsDays: 4
    });
    const matches = combineMatchPools(
      feed.liveMatches.slice(0, 3),
      feed.upcomingMatches.slice(0, 4),
      feed.finishedMatches.slice(0, 3)
    ).slice(0, 6);
    renderTrendingUpcoming(matches);
  } catch(e) {
    console.error('Trending matches fetch error:', e);
    trendingList.innerHTML = '<p class="text-[10px] font-black uppercase tracking-widest opacity-20 py-10">Failed to load trending scoreboard.</p>';
  }
}

function renderTrendingUpcoming(matches) {
  const trendingList = document.getElementById('trending-matches-list');
  if (!trendingList) return;

  if (matches.length === 0) {
    trendingList.innerHTML = '<p class="text-[10px] font-black uppercase tracking-widest opacity-20 py-10">No trending matches discovered</p>';
    return;
  }

  trendingList.innerHTML = matches.map(match => `
    <a href="${buildMatchUrl(match)}" class="flex items-center gap-6 p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group border border-white/5 hover:border-primary/20">
      <div class="flex flex-col items-center gap-2 shrink-0">
        <img src="${getSafeImageUrl(match.homeTeam.logo, FALLBACK_LOGO)}" class="w-8 h-8 object-contain opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" onerror="this.src='${FALLBACK_LOGO}'">
        <img src="${getSafeImageUrl(match.awayTeam.logo, FALLBACK_LOGO)}" class="w-8 h-8 object-contain opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" onerror="this.src='${FALLBACK_LOGO}'">
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <div class="text-[9px] font-black text-primary uppercase tracking-[0.2em] line-clamp-1">${match.league || 'TRENDING EVENT'}</div>
          <span class="text-[8px] font-black uppercase tracking-widest ${match.status === 'live' ? 'text-primary' : 'text-on-surface/40'}">${match.status === 'live' ? 'LIVE' : (match.status === 'upcoming' ? 'NEXT' : 'FINAL')}</span>
        </div>
        <h4 class="text-xs font-bold uppercase truncate mb-1">${match.homeTeam.name} VS ${match.awayTeam.name}</h4>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[10px] text-on-surface/40">${match.status === 'finished' ? 'history' : 'schedule'}</span>
          <span class="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">${match.status === 'upcoming' ? formatHeroClock(match) : (match.time || match.statusText || 'FINAL')}</span>
        </div>
      </div>
    </a>
  `).join('');
}

// --- FETCH & RENDER NEWS ---
// --- FETCH NEWS ---
async function fetchNews() {
  const isNewsPage = isCurrentPage('news');
  if (!document.getElementById('news-grid-container') && !document.getElementById('latest-headlines-container') && !isNewsPage) return;
  
  try {
    const res = await fetch(buildApiUrl(API_BLOG, {
      sport: currentTab || 'all',
      league: currentLeagueFilter || undefined,
      limit: 40
    }));
    const data = await res.json();
    let articles = data.posts || data.trending || [];
    window._cachedNews = articles;
    
    // Sort or filter if needed
    renderNews(articles);

    if (isNewsPage) {
       if (data.meta) {
         updateBlogSeo({
           sport: currentTab || 'all',
           league: currentLeagueFilter || '',
           sportLabel: data.meta.sportLabel || '',
           seoTitle: `${data.meta.sportLabel || 'Sports'} news blog hub | LivescoreFree`,
           seoDescription: data.meta.leagueLabel
             ? `Permanent ${data.meta.sportLabel || 'sports'} blog coverage and fan stories for ${data.meta.leagueLabel}.`
             : 'Permanent sports blog coverage and fan stories generated from public source updates.'
         }, 'website');
       }
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

// Alias for backward compatibility
async function fetchFeaturedAnalysis() {
  return fetchFeaturedAnalysisNewsPage();
}

async function fetchFeaturedAnalysisNewsPage() {
  const container = document.getElementById('match-of-the-week');
  if (!container) return;
  try {
    const res = await fetch(buildApiUrl(API_LIVE, {
      sport: 'soccer',
      league: 'eng.1'
    }));
    const data = await res.json();
    let matches = data.matches || [];
    let featured = matches.find(m => m.status === 'finished' || m.status === 'post') || matches[0];
    if (!featured) return;
    container.innerHTML = `
      <div class="bg-gradient-to-r from-primary-container to-transparent p-6 border-b border-white/10">
        <h2 class="text-2xl font-black uppercase italic tracking-tighter">Match Of The Week</h2>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3">
        <div class="p-8 border-r border-white/5 space-y-8">
          <div class="text-center space-y-2">
            <p class="text-[10px] font-black uppercase text-primary">${featured.homeTeam.name} vs ${featured.awayTeam.name}</p>
            <p class="text-4xl font-black font-headline">${featured.homeTeam.score} - ${featured.awayTeam.score}</p>
            <p class="text-[10px] font-bold uppercase text-on-surface/40">${featured.statusText || featured.time || 'Match Centre'}</p>
          </div>
          <div class="space-y-4">
            <div class="rounded-2xl bg-white/5 border border-white/5 px-4 py-4">
              <div class="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface/40 mb-2">League</div>
              <div class="font-black uppercase">${featured.league || 'Featured fixture'}</div>
            </div>
            <div class="rounded-2xl bg-white/5 border border-white/5 px-4 py-4">
              <div class="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface/40 mb-2">Venue</div>
              <div class="font-black uppercase">${featured.venue || 'Venue pending'}</div>
            </div>
          </div>
        </div>
        <div class="p-8 border-r border-white/5 flex flex-col items-center justify-center bg-black/20">
          <p class="text-[10px] font-black uppercase text-on-surface/40 mb-4">Team Records</p>
          <div class="grid gap-4 w-full">
            <div class="rounded-2xl border border-white/5 bg-white/5 px-5 py-4">
              <div class="flex items-center gap-3">
                <img src="${featured.homeTeam.logo}" class="w-10 h-10 object-contain" onerror="this.src='${FALLBACK_LOGO}'">
                <div>
                  <div class="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40">${featured.homeTeam.name}</div>
                  <div class="text-lg font-black">${featured.homeTeam.record || 'Record unavailable'}</div>
                </div>
              </div>
            </div>
            <div class="rounded-2xl border border-white/5 bg-white/5 px-5 py-4">
              <div class="flex items-center gap-3">
                <img src="${featured.awayTeam.logo}" class="w-10 h-10 object-contain" onerror="this.src='${FALLBACK_LOGO}'">
                <div>
                  <div class="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40">${featured.awayTeam.name}</div>
                  <div class="text-lg font-black">${featured.awayTeam.record || 'Record unavailable'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="p-8 space-y-6">
          <h4 class="text-xs font-black uppercase text-primary tracking-widest">Realtime Snapshot</h4>
          <p class="text-[11px] text-on-surface-variant leading-relaxed">${featured.status === 'live' ? 'This fixture is active right now.' : 'This matchup is part of the current live board.'}</p>
          <a href="${buildMatchUrl(featured)}" class="block w-full py-3 text-center bg-surface-container-high border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Open Match Centre</a>
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
      <a href="${buildPlayerProfileUrl({ ...a, sport: 'soccer', league: 'eng.1' }, 'soccer', 'eng.1')}" class="bg-surface-container rounded-lg overflow-hidden border border-white/5 hover:border-primary/50 transition-all block">
        <div class="relative h-48 bg-gradient-to-t from-surface-container to-surface-container-high">
          <img src="${a.headshot?.href || '/public/logo.png'}" class="absolute bottom-0 left-1/2 -translate-x-1/2 h-full object-cover filter brightness-90"/>
        </div>
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="text-[10px] font-black uppercase text-primary">Top Performer</p>
              <h4 class="text-lg font-black uppercase tracking-tighter">${a.shortName || a.fullName}</h4>
            </div>
            <span class="text-xl font-black text-secondary">${a.jersey || '--'}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
            <div class="text-center"><p class="text-[8px] uppercase text-on-surface/40">Team</p><p class="text-xs font-black">${a.team?.abbreviation || a.team?.name || 'Club'}</p></div>
            <div class="text-center"><p class="text-[8px] uppercase text-on-surface/40">Pos</p><p class="text-xs font-black">${a.position?.abbreviation || a.position?.displayName || 'N/A'}</p></div>
            <div class="text-center"><p class="text-[8px] uppercase text-on-surface/40">Status</p><p class="text-xs font-black">${a.status?.name || 'Active'}</p></div>
          </div>
        </div>
      </a>
    `).join('');
  } catch(e){}
}

function renderNewsHero(articles) {
  const container = document.getElementById('hero-slider-container');
  if (!container || articles.length === 0) return;
  container.style.display = 'block';
  const a = articles[0]; // main article
  container.innerHTML = `
    <div class="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style="background-image: url('${getArticleImageUrl(a)}')"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
    <div class="relative h-full flex flex-col justify-end p-8 md:p-16 space-y-6">
      <div class="flex items-center gap-3">
        <span class="bg-primary text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm">NEWS BLOG HUB</span>
        <span class="text-white/60 text-xs font-bold uppercase tracking-tighter">${a.vertical || a.categories?.[0]?.name || 'Sports'}</span>
        <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/60">
          <img src="${getSourceFaviconUrl(a.source)}" alt="" class="h-4 w-4 rounded-full" onerror="this.src='${FALLBACK_LOGO}'">
          ${(a.source?.domain || a.source?.name || a.sportLabel || 'Source')}
        </span>
      </div>
      <div class="space-y-2">
        <h1 class="text-5xl md:text-7xl font-black font-headline uppercase leading-tight tracking-tighter text-white drop-shadow-2xl max-w-4xl">
            ${a.title || a.headline}
        </h1>
      </div>
      <p class="max-w-2xl text-on-surface-variant text-sm md:text-lg font-medium opacity-80 border-l-4 border-primary pl-4">
          ${a.excerpt || a.description || 'Follow the latest rewritten stories from the sports world.'}
      </p>
      <div class="flex gap-4 pt-4">
        <a href="${getArticleLinkUrl(a)}" target="${getArticleLinkTarget(a)}" class="bg-primary text-on-primary px-10 py-4 font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
          <span class="material-symbols-outlined">article</span> Read Blog Story
        </a>
        <a href="${buildBlogHubUrl(a.sport || currentTab || 'all', a.league || currentLeagueFilter || '')}" class="bg-white/5 border border-white/10 px-10 py-4 font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-transform flex items-center gap-2">
          <span class="material-symbols-outlined">grid_view</span> View Hub
        </a>
      </div>
    </div>
  `;
}

function renderNewsVideos(articles) {
  const container = document.getElementById('video-highlights-gallery');
  if (!container) return;
  container.innerHTML = articles.map(a => `
    <a class="group cursor-pointer block" href="${getArticleLinkUrl(a)}" target="${getArticleLinkTarget(a)}">
      <div class="relative aspect-video bg-cover bg-center rounded-lg overflow-hidden border border-white/10" style="background-image: url('${getArticleImageUrl(a)}')">
        <div class="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="material-symbols-outlined text-4xl text-white opacity-80 group-hover:scale-125 transition-transform" style="font-variation-settings: 'FILL' 1;">article</span>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-on-surface/40">
        <img src="${getSourceFaviconUrl(a.source)}" alt="" class="h-4 w-4 rounded-full" onerror="this.src='${FALLBACK_LOGO}'">
        <span>${a.source?.domain || a.source?.name || a.sportLabel || 'Source'}</span>
      </div>
      <p class="mt-2 text-[10px] font-black uppercase tracking-tighter line-clamp-2">${a.title || a.headline}</p>
    </a>
  `).join('');
}

function renderTrendingSidebar(articles) {
  const container = document.getElementById('trending-sidebar-list');
  if (!container) return;
  container.innerHTML = articles.map(a => `
    <a class="block group" href="${getArticleLinkUrl(a)}" target="${getArticleLinkTarget(a)}">
      <div class="flex items-center gap-2 text-[8px] font-black uppercase text-on-surface/30">
        <img src="${getSourceFaviconUrl(a.source)}" alt="" class="h-4 w-4 rounded-full" onerror="this.src='${FALLBACK_LOGO}'">
        <span>#${(a.vertical || a.categories?.[0]?.name || 'TRENDING').replace(/\\s+/g, '')}</span>
      </div>
      <p class="text-sm font-bold uppercase group-hover:text-primary transition-colors mt-1 line-clamp-2">${a.title || a.headline}</p>
    </a>
  `).join('');
}

function renderNews(articles) {
  const nc = document.getElementById('news-grid-container');
  const hc = document.getElementById('latest-headlines-container');
  if (!articles.length) {
    if (nc) {
      nc.innerHTML = '<div class="col-span-full rounded-2xl border border-white/5 bg-white/5 px-6 py-24 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">No live headlines available right now</div>';
    }
    if (hc) {
      hc.innerHTML = '<div class="rounded-2xl border border-white/5 bg-white/5 px-6 py-24 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">No deeper stories available right now</div>';
    }
    return;
  }

  if (nc) {
    nc.innerHTML = articles.slice(0, 4).map(article => `
      <a href="${getArticleLinkUrl(article)}" target="${getArticleLinkTarget(article)}" class="relative bg-surface-container rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all group cursor-pointer flex flex-col h-full block">
        <div class="aspect-video bg-cover bg-center transition-transform duration-[1.5s] group-hover:scale-110" 
             style="background-image: linear-gradient(to top, rgba(14,14,14,0.9), transparent), url('${getArticleImageUrl(article)}')"></div>
        <div class="p-6 relative flex flex-col flex-1">
          <div class="flex justify-between items-center mb-4 gap-3">
            <span class="bg-primary text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">${article.vertical || article.categories?.[0]?.name || 'SPORTS'}</span>
            <span class="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-on-surface/40">
              <img src="${getSourceFaviconUrl(article.source)}" alt="" class="h-4 w-4 rounded-full" onerror="this.src='${FALLBACK_LOGO}'">
              ${(article.source?.domain || article.source?.name || article.sportLabel || 'Source')}
            </span>
          </div>
          <h3 class="text-xl font-black italic uppercase leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-4 drop-shadow-md">
            ${article.title || article.headline}
          </h3>
          <p class="text-sm text-on-surface/60 leading-relaxed line-clamp-3">${article.excerpt || article.description || ''}</p>
        </div>
      </a>
    `).join('');
  }

  if (hc) {
    hc.innerHTML = articles.slice(4).map((article, idx) => `
      <a href="${getArticleLinkUrl(article)}" target="${getArticleLinkTarget(article)}" class="flex flex-col md:flex-row gap-8 group cursor-pointer border-b border-white/5 pb-12 last:border-0 opacity-0 translate-y-10 transition-all duration-700 headline-expansion-item">
        <div class="md:w-1/4 aspect-[16/9] bg-cover bg-center rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg" 
             style="background-image: url('${getArticleImageUrl(article)}')"></div>
        <div class="flex-1 space-y-4">
          <div class="flex items-center gap-3 flex-wrap">
             <span class="text-primary text-[10px] font-black uppercase tracking-widest">${article.vertical || article.categories?.[0]?.name || 'HUB'}</span>
             <span class="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-on-surface/40">
               <img src="${getSourceFaviconUrl(article.source)}" alt="" class="h-4 w-4 rounded-full" onerror="this.src='${FALLBACK_LOGO}'">
               ${(article.source?.domain || article.source?.name || article.sportLabel || 'Source')}
             </span>
          </div>
          <h4 class="text-2xl font-black italic uppercase leading-none group-hover:text-primary transition-all tracking-tighter">${article.title || article.headline}</h4>
          <p class="text-sm text-on-surface/60 font-medium leading-relaxed line-clamp-2 max-w-3xl">${article.excerpt || article.description || ''}</p>
        </div>
      </a>
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
    const res = await fetch(buildApiUrl(API_LIVE, {
      sport: currentTab || 'all',
      league: currentLeagueFilter || undefined
    }));
    const data = await res.json();
    const matches = filterRenderableMatches(data.matches || []);
    const allLive = matches.filter(m => m.status === 'live');
    
    // Update global caches
    window._cachedMatches = matches;
    window._cachedLiveMatches = allLive;

    // Delegate to renderers
    renderSidebarLive(allLive.slice(0, 5));

    const liveCountText = document.getElementById('live-count-text');
    if (liveCountText) {
      liveCountText.textContent = allLive.length > 0 ? `${allLive.length} LIVE NOW` : 'NO LIVE GAMES';
    }

    if (tickerContainer) {
      renderTicker(combineMatchPools(allLive, window._cachedUpcoming || [], window._cachedResults || []));
      updatePageTitle(allLive);
    }
  } catch (err) {
    console.error('Sidebar fetch error:', err);
  }
}

// --- UPDATE PAGE TITLE WITH LIVE SCORES ---
function updatePageTitle(liveMatches) {
  const pageKey = getPageKeyFromPath(window.location.pathname);
  if (!['index', 'live', 'results', 'trending'].includes(pageKey)) return;

  if (liveMatches.length > 0) {
    const m = liveMatches[0];
    document.title = `(${m.homeTeam.score}-${m.awayTeam.score}) ${m.homeTeam.name} vs ${m.awayTeam.name} | LiveScoreFree`;
  } else {
    updateDefaultPageSeo(pageKey);
  }
}

// --- RENDER TABS ---
function renderTabs() {
  if (!tabsContainer) return;
  tabsContainer.innerHTML = SPORTS.map(sport => `
    <button 
      onclick="switchTab('${sport.id}')"
      class="flex-none px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-all
      ${currentTab === normalizeSportSlug(sport.id)
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
  currentTab = normalizeSportSlug(tabId);
  currentLeagueFilter = '';

  // Update URL search params without reload for persistence
  const url = new URL(window.location);
  if (currentTab && currentTab !== 'all') url.searchParams.set('s', currentTab);
  else url.searchParams.delete('s');
  url.searchParams.delete('l');
  url.searchParams.delete('sport');
  url.searchParams.delete('league');
  window.history.pushState({}, '', url);
  updateDefaultPageSeo();

  renderTabs();
  if (resultsLeagueFilter) renderResultsLeagueFilter([]);
  
  // Update Realtime subscription
  realtime.updateSubscription('live', { sport: currentTab, isLive: true });

  if (matchesContainer) {
    matchesContainer.innerHTML = Array(3).fill(`
      <div class="bg-surface-container border border-white/5 p-6 rounded-lg animate-pulse h-48"></div>
    `).join('');
  }

  if (window.location.pathname.includes('upcoming') && typeof window.fetchScheduleCentre === 'function') {
    window.fetchScheduleCentre();
    return;
  }

  fetchMatches(currentPageFilter);
}

// --- FETCH & UPDATE HOME DATA ---
async function fetchMatches(statusFilter = null, sidebarOnly = false) {
  const isUpcomingPage = window.location.pathname.includes('upcoming');
  const isTrendingPage = window.location.pathname.includes('trending');
  const feedParams = getCurrentFeedParams();
  
  try {
    if (isTrendingPage && !isUpcomingPage) {
      const feed = await fetchCompositeMatchFeeds({
        sport: feedParams.sport,
        league: feedParams.league,
        upcomingDays: 4,
        resultsDays: 4
      });
      const matches = combineMatchPools(
        feed.liveMatches,
        feed.upcomingMatches,
        feed.finishedMatches
      );
      window._cachedMatches = matches;

      updateFeedRibbon(feed.meta.live || feed.meta.upcoming || feed.meta.results || {}, {
        feedLabel: 'Trending scoreboard',
        matchCount: matches.length,
        liveCount: feed.liveMatches.length
      });

      if (sidebarLiveContainer) {
        renderSidebarLive(feed.liveMatches.slice(0, 5));
      }
      if (tickerContainer) {
        renderTicker(matches);
        updatePageTitle(feed.liveMatches);
      }
      if (sidebarOnly) return;
      renderMatches(matches.slice(0, 18));
      return;
    }

    // On upcoming page, use dedicated upcoming API for real fixture data
    let apiUrl;
    if (isUpcomingPage && statusFilter === 'upcoming') {
      apiUrl = buildApiUrl(API_UPCOMING, {
        sport: feedParams.sport,
        league: feedParams.league,
        days: 7
      });
    } else {
      apiUrl = buildApiUrl(API_LIVE, {
        sport: feedParams.sport,
        league: feedParams.league
      });
    }
    
    const res = await fetch(apiUrl, { cache: 'no-store' });
    const data = await res.json();
    let matches = filterRenderableMatches(data.matches || []);
    window._cachedMatches = matches;

    // On upcoming page with upcoming API, sidebar/ticker need live data separately
    if (isUpcomingPage && statusFilter === 'upcoming') {
      updateFeedRibbon(data.meta || {}, {
        feedLabel: 'Schedule feed',
        matchCount: matches.length,
        liveCount: 0
      });
      window._cachedUpcoming = matches;
      window._cachedUpcomingMatches = matches;
      // Fetch live data for sidebar/ticker only
      if (sidebarLiveContainer || tickerContainer) {
        try {
          const liveRes = await fetch(buildApiUrl(API_LIVE, {
            sport: feedParams.sport,
            league: feedParams.league
          }), { cache: 'no-store' });
          const liveData = await liveRes.json();
          const liveMatches = filterRenderableMatches(liveData.matches || []).filter(m => m.status === 'live');
          window._cachedLiveMatches = liveMatches;
          if (sidebarLiveContainer) renderSidebarLive(liveMatches.slice(0, 5));
          if (tickerContainer) { renderTicker(combineMatchPools(liveMatches, matches, window._cachedResults || [])); updatePageTitle(liveMatches); }
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
        renderTicker(combineMatchPools(matches, window._cachedUpcoming || [], window._cachedResults || []));
        updatePageTitle(liveMatches);
      }
      if (sidebarOnly) return;
      if (statusFilter === 'finished') {
        const resultsFeed = await fetchFinishedResultsFeed({
          ...feedParams,
          days: isResultsHubPage() ? 6 : 4
        });
        matches = resultsFeed.matches;
        matches = matches.filter((match) => match.status === 'finished');
        window._cachedResults = matches;
        window._cachedMatches = matches;
        updateFeedRibbon(resultsFeed.meta || data.meta || {}, {
          feedLabel: 'Results feed',
          matchCount: matches.length,
          liveCount: 0
        });
        if (isResultsHubPage()) {
          renderResultsLeagueFilter(matches);
        }
        if (tickerContainer) {
          renderTicker(combineMatchPools(window._cachedLiveMatches || [], window._cachedUpcoming || [], matches));
        }
      } else {
        updateFeedRibbon(data.meta || {}, {
          feedLabel: statusFilter === 'finished' ? 'Results feed' : 'Match feed',
          matchCount: matches.length,
          liveCount: matches.filter((match) => match.status === 'live').length
        });
      }
      if (statusFilter && statusFilter !== 'finished') {
        matches = matches.filter(m => m.status === statusFilter);
      }
      matches = sortMatchesForDisplay(matches, statusFilter);
      if (isResultsHubPage()) {
        updateResultsSectionMeta(matches);
      }
      renderMatches(isResultsHubPage() ? matches.filter((match) => match.status === 'finished') : matches);
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
    <a href="${buildMatchUrl(match)}" class="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all group border border-white/5 hover:border-primary/20">
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

function formatBlogDate(value = '') {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return 'Fresh update';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatBlogMetaLine(post = {}) {
  const parts = [
    post.sportLabel || '',
    post.vertical || '',
    `${post.readingTime || 4} min read`
  ].filter(Boolean);
  return parts.join(' - ');
}

function renderBlogSportTabs(currentSport = 'all', league = '') {
  const container = document.getElementById('blog-sport-tabs');
  if (!container) return;
  const tabs = SPORTS.filter((sport) =>
    ['all', 'soccer', 'basketball', 'american-football', 'hockey', 'baseball', 'cricket', 'tennis', 'mma', 'racing', 'golf', 'rugby'].includes(sport.id)
  );
  container.innerHTML = tabs.map((sport) => {
    const isActive = sport.id === currentSport;
    return `
      <a href="${buildBlogHubUrl(sport.id, sport.id === currentSport ? league : '')}"
         class="flex-none px-5 py-3 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'border-primary bg-primary text-white' : 'border-white/10 bg-white/5 text-on-surface/55 hover:border-primary/40 hover:text-white'}">
        ${sport.name}
      </a>
    `;
  }).join('');
}

function buildBlogPostCard(post = {}, options = {}) {
  const compact = options.compact === true;
  const href = buildBlogArticleUrl(post);
  return `
    <article class="lsf-blog-card bg-surface-container rounded-[1.75rem] overflow-hidden border border-white/5 hover:border-primary/30 transition-all group">
      <a href="${href}" class="block">
        <div class="relative ${compact ? 'h-44' : 'h-56'} overflow-hidden">
          <img src="${getSafeImageUrl(post.image, FALLBACK_HERO_IMAGE)}" alt="${escapeHtml(post.title || post.headline || 'Sports blog story')}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onerror="this.src='${FALLBACK_HERO_IMAGE}'">
          <div class="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/35 to-transparent"></div>
          <div class="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-[#0e0e0e]/70 px-3 py-2 backdrop-blur-md">
            <img src="${getSourceFaviconUrl(post.source)}" alt="" class="h-4 w-4 rounded-full object-cover" onerror="this.src='${FALLBACK_LOGO}'">
            <span class="text-[9px] font-black uppercase tracking-[0.18em] text-primary">${escapeHtml(post.vertical || post.sportLabel || 'Fan Brief')}</span>
          </div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/35">
            <span>${escapeHtml(post.sportLabel || 'Sports')}</span>
            <span class="h-1 w-1 rounded-full bg-white/20"></span>
            <span>${escapeHtml(formatBlogDate(post.published))}</span>
          </div>
          <h3 class="mt-4 text-2xl font-black italic uppercase tracking-tighter leading-[0.92] group-hover:text-primary transition-colors">${escapeHtml(post.title || post.headline || 'Editorial update')}</h3>
          <p class="mt-4 text-sm leading-7 text-on-surface/65">${escapeHtml(post.excerpt || post.description || '')}</p>
          <div class="mt-5 flex items-center justify-between gap-4">
            <span class="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/35">${escapeHtml(formatBlogMetaLine(post))}</span>
            <span class="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Open Story <span class="material-symbols-outlined text-base">arrow_outward</span></span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function renderSportEditorialSection(payload = {}, sport = 'all', league = '') {
  const featureContainer = document.getElementById('sport-blog-featured-container');
  const listContainer = document.getElementById('sport-blog-stack-container');
  const hubLink = document.getElementById('sport-blog-link');
  if (!featureContainer || !listContainer) return;

  if (hubLink) {
    hubLink.href = buildBlogHubUrl(sport, league);
  }

  const posts = payload.posts || [];
  const featured = payload.featured || posts[0];

  if (!featured) {
    featureContainer.innerHTML = '<div class="rounded-[1.75rem] border border-white/5 bg-white/5 px-6 py-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Editorial feed warming up</div>';
    listContainer.innerHTML = '';
    return;
  }

  featureContainer.innerHTML = `
    <article class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#09111b]">
      <img src="${getSafeImageUrl(featured.image, FALLBACK_HERO_IMAGE)}" alt="${escapeHtml(featured.title || featured.headline || 'Featured editorial')}" class="absolute inset-0 h-full w-full object-cover opacity-35" onerror="this.src='${FALLBACK_HERO_IMAGE}'">
      <div class="absolute inset-0 bg-gradient-to-br from-[#06101a] via-[#0e0e0e]/88 to-[#0e0e0e]"></div>
      <div class="relative p-8 md:p-10">
        <div class="flex flex-wrap items-center gap-3">
          <span class="rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary">${escapeHtml(featured.vertical || 'Editorial Pulse')}</span>
          <span class="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/40">${escapeHtml(featured.leagueLabel || featured.sportLabel || 'Sports')}</span>
        </div>
        <h3 class="mt-6 max-w-3xl text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-[0.92]">${escapeHtml(featured.title || featured.headline || 'Featured editorial')}</h3>
        <p class="mt-5 max-w-2xl text-base leading-8 text-on-surface/72">${escapeHtml(featured.excerpt || '')}</p>
        <div class="mt-8 flex flex-wrap items-center gap-4">
          <a href="${buildBlogArticleUrl(featured)}" class="kinetic-gradient inline-flex items-center gap-3 rounded-xl px-7 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-white">Read blog story <span class="material-symbols-outlined text-base">north_east</span></a>
          <a href="${buildBlogHubUrl(sport, league)}" class="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-7 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface hover:bg-white/10">Open full hub</a>
        </div>
      </div>
    </article>
  `;

  listContainer.innerHTML = posts.slice(1, 5).map((post) => `
    <a href="${buildBlogArticleUrl(post)}" class="block rounded-[1.5rem] border border-white/5 bg-surface-container p-5 hover:border-primary/30 hover:bg-surface-container-high transition-all group">
      <div class="flex gap-4">
        <img src="${getSafeImageUrl(post.image, FALLBACK_HERO_IMAGE)}" alt="${escapeHtml(post.title || post.headline || 'Editorial story')}" class="h-24 w-24 rounded-2xl object-cover" onerror="this.src='${FALLBACK_HERO_IMAGE}'">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-on-surface/35">
            <img src="${getSourceFaviconUrl(post.source)}" alt="" class="h-4 w-4 rounded-full" onerror="this.src='${FALLBACK_LOGO}'">
            <span>${escapeHtml(post.vertical || post.sportLabel || 'Editorial')}</span>
          </div>
          <h4 class="mt-3 text-lg font-black italic uppercase leading-tight tracking-tighter group-hover:text-primary transition-colors line-clamp-3">${escapeHtml(post.title || post.headline || 'Editorial story')}</h4>
          <p class="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface/35">${escapeHtml(formatBlogMetaLine(post))}</p>
        </div>
      </div>
    </a>
  `).join('');
}

function renderBlogHubPage(payload = {}, sport = 'all', league = '') {
  const featuredContainer = document.getElementById('blog-featured-spotlight');
  const trendingContainer = document.getElementById('blog-trending-list');
  const gridContainer = document.getElementById('blog-grid-container');
  const sectionsContainer = document.getElementById('blog-sections-container');
  const sectionLabel = document.getElementById('blog-hub-section-label');
  const sectionCopy = document.getElementById('blog-hub-section-copy');
  if (!featuredContainer || !trendingContainer || !gridContainer || !sectionsContainer) return;

  renderBlogSportTabs(sport, league);

  const posts = payload.posts || [];
  const featured = payload.featured || posts[0];

  if (sectionLabel) {
    sectionLabel.textContent = payload.meta?.sportLabel ? `${payload.meta.sportLabel} editorial hub` : 'Evergreen sports editorial';
  }

  if (sectionCopy) {
    sectionCopy.textContent = featured?.excerpt || 'Long-form fan guides, evergreen analysis, and rewritten sports blog coverage built from public updates.';
  }

  if (featured) {
    updateBlogSeo({
      ...featured,
      sport,
      league,
      seoTitle: `${payload.meta?.sportLabel || featured.sportLabel || 'Sports'} editorial hub | LivescoreFree`,
      seoDescription: payload.meta?.leagueLabel
        ? `Evergreen ${payload.meta.sportLabel || featured.sportLabel || 'sports'} blog coverage and fan guides for ${payload.meta.leagueLabel}.`
        : (featured.excerpt || featured.seoDescription || 'Evergreen sports fan guides and editorial blog coverage.')
    }, 'website');
    featuredContainer.innerHTML = `
      <article class="relative min-h-[540px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#08141d]">
        <img src="${getSafeImageUrl(featured.image, FALLBACK_HERO_IMAGE)}" alt="${escapeHtml(featured.title || featured.headline || 'Featured story')}" class="absolute inset-0 h-full w-full object-cover opacity-40" onerror="this.src='${FALLBACK_HERO_IMAGE}'">
        <div class="absolute inset-0 bg-gradient-to-b from-[#163947]/70 via-[#071019]/88 to-[#05080d]"></div>
        <div class="relative flex h-full flex-col justify-end p-8 md:p-10">
          <div class="flex flex-wrap items-center gap-3">
            <span class="rounded-full bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">Trending now</span>
            <span class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/65">${escapeHtml(featured.vertical || 'Fan Brief')}</span>
          </div>
          <h1 class="mt-6 max-w-4xl text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.92]">${escapeHtml(featured.title || featured.headline || 'Featured blog story')}</h1>
          <p class="mt-5 max-w-3xl text-base md:text-lg leading-8 text-on-surface/72">${escapeHtml(featured.excerpt || '')}</p>
          <div class="mt-6 flex flex-wrap items-center gap-5 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface/38">
            <span>${escapeHtml(formatBlogDate(featured.published))}</span>
            <span>${escapeHtml(formatBlogMetaLine(featured))}</span>
            <span class="inline-flex items-center gap-2">
              <img src="${getSourceFaviconUrl(featured.source)}" alt="" class="h-4 w-4 rounded-full" onerror="this.src='${FALLBACK_LOGO}'">
              ${escapeHtml(featured.source?.domain || featured.source?.name || 'Source')}
            </span>
          </div>
          <div class="mt-8 flex flex-wrap gap-4">
            <a href="${buildBlogArticleUrl(featured)}" class="kinetic-gradient inline-flex items-center gap-3 rounded-xl px-7 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-white">Read feature <span class="material-symbols-outlined text-base">north_east</span></a>
            <a href="${buildSportHubUrl(sport, league)}" class="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-7 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface hover:bg-white/10">Open sport hub</a>
          </div>
        </div>
      </article>
    `;
  } else {
    featuredContainer.innerHTML = '<div class="rounded-[2rem] border border-white/5 bg-white/5 px-8 py-24 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">No editorial stories available</div>';
  }

  trendingContainer.innerHTML = (payload.trending || posts.slice(0, 4)).map((post, index) => `
    <a href="${buildBlogArticleUrl(post)}" class="flex items-start gap-4 rounded-[1.5rem] border border-white/5 bg-surface-container p-4 hover:border-primary/30 hover:bg-surface-container-high transition-all group">
      <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/5">
        <img src="${getSafeImageUrl(post.image, FALLBACK_HERO_IMAGE)}" alt="${escapeHtml(post.title || post.headline || 'Trending story')}" class="h-full w-full object-cover" onerror="this.src='${FALLBACK_HERO_IMAGE}'">
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary">
          <span>#${index + 1}</span>
          <span>${escapeHtml(post.sportLabel || 'Sports')}</span>
        </div>
        <h4 class="mt-2 text-lg font-black italic uppercase leading-tight tracking-tighter group-hover:text-primary transition-colors line-clamp-3">${escapeHtml(post.title || post.headline || 'Trending story')}</h4>
        <p class="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/35">${escapeHtml(formatBlogMetaLine(post))}</p>
      </div>
    </a>
  `).join('');

  gridContainer.innerHTML = posts.slice(1, 7).map((post) => buildBlogPostCard(post)).join('');

  sectionsContainer.innerHTML = (payload.sections || []).map((section) => `
    <section class="rounded-[2rem] border border-white/5 bg-[#08111b] p-6 md:p-8">
      <div class="mb-6 flex items-center justify-between gap-4">
        <h2 class="text-2xl font-black italic uppercase tracking-tighter text-on-surface">${escapeHtml(section.title || 'Editorial focus')}</h2>
        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">${(section.items || []).length} stories</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${(section.items || []).map((post) => buildBlogPostCard(post, { compact: true })).join('')}
      </div>
    </section>
  `).join('');
}

function renderBlogArticlePage(post = {}, relatedPosts = []) {
  const hero = document.getElementById('blog-article-hero');
  const eyebrow = document.getElementById('blog-article-eyebrow');
  const title = document.getElementById('blog-article-title');
  const excerpt = document.getElementById('blog-article-excerpt');
  const meta = document.getElementById('blog-article-meta');
  const body = document.getElementById('blog-article-body');
  const source = document.getElementById('blog-source-card');
  const related = document.getElementById('blog-related-list');
  const nextStories = document.getElementById('blog-next-stories');
  const schema = document.getElementById('blog-jsonld');
  if (!hero || !title || !body) return;

  updateBlogSeo(post, 'article');

  hero.innerHTML = `
    <div class="absolute inset-0">
      <img src="${getSafeImageUrl(post.image, FALLBACK_HERO_IMAGE)}" alt="${escapeHtml(post.title || post.headline || 'Article artwork')}" class="h-full w-full object-cover opacity-40" onerror="this.src='${FALLBACK_HERO_IMAGE}'">
      <div class="absolute inset-0 bg-gradient-to-b from-[#04111c]/40 via-[#05070b]/82 to-[#0e0e0e]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(204,22,22,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(47,110,255,0.12),transparent_35%)]"></div>
    </div>
  `;

  if (eyebrow) eyebrow.textContent = post.vertical || `${post.sportLabel || 'Sports'} editorial`;
  title.textContent = post.title || post.headline || 'Editorial story';
  if (excerpt) excerpt.textContent = post.excerpt || post.description || '';
  if (meta) {
    meta.innerHTML = `
      <span>${escapeHtml(formatBlogDate(post.published))}</span>
      <span class="h-1 w-1 rounded-full bg-white/20"></span>
      <span>${escapeHtml(formatBlogMetaLine(post))}</span>
      <span class="h-1 w-1 rounded-full bg-white/20"></span>
      <span class="inline-flex items-center gap-2">
        <img src="${getSourceFaviconUrl(post.source)}" alt="" class="h-4 w-4 rounded-full" onerror="this.src='${FALLBACK_LOGO}'">
        ${escapeHtml(post.source?.domain || post.source?.name || 'Source')}
      </span>
    `;
  }

  body.innerHTML = `
    ${(post.sections || []).map((section, index) => `
      <section class="lsf-article-section ${index === 0 ? '' : 'mt-14'}">
        <h2>${escapeHtml(section.heading || 'Editorial section')}</h2>
        ${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      </section>
    `).join('')}
    <blockquote>${escapeHtml(post.quote || 'The headline matters, but the trend behind it matters more for supporters.')}</blockquote>
  `;

  if (source) {
    source.innerHTML = `
      <div class="flex items-start gap-4">
        <img src="${getSourceFaviconUrl(post.source)}" alt="" class="h-12 w-12 rounded-2xl bg-white p-2 object-contain" onerror="this.src='${FALLBACK_LOGO}'">
        <div class="min-w-0 flex-1">
          <div class="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Source reference</div>
          <h3 class="mt-2 text-xl font-black uppercase tracking-tighter">${escapeHtml(post.source?.name || post.source?.domain || 'Public sports source')}</h3>
          <p class="mt-3 text-sm leading-7 text-on-surface/65">This evergreen blog version rewrites the public update into a long-form fan brief while linking back to the original reporting source.</p>
          <div class="mt-5 flex flex-wrap gap-3">
            ${post.source?.url ? `<a href="${post.source.url}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface hover:bg-white/10">Visit original source <span class="material-symbols-outlined text-base">open_in_new</span></a>` : ''}
            <span class="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-primary">${escapeHtml(post.source?.domain || 'trusted sports feed')}</span>
          </div>
        </div>
      </div>
    `;
  }

  if (related) {
    const matches = [post.relatedMatch, ...(post.relatedMatches || [])].filter(Boolean);
    related.innerHTML = matches.length ? matches.map((match) => `
      <a href="${buildMatchUrl(match)}" class="block rounded-[1.5rem] border border-white/5 bg-surface-container p-4 hover:border-primary/30 hover:bg-surface-container-high transition-all group">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-[9px] font-black uppercase tracking-[0.2em] text-primary">${escapeHtml(match.league || 'Match watch')}</div>
            <h4 class="mt-2 text-lg font-black uppercase tracking-tighter">${escapeHtml(match.homeTeam.name)} vs ${escapeHtml(match.awayTeam.name)}</h4>
            <p class="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/35">${escapeHtml(match.status === 'upcoming' ? formatTickerDate(match) : (match.time || match.statusText || 'FINAL'))}</p>
          </div>
          <div class="flex flex-col items-center gap-2">
            <img src="${getSafeImageUrl(match.homeTeam.logo, FALLBACK_LOGO)}" class="h-8 w-8 object-contain" onerror="this.src='${FALLBACK_LOGO}'">
            <img src="${getSafeImageUrl(match.awayTeam.logo, FALLBACK_LOGO)}" class="h-8 w-8 object-contain" onerror="this.src='${FALLBACK_LOGO}'">
          </div>
        </div>
      </a>
    `).join('') : '<div class="rounded-[1.5rem] border border-white/5 bg-white/5 px-5 py-10 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Match context loading</div>';
  }

  if (nextStories) {
    nextStories.innerHTML = relatedPosts.map((entry) => `
      <a href="${buildBlogArticleUrl(entry)}" class="block rounded-[1.5rem] border border-white/5 bg-surface-container p-5 hover:border-primary/30 transition-all group">
        <div class="flex items-center gap-4">
          <img src="${getSafeImageUrl(entry.image, FALLBACK_HERO_IMAGE)}" alt="${escapeHtml(entry.title || entry.headline || 'Next story')}" class="h-20 w-20 rounded-2xl object-cover" onerror="this.src='${FALLBACK_HERO_IMAGE}'">
          <div class="min-w-0 flex-1">
            <div class="text-[9px] font-black uppercase tracking-[0.2em] text-primary">${escapeHtml(entry.vertical || entry.sportLabel || 'Editorial')}</div>
            <h4 class="mt-2 text-lg font-black italic uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors line-clamp-3">${escapeHtml(entry.title || entry.headline || 'Next story')}</h4>
          </div>
        </div>
      </a>
    `).join('');
  }

  if (schema) {
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title || post.headline || 'LivescoreFree blog article',
      description: post.excerpt || post.description || '',
      image: [new URL(post.image || FALLBACK_HERO_IMAGE, window.location.origin).toString()],
      datePublished: post.published || new Date().toISOString(),
      author: {
        "@type": "Organization",
        name: "LivescoreFree Editorial Desk"
      },
      publisher: {
        "@type": "Organization",
        name: "LivescoreFree.online",
        logo: {
          "@type": "ImageObject",
          url: new URL(FALLBACK_LOGO, window.location.origin).toString()
        }
      },
      mainEntityOfPage: new URL(buildBlogArticleUrl(post), window.location.origin).toString()
    });
  }
}

function initSportEditorialSection() {
  const featureContainer = document.getElementById('sport-blog-featured-container');
  if (!featureContainer || !window.LSFDataStore) return;
  const feedSport = currentTab || 'all';
  const feedLeague = currentLeagueFilter || getDefaultLeagueForSport(feedSport);
  window.LSFDataStore.subscribe({
    path: API_BLOG,
    params: { sport: feedSport, league: feedLeague, limit: 8 },
    refreshMs: 300000,
    maxAgeMs: 120000
  }, (snapshot) => {
    if (snapshot.status === 'loading' && !snapshot.data) {
      featureContainer.innerHTML = '<div class="rounded-[1.75rem] border border-white/5 bg-white/5 px-6 py-16 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Loading editorial pulse</div>';
      return;
    }
    if (!snapshot.data) return;
    window._cachedBlogPosts = snapshot.data.posts || [];
    renderSportEditorialSection(snapshot.data, feedSport, feedLeague);
  });
}

function initBlogHubPage() {
  const root = document.getElementById('blog-hub-page');
  if (!root || !window.LSFDataStore) return;
  const sport = currentTab || 'all';
  const league = currentLeagueFilter || '';
  window.LSFDataStore.subscribe({
    path: API_BLOG,
    params: { sport, league, limit: 14 },
    refreshMs: 300000,
    maxAgeMs: 120000
  }, (snapshot) => {
    const featuredContainer = document.getElementById('blog-featured-spotlight');
    if (snapshot.status === 'loading' && !snapshot.data) {
      if (featuredContainer) {
        featuredContainer.innerHTML = '<div class="rounded-[2rem] border border-white/5 bg-white/5 px-8 py-24 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Loading editorial hub</div>';
      }
      return;
    }
    if (!snapshot.data) return;
    window._cachedBlogPosts = snapshot.data.posts || [];
    renderBlogHubPage(snapshot.data, sport, league);
  });
}

function initBlogArticlePage() {
  const root = document.getElementById('blog-article-page');
  if (!root || !window.LSFDataStore) return;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) return;
  const sport = currentTab || 'all';
  const league = currentLeagueFilter || '';
  window.LSFDataStore.subscribe({
    path: API_BLOG,
    params: { sport, league, slug, limit: 8 },
    refreshMs: 300000,
    maxAgeMs: 120000
  }, (snapshot) => {
    const title = document.getElementById('blog-article-title');
    if (snapshot.status === 'loading' && !snapshot.data) {
      if (title) title.textContent = 'Loading editorial story';
      return;
    }
    if (!snapshot.data?.post) {
      const body = document.getElementById('blog-article-body');
      if (title) title.textContent = 'Editorial story unavailable';
      if (body) {
        body.innerHTML = '<div class="rounded-[1.5rem] border border-white/5 bg-white/5 px-6 py-16 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">This story is not available right now.</div>';
      }
      return;
    }
    renderBlogArticlePage(snapshot.data.post, snapshot.data.relatedPosts || []);
  });
}

function setMatchUnavailableState(primary = 'Match unavailable', secondary = 'Please try again shortly') {
  syncLegacyMatchHeroVisibility(false);
  document.body.classList.remove('lsf-cricket-desktop-live');
  document.body.classList.remove('lsf-generic-desktop-live');
  if (homeTeamName) homeTeamName.textContent = primary;
  if (awayTeamName) awayTeamName.textContent = secondary;
  if (homeTeamLogo) homeTeamLogo.src = FALLBACK_LOGO;
  if (awayTeamLogo) awayTeamLogo.src = FALLBACK_LOGO;
  if (homeScore) homeScore.textContent = '0';
  if (awayScore) awayScore.textContent = '0';
  if (matchClock) matchClock.textContent = '00:00';

  const upcomingTime = document.getElementById('match-time');
  const upcomingDate = document.getElementById('match-date');
  const stadiumName = document.getElementById('stadium-name');
  const leagueName = document.getElementById('league-name');
  const h2hContainer = document.getElementById('h2h-container');
  const mobileLastEvent = document.getElementById('mobile-last-event-text');
  const mobileDataIntel = document.getElementById('mobile-data-intel');
  const mobileFeed = document.getElementById('mobile-feed-list');
  const mobileLineup = document.getElementById('mobile-lineup-strip');
  const mobileOdds = document.getElementById('mobile-odds-card');

  if (upcomingTime) upcomingTime.textContent = '--:--';
  if (upcomingDate) upcomingDate.textContent = 'Unavailable';
  if (stadiumName) stadiumName.textContent = 'Details unavailable';
  if (leagueName) leagueName.textContent = 'Match centre unavailable';
  if (mobileLastEvent) mobileLastEvent.textContent = primary;
  if (mobileDataIntel) {
    mobileDataIntel.innerHTML = `<div class="lsf-mobile-card text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">${secondary}</div>`;
  }
  if (mobileFeed) {
    mobileFeed.innerHTML = `<div class="lsf-mobile-card text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Feed unavailable right now</div>`;
  }
  if (mobileLineup) {
    mobileLineup.innerHTML = `<div class="lsf-mobile-card col-span-4 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Lineups unavailable right now</div>`;
  }
  if (mobileOdds) {
    mobileOdds.innerHTML = `
      <div class="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface/45">Betting Edge</div>
      <div class="mt-3 text-sm font-bold text-on-surface/70">${secondary}</div>
    `;
  }
  if (h2hContainer) {
    h2hContainer.innerHTML = `
      <div class="py-8 text-center opacity-30 text-[10px] uppercase font-black tracking-widest">
        Match details are not available right now
      </div>
    `;
  }
}

function syncLegacyMatchHeroVisibility(hidden = false) {
  const hero = document.querySelector('.lsf-match-live-hero');
  const desktopCentre = document.querySelector('.lsf-desktop-live-centre');
  const isDesktopViewport = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(min-width: 768px)').matches;

  if (hero) {
    hero.hidden = hidden;
    hero.style.display = hidden ? 'none' : '';
    hero.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }

  if (desktopCentre) {
    desktopCentre.style.marginTop = hidden && isDesktopViewport ? '0' : '';
    desktopCentre.style.paddingTop = hidden && isDesktopViewport ? '1.5rem' : '';
  }
}

// --- FETCH & UPDATE MATCH DETAIL ---
async function fetchMatchDetail(id, sport = 'soccer', league = 'eng.1') {
  syncLegacyMatchHeroVisibility(true);
  try {
    const result = await fetchMatchPayload(id, sport, league);
    const data = result.data;

    if (!data) {
      console.error('Match detail unavailable for id:', id, 'status:', result.status);
      setMatchUnavailableState(
        result.notFound ? 'Match not found' : 'Match unavailable',
        result.notFound ? 'Please try another match' : 'Please try again shortly'
      );
      return;
    }

    console.log('Match data received:', data, 'source:', result.source);
    updateFeedRibbon(data.meta || {}, {
      feedLabel: 'Match center',
      matchCount: 1,
      liveCount: data.status === 'live' ? 1 : 0
    });
    renderMatchDetail(data);
  } catch (err) {
    console.error('Failed to fetch match detail:', err);
    setMatchUnavailableState('Error loading match', 'Check console for details');
  }
}

// --- RENDER MATCH CARDS (HOME) ---
function renderMatches(matches) {
  if (!matchesContainer) return;
  const isResults = isResultsHubPage();
  const safeMatches = isResults
    ? matches.filter((match) => match.status === 'finished')
    : matches;

  if (safeMatches.length === 0) {
    const msg = isResults ? "No recent results discovered" : "No active matches found";
    matchesContainer.innerHTML = `
      <div class="col-span-full py-24 text-center bg-surface-container rounded-lg border border-white/5">
        <div class="flex flex-col items-center gap-4 opacity-20">
          <span class="material-symbols-outlined text-5xl">inventory_2</span>
          <p class="text-on-surface/60 font-black uppercase tracking-[0.4em] text-[10px]">${msg}</p>
        </div>
      </div>
    `;
    return;
  }

  matchesContainer.innerHTML = safeMatches.map(match => {
    const isLive = match.status === 'live';
    const isFinished = match.status === 'finished';

    const statusLabel = isLive
      ? `<span class="flex items-center gap-1.5 bg-primary text-white px-2.5 py-1 rounded-sm text-[9px] font-black italic">
          <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
         </span>`
      : isFinished
        ? `<span class="flex items-center gap-1.5 bg-white/10 text-white/50 px-2.5 py-1 rounded-sm text-[9px] font-black italic">FINAL</span>`
        : `<span class="flex items-center gap-1.5 bg-white/10 text-white/50 px-2.5 py-1 rounded-sm text-[9px] font-black italic">UPCOMING</span>`;

    const detailUrl = buildMatchUrl(match);

    return `
      <a href="${detailUrl}" class="block group h-full">
        <div class="bg-surface-container border border-white/5 p-6 rounded-lg flex flex-col gap-6  
                    hover:border-primary/50 transition-all shadow-2xl relative overflow-hidden h-full">
          
          ${isLive ? '<div class="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none"></div>' : ''}
          
          <div class="flex justify-between items-center relative">
            <div class="flex items-center gap-2">
              <span class="${isLive ? 'text-primary' : 'text-on-surface/50'} lsf-pretext-card-meta font-black italic text-[10px] tracking-widest truncate max-w-[150px]"
                    data-pretext-fit
                    data-pretext-mode="single"
                    data-pretext-min="8">
                ${currentTab === 'all' ? `<span class="bg-white/10 px-1.5 py-0.5 rounded text-[8px] mr-1.5 text-on-surface/60">${match.sport.toUpperCase()}</span>` : ''}${match.league || 'Event'}
              </span>
            </div>
            ${statusLabel}
          </div>
          
          <div class="flex justify-between items-center relative flex-1">
            <div class="flex flex-col items-center gap-3 w-1/3">
              <div class="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-black italic">
                <img src="${getSafeImageUrl(match.homeTeam.logo, FALLBACK_LOGO)}" alt="${match.homeTeam.name}" class="w-8 h-8 object-contain" onerror="this.src='${FALLBACK_LOGO}'">
              </div>
              <span class="lsf-pretext-card-title text-[10px] font-black uppercase italic tracking-tighter text-center line-clamp-2"
                    data-pretext-fit
                    data-pretext-mode="block"
                    data-pretext-max-lines="2"
                    data-pretext-min="9">
                ${match.homeTeam.name}
              </span>
            </div>
            
            <div class="flex flex-col items-center justify-center">
              ${isLive || isFinished
        ? `<span class="lsf-pretext-card-title text-4xl font-black italic ${isLive ? 'text-primary' : 'text-on-surface/50'}"
                 data-pretext-fit
                 data-pretext-mode="single"
                 data-pretext-min="18">${match.homeTeam.score} - ${match.awayTeam.score}</span>`
        : `<span class="text-4xl font-black italic text-on-surface/20">VS</span>`
      }
              <span class="text-[10px] font-black text-on-surface-variant mt-2 tracking-widest uppercase truncate max-w-[80px]">
                ${match.time}
              </span>
            </div>
            
            <div class="flex flex-col items-center gap-3 w-1/3">
              <div class="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-black italic">
                <img src="${getSafeImageUrl(match.awayTeam.logo, FALLBACK_LOGO)}" alt="${match.awayTeam.name}" class="w-8 h-8 object-contain" onerror="this.src='${FALLBACK_LOGO}'">
              </div>
              <span class="lsf-pretext-card-title text-[10px] font-black uppercase italic tracking-tighter text-center line-clamp-2"
                    data-pretext-fit
                    data-pretext-mode="block"
                    data-pretext-max-lines="2"
                    data-pretext-min="9">
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
  schedulePretextLayout(matchesContainer);
}
// --- RENDER MATCH DETAILS ---
let activeLineupTab = 'home';

const sportTerminologyConfig = {
    cricket: {
        performanceLabel: 'Innings Summary',
        timelineLabel: 'Match Timeline',
        lineupsLabel: 'Squads',
        hasClock: false,
        hasColon: false,
        timelineParams: {
            startText: 'MATCH START',
            midText: 'INNINGS BREAK',
            endText: 'STUMPS / MATCH END',
            startIcon: 'sports_cricket',
            midIcon: 'timer',
            endIcon: 'sports_score'
        }
    },
    basketball: {
        performanceLabel: 'Box Score',
        timelineLabel: 'Play-by-Play',
        lineupsLabel: 'Starting Lineup',
        hasClock: true,
        hasColon: true,
        timelineParams: {
            startText: 'TIP OFF',
            midText: 'HALF TIME',
            endText: 'FULL TIME',
            startIcon: 'sports_basketball',
            midIcon: 'whistle',
            endIcon: 'sports_score'
        }
    },
    tennis: {
        performanceLabel: 'Match Stats',
        timelineLabel: 'Point-by-Point',
        lineupsLabel: 'Players',
        hasClock: false,
        hasColon: true,
        timelineParams: {
            startText: 'FIRST SERVE',
            midText: 'SET BREAK',
            endText: 'GAME SET MATCH',
            startIcon: 'sports_tennis',
            midIcon: 'pause',
            endIcon: 'emoji_events'
        }
    },
    baseball: {
        performanceLabel: 'Box Score',
        timelineLabel: 'Play-by-Play',
        lineupsLabel: 'Lineups',
        hasClock: false,
        hasColon: true,
        timelineParams: {
            startText: 'FIRST PITCH',
            midText: 'INNING BREAK',
            endText: 'GAME OVER',
            startIcon: 'sports_baseball',
            midIcon: 'pause',
            endIcon: 'sports_score'
        }
    },
    default: {
        performanceLabel: 'Match Performance',
        timelineLabel: 'Tactical Timeline',
        lineupsLabel: 'Lineups',
        hasClock: true,
        hasColon: true,
        timelineParams: {
            startText: 'Kick off',
            midText: 'Half time',
            endText: 'Full Time',
            startIcon: 'sports',
            midIcon: 'whistle',
            endIcon: 'sports_score'
        }
    }
};

function getSportParams(sport) {
    const key = (sport || '').toLowerCase().trim();
    if (sportTerminologyConfig[key]) return sportTerminologyConfig[key];
    return sportTerminologyConfig.default;
}

function applyMatchScoreboardState(data = {}) {
  const badge = document.getElementById('match-status-badge');
  const badgeLabel = document.getElementById('match-status-label');
  const badgeDot = document.getElementById('match-status-dot');
  const scoreSeparator = document.getElementById('score-separator');
  const matchClockContainer = document.getElementById('match-clock-container');
  const scoreNodes = [
    document.getElementById('home-score'),
    document.getElementById('away-score')
  ];

  const params = getSportParams(data.sport);
  if (scoreSeparator) scoreSeparator.style.display = params.hasColon ? '' : 'none';
  if (matchClockContainer) matchClockContainer.style.display = params.hasClock ? 'flex' : 'none';

  scoreNodes.forEach((node) => {
    if (!node) return;
    const rawScore = String(node.dataset.rawScore || node.textContent || '0');
    const compactScore = data.sport === 'cricket' || rawScore.includes('(') || rawScore.length > 6;
    node.innerHTML = formatHeroScoreMarkup(rawScore, data.sport || '');
    node.style.whiteSpace = compactScore ? 'normal' : '';
    node.style.textAlign = 'center';
    node.style.lineHeight = compactScore ? '0.92' : '1';
    node.style.fontSize = compactScore ? 'clamp(2rem, 4.6vw, 4.5rem)' : 'clamp(3rem, 7vw, 6.75rem)';
    node.style.maxWidth = compactScore ? '6.8ch' : '';
  });

  if (!badge || !badgeLabel) return;

  const status = data.status || 'live';
  if (status === 'finished') {
    badgeLabel.textContent = 'FINAL';
    badge.classList.remove('animate-pulse');
    badge.style.background = 'rgba(255,255,255,0.08)';
    badge.style.boxShadow = 'none';
    if (badgeDot) badgeDot.classList.remove('animate-pulse');
  } else if (status === 'upcoming') {
    badgeLabel.textContent = 'UPCOMING';
    badge.classList.remove('animate-pulse');
    badge.style.background = 'rgba(204,22,22,0.25)';
    badge.style.boxShadow = 'none';
    if (badgeDot) badgeDot.classList.remove('animate-pulse');
  } else {
    badgeLabel.textContent = 'LIVE';
    badge.classList.add('animate-pulse');
    badge.style.background = '#CC1616';
    badge.style.boxShadow = '0 0 15px rgba(204,22,22,0.5)';
    if (badgeDot) badgeDot.classList.add('animate-pulse');
  }
}

function syncMobileMatchSectionTabState(activeTarget = 'mobile-match-hub') {
  const buttons = document.querySelectorAll('#mobile-match-tabs [data-mobile-scroll-target]');
  buttons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mobileScrollTarget === activeTarget);
  });
}

function initMobileMatchSectionTabs() {
  const rail = document.getElementById('mobile-match-tabs');
  if (!rail || rail.dataset.bound === 'true') return;
  rail.dataset.bound = 'true';
  rail.querySelectorAll('[data-mobile-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.mobileScrollTarget;
      const target = document.getElementById(targetId);
      if (!target) return;
      syncMobileMatchSectionTabState(targetId);
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 88,
        behavior: 'smooth'
      });
    });
  });
}

function getMobileMatchHighlightLabel(team = {}, sport = '') {
  const abbreviation = sanitizeDisplayText(team?.abbreviation || team?.name || 'Team').toUpperCase().slice(0, 8);
  const suffixMap = {
    soccer: 'Scorers',
    basketball: 'Leaders',
    baseball: 'Moments',
    cricket: 'Pulse',
    hockey: 'Scorers'
  };
  const suffix = suffixMap[normalizeSportSlug(sport)] || 'Moments';
  return `${abbreviation} ${suffix}`.toUpperCase();
}

function getMatchEventIconName(event = {}, sport = '') {
  const type = String(event?.type || '').toLowerCase();
  if (type.includes('goal')) return 'sports_soccer';
  if (type.includes('wicket') || type.includes('boundary') || normalizeSportSlug(sport) === 'cricket') return 'sports_cricket';
  if (type.includes('three') || type.includes('basket') || normalizeSportSlug(sport) === 'basketball') return 'sports_basketball';
  if (type.includes('home run') || normalizeSportSlug(sport) === 'baseball') return 'sports_baseball';
  if (normalizeSportSlug(sport) === 'hockey') return 'sports_hockey';
  return 'bolt';
}

function parseComparableStatValue(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function convertCricketOversToDecimal(rawOvers = '') {
  const text = String(rawOvers ?? '').trim();
  if (!text) return null;
  const match = text.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  const overs = Number(match[1] || 0);
  const balls = Number((match[2] || '0').slice(0, 1));
  if (!Number.isFinite(overs) || !Number.isFinite(balls)) return null;
  return overs + (Math.min(Math.max(balls, 0), 5) / 6);
}

function convertCricketOversToBalls(rawOvers = '') {
  const text = String(rawOvers ?? '').trim();
  if (!text) return null;
  const match = text.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  const overs = Number(match[1] || 0);
  const balls = Number((match[2] || '0').slice(0, 1));
  if (!Number.isFinite(overs) || !Number.isFinite(balls)) return null;
  return (overs * 6) + Math.min(Math.max(balls, 0), 5);
}

function parseCricketScorecard(rawScore = '') {
  const text = sanitizeDisplayText(String(rawScore || '').trim());
  const scoreText = text.split('(')[0].trim() || text || '0';
  const inningsContext = text.match(/\(([^)]+)\)/)?.[1] || '';
  const scoreMatch = scoreText.match(/(\d+)(?:\s*\/\s*(\d+))?/);
  const runs = scoreMatch ? Number(scoreMatch[1]) : null;
  const wickets = scoreMatch?.[2] !== undefined ? Number(scoreMatch[2]) : null;

  let oversText = '';
  let oversLimit = null;
  const oversPair = inningsContext.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*ov/i);
  const oversSingle = inningsContext.match(/(\d+(?:\.\d+)?)\s*ov/i) || text.match(/(\d+(?:\.\d+)?)\s*ov/i);
  if (oversPair) {
    oversText = oversPair[1];
    oversLimit = Number(oversPair[2]);
  } else if (oversSingle) {
    oversText = oversSingle[1];
  }

  return {
    raw: text,
    scoreText: scoreText || '0',
    runs: Number.isFinite(runs) ? runs : null,
    wickets: Number.isFinite(wickets) ? wickets : null,
    oversText,
    overs: convertCricketOversToDecimal(oversText),
    ballsBowled: convertCricketOversToBalls(oversText),
    oversLimit: Number.isFinite(oversLimit) ? oversLimit : null
  };
}

function getCricketLiveInningsContext(data = {}) {
  const homeScore = parseCricketScorecard(data?.homeTeam?.score || '');
  const awayScore = parseCricketScorecard(data?.awayTeam?.score || '');
  const options = [
    {
      side: 'home',
      team: data?.homeTeam || {},
      opponent: data?.awayTeam || {},
      score: homeScore,
      opponentScore: awayScore
    },
    {
      side: 'away',
      team: data?.awayTeam || {},
      opponent: data?.homeTeam || {},
      score: awayScore,
      opponentScore: homeScore
    }
  ];

  const scoreRank = (entry) => {
    const raw = String(entry?.team?.score || '');
    let rank = 0;
    if (entry?.score?.overs !== null) rank += 100;
    if (raw.includes('(')) rank += 80;
    if (entry?.score?.wickets !== null) rank += 40;
    if (entry?.score?.runs !== null) rank += 20;
    rank += Math.min(raw.length, 30);
    return rank;
  };

  options.sort((left, right) => scoreRank(right) - scoreRank(left));
  return options[0];
}

function parseCricketDeliveryEvent(entry = {}) {
  const text = sanitizeDisplayText(entry?.text || entry?.player || '');
  const matchup = text.match(/^([^,]+?)\s+to\s+([^,]+?)(?:,|$)/i);
  let runs = null;
  if (/\bsix\b/i.test(text)) runs = 6;
  else if (/\bfour\b/i.test(text)) runs = 4;
  else if (/\bthree runs?\b|\b3 runs?\b/i.test(text)) runs = 3;
  else if (/\btwo runs?\b|\b2 runs?\b/i.test(text)) runs = 2;
  else if (/\b1 run\b|\bone run\b|\bsingle\b/i.test(text)) runs = 1;
  else if (/\bno run\b|\bdot\b/i.test(text)) runs = 0;

  return {
    time: sanitizeDisplayText(entry?.time || 'LIVE'),
    text,
    bowler: matchup ? sanitizeDisplayText(matchup[1]) : '',
    batter: matchup ? sanitizeDisplayText(matchup[2]) : '',
    runs,
    wicket: /\b(wicket|out|lbw|bowled|caught)\b/i.test(text)
  };
}

function splitCricketCommentaryText(text = '') {
  const clean = sanitizeDisplayText(text || '');
  if (!clean) {
    return {
      headline: 'Match update',
      remaining: ''
    };
  }

  const match = clean.match(/^[^.!?]+[.!?]?/);
  const headline = sanitizeDisplayText(match?.[0] || clean) || 'Match update';
  const remaining = sanitizeDisplayText(clean.slice(headline.length).trim());
  return { headline, remaining };
}

function applyCricketMobileScoreFit(scoreText = '') {
  const scoreNode = document.getElementById('mobile-cricket-score');
  if (!scoreNode) return;

  const compactScore = sanitizeDisplayText(String(scoreText || '')).replace(/\s+/g, '');
  scoreNode.classList.remove('is-compact', 'is-tight');
  if (compactScore.length >= 8) {
    scoreNode.classList.add('is-tight');
  } else if (compactScore.length >= 6) {
    scoreNode.classList.add('is-compact');
  }
}

function getMobileLiveTeamLabel(team = {}, maxLength = 3) {
  const abbreviation = sanitizeDisplayText(team?.abbreviation || '').trim();
  if (abbreviation) return abbreviation.toUpperCase().slice(0, maxLength);
  const initials = sanitizeDisplayText(team?.name || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  if (initials) return initials.slice(0, maxLength);
  return 'TM';
}

function getGenericLiveClockLabel(data = {}) {
  const rawTime = sanitizeDisplayText(data?.time || '').trim();
  const rawStatus = sanitizeDisplayText(data?.statusText || '').trim();
  if (rawTime && !/^live$/i.test(rawTime)) return rawTime.toUpperCase();
  if (rawStatus && !/^live$/i.test(rawStatus)) return rawStatus.toUpperCase();
  return 'LIVE NOW';
}

function getGenericTimelinePresentation(event = {}, sport = '') {
  const type = String(event?.type || '').toLowerCase();
  const player = sanitizeDisplayText(event?.player || '');
  if (type === 'goal') {
    return {
      headline: `Goal: ${player || 'Match Update'}`,
      iconMarkup: `<span class="material-symbols-outlined text-[1rem] text-[#5dff7d]">sports_soccer</span>`
    };
  }
  if (type === 'yellow-card' || type === 'card') {
    return {
      headline: `Yellow Card: ${player || 'Booked'}`,
      iconMarkup: `<span class="block h-3.5 w-3 rounded-sm bg-[#f0c028]"></span>`
    };
  }
  if (type === 'red-card') {
    return {
      headline: `Red Card: ${player || 'Sent Off'}`,
      iconMarkup: `<span class="block h-3.5 w-3 rounded-sm bg-[#d3271d]"></span>`
    };
  }
  if (type === 'substitution') {
    return {
      headline: `Substitution: ${player || 'Team Change'}`,
      iconMarkup: `<span class="material-symbols-outlined text-[1rem] text-[#64ff8d]">swap_vert</span>`
    };
  }
  if (type === 'shot') {
    return {
      headline: `Chance: ${player || 'Attempt'}`,
      iconMarkup: `<span class="material-symbols-outlined text-[1rem] text-[#ffffff]">radio_button_checked</span>`
    };
  }
  if (type === 'foul') {
    return {
      headline: `Foul: ${player || 'Contact'}`,
      iconMarkup: `<span class="material-symbols-outlined text-[1rem] text-[#f4b0a6]">flag</span>`
    };
  }
  if (normalizeSportSlug(sport) === 'basketball') {
    return {
      headline: player ? `Play: ${player}` : sanitizeDisplayText(event?.text || 'Live update'),
      iconMarkup: `<span class="material-symbols-outlined text-[1rem] text-[#ffb76b]">sports_basketball</span>`
    };
  }
  return {
    headline: player || sanitizeDisplayText(event?.text || 'Live update'),
    iconMarkup: `<span class="material-symbols-outlined text-[1rem] text-[#f4b0a6]">bolt</span>`
  };
}

function buildGenericTimelineCopy(event = {}) {
  const text = sanitizeDisplayText(event?.text || event?.player || '');
  if (!text) return 'Real-time update from the live match centre.';
  return text;
}

function buildGenericSheetPlayersMarkup(lineup = [], highlightName = '') {
  if (!lineup.length) {
    return `<div class="lsf-generic-mobile-sheet-player"><div class="lsf-generic-mobile-sheet-player-name">Awaiting lineup feed</div><div class="lsf-generic-mobile-sheet-player-slot">--</div></div>`;
  }

  const highlightedKey = sanitizeDisplayText(highlightName || '').toLowerCase();
  return lineup.slice(0, 5).map((player, index) => {
    const name = sanitizeDisplayText(player?.name || `Player ${index + 1}`);
    const meta = sanitizeDisplayText(player?.position || player?.number || 'Starter');
    const slot = sanitizeDisplayText(player?.number || player?.position || String(index + 1));
    const isHighlighted = highlightedKey && name.toLowerCase().includes(highlightedKey);
    return `
      <div class="lsf-generic-mobile-sheet-player ${isHighlighted ? 'is-highlighted' : ''}">
        <div>
          <div class="lsf-generic-mobile-sheet-player-name">${escapeHtml(name)}</div>
          <div class="lsf-generic-mobile-sheet-player-meta">${escapeHtml(meta)}</div>
        </div>
        <div class="lsf-generic-mobile-sheet-player-slot">${escapeHtml(slot)}</div>
      </div>
    `;
  }).join('');
}

function buildCricketParticipantSet(activeTeam = {}, deliveries = []) {
  const names = [];
  const pushName = (value) => {
    const text = sanitizeDisplayText(String(value || '').trim());
    if (!text) return;
    if (names.some((entry) => entry.toLowerCase() === text.toLowerCase())) return;
    names.push(text);
  };

  deliveries.forEach((delivery) => pushName(delivery.batter));
  pushName(activeTeam?.leader?.name || '');
  (activeTeam?.lineup || []).forEach((player) => pushName(player?.name || ''));
  return names;
}

function buildCricketRecentBatterStats(deliveries = []) {
  const stats = new Map();
  deliveries.slice(0, 18).forEach((delivery) => {
    if (!delivery?.batter) return;
    const current = stats.get(delivery.batter) || { runs: 0, balls: 0 };
    current.balls += 1;
    if (Number.isFinite(delivery.runs)) current.runs += delivery.runs;
    stats.set(delivery.batter, current);
  });
  return stats;
}

function pickCricketLeaderMetric(team = {}, playerName = '', fallbackMeta = 'Awaiting live data') {
  const leaderName = sanitizeDisplayText(team?.leader?.name || '');
  const leaderValue = sanitizeDisplayText(team?.leader?.value || '');
  const playerKey = sanitizeDisplayText(playerName || '').toLowerCase();
  const leaderKey = leaderName.toLowerCase();
  const matchesPlayer = playerKey && leaderKey && (leaderKey.includes(playerKey) || playerKey.includes(leaderKey));
  if (!leaderValue || (!matchesPlayer && playerName)) {
    return {
      primary: '--',
      meta: fallbackMeta
    };
  }

  const primary = leaderValue.match(/^\d+\*?(?:\/\d+)?/)?.[0]
    || leaderValue.match(/\d+\*?(?:\/\d+)?/)?.[0]
    || leaderValue.split(',')[0]
    || leaderValue;

  return {
    primary: sanitizeDisplayText(primary),
    meta: leaderValue
  };
}

function buildCricketNameTokens(value = '') {
  return sanitizeDisplayText(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function isSameCricketLivePlayer(left = '', right = '') {
  const leftTokens = buildCricketNameTokens(left);
  const rightTokens = buildCricketNameTokens(right);
  if (!leftTokens.length || !rightTokens.length) return false;
  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  const sharedTokens = leftTokens.filter((token) => rightSet.has(token));
  return sharedTokens.length > 0
    && (sharedTokens.length === leftSet.size
      || sharedTokens.length === rightSet.size
      || sharedTokens.some((token) => token.length >= 4));
}

function findCricketLiveMetric(entries = [], playerName = '') {
  return (entries || []).find((entry) => isSameCricketLivePlayer(entry?.name || '', playerName || '')) || null;
}

function buildCricketPlayerCardState(name = '', role = '', team = {}, recentStats = new Map(), liveBatters = [], fallbackMeta = 'Awaiting live data') {
  const cleanName = sanitizeDisplayText(name || role || 'Player');
  const liveMetric = findCricketLiveMetric(liveBatters, cleanName);
  if (liveMetric?.primary) {
    return {
      name: cleanName || sanitizeDisplayText(liveMetric.name || 'Player'),
      primary: sanitizeDisplayText(liveMetric.primary),
      meta: sanitizeDisplayText(liveMetric.meta || fallbackMeta)
    };
  }

  const leaderMetric = pickCricketLeaderMetric(team, cleanName, fallbackMeta);
  if (leaderMetric.primary !== '--') {
    return {
      name: cleanName,
      primary: leaderMetric.primary,
      meta: leaderMetric.meta
    };
  }

  const recent = recentStats.get(cleanName);
  if (recent) {
    return {
      name: cleanName,
      primary: String(recent.runs),
      meta: `LAST ${recent.balls} BALL${recent.balls === 1 ? '' : 'S'}`
    };
  }

  return {
    name: cleanName,
    primary: '--',
    meta: fallbackMeta
  };
}

function buildCricketBowlerCardState(name = '', team = {}, activeScore = {}, liveBowlers = []) {
  const cleanName = sanitizeDisplayText(name || team?.leader?.name || team?.name || 'Bowler');
  const liveMetric = findCricketLiveMetric(liveBowlers, cleanName);
  if (liveMetric?.primary) {
    return {
      name: cleanName || sanitizeDisplayText(liveMetric.name || 'Bowler'),
      primary: sanitizeDisplayText(liveMetric.primary),
      meta: sanitizeDisplayText(liveMetric.meta || 'Current spell')
    };
  }

  const leaderValue = sanitizeDisplayText(team?.leader?.value || '');
  const leaderName = sanitizeDisplayText(team?.leader?.name || '').toLowerCase();
  const cleanKey = cleanName.toLowerCase();
  const matchesLeader = leaderName && cleanKey && (leaderName.includes(cleanKey) || cleanKey.includes(leaderName));
  if (leaderValue && (!name || matchesLeader)) {
    const primary = leaderValue.match(/^\d+\s*\/\s*\d+/)?.[0]
      || leaderValue.match(/\d+\s*\/\s*\d+/)?.[0]
      || leaderValue.match(/^\d+(?:\.\d+)?/)?.[0]
      || leaderValue.split(',')[0]
      || leaderValue;
    return {
      name: cleanName,
      primary: sanitizeDisplayText(primary),
      meta: leaderValue
    };
  }

  const wicketValue = activeScore?.wickets !== null && activeScore?.wickets !== undefined
    ? `${activeScore.wickets} WKTS`
    : 'LIVE';

  return {
    name: cleanName,
    primary: wicketValue,
    meta: 'Current pressure'
  };
}

function computeCricketPartnershipRuns(deliveries = []) {
  let total = 0;
  let hasRuns = false;
  for (const delivery of deliveries) {
    if (delivery?.wicket) break;
    if (Number.isFinite(delivery?.runs)) {
      total += delivery.runs;
      hasRuns = true;
    }
  }
  return hasRuns ? total : null;
}

function getCricketLiveScoringContext(activeScore = {}, opponentScore = {}) {
  const opponentRaw = sanitizeDisplayText(opponentScore?.raw || '');
  const opponentRuns = Number.isFinite(opponentScore?.runs) ? opponentScore.runs : null;
  const ballsRemaining = Number.isFinite(activeScore?.oversLimit) && Number.isFinite(activeScore?.ballsBowled)
    ? Math.max(0, Math.round((activeScore.oversLimit * 6) - activeScore.ballsBowled))
    : null;
  const runsRequired = opponentRuns !== null && Number.isFinite(activeScore?.runs) && opponentRuns >= activeScore.runs
    ? Math.max((opponentRuns + 1) - activeScore.runs, 0)
    : null;
  const requiredRate = ballsRemaining && ballsRemaining > 0 && runsRequired !== null
    ? ((runsRequired / ballsRemaining) * 6)
    : null;
  const projectedScore = Number.isFinite(activeScore?.runs) && Number.isFinite(activeScore?.overs) && Number.isFinite(activeScore?.oversLimit) && activeScore.overs > 0
    ? Math.round((activeScore.runs / activeScore.overs) * activeScore.oversLimit)
    : null;
  const targetScore = opponentRuns !== null ? (opponentRuns + 1) : null;
  const isChase = targetScore !== null && opponentRaw && opponentRaw !== '0' && Number.isFinite(activeScore?.overs);

  return {
    ballsRemaining,
    isChase,
    opponentRuns,
    projectedScore,
    requiredRate,
    runsRequired,
    targetScore
  };
}

function computeCricketLiveProbabilities(context = {}) {
  const activeScore = context?.score || {};
  const runRate = context?.runRate;
  const requiredRate = context?.requiredRate;
  const battingSide = context?.side || 'home';
  let battingProbability = 50;

  if (Number.isFinite(runRate) && Number.isFinite(requiredRate)) {
    battingProbability = Math.round(Math.max(18, Math.min(82, 50 + ((runRate - requiredRate) * 11))));
  } else if (Number.isFinite(activeScore?.overs) && Number.isFinite(activeScore?.oversLimit) && Number.isFinite(activeScore?.runs)) {
    const progress = activeScore.oversLimit > 0 ? (activeScore.overs / activeScore.oversLimit) : 0.5;
    const wicketFactor = activeScore.wickets !== null && activeScore.wickets !== undefined
      ? Math.max(0.15, 1 - (activeScore.wickets / 10))
      : 0.62;
    battingProbability = Math.round(Math.max(24, Math.min(76, 36 + (progress * 22) + (wicketFactor * 18))));
  }

  return battingSide === 'home'
    ? { home: battingProbability, away: 100 - battingProbability }
    : { home: 100 - battingProbability, away: battingProbability };
}

function ensureCricketLiveMobileShell(root) {
  if (!root) return;
  if (!root._defaultMarkup) root._defaultMarkup = root.innerHTML;
  if (root.dataset.layoutMode === 'cricket-live') return;

  root.dataset.layoutMode = 'cricket-live';
  document.body.classList.remove('lsf-generic-mobile-live');
  document.body.classList.add('lsf-cricket-mobile-live');
  root.innerHTML = `
    <div class="lsf-cricket-mobile-shell">
      <section class="lsf-cricket-mobile-scoreboard">
        <div class="flex items-start justify-between gap-3">
          <div class="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface/45">Live Match</div>
          <div id="mobile-cricket-status-pill" class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-on-surface/70">Live</div>
        </div>
        <div class="mt-4 flex items-start justify-between gap-3">
          <div class="flex w-[4.6rem] flex-col items-center gap-2">
            <div class="lsf-cricket-mobile-abbr">
              <img id="mobile-cricket-home-logo" alt="Home team" class="lsf-cricket-mobile-team-logo" src="${FALLBACK_LOGO}">
              <span id="mobile-cricket-home-abbr" class="lsf-cricket-mobile-abbr-text">IND</span>
            </div>
            <div id="mobile-cricket-home-name" class="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/65">Home</div>
          </div>
          <div class="min-w-0 flex-1 text-center">
            <div id="mobile-cricket-score" class="lsf-cricket-mobile-score-value">0/0</div>
            <div id="mobile-cricket-overs" class="lsf-cricket-mobile-overs mt-2">0 OVERS</div>
          </div>
          <div class="flex w-[4.6rem] flex-col items-center gap-2">
            <div class="lsf-cricket-mobile-abbr">
              <img id="mobile-cricket-away-logo" alt="Away team" class="lsf-cricket-mobile-team-logo" src="${FALLBACK_LOGO}">
              <span id="mobile-cricket-away-abbr" class="lsf-cricket-mobile-abbr-text">AWY</span>
            </div>
            <div id="mobile-cricket-away-name" class="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/65">Away</div>
          </div>
        </div>
        <div class="mt-4 text-center text-[11px] font-bold text-on-surface/72">
          <span id="mobile-last-event-text">Awaiting live action</span>
        </div>
        <div class="lsf-cricket-mobile-score-meta">
          <div class="lsf-cricket-mobile-score-meta-item">
            <div class="lsf-cricket-mobile-score-meta-label">Run Rate</div>
            <div id="mobile-cricket-run-rate" class="lsf-cricket-mobile-score-meta-value">N/A</div>
          </div>
          <div class="lsf-cricket-mobile-score-meta-item">
            <div class="lsf-cricket-mobile-score-meta-label">Required</div>
            <div id="mobile-cricket-required-rate" class="lsf-cricket-mobile-score-meta-value">N/A</div>
          </div>
        </div>
      </section>

      <section class="lsf-cricket-mobile-player-grid">
        <article class="lsf-cricket-mobile-player-card lsf-cricket-mobile-player-card--accent">
          <div class="lsf-cricket-mobile-player-card-label">On Strike</div>
          <div id="mobile-cricket-striker-name" class="lsf-cricket-mobile-player-name">Loading</div>
          <div id="mobile-cricket-striker-meta" class="lsf-cricket-mobile-player-meta">Awaiting live card</div>
          <div id="mobile-cricket-striker-value" class="lsf-cricket-mobile-player-value">--</div>
        </article>
        <article class="lsf-cricket-mobile-player-card lsf-cricket-mobile-player-card--muted">
          <div class="lsf-cricket-mobile-player-card-label">At Crease</div>
          <div id="mobile-cricket-nonstriker-name" class="lsf-cricket-mobile-player-name">Loading</div>
          <div id="mobile-cricket-nonstriker-meta" class="lsf-cricket-mobile-player-meta">Awaiting live card</div>
          <div id="mobile-cricket-nonstriker-value" class="lsf-cricket-mobile-player-value">--</div>
        </article>
      </section>

      <section class="lsf-cricket-mobile-bowler-card">
        <div class="lsf-cricket-mobile-bowler-icon">
          <span class="material-symbols-outlined">sports_cricket</span>
        </div>
        <div>
          <div class="text-[10px] font-black uppercase tracking-[0.24em] text-secondary">Bowler</div>
          <div id="mobile-cricket-bowler-name" class="mt-1 text-xl font-black tracking-tight">Loading</div>
          <div id="mobile-cricket-bowler-meta" class="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/50">Current pressure</div>
        </div>
        <div id="mobile-cricket-bowler-value" class="text-4xl font-black tracking-tight text-on-surface">--</div>
      </section>

      <section class="space-y-3">
        <div class="lsf-cricket-mobile-section-title">Match Intelligence</div>
        <article id="mobile-data-intel" class="lsf-cricket-mobile-intel-card">
          <div class="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Awaiting live stat readout</div>
        </article>
      </section>

      <section id="mobile-betting-block" class="space-y-4">
        <div data-lsf-network-ad data-ad-height="160" data-ad-title="LivescoreFree sponsored mobile cricket banner" class="lsf-network-ad-slot lsf-network-ad-slot--banner"></div>
        <div id="mobile-odds-card" hidden></div>
      </section>

      <section id="mobile-moments-block" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="lsf-cricket-mobile-section-title">Live Commentary</h3>
          <span class="text-[11px] font-black uppercase tracking-[0.16em] text-[#cc1616]">View All</span>
        </div>
        <div id="mobile-feed-list" class="space-y-4">
          <div class="lsf-mobile-card text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Awaiting commentary feed</div>
        </div>
      </section>

      <section class="space-y-4">
        <div data-lsf-network-ad data-ad-height="160" data-ad-title="LivescoreFree sponsored mobile cricket footer banner" class="lsf-network-ad-slot lsf-network-ad-slot--banner"></div>
      </section>

      <section id="mobile-lineups-block" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="lsf-cricket-mobile-section-title">Squads</h3>
          <span class="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface/40">Live Pool</span>
        </div>
        <div class="flex gap-3">
          <button id="mobile-lineup-home-tab" class="lsf-mobile-lineup-toggle is-active">Home</button>
          <button id="mobile-lineup-away-tab" class="lsf-mobile-lineup-toggle">Away</button>
        </div>
        <div id="mobile-lineup-strip" class="grid grid-cols-4 gap-3">
          <div class="lsf-mobile-card col-span-4 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Lineup cards loading</div>
        </div>
      </section>
    </div>
  `;
}

function ensureGenericLiveMobileShell(root) {
  if (!root) return;
  if (!root._defaultMarkup) root._defaultMarkup = root.innerHTML;
  if (root.dataset.layoutMode === 'generic-live') return;

  root.dataset.layoutMode = 'generic-live';
  document.body.classList.remove('lsf-cricket-mobile-live');
  document.body.classList.add('lsf-generic-mobile-live');
  root.innerHTML = `
    <div class="lsf-generic-mobile-shell">
      <section class="lsf-generic-mobile-scoreboard">
        <div class="lsf-generic-mobile-status-row">
          <div id="mobile-generic-status-pill" class="lsf-generic-mobile-status-pill">Live</div>
          <div id="mobile-generic-clock" class="lsf-generic-mobile-clock">LIVE NOW</div>
        </div>
        <div class="lsf-generic-mobile-score-row">
          <div class="lsf-generic-mobile-team-col">
            <div class="lsf-generic-mobile-team-tile">
              <img id="mobile-generic-home-logo" alt="Home team" class="lsf-generic-mobile-team-logo" src="${FALLBACK_LOGO}">
            </div>
            <div id="mobile-generic-home-name" class="lsf-generic-mobile-team-name">Home</div>
          </div>
          <div class="lsf-generic-mobile-score-wrap">
            <span id="mobile-generic-home-score" class="lsf-generic-mobile-score-value">0</span>
            <span class="lsf-generic-mobile-score-separator">-</span>
            <span id="mobile-generic-away-score" class="lsf-generic-mobile-score-value">0</span>
          </div>
          <div class="lsf-generic-mobile-team-col">
            <div class="lsf-generic-mobile-team-tile">
              <img id="mobile-generic-away-logo" alt="Away team" class="lsf-generic-mobile-team-logo" src="${FALLBACK_LOGO}">
            </div>
            <div id="mobile-generic-away-name" class="lsf-generic-mobile-team-name">Away</div>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="flex items-end justify-between gap-3">
          <h3 class="lsf-generic-mobile-heading">Match Intel</h3>
          <span class="lsf-generic-mobile-kicker">Real-time Data</span>
        </div>
        <article id="mobile-generic-intel" class="lsf-generic-mobile-intel-card">
          <div class="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Awaiting live stat readout</div>
        </article>
      </section>

      <section class="space-y-4">
        <h3 class="lsf-generic-mobile-heading">Timeline</h3>
        <article id="mobile-generic-timeline" class="lsf-generic-mobile-timeline-card">
          <div class="lsf-mobile-card text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Timeline loading</div>
        </article>
      </section>

      <section class="lsf-generic-mobile-ad-grid">
        <div data-lsf-network-ad data-ad-height="128" data-ad-title="LivescoreFree sponsored mobile live slot" class="lsf-network-ad-slot lsf-network-ad-slot--duo"></div>
        <div data-lsf-network-ad data-ad-height="128" data-ad-title="LivescoreFree sponsored mobile live slot" class="lsf-network-ad-slot lsf-network-ad-slot--duo"></div>
      </section>

      <section class="space-y-4">
        <h3 id="mobile-generic-lineups-title" class="lsf-generic-mobile-heading">Tactical Sheets</h3>
        <div id="mobile-generic-lineups" class="lsf-generic-mobile-sheets">
          <div class="lsf-mobile-card text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Lineups loading</div>
        </div>
      </section>
    </div>
  `;
}

function renderMobileCricketLiveCentre(root, data = {}, commentaryFeed = []) {
  ensureCricketLiveMobileShell(root);
  document.body.classList.add('lsf-cricket-mobile-live');
  renderNetworkAdSlots(root);

  const homeLogo = document.getElementById('mobile-cricket-home-logo');
  const awayLogo = document.getElementById('mobile-cricket-away-logo');
  const innings = getCricketLiveInningsContext(data);
  const activeScore = innings?.score || {};
  const opponentScore = innings?.opponentScore || {};
  const deliveries = commentaryFeed.map((entry) => parseCricketDeliveryEvent(entry)).filter((entry) => entry.text);
  const batterCandidates = buildCricketParticipantSet(innings?.team, deliveries);
  const recentBatterStats = buildCricketRecentBatterStats(deliveries);
  const liveBatters = data?.cricketLive?.batters || [];
  const liveBowlers = data?.cricketLive?.bowlers || [];
  const strikerName = batterCandidates[0] || sanitizeDisplayText(innings?.team?.leader?.name || innings?.team?.name || 'Batter');
  const nonStrikerName = batterCandidates.find((name) => name.toLowerCase() !== String(strikerName || '').toLowerCase())
    || sanitizeDisplayText((innings?.team?.lineup || []).find((player) => String(player?.name || '').toLowerCase() !== String(strikerName || '').toLowerCase())?.name || 'Awaiting partner');
  const bowlerName = deliveries.find((delivery) => delivery.bowler)?.bowler
    || sanitizeDisplayText(innings?.opponent?.leader?.name || innings?.opponent?.name || 'Bowler');

  const runRate = Number.isFinite(activeScore?.runs) && Number.isFinite(activeScore?.overs) && activeScore.overs > 0
    ? (activeScore.runs / activeScore.overs)
    : null;
  const scoringContext = getCricketLiveScoringContext(activeScore, opponentScore);
  const ballsRemaining = scoringContext.ballsRemaining;
  const projectedScore = scoringContext.projectedScore;
  const requiredRate = scoringContext.requiredRate;
  const runsRequired = scoringContext.runsRequired;
  const targetScore = scoringContext.targetScore;
  const partnershipRuns = computeCricketPartnershipRuns(deliveries);
  const probabilities = computeCricketLiveProbabilities({
    side: innings?.side,
    score: activeScore,
    runRate,
    requiredRate
  });
  const strikerState = buildCricketPlayerCardState(strikerName, 'On Strike', innings?.team, recentBatterStats, liveBatters, 'Live striker feed');
  const nonStrikerState = buildCricketPlayerCardState(nonStrikerName, 'At Crease', innings?.team, recentBatterStats, liveBatters, 'Standing by');
  const bowlerState = buildCricketBowlerCardState(bowlerName, innings?.opponent, activeScore, liveBowlers);

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = sanitizeDisplayText(value || '');
  };
  setText('mobile-cricket-status-pill', String(data?.status || '').toLowerCase() === 'live' ? 'LIVE' : (data?.statusText || 'LIVE'));
  setText('mobile-cricket-home-abbr', data?.homeTeam?.abbreviation || data?.homeTeam?.name || 'HOME');
  setText('mobile-cricket-away-abbr', data?.awayTeam?.abbreviation || data?.awayTeam?.name || 'AWAY');
  setText('mobile-cricket-home-name', data?.homeTeam?.fullName || data?.homeTeam?.name || 'Home');
  setText('mobile-cricket-away-name', data?.awayTeam?.fullName || data?.awayTeam?.name || 'Away');
  if (homeLogo) {
    homeLogo.src = getSafeImageUrl(data?.homeTeam?.logo, FALLBACK_LOGO);
    homeLogo.alt = sanitizeDisplayText(data?.homeTeam?.name || 'Home team');
    homeLogo.onerror = () => { homeLogo.src = FALLBACK_LOGO; };
  }
  if (awayLogo) {
    awayLogo.src = getSafeImageUrl(data?.awayTeam?.logo, FALLBACK_LOGO);
    awayLogo.alt = sanitizeDisplayText(data?.awayTeam?.name || 'Away team');
    awayLogo.onerror = () => { awayLogo.src = FALLBACK_LOGO; };
  }
  const scoreValue = activeScore?.scoreText || data?.awayTeam?.score || data?.homeTeam?.score || '0/0';
  setText('mobile-cricket-score', scoreValue);
  applyCricketMobileScoreFit(scoreValue);
  setText('mobile-cricket-overs', activeScore?.oversText ? `${activeScore.oversText} OVERS` : (data?.time || data?.statusText || 'LIVE'));
  setText('mobile-last-event-text', commentaryFeed?.[0]?.text || commentaryFeed?.[0]?.player || data?.statusText || 'Awaiting live action');
  setText('mobile-cricket-run-rate', Number.isFinite(runRate) ? runRate.toFixed(2) : 'N/A');
  setText('mobile-cricket-required-rate', Number.isFinite(requiredRate) ? requiredRate.toFixed(2) : 'N/A');
  setText('mobile-cricket-striker-name', strikerState.name);
  setText('mobile-cricket-striker-meta', strikerState.meta);
  setText('mobile-cricket-striker-value', strikerState.primary);
  setText('mobile-cricket-nonstriker-name', nonStrikerState.name);
  setText('mobile-cricket-nonstriker-meta', nonStrikerState.meta);
  setText('mobile-cricket-nonstriker-value', nonStrikerState.primary);
  setText('mobile-cricket-bowler-name', bowlerState.name);
  setText('mobile-cricket-bowler-meta', bowlerState.meta);
  setText('mobile-cricket-bowler-value', bowlerState.primary);

  const statsHost = document.getElementById('mobile-data-intel');
  if (statsHost) {
    const activeAbbr = sanitizeDisplayText(innings?.team?.abbreviation || innings?.team?.name || 'BAT');
    const opponentAbbr = sanitizeDisplayText(innings?.opponent?.abbreviation || innings?.opponent?.name || 'BOWL');
    const homeWidth = Math.max(0, Math.min(100, probabilities.home));
    const awayWidth = 100 - homeWidth;
    statsHost.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div class="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface">Win Probability</div>
        <div class="text-[11px] font-black uppercase tracking-[0.16em] text-on-surface/62">
          <span class="text-[#cc1616]">${escapeHtml(sanitizeDisplayText(data?.homeTeam?.abbreviation || 'HOME'))} ${probabilities.home}%</span>
          <span class="ml-3">${escapeHtml(sanitizeDisplayText(data?.awayTeam?.abbreviation || 'AWAY'))} ${probabilities.away}%</span>
        </div>
      </div>
      <div class="mt-3 lsf-cricket-mobile-probability-bar">
        <span style="width:${homeWidth}%"></span>
        <span style="width:${awayWidth}%"></span>
      </div>
      <div class="lsf-cricket-mobile-intel-grid">
        <div class="lsf-cricket-mobile-intel-metric">
          <div class="lsf-cricket-mobile-intel-label">${scoringContext.isChase ? 'Target' : 'Projected Score'}</div>
          <div class="lsf-cricket-mobile-intel-value">${scoringContext.isChase ? (targetScore !== null ? targetScore : '--') : (projectedScore !== null ? projectedScore : '--')}</div>
          <div class="lsf-cricket-mobile-intel-note">${scoringContext.isChase
            ? (Number.isFinite(runsRequired) && Number.isFinite(ballsRemaining)
              ? `${runsRequired} needed from ${ballsRemaining} balls`
              : (Number.isFinite(runsRequired)
                ? `${runsRequired} needed`
                : (Number.isFinite(ballsRemaining)
                  ? `${ballsRemaining} balls left`
                  : 'Chase underway')))
            : (Number.isFinite(runRate)
              ? `Current RR: ${runRate.toFixed(2)}`
              : `${activeAbbr} innings live`)}</div>
        </div>
        <div class="lsf-cricket-mobile-intel-metric">
          <div class="lsf-cricket-mobile-intel-label">Current Partnership</div>
          <div class="lsf-cricket-mobile-intel-value" style="color:#ffffff;">${partnershipRuns !== null ? partnershipRuns : '--'}</div>
          <div class="lsf-cricket-mobile-intel-note">${partnershipRuns !== null ? `${strikerState.name}/${nonStrikerState.name}` : `${opponentAbbr} awaiting break`}</div>
        </div>
      </div>
    `;
  }

  const feedHost = document.getElementById('mobile-feed-list');
  if (feedHost) {
    const items = commentaryFeed.slice(0, 6).map((entry) => {
      const parsed = parseCricketDeliveryEvent(entry);
      let badgeClass = 'lsf-cricket-mobile-feed-badge--default';
      let badgeText = escapeHtml(String(parsed.time || 'LIVE').slice(0, 2) || '•');
      if (parsed.wicket) {
        badgeClass = 'lsf-cricket-mobile-feed-badge--wicket';
        badgeText = 'W';
      } else if (parsed.runs === 6) {
        badgeClass = 'lsf-cricket-mobile-feed-badge--six';
        badgeText = '6';
      } else if (parsed.runs === 4) {
        badgeClass = 'lsf-cricket-mobile-feed-badge--four';
        badgeText = '4';
      } else if (Number.isFinite(parsed.runs)) {
        badgeText = String(parsed.runs);
      } else {
        badgeText = 'UPD';
      }

      const headline = escapeHtml(sanitizeDisplayText(parsed.text.split(/(?<=[.!?])\s+/)[0] || parsed.text || 'Match update'));
      const remaining = sanitizeDisplayText(parsed.text.replace(parsed.text.split(/(?<=[.!?])\s+/)[0] || '', '').trim()) || sanitizeDisplayText(entry?.type || 'Live update');

      return `
        <article class="lsf-cricket-mobile-feed-card">
          <div>
            <div class="lsf-cricket-mobile-feed-badge ${badgeClass}">${badgeText}</div>
            <div class="lsf-cricket-mobile-feed-time">${escapeHtml(parsed.time || 'LIVE')}</div>
          </div>
          <div>
            <div class="lsf-cricket-mobile-feed-headline">${headline}</div>
            <div class="lsf-cricket-mobile-feed-copy">${escapeHtml(remaining)}</div>
          </div>
        </article>
      `;
    });

    feedHost.innerHTML = items.length
      ? items.join('')
      : `<div class="lsf-mobile-card text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Awaiting commentary feed</div>`;
  }

  renderMobileLineupPanel(data);
}

function renderMobileGenericLiveCentre(root, data = {}, detailStats = [], detailTimeline = [], commentaryFeed = []) {
  ensureGenericLiveMobileShell(root);
  document.body.classList.add('lsf-generic-mobile-live');
  renderNetworkAdSlots(root);

  const params = getSportParams(data?.sport || '');
  const homeLogo = document.getElementById('mobile-generic-home-logo');
  const awayLogo = document.getElementById('mobile-generic-away-logo');
  const lineupsTitle = document.getElementById('mobile-generic-lineups-title');
  const homeHighlight = detailTimeline.find((event) => event.side === 'home') || commentaryFeed.find((entry) => entry.side === 'home') || {};
  const awayHighlight = detailTimeline.find((event) => event.side === 'away') || commentaryFeed.find((entry) => entry.side === 'away') || {};
  const latestHighlight = detailTimeline[0] || commentaryFeed[0] || {};

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = sanitizeDisplayText(value || '');
  };

  setText('mobile-generic-status-pill', String(data?.status || '').toLowerCase() === 'live' ? 'LIVE' : (data?.statusText || 'LIVE'));
  setText('mobile-generic-clock', getGenericLiveClockLabel(data));
  setText('mobile-generic-home-name', data?.homeTeam?.name || 'Home');
  setText('mobile-generic-away-name', data?.awayTeam?.name || 'Away');
  setText('mobile-generic-home-score', data?.homeTeam?.score || '0');
  setText('mobile-generic-away-score', data?.awayTeam?.score || '0');
  if (homeLogo) homeLogo.src = getSafeImageUrl(data?.homeTeam?.logo, FALLBACK_LOGO);
  if (awayLogo) awayLogo.src = getSafeImageUrl(data?.awayTeam?.logo, FALLBACK_LOGO);

  const intelHost = document.getElementById('mobile-generic-intel');
  if (intelHost) {
    const statRows = detailStats.slice(0, 3).map((stat) => {
      const homeValue = parseComparableStatValue(stat.home);
      const awayValue = parseComparableStatValue(stat.away);
      const comparable = homeValue !== null && awayValue !== null && (homeValue + awayValue) > 0;
      const homeWidth = comparable ? (homeValue / (homeValue + awayValue)) * 100 : 50;
      const awayWidth = comparable ? 100 - homeWidth : 50;
      return `
        <div class="lsf-generic-mobile-stat-row">
          <div class="lsf-generic-mobile-stat-meta">
            <span>${escapeHtml(sanitizeDisplayText(stat.home || '-'))}</span>
            <span>${escapeHtml(sanitizeDisplayText(stat.label || 'Stat'))}</span>
            <span>${escapeHtml(sanitizeDisplayText(stat.away || '-'))}</span>
          </div>
          <div class="lsf-generic-mobile-stat-bar">
            <span style="width:${homeWidth}%"></span>
            <span style="width:${awayWidth}%"></span>
          </div>
        </div>
      `;
    });

    intelHost.innerHTML = statRows.length
      ? statRows.join('')
      : `<div class="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Awaiting live stat readout</div>`;
  }

  const timelineHost = document.getElementById('mobile-generic-timeline');
  if (timelineHost) {
    const timelineFeed = detailTimeline.length
      ? detailTimeline.slice(0, 5)
      : commentaryFeed.slice(0, 5).map((entry) => ({
          time: entry.time || 'LIVE',
          type: entry.type || 'event',
          text: entry.text || entry.player || 'Live update',
          player: entry.player || '',
          side: entry.side || 'neutral'
        }));
    const rows = timelineFeed.map((event) => {
      const presentation = getGenericTimelinePresentation(event, data?.sport || '');
      const badgeLabel = event.side === 'home'
        ? getMobileLiveTeamLabel(data?.homeTeam)
        : event.side === 'away'
          ? getMobileLiveTeamLabel(data?.awayTeam)
          : getMobileLiveTeamLabel({ abbreviation: String(event?.type || 'evt').replace(/[^A-Za-z]/g, '') || 'EVT' });
      const badgeClass = event.side === 'home'
        ? 'lsf-generic-mobile-timeline-badge--home'
        : event.side === 'away'
          ? 'lsf-generic-mobile-timeline-badge--away'
          : '';

      return `
        <div class="lsf-generic-mobile-timeline-row">
          <div class="lsf-generic-mobile-timeline-time">${escapeHtml(sanitizeDisplayText(event.time || 'LIVE'))}<small>${escapeHtml(sanitizeDisplayText(event.type || 'event'))}</small></div>
          <div>
            <div class="lsf-generic-mobile-timeline-headline">
              <span class="lsf-generic-mobile-event-icon">${presentation.iconMarkup}<span>${escapeHtml(presentation.headline)}</span></span>
            </div>
            <div class="lsf-generic-mobile-timeline-copy">${escapeHtml(buildGenericTimelineCopy(event))}</div>
          </div>
          <div class="lsf-generic-mobile-timeline-badge ${badgeClass}">${escapeHtml(badgeLabel)}</div>
        </div>
      `;
    });

    timelineHost.innerHTML = rows.length
      ? rows.join('')
      : `<div class="lsf-mobile-card text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Awaiting match timeline</div>`;
  }

  if (lineupsTitle) {
    const genericTitle = normalizeSportSlug(data?.sport || '', data?.leagueSlug || '') === 'soccer'
      ? 'Tactical Sheets'
      : (params.lineupsLabel || 'Lineups');
    lineupsTitle.textContent = genericTitle;
  }

  const lineupsHost = document.getElementById('mobile-generic-lineups');
  if (lineupsHost) {
    const cardSubtitle = normalizeSportSlug(data?.sport || '', data?.leagueSlug || '') === 'soccer'
      ? 'Live Setup'
      : (params.lineupsLabel || 'Lineup');
    const homeMarkup = buildGenericSheetPlayersMarkup(data?.homeTeam?.lineup || [], sanitizeDisplayText(homeHighlight.player || ''));
    const awayMarkup = buildGenericSheetPlayersMarkup(data?.awayTeam?.lineup || [], sanitizeDisplayText(awayHighlight.player || latestHighlight.player || ''));
    lineupsHost.innerHTML = `
      <article class="lsf-generic-mobile-sheet-card">
        <div class="lsf-generic-mobile-sheet-header">
          <div class="lsf-generic-mobile-sheet-badge lsf-generic-mobile-sheet-badge--home">${escapeHtml(getMobileLiveTeamLabel(data?.homeTeam))}</div>
          <div>
            <div class="lsf-generic-mobile-sheet-team">${escapeHtml(sanitizeDisplayText(data?.homeTeam?.name || 'Home Team'))}</div>
            <div class="lsf-generic-mobile-sheet-subtitle">${escapeHtml(sanitizeDisplayText(cardSubtitle))}</div>
          </div>
          <div class="text-right text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/35">${escapeHtml(sanitizeDisplayText(data?.homeTeam?.record || ''))}</div>
        </div>
        <div class="lsf-generic-mobile-sheet-list">${homeMarkup}</div>
      </article>
      <article class="lsf-generic-mobile-sheet-card">
        <div class="lsf-generic-mobile-sheet-header">
          <div class="lsf-generic-mobile-sheet-badge lsf-generic-mobile-sheet-badge--away">${escapeHtml(getMobileLiveTeamLabel(data?.awayTeam))}</div>
          <div>
            <div class="lsf-generic-mobile-sheet-team">${escapeHtml(sanitizeDisplayText(data?.awayTeam?.name || 'Away Team'))}</div>
            <div class="lsf-generic-mobile-sheet-subtitle">${escapeHtml(sanitizeDisplayText(cardSubtitle))}</div>
          </div>
          <div class="text-right text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/35">${escapeHtml(sanitizeDisplayText(data?.awayTeam?.record || ''))}</div>
        </div>
        <div class="lsf-generic-mobile-sheet-list">${awayMarkup}</div>
      </article>
    `;
  }
}

function renderMobileMatchOdds(data = {}) {
  const container = document.getElementById('mobile-odds-card');
  if (!container) return;
  const odds = data?.odds || {};
  const hasOdds = odds.homeOdds || odds.awayOdds || odds.drawOdds || odds.details;
  if (!hasOdds) {
    container.innerHTML = `
      <div class="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface/45">Betting Edge</div>
      <div class="mt-3 text-sm font-bold text-on-surface/70">Market context is usually published closer to tip-off or first pitch.</div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="text-[10px] font-black uppercase tracking-[0.28em] text-on-surface/45">Betting Edge</div>
    <div class="mt-3 text-lg font-black italic uppercase">${sanitizeDisplayText(odds.details || 'Match Odds')}</div>
    <div class="mt-4 space-y-3 text-xs font-bold uppercase">
      <div class="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
        <span>${sanitizeDisplayText(data?.homeTeam?.name || 'Home')}</span>
        <span class="text-primary">${sanitizeDisplayText(odds.homeOdds || '-')}</span>
      </div>
      ${odds.drawOdds ? `
        <div class="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
          <span>Draw</span>
          <span class="text-on-surface">${sanitizeDisplayText(odds.drawOdds)}</span>
        </div>
      ` : ''}
      <div class="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
        <span>${sanitizeDisplayText(data?.awayTeam?.name || 'Away')}</span>
        <span class="text-secondary">${sanitizeDisplayText(odds.awayOdds || '-')}</span>
      </div>
    </div>
  `;
}

function renderMobileLineupPanel(data = {}) {
  const container = document.getElementById('mobile-lineup-strip');
  const homeTab = document.getElementById('mobile-lineup-home-tab');
  const awayTab = document.getElementById('mobile-lineup-away-tab');
  if (!container || !homeTab || !awayTab) return;

  if (homeTab.dataset.bound !== 'true') {
    homeTab.dataset.bound = 'true';
    homeTab.addEventListener('click', () => {
      activeLineupTab = 'home';
      renderMatchLineup(window._latestMatchDetailData || data);
    });
    awayTab.addEventListener('click', () => {
      activeLineupTab = 'away';
      renderMatchLineup(window._latestMatchDetailData || data);
    });
  }

  homeTab.textContent = sanitizeDisplayText(data?.homeTeam?.abbreviation || data?.homeTeam?.name || 'Home');
  awayTab.textContent = sanitizeDisplayText(data?.awayTeam?.abbreviation || data?.awayTeam?.name || 'Away');
  homeTab.title = sanitizeDisplayText(data?.homeTeam?.fullName || data?.homeTeam?.name || 'Home team');
  awayTab.title = sanitizeDisplayText(data?.awayTeam?.fullName || data?.awayTeam?.name || 'Away team');
  homeTab.classList.toggle('is-active', activeLineupTab === 'home');
  awayTab.classList.toggle('is-active', activeLineupTab === 'away');
  const lineup = activeLineupTab === 'home' ? (data?.homeTeam?.lineup || []) : (data?.awayTeam?.lineup || []);

  if (!lineup.length) {
    container.innerHTML = `<div class="lsf-mobile-card col-span-4 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">No lineup cards available yet</div>`;
    return;
  }

  const defaultAvatar = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>')}`;
  container.innerHTML = lineup.slice(0, 8).map((player) => `
    <div class="lsf-mobile-lineup-chip">
      <img src="${player.face || defaultAvatar}" alt="${sanitizeDisplayText(player.name || 'Player')}" class="mx-auto h-12 w-12 rounded-xl border border-white/10 bg-white/5 object-cover" onerror="this.src='${defaultAvatar}'">
      <div class="mt-3 text-[10px] font-black uppercase leading-tight">${sanitizeDisplayText(player.name || 'Player')}</div>
      <div class="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-on-surface/35">${sanitizeDisplayText(player.position || 'Squad')}</div>
    </div>
  `).join('');
}

function findLineupPlayerByName(lineup = [], name = '') {
  const key = sanitizeDisplayText(name || '').toLowerCase();
  if (!key) return null;
  return lineup.find((player) => {
    const candidate = sanitizeDisplayText(player?.name || '').toLowerCase();
    return candidate && (candidate === key || candidate.includes(key) || key.includes(candidate));
  }) || null;
}

function buildDesktopTeamSheetMarkup(team = {}, accent = 'home', highlightName = '') {
  const lineup = Array.isArray(team?.lineup) ? team.lineup.slice(0, 7) : [];
  const highlightKey = sanitizeDisplayText(highlightName || '').toLowerCase();
  const accentClass = accent === 'home' ? 'is-home' : 'is-away';
  const badge = sanitizeDisplayText(team?.abbreviation || getMobileLiveTeamLabel(team));
  const subtitle = sanitizeDisplayText(team?.record || team?.score || 'Verified team list');
  const rows = lineup.length
    ? lineup.map((player, index) => {
        const name = sanitizeDisplayText(player?.name || `Player ${index + 1}`);
        const role = sanitizeDisplayText(player?.position || 'Squad');
        const slot = sanitizeDisplayText(player?.number || String(index + 1));
        const face = getSafeImageUrl(player?.face, FALLBACK_LOGO);
        const isHighlighted = highlightKey && name.toLowerCase().includes(highlightKey);
        return `
          <div class="lsf-desktop-live-sheet-player ${isHighlighted ? 'is-highlighted' : ''}">
            <div class="lsf-desktop-live-sheet-player-main">
              <img src="${face}" alt="${escapeHtml(name)}" class="lsf-desktop-live-sheet-avatar" onerror="this.src='${FALLBACK_LOGO}'">
              <div>
                <div class="lsf-desktop-live-sheet-player-name">${escapeHtml(name)}</div>
                <div class="lsf-desktop-live-sheet-player-meta">${escapeHtml(role)}</div>
              </div>
            </div>
            <div class="lsf-desktop-live-sheet-player-slot">${escapeHtml(slot)}</div>
          </div>
        `;
      }).join('')
    : `<div class="lsf-desktop-live-empty">Awaiting verified team sheet.</div>`;

  return `
    <article class="lsf-desktop-live-team-sheet ${accentClass}">
      <div class="lsf-desktop-live-sheet-head">
        <div class="lsf-desktop-live-sheet-badge ${accentClass}">${escapeHtml(badge)}</div>
        <div>
          <div class="lsf-desktop-live-sheet-title">${escapeHtml(sanitizeDisplayText(team?.fullName || team?.name || 'Team'))}</div>
          <div class="lsf-desktop-live-sheet-subtitle">${escapeHtml(subtitle)}</div>
        </div>
      </div>
      <div class="lsf-desktop-live-sheet-list">${rows}</div>
    </article>
  `;
}

function getCricketDesktopTimelineBadge(parsed = {}) {
  if (parsed.wicket) {
    return { label: 'W', className: 'lsf-desktop-live-badge--wicket' };
  }
  if (parsed.runs === 6) {
    return { label: '6', className: 'lsf-desktop-live-badge--six' };
  }
  if (parsed.runs === 4) {
    return { label: '4', className: 'lsf-desktop-live-badge--four' };
  }
  if (Number.isFinite(parsed.runs)) {
    return { label: String(parsed.runs), className: 'lsf-desktop-live-badge--default' };
  }
  return {
    label: sanitizeDisplayText(parsed.time || 'UPD').slice(0, 4).toUpperCase(),
    className: 'lsf-desktop-live-badge--default'
  };
}

function buildCricketDesktopTimelineMarkup(commentaryFeed = []) {
  const items = commentaryFeed.slice(0, 6).map((entry) => {
    const parsed = parseCricketDeliveryEvent(entry);
    const badge = getCricketDesktopTimelineBadge(parsed);
    const parts = splitCricketCommentaryText(parsed.text);
    return `
      <div class="lsf-desktop-live-timeline-item">
        <div class="lsf-desktop-live-timeline-marker">
          <span class="lsf-desktop-live-play-badge ${badge.className}">${escapeHtml(badge.label)}</span>
          <span class="lsf-desktop-live-timeline-time">${escapeHtml(sanitizeDisplayText(parsed.time || 'LIVE'))}</span>
        </div>
        <div class="lsf-desktop-live-timeline-copy">
          <div class="lsf-desktop-live-timeline-headline">${escapeHtml(parts.headline || parsed.text || 'Live update')}</div>
          <div class="lsf-desktop-live-timeline-text">${escapeHtml(parts.remaining || sanitizeDisplayText(entry?.player || ''))}</div>
        </div>
      </div>
    `;
  });

  return items.length
    ? items.join('')
    : `<div class="lsf-desktop-live-empty">Awaiting live over-by-over commentary.</div>`;
}

function buildGenericDesktopTimelineMarkup(events = [], sport = '', data = {}) {
  const feed = events.length
    ? events.slice(0, 5)
    : [];
  if (!feed.length) {
    return `<div class="lsf-desktop-live-empty">Awaiting verified match events.</div>`;
  }

  return feed.map((event) => {
    const presentation = getGenericTimelinePresentation(event, sport);
    const badgeLabel = event.side === 'home'
      ? getMobileLiveTeamLabel(data?.homeTeam)
      : event.side === 'away'
        ? getMobileLiveTeamLabel(data?.awayTeam)
        : 'EVT';
    const badgeTone = event.side === 'home'
      ? 'is-home'
      : event.side === 'away'
        ? 'is-away'
        : '';

    return `
      <div class="lsf-desktop-live-timeline-item">
        <div class="lsf-desktop-live-timeline-marker">
          <span class="lsf-desktop-live-side-badge ${badgeTone}">${escapeHtml(badgeLabel)}</span>
          <span class="lsf-desktop-live-timeline-time">${escapeHtml(sanitizeDisplayText(event.time || 'LIVE'))}</span>
        </div>
        <div class="lsf-desktop-live-timeline-copy">
          <div class="lsf-desktop-live-timeline-headline">${presentation.iconMarkup}<span>${escapeHtml(presentation.headline || 'Live update')}</span></div>
          <div class="lsf-desktop-live-timeline-text">${escapeHtml(buildGenericTimelineCopy(event))}</div>
        </div>
      </div>
    `;
  }).join('');
}

function ensureDesktopCricketLiveShell(root) {
  if (!root) return;
  if (!root._defaultMarkup) root._defaultMarkup = root.innerHTML;
  if (root.dataset.layoutMode === 'cricket-live-desktop') return;

  root.dataset.layoutMode = 'cricket-live-desktop';
  syncLegacyMatchHeroVisibility(true);
  document.body.classList.remove('lsf-generic-desktop-live');
  document.body.classList.add('lsf-cricket-desktop-live');
  root.innerHTML = `
    <div class="lsf-desktop-live-shell">
      <section class="lsf-desktop-live-card lsf-desktop-live-hero-card lsf-desktop-live-hero-card--cricket">
        <div class="lsf-desktop-live-hero-top">
          <div id="desktop-cricket-status-pill" class="lsf-desktop-live-status-pill">LIVE</div>
          <div id="desktop-cricket-league" class="lsf-desktop-live-kicker">League</div>
        </div>
        <div class="lsf-desktop-live-score-row lsf-desktop-live-score-row--cricket">
          <div class="lsf-desktop-live-team-panel">
            <div class="lsf-desktop-live-team-tile">
              <img id="desktop-cricket-home-logo" alt="Home team" class="lsf-desktop-live-team-logo" src="${FALLBACK_LOGO}">
            </div>
            <div id="desktop-cricket-home-abbr" class="lsf-desktop-live-team-abbr">HOME</div>
            <div id="desktop-cricket-home-name" class="lsf-desktop-live-team-name">Home Team</div>
            <div id="desktop-cricket-home-sub" class="lsf-desktop-live-team-sub">Awaiting innings data</div>
          </div>
          <div class="lsf-desktop-live-score-centre">
            <div id="desktop-cricket-score" class="lsf-desktop-live-cricket-score">0/0</div>
            <div id="desktop-cricket-overs" class="lsf-desktop-live-score-meta">0.0 Overs</div>
            <div id="desktop-cricket-rate" class="lsf-desktop-live-score-note">CRR -- | REQ --</div>
          </div>
          <div class="lsf-desktop-live-team-panel">
            <div class="lsf-desktop-live-team-tile">
              <img id="desktop-cricket-away-logo" alt="Away team" class="lsf-desktop-live-team-logo" src="${FALLBACK_LOGO}">
            </div>
            <div id="desktop-cricket-away-abbr" class="lsf-desktop-live-team-abbr">AWAY</div>
            <div id="desktop-cricket-away-name" class="lsf-desktop-live-team-name">Away Team</div>
            <div id="desktop-cricket-away-sub" class="lsf-desktop-live-team-sub">Awaiting innings data</div>
          </div>
        </div>
        <div class="lsf-desktop-live-pill-row">
          <span>Match Info</span>
          <span>Scorecard</span>
        </div>
      </section>

      <div class="lsf-desktop-live-grid lsf-desktop-live-grid--cricket">
        <section class="lsf-desktop-live-card">
          <div class="lsf-desktop-live-head">
            <h3>Current Batters</h3>
            <span>Live pair</span>
          </div>
          <div class="lsf-desktop-live-player-stack">
            <article class="lsf-desktop-live-player-card is-home">
              <div class="lsf-desktop-live-player-label">On Strike</div>
              <div id="desktop-cricket-striker-name" class="lsf-desktop-live-player-name">Loading</div>
              <div id="desktop-cricket-striker-meta" class="lsf-desktop-live-player-meta">Awaiting card</div>
              <div id="desktop-cricket-striker-value" class="lsf-desktop-live-player-value">--</div>
            </article>
            <article class="lsf-desktop-live-player-card">
              <div class="lsf-desktop-live-player-label">At Crease</div>
              <div id="desktop-cricket-nonstriker-name" class="lsf-desktop-live-player-name">Loading</div>
              <div id="desktop-cricket-nonstriker-meta" class="lsf-desktop-live-player-meta">Awaiting card</div>
              <div id="desktop-cricket-nonstriker-value" class="lsf-desktop-live-player-value">--</div>
            </article>
          </div>
        </section>

        <section class="lsf-desktop-live-card">
          <div class="lsf-desktop-live-head">
            <h3>Current Bowler</h3>
            <span>Pressure spell</span>
          </div>
          <article class="lsf-desktop-live-bowler-panel">
            <div class="lsf-desktop-live-bowler-main">
              <img id="desktop-cricket-bowler-face" alt="Current bowler" class="lsf-desktop-live-bowler-face" src="${FALLBACK_LOGO}">
              <div>
                <div id="desktop-cricket-bowler-name" class="lsf-desktop-live-player-name">Loading</div>
                <div id="desktop-cricket-bowler-meta" class="lsf-desktop-live-player-meta">Awaiting bowling figures</div>
              </div>
            </div>
            <div id="desktop-cricket-bowler-value" class="lsf-desktop-live-bowler-value">--</div>
          </article>
        </section>

        <section class="lsf-desktop-live-card lsf-desktop-live-card--timeline">
          <div class="lsf-desktop-live-head">
            <h3>Live Timeline</h3>
            <span>Latest overs</span>
          </div>
          <div id="desktop-cricket-timeline" class="lsf-desktop-live-timeline-list"></div>
        </section>

        <section class="lsf-desktop-live-card">
          <div class="lsf-desktop-live-head">
            <h3>Match Intelligence</h3>
            <span>Real-time data</span>
          </div>
          <div id="desktop-cricket-intel"></div>
        </section>

        <div data-lsf-network-ad data-ad-height="160" data-ad-title="LivescoreFree sponsored desktop cricket banner" class="lsf-network-ad-slot lsf-network-ad-slot--banner lsf-desktop-live-ad-slot"></div>
      </div>

      <section class="lsf-desktop-live-card">
        <div class="lsf-desktop-live-head">
          <h3>Squads</h3>
          <span>Verified team lists</span>
        </div>
        <div id="desktop-cricket-lineups" class="lsf-desktop-live-lineup-grid"></div>
      </section>
    </div>
  `;
}

function ensureDesktopGenericLiveShell(root) {
  if (!root) return;
  if (!root._defaultMarkup) root._defaultMarkup = root.innerHTML;
  if (root.dataset.layoutMode === 'generic-live-desktop') return;

  root.dataset.layoutMode = 'generic-live-desktop';
  syncLegacyMatchHeroVisibility(true);
  document.body.classList.remove('lsf-cricket-desktop-live');
  document.body.classList.add('lsf-generic-desktop-live');
  root.innerHTML = `
    <div class="lsf-desktop-live-shell">
      <section class="lsf-desktop-live-card lsf-desktop-live-hero-card lsf-desktop-live-hero-card--generic">
        <div class="lsf-desktop-live-hero-top">
          <div class="lsf-desktop-live-status-cluster">
            <div id="desktop-generic-status-pill" class="lsf-desktop-live-status-pill">LIVE</div>
            <div id="desktop-generic-clock" class="lsf-desktop-live-kicker">LIVE NOW</div>
          </div>
          <div id="desktop-generic-league" class="lsf-desktop-live-kicker">League</div>
        </div>
        <div class="lsf-desktop-live-score-row lsf-desktop-live-score-row--generic">
          <div class="lsf-desktop-live-team-panel">
            <div class="lsf-desktop-live-team-tile">
              <img id="desktop-generic-home-logo" alt="Home team" class="lsf-desktop-live-team-logo" src="${FALLBACK_LOGO}">
            </div>
            <div id="desktop-generic-home-name" class="lsf-desktop-live-team-name">Home Team</div>
          </div>
          <div class="lsf-desktop-live-score-centre">
            <div class="lsf-desktop-live-generic-score">
              <span id="desktop-generic-home-score">0</span>
              <span class="lsf-desktop-live-generic-separator">-</span>
              <span id="desktop-generic-away-score">0</span>
            </div>
          </div>
          <div class="lsf-desktop-live-team-panel">
            <div class="lsf-desktop-live-team-tile">
              <img id="desktop-generic-away-logo" alt="Away team" class="lsf-desktop-live-team-logo" src="${FALLBACK_LOGO}">
            </div>
            <div id="desktop-generic-away-name" class="lsf-desktop-live-team-name">Away Team</div>
          </div>
        </div>
      </section>

      <div class="lsf-desktop-live-grid lsf-desktop-live-grid--generic">
        <section class="lsf-desktop-live-card">
          <div class="lsf-desktop-live-head">
            <h3>Match Intel</h3>
            <span>Real-time data</span>
          </div>
          <div id="desktop-generic-intel"></div>
        </section>

        <div class="lsf-desktop-live-sidebar-stack">
          <section class="lsf-desktop-live-card lsf-desktop-live-card--timeline">
            <div class="lsf-desktop-live-head">
              <h3>Match Timeline</h3>
              <span>Latest events</span>
            </div>
            <div id="desktop-generic-timeline" class="lsf-desktop-live-timeline-list"></div>
          </section>
          <div data-lsf-network-ad data-ad-height="220" data-ad-title="LivescoreFree sponsored desktop match panel" class="lsf-network-ad-slot lsf-network-ad-slot--panel lsf-desktop-live-ad-slot"></div>
        </div>

        <section class="lsf-desktop-live-card lsf-desktop-live-card--full">
          <div class="lsf-desktop-live-head">
            <h3>Tactical Lineups</h3>
            <span>Verified team sheets</span>
          </div>
          <div id="desktop-generic-lineups" class="lsf-desktop-live-lineup-grid"></div>
        </section>

        <div data-lsf-network-ad data-ad-height="140" data-ad-title="LivescoreFree sponsored desktop live banner" class="lsf-network-ad-slot lsf-network-ad-slot--banner lsf-desktop-live-ad-slot lsf-desktop-live-ad-slot--full"></div>
      </div>
    </div>
  `;
}

function renderDesktopCricketLiveCentre(root, data = {}, commentaryFeed = []) {
  ensureDesktopCricketLiveShell(root);
  renderNetworkAdSlots(root);

  const innings = getCricketLiveInningsContext(data);
  const activeScore = innings?.score || {};
  const opponentScore = innings?.opponentScore || {};
  const deliveries = commentaryFeed.map((entry) => parseCricketDeliveryEvent(entry)).filter((entry) => entry.text);
  const batterCandidates = buildCricketParticipantSet(innings?.team, deliveries);
  const recentBatterStats = buildCricketRecentBatterStats(deliveries);
  const liveBatters = data?.cricketLive?.batters || [];
  const liveBowlers = data?.cricketLive?.bowlers || [];
  const strikerName = batterCandidates[0] || sanitizeDisplayText(innings?.team?.leader?.name || innings?.team?.name || 'Batter');
  const nonStrikerName = batterCandidates.find((name) => name.toLowerCase() !== String(strikerName || '').toLowerCase())
    || sanitizeDisplayText((innings?.team?.lineup || []).find((player) => String(player?.name || '').toLowerCase() !== String(strikerName || '').toLowerCase())?.name || 'Awaiting partner');
  const bowlerName = deliveries.find((delivery) => delivery.bowler)?.bowler
    || sanitizeDisplayText(innings?.opponent?.leader?.name || innings?.opponent?.name || 'Bowler');
  const runRate = Number.isFinite(activeScore?.runs) && Number.isFinite(activeScore?.overs) && activeScore.overs > 0
    ? (activeScore.runs / activeScore.overs)
    : null;
  const scoringContext = getCricketLiveScoringContext(activeScore, opponentScore);
  const projectedScore = scoringContext.projectedScore;
  const requiredRate = scoringContext.requiredRate;
  const runsRequired = scoringContext.runsRequired;
  const targetScore = scoringContext.targetScore;
  const partnershipRuns = computeCricketPartnershipRuns(deliveries);
  const probabilities = computeCricketLiveProbabilities({
    side: innings?.side,
    score: activeScore,
    runRate,
    requiredRate
  });
  const strikerState = buildCricketPlayerCardState(strikerName, 'On Strike', innings?.team, recentBatterStats, liveBatters, 'Live striker feed');
  const nonStrikerState = buildCricketPlayerCardState(nonStrikerName, 'At Crease', innings?.team, recentBatterStats, liveBatters, 'Standing by');
  const bowlerState = buildCricketBowlerCardState(bowlerName, innings?.opponent, activeScore, liveBowlers);
  const bowlerFace = findLineupPlayerByName(innings?.opponent?.lineup || [], bowlerState.name)?.face || innings?.opponent?.logo || FALLBACK_LOGO;
  const homeScore = parseCricketScorecard(data?.homeTeam?.score || '');
  const awayScore = parseCricketScorecard(data?.awayTeam?.score || '');
  const teamDescriptor = (teamSide, team, score) => {
    if (teamSide === innings?.side) {
      if (requiredRate !== null && Number.isFinite(runsRequired)) {
        return `${runsRequired} needed`;
      }
      return 'Batting now';
    }
    if (String(score?.raw || '').trim() === '0') return 'Yet to bat';
    if (score?.raw) return score.raw;
    return 'Yet to bat';
  };

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = sanitizeDisplayText(value || '');
  };
  const setImage = (id, src, alt) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.src = getSafeImageUrl(src, FALLBACK_LOGO);
    node.alt = sanitizeDisplayText(alt || 'Team');
    node.onerror = () => { node.src = FALLBACK_LOGO; };
  };

  setText('desktop-cricket-status-pill', String(data?.status || '').toLowerCase() === 'live' ? 'LIVE' : (data?.statusText || 'LIVE'));
  setText('desktop-cricket-league', data?.league || data?.leagueSlug || 'Live cricket');
  setImage('desktop-cricket-home-logo', data?.homeTeam?.logo, data?.homeTeam?.name || 'Home team');
  setImage('desktop-cricket-away-logo', data?.awayTeam?.logo, data?.awayTeam?.name || 'Away team');
  setText('desktop-cricket-home-abbr', data?.homeTeam?.abbreviation || data?.homeTeam?.name || 'HOME');
  setText('desktop-cricket-away-abbr', data?.awayTeam?.abbreviation || data?.awayTeam?.name || 'AWAY');
  setText('desktop-cricket-home-name', data?.homeTeam?.fullName || data?.homeTeam?.name || 'Home Team');
  setText('desktop-cricket-away-name', data?.awayTeam?.fullName || data?.awayTeam?.name || 'Away Team');
  setText('desktop-cricket-home-sub', teamDescriptor('home', data?.homeTeam, homeScore));
  setText('desktop-cricket-away-sub', teamDescriptor('away', data?.awayTeam, awayScore));
  setText('desktop-cricket-score', activeScore?.scoreText || data?.awayTeam?.score || data?.homeTeam?.score || '0/0');
  setText('desktop-cricket-overs', activeScore?.oversText ? `${activeScore.oversText} Overs` : (data?.time || 'LIVE'));
  setText('desktop-cricket-rate', `CRR ${Number.isFinite(runRate) ? runRate.toFixed(2) : '--'} | REQ ${Number.isFinite(requiredRate) ? requiredRate.toFixed(2) : 'N/A'}`);
  setText('desktop-cricket-striker-name', strikerState.name);
  setText('desktop-cricket-striker-meta', strikerState.meta);
  setText('desktop-cricket-striker-value', strikerState.primary);
  setText('desktop-cricket-nonstriker-name', nonStrikerState.name);
  setText('desktop-cricket-nonstriker-meta', nonStrikerState.meta);
  setText('desktop-cricket-nonstriker-value', nonStrikerState.primary);
  setText('desktop-cricket-bowler-name', bowlerState.name);
  setText('desktop-cricket-bowler-meta', bowlerState.meta);
  setText('desktop-cricket-bowler-value', bowlerState.primary);
  setImage('desktop-cricket-bowler-face', bowlerFace, bowlerState.name || 'Current bowler');

  const intelHost = document.getElementById('desktop-cricket-intel');
  if (intelHost) {
    intelHost.innerHTML = `
      <div class="lsf-desktop-live-probability-head">
        <span>${escapeHtml(sanitizeDisplayText(data?.homeTeam?.abbreviation || 'HOME'))} ${probabilities.home}%</span>
        <span>${escapeHtml(sanitizeDisplayText(data?.awayTeam?.abbreviation || 'AWAY'))} ${probabilities.away}%</span>
      </div>
      <div class="lsf-desktop-live-probability-bar">
        <span style="width:${Math.max(0, Math.min(100, probabilities.home))}%"></span>
        <span style="width:${Math.max(0, Math.min(100, probabilities.away))}%"></span>
      </div>
      <div class="lsf-desktop-live-metric-grid">
        <div class="lsf-desktop-live-metric">
          <div class="lsf-desktop-live-metric-label">${scoringContext.isChase ? 'Target' : 'Projected Score'}</div>
          <div class="lsf-desktop-live-metric-value">${scoringContext.isChase ? (targetScore !== null ? targetScore : '--') : (projectedScore !== null ? projectedScore : '--')}</div>
          <div class="lsf-desktop-live-metric-note">${scoringContext.isChase
            ? (Number.isFinite(runsRequired) && Number.isFinite(scoringContext.ballsRemaining)
              ? `${runsRequired} needed from ${scoringContext.ballsRemaining} balls`
              : (Number.isFinite(runsRequired)
                ? `${runsRequired} needed`
                : (Number.isFinite(scoringContext.ballsRemaining)
                  ? `${scoringContext.ballsRemaining} balls left`
                  : 'Chase underway')))
            : (Number.isFinite(runRate)
              ? `Current RR ${runRate.toFixed(2)}`
              : 'Awaiting overs context')}</div>
        </div>
        <div class="lsf-desktop-live-metric">
          <div class="lsf-desktop-live-metric-label">Partnership</div>
          <div class="lsf-desktop-live-metric-value">${partnershipRuns !== null ? partnershipRuns : '--'}</div>
          <div class="lsf-desktop-live-metric-note">${escapeHtml(strikerState.name)} / ${escapeHtml(nonStrikerState.name)}</div>
        </div>
      </div>
    `;
  }

  const timelineHost = document.getElementById('desktop-cricket-timeline');
  if (timelineHost) {
    timelineHost.innerHTML = buildCricketDesktopTimelineMarkup(commentaryFeed);
  }

  const lineupHost = document.getElementById('desktop-cricket-lineups');
  if (lineupHost) {
    lineupHost.innerHTML = [
      buildDesktopTeamSheetMarkup(data?.homeTeam || {}, 'home', strikerState.name),
      buildDesktopTeamSheetMarkup(data?.awayTeam || {}, 'away', bowlerState.name)
    ].join('');
  }
}

function renderDesktopGenericLiveCentre(root, data = {}, detailStats = [], detailTimeline = [], commentaryFeed = []) {
  ensureDesktopGenericLiveShell(root);
  renderNetworkAdSlots(root);

  const timelineFeed = detailTimeline.length
    ? detailTimeline
    : commentaryFeed.map((entry) => ({
        time: entry.time || 'LIVE',
        type: entry.type || 'event',
        text: entry.text || entry.player || 'Live update',
        player: entry.player || '',
        side: entry.side || 'neutral'
      }));
  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = sanitizeDisplayText(value || '');
  };
  const setImage = (id, src, alt) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.src = getSafeImageUrl(src, FALLBACK_LOGO);
    node.alt = sanitizeDisplayText(alt || 'Team');
    node.onerror = () => { node.src = FALLBACK_LOGO; };
  };

  setText('desktop-generic-status-pill', String(data?.status || '').toLowerCase() === 'live' ? 'LIVE' : (data?.statusText || 'LIVE'));
  setText('desktop-generic-clock', getGenericLiveClockLabel(data));
  setText('desktop-generic-league', data?.league || data?.leagueSlug || 'Live sport');
  setText('desktop-generic-home-name', data?.homeTeam?.fullName || data?.homeTeam?.name || 'Home Team');
  setText('desktop-generic-away-name', data?.awayTeam?.fullName || data?.awayTeam?.name || 'Away Team');
  setText('desktop-generic-home-score', data?.homeTeam?.score || '0');
  setText('desktop-generic-away-score', data?.awayTeam?.score || '0');
  setImage('desktop-generic-home-logo', data?.homeTeam?.logo, data?.homeTeam?.name || 'Home team');
  setImage('desktop-generic-away-logo', data?.awayTeam?.logo, data?.awayTeam?.name || 'Away team');

  const intelHost = document.getElementById('desktop-generic-intel');
  if (intelHost) {
    const statRows = detailStats.slice(0, 3).map((stat) => {
      const homeValue = parseComparableStatValue(stat.home);
      const awayValue = parseComparableStatValue(stat.away);
      const comparable = homeValue !== null && awayValue !== null && (homeValue + awayValue) > 0;
      const homeWidth = comparable ? (homeValue / (homeValue + awayValue)) * 100 : 50;
      const awayWidth = comparable ? 100 - homeWidth : 50;
      return `
        <div class="lsf-desktop-live-stat-row">
          <div class="lsf-desktop-live-stat-meta">
            <span>${escapeHtml(sanitizeDisplayText(stat.home || '-'))}</span>
            <span>${escapeHtml(sanitizeDisplayText(stat.label || 'Stat'))}</span>
            <span>${escapeHtml(sanitizeDisplayText(stat.away || '-'))}</span>
          </div>
          <div class="lsf-desktop-live-stat-bar">
            <span style="width:${homeWidth}%"></span>
            <span style="width:${awayWidth}%"></span>
          </div>
        </div>
      `;
    });
    intelHost.innerHTML = statRows.length
      ? statRows.join('')
      : `<div class="lsf-desktop-live-empty">Awaiting verified stat comparison.</div>`;
  }

  const timelineHost = document.getElementById('desktop-generic-timeline');
  if (timelineHost) {
    timelineHost.innerHTML = buildGenericDesktopTimelineMarkup(timelineFeed, data?.sport || '', data);
  }

  const lineupHost = document.getElementById('desktop-generic-lineups');
  if (lineupHost) {
    lineupHost.innerHTML = [
      buildDesktopTeamSheetMarkup(data?.homeTeam || {}, 'home', timelineFeed.find((entry) => entry.side === 'home')?.player || ''),
      buildDesktopTeamSheetMarkup(data?.awayTeam || {}, 'away', timelineFeed.find((entry) => entry.side === 'away')?.player || '')
    ].join('');
  }
}

function renderDesktopLiveCentre(data = {}, detailStats = [], detailTimeline = [], commentaryFeed = []) {
  const root = document.querySelector('.lsf-desktop-live-centre');
  if (!root) return false;
  if (!root._defaultMarkup) root._defaultMarkup = root.innerHTML;

  const isLive = String(data?.status || '').toLowerCase() === 'live';
  const sportKey = normalizeSportSlug(data?.sport || '', data?.leagueSlug || '');
  document.body.classList.remove('lsf-cricket-desktop-live');
  document.body.classList.remove('lsf-generic-desktop-live');

  if (!isLive) {
    if ((root.dataset.layoutMode === 'cricket-live-desktop' || root.dataset.layoutMode === 'generic-live-desktop') && root._defaultMarkup) {
      root.innerHTML = root._defaultMarkup;
      root.dataset.layoutMode = 'default';
      renderNetworkAdSlots(root);
    }
    syncLegacyMatchHeroVisibility(false);
    return false;
  }

  if (sportKey === 'cricket') {
    renderDesktopCricketLiveCentre(root, data, commentaryFeed);
    return true;
  }

  renderDesktopGenericLiveCentre(root, data, detailStats, detailTimeline, commentaryFeed);
  return true;
}

function renderMobileMatchCentre(data = {}, detailStats = [], detailTimeline = [], commentaryFeed = []) {
  const root = document.getElementById('mobile-match-centre');
  if (!root) return;

  if (!root._defaultMarkup) root._defaultMarkup = root.innerHTML;

  const sportKey = normalizeSportSlug(data?.sport || '', data?.leagueSlug || '');
  const isLive = String(data?.status || '').toLowerCase() === 'live';
  const useCricketLiveLayout = sportKey === 'cricket' && isLive;
  const useGenericLiveLayout = sportKey !== 'cricket' && isLive;
  if (useCricketLiveLayout) {
    renderMobileCricketLiveCentre(root, data, commentaryFeed);
    return;
  }
  if (useGenericLiveLayout) {
    renderMobileGenericLiveCentre(root, data, detailStats, detailTimeline, commentaryFeed);
    return;
  }

  if ((root.dataset.layoutMode === 'cricket-live' || root.dataset.layoutMode === 'generic-live') && root._defaultMarkup) {
    root.innerHTML = root._defaultMarkup;
    root.dataset.layoutMode = 'default';
    document.body.classList.remove('lsf-cricket-mobile-live');
    document.body.classList.remove('lsf-generic-mobile-live');
    renderNetworkAdSlots(root);
  } else {
    document.body.classList.remove('lsf-cricket-mobile-live');
    document.body.classList.remove('lsf-generic-mobile-live');
  }

  initMobileMatchSectionTabs();
  const latestEvent = commentaryFeed[0] || detailTimeline[0] || {};
  const latestText = sanitizeDisplayText(latestEvent.text || latestEvent.player || data?.statusText || 'Awaiting live action');
  const latestIcon = getMatchEventIconName(latestEvent, data?.sport || '');
  const homeTimeline = detailTimeline.filter((event) => event.side === 'home');
  const awayTimeline = detailTimeline.filter((event) => event.side === 'away');
  const homeHighlight = homeTimeline[0] || {};
  const awayHighlight = awayTimeline[0] || {};

  const lastEventText = document.getElementById('mobile-last-event-text');
  const lastEventIcon = document.getElementById('mobile-last-event-icon');
  const homeLabel = document.getElementById('mobile-home-highlight-label');
  const homeText = document.getElementById('mobile-home-highlight-text');
  const homeTime = document.getElementById('mobile-home-highlight-time');
  const awayLabel = document.getElementById('mobile-away-highlight-label');
  const awayText = document.getElementById('mobile-away-highlight-text');
  const awayTime = document.getElementById('mobile-away-highlight-time');
  const statsHost = document.getElementById('mobile-data-intel');
  const feedHost = document.getElementById('mobile-feed-list');

  if (lastEventText) lastEventText.textContent = latestText;
  if (lastEventIcon) lastEventIcon.textContent = latestIcon;
  if (homeLabel) homeLabel.textContent = getMobileMatchHighlightLabel(data?.homeTeam, data?.sport);
  if (homeText) homeText.textContent = sanitizeDisplayText(homeHighlight.player || homeHighlight.text || `${data?.homeTeam?.name || 'Home'} standing by`);
  if (homeTime) homeTime.textContent = sanitizeDisplayText(homeHighlight.time || data?.homeTeam?.record || '--');
  if (awayLabel) awayLabel.textContent = getMobileMatchHighlightLabel(data?.awayTeam, data?.sport);
  if (awayText) awayText.textContent = sanitizeDisplayText(awayHighlight.player || awayHighlight.text || `${data?.awayTeam?.name || 'Away'} standing by`);
  if (awayTime) awayTime.textContent = sanitizeDisplayText(awayHighlight.time || data?.awayTeam?.record || '--');

  if (statsHost) {
    const statRows = detailStats.slice(0, 4).map((stat) => {
      const homeValue = parseComparableStatValue(stat.home);
      const awayValue = parseComparableStatValue(stat.away);
      const comparable = homeValue !== null && awayValue !== null && (homeValue + awayValue) > 0;
      const homeWidth = comparable ? (homeValue / (homeValue + awayValue)) * 100 : 50;
      const awayWidth = comparable ? 100 - homeWidth : 50;
      return `
        <div class="space-y-2">
          <div class="flex items-center justify-between text-[11px] font-black italic uppercase">
            <span>${sanitizeDisplayText(stat.home || '-')}</span>
            <span class="text-on-surface/40">${sanitizeDisplayText(stat.label || 'Stat')}</span>
            <span>${sanitizeDisplayText(stat.away || '-')}</span>
          </div>
          <div class="lsf-mobile-stat-bar">
            <span style="width:${homeWidth}%"></span>
            <span style="width:${awayWidth}%"></span>
          </div>
        </div>
      `;
    });

    statsHost.innerHTML = statRows.length
      ? statRows.join('')
      : `<div class="lsf-mobile-card text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Awaiting live stat readout</div>`;
  }

  if (feedHost) {
    const items = commentaryFeed.slice(0, 6).map((entry) => {
      const accentClass = entry.side === 'away'
        ? 'text-secondary'
        : entry.side === 'home'
          ? 'text-primary'
          : 'text-on-surface/35';

      return `
        <div class="lsf-mobile-feed-item">
          <div class="lsf-mobile-feed-time">${sanitizeDisplayText(entry.time || 'LIVE')}</div>
          <div class="lsf-mobile-feed-card">
            <div class="text-[10px] font-black uppercase tracking-[0.24em] ${accentClass}">
              ${sanitizeDisplayText(entry.type || 'Update')}
            </div>
            <div class="mt-2 text-sm font-medium leading-relaxed text-on-surface/88">${sanitizeDisplayText(entry.text || entry.player || 'Match update')}</div>
          </div>
        </div>
      `;
    });

    feedHost.innerHTML = items.length
      ? items.join('')
      : `<div class="lsf-mobile-card text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">Awaiting commentary feed</div>`;
  }

  renderMobileLineupPanel(data);
  renderMobileMatchOdds(data);
}

function renderMatchDetail(data) {
  if (!homeTeamName || !data || !data.homeTeam) return;
  data = sanitizePayloadText(data);
  window._latestMatchDetailData = data;

  const detailStats = Array.isArray(data.stats) && data.stats.length ? data.stats : buildSyntheticMatchStats(data);
  const detailTimeline = Array.isArray(data.timeline) && data.timeline.length ? data.timeline : buildSyntheticMatchTimeline(data);
  const commentaryFeed = Array.isArray(data.commentary) && data.commentary.length
    ? data.commentary
    : (detailTimeline.slice(0, 8).map((event) => ({
        time: event.time || '',
        text: event.text || event.player || 'Match update',
        type: event.type || 'commentary',
        side: event.side || 'neutral'
      })));

  updateMatchSeo(data, false);
  renderMobileMatchCentre(data, detailStats, detailTimeline, commentaryFeed);
  if (renderDesktopLiveCentre(data, detailStats, detailTimeline, commentaryFeed)) {
    return;
  }

  const leagueInfo = document.getElementById('match-league-info');
  const homeEvents = document.getElementById('home-events');
  const awayEvents = document.getElementById('away-events');
  const lineupHomeTab = document.getElementById('lineup-home-tab');
  const lineupAwayTab = document.getElementById('lineup-away-tab');
  const lineupContainer = document.getElementById('lineup-players-container');
  const commentaryContainer = document.getElementById('commentary-container');

  const params = getSportParams(data.sport);
  const perfTitle = document.getElementById('performance-title');
  const timeTitle = document.getElementById('timeline-title');
  const lineTitle = document.getElementById('lineups-title');
  
  if (perfTitle) perfTitle.textContent = params.performanceLabel;
  if (timeTitle) timeTitle.textContent = params.timelineLabel;
  if (lineTitle) lineTitle.textContent = params.lineupsLabel;

  homeTeamName.textContent = sanitizeDisplayText(data.homeTeam.name || 'Home Team');
  awayTeamName.textContent = sanitizeDisplayText(data.awayTeam.name || 'Away Team');
  homeTeamLogo.src = data.homeTeam.logo || '/public/logo.png';
  awayTeamLogo.src = data.awayTeam.logo || '/public/logo.png';
  
  const homeScore = document.getElementById('home-score');
  const awayScore = document.getElementById('away-score');
  if (homeScore) {
    homeScore.dataset.rawScore = data.homeTeam.score || '0';
    homeScore.textContent = data.homeTeam.score || '0';
  }
  if (awayScore) {
    awayScore.dataset.rawScore = data.awayTeam.score || '0';
    awayScore.textContent = data.awayTeam.score || '0';
  }
  
  // Sync the High-Precision Kinetic Clock
  syncKineticClock(data.time, data.sport || 'soccer', data.status || 'live');
  applyMatchScoreboardState(data);

  if (leagueInfo) leagueInfo.textContent = sanitizeDisplayText(data.league || 'Sports Event');
  
  if (lineupHomeTab && lineupAwayTab) {
    lineupHomeTab.textContent = data.homeTeam.fullName || data.homeTeam.name || 'Home';
    lineupAwayTab.textContent = data.awayTeam.fullName || data.awayTeam.name || 'Away';

    // Setup tab clicks if not already set
    if (!lineupHomeTab.onclick) {
        lineupHomeTab.onclick = () => {
            activeLineupTab = 'home';
            renderMatchLineup(window._latestMatchDetailData || data);
            lineupHomeTab.classList.add('border-primary', 'bg-surface');
            lineupHomeTab.classList.remove('text-on-surface-variant/40', 'border-transparent');
            lineupAwayTab.classList.remove('border-primary', 'bg-surface');
            lineupAwayTab.classList.add('text-on-surface-variant/40', 'border-transparent');
        };
        lineupAwayTab.onclick = () => {
            activeLineupTab = 'away';
            renderMatchLineup(window._latestMatchDetailData || data);
            lineupAwayTab.classList.add('border-primary', 'bg-surface');
            lineupAwayTab.classList.remove('text-on-surface-variant/40', 'border-transparent');
            lineupHomeTab.classList.remove('border-primary', 'bg-surface');
            lineupHomeTab.classList.add('text-on-surface-variant/40', 'border-transparent');
        };
    }
    renderMatchLineup(data);
  }

  if (commentaryContainer) {
      commentaryContainer.innerHTML = commentaryFeed.length
        ? commentaryFeed.map((entry) => `
            <div class="flex gap-4 p-4 bg-white/5 border border-white/5 rounded-lg mb-4 animate-in fade-in slide-in-from-left-4">
                <div class="w-12 h-12 bg-surface-container rounded flex items-center justify-center flex-shrink-0">
                    <span class="text-[10px] font-black italic text-primary">${entry.time || 'LIVE'}</span>
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[9px] font-black uppercase tracking-widest text-on-surface/40">
                            ${entry.side === 'home' ? data.homeTeam.name : entry.side === 'away' ? data.awayTeam.name : 'GAME'}
                        </span>
                        <span class="px-2 py-0.5 bg-white/5 border border-white/10 text-on-surface/50 text-[8px] font-black uppercase italic rounded-sm">${entry.type || 'UPDATE'}</span>
                    </div>
                    <p class="text-xs font-medium text-on-surface/80 leading-relaxed">${entry.text || 'Match update'}</p>
                </div>
            </div>
        `).join('')
        : `
            <div class="py-12 text-center opacity-40">
                <span class="material-symbols-outlined text-4xl mb-4">history_edu</span>
                <p class="text-[10px] font-black uppercase tracking-widest">Awaiting match-centre updates...</p>
            </div>
        `;
  }

  // Situation Handling (Possession, Down/Distance for NFL, etc.)
  if (data.situation) {
      const situationContainer = document.getElementById('match-situation-container');
      if (situationContainer) {
          situationContainer.innerHTML = `
              <div class="flex items-center gap-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
                  <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span class="text-[10px] font-black uppercase tracking-widest text-on-surface">
                      ${data.situation.downDistanceText || data.situation.possessionText || 'IN PROGRESS'}
                  </span>
                  ${data.situation.lastPlayText ? `<span class="h-4 w-px bg-white/10"></span><span class="text-[10px] font-medium italic opacity-60 line-clamp-1">${data.situation.lastPlayText}</span>` : ''}
              </div>
          `;
          situationContainer.hidden = false;
      }
  }

  // Render Goalscorers in Hero Section
  if (homeEvents && awayEvents && detailTimeline.length) {
    const goals = detailTimeline.filter(e => e.type === 'goal');
    
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
  }

  if (statsContainer && detailStats.length > 0) {
    // Chunk stats into slides (4 per slide)
    const chunks = [];
    for (let i = 0; i < detailStats.length; i += 4) {
        chunks.push(detailStats.slice(i, i + 4));
    }

    statsContainer.innerHTML = chunks.map(chunk => `
      <div class="min-w-full snap-start space-y-8 p-1">
        ${chunk.map(stat => {
          const homeVal = Number.parseFloat(String(stat.home).replace(/[^0-9.\-]/g, ''));
          const awayVal = Number.parseFloat(String(stat.away).replace(/[^0-9.\-]/g, ''));
          const hasComparableValues = Number.isFinite(homeVal) && Number.isFinite(awayVal) && (homeVal + awayVal) > 0;
          const total = hasComparableValues ? (homeVal + awayVal) : 2;
          const homePercent = hasComparableValues ? (homeVal / total) * 100 : 50;
          const awayPercent = hasComparableValues ? (awayVal / total) * 100 : 50;

          return `
            <div class="space-y-2">
              <div class="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                <span>${stat.label}</span>
                <span class="text-primary">${stat.home} - ${stat.away}</span>
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

  if (timelineContainer && detailTimeline.length > 0) {
    // Redesign as Vertical Split Timeline (Home vs Away)
    const reversedTimeline = [...detailTimeline].reverse(); // Oldest first for vertical flow
    const sportParams = getSportParams(data.sport).timelineParams;
    const homeTimelineLogo = getSafeImageUrl(data.homeTeam.logo, FALLBACK_LOGO);
    const awayTimelineLogo = getSafeImageUrl(data.awayTeam.logo, FALLBACK_LOGO);
    const homeTimelineLabel = escapeHtml(sanitizeDisplayText(data.homeTeam.name || 'Home Team'));
    const awayTimelineLabel = escapeHtml(sanitizeDisplayText(data.awayTeam.name || 'Away Team'));
    const timelineEventsMarkup = reversedTimeline.map((event, idx) => {
      const isHome = event.side === 'home';
      const isAway = event.side === 'away';
      const isNeutral = !isHome && !isAway;
      const isGoal = event.type === 'goal';
      const eventTime = escapeHtml(sanitizeDisplayText(event.time || 'UPDATE'));
      const eventType = escapeHtml(sanitizeDisplayText(String(event.type || 'event').replace(/-/g, ' ')).toUpperCase());
      const eventText = escapeHtml(sanitizeDisplayText(event.player || event.text || 'Match update'));
      const previousTime = String(reversedTimeline[idx - 1]?.time || '');
      const currentTime = String(event.time || '');
      const showHT = idx > 0 && previousTime.includes('45') && !currentTime.includes('45');

      if (isNeutral) {
        return `
          ${showHT ? `
            <div class="relative z-10 flex flex-col items-center my-12">
              <span class="material-symbols-outlined text-white/40 text-2xl mb-2">${sportParams.midIcon}</span>
              <span class="text-[10px] font-black uppercase tracking-widest text-white/60">${sportParams.midText}</span>
            </div>
          ` : ''}
          <div class="relative flex w-full justify-center px-4 sm:px-10">
            <div class="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center">
              <div class="w-2.5 h-2.5 rounded-full bg-secondary border border-black z-20"></div>
              <span class="bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 text-[9px] font-black text-on-surface mt-2">${eventTime}</span>
            </div>
            <div class="w-full max-w-md pt-10">
              <div class="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-center shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
                <span class="text-[8px] font-black uppercase tracking-[0.3em] text-primary/80">${eventType}</span>
                <p class="mt-2 text-sm font-semibold leading-relaxed text-white/90">${eventText}</p>
              </div>
            </div>
          </div>
        `;
      }

      return `
        ${showHT ? `
          <div class="relative z-10 flex flex-col items-center my-12">
            <span class="material-symbols-outlined text-white/40 text-2xl mb-2">${sportParams.midIcon}</span>
            <span class="text-[10px] font-black uppercase tracking-widest text-white/60">${sportParams.midText}</span>
          </div>
        ` : ''}
        <div class="flex items-start w-full relative min-h-[4.5rem]">
          <div class="w-1/2 pr-10 sm:pr-12 text-right flex flex-col items-end">
            ${isHome ? `
              <div class="max-w-[18rem] rounded-2xl border border-white/10 bg-black/25 px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.16)]">
                <span class="text-[8px] font-black uppercase text-primary tracking-[0.28em]">${eventType}</span>
                <p class="mt-1 text-xs font-semibold leading-relaxed text-white">${eventText}</p>
              </div>
            ` : ''}
          </div>

          <div class="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center">
            <div class="w-2.5 h-2.5 rounded-full ${isGoal ? 'bg-primary' : 'bg-white'} border border-black z-20"></div>
            <span class="bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 text-[9px] font-black text-on-surface mt-2">${eventTime}</span>
          </div>

          <div class="w-1/2 pl-10 sm:pl-12 text-left flex flex-col items-start">
            ${isAway ? `
              <div class="max-w-[18rem] rounded-2xl border border-white/10 bg-black/25 px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.16)]">
                <span class="text-[8px] font-black uppercase text-primary tracking-[0.28em]">${eventType}</span>
                <p class="mt-1 text-xs font-semibold leading-relaxed text-white">${eventText}</p>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    timelineContainer.innerHTML = `
      <div class="flex flex-col items-center w-full max-w-2xl mx-auto py-10">
        <!-- Vertical Timeline Header: Team Logos -->
        <div class="flex justify-between items-start w-full mb-16 gap-6 px-4 sm:px-10">
            <div class="flex max-w-[42%] flex-col items-center text-center">
                <div class="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/30 p-3">
                    <img src="${homeTimelineLogo}" alt="${homeTimelineLabel}" class="h-full w-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" onerror="this.src='${FALLBACK_LOGO}'">
                </div>
                <span class="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">${homeTimelineLabel}</span>
            </div>
            <div class="flex flex-col items-center pt-3">
                <div class="w-0.5 h-12 bg-white/10"></div>
            </div>
            <div class="flex max-w-[42%] flex-col items-center text-center">
                <div class="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/30 p-3">
                    <img src="${awayTimelineLogo}" alt="${awayTimelineLabel}" class="h-full w-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" onerror="this.src='${FALLBACK_LOGO}'">
                </div>
                <span class="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">${awayTimelineLabel}</span>
            </div>
        </div>

        <!-- Central Line -->
        <div class="relative w-full">
            <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2"></div>
            
            <!-- Kick Off Marker -->
            <div class="relative z-10 flex flex-col items-center mb-12">
                <span class="material-symbols-outlined text-white/40 text-2xl mb-2">${sportParams.startIcon}</span>
                <span class="text-[10px] font-black uppercase tracking-widest text-white/60">${sportParams.startText}</span>
            </div>

            <!-- Timeline Events -->
            <div class="space-y-12 relative z-10">
                ${timelineEventsMarkup}
            </div>

            <!-- Half Time / Full Time Marker -->
            <div class="relative z-10 flex flex-col items-center mt-12">
                <div class="w-0.5 h-12 bg-white/10 mb-2"></div>
                ${data.status === 'live' ? `
                    <div class="w-2 h-2 rounded-full bg-primary animate-pulse mb-2"></div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-white/60 italic">In Progress</span>
                ` : `
                    <span class="material-symbols-outlined text-white/40 text-2xl mb-2">${sportParams.endIcon}</span>
                    <span class="text-[10px] font-black uppercase tracking-widest text-white/60">${sportParams.endText}</span>
                `}
            </div>
        </div>
      </div>
    `;

    // Also use timeline for commentary
    if (commentaryContainer) {
        commentaryContainer.innerHTML = `
            <h3 class="text-xs font-black uppercase tracking-[0.3em] text-primary mb-4">Live Commentary</h3>
            ${detailTimeline.slice(0, 5).map(event => `
                <div class="bg-surface-container-high p-4 rounded-sm border-l-4 ${event.type === 'goal' ? 'border-primary' : 'border-white/10'} mb-3">
                    <span class="text-[8px] font-black ${event.type === 'goal' ? 'text-primary' : 'text-on-surface-variant/50'} uppercase mb-1 block">
                        ${event.time} - ${event.type.toUpperCase()}
                    </span>
                    <p class="text-xs leading-relaxed font-medium">${event.player || event.text || 'Match update'}</p>
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
        schedulePretextLayout(container);
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
                    <span class="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">${p.number || '--'} - ${p.position}</span>
                </div>
            </div>
            <button class="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors text-lg">info</button>
        </div>
    `).join('');
    schedulePretextLayout(container);
    renderMobileLineupPanel(data);
}

// --- FETCH UPCOMING MATCH DETAIL ---
async function fetchUpcomingMatchDetail(id, sport = 'soccer', league = 'eng.1') {
  try {
    const result = await fetchMatchPayload(id, sport, league);
    const data = result.data;

    if (!data) {
      console.error('Upcoming match detail unavailable for id:', id, 'status:', result.status);
      setMatchUnavailableState(
        result.notFound ? 'Match not found' : 'Match unavailable',
        result.notFound ? 'Please try another match' : 'Please try again shortly'
      );
      return;
    }

    console.log('Upcoming match data received:', data, 'source:', result.source);
    updateFeedRibbon(data.meta || {}, {
      feedLabel: 'Upcoming match centre',
      matchCount: 1,
      liveCount: 0
    });
    renderUpcomingMatchDetail(data);
  } catch (err) {
    console.error('Failed to fetch upcoming match detail:', err);
    setMatchUnavailableState('Error loading match', 'Check console for details');
  }

  schedulePretextLayout(document);
}

function formatUpcomingDatePresentation(data = {}) {
  const parsedDate = data?.date ? new Date(data.date) : null;
  const hasParsedDate = parsedDate && !Number.isNaN(parsedDate.getTime());
  const rawTime = String(data?.time || '').trim();
  const timeLabel = hasParsedDate
    ? parsedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    : (hasUsefulMatchText(rawTime, ['00:00']) ? rawTime : '00:00');
  const dateLabel = hasParsedDate
    ? parsedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : (hasUsefulMatchText(data?.date, ['loading...', 'scheduled event']) ? String(data.date).trim() : 'Scheduled Event');

  return { timeLabel, dateLabel };
}

function parseUpcomingRecord(record = '') {
  const match = String(record || '').trim().match(/(\d+)\s*-\s*(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) return null;
  const wins = Number(match[1] || 0);
  const losses = Number(match[2] || 0);
  const draws = Number(match[3] || 0);
  const total = wins + losses + draws;
  if (!total) return null;
  return {
    wins,
    losses,
    draws,
    total,
    strength: (wins + (draws * 0.5)) / total
  };
}

function parseUpcomingMoneyline(value) {
  const text = String(value ?? '').trim();
  if (!text || text === '-' || text.toLowerCase() === 'pk') return null;
  const normalized = Number(text.replace(/[^0-9+-]/g, ''));
  if (!Number.isFinite(normalized) || normalized === 0) return null;
  return normalized;
}

function convertMoneylineToProbability(value) {
  const moneyline = parseUpcomingMoneyline(value);
  if (moneyline === null) return null;
  if (moneyline > 0) return 100 / (moneyline + 100);
  return Math.abs(moneyline) / (Math.abs(moneyline) + 100);
}

function computeUpcomingWinProbabilities(data = {}) {
  const sport = normalizeSportSlug(data?.sport || '', data?.leagueSlug || '');
  const drawFriendlySports = new Set(['soccer']);
  const allowDraw = drawFriendlySports.has(sport);
  const odds = data?.odds || {};
  const homeOddsProbability = convertMoneylineToProbability(odds.homeOdds);
  const awayOddsProbability = convertMoneylineToProbability(odds.awayOdds);
  const drawOddsProbability = allowDraw ? convertMoneylineToProbability(odds.drawOdds) : null;

  if (homeOddsProbability !== null || awayOddsProbability !== null || drawOddsProbability !== null) {
    const rawHome = homeOddsProbability ?? 0.5;
    const rawAway = awayOddsProbability ?? 0.5;
    const rawDraw = allowDraw ? (drawOddsProbability ?? 0.12) : 0;
    const total = rawHome + rawAway + rawDraw || 1;
    const normalized = {
      home: Math.round((rawHome / total) * 100),
      draw: Math.round((rawDraw / total) * 100),
      away: Math.round((rawAway / total) * 100)
    };
    const diff = 100 - (normalized.home + normalized.draw + normalized.away);
    normalized.away += diff;
    return normalized;
  }

  const homeRecord = parseUpcomingRecord(data?.homeTeam?.record);
  const awayRecord = parseUpcomingRecord(data?.awayTeam?.record);
  if (homeRecord || awayRecord) {
    const homeStrength = homeRecord?.strength ?? 0.5;
    const awayStrength = awayRecord?.strength ?? 0.5;
    const combined = homeStrength + awayStrength || 1;
    const draw = allowDraw
      ? Math.max(8, Math.min(18, Math.round((((homeRecord?.draws || 0) + (awayRecord?.draws || 0)) / ((homeRecord?.total || 0) + (awayRecord?.total || 0) || 1)) * 100) || 12))
      : 0;
    const remaining = 100 - draw;
    const home = Math.round((homeStrength / combined) * remaining);
    return {
      home,
      draw,
      away: remaining - home
    };
  }

  if (Array.isArray(data?.h2h) && data.h2h.length) {
    const recent = data.h2h.slice(0, 3);
    let homeWins = 0;
    let awayWins = 0;
    recent.forEach((entry) => {
      const scoreValues = String(entry?.score || '').match(/\d+/g)?.map((value) => Number(value)) || [];
      if (scoreValues.length < 2) return;
      const homeEntry = String(entry?.home || '').trim().toLowerCase();
      const homeName = String(data?.homeTeam?.name || '').trim().toLowerCase();
      const awayName = String(data?.awayTeam?.name || '').trim().toLowerCase();
      const didHomeTeamStart = homeEntry === homeName;
      if (scoreValues[0] === scoreValues[1]) return;
      const listedHomeWon = scoreValues[0] > scoreValues[1];
      const actualHomeWon = didHomeTeamStart ? listedHomeWon : !listedHomeWon;
      if (actualHomeWon) homeWins += 1;
      else awayWins += 1;
    });
    if (homeWins || awayWins) {
      const total = homeWins + awayWins;
      const home = Math.round((homeWins / total) * 100);
      return {
        home,
        draw: 0,
        away: 100 - home
      };
    }
  }

  return {
    home: allowDraw ? 44 : 50,
    draw: allowDraw ? 12 : 0,
    away: allowDraw ? 44 : 50
  };
}

function formatUpcomingKickoffDetail(data = {}, presentation = {}) {
  const detailParts = [];
  if (hasUsefulMatchText(data?.statusText, ['loading...', 'scheduled event'])) {
    detailParts.push(String(data.statusText).trim());
  }
  if (hasUsefulMatchText(presentation.timeLabel, ['00:00'])) {
    detailParts.push(presentation.timeLabel);
  }
  if (hasUsefulMatchText(presentation.dateLabel, ['scheduled event', 'loading...'])) {
    detailParts.push(presentation.dateLabel);
  }
  const uniqueParts = Array.from(new Set(detailParts.filter(Boolean)));
  return uniqueParts.length ? uniqueParts.join(' - ') : 'Awaiting schedule update';
}

function renderUpcomingMatchDetail(data) {
  if (!homeTeamName || !data || !data.homeTeam) return;
  data = sanitizePayloadText(data);
  updateMatchSeo(data, true);

  const hName = document.getElementById('home-team-name');
  const aName = document.getElementById('away-team-name');
  const hLogo = document.getElementById('home-team-logo');
  const aLogo = document.getElementById('away-team-logo');
  const mTime = document.getElementById('match-time');
  const mDate = document.getElementById('match-date');
  const sName = document.getElementById('stadium-name');
  const lName = document.getElementById('league-name');
  const h2hContainer = document.getElementById('h2h-container');
  const leagueInfo = document.getElementById('match-league-info');
  const kickoffDetail = document.getElementById('kickoff-detail');
  const broadcastName = document.getElementById('broadcast-name');
  const winHomeLabel = document.getElementById('win-home-label');
  const winDrawLabel = document.getElementById('win-draw-label');
  const winAwayLabel = document.getElementById('win-away-label');
  const winHomeBar = document.getElementById('win-home-bar');
  const winDrawBar = document.getElementById('win-draw-bar');
  const winAwayBar = document.getElementById('win-away-bar');
  const winHomeValue = document.getElementById('win-home-value');
  const winDrawValue = document.getElementById('win-draw-value');
  const winAwayValue = document.getElementById('win-away-value');
  const { timeLabel, dateLabel } = formatUpcomingDatePresentation(data);
  const effectiveH2H = Array.isArray(data.h2h) && data.h2h.length ? data.h2h : buildSyntheticHeadToHead(data);
  const upcomingProbabilities = computeUpcomingWinProbabilities({
    ...data,
    h2h: effectiveH2H
  });
  const homeDisplayName = data.homeTeam.fullName || data.homeTeam.name || 'TBD';
  const awayDisplayName = data.awayTeam.fullName || data.awayTeam.name || 'TBD';
  const homeProbabilityLabel = data.homeTeam.abbreviation || data.homeTeam.shortName || data.homeTeam.name || 'HOME';
  const awayProbabilityLabel = data.awayTeam.abbreviation || data.awayTeam.shortName || data.awayTeam.name || 'AWAY';
  const drawLabel = upcomingProbabilities.draw > 0 ? 'DRAW' : 'EDGE';
  const drawValue = `${upcomingProbabilities.draw}%`;

  if (hName) hName.textContent = sanitizeDisplayText(homeDisplayName);
  if (aName) aName.textContent = sanitizeDisplayText(awayDisplayName);
  if (hLogo) hLogo.src = data.homeTeam.logo || FALLBACK_LOGO;
  if (aLogo) aLogo.src = data.awayTeam.logo || FALLBACK_LOGO;
  if (mTime) mTime.textContent = timeLabel;
  if (mDate) mDate.textContent = dateLabel;
  if (sName) sName.textContent = hasUsefulMatchText(data.venue, ['tbd', 'tbd stadium', 'details unavailable'])
    ? sanitizeDisplayText(data.venue)
    : 'Venue update pending';
  if (lName) lName.textContent = sanitizeDisplayText(data.league || data.leagueSlug?.toUpperCase() || 'Scheduled Match');
  if (leagueInfo) leagueInfo.textContent = sanitizeDisplayText(data.league || data.leagueSlug?.toUpperCase() || 'Scheduled Match');
  if (kickoffDetail) kickoffDetail.textContent = sanitizeDisplayText(formatUpcomingKickoffDetail(data, { timeLabel, dateLabel }));
  if (broadcastName) broadcastName.textContent = hasUsefulMatchText(data.broadcast, ['details unavailable'])
    ? sanitizeDisplayText(data.broadcast)
    : 'Broadcast update pending';
  if (winHomeLabel) winHomeLabel.textContent = homeProbabilityLabel.toUpperCase();
  if (winDrawLabel) winDrawLabel.textContent = drawLabel;
  if (winAwayLabel) winAwayLabel.textContent = awayProbabilityLabel.toUpperCase();
  if (winHomeBar) winHomeBar.style.width = `${upcomingProbabilities.home}%`;
  if (winDrawBar) winDrawBar.style.width = `${upcomingProbabilities.draw}%`;
  if (winAwayBar) winAwayBar.style.width = `${upcomingProbabilities.away}%`;
  if (winHomeValue) winHomeValue.textContent = `${upcomingProbabilities.home}%`;
  if (winDrawValue) winDrawValue.textContent = drawValue;
  if (winAwayValue) winAwayValue.textContent = `${upcomingProbabilities.away}%`;
  document.title = `${homeDisplayName} vs ${awayDisplayName} | Upcoming Match Centre`;

  if (h2hContainer && effectiveH2H.length) {
    h2hContainer.innerHTML = effectiveH2H.map(match => `
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
  } else if (h2hContainer) {
    h2hContainer.innerHTML = `
      <div class="py-8 text-center opacity-30 text-[10px] uppercase font-black tracking-widest">
        No recent head-to-head results available
      </div>
    `;
  }

  schedulePretextLayout(document);
}

// --- RECENT RESULTS (FINISHED MATCHES) ---
async function fetchRecentResults() {
  if (!recentResultsContainer) return;
  try {
    const resultsFeed = await fetchFinishedResultsFeed({
      sport: currentTab || 'all',
      league: currentLeagueFilter || undefined
    });
    renderRecentResults(resultsFeed.matches.slice(0, 4));
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
    <div class="bg-surface-container p-4 rounded-lg border border-white/5 hover:border-primary/30 transition-all cursor-pointer group" onclick="window.location.href='${buildMatchUrl(match)}'">
      <div class="flex justify-between text-[10px] font-black text-on-surface/40 mb-3 uppercase tracking-widest">
        <span>${match.leagueSlug?.split('.')[0]?.toUpperCase() || 'SPORTS'}</span>
        <span class="text-primary font-black italic">FINAL</span>
      </div>
      <div class="flex justify-between items-center mb-2">
        <span class="lsf-pretext-card-title font-bold text-sm truncate max-w-[120px]" data-pretext-fit data-pretext-mode="single" data-pretext-min="11">${match.homeTeam.name}</span>
        <span class="font-black text-lg ${match.homeTeam.score > match.awayTeam.score ? 'text-primary' : ''}">${match.homeTeam.score}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="lsf-pretext-card-title font-bold text-sm truncate max-w-[120px]" data-pretext-fit data-pretext-mode="single" data-pretext-min="11">${match.awayTeam.name}</span>
        <span class="font-black text-lg ${match.awayTeam.score > match.homeTeam.score ? 'text-primary' : ''}">${match.awayTeam.score}</span>
      </div>
    </div>
  `).join('');
  schedulePretextLayout(recentResultsContainer);
}

// --- UPCOMING TODAY (SCHEDULED) ---
async function fetchUpcomingToday() {
  if (!upcomingTodayContainer) return;
  try {
    const res = await fetch(buildApiUrl(API_UPCOMING, {
      sport: currentTab || 'all',
      league: currentLeagueFilter || undefined,
      days: 1
    }));
    const data = await res.json();
    const upcoming = filterRenderableMatches(data.matches || []).filter(m => m.status === 'upcoming');
    window._cachedUpcomingMatches = upcoming;
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
    <div class="flex-none w-72 bg-surface p-6 rounded-xl border-l-4 border-white/10 shadow-2xl group cursor-pointer hover:bg-surface-container transition-all hover:border-primary" onclick="window.location.href='${buildMatchUrl(match)}'">
      <div class="lsf-pretext-card-meta text-[10px] font-black text-on-surface/40 group-hover:text-primary tracking-widest uppercase mb-4 transition-colors"
           data-pretext-fit
           data-pretext-mode="single"
           data-pretext-min="8">${match.sport.toUpperCase()} / ${match.time}</div>
      <div class="space-y-4 mb-6">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-white/5">
            <img src="${match.homeTeam.logo}" class="w-5 h-5 object-contain" onerror="this.src='/public/logo.png'">
          </div>
          <span class="lsf-pretext-card-title font-bold uppercase tracking-tight text-sm truncate"
                data-pretext-fit
                data-pretext-mode="single"
                data-pretext-min="11">${match.homeTeam.name}</span>
        </div>
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-white/5">
            <img src="${match.awayTeam.logo}" class="w-5 h-5 object-contain" onerror="this.src='/public/logo.png'">
          </div>
          <span class="lsf-pretext-card-title font-bold uppercase tracking-tight text-sm truncate"
                data-pretext-fit
                data-pretext-mode="single"
                data-pretext-min="11">${match.awayTeam.name}</span>
        </div>
      </div>
      <button onclick="event.stopPropagation(); handleNotification('${match.id}', '${encodeURIComponent(`${match.homeTeam.name} vs ${match.awayTeam.name}`)}')" class="w-full py-2 border border-white/10 text-[10px] font-black tracking-widest uppercase group-hover:bg-primary group-hover:text-on-primary transition-all">SET REMINDER</button>
    </div>
  `).join('');
  schedulePretextLayout(upcomingTodayContainer);
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
  const matches = getCachedMatches().filter(m =>
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
    const detailUrl = buildMatchUrl(m);
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
  if (typeof IntersectionObserver === 'undefined') return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.glass-card, article').forEach(el => {
    if (!el.closest('#main-header') && !el.closest('aside') && !el.closest('footer')) {
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      if (el.classList.contains('headline-expansion-item')) {
        return;
      }
      if (el.dataset.lsfReveal === 'defer') {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
        return;
      }
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
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
if (isCurrentPage('news')) {
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
                <a href="${buildMatchUrl(heroMatch)}" class="bg-primary text-white px-10 py-4 font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform flex items-center gap-2 rounded">
                  <span class="material-symbols-outlined">${sportParams.endIcon}</span> Match Center
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
      const res = await fetch(buildApiUrl(API_UPCOMING, {
        sport,
        league: currentLeagueFilter || undefined,
        days: selectedDateOffset + 1
      }));
      const data = await res.json();
      let matches = filterRenderableMatches(data.matches || []);
      updateFeedRibbon(data.meta || {}, {
        feedLabel: 'Upcoming schedule',
        matchCount: matches.length,
        liveCount: 0
      });
      window._cachedUpcomingMatches = matches;

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
            <a href="${buildMatchUrl(m)}" 
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
                <span class="text-[9px] font-bold text-on-surface/30 uppercase tracking-wider">${m.broadcast || m.league || 'LIVE'}</span>
                <button onclick="event.preventDefault(); event.stopPropagation(); handleNotification('${m.id}','${encodeURIComponent(`${m.homeTeam.name} vs ${m.awayTeam.name}`)}')" 
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
      if (matches.length > 0) {
          setupCountdown(matches[0]);
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
    const heroSection = document.querySelector('section.relative.w-full.overflow-hidden'); // The hero section
    
    if (!timer) return;

    if (!match) {
      if (heroSection) heroSection.style.display = 'none';
      return;
    }

    if (heroSection) heroSection.style.display = 'block';

    if (homeLogo) homeLogo.innerHTML = `<img src="${getSafeImageUrl(match.homeTeam.logo, FALLBACK_LOGO)}" class="w-8 h-8 object-contain" onerror="this.src='${FALLBACK_LOGO}'">`;
    if (awayLogo) awayLogo.innerHTML = `<img src="${getSafeImageUrl(match.awayTeam.logo, FALLBACK_LOGO)}" class="w-8 h-8 object-contain" onerror="this.src='${FALLBACK_LOGO}'">`;
    if (matchName) matchName.textContent = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    if (matchLeague) matchLeague.textContent = `${match.league || match.sport}${match.venue ? ` | ${match.venue}` : ''}`;

    if (countdownInterval) clearInterval(countdownInterval);
    const matchDate = new Date(match.date);

    function tick() {
      const now = new Date();
      const diff = matchDate - now;
      if (diff <= 0) { 
        timer.textContent = 'EVENT IN PROGRESS'; 
        return; 
      }
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
  window.fetchScheduleCentre = fetchScheduleCentre;

  // Init
  renderDateTabs();
  fetchScheduleCentre();

  // Auto-refresh every 2 minutes
  setInterval(fetchScheduleCentre, 120000);
}

// --- FETCH LEAGUES HERO ---
async function fetchLeaguesHero() {
  if (!heroSliderContainer || !isCurrentPage('leagues')) return;
  try {
    const res = await fetch(buildApiUrl(API_BLOG, { sport: 'all', limit: 6 }));
    const data = await res.json();
    const featured = (data.posts || data.trending || []).slice(0, 3);
    
    if (featured.length > 0) {
      heroSliderContainer.innerHTML = featured.map((item, i) => `
        <div class="absolute inset-0 transition-opacity duration-1000 ${i === 0 ? 'opacity-100' : 'opacity-0'}" data-slide="${i}">
          <img class="absolute inset-0 w-full h-full object-cover opacity-60" src="${getArticleImageUrl(item)}" alt="${item.title || item.headline}">
          <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
          <div class="absolute bottom-0 left-0 p-10 max-w-2xl">
            <div class="inline-flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <span class="material-symbols-outlined text-xs">star</span>
              Featured League Coverage
            </div>
            <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface/60">
              <img src="${getSourceFaviconUrl(item.source)}" alt="" class="h-4 w-4 rounded-full" onerror="this.src='${FALLBACK_LOGO}'">
              ${(item.source?.domain || item.source?.name || item.sportLabel || 'Source')}
            </div>
            <h1 class="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-on-surface mb-4 leading-none">${item.title || item.headline}</h1>
            <p class="text-sm text-on-surface/60 font-medium max-w-md mb-6 leading-relaxed">${item.excerpt || item.description || item.summary || 'Deep tactical analysis and live coverage from the multiverse elite.'}</p>
            <div class="flex gap-4">
              <a href="${getArticleLinkUrl(item)}" target="${getArticleLinkTarget(item)}" class="px-8 py-4 kinetic-gradient text-xs font-black uppercase tracking-widest rounded active:scale-95 transition-all inline-flex items-center gap-2">Read Analysis</a>
            </div>
          </div>
        </div>
      `).join('');

      // Simple auto-slide
      let current = 0;
      setInterval(() => {
        const slides = heroSliderContainer.querySelectorAll('[data-slide]');
        if (slides.length < 2) return;
        slides[current].classList.replace('opacity-100', 'opacity-0');
        current = (current + 1) % slides.length;
        slides[current].classList.replace('opacity-0', 'opacity-100');
      }, 5000);
    }
  } catch (err) {
    console.error('Leagues Hero Fetch Error:', err);
  }
}

// --- NEWSLETTER SIMULATION ---
function setupNewsletter() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    // Look for newsletter indicators in the form
    if (form.innerHTML.toLowerCase().includes('newsletter') || 
        form.querySelector('input[type="email"]') || 
        form.querySelector('button')?.innerText.toLowerCase().includes('subscribe')) {
      
      form.onsubmit = (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        if (input && input.value) {
          if (window.handleNotification) {
            window.handleNotification(`Transmission Received! ${input.value} added to Kinetic Feed.`, 'success');
          } else {
            alert(`Kinetic Feed: ${input.value} added to transmission list.`);
          }
          form.reset();
        }
      };
    }
  });
}


// --- GLOBAL AUTO-REFRESH TIMERS ---
// Update live count and ticker every 15 seconds (Separate from the page-specific refresh in setupAppShell)
setInterval(() => {
  if (!realtime.isConnected) fetchLiveCount();
}, 15000);

// Update sidebar live scores every 20 seconds
setInterval(() => {
  if (typeof fetchSidebarLive === 'function' && !realtime.isConnected) {
    fetchSidebarLive();
  }
}, 20000);




