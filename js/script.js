// Version: 1.0.1 - Full Sports Data Upgrade
// --- CONSTANTS ---
const FALLBACK_HERO_IMAGE = '/icons/hero-fallback.svg';
const FALLBACK_LOGO = '/icons/icon-192.png';
const API_LIVE = '/api/live';
const API_MATCH = '/api/match';
const API_UPCOMING = '/api/upcoming';
const API_INFO = '/api/info';
const API_NEWS = API_INFO;
const PWA_MANIFEST = '/manifest.webmanifest';
const SERVICE_WORKER_PATH = '/sw.js';
const REMINDER_STORAGE_KEY = 'lsf-reminders';
const INSTALL_BANNER_DISMISSED_KEY = 'lsf-install-banner-dismissed';
const reminderTimerHandles = new Map();

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

async function fetchLiveCount() {
  try {
    const res = await fetch(`${API_LIVE}?sport=all`);
    const data = await res.json();
    const matches = data.matches || [];
    const allLive = matches.filter(m => m.status === "live");
    const badge = document.getElementById("live-count-text");
    const badgeHero = document.getElementById("live-hero-count-text");
    const label = allLive.length > 0 ? `${allLive.length} MATCHES LIVE NOW` : "NO LIVE GAMES";
    if (badge) badge.textContent = label;
    if (badgeHero) badgeHero.textContent = label;
    
    // Pass real matches to ticker
    renderTicker(matches);
  } catch (e) {
    console.error("Ticker/LiveCount Error:", e);
  }
}

function renderTicker(matches = []) {
  if (!tickerContainer) return;
  
  // Logic: Prioritize Live, then In-Progress, then Scheduled
  let tickerMatches = matches.filter(m => m.status === "live");
  if (tickerMatches.length === 0) {
    tickerMatches = matches.filter(m => m.status === "in_progress" || m.status === "scheduled").slice(0, 10);
  } else {
    tickerMatches = tickerMatches.slice(0, 10);
  }

  if (tickerMatches.length === 0) {
    tickerContainer.innerHTML = `
      <div class="flex items-center gap-8 animate-marquee whitespace-nowrap">
        <span class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40">
          <span class="w-1.5 h-1.5 rounded-full bg-white/10"></span>
          Stay tuned for upcoming sports action across 17 global categories.
        </span>
      </div>
    `;
    return;
  }
  
  tickerContainer.innerHTML = `
    <div class="flex items-center gap-12 animate-marquee whitespace-nowrap">
      ${tickerMatches.map(m => `
        <div class="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/5 rounded-full">
          <span class="w-1.5 h-1.5 rounded-full ${m.status === "live" ? "bg-primary animate-pulse" : "bg-white/20"}"></span>
          <span class="text-[10px] font-black uppercase tracking-widest text-on-surface/60">${(m.league || m.sport || "MATCH").toUpperCase()}</span>
          <span class="text-[10px] font-bold text-on-surface">${m.homeTeam.abbreviation || m.homeTeam.name} ${m.homeTeam.score || "0"} - ${m.awayTeam.score || "0"} ${m.awayTeam.abbreviation || m.awayTeam.name}</span>
          <span class="text-[10px] font-black text-primary italic">${m.status === "live" ? (m.time || "LIVE") : (m.status === "scheduled" ? "UPCOMING" : "TBD")}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function getSafeImageUrl(url, fallback = FALLBACK_HERO_IMAGE) {
  if (!url || url.includes("unsplash.com")) return fallback;
  return url;
}

const SPORT_ALIASES = {
  'american-football': 'football',
  football: 'football'
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
  f1: 'racing'
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
  if (normalizedSport === 'rugby') return '271937';
  return 'eng.1';
}

function buildMatchUrl(match) {
  const isUpcoming = match.status === 'upcoming';
  const base = isUpcoming ? '/upcoming_match_detail.html' : '/match.html';
  return `${base}?id=${encodeURIComponent(match.id)}&sport=${encodeURIComponent(match.sport)}&league=${encodeURIComponent(match.leagueSlug)}`;
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
  return `/team.html?${params.toString()}`;
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
  return `/player.html?${params.toString()}`;
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

function buildSportHubUrl(sport = '', league = '') {
  const params = new URLSearchParams();
  const normalizedSport = normalizeSportSlug(sport, league);
  const normalizedLeague = normalizeLeagueSlug(league);
  if (normalizedSport) params.set('s', normalizedSport);
  if (normalizedLeague) params.set('l', normalizedLeague);
  return `/sport.html?${params.toString()}`;
}

function getCurrentFeedParams(overrides = {}) {
  return {
    sport: overrides.sport ?? currentTab ?? 'all',
    league: overrides.league ?? currentLeagueFilter ?? ''
  };
}

function getCachedMatches() {
  return [
    ...(window._cachedUpcomingMatches || []),
    ...(window._cachedMatches || []),
    ...(window._cachedLiveMatches || [])
  ];
}

function findCachedMatch(matchId = '') {
  return getCachedMatches().find((match) => String(match.id) === String(matchId)) || null;
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

function getArticleImageUrl(article = {}) {
  const url = article.image || article.images?.[0]?.url || article.images?.[0]?.href || FALLBACK_HERO_IMAGE;
  return getSafeImageUrl(url, FALLBACK_HERO_IMAGE);
}

function getArticleLinkUrl(article = {}) {
  return article.url || article.links?.web?.href || article.links?.api?.news?.href || '#';
}

function sortMatchesForDisplay(matches = [], statusFilter = null) {
  const list = [...matches];
  if (statusFilter === 'finished') {
    return list.sort((left, right) => new Date(right.date) - new Date(left.date));
  }
  return list.sort((left, right) => new Date(left.date) - new Date(right.date));
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
  if (!document.querySelector('link[href="/css/runtime-enhancements.css"]')) {
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/css/runtime-enhancements.css';
    document.head.appendChild(styleLink);
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
}

function hydrateNavigationLinks() {
  document.querySelectorAll('a').forEach((link) => {
    const text = (link.textContent || '').trim().toLowerCase();
    if (!text) return;

    if (text.includes('all leagues') || text.includes('top league')) link.setAttribute('href', 'leagues.html');
    if (text.includes('standings')) link.setAttribute('href', 'standings.html');
    if (text.includes('teams hub')) link.setAttribute('href', 'teams.html');
    if (text.includes('team profile')) link.setAttribute('href', 'team.html');
    if (text.includes('player profile')) link.setAttribute('href', 'player.html');
    if (text === 'results') link.setAttribute('href', 'results.html');
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
            <a class="lsf-reminder-link" href="${reminder.url || '/upcoming.html'}">
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
    const url = reminder.url || '/upcoming.html';
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
  const bannerDismissed = localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === '1';

  if (installButton) installButton.hidden = !canInstall;
  if (banner) banner.hidden = !canInstall || bannerDismissed;
  if (bannerButton) bannerButton.hidden = !canInstall || bannerDismissed;
  if (fab) fab.hidden = !canInstall;

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
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  ensureHeadEnhancements();
  hydrateNavigationLinks();
  patchLegacyImages();
  setupAppShell();
  registerServiceWorker();
  bootstrapSavedReminders();
  startReminderHeartbeat();

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
  const leagueParam = urlParams.get('league') || urlParams.get('l') || '';
  const sportParam = urlParams.get('sport') || urlParams.get('s') || '';
  
  // Explicitly default to 'all' to show all sports by default
  currentTab = normalizeSportSlug(sportParam || 'all', leagueParam);
  currentLeagueFilter = normalizeLeagueSlug(leagueParam || '');
  
  const sport = currentTab;
  const league = currentLeagueFilter || getDefaultLeagueForSport(sport);

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

    // Set page filter based on current file
    if (path.includes('upcoming.html')) {
        currentPageFilter = 'upcoming';
        currentArenaTab = currentTab;
    } else if (path.includes('results.html')) {
        currentPageFilter = 'finished';
    } else if (path.includes('trending.html')) {
        currentPageFilter = null;
    } else {
        currentPageFilter = 'live';
    }

    // --- INITIAL FETCHES ---
    fetchSidebarLive();
    
    // Skip fetchMatches on upcoming page — Schedule Centre module handles it
    if (!window.location.pathname.includes('upcoming')) {
      fetchMatches(currentPageFilter);
    }

    if (heroSliderContainer) {
      fetchHeroData(currentPageFilter);
      fetchLeaguesHero();
    }
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

    // --- REFRESH LOGIC ---
    setInterval(() => {
      fetchSidebarLive();
      if (!window.location.pathname.includes('upcoming')) {
        fetchMatches(currentPageFilter);
      }
      if (recentResultsContainer) fetchRecentResults();
      if (document.getElementById("featured-match-analysis")) fetchFeaturedAnalysis();
      if (upcomingTodayContainer) fetchUpcomingToday();
      if (document.getElementById('arena-schedule-container')) fetchArenaSchedule(currentArenaTab);
      if (document.getElementById('trending-matches-list')) fetchTrendingUpcoming();
    }, 15000);

    setInterval(() => {
      if (heroSliderContainer) fetchHeroData(currentPageFilter);
      if (newsContainer) fetchNews(currentTab);
      if (leaguesContainer || topTierContainer) fetchLeagues();
    }, 60000);

    setInterval(() => {
      if (playersContainer) fetchPlayers(currentTab);
    }, 600000);
  }
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
    url: match ? buildMatchUrl(match) : '/upcoming.html'
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
    const link = match.highlightUrl && match.status === 'finished' ? match.highlightUrl : buildMatchUrl(match);
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

  const featuredLink = featuredMatch.status === 'finished'
    ? (featuredMatch.highlightUrl || buildMatchUrl(featuredMatch))
    : buildMatchUrl(featuredMatch);
  const upLink = nextUpMatch ? buildMatchUrl(nextUpMatch) : '#';
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
              ${standings.length === 0 ? '<tr><td colspan="5" class="px-8 py-24 text-center"><div class="flex flex-col items-center gap-4 opacity-30"><span class="material-symbols-outlined text-4xl">inventory_2</span><p class="text-[10px] font-black uppercase tracking-[0.3em]">No live standings discovered in the current feed</p></div></td></tr>' : ''}
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
    soccerAthletes.forEach(a => { a.sport = 'soccer'; a.league = 'eng.1'; });
    nbaAthletes.forEach(a => { a.sport = 'basketball'; a.league = 'nba'; });
    nflAthletes.forEach(a => { a.sport = 'football'; a.league = 'nfl'; });

    // On players.html, render the 4 grids
    if (isPlayersPage) {
       renderTrendingPlayersPage(soccerAthletes.concat(nbaAthletes, nflAthletes));
       renderSoccerLegends(soccerAthletes);
       renderNbaAllstars(nbaAthletes);
       renderNflElite(nflAthletes);
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


// --- RENDER TRENDING UPCOMING (HOME SIDEBAR) ---
async function fetchTrendingUpcoming() {
  const trendingList = document.getElementById('trending-matches-list');
  if (!trendingList) return;

  try {
    // Always fetch from upcoming API to ensure we have scheduled matches
    const res = await fetch(buildApiUrl(API_UPCOMING, {
      sport: currentTab || 'all',
      league: currentLeagueFilter || undefined,
      days: 3
    }));
    const data = await res.json();
    let matches = data.matches || [];
    window._cachedUpcomingMatches = matches;
    
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
    <a href="${buildMatchUrl(match)}" class="flex items-center gap-6 p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group border border-white/5 hover:border-primary/20">
      <div class="flex flex-col items-center gap-2 shrink-0">
        <img src="${getSafeImageUrl(match.homeTeam.logo, FALLBACK_LOGO)}" class="w-8 h-8 object-contain opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" onerror="this.src='${FALLBACK_LOGO}'">
        <img src="${getSafeImageUrl(match.awayTeam.logo, FALLBACK_LOGO)}" class="w-8 h-8 object-contain opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" onerror="this.src='${FALLBACK_LOGO}'">
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
    const res = await fetch(buildApiUrl(API_INFO, {
      type: 'news',
      sport: currentTab || 'all',
      league: currentLeagueFilter || undefined,
      limit: 40
    }));
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
          <p class="text-[11px] text-on-surface-variant leading-relaxed">${featured.status === 'live' ? 'This fixture is active now in the live feed.' : 'This matchup is coming directly from the current ESPN feed.'}</p>
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
        <button class="bg-primary text-on-primary px-10 py-4 font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform flex items-center gap-2" onclick="window.open('${getArticleLinkUrl(a)}', '_blank')">
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
    <div class="group cursor-pointer" onclick="window.open('${getArticleLinkUrl(a)}', '_blank')">
      <div class="relative aspect-video bg-cover bg-center rounded-lg overflow-hidden border border-white/10" style="background-image: url('${getArticleImageUrl(a)}')">
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
    <a class="block group" href="${getArticleLinkUrl(a)}" target="_blank">
      <span class="text-[8px] font-black uppercase text-on-surface/30">#${(a.categories?.[0]?.name || 'TRENDING').replace(/\\s+/g, '')}</span>
      <p class="text-sm font-bold uppercase group-hover:text-primary transition-colors mt-1 line-clamp-2">${a.headline}</p>
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
      <article class="relative bg-surface-container rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all group cursor-pointer flex flex-col h-full" onclick="window.open('${getArticleLinkUrl(article)}', '_blank')">
        <div class="aspect-video bg-cover bg-center transition-transform duration-[1.5s] group-hover:scale-110" 
             style="background-image: linear-gradient(to top, rgba(14,14,14,0.9), transparent), url('${getArticleImageUrl(article)}')"></div>
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
      <article class="flex flex-col md:flex-row gap-8 group cursor-pointer border-b border-white/5 pb-12 last:border-0 opacity-0 translate-y-10 transition-all duration-700 headline-expansion-item" onclick="window.open('${getArticleLinkUrl(article)}', '_blank')">
        <div class="md:w-1/4 aspect-[16/9] bg-cover bg-center rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg" 
             style="background-image: url('${getArticleImageUrl(article)}')"></div>
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
    const res = await fetch(buildApiUrl(API_LIVE, {
      sport: currentTab || 'all',
      league: currentLeagueFilter || undefined
    }));
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
    window._cachedLiveMatches = allLive;

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
  currentTab = normalizeSportSlug(tabId);
  currentLeagueFilter = '';

  // Update URL search params without reload for persistence
  const url = new URL(window.location);
  url.searchParams.set('sport', currentTab);
  url.searchParams.delete('league');
  url.searchParams.delete('l');
  window.history.pushState({}, '', url);

  renderTabs();

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
  const feedParams = getCurrentFeedParams();
  
  try {
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
    
    const res = await fetch(apiUrl);
    const data = await res.json();
    let matches = data.matches || [];
    window._cachedMatches = matches;

    // On upcoming page with upcoming API, sidebar/ticker need live data separately
    if (isUpcomingPage && statusFilter === 'upcoming') {
      window._cachedUpcomingMatches = matches;
      // Fetch live data for sidebar/ticker only
      if (sidebarLiveContainer || tickerContainer) {
        try {
          const liveRes = await fetch(buildApiUrl(API_LIVE, {
            sport: feedParams.sport,
            league: feedParams.league
          }));
          const liveData = await liveRes.json();
          const liveMatches = (liveData.matches || []).filter(m => m.status === 'live');
          window._cachedLiveMatches = liveMatches;
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
      matches = sortMatchesForDisplay(matches, statusFilter);
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
    const isResults = window.location.pathname.includes('results') || (typeof currentTab !== 'undefined' && currentTab === 'results');
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
                <img src="${getSafeImageUrl(match.awayTeam.logo, FALLBACK_LOGO)}" alt="${match.awayTeam.name}" class="w-8 h-8 object-contain" onerror="this.src='${FALLBACK_LOGO}'">
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
  if (hLogo) hLogo.src = data.homeTeam.logo || 'https://raw.githubusercontent.com/ashisbaidya/Livescore-free/main/logo.png';
  if (aLogo) aLogo.src = data.awayTeam.logo || 'https://raw.githubusercontent.com/ashisbaidya/Livescore-free/main/logo.png';
  if (mTime) mTime.textContent = data.time || '00:00';
  if (mDate) mDate.textContent = data.date || 'Scheduled Event';
  if (sName) sName.textContent = data.venue || (data.league ? `${data.league} Arena` : 'TBD Stadium');
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
    const res = await fetch(buildApiUrl(API_LIVE, {
      sport: currentTab || 'all',
      league: currentLeagueFilter || undefined
    }));
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
    <div class="bg-surface-container p-4 rounded-lg border border-white/5 hover:border-primary/30 transition-all cursor-pointer group" onclick="window.location.href='${buildMatchUrl(match)}'">
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
    const res = await fetch(buildApiUrl(API_UPCOMING, {
      sport: currentTab || 'all',
      league: currentLeagueFilter || undefined,
      days: 1
    }));
    const data = await res.json();
    const upcoming = (data.matches || []).filter(m => m.status === 'upcoming');
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
      <button onclick="event.stopPropagation(); handleNotification('${match.id}', '${encodeURIComponent(`${match.homeTeam.name} vs ${match.awayTeam.name}`)}')" class="w-full py-2 border border-white/10 text-[10px] font-black tracking-widest uppercase group-hover:bg-primary group-hover:text-on-primary transition-all">SET REMINDER</button>
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
      const res = await fetch(buildApiUrl(API_UPCOMING, {
        sport,
        league: currentLeagueFilter || undefined,
        days: selectedDateOffset + 1
      }));
      const data = await res.json();
      let matches = data.matches || [];
      window._cachedUpcomingMatches = data.matches || [];

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
                <span class="text-[9px] font-bold text-on-surface/30 uppercase tracking-wider">${m.broadcast || m.league || 'ESPN'}</span>
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
  if (!heroSliderContainer || !window.location.pathname.includes('leagues.html')) return;
  try {
    const res = await fetch(buildApiUrl(API_INFO, { type: 'news', sport: 'all' }));
    const data = await res.json();
    const featured = (data.articles || []).slice(0, 3);
    
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
            <h1 class="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-on-surface mb-4 leading-none">${item.title || item.headline}</h1>
            <p class="text-sm text-on-surface/60 font-medium max-w-md mb-6 leading-relaxed">${item.description || item.summary || 'Deep tactical analysis and live coverage from the multiverse elite.'}</p>
            <div class="flex gap-4">
              <button onclick="window.open('${getArticleLinkUrl(item)}', '_blank')" class="px-8 py-4 kinetic-gradient text-xs font-black uppercase tracking-widest rounded active:scale-95 transition-all">Read Analysis</button>
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


// Global Initialization
fetchLiveCount();
setupNewsletter();
