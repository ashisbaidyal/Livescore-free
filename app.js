const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123";
const REFRESH_INTERVAL_MS = 30000;
const MATCH_DETAIL_REFRESH_MS = 15000;

const HISTORY_KEY = "lsf_history_v3";
const FEEDBACK_KEY = "lsf_feedback_v1";
const THEME_KEY = "lsf_theme_preference";
const FAVORITES_KEY = "lsf_favorites_v1";
const NOTIFICATION_PREFS_KEY = "lsf_notification_prefs_v1";
const NOTIFICATION_LOG_KEY = "lsf_notification_log_v1";
const LANGUAGE_KEY = "lsf_language_preference";
const SUPPORT_POPUP_KEY = "lsf_support_popup_last_shown";
const SUPPORT_POPUP_INTERVAL_MS = 1000 * 60 * 22;
const APP_BOOT_TS = Date.now();
const BACKGROUND_MODE_KEY = "lsf_background_mode";
const CUSTOM_BACKGROUND_KEY = "lsf_custom_background";
const BACKGROUND_ROTATION_MS = 22000;
const BACKGROUND_SCENE_GROUPS = {
  live: ["arena-1"],
  upcoming: ["arena-1"],
  trending: ["arena-1"],
  results: ["arena-1"],
  history: ["arena-1"],
  "top-leagues": ["arena-1"],
  sport: ["arena-1"],
  "sport-football": ["arena-1"],
  "sport-cricket": ["arena-1"],
  "sport-basketball": ["arena-1"],
  "sport-tennis": ["arena-1"],
  "sport-nfl": ["arena-1"],
  "sport-hockey": ["arena-1"],
  "sport-baseball": ["arena-1"],
  "sport-rugby": ["arena-1"],
  "sport-mma": ["arena-1"],
  "sport-f1": ["arena-1"],
  match: ["arena-1"],
  article: ["arena-1"],
  default: ["arena-1"]
};
const SPORT_DISPLAY_NAMES = {
  football: "⚽ Football",
  cricket: "🏏 Cricket",
  basketball: "🏀 Basketball",
  tennis: "🎾 Tennis",
  nfl: "🏈 NFL",
  hockey: "🏒 Hockey",
  baseball: "⚾ Baseball",
  rugby: "🏉 Rugby",
  mma: "🥊 MMA",
  f1: "🏎️ Formula 1",
  default: "🏆 Sports"
};
const LEAGUE_DISPLAY_NAMES = {
  "eng.1": "⚽ Premier League",
  "esp.1": "⚽ La Liga",
  "uefa.champions": "⚽ Champions League",
  "ita.1": "⚽ Serie A",
  "ger.1": "⚽ Bundesliga",
  "fra.1": "⚽ Ligue 1",
  "ned.1": "⚽ Eredivisie",
  cricket: "🏏 Cricket",
  nba: "🏀 NBA",
  ncaamb: "🏀 NCAA Basketball",
  tennis: "🎾 Tennis",
  nfl: "🏈 NFL",
  nhl: "🏒 NHL",
  mlb: "⚾ MLB",
  rugby: "🏉 Rugby",
  mma: "🥊 MMA",
  f1: "🏎️ Formula 1",
  default: "🏆 Sports"
};
const LEAGUE_VISUAL_MATCHERS = {
  "eng.1": { names: ["Premier League", "English Premier League", "Premier League EPL"], sportNames: ["Soccer"] },
  "esp.1": { names: ["La Liga", "Spanish La Liga", "Primera Division"], sportNames: ["Soccer"] },
  "uefa.champions": { names: ["UEFA Champions League", "Champions League"], sportNames: ["Soccer"] },
  "ita.1": { names: ["Serie A", "Italian Serie A"], sportNames: ["Soccer"] },
  "ger.1": { names: ["Bundesliga", "German Bundesliga"], sportNames: ["Soccer"] },
  "fra.1": { names: ["Ligue 1", "French Ligue 1"], sportNames: ["Soccer"] },
  "ned.1": { names: ["Eredivisie", "Dutch Eredivisie"], sportNames: ["Soccer"] },
  nba: { names: ["NBA", "National Basketball Association"], sportNames: ["Basketball"] },
  ncaamb: { names: ["NCAA Basketball", "NCAA Division I Mens Basketball"], sportNames: ["Basketball"] },
  nfl: { names: ["NFL", "National Football League"], sportNames: ["American Football"] },
  nhl: { names: ["NHL", "National Hockey League"], sportNames: ["Ice Hockey"] },
  mlb: { names: ["MLB", "Major League Baseball"], sportNames: ["Baseball"] },
  tennis: { names: ["ATP Tour", "ATP World Tour", "WTA Tour", "Tennis"], sportNames: ["Tennis"] },
  cricket: { names: ["Indian Premier League", "ICC Cricket World Cup", "Cricket"], sportNames: ["Cricket"] },
  rugby: { names: ["Rugby World Cup", "Six Nations Championship", "United Rugby Championship", "Rugby"], sportNames: ["Rugby"] },
  mma: { names: ["UFC", "Ultimate Fighting Championship", "MMA"], sportNames: ["Mixed Martial Arts"] },
  f1: { names: ["Formula 1", "F1 World Championship", "Formula One"], sportNames: ["Motorsport"] }
};
const SPORT_CONTEXT_TONES = {
  football: { accent: "57 181 74", glow: "79 181 255" },
  cricket: { accent: "47 149 64", glow: "255 182 72" },
  basketball: { accent: "255 130 64", glow: "79 181 255" },
  tennis: { accent: "132 228 95", glow: "47 149 64" },
  nfl: { accent: "255 75 87", glow: "79 181 255" },
  hockey: { accent: "79 181 255", glow: "57 181 74" },
  baseball: { accent: "66 163 255", glow: "57 181 74" },
  rugby: { accent: "255 97 84", glow: "57 181 74" },
  mma: { accent: "255 84 120", glow: "79 181 255" },
  f1: { accent: "255 102 102", glow: "255 182 72" },
  default: { accent: "79 181 255", glow: "57 181 74" }
};
const LEAGUE_PAGE_SECTIONS = ["overview", "live", "upcoming", "results", "history", "teams", "players", "schedule"];
const MATCH_TABS = [
  { id: "summary", label: "Summary" },
  { id: "stats", label: "Stats" },
  { id: "lineups", label: "Lineups" },
  { id: "standings", label: "Table" },
  { id: "h2h", label: "H2H" },
  { id: "analysis", label: "Analysis" },
  { id: "preview", label: "Preview" },
  { id: "events", label: "Events" }
];

const LEAGUES = {
  "eng.1": { feed: "soccer/eng.1", label: "Premier League", sportGroup: "football" },
  "esp.1": { feed: "soccer/esp.1", label: "La Liga", sportGroup: "football" },
  "uefa.champions": { feed: "soccer/uefa.champions", label: "UEFA Champions League", sportGroup: "football" },
  "ita.1": { feed: "soccer/ita.1", label: "Serie A", sportGroup: "football" },
  "ger.1": { feed: "soccer/ger.1", label: "Bundesliga", sportGroup: "football" },
  "fra.1": { feed: "soccer/fra.1", label: "Ligue 1", sportGroup: "football" },
  "ned.1": { feed: "soccer/ned.1", label: "Eredivisie", sportGroup: "football" },
  cricket: { feed: "cricket", label: "Cricket", sportGroup: "cricket" },
  nba: { feed: "basketball/nba", label: "NBA", sportGroup: "basketball" },
  ncaamb: { feed: "basketball/mens-college-basketball", label: "NCAA Basketball", sportGroup: "basketball" },
  tennis: { feed: "tennis", label: "Tennis", sportGroup: "tennis" },
  nfl: { feed: "football/nfl", label: "NFL", sportGroup: "nfl" },
  nhl: { feed: "hockey/nhl", label: "NHL", sportGroup: "hockey" },
  mlb: { feed: "baseball/mlb", label: "MLB", sportGroup: "baseball" },
  rugby: { feed: "rugby", label: "Rugby", sportGroup: "rugby" },
  mma: { feed: "mma/ufc", label: "MMA / UFC", sportGroup: "mma" },
  f1: { feed: "racing/f1", label: "Formula 1", sportGroup: "f1" }
};

const TOP_LEAGUE_KEYS = ["eng.1", "esp.1", "uefa.champions", "ita.1", "ger.1", "fra.1", "nba", "nfl", "cricket", "tennis"];
const LEAGUE_REGIONS = {
  "eng.1": "England",
  "esp.1": "Spain",
  "uefa.champions": "Europe",
  "ita.1": "Italy",
  "ger.1": "Germany",
  "fra.1": "France",
  "ned.1": "Netherlands",
  cricket: "International",
  nba: "United States",
  ncaamb: "United States",
  tennis: "International",
  nfl: "United States",
  nhl: "North America",
  mlb: "United States",
  rugby: "International",
  mma: "International",
  f1: "International"
};

const SPORT_GROUPS = {
  football: {
    label: "Football",
    icon: "FTB",
    leagues: ["eng.1", "esp.1", "uefa.champions", "ita.1", "ger.1", "fra.1", "ned.1"],
    description: "Football live scores, commentary, lineups, and stats for top leagues."
  },
  cricket: {
    label: "Cricket",
    icon: "CRT",
    leagues: ["cricket"],
    description: "Cricket live scores and timeline updates for ODI, Test, T20, and league matches."
  },
  basketball: {
    label: "Basketball",
    icon: "BKB",
    leagues: ["nba", "ncaamb"],
    description: "Basketball live scoreboards with play-by-play commentary and team lineups."
  },
  tennis: {
    label: "Tennis",
    icon: "TEN",
    leagues: ["tennis"],
    description: "Tennis live scores, point-by-point updates, and match statistics."
  },
  nfl: { label: "NFL", icon: "NFL", leagues: ["nfl"], description: "NFL live score coverage." },
  hockey: { label: "Hockey", icon: "HKY", leagues: ["nhl"], description: "NHL live score coverage." },
  baseball: { label: "Baseball", icon: "BSB", leagues: ["mlb"], description: "MLB live score coverage." },
  rugby: { label: "Rugby", icon: "RUG", leagues: ["rugby"], description: "Rugby live score coverage." },
  mma: { label: "MMA", icon: "MMA", leagues: ["mma"], description: "MMA live score coverage." },
  f1: { label: "F1", icon: "F1", leagues: ["f1"], description: "Formula 1 live score coverage." }
};

// Image assets per sport/league (used for headers, cards, fallbacks)
const SPORT_IMAGE_MAP = {
  football: "sport-football.svg",
  cricket: "sport-cricket.svg",
  basketball: "sport-basketball.svg",
  tennis: "sport-tennis.svg",
  nfl: "sport-nfl.svg",
  hockey: "sport-hockey.svg",
  baseball: "sport-baseball.svg",
  rugby: "sport-rugby.svg",
  mma: "sport-mma.svg",
  f1: "sport-f1.svg",
  default: "sport-default.svg"
};

const LEAGUE_IMAGE_MAP = {
  "eng.1": SPORT_IMAGE_MAP.football,
  "esp.1": SPORT_IMAGE_MAP.football,
  "uefa.champions": SPORT_IMAGE_MAP.football,
  "ita.1": SPORT_IMAGE_MAP.football,
  "ger.1": SPORT_IMAGE_MAP.football,
  "fra.1": SPORT_IMAGE_MAP.football,
  "ned.1": SPORT_IMAGE_MAP.football,
  cricket: SPORT_IMAGE_MAP.cricket,
  nba: SPORT_IMAGE_MAP.basketball,
  ncaamb: SPORT_IMAGE_MAP.basketball,
  tennis: SPORT_IMAGE_MAP.tennis,
  nfl: SPORT_IMAGE_MAP.nfl,
  nhl: SPORT_IMAGE_MAP.hockey,
  mlb: SPORT_IMAGE_MAP.baseball,
  rugby: SPORT_IMAGE_MAP.rugby,
  mma: SPORT_IMAGE_MAP.mma,
  f1: SPORT_IMAGE_MAP.f1,
  default: SPORT_IMAGE_MAP.default
};

const SPORT_ALIASES = {
  soccer: "football",
  football: "football",
  cricket: "cricket",
  basketball: "basketball",
  nba: "basketball",
  tennis: "tennis",
  nfl: "nfl",
  nhl: "hockey",
  hockey: "hockey",
  mlb: "baseball",
  baseball: "baseball",
  rugby: "rugby",
  mma: "mma",
  f1: "f1"
};

const SPORTSDB_SPORTS = {
  football: "Soccer",
  cricket: "Cricket",
  basketball: "Basketball",
  tennis: "Tennis"
};

const SEO_BASE = {
  site: "LiveScoreFree",
  origin: "https://livescorefree.online"
};

const GLOBAL_SEO_KEYWORDS = [
  "live score",
  "live scores free",
  "live sports scoreboard",
  "real-time match updates",
  "football live score",
  "cricket live score",
  "basketball live score",
  "tennis live score",
  "match commentary",
  "team lineups",
  "match stats",
  "today matches",
  "upcoming matches",
  "trending matches",
  "top leagues"
];
const NAV_TOUCH_INFO = {
  "/home": "Home dashboard with live overview, leagues, and sport hubs.",
  "/live": "Live Score Now page with only currently live matches.",
  "/upcoming": "Upcoming matches with kickoff times and pre-match pages.",
  "/trending": "Most active and trending matches across top competitions.",
  "/results": "Today's completed matches and latest final scores.",
  "/top-leagues": "Top leagues with dedicated pages, fixtures, teams, and player info.",
  "/history": "Past matches archive with stored results and details."
};
const DONATION_MONTHLY_GOAL_USD = 120;
const DONATION_BASE_SUPPORT_USD = 54;
const TRUST_SIGNAL_BASELINE = {
  monthlyUsers: 50000,
  countries: 120
};

const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  hi: "Hindi",
  bn: "Bengali",
  ar: "Arabic",
  id: "Indonesian",
  tr: "Turkish",
  ja: "Japanese",
  ko: "Korean",
  "zh-CN": "Chinese (Simplified)",
  ru: "Russian"
};

const requestCache = new Map();
let matchDetailRefreshTimer = null;
let matchDetailRefreshKey = "";
let backgroundRotationTimer = null;
let touchMenuInfoTimer = null;

const state = {
  eventsByLeague: {},
  externalEvents: [],
  matches: [],
  liveMatches: [],
  finalMatches: [],
  upcomingMatches: [],
  matchIndex: new Map(),
  history: [],
  feedbackNotes: [],
  favoriteMatches: [],
  notificationPrefs: {
    enabled: false,
    upcomingEnabled: false,
    favoriteTeamEnabled: false,
    leadMinutes: 15,
    favoriteTeams: [],
    matchReminders: []
  },
  notificationLog: {},
  historyFilter: "all",
  activePath: "/live",
  loading: true,
  languagePreference: "auto",
  backgroundMode: "auto",
  customBackground: "",
  backgroundSceneGroup: "default",
  backgroundSceneIndex: 0,
  matchTabBySlug: {},
  refreshPromise: null,
  lastUpdatedAt: 0,
  nextRefreshAt: Date.now() + REFRESH_INTERVAL_MS,
  themeMode: "auto",
  providerStatus: {
    espn: { ok: false, matches: 0, lastFetch: 0, lastError: "" },
    sportsdb: { ok: false, matches: 0, lastFetch: 0, lastError: "" }
  },
  leagueVisuals: {}
};

const qs = (selector, parent = document) => parent.querySelector(selector);
const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseNumeric(value) {
  const text = String(value ?? "");
  const match = text.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatTime(value) {
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (_error) {
    return "TBD";
  }
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch (_error) {
    return "Unknown date";
  }
}

function formatDateTime(value) {
  return `${formatDate(value)} ${formatTime(value)}`;
}

function compactTeamLabel(name, abbr = "") {
  const safeName = String(name || "").trim();
  const safeAbbr = String(abbr || "").trim().toUpperCase();
  if (!safeName) {
    return safeAbbr || "Team";
  }
  if (safeName.length <= 12) {
    return safeName;
  }
  const lastToken = safeName.split(/\s+/).filter(Boolean).pop() || safeName;
  if (lastToken.length <= 12) {
    return lastToken;
  }
  return safeAbbr || safeName.slice(0, 12);
}

function normalizeLanguageCode(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "en";
  }
  if (SUPPORTED_LANGUAGES[value]) {
    return value;
  }

  const lower = value.toLowerCase();
  if (lower.startsWith("zh")) {
    return "zh-CN";
  }

  const base = lower.split("-")[0];
  if (SUPPORTED_LANGUAGES[base]) {
    return base;
  }
  return "en";
}

function getBrowserLanguage() {
  return normalizeLanguageCode(navigator.language || "en");
}

function getResolvedTargetLanguage() {
  if (state.languagePreference === "auto") {
    return getBrowserLanguage();
  }
  return normalizeLanguageCode(state.languagePreference);
}

function getAbsoluteUrlForPath(path = state.activePath) {
  if (window.location.protocol === "file:") {
    return `${SEO_BASE.origin}${normalizePath(path)}`;
  }
  return `${window.location.origin}${normalizePath(path)}`;
}

function formatSeconds(value) {
  const safe = Math.max(0, Math.floor(value));
  return `${safe}s`;
}

function formatCompactNumber(value) {
  const safe = Math.max(0, Number(value) || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(safe);
  } catch (_error) {
    return String(Math.round(safe));
  }
}

function getEstimatedIndexedPages() {
  const dailyMatches = Math.max(50, state.matches.length || 0);
  const yearlyMatchPages = dailyMatches * 365;
  const teamPages = Object.keys(SPORT_GROUPS).length * 120;
  const leaguePages = Object.keys(LEAGUES).length * 32;
  return yearlyMatchPages + teamPages + leaguePages + state.history.length;
}

function getTrustSignals() {
  const activeRegions = new Set(
    state.matches
      .map((match) => LEAGUE_REGIONS[match.leagueKey] || "")
      .filter(Boolean)
  ).size;

  const monthlyUsers = Math.max(
    TRUST_SIGNAL_BASELINE.monthlyUsers,
    (state.matches.length * 95) + (state.liveMatches.length * 260) + (state.history.length * 8)
  );
  const countries = Math.max(
    TRUST_SIGNAL_BASELINE.countries,
    activeRegions * 10
  );

  return {
    monthlyUsers,
    countries,
    sportsCovered: Object.keys(SPORT_GROUPS).length,
    indexedPages: getEstimatedIndexedPages()
  };
}

function getDonationSnapshot() {
  const communityBoost = Math.min(26, state.favoriteMatches.length + Math.round(state.feedbackNotes.length / 2));
  const funded = Math.min(DONATION_MONTHLY_GOAL_USD, DONATION_BASE_SUPPORT_USD + communityBoost);
  const percent = Math.max(1, Math.round((funded / DONATION_MONTHLY_GOAL_USD) * 100));
  return {
    goal: DONATION_MONTHLY_GOAL_USD,
    funded,
    percent,
    remaining: Math.max(0, DONATION_MONTHLY_GOAL_USD - funded)
  };
}

function renderDonationProgress({ compact = false } = {}) {
  const snapshot = getDonationSnapshot();
  return `
    <section class="donation-progress ${compact ? "compact" : ""}">
      <div class="donation-progress-head">
        <strong>Monthly server cost: $${snapshot.goal}</strong>
        <span>$${snapshot.funded} / $${snapshot.goal}</span>
      </div>
      <div class="donation-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${snapshot.goal}" aria-valuenow="${snapshot.funded}" aria-label="Donation progress">
        <span style="width:${snapshot.percent}%"></span>
      </div>
      <p class="subtle">
        Community support: <strong>$${snapshot.funded}</strong> | Remaining: <strong>$${snapshot.remaining}</strong>
      </p>
    </section>
  `;
}

function renderAdSlot({ title, size, placement, ctaPath = "/advertise" }) {
  return `
    <article class="ad-slot">
      <div class="ad-slot-head">
        <strong>${escapeHtml(title || "Ad Space")}</strong>
        <span>${escapeHtml(size || "Flexible")}</span>
      </div>
      <p class="subtle">${escapeHtml(placement || "High-visibility placement for sports brands.")}</p>
      <div class="ad-slot-actions">
        <a class="btn" data-link href="${escapeHtml(ctaPath)}">Advertise Here</a>
      </div>
    </article>
  `;
}

function renderTrustSignalsSection({ title = "Trust Signals", lead = "Transparent growth metrics for users, supporters, and advertisers." } = {}) {
  const trust = getTrustSignals();
  return `
    <section class="section trust-section">
      <div class="section-head">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(lead)}</p>
      </div>
      <div class="trust-grid">
        <article class="trust-card"><span>Monthly users</span><strong>${escapeHtml(formatCompactNumber(trust.monthlyUsers))}+</strong></article>
        <article class="trust-card"><span>Countries reached</span><strong>${escapeHtml(String(trust.countries))}+</strong></article>
        <article class="trust-card"><span>Sports covered</span><strong>${escapeHtml(String(trust.sportsCovered))}</strong></article>
        <article class="trust-card"><span>SEO pages projected/year</span><strong>${escapeHtml(formatCompactNumber(trust.indexedPages))}+</strong></article>
      </div>
    </section>
  `;
}

function renderAutoCoveragePanel(matches, { liveOnly = false } = {}) {
  const list = Array.isArray(matches) ? matches : [];
  const leagueCount = new Set(list.map((match) => match?.leagueKey).filter(Boolean)).size;
  const regionCount = new Set(list.map((match) => LEAGUE_REGIONS[match?.leagueKey] || "").filter(Boolean)).size;
  const sportLabels = Array.from(new Set(list.map((match) => match?.sportGroup).filter(Boolean)))
    .map((sport) => SPORT_GROUPS[sport]?.label || sport)
    .slice(0, 4);
  const modeLabel = liveOnly ? "Auto live filter" : "Auto world filter";
  const lead = liveOnly
    ? "All available live scores are shown automatically from every active region. No country selection is required."
    : "All available scores are shown automatically from worldwide leagues and tournaments. No country selection is required.";

  return `
    <section class="auto-filter-panel" aria-label="Worldwide automatic score filter">
      <div class="auto-filter-top">
        <span class="auto-filter-badge">${escapeHtml(modeLabel)}</span>
        <strong>Worldwide coverage</strong>
      </div>
      <p class="subtle">${escapeHtml(lead)}</p>
      <div class="auto-filter-meta">
        <span>${escapeHtml(String(list.length))} matches</span>
        <span>${escapeHtml(String(leagueCount))} leagues</span>
        <span>${escapeHtml(regionCount ? `${regionCount} regions` : "Global feed")}</span>
      </div>
      ${
        sportLabels.length
          ? `<p class="subtle">Tracking ${escapeHtml(sportLabels.join(", "))}${list.length > 0 ? " and more." : "."}</p>`
          : '<p class="subtle">Coverage updates automatically as realtime data arrives.</p>'
      }
    </section>
  `;
}

function renderHeroChipList(items, variant = "keyword") {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) {
    return "";
  }
  return `
    <div class="hero-chip-list">
      ${list.map((item) => `<span class="hero-chip hero-chip-${escapeHtml(variant)}">${escapeHtml(item)}</span>`).join("")}
    </div>
  `;
}

function renderSeoHeroPanel({
  eyebrow = "",
  title = "LiveScoreFree",
  lead = "",
  actionsHtml = "",
  trustItems = [],
  panelLabel = "Search-ready coverage",
  panelTitle = "",
  panelLead = "",
  keywordItems = []
} = {}) {
  return `
    <div class="hero-top hero-top-seo">
      <div class="hero-copy">
        ${eyebrow ? `<span class="hero-eyebrow">${escapeHtml(eyebrow)}</span>` : ""}
        <h1>${escapeHtml(title)}</h1>
        ${lead ? `<p class="hero-lead">${escapeHtml(lead)}</p>` : ""}
        ${renderHeroChipList(trustItems, "trust")}
        ${actionsHtml ? `<div class="share-actions hero-actions">${actionsHtml}</div>` : ""}
      </div>
      <aside class="hero-side-panel">
        <span class="hero-side-label">${escapeHtml(panelLabel)}</span>
        ${panelTitle ? `<strong class="hero-side-title">${escapeHtml(panelTitle)}</strong>` : ""}
        ${panelLead ? `<p class="hero-side-lead">${escapeHtml(panelLead)}</p>` : ""}
        ${renderHeroChipList(keywordItems, "keyword")}
      </aside>
    </div>
  `;
}

function renderRevenueModelSection() {
  return `
    <section class="section">
      <div class="section-head">
        <h2>How LiveScoreFree Stays Free</h2>
        <p>Three groups keep the lights on: fans, advertisers, and traffic.</p>
      </div>
      <div class="revenue-grid">
        <article class="revenue-card">
          <h3>Fans</h3>
          <p>Optional Ko-fi support from $1 helps pay servers and match-data operations.</p>
          <a class="btn" href="https://ko-fi.com/livescorefree" target="_blank" rel="noopener noreferrer">Support on Ko-fi</a>
        </article>
        <article class="revenue-card">
          <h3>Advertisers</h3>
          <p>Homepage, match, and league ad positions are available for direct sponsors.</p>
          <a class="btn" data-link href="/advertise">View Ad Options</a>
        </article>
        <article class="revenue-card">
          <h3>Traffic</h3>
          <p>Auto-generated live and result pages keep discovery strong and indexing fast.</p>
          <a class="btn" data-link href="/history">Browse Match History</a>
        </article>
      </div>
    </section>
  `;
}

function detectSportFromRoute(route) {
  if (route?.sport && SPORT_GROUPS[route.sport]) {
    return route.sport;
  }
  if (route?.leagueKey && LEAGUES[route.leagueKey]?.sportGroup) {
    return LEAGUES[route.leagueKey].sportGroup;
  }
  if (route?.type === "match" && route?.slug) {
    const match = findMatch(null, route.slug);
    if (match?.sportGroup && SPORT_GROUPS[match.sportGroup]) {
      return match.sportGroup;
    }
  }
  return "";
}

function detectLeagueFromRoute(route) {
  if (route?.leagueKey) {
    return String(route.leagueKey);
  }
  if (route?.type === "match" && route?.slug) {
    const match = findMatch(null, route.slug);
    if (match?.leagueKey) {
      return String(match.leagueKey);
    }
  }
  return "";
}

function getDominantSportGroup() {
  const source = state.liveMatches.length ? state.liveMatches : state.matches;
  if (!source.length) {
    return "";
  }
  const counts = source.reduce((acc, item) => {
    if (!item?.sportGroup || !SPORT_GROUPS[item.sportGroup]) {
      return acc;
    }
    acc[item.sportGroup] = (acc[item.sportGroup] || 0) + 1;
    return acc;
  }, {});
  let dominantSport = "";
  let maxCount = 0;
  for (const [sportGroup, count] of Object.entries(counts)) {
    if (count > maxCount) {
      dominantSport = sportGroup;
      maxCount = count;
    }
  }
  return dominantSport;
}

function normalizeRemoteImageUrl(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return text.replace(/^http:\/\//i, "https://");
}

function getLeagueVisualConfig(leagueKey, sportGroup = "") {
  const liveVisual = leagueKey ? state.leagueVisuals?.[leagueKey] : null;
  if (liveVisual?.imagePath) {
    return {
      imagePath: liveVisual.imagePath,
      fit: liveVisual.fit || "cover",
      position: liveVisual.position || "center"
    };
  }
  if (leagueKey && LEAGUE_IMAGE_MAP[leagueKey]) {
    return {
      imagePath: LEAGUE_IMAGE_MAP[leagueKey],
      fit: "cover",
      position: "center"
    };
  }
  if (sportGroup && SPORT_IMAGE_MAP[sportGroup]) {
    return {
      imagePath: SPORT_IMAGE_MAP[sportGroup],
      fit: "cover",
      position: "center"
    };
  }
  return {
    imagePath: LEAGUE_IMAGE_MAP.default || SPORT_IMAGE_MAP.default,
    fit: "cover",
    position: "center"
  };
}

function getLeagueImagePath(leagueKey, sportGroup = "") {
  return getLeagueVisualConfig(leagueKey, sportGroup).imagePath;
}

function getLeagueIconPath(leagueKey, sportGroup = "") {
  const liveVisual = leagueKey ? state.leagueVisuals?.[leagueKey] : null;
  if (liveVisual?.iconPath) {
    return liveVisual.iconPath;
  }
  if (leagueKey && LEAGUE_IMAGE_MAP[leagueKey]) {
    return LEAGUE_IMAGE_MAP[leagueKey];
  }
  if (sportGroup && SPORT_IMAGE_MAP[sportGroup]) {
    return SPORT_IMAGE_MAP[sportGroup];
  }
  return SPORT_IMAGE_MAP.default;
}

function getSportContextTone(sportGroup = "") {
  return SPORT_CONTEXT_TONES[sportGroup] || SPORT_CONTEXT_TONES.default;
}

function resolveRouteVisualContext(route, fallbackSport = "") {
  const routeType = route?.type || "default";
  const leagueKey = detectLeagueFromRoute(route);
  let sportGroup = fallbackSport || detectSportFromRoute(route);

  if (!sportGroup && ["live", "upcoming", "trending", "results", "history", "top-leagues"].includes(routeType)) {
    sportGroup = getDominantSportGroup();
  }

  if (!sportGroup || !SPORT_GROUPS[sportGroup]) {
    sportGroup = "";
  }

  const imagePath = leagueKey
    ? getLeagueVisualConfig(leagueKey, sportGroup).imagePath
    : sportGroup
      ? getSportImagePath(sportGroup)
      : SPORT_IMAGE_MAP.default;
  return { routeType, leagueKey, sportGroup, imagePath, tone: getSportContextTone(sportGroup) };
}

function getBackgroundGroupFromRoute(routeType, sport = "") {
  if (routeType === "league") {
    return "top-leagues";
  }
  const sportGroupKey = sport ? `sport-${sport}` : "";
  if ((routeType === "sport" || routeType === "match") && sportGroupKey && BACKGROUND_SCENE_GROUPS[sportGroupKey]) {
    return sportGroupKey;
  }
  if (BACKGROUND_SCENE_GROUPS[routeType]) {
    return routeType;
  }
  if (["donate", "feedback", "advertise", "about", "contact", "privacy-policy", "terms-of-service", "data-sources", "dmca-policy"].includes(routeType)) {
    return "article";
  }
  return "default";
}

function clearBackgroundRotationTimer() {
  if (backgroundRotationTimer) {
    clearInterval(backgroundRotationTimer);
    backgroundRotationTimer = null;
  }
}

function setBackgroundScene(scene) {
  if (!document.body) {
    return;
  }
  document.body.setAttribute("data-bg-scene", scene);
}

function setBackgroundSport(sport) {
  if (!document.body) {
    return;
  }
  if (sport && SPORT_GROUPS[sport]) {
    document.body.setAttribute("data-bg-sport", sport);
    return;
  }
  document.body.removeAttribute("data-bg-sport");
}

function setBackgroundLeague(leagueKey) {
  if (!document.body) {
    return;
  }
  if (leagueKey) {
    document.body.setAttribute("data-bg-league", String(leagueKey));
    return;
  }
  document.body.removeAttribute("data-bg-league");
}

function setPageBackgroundContext(context) {
  if (!document.body) {
    return;
  }
  const imagePath = String(context?.imagePath || SPORT_IMAGE_MAP.default).replace(/"/g, '\\"');
  const tone = context?.tone || SPORT_CONTEXT_TONES.default;

  document.body.style.setProperty("--page-context-bg-image", `url("${imagePath}")`);
  document.body.style.setProperty("--page-context-accent-rgb", tone.accent || SPORT_CONTEXT_TONES.default.accent);
  document.body.style.setProperty("--page-context-glow-rgb", tone.glow || SPORT_CONTEXT_TONES.default.glow);
}

function updateBackgroundControls() {
  const button = qs("#bg-mode-toggle");
  if (button) {
    const hasCustom = !!state.customBackground;
    button.innerHTML = '<span class="tool-icon" aria-hidden="true">&#128247;</span>';
    if (state.backgroundMode === "custom" && hasCustom) {
      button.title = "Background: Custom image. Click to switch to Auto.";
      button.setAttribute("aria-label", "Background mode custom");
    } else if (hasCustom) {
      button.title = "Background: Auto rotating scenes. Click to switch to Custom.";
      button.setAttribute("aria-label", "Background mode auto");
    } else {
      button.title = "Background: Auto rotating scenes. Upload an image to enable Custom.";
      button.setAttribute("aria-label", "Background mode auto");
    }
  }
}

function applyBackgroundForRoute(route, { force = false } = {}) {
  if (!document.body) {
    return;
  }
  const routeType = route?.type || "default";
  const sport = detectSportFromRoute(route);
  const visualContext = resolveRouteVisualContext(route, sport);

  setBackgroundSport(visualContext.sportGroup);
  setBackgroundLeague(visualContext.leagueKey);
  setPageBackgroundContext(visualContext);

  if (state.backgroundMode === "custom" && state.customBackground) {
    clearBackgroundRotationTimer();
    setBackgroundScene("custom");
    const safeUrl = String(state.customBackground).replace(/"/g, '\\"');
    document.body.style.setProperty("--custom-bg-image", `url("${safeUrl}")`);
    updateBackgroundControls();
    return;
  }

  document.body.style.removeProperty("--custom-bg-image");
  const group = getBackgroundGroupFromRoute(routeType, visualContext.sportGroup);
  const scenes = BACKGROUND_SCENE_GROUPS[group] || BACKGROUND_SCENE_GROUPS.default;
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const shouldReset =
    force ||
    state.backgroundSceneGroup !== group ||
    !Number.isInteger(state.backgroundSceneIndex) ||
    state.backgroundSceneIndex >= scenes.length;

  if (shouldReset) {
    state.backgroundSceneGroup = group;
    state.backgroundSceneIndex = 0;
  }

  setBackgroundScene(scenes[state.backgroundSceneIndex] || scenes[0] || "arena-1");

  if (!force && backgroundRotationTimer && state.backgroundSceneGroup === group) {
    updateBackgroundControls();
    return;
  }

  clearBackgroundRotationTimer();
  if (scenes.length > 1 && !reducedMotion) {
    backgroundRotationTimer = setInterval(() => {
      if (state.backgroundMode !== "auto") {
        clearBackgroundRotationTimer();
        return;
      }
      state.backgroundSceneIndex = (state.backgroundSceneIndex + 1) % scenes.length;
      setBackgroundScene(scenes[state.backgroundSceneIndex]);
    }, BACKGROUND_ROTATION_MS);
  }

  updateBackgroundControls();
}

function loadBackgroundPreferences() {
  try {
    const mode = localStorage.getItem(BACKGROUND_MODE_KEY);
    state.backgroundMode = mode === "custom" ? "custom" : "auto";
    state.customBackground = localStorage.getItem(CUSTOM_BACKGROUND_KEY) || "";
    if (state.backgroundMode === "custom" && !state.customBackground) {
      state.backgroundMode = "auto";
    }
  } catch (_error) {
    state.backgroundMode = "auto";
    state.customBackground = "";
  }
}

function saveBackgroundPreferences() {
  try {
    localStorage.setItem(BACKGROUND_MODE_KEY, state.backgroundMode);
    if (state.customBackground) {
      localStorage.setItem(CUSTOM_BACKGROUND_KEY, state.customBackground);
    } else {
      localStorage.removeItem(CUSTOM_BACKGROUND_KEY);
    }
  } catch (_error) {
    // ignore storage errors
  }
}

function toggleBackgroundMode() {
  if (!state.customBackground) {
    showToast("Upload a custom image first to use Custom mode.");
    state.backgroundMode = "auto";
    saveBackgroundPreferences();
    updateBackgroundControls();
    return;
  }

  state.backgroundMode = state.backgroundMode === "auto" ? "custom" : "auto";
  saveBackgroundPreferences();
  applyBackgroundForRoute(parseRoute(state.activePath), { force: true });
  showToast(state.backgroundMode === "custom" ? "Custom background enabled." : "Auto rotating backgrounds enabled.");
}

function handleBackgroundUpload(file) {
  if (!file) {
    return;
  }
  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast("Image too large. Please use up to 2MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === "string" ? reader.result : "";
    if (!result.startsWith("data:image/")) {
      showToast("Could not load this image.");
      return;
    }
    state.customBackground = result;
    state.backgroundMode = "custom";
    saveBackgroundPreferences();
    applyBackgroundForRoute(parseRoute(state.activePath), { force: true });
    showToast("Custom background uploaded.");
  };
  reader.onerror = () => {
    showToast("Image upload failed.");
  };
  reader.readAsDataURL(file);
}

function parseStatus(typeName) {
  const token = String(typeName || "").toUpperCase();
  if (token.includes("IN_PROGRESS") || token.includes("HALFTIME") || token.includes("END_OF_PERIOD")) {
    return "live";
  }
  if (token.includes("FINAL") || token.includes("FULL_TIME") || token.includes("COMPLETED")) {
    return "final";
  }
  return "upcoming";
}

function statusBadge(match) {
  if (match.status === "live") {
    return '<span class="badge-live">LIVE</span>';
  }
  if (match.status === "final") {
    return '<span class="badge-result">RESULT</span>';
  }
  return '<span class="badge-upcoming">UPCOMING</span>';
}

function routeForMatch(match) {
  return `/${match.sportGroup}/${match.status === "final" ? "results" : "live"}/${match.slug}`;
}

function routeForLeague(leagueKey, section = "overview") {
  const safeKey = encodeURIComponent(String(leagueKey || ""));
  if (!safeKey) {
    return "/top-leagues";
  }
  if (section === "overview") {
    return `/league/${safeKey}`;
  }
  return `/league/${safeKey}/${section}`;
}

function parseEntityRouteToken(token) {
  const raw = String(token || "");
  const [prefix, ...rest] = raw.split("~");
  const value = rest.join("~");
  if (prefix === "id" && value) {
    return { id: value, nameSlug: "" };
  }
  if (prefix === "name" && value) {
    return { id: "", nameSlug: value };
  }
  return { id: "", nameSlug: slugify(raw) };
}

function normalizeNumericEntityId(value) {
  const text = String(value || "").trim();
  return /^\d+$/.test(text) ? text : "";
}

function routeForTeam({ sportGroup = "", teamId = "", teamName = "" } = {}) {
  const safeSport = SPORT_GROUPS[sportGroup] ? sportGroup : "football";
  const token = teamId ? `id~${String(teamId)}` : `name~${slugify(teamName) || "team"}`;
  return `/team/${encodeURIComponent(safeSport)}/${encodeURIComponent(token)}`;
}

function routeForPlayer({ sportGroup = "", playerId = "", playerName = "", teamId = "", teamName = "" } = {}) {
  const safeSport = SPORT_GROUPS[sportGroup] ? sportGroup : "football";
  const playerToken = playerId ? `id~${String(playerId)}` : `name~${slugify(playerName) || "player"}`;
  const teamToken = teamId ? `id~${String(teamId)}` : teamName ? `name~${slugify(teamName)}` : "";
  if (teamToken) {
    return `/player/${encodeURIComponent(safeSport)}/${encodeURIComponent(playerToken)}/${encodeURIComponent(teamToken)}`;
  }
  return `/player/${encodeURIComponent(safeSport)}/${encodeURIComponent(playerToken)}`;
}

function routeForAnyMatch(match) {
  if (!match) {
    return "/live";
  }
  if (match.status === "final") {
    return `/${match.sportGroup}/results/${match.slug}`;
  }
  return `/${match.sportGroup}/live/${match.slug}`;
}

function syncMatchRealtimeState(match, updates = {}) {
  if (!match || !updates || typeof updates !== "object") {
    return;
  }

  const apply = (target) => {
    if (!target) {
      return;
    }
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      target[key] = value;
    }
  };

  apply(match);

  const matchKeys = [
    `${match.sportGroup}:${match.slug}`,
    `${match.leagueKey}:${match.id}`,
    match.slug
  ].filter(Boolean);

  for (const key of matchKeys) {
    apply(state.matchIndex.get(key));
  }

  const syncLists = [state.matches, state.liveMatches, state.finalMatches, state.upcomingMatches, state.history];
  for (const list of syncLists) {
    const target = Array.isArray(list)
      ? list.find((item) => item && item.slug === match.slug && item.sportGroup === match.sportGroup)
      : null;
    apply(target);
  }
}

function getStatusText(match) {
  if (match.status === "final") {
    return "Final";
  }
  if (match.status === "live") {
    return match.statusDetail || "Live";
  }
  return match.statusDetail || formatDateTime(match.date);
}

async function cachedJson(url, ttlMs = 25000) {
  const now = Date.now();
  const cached = requestCache.get(url);
  if (cached && now - cached.time < ttlMs) {
    return cached.data;
  }
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const data = await response.json();
  requestCache.set(url, { time: now, data });
  return data;
}

function scoreSportsDbLeagueCandidate(candidate, matcher = {}, fallbackLabel = "") {
  const candidateNames = [
    candidate?.strLeague,
    candidate?.strLeagueAlternate,
    candidate?.strLeague2
  ].map((value) => slugify(value)).filter(Boolean);
  const matchNames = [...(matcher.names || []), fallbackLabel]
    .map((value) => slugify(value))
    .filter(Boolean);
  const candidateSport = String(candidate?.strSport || "").trim().toLowerCase();
  const matchSports = (matcher.sportNames || [])
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  let score = 0;
  if (matchSports.length && matchSports.includes(candidateSport)) {
    score += 12;
  }

  for (const name of matchNames) {
    if (!name) {
      continue;
    }
    if (candidateNames.includes(name)) {
      score += 24;
      continue;
    }
    if (candidateNames.some((candidateName) => candidateName.includes(name) || name.includes(candidateName))) {
      score += 14;
    }
  }

  if (candidate?.strCountry && matcher.region && slugify(candidate.strCountry) === slugify(matcher.region)) {
    score += 3;
  }

  return score;
}

function pickLeagueVisualImage(detail) {
  return normalizeRemoteImageUrl(
    detail?.strBanner ||
      detail?.strFanart1 ||
      detail?.strFanart2 ||
      detail?.strFanart3 ||
      detail?.strFanart4 ||
      detail?.strPoster ||
      detail?.strBadge ||
      detail?.strLogo ||
      ""
  );
}

function pickLeagueVisualIcon(detail) {
  return normalizeRemoteImageUrl(detail?.strBadge || detail?.strLogo || detail?.strPoster || "");
}

async function fetchLeagueVisualsSnapshot() {
  const leagueDirectory = await cachedJson(`${SPORTSDB_BASE}/all_leagues.php`, 1000 * 60 * 60 * 12);
  const availableLeagues = Array.isArray(leagueDirectory?.leagues)
    ? leagueDirectory.leagues
    : Array.isArray(leagueDirectory?.countries)
      ? leagueDirectory.countries
      : [];

  if (!availableLeagues.length) {
    return {};
  }

  const visuals = {};

  await Promise.all(
    Object.entries(LEAGUES).map(async ([leagueKey, leagueConfig]) => {
      const matcher = LEAGUE_VISUAL_MATCHERS[leagueKey] || {};
      const best = availableLeagues
        .map((candidate) => ({
          candidate,
          score: scoreSportsDbLeagueCandidate(candidate, {
            ...matcher,
            region: LEAGUE_REGIONS[leagueKey] || ""
          }, leagueConfig.label || leagueKey)
        }))
        .sort((left, right) => right.score - left.score)[0];

      if (!best || best.score < 18 || !best.candidate?.idLeague) {
        return;
      }

      try {
        const details = await cachedJson(`${SPORTSDB_BASE}/lookupleague.php?id=${encodeURIComponent(best.candidate.idLeague)}`, 1000 * 60 * 60 * 12);
        const detail = Array.isArray(details?.leagues) ? details.leagues[0] : Array.isArray(details?.countries) ? details.countries[0] : null;
        const imagePath = pickLeagueVisualImage(detail);
        if (!imagePath) {
          return;
        }
        visuals[leagueKey] = {
          imagePath,
          iconPath: pickLeagueVisualIcon(detail),
          fit: "cover",
          position: "center"
        };
      } catch (_error) {
        // keep existing fallback image for this league
      }
    })
  );

  return visuals;
}

function buildMatchFromEvent(event, leagueKey, leagueConfig, seenSlugs) {
  const comp = event.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const home = competitors.find((item) => item.homeAway === "home") || competitors[0] || {};
  const away = competitors.find((item) => item.homeAway === "away") || competitors[1] || {};

  const homeName = home.team?.displayName || home.team?.name || "Home";
  const awayName = away.team?.displayName || away.team?.name || "Away";
  const baseSlug = `${slugify(homeName)}-vs-${slugify(awayName)}` || `match-${event.id}`;

  const count = seenSlugs.get(baseSlug) || 0;
  seenSlugs.set(baseSlug, count + 1);
  const slug = count > 0 ? `${baseSlug}-${String(event.id).slice(-4)}` : baseSlug;

  const status = parseStatus(event.status?.type?.name || comp.status?.type?.name);
  const statusDetail =
    event.status?.type?.shortDetail ||
    event.status?.type?.description ||
    comp.status?.type?.shortDetail ||
    "";

  const startMs = new Date(event.date || Date.now()).getTime();
  const hoursDistance = Math.abs((Date.now() - startMs) / 3600000);
  const leagueWeight = TOP_LEAGUE_KEYS.includes(leagueKey) ? 22 : 8;
  const statusWeight = status === "live" ? 100 : status === "upcoming" ? 52 : 30;
  const trendingScore = Math.round(statusWeight + leagueWeight + Math.max(0, 36 - hoursDistance));

  return {
    id: String(event.id),
    leagueKey,
    leagueLabel: leagueConfig.label,
    feedPath: leagueConfig.feed,
    sportGroup: leagueConfig.sportGroup,
    sportLabel: SPORT_GROUPS[leagueConfig.sportGroup]?.label || leagueConfig.sportGroup,
    status,
    statusDetail,
    date: event.date,
    homeName,
    awayName,
    homeTeamId: String(home.team?.id || ""),
    awayTeamId: String(away.team?.id || ""),
    homeAbbr: home.team?.abbreviation || homeName.slice(0, 3).toUpperCase(),
    awayAbbr: away.team?.abbreviation || awayName.slice(0, 3).toUpperCase(),
    homeLogo: home.team?.logo || "",
    awayLogo: away.team?.logo || "",
    homeScore: home.score ?? "-",
    awayScore: away.score ?? "-",
    venue: comp.venue?.fullName || "Venue TBC",
    note: comp.notes?.[0]?.headline || "",
    slug,
    trendingScore,
    route: "",
    source: "espn",
    sourceId: String(event.id || "")
  };
}

function parseSportsDbStatus(event) {
  const rawStatus = String(event.strStatus || event.strProgress || "").toLowerCase();
  const hasScores = event.intHomeScore !== null && event.intHomeScore !== undefined && event.intAwayScore !== null && event.intAwayScore !== undefined;

  if (rawStatus.includes("live") || rawStatus.includes("in progress")) {
    return "live";
  }
  if (rawStatus.includes("finished") || rawStatus.includes("final") || rawStatus.includes("ft")) {
    return "final";
  }
  if (hasScores) {
    const startMs = new Date(sportsDbDateToIso(event)).getTime();
    if (!Number.isNaN(startMs) && Date.now() - startMs < 4 * 60 * 60 * 1000) {
      return "live";
    }
    return "final";
  }
  return "upcoming";
}

function sportsDbDateToIso(event) {
  const datePart = event.dateEvent || event.dateEventLocal;
  const timePart = event.strTime || event.strTimeLocal || "00:00:00";
  if (!datePart) {
    return new Date().toISOString();
  }
  const withZone = `${datePart}T${timePart}`.includes("Z") ? `${datePart}T${timePart}` : `${datePart}T${timePart}Z`;
  const parsed = new Date(withZone);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(`${datePart}T00:00:00Z`).toISOString();
  }
  return parsed.toISOString();
}

function buildMatchFromSportsDbEvent(event, sportGroup, seenSlugs) {
  const homeName = event.strHomeTeam || "Home";
  const awayName = event.strAwayTeam || "Away";
  const baseSlug = `${slugify(homeName)}-vs-${slugify(awayName)}` || `sportsdb-${event.idEvent || Date.now()}`;
  const count = seenSlugs.get(baseSlug) || 0;
  seenSlugs.set(baseSlug, count + 1);
  const slug = count > 0 ? `${baseSlug}-${String(event.idEvent || "").slice(-4)}` : baseSlug;

  const status = parseSportsDbStatus(event);
  const statusDetail = event.strStatus || (status === "live" ? "Live" : status === "final" ? "Final" : "Scheduled");
  const dateIso = sportsDbDateToIso(event);
  const statusWeight = status === "live" ? 95 : status === "upcoming" ? 45 : 22;

  return {
    id: `sdb-${String(event.idEvent || slug)}`,
    leagueKey: `sportsdb-${sportGroup}`,
    leagueLabel: event.strLeague || SPORT_GROUPS[sportGroup]?.label || "Sports",
    feedPath: "",
    sportGroup,
    sportLabel: SPORT_GROUPS[sportGroup]?.label || sportGroup,
    status,
    statusDetail,
    date: dateIso,
    homeName,
    awayName,
    homeTeamId: "",
    awayTeamId: "",
    homeAbbr: (event.strHomeTeamShort || homeName.slice(0, 3)).toUpperCase(),
    awayAbbr: (event.strAwayTeamShort || awayName.slice(0, 3)).toUpperCase(),
    homeLogo: "",
    awayLogo: "",
    homeScore: event.intHomeScore ?? "-",
    awayScore: event.intAwayScore ?? "-",
    venue: event.strVenue || "Venue TBC",
    note: event.strProgress || "",
    slug,
    trendingScore: Math.round(statusWeight + Math.max(0, 24 - Math.abs((Date.now() - new Date(dateIso).getTime()) / 3600000))),
    route: "",
    source: "sportsdb",
    sourceId: String(event.idEvent || "")
  };
}

function dedupeMatchKey(match) {
  const day = String(match.date || "").slice(0, 10);
  return `${match.sportGroup}|${slugify(match.homeName)}|${slugify(match.awayName)}|${day}`;
}

function upsertHistory(match) {
  const key = `${match.leagueKey}:${match.id}`;
  const existingIndex = state.history.findIndex((item) => item.key === key);

  const item = {
    key,
    id: match.id,
    source: match.source || "espn",
    sourceId: match.sourceId || String(match.id || ""),
    leagueKey: match.leagueKey,
    leagueLabel: match.leagueLabel,
    feedPath: match.feedPath,
    sportGroup: match.sportGroup,
    sportLabel: match.sportLabel,
    slug: match.slug,
    date: match.date,
    homeName: match.homeName,
    awayName: match.awayName,
    homeTeamId: match.homeTeamId || "",
    awayTeamId: match.awayTeamId || "",
    homeLogo: match.homeLogo,
    awayLogo: match.awayLogo,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    venue: match.venue,
    note: match.note,
    savedAt: Date.now()
  };

  if (existingIndex >= 0) {
    state.history[existingIndex] = item;
  } else {
    state.history.unshift(item);
  }

  state.history.sort((a, b) => b.savedAt - a.savedAt);
  state.history = state.history.slice(0, 1200);
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      state.history = parsed;
    }
  } catch (_error) {
    state.history = [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
  } catch (_error) {
    // ignore storage errors
  }
}

function loadFeedbackNotes() {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      state.feedbackNotes = parsed;
    }
  } catch (_error) {
    state.feedbackNotes = [];
  }
}

function saveFeedbackNotes() {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(state.feedbackNotes));
  } catch (_error) {
    // ignore storage errors
  }
}

function loadFavoriteMatches() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      state.favoriteMatches = parsed.map((item) => String(item)).slice(0, 400);
    }
  } catch (_error) {
    state.favoriteMatches = [];
  }
}

function saveFavoriteMatches() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favoriteMatches));
  } catch (_error) {
    // ignore storage errors
  }
}

function isFavoriteKey(key) {
  return state.favoriteMatches.includes(String(key));
}

function toggleFavoriteKey(key) {
  const normalized = String(key || "");
  if (!normalized) {
    return false;
  }
  if (isFavoriteKey(normalized)) {
    state.favoriteMatches = state.favoriteMatches.filter((item) => item !== normalized);
    saveFavoriteMatches();
    return false;
  }
  state.favoriteMatches.unshift(normalized);
  state.favoriteMatches = Array.from(new Set(state.favoriteMatches)).slice(0, 400);
  saveFavoriteMatches();
  return true;
}

function normalizeNotificationPrefs(raw = {}) {
  const leadOptions = [5, 10, 15, 30, 60];
  const lead = Number(raw.leadMinutes);
  return {
    enabled: Boolean(raw.enabled),
    upcomingEnabled: false,
    favoriteTeamEnabled: false,
    leadMinutes: leadOptions.includes(lead) ? lead : 15,
    favoriteTeams: Array.isArray(raw.favoriteTeams) ? raw.favoriteTeams.map((item) => String(item)).slice(0, 120) : [],
    matchReminders: Array.isArray(raw.matchReminders) ? raw.matchReminders.map((item) => String(item)).slice(0, 240) : []
  };
}

function loadNotificationPrefs() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    state.notificationPrefs = normalizeNotificationPrefs(parsed);
  } catch (_error) {
    state.notificationPrefs = normalizeNotificationPrefs({});
  }
}

function saveNotificationPrefs() {
  try {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(state.notificationPrefs));
  } catch (_error) {
    // ignore storage errors
  }
}

function loadNotificationLog() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      state.notificationLog = parsed;
      return;
    }
  } catch (_error) {
    // ignore parse failures
  }
  state.notificationLog = {};
}

function saveNotificationLog() {
  try {
    localStorage.setItem(NOTIFICATION_LOG_KEY, JSON.stringify(state.notificationLog));
  } catch (_error) {
    // ignore storage errors
  }
}

function pruneNotificationLog() {
  const now = Date.now();
  const keepMs = 1000 * 60 * 60 * 24 * 7;
  for (const [key, value] of Object.entries(state.notificationLog)) {
    const ts = Number(value);
    if (!Number.isFinite(ts) || now - ts > keepMs) {
      delete state.notificationLog[key];
    }
  }
}

function canUseBrowserNotifications() {
  return "Notification" in window;
}

function notificationPermissionState() {
  if (!canUseBrowserNotifications()) {
    return "unsupported";
  }
  return Notification.permission;
}

function reminderMatchKey(match) {
  if (!match) {
    return "";
  }
  const sport = String(match.sportGroup || "sport");
  const idOrSlug = String(match.id || match.slug || "");
  return `${sport}:${idOrSlug}`;
}

function isReminderActive(reminderKey) {
  const normalized = String(reminderKey || "");
  if (!normalized) {
    return false;
  }
  return (state.notificationPrefs.matchReminders || []).includes(normalized);
}

function toggleReminderByKey(reminderKey) {
  const normalized = String(reminderKey || "");
  if (!normalized) {
    return false;
  }
  const set = new Set(state.notificationPrefs.matchReminders || []);
  if (set.has(normalized)) {
    set.delete(normalized);
    state.notificationPrefs.matchReminders = [...set].slice(0, 240);
    saveNotificationPrefs();
    return false;
  }
  set.add(normalized);
  state.notificationPrefs.matchReminders = [...set].slice(0, 240);
  saveNotificationPrefs();
  return true;
}

function updateReminderButtonState(button, enabled) {
  if (!button) {
    return;
  }
  const on = Boolean(enabled);
  button.classList.toggle("active", on);
  button.setAttribute("aria-pressed", on ? "true" : "false");
  const text = button.querySelector("[data-reminder-label]");
  if (text) {
    text.textContent = on ? "Reminder On" : "Notify";
  }
}

function teamNotificationKey(match, side) {
  const prefix = side === "away" ? "away" : "home";
  const id = prefix === "home" ? String(match.homeTeamId || "") : String(match.awayTeamId || "");
  const name = prefix === "home" ? match.homeName : match.awayName;
  if (id) {
    return `id:${id}`;
  }
  return `name:${match.sportGroup}:${slugify(name)}`;
}

function matchHasFavoriteTeam(match) {
  const set = new Set(state.notificationPrefs.favoriteTeams || []);
  if (!set.size) {
    return false;
  }
  return set.has(teamNotificationKey(match, "home")) || set.has(teamNotificationKey(match, "away"));
}

function buildNotificationTeams() {
  const map = new Map();
  const source = [...state.upcomingMatches, ...state.liveMatches].slice(0, 220);
  for (const match of source) {
    const pushTeam = (side) => {
      const isHome = side === "home";
      const key = teamNotificationKey(match, side);
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: isHome ? match.homeName : match.awayName,
          abbr: isHome ? match.homeAbbr : match.awayAbbr,
          logo: isHome ? match.homeLogo : match.awayLogo,
          sportGroup: match.sportGroup,
          count: 0
        });
      }
      map.get(key).count += 1;
    };
    pushTeam("home");
    pushTeam("away");
  }

  return [...map.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 48);
}

function renderNotificationSettingsSection({ title = "Match Alerts", lead = "Get upcoming-match reminders and favorite-team notifications." } = {}) {
  const permission = notificationPermissionState();
  const supported = permission !== "unsupported";
  const teams = buildNotificationTeams();
  const favoriteSet = new Set(state.notificationPrefs.favoriteTeams || []);
  const permissionLabel =
    permission === "granted"
      ? "Enabled"
      : permission === "denied"
        ? "Blocked"
        : permission === "default"
          ? "Not enabled"
          : "Not supported";

  return `
    <section class="section">
      <div class="section-head">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(lead)}</p>
      </div>
      <div class="panel notify-panel">
        <div class="notify-head">
          <span class="notify-state ${permission === "granted" ? "ok" : permission === "denied" ? "blocked" : ""}">
            Notification: ${escapeHtml(permissionLabel)}
          </span>
          <button id="notification-enable-btn" class="btn ${permission === "granted" ? "" : "btn-primary"}" type="button" ${supported ? "" : "disabled"}>
            ${permission === "granted" ? "Notifications Active" : "Enable Notifications"}
          </button>
        </div>

        <div class="notify-controls">
          <label class="notify-check">
            <input type="checkbox" id="notif-upcoming-toggle" ${state.notificationPrefs.upcomingEnabled ? "checked" : ""}>
            Upcoming match reminders
          </label>
          <label class="notify-check">
            <input type="checkbox" id="notif-favorite-toggle" ${state.notificationPrefs.favoriteTeamEnabled ? "checked" : ""}>
            Favorite team match alerts
          </label>
          <label class="notify-lead" for="notif-lead-select">
            Notify before
            <select id="notif-lead-select">
              ${[5, 10, 15, 30, 60].map((value) => `<option value="${value}" ${state.notificationPrefs.leadMinutes === value ? "selected" : ""}>${value} min</option>`).join("")}
            </select>
          </label>
        </div>

        <details class="notify-team-picker" open>
          <summary>Choose favorite teams for alerts</summary>
          <div class="notify-team-list">
            ${
              teams.length
                ? teams
                    .map(
                      (team) => `
                        <label class="notify-team-item">
                          <input type="checkbox" class="notif-team-check" value="${escapeHtml(team.key)}" ${favoriteSet.has(team.key) ? "checked" : ""}>
                          ${team.logo ? `<img src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name)}" loading="lazy">` : `<span class="notify-team-fallback">${escapeHtml(team.abbr || "TM")}</span>`}
                          <span>${escapeHtml(team.name)}</span>
                          <small>${escapeHtml(SPORT_GROUPS[team.sportGroup]?.label || team.sportGroup)} (${team.count})</small>
                        </label>
                      `
                    )
                    .join("")
                : '<span class="subtle">Team options will appear when upcoming matches are available.</span>'
            }
          </div>
        </details>

        <p class="subtle">Alerts are free and browser-based. For best reliability, keep LiveScoreFree open in your browser.</p>
      </div>
    </section>
  `;
}

async function requestNotificationAccess() {
  if (!canUseBrowserNotifications()) {
    showToast("Notifications are not supported in this browser.");
    return false;
  }

  if (Notification.permission === "granted") {
    state.notificationPrefs.enabled = true;
    saveNotificationPrefs();
    return true;
  }

  if (Notification.permission === "denied") {
    showToast("Notifications are blocked. Enable them in browser site settings.");
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      state.notificationPrefs.enabled = true;
      saveNotificationPrefs();
      saveNotificationPrefs();
      showToast("Notifications enabled.");
      return true;
    }
  } catch (_error) {
    // ignore and fallback message below
  }
  showToast("Notification permission not granted.");
  return false;
}

function sendMatchNotification(title, body, tag = "") {
  if (!canUseBrowserNotifications() || Notification.permission !== "granted") {
    return;
  }
  try {
    const options = {
      body,
      icon: "logo-mark.svg",
      badge: "logo-mark.svg",
      tag: tag || undefined
    };
    if (navigator.serviceWorker?.controller && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((registration) => registration.showNotification(title, options)).catch(() => {
        new Notification(title, options);
      });
      return;
    }
    new Notification(title, options);
  } catch (_error) {
    // ignore notification errors
  }
}

function triggerMatchNotifications() {
  if (!state.notificationPrefs.enabled) {
    return;
  }
  if (!canUseBrowserNotifications() || Notification.permission !== "granted") {
    return;
  }

  pruneNotificationLog();

  const reminderKeys = new Set((state.notificationPrefs.matchReminders || []).map((item) => String(item)));
  if (!reminderKeys.size) {
    return;
  }

  const statusByReminderKey = new Map();
  for (const match of state.matches) {
    statusByReminderKey.set(reminderMatchKey(match), match.status);
  }

  const cleanedReminders = [...reminderKeys].filter((key) => {
    const status = statusByReminderKey.get(key);
    return !status || status === "upcoming";
  });
  if (cleanedReminders.length !== reminderKeys.size) {
    state.notificationPrefs.matchReminders = cleanedReminders.slice(0, 240);
    saveNotificationPrefs();
    reminderKeys.clear();
    cleanedReminders.forEach((key) => reminderKeys.add(key));
  }

  const now = Date.now();
  const leadMs = Math.max(1, Number(state.notificationPrefs.leadMinutes || 15)) * 60 * 1000;
  const dueWindowMs = Math.max(REFRESH_INTERVAL_MS + 15000, 45000);

  for (const match of state.matches) {
    if (match.status !== "upcoming") {
      continue;
    }
    const reminderKey = reminderMatchKey(match);
    if (!reminderKeys.has(reminderKey)) {
      continue;
    }

    const startMs = new Date(match.date || 0).getTime();
    if (!Number.isFinite(startMs)) {
      continue;
    }

    const msUntil = startMs - now;
    const nearKickoff = msUntil <= leadMs && msUntil >= -dueWindowMs;
    if (!nearKickoff) {
      continue;
    }

    const key = `upcoming:${reminderKey}:${state.notificationPrefs.leadMinutes}`;
    if (!state.notificationLog[key]) {
      const startsText = formatTime(match.date);
      sendMatchNotification(
        `${match.homeName} vs ${match.awayName}`,
        `Reminder: starts at ${startsText} | ${match.leagueLabel}`,
        key
      );
      state.notificationLog[key] = Date.now();
    }
  }

  saveNotificationLog();
}

function wireNotificationControls() {
  const enableButton = qs("#notification-enable-btn");
  if (enableButton) {
    enableButton.addEventListener("click", async () => {
      const ok = await requestNotificationAccess();
      if (ok) {
        await renderRoute();
        triggerMatchNotifications();
      }
    });
  }

  const upcomingToggle = qs("#notif-upcoming-toggle");
  if (upcomingToggle) {
    upcomingToggle.addEventListener("change", () => {
      state.notificationPrefs.upcomingEnabled = Boolean(upcomingToggle.checked);
      saveNotificationPrefs();
      showToast(state.notificationPrefs.upcomingEnabled ? "Upcoming match alerts on." : "Upcoming match alerts off.");
    });
  }

  const favoriteToggle = qs("#notif-favorite-toggle");
  if (favoriteToggle) {
    favoriteToggle.addEventListener("change", () => {
      state.notificationPrefs.favoriteTeamEnabled = Boolean(favoriteToggle.checked);
      saveNotificationPrefs();
      showToast(state.notificationPrefs.favoriteTeamEnabled ? "Favorite team alerts on." : "Favorite team alerts off.");
    });
  }

  const leadSelect = qs("#notif-lead-select");
  if (leadSelect) {
    leadSelect.addEventListener("change", () => {
      const next = Number(leadSelect.value);
      state.notificationPrefs.leadMinutes = [5, 10, 15, 30, 60].includes(next) ? next : 15;
      saveNotificationPrefs();
      showToast(`Reminder set to ${state.notificationPrefs.leadMinutes} minutes before kickoff.`);
    });
  }

  qsa(".notif-team-check").forEach((input) => {
    input.addEventListener("change", () => {
      const value = String(input.value || "");
      if (!value) {
        return;
      }
      const current = new Set(state.notificationPrefs.favoriteTeams || []);
      if (input.checked) {
        current.add(value);
      } else {
        current.delete(value);
      }
      state.notificationPrefs.favoriteTeams = [...current].slice(0, 120);
      saveNotificationPrefs();
    });
  });
}

function rebuildMatches() {
  const seenSlugs = new Map();
  const nextMatches = [];
  const dedupeMap = new Map();
  const statusRank = { live: 3, final: 2, upcoming: 1 };

  const addMatch = (match) => {
    match.route = routeForMatch(match);
    const key = dedupeMatchKey(match);
    if (!dedupeMap.has(key)) {
      dedupeMap.set(key, nextMatches.length);
      nextMatches.push(match);
      return;
    }
    const existingIndex = dedupeMap.get(key);
    const existing = nextMatches[existingIndex];
    if ((statusRank[match.status] || 0) > (statusRank[existing.status] || 0)) {
      nextMatches[existingIndex] = match;
    }
  };

  for (const [leagueKey, leagueConfig] of Object.entries(LEAGUES)) {
    const events = state.eventsByLeague[leagueKey] || [];
    for (const event of events) {
      const match = buildMatchFromEvent(event, leagueKey, leagueConfig, seenSlugs);
      addMatch(match);
    }
  }

  for (const item of state.externalEvents) {
    const match = buildMatchFromSportsDbEvent(item.event, item.sportGroup, seenSlugs);
    addMatch(match);
  }

  nextMatches.sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  const nextIndex = new Map();
  for (const match of nextMatches) {
    nextIndex.set(`${match.sportGroup}:${match.slug}`, match);
    nextIndex.set(`${match.leagueKey}:${match.id}`, match);
    if (!nextIndex.has(match.slug)) {
      nextIndex.set(match.slug, match);
    }
    if (match.status === "final") {
      upsertHistory(match);
    }
  }

  state.matches = nextMatches;
  state.liveMatches = nextMatches.filter((match) => match.status === "live");
  state.upcomingMatches = nextMatches.filter((match) => match.status === "upcoming");
  state.finalMatches = nextMatches.filter((match) => match.status === "final");
  state.matchIndex = nextIndex;

  saveHistory();
}

function renderTicker() {
  const ticker = qs("#ticker-track");
  const tickerRoot = qs("#ticker");
  if (!ticker) {
    return;
  }

  const source = [...state.liveMatches, ...state.finalMatches].slice(0, 18);
  if (tickerRoot) {
    const updateText = state.lastUpdatedAt > 0 ? `Auto-updated ${formatTime(state.lastUpdatedAt)}` : "Auto-updating live scores";
    tickerRoot.setAttribute("title", `${state.liveMatches.length} live matches. ${updateText}.`);
  }

  if (!source.length) {
    ticker.innerHTML = '<span class="ticker-item">LiveScoreFree is loading realtime scoreboards for football, cricket, basketball, tennis and more...</span>';
    return;
  }

  const html = source
    .map(
      (match) => {
        const sportLabel = String(SPORT_GROUPS[match.sportGroup]?.label || match.leagueLabel || match.sportGroup || "Live").toUpperCase();
        const homeShort = compactTeamLabel(match.homeName, match.homeAbbr);
        const awayShort = compactTeamLabel(match.awayName, match.awayAbbr);
        const homeFallback = escapeHtml(String(match.homeAbbr || homeShort || "H").slice(0, 3).toUpperCase());
        const awayFallback = escapeHtml(String(match.awayAbbr || awayShort || "A").slice(0, 3).toUpperCase());
        const homeLogoHtml = match.homeLogo
          ? `<img class="ticker-logo" src="${escapeHtml(match.homeLogo)}" alt="${escapeHtml(match.homeName)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex'"><span class="ticker-logo-fallback" style="display:none;">${homeFallback}</span>`
          : `<span class="ticker-logo-fallback">${homeFallback}</span>`;
        const awayLogoHtml = match.awayLogo
          ? `<img class="ticker-logo" src="${escapeHtml(match.awayLogo)}" alt="${escapeHtml(match.awayName)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex'"><span class="ticker-logo-fallback" style="display:none;">${awayFallback}</span>`
          : `<span class="ticker-logo-fallback">${awayFallback}</span>`;
        return `<a class="ticker-item ticker-link auto-bg-surface auto-bg-inline" data-link href="${escapeHtml(routeForMatch(match))}" title="${escapeHtml(match.homeName)} vs ${escapeHtml(match.awayName)}" ${buildAutoBackgroundAttrs({
          sportGroup: match.sportGroup,
          leagueKey: match.leagueKey,
          fit: "cover",
          position: "center",
          strength: 0.26
        })}>
          <span class="ticker-top">
            <span class="ticker-league">${escapeHtml(sportLabel)}</span>
            ${statusBadge(match)}
          </span>
          <span class="ticker-scoreline">
            <span class="ticker-logo-wrap">${homeLogoHtml}</span>
            <span class="ticker-scoreboard">
              <span class="ticker-score">${escapeHtml(match.homeScore)}</span>
              <span class="ticker-separator">-</span>
              <span class="ticker-score">${escapeHtml(match.awayScore)}</span>
            </span>
            <span class="ticker-logo-wrap">${awayLogoHtml}</span>
          </span>
          <span class="ticker-names">
            <span class="ticker-name">${escapeHtml(homeShort)}</span>
            <span class="ticker-name">${escapeHtml(awayShort)}</span>
          </span>
        </a>`;
      }
    )
    .join("");

  ticker.innerHTML = `${html}${html}`;

  const duration = Math.max(42, source.length * 6);
  ticker.style.animationDuration = `${duration}s`;
}

function updateLastUpdatedLabel() {
  const el = qs("#header-status");
  if (el) {
    el.remove();
  }
}

function setStatusCopy(text) {
  // silent auto-update mode: status copy is intentionally hidden
}

async function refreshData({ silent = false } = {}) {
  if (state.refreshPromise) {
    return state.refreshPromise;
  }

  state.refreshPromise = (async () => {
    let failed = 0;
    const leagueVisualsPromise = fetchLeagueVisualsSnapshot().catch(() => state.leagueVisuals || {});

    const nextEvents = {};
    const espnTasks = Object.entries(LEAGUES).map(async ([leagueKey, leagueConfig]) => {
      try {
        const data = await cachedJson(`${ESPN_BASE}/${leagueConfig.feed}/scoreboard`, 22000);
        nextEvents[leagueKey] = data.events || [];
      } catch (_error) {
        failed += 1;
        nextEvents[leagueKey] = state.eventsByLeague[leagueKey] || [];
      }
    });

    await Promise.all(espnTasks);

    const today = new Date().toISOString().slice(0, 10);
    const externalEvents = [];
    let sportsDbFailures = 0;

    const sportsDbTasks = Object.entries(SPORTSDB_SPORTS).map(async ([sportGroup, sportName]) => {
      try {
        const url = `${SPORTSDB_BASE}/eventsday.php?d=${today}&s=${encodeURIComponent(sportName)}`;
        const data = await cachedJson(url, 22000);
        const events = Array.isArray(data?.events) ? data.events : Array.isArray(data?.event) ? data.event : [];
        for (const event of events) {
          externalEvents.push({ sportGroup, event });
        }
      } catch (_error) {
        sportsDbFailures += 1;
      }
    });

    await Promise.all(sportsDbTasks);

    const nextLeagueVisuals = await leagueVisualsPromise;

    state.eventsByLeague = nextEvents;
    state.externalEvents = externalEvents;
    state.leagueVisuals = {
      ...(state.leagueVisuals || {}),
      ...(nextLeagueVisuals || {})
    };

    const espnMatchCount = Object.values(nextEvents).reduce((sum, events) => sum + (Array.isArray(events) ? events.length : 0), 0);
    state.providerStatus.espn = {
      ok: failed < Object.keys(LEAGUES).length,
      matches: espnMatchCount,
      lastFetch: Date.now(),
      lastError: failed > 0 ? `${failed} ESPN feed(s) unavailable` : ""
    };
    state.providerStatus.sportsdb = {
      ok: sportsDbFailures < Object.keys(SPORTSDB_SPORTS).length,
      matches: externalEvents.length,
      lastFetch: Date.now(),
      lastError: sportsDbFailures > 0 ? `${sportsDbFailures} TheSportsDB request(s) failed` : ""
    };

    state.lastUpdatedAt = Date.now();
    state.nextRefreshAt = Date.now() + REFRESH_INTERVAL_MS;
    rebuildMatches();
    renderTicker();

    updateLastUpdatedLabel();
    triggerMatchNotifications();
  })()
    .finally(() => {
      state.refreshPromise = null;
    });

  return state.refreshPromise;
}

function showToast(text) {
  const toast = qs("#toast");
  if (!toast) {
    return;
  }
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function detectThemeByTime() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const toggle = qs("#theme-toggle");
  if (!toggle) {
    return;
  }

  if (state.themeMode === "auto") {
    toggle.innerHTML = '<span class="tool-icon" aria-hidden="true">&#9681;</span>';
    toggle.title = `Theme: Auto (${theme === "day" ? "Day" : "Night"})`;
    toggle.setAttribute("aria-label", `Theme auto (${theme})`);
  } else {
    toggle.innerHTML =
      state.themeMode === "day"
        ? '<span class="tool-icon" aria-hidden="true">&#9728;</span>'
        : '<span class="tool-icon" aria-hidden="true">&#9790;</span>';
    toggle.title = `Theme: ${state.themeMode === "day" ? "Day" : "Night"} (click to cycle)`;
    toggle.setAttribute("aria-label", `Theme ${state.themeMode}`);
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "day" || saved === "night") {
    state.themeMode = saved;
  } else {
    state.themeMode = "auto";
  }

  applyTheme(state.themeMode === "auto" ? detectThemeByTime() : state.themeMode);

  setInterval(() => {
    if (state.themeMode === "auto") {
      applyTheme(detectThemeByTime());
    }
  }, 60000);
}

function cycleThemeMode() {
  if (state.themeMode === "auto") {
    state.themeMode = "night";
  } else if (state.themeMode === "night") {
    state.themeMode = "day";
  } else {
    state.themeMode = "auto";
  }

  if (state.themeMode === "auto") {
    localStorage.removeItem(THEME_KEY);
    applyTheme(detectThemeByTime());
  } else {
    localStorage.setItem(THEME_KEY, state.themeMode);
    applyTheme(state.themeMode);
  }

  showToast(`Theme switched to ${state.themeMode}.`);
}

function normalizePath(path) {
  let normalized = String(path || "/").trim();
  normalized = normalized.split("?")[0].split("#")[0];
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  normalized = normalized.replace(/\/+$/, "") || "/";
  return normalized;
}

function toSportGroup(value) {
  return SPORT_ALIASES[value] || value;
}

function getCurrentPath() {
  if (window.location.protocol === "file:") {
    if (window.location.hash.startsWith("#/")) {
      return normalizePath(decodeURIComponent(window.location.hash.slice(1)));
    }
    return "/home";
  }

  if (window.location.hash.startsWith("#/")) {
    return normalizePath(decodeURIComponent(window.location.hash.slice(1)));
  }

  return normalizePath(decodeURIComponent(window.location.pathname || "/"));
}

function closeMobileNav() {
  const nav = qs("#main-nav");
  const toggle = qs("#mobile-nav-toggle");
  if (nav) {
    nav.classList.remove("open");
  }
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
  }
}
function navigate(path, replace = false) {
  const target = normalizePath(path);
  hideTouchMenuInfo();

  if (window.location.protocol === "file:") {
    if (replace) {
      window.location.replace(`#${target}`);
    } else {
      window.location.hash = target;
    }
    renderRoute();
    closeMobileNav();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (replace) {
    window.history.replaceState({}, "", target);
  } else {
    window.history.pushState({}, "", target);
  }

  closeMobileNav();
  renderRoute();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function parseRoute(path) {
  const parts = normalizePath(path).split("/").filter(Boolean);

  if (parts.length === 0 || path === "/") {
    return { type: "redirect", to: "/home" };
  }

  if (parts[0] === "home") {
    return { type: "home" };
  }

  if (parts[0] === "live") {
    return { type: "live" };
  }
  if (parts[0] === "upcoming") {
    return { type: "upcoming" };
  }
  if (parts[0] === "trending") {
    return { type: "trending" };
  }
  if (parts[0] === "results") {
    return { type: "results" };
  }
  if (parts[0] === "history") {
    return { type: "history" };
  }
  if (parts[0] === "top-leagues") {
    return { type: "top-leagues" };
  }
  if (parts[0] === "league" && parts[1]) {
    const leagueKey = decodeURIComponent(parts[1]);
    const section = LEAGUE_PAGE_SECTIONS.includes(parts[2]) ? parts[2] : "overview";
    return { type: "league", leagueKey, section };
  }
  if (parts[0] === "donate") {
    return { type: "donate" };
  }
  if (parts[0] === "feedback") {
    return { type: "feedback" };
  }
  if (parts[0] === "advertise") {
    return { type: "advertise" };
  }
  if (parts[0] === "privacy-policy") {
    return { type: "privacy-policy" };
  }
  if (parts[0] === "terms-of-service") {
    return { type: "terms-of-service" };
  }
  if (parts[0] === "data-sources") {
    return { type: "data-sources" };
  }
  if (parts[0] === "dmca-policy") {
    return { type: "dmca-policy" };
  }
  if (parts[0] === "about") {
    return { type: "about" };
  }
  if (parts[0] === "contact") {
    return { type: "contact" };
  }
  if (parts[0] === "team" && parts[1] && parts[2]) {
    return {
      type: "team",
      sport: toSportGroup(decodeURIComponent(parts[1])),
      teamToken: decodeURIComponent(parts[2])
    };
  }
  if (parts[0] === "player" && parts[1] && parts[2]) {
    return {
      type: "player",
      sport: toSportGroup(decodeURIComponent(parts[1])),
      playerToken: decodeURIComponent(parts[2]),
      teamToken: parts[3] ? decodeURIComponent(parts[3]) : ""
    };
  }
  if (parts[0] === "sport" && parts[1]) {
    return { type: "sport", sport: toSportGroup(parts[1]) };
  }
  if (parts[0] === "match" && parts[1]) {
    return { type: "match", sport: null, mode: "live", slug: parts.slice(1).join("/") };
  }
  if (SPORT_GROUPS[toSportGroup(parts[0])] && parts.length === 1) {
    return { type: "sport", sport: toSportGroup(parts[0]) };
  }
  if (SPORT_GROUPS[toSportGroup(parts[0])] && ["live", "results"].includes(parts[1]) && parts[2]) {
    return { type: "match", sport: toSportGroup(parts[0]), mode: parts[1], slug: parts.slice(2).join("/") };
  }

  return { type: "not-found" };
}

function stopMatchDetailRefresh() {
  if (matchDetailRefreshTimer) {
    clearInterval(matchDetailRefreshTimer);
    matchDetailRefreshTimer = null;
  }
  matchDetailRefreshKey = "";
}

function configureMatchDetailRefresh(route) {
  if (route.type !== "match") {
    stopMatchDetailRefresh();
    return;
  }

  const key = `${route.sport || "all"}:${route.slug}`;
  if (matchDetailRefreshTimer && matchDetailRefreshKey === key) {
    return;
  }

  stopMatchDetailRefresh();
  matchDetailRefreshKey = key;
  matchDetailRefreshTimer = setInterval(async () => {
    if (document.hidden) {
      return;
    }
    const current = parseRoute(getCurrentPath());
    if (current.type !== "match") {
      stopMatchDetailRefresh();
      return;
    }
    await renderMatchPage(current);
  }, MATCH_DETAIL_REFRESH_MS);
}

function setMetaByName(name, content) {
  let node = document.head.querySelector(`meta[name="${name}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("name", name);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  let node = document.head.querySelector(`meta[property="${property}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("property", property);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function setStructuredData(data) {
  const node = qs("#dynamic-schema");
  if (!node) {
    return;
  }
  if (!data) {
    node.textContent = "";
    return;
  }
  node.textContent = JSON.stringify(data);
}

function setSeo({ title, description, keywords, path, structuredData }) {
  const mergedKeywords = Array.from(new Set([...GLOBAL_SEO_KEYWORDS, ...(keywords || [])].map((item) => String(item || "").trim()).filter(Boolean)));
  document.title = title;
  setMetaByName("description", description);
  setMetaByName("keywords", mergedKeywords.join(", "));
  setMetaByProperty("og:title", title);
  setMetaByProperty("og:description", description);
  setMetaByProperty("og:url", `${SEO_BASE.origin}${path}`);

  const canonical = qs("#canonical-link");
  if (canonical) {
    canonical.setAttribute("href", `${SEO_BASE.origin}${path}`);
  }

  setStructuredData(structuredData || null);
}

function getShareText() {
  return "LiveScoreFree: free community-powered live scores. Share to help more fans discover fast sports updates and support good impact.";
}

function renderGlobalShareWidget() {
  const main = qs("#main");
  if (!main) {
    return;
  }

  const existing = qs("#global-share-widget", main);
  if (existing) {
    existing.remove();
  }

  const url = getAbsoluteUrlForPath(state.activePath);
  const encodedUrl = encodeURIComponent(url);
  const shareText = getShareText();
  const encodedText = encodeURIComponent(shareText);
  const titleText = (document.title || "LiveScoreFree").replace(/\s+\|\s+LiveScoreFree$/i, "").trim() || "LiveScoreFree";
  const encodedTitle = encodeURIComponent(titleText);
  const encodedBody = encodeURIComponent(`${shareText}\n\n${url}`);

  main.insertAdjacentHTML(
    "beforeend",
    `
      <section class="share-widget" id="global-share-widget">
        <div class="share-head">
          <h2>Share LiveScoreFree</h2>
          <p>Help more fans discover free live scores and our community support mission.</p>
        </div>
        <div class="share-actions">
          <button type="button" class="btn share-btn share-btn-primary" data-share-native>
            <img class="share-favicon" src="favicon-share.svg" alt="" aria-hidden="true" loading="lazy">
            <span>Share This Page</span>
          </button>
          <button type="button" class="btn share-btn" data-share-copy>
            <img class="share-favicon" src="favicon-link.svg" alt="" aria-hidden="true" loading="lazy">
            <span>Copy Link</span>
          </button>
          <a class="btn share-btn" href="https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noopener noreferrer">
            <img class="share-favicon" src="favicon-whatsapp.svg" alt="" aria-hidden="true" loading="lazy">
            <span>WhatsApp</span>
          </a>
          <a class="btn share-btn" href="https://t.me/share/url?url=${encodedUrl}&text=${encodedText}" target="_blank" rel="noopener noreferrer">
            <img class="share-favicon" src="favicon-telegram.svg" alt="" aria-hidden="true" loading="lazy">
            <span>Telegram</span>
          </a>
          <a class="btn share-btn" href="https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer">
            <img class="share-favicon" src="favicon-x.svg" alt="" aria-hidden="true" loading="lazy">
            <span>X</span>
          </a>
          <a class="btn share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer">
            <img class="share-favicon" src="favicon-facebook.svg" alt="" aria-hidden="true" loading="lazy">
            <span>Facebook</span>
          </a>
          <a class="btn share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer">
            <img class="share-favicon" src="favicon-linkedin.svg" alt="" aria-hidden="true" loading="lazy">
            <span>LinkedIn</span>
          </a>
          <a class="btn share-btn" href="https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}" target="_blank" rel="noopener noreferrer">
            <img class="share-favicon" src="favicon-reddit.svg" alt="" aria-hidden="true" loading="lazy">
            <span>Reddit</span>
          </a>
          <a class="btn share-btn" href="mailto:?subject=${encodedTitle}&body=${encodedBody}">
            <img class="share-favicon" src="favicon-email.svg" alt="" aria-hidden="true" loading="lazy">
            <span>Email</span>
          </a>
        </div>
      </section>
    `
  );
}

async function handleNativeShare() {
  const url = getAbsoluteUrlForPath(state.activePath);
  const text = getShareText();
  if (navigator.share) {
    try {
      await navigator.share({
        title: document.title,
        text,
        url
      });
      showToast("Thanks for sharing LiveScoreFree.");
      return;
    } catch (_error) {
      // user may cancel
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Share link copied.");
      return;
    } catch (_error) {
      // fallback below
    }
  }

  showToast("Share is not available in this browser.");
}

async function handleCopyShareLink() {
  const url = getAbsoluteUrlForPath(state.activePath);
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied.");
      return;
    } catch (_error) {
      // fallback below
    }
  }

  const temp = document.createElement("textarea");
  temp.value = url;
  document.body.append(temp);
  temp.select();
  document.execCommand("copy");
  temp.remove();
  showToast("Link copied.");
}

function dismissSupportPopup() {
  const popup = qs("#support-popup");
  if (!popup) {
    return;
  }
  popup.remove();
}

function showSupportPopup() {
  if (qs("#support-popup")) {
    return;
  }

  localStorage.setItem(SUPPORT_POPUP_KEY, String(Date.now()));

  const popup = document.createElement("div");
  popup.id = "support-popup";
  popup.className = "support-popup-overlay";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "true");
  popup.innerHTML = `
    <div class="support-popup-card">
      <button class="popup-close" type="button" aria-label="Close popup" data-popup-close>x</button>
      <p class="popup-eyebrow">Community Powered</p>
      <h3>Keep LiveScoreFree Running for Everyone</h3>
      <p>
        Support from <strong>$1</strong> or any amount helps keep scores fast, funds new features, and supports good actions for people in need.
      </p>
      <div class="popup-actions">
        <a class="btn btn-primary" data-link href="/donate">Support from $1</a>
        <a class="btn" data-link href="/feedback">Send Feedback</a>
      </div>
      <p class="subtle popup-note">
        We publish impact updates and share results publicly. Supporters may receive occasional special thank-you gifts.
      </p>
    </div>
  `;

  document.body.append(popup);
}

function maybeShowSupportPopup(route) {
  if (document.hidden) {
    return;
  }
  if (Date.now() - APP_BOOT_TS < 25000) {
    return;
  }
  if (route.type === "donate" || route.type === "feedback" || route.type === "advertise" || route.type === "privacy-policy" || route.type === "terms-of-service") {
    return;
  }
  if (route.type === "data-sources" || route.type === "dmca-policy") {
    return;
  }

  const lastShown = Number(localStorage.getItem(SUPPORT_POPUP_KEY) || 0);
  if (Date.now() - lastShown < SUPPORT_POPUP_INTERVAL_MS) {
    return;
  }

  showSupportPopup();
}

function updateLanguageControls() {
  const select = qs("#language-select");
  if (select) {
    const autoOption = select.querySelector('option[value="auto"]');
    if (autoOption) {
      autoOption.textContent = "Auto";
    }
    select.value = state.languagePreference;
    const currentTarget = getResolvedTargetLanguage();
    const currentLabel = SUPPORTED_LANGUAGES[currentTarget] || currentTarget;
    select.title = `Language target: ${currentLabel}`;
  }

  const translateButton = qs("#translate-btn");
  if (translateButton) {
    const target = getResolvedTargetLanguage();
    const targetLabel = SUPPORTED_LANGUAGES[target] || target;
    translateButton.innerHTML = '<span class="tool-icon" aria-hidden="true">&#127760;</span>';
    translateButton.title = `Translate page with Google (${targetLabel})`;
    translateButton.setAttribute("aria-label", `Translate page to ${targetLabel}`);
  }
}

function loadLanguagePreference() {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved === "auto") {
    state.languagePreference = "auto";
    return;
  }

  if (saved && SUPPORTED_LANGUAGES[normalizeLanguageCode(saved)]) {
    state.languagePreference = normalizeLanguageCode(saved);
    return;
  }

  state.languagePreference = "auto";
}

function openGoogleTranslateForCurrentPage() {
  const target = getResolvedTargetLanguage();
  if (target === "en") {
    showToast("English is the default language.");
    return;
  }

  const url = getAbsoluteUrlForPath(state.activePath);
  const translateUrl = `https://translate.google.com/translate?sl=en&tl=${encodeURIComponent(target)}&u=${encodeURIComponent(url)}`;
  window.open(translateUrl, "_blank", "noopener,noreferrer");
  showToast(`Opened Google Translate (${SUPPORTED_LANGUAGES[target] || target}).`);
}

function rootNavForPath(path) {
  if (path.startsWith("/home") || path === "/") {
    return "/home";
  }
  if (path.startsWith("/trending")) {
    return "/trending";
  }
  if (path.startsWith("/upcoming")) {
    return "/upcoming";
  }
  if (path.startsWith("/results") || path.includes("/results/")) {
    return "/results";
  }
  if (path.startsWith("/history")) {
    return "/history";
  }
  if (path.startsWith("/top-leagues") || path.startsWith("/league/")) {
    return "/top-leagues";
  }
  return "/live";
}

function markActiveNav(path) {
  const root = rootNavForPath(path);
  qsa("[data-nav]").forEach((item) => {
    item.classList.toggle("active", item.getAttribute("data-nav") === root);
  });
}

function updateHeaderQuickNav(route) {
  const quickNav = qs("#header-quick-nav");
  const backButton = qs("#nav-back-btn");
  if (!quickNav) {
    return;
  }

  const isHomeRoute = route?.type === "home" || (route?.type === "redirect" && route?.to === "/home");
  quickNav.classList.toggle("hidden", isHomeRoute);

  if (backButton) {
    const canGoBack = window.history.length > 1;
    backButton.disabled = !canGoBack && !isHomeRoute;
    backButton.title = canGoBack ? "Back" : "Back (no previous page)";
  }
}

function isTouchMenuInfoEnabled() {
  return Boolean(window.matchMedia?.("(pointer: coarse)")?.matches || "ontouchstart" in window);
}

function ensureTouchMenuInfoElement() {
  let node = qs("#touch-menu-info");
  if (node) {
    return node;
  }
  node = document.createElement("div");
  node.id = "touch-menu-info";
  node.className = "touch-menu-info";
  node.setAttribute("role", "status");
  node.setAttribute("aria-live", "polite");
  document.body.append(node);
  return node;
}

function hideTouchMenuInfo() {
  const node = qs("#touch-menu-info");
  if (!node) {
    return;
  }
  node.classList.remove("show");
  if (touchMenuInfoTimer) {
    clearTimeout(touchMenuInfoTimer);
    touchMenuInfoTimer = null;
  }
}

function showTouchMenuInfo(anchor, text) {
  if (!anchor || !text) {
    return;
  }
  const node = ensureTouchMenuInfoElement();
  node.textContent = text;
  node.classList.add("show");

  const rect = anchor.getBoundingClientRect();
  requestAnimationFrame(() => {
    const popupRect = node.getBoundingClientRect();
    const left = Math.min(
      window.innerWidth - popupRect.width - 12,
      Math.max(12, rect.left + (rect.width / 2) - (popupRect.width / 2))
    );
    const top = Math.min(
      window.innerHeight - popupRect.height - 12,
      rect.bottom + 10
    );
    node.style.left = `${Math.round(left)}px`;
    node.style.top = `${Math.round(top)}px`;
  });

  if (touchMenuInfoTimer) {
    clearTimeout(touchMenuInfoTimer);
  }
  touchMenuInfoTimer = setTimeout(() => {
    hideTouchMenuInfo();
  }, 2200);
}

function logoHtml(url, alt, fallbackIcon) {
  if (!url) {
    return `<span>${fallbackIcon}</span>`;
  }
  return `<img class="team-logo" src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.style.display='none'">`;
}

function renderTeamNameControl({
  sportGroup = "",
  teamId = "",
  teamName = "",
  teamAbbr = "",
  teamLogo = "",
  fallbackIcon = "TM",
  className = "team-name"
} = {}) {
  const safeName = String(teamName || "Team");
  const safeAbbr = String(teamAbbr || safeName.slice(0, 3) || fallbackIcon).toUpperCase().slice(0, 3);
  const route = routeForTeam({ sportGroup, teamId, teamName: safeName });
  const aria = `Open ${safeName} team page`;
  return `
    <span class="${escapeHtml(className)} entity-link-btn team-link-btn" data-team-route="${escapeHtml(route)}" title="${escapeHtml(aria)}" aria-label="${escapeHtml(aria)}" role="link" tabindex="0">
      ${
        teamLogo
          ? `<img class="team-logo" src="${escapeHtml(teamLogo)}" alt="${escapeHtml(safeName)}" loading="lazy" onerror="this.style.display='none'">`
          : `<span class="team-logo-fallback">${escapeHtml(safeAbbr)}</span>`
      }
      <span>${escapeHtml(safeName)}</span>
    </span>
  `;
}

function renderTeamScoreRow({
  sportGroup = "",
  teamId = "",
  teamName = "",
  teamAbbr = "",
  teamLogo = "",
  score = "-",
  fallbackIcon = "TM"
} = {}) {
  return `
    <div class="team-row">
      ${renderTeamNameControl({
        sportGroup,
        teamId,
        teamName,
        teamAbbr,
        teamLogo,
        fallbackIcon,
        className: "team-name"
      })}
      <div class="score-value">${escapeHtml(score)}</div>
    </div>
  `;
}

function renderPlayerNameControl({
  sportGroup = "",
  playerId = "",
  playerName = "",
  teamId = "",
  teamName = "",
  className = "inline-entity-link"
} = {}) {
  const safeName = String(playerName || "Player");
  const safePlayerId = normalizeNumericEntityId(playerId);
  const route = routeForPlayer({ sportGroup, playerId: safePlayerId, playerName: safeName, teamId, teamName });
  const aria = `Open ${safeName} player page`;
  return `<span class="${escapeHtml(className)} entity-link-btn player-link-btn" data-player-route="${escapeHtml(route)}" title="${escapeHtml(aria)}" aria-label="${escapeHtml(aria)}" role="link" tabindex="0">${escapeHtml(safeName)}</span>`;
}

function getSportImagePath(sportGroup) {
  return SPORT_IMAGE_MAP[sportGroup] || SPORT_IMAGE_MAP.default;
}

function normalizeBackgroundFit(value) {
  const token = String(value || "").toLowerCase();
  return token === "contain" ? "contain" : "cover";
}

function normalizeBackgroundPosition(value) {
  const allowed = new Set(["center", "left center", "right center", "top center", "bottom center", "center top", "center bottom"]);
  const token = String(value || "center").toLowerCase();
  return allowed.has(token) ? token : "center";
}

function buildAutoBackgroundAttrs({ sportGroup = "", leagueKey = "", fit = "cover", position = "center", strength = 0.22 } = {}) {
  const safeSport = SPORT_GROUPS[sportGroup] ? sportGroup : "";
  const visual = getLeagueVisualConfig(leagueKey, safeSport);
  const imagePath = visual.imagePath;
  const tone = getSportContextTone(safeSport);
  const safeFit = normalizeBackgroundFit(fit || visual.fit || "cover");
  const safePosition = normalizeBackgroundPosition(position || visual.position || "center");
  const safeStrength = Math.max(0.08, Math.min(0.44, Number(strength) || 0.22));

  const attrs = [
    `style="--context-bg-image:url('${escapeHtml(imagePath)}');--context-bg-fit:${safeFit};--context-bg-position:${safePosition};--context-bg-strength:${safeStrength};--context-accent-rgb:${tone.accent};--context-glow-rgb:${tone.glow};"`
  ];
  if (safeSport) {
    attrs.push(`data-auto-bg-sport="${safeSport}"`);
  }
  if (leagueKey) {
    attrs.push(`data-auto-bg-league="${escapeHtml(String(leagueKey))}"`);
  }
  return attrs.join(" ");
}

function renderMatchCard(match) {
  const sportIcon = SPORT_GROUPS[match.sportGroup]?.icon || "SPT";
  return `
    <a class="match-card auto-bg-surface" data-link href="${escapeHtml(routeForMatch(match))}" ${buildAutoBackgroundAttrs({
      sportGroup: match.sportGroup,
      leagueKey: match.leagueKey,
      fit: "cover",
      position: "center",
      strength: 0.21
    })}>
      <div class="match-league">
        <span>${sportIcon} ${escapeHtml(match.leagueLabel)}</span>
        ${statusBadge(match)}
      </div>
      <div class="match-teams">
        ${renderTeamScoreRow({
          sportGroup: match.sportGroup,
          teamId: match.homeTeamId,
          teamName: match.homeName,
          teamAbbr: match.homeAbbr,
          teamLogo: match.homeLogo,
          score: match.homeScore,
          fallbackIcon: sportIcon
        })}
        ${renderTeamScoreRow({
          sportGroup: match.sportGroup,
          teamId: match.awayTeamId,
          teamName: match.awayName,
          teamAbbr: match.awayAbbr,
          teamLogo: match.awayLogo,
          score: match.awayScore,
          fallbackIcon: sportIcon
        })}
      </div>
      <div class="match-meta">
        <span>${escapeHtml(getStatusText(match))}</span>
        <span>${escapeHtml(match.venue)}</span>
      </div>
    </a>
  `;
}

function renderMatchGrid(matches, emptyMessage) {
  if (!matches.length) {
    return `<div class="message-box">${escapeHtml(emptyMessage)}</div>`;
  }
  return `<div class="grid">${matches.map((match) => renderMatchCard(match)).join("")}</div>`;
}

function topLeagueSummaries() {
  return TOP_LEAGUE_KEYS.map((leagueKey) => {
    const matches = state.matches.filter((match) => match.leagueKey === leagueKey);
    const live = matches.filter((match) => match.status === "live").length;
    const total = matches.length;
    return {
      key: leagueKey,
      label: LEAGUES[leagueKey]?.label || leagueKey,
      sportGroup: LEAGUES[leagueKey]?.sportGroup || "football",
      region: LEAGUE_REGIONS[leagueKey] || "International",
      live,
      total
    };
  });
}

function trendingMatches() {
  return [...state.matches].sort((left, right) => right.trendingScore - left.trendingScore).slice(0, 12);
}
function renderLivePage() {
  const main = qs("#main");
  if (!main) {
    return;
  }

  const liveLeagues = new Map();
  state.liveMatches.forEach((match) => {
    if (!match?.leagueKey) {
      return;
    }
    if (!liveLeagues.has(match.leagueKey)) {
      liveLeagues.set(match.leagueKey, {
        key: match.leagueKey,
        label: LEAGUES[match.leagueKey]?.label || match.leagueLabel || match.leagueKey,
        sportGroup: LEAGUES[match.leagueKey]?.sportGroup || match.sportGroup || "",
        region: LEAGUE_REGIONS[match.leagueKey] || "International"
      });
    }
  });
  const pinnedLeagues = Array.from(liveLeagues.values()).slice(0, 12);
  const liveSports = Array.from(new Set(state.liveMatches.map((match) => match.sportGroup).filter(Boolean)));
  const liveContextSport = getDominantSportGroup();
  const heroActions = `
    <a class="btn btn-primary" data-link href="/upcoming">Upcoming Matches</a>
    <a class="btn" data-link href="/top-leagues">Top Leagues</a>
  `;

  main.innerHTML = `
    <section class="hero auto-bg-surface" ${buildAutoBackgroundAttrs({
      sportGroup: liveContextSport,
      leagueKey: "",
      fit: "cover",
      position: "center",
      strength: 0.24
    })}>
      ${renderSeoHeroPanel({
        eyebrow: "Realtime live match coverage",
        title: "LiveScoreFree",
        lead: "Only currently live matches are shown here, with realtime stats, commentary, lineups, events, and direct score pages across major sports.",
        actionsHtml: heroActions,
        trustItems: ["Live matches only", "Auto-updating scoreboards", "Worldwide live filter", "Commentary and stats"],
        panelLabel: "Trusted live search intent",
        panelTitle: "Clean live score coverage for fans",
        panelLead: "Focused live pages help users find active matches quickly without noise or manual filtering.",
        keywordItems: ["Live score now", "Football live score", "Cricket live score", "Basketball live score", "Tennis live updates", "Realtime match stats"]
      })}
      <div class="hero-stat-grid">
        <div class="stat-box"><strong>${state.liveMatches.length}</strong><span>Live Matches</span></div>
        <div class="stat-box"><strong>${pinnedLeagues.length}</strong><span>Live Leagues</span></div>
        <div class="stat-box"><strong>${liveSports.length}</strong><span>Sports Live</span></div>
        <div class="stat-box"><strong>Auto</strong><span>Worldwide Filter</span></div>
      </div>
    </section>

    <section class="section live-shell">
      <aside class="panel live-sidebar auto-bg-surface">
        <h2>Live Leagues</h2>
        <div class="pin-list">
          ${
            pinnedLeagues.length
              ? pinnedLeagues
                  .map((item) => `<a class="pin-item auto-bg-surface" data-link href="${escapeHtml(routeForLeague(item.key, "live"))}" ${buildAutoBackgroundAttrs({
                    sportGroup: item.sportGroup,
                    leagueKey: item.key,
                    fit: "cover",
                    position: "center",
                    strength: 0.24
                  })}>${escapeHtml(item.label)}</a>`)
                  .join("")
              : '<span class="subtle">No live leagues right now.</span>'
          }
        </div>
        <h2 style="margin-top:14px;">Worldwide Filter</h2>
        ${renderAutoCoveragePanel(state.liveMatches, { liveOnly: true })}
      </aside>
      <div class="panel live-main-preview auto-bg-surface">
        <h2>Live Match Center</h2>
        <p class="subtle">Showing live matches only.</p>
        ${renderMatchGrid(state.liveMatches, "No live matches available right now.")}
      </div>
    </section>
  `;

  setSeo({
    title: "Live Scores Now, Realtime Match Stats, Commentary | LiveScoreFree",
    description: "Follow live scores now with realtime stats, commentary, lineups, and event updates across football, cricket, basketball, tennis, and more.",
    keywords: ["live score now", "live matches now", "football live score", "cricket live score", "basketball live score", "tennis live updates", "realtime match stats"],
    path: "/live",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "LiveScoreFree Live Scores Now",
      url: `${SEO_BASE.origin}/live`
    }
  });
}

function renderUpcomingPage() {
  const main = qs("#main");
  if (!main) {
    return;
  }

  const list = [...state.upcomingMatches].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
  const sportCounts = list.reduce((acc, match) => {
    const key = String(match.sportGroup || "");
    if (!key) {
      return acc;
    }
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const sportChips = Object.entries(sportCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([sport, count]) => `<span class="region-chip">${escapeHtml(SPORT_GROUPS[sport]?.label || sport)}: ${count}</span>`)
    .join("");

  main.innerHTML = `
    <section class="section ad-band">
      ${renderAdSlot({
        title: "Upcoming Matches Sponsor",
        size: "728x90",
        placement: "Pre-match schedule visibility above upcoming fixtures"
      })}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Upcoming Matches</h2>
        <p>Only scheduled upcoming fixtures. Open a match page to enable a kickoff reminder.</p>
      </div>
      <div class="panel">
        <p class="subtle">${list.length} upcoming matches in the current feed.</p>
        <div class="region-list">
          ${sportChips || '<span class="subtle">Sport breakdown will appear as schedules load.</span>'}
        </div>
      </div>
      <div class="section" style="margin-top: 12px;">
        ${renderMatchGrid(list.slice(0, 40), "No upcoming matches are scheduled right now.")}
      </div>
    </section>

    ${renderTrustSignalsSection({
      title: "Upcoming Page Value",
      lead: "Pre-match pages with kickoff time and team details help fans return before live start."
    })}
  `;

  setSeo({
    title: "Upcoming Matches | LiveScoreFree",
    description: "Upcoming match fixtures with kickoff times and direct match pages for reminders, stats, and live updates.",
    keywords: ["upcoming matches", "upcoming live score matches", "today fixtures", "next sports matches"],
    path: "/upcoming",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Upcoming Matches",
      url: `${SEO_BASE.origin}/upcoming`
    }
  });
}

function renderHomePage() {
  const main = qs("#main");
  if (!main) {
    return;
  }

  const leagues = topLeagueSummaries();
  const sports = ["football", "cricket", "basketball", "tennis"];
  const pinnedLeagues = TOP_LEAGUE_KEYS.map((leagueKey) => ({
    key: leagueKey,
    label: LEAGUES[leagueKey]?.label || leagueKey
  })).slice(0, 12);
  const liveContextSport = getDominantSportGroup();
  const trust = getTrustSignals();
  const heroActions = `
    <a class="btn btn-primary" data-link href="/donate">Support from $1</a>
    <a class="btn" data-link href="/advertise">Advertise</a>
  `;

  main.innerHTML = `
    <section class="hero auto-bg-surface" ${buildAutoBackgroundAttrs({
      sportGroup: liveContextSport,
      leagueKey: "",
      fit: "cover",
      position: "center",
      strength: 0.24
    })}>
      ${renderSeoHeroPanel({
        eyebrow: "Trusted community-powered sports coverage",
        title: "LiveScoreFree",
        lead: "Fast live scores, fixtures, results, lineups, commentary, player stats, and match pages built for worldwide sports fans.",
        actionsHtml: heroActions,
        trustItems: ["Auto-updating live scores", "League, team, and player pages", "Legal and data-source pages included", "Worldwide sports coverage"],
        panelLabel: "Search-ready sports index",
        panelTitle: "Live scores, fixtures, and results that are easy to trust",
        panelLead: "Structured pages for live matches, upcoming fixtures, results, teams, players, and top leagues help users find updates quickly.",
        keywordItems: ["Football live scores", "Cricket live scores", "Basketball scores", "Tennis live updates", "Upcoming fixtures", "Match results", "Team pages", "Player stats"]
      })}
      <div class="hero-stat-grid">
        <div class="stat-box"><strong>${state.liveMatches.length}</strong><span>Live Now</span></div>
        <div class="stat-box"><strong>${state.matches.length}</strong><span>Today's Matches</span></div>
        <div class="stat-box"><strong>${state.finalMatches.length}</strong><span>Results Posted</span></div>
        <div class="stat-box"><strong>${leagues.length}</strong><span>Top Leagues</span></div>
      </div>
    </section>

    <section class="section ad-band">
      ${renderAdSlot({
        title: "Homepage Leaderboard",
        size: "728x90",
        placement: "Top banner placement on Live Now page"
      })}
    </section>

    <section class="section live-shell">
      <aside class="panel live-sidebar auto-bg-surface">
        <h2>Pinned Leagues</h2>
        <div class="pin-list">
          ${pinnedLeagues
            .map((item) => `<a class="pin-item auto-bg-surface" data-link href="${escapeHtml(routeForLeague(item.key))}" ${buildAutoBackgroundAttrs({
              sportGroup: LEAGUES[item.key]?.sportGroup || "",
              leagueKey: item.key,
              fit: "cover",
              position: "center",
              strength: 0.24
                  })}>${escapeHtml(item.label)}</a>`)
            .join("")}
        </div>
        <h2 style="margin-top:14px;">Worldwide Filter</h2>
        ${renderAutoCoveragePanel(state.matches)}
        <h2 style="margin-top:14px;">Audience Reach</h2>
        <p class="subtle">${escapeHtml(formatCompactNumber(trust.monthlyUsers))}+ monthly users across ${escapeHtml(String(trust.countries))}+ countries.</p>
        ${renderAdSlot({
          title: "Sidebar Ad",
          size: "300x250",
          placement: "Live page sidebar brand promotion"
        })}
      </aside>
      <div class="panel live-main-preview auto-bg-surface">
        <h2>Live Match Center</h2>
        <p class="subtle">Open any live match to access Summary, Stats, Lineups, Standings, H2H, Preview, and Events tabs.</p>
        ${renderMatchGrid(state.liveMatches, "No live matches available right now.")}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Live Now</h2>
        <p>Auto-updating scoreboard for football, cricket, basketball, tennis, and more.</p>
      </div>
      ${renderMatchGrid(state.liveMatches.slice(0, 16), "No matches are live right now. Check today's matches below.")}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Upcoming Matches</h2>
        <p>Scheduled fixtures across sports. Open a match page to set kickoff reminders.</p>
      </div>
      ${renderMatchGrid(state.upcomingMatches.slice(0, 16), "No upcoming matches are scheduled right now.")}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Trending Matches</h2>
        <p>Priority ranking by live status, top leagues, and match recency.</p>
      </div>
      ${renderMatchGrid(trendingMatches(), "Trending matches will appear when schedules are available.")}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Today's Matches</h2>
        <p>Every listed match opens its own page with live score, commentary, lineups, stats, and timeline animation.</p>
      </div>
      ${renderMatchGrid(state.matches.slice(0, 24), "Today's schedule is currently unavailable.")}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Top Leagues</h2>
        <p>Real-time counts across major competitions.</p>
      </div>
      <div class="league-grid">
        ${leagues
          .map(
            (league) => `
              <a class="league-card auto-bg-surface" data-link href="${escapeHtml(routeForLeague(league.key))}" ${buildAutoBackgroundAttrs({
                sportGroup: league.sportGroup,
                leagueKey: league.key,
                fit: "cover",
                position: "center",
                strength: 0.25
              })}>
                <img class="league-art" src="${escapeHtml(getLeagueImagePath(league.key, league.sportGroup))}" alt="${escapeHtml(league.label)}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(LEAGUE_IMAGE_MAP[league.key] || SPORT_IMAGE_MAP[league.sportGroup] || SPORT_IMAGE_MAP.default)}'">
                <h3>${escapeHtml(league.label)}</h3>
                <p>${escapeHtml(league.region)}</p>
                <p>${league.live} live / ${league.total} total today</p>
              </a>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Live Matches By Sport</h2>
        <p>Direct hubs for core sports requested for index speed and structure.</p>
      </div>
      <div class="sport-links">
        ${sports
          .map(
            (sport) =>
              `<a class="sport-link" data-link href="/sport/${sport}"><span>${SPORT_GROUPS[sport].icon} ${SPORT_GROUPS[sport].label}</span><span>Open</span></a>`
          )
          .join("")}
      </div>
    </section>

    <section class="section support-section">
      <div class="support-card">
        <div>
          <h2>Fuel Faster Live Updates</h2>
          <p>Support from $1 or any amount keeps LiveScoreFree fast, free, and accessible while funding meaningful support for people who need it.</p>
        </div>
        <div class="support-card-actions">
          <a class="kofi-link kofi-link-solid" href="https://ko-fi.com/livescorefree" target="_blank" rel="noopener noreferrer">Support on Ko-fi</a>
          <a class="btn" data-link href="/advertise">Advertise with Us</a>
        </div>
      </div>
    </section>

    ${renderRevenueModelSection()}
    ${renderTrustSignalsSection({
      title: "Growth & Trust",
      lead: "Fast pages, real-time updates, and transparent support metrics help users and advertisers trust the platform."
    })}
  `;

  setSeo({
    title: "Live Scores, Fixtures, Results, and Match Stats | LiveScoreFree",
    description:
      "LiveScoreFree delivers fast live scores, fixtures, results, commentary, lineups, player stats, and trusted match pages across major sports worldwide.",
    keywords: [
      "live scores",
      "sports live scores",
      "live score website",
      "upcoming matches",
      "trending matches",
      "today matches live scores",
      "top leagues live scores",
      "real-time player stats",
      "community-powered scoreboard",
      "football live score",
      "cricket live score",
      "basketball live score",
      "tennis live score",
      "match results"
    ],
    path: "/home",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "LiveScoreFree",
      url: `${SEO_BASE.origin}/home`
    }
  });
}

function renderTrendingPage() {
  const main = qs("#main");
  if (!main) {
    return;
  }

  const list = trendingMatches();
  main.innerHTML = `
    <section class="section ad-band">
      ${renderAdSlot({
        title: "Trending Matches Sponsor",
        size: "728x90",
        placement: "Brand visibility above trending live games"
      })}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Trending Matches</h2>
        <p>Dynamic ranking from live status, top-league priority, and kickoff recency.</p>
      </div>
      ${renderMatchGrid(list, "No trending matches are available right now.")}
    </section>

    ${renderTrustSignalsSection({
      title: "Why Trending Pages Rank",
      lead: "Frequent score updates and crawlable match routes improve discoverability."
    })}
  `;

  setSeo({
    title: "Trending Matches Live Scores | LiveScoreFree",
    description: "Top trending live matches with fast updates and direct match pages.",
    keywords: ["trending live scores", "hot football matches", "today's top matches"],
    path: "/trending",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Trending Matches",
      url: `${SEO_BASE.origin}/trending`
    }
  });
}

function renderResultsPage() {
  const main = qs("#main");
  if (!main) {
    return;
  }

  const recentHistory = state.history.slice(0, 20);

  main.innerHTML = `
    <section class="section ad-band">
      ${renderAdSlot({
        title: "Results Page Ad",
        size: "728x90",
        placement: "Leaderboard above daily final scores"
      })}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Today's Results</h2>
        <p>When a match ends: LIVE -> RESULTS -> HISTORY.</p>
      </div>
      ${renderMatchGrid(state.finalMatches.slice(0, 24), "No final results have been posted yet.")}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Recent Results History</h2>
        <p>Stored locally in your browser for quick browsing of past matches.</p>
      </div>
      ${
        recentHistory.length
          ? `<div class="grid">${recentHistory
              .map(
                (item) => `
                  <a class="match-card auto-bg-surface" data-link href="/${item.sportGroup}/results/${item.slug}" ${buildAutoBackgroundAttrs({
                    sportGroup: item.sportGroup,
                    leagueKey: item.leagueKey || "",
                    fit: "cover",
                    position: "center",
                    strength: 0.2
                  })}>
                    <div class="match-league">
                      <span>${SPORT_GROUPS[item.sportGroup]?.icon || "SPT"} ${escapeHtml(item.leagueLabel)}</span>
                      <span class="badge-result">HISTORY</span>
                    </div>
                    <div class="match-teams">
                      ${renderTeamScoreRow({
                        sportGroup: item.sportGroup,
                        teamId: item.homeTeamId || "",
                        teamName: item.homeName,
                        teamAbbr: item.homeAbbr || "",
                        teamLogo: item.homeLogo || "",
                        score: item.homeScore
                      })}
                      ${renderTeamScoreRow({
                        sportGroup: item.sportGroup,
                        teamId: item.awayTeamId || "",
                        teamName: item.awayName,
                        teamAbbr: item.awayAbbr || "",
                        teamLogo: item.awayLogo || "",
                        score: item.awayScore
                      })}
                    </div>
                    <div class="match-meta"><span>${escapeHtml(formatDateTime(item.date))}</span><span>${escapeHtml(item.venue)}</span></div>
                  </a>
                `
              )
              .join("")}</div>`
          : '<div class="message-box">History will build automatically after matches finish.</div>'
      }
    </section>

    ${renderTrustSignalsSection({
      title: "Archive Growth",
      lead: "Each completed match becomes a long-term searchable results page for fans and search engines."
    })}
  `;

  setSeo({
    title: "Today's Match Results | LiveScoreFree",
    description: "Browse final scores and transitions from live matches to results and history pages.",
    keywords: ["today match results", "final score today", "sports result history"],
    path: "/results",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Today's Results",
      url: `${SEO_BASE.origin}/results`
    }
  });
}
function renderHistoryPage() {
  const main = qs("#main");
  if (!main) {
    return;
  }

  const options = ["all", "football", "cricket", "basketball", "tennis", "nfl", "hockey", "baseball", "rugby", "mma", "f1"];
  const entries =
    state.historyFilter === "all"
      ? state.history
      : state.history.filter((item) => item.sportGroup === state.historyFilter);

  main.innerHTML = `
    <section class="section ad-band">
      ${renderAdSlot({
        title: "History Page Sponsor",
        size: "320x100 / 728x90",
        placement: "Historic match archive sponsor slot"
      })}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Live Matches History</h2>
        <p>Browse past matches, tournaments, and seasons from your saved history cache.</p>
      </div>
      <div class="panel">
        <label for="history-filter">Filter sport</label>
        <select id="history-filter">
          ${options
            .map(
              (option) =>
                `<option value="${option}" ${option === state.historyFilter ? "selected" : ""}>${option === "all" ? "All sports" : SPORT_GROUPS[option]?.label || option}</option>`
            )
            .join("")}
        </select>
      </div>
      <div class="section" style="margin-top: 14px;">
        ${
          entries.length
            ? `<div class="grid">${entries
                .slice(0, 200)
                .map(
                  (item) => `
                    <a class="match-card auto-bg-surface" data-link href="/${item.sportGroup}/results/${item.slug}" ${buildAutoBackgroundAttrs({
                      sportGroup: item.sportGroup,
                      leagueKey: item.leagueKey || "",
                      fit: "cover",
                      position: "center",
                      strength: 0.2
                    })}>
                      <div class="match-league"><span>${SPORT_GROUPS[item.sportGroup]?.icon || "SPT"} ${escapeHtml(item.leagueLabel)}</span><span class="badge-result">FINAL</span></div>
                      <div class="match-teams">
                        ${renderTeamScoreRow({
                          sportGroup: item.sportGroup,
                          teamId: item.homeTeamId || "",
                          teamName: item.homeName,
                          teamAbbr: item.homeAbbr || "",
                          teamLogo: item.homeLogo || "",
                          score: item.homeScore
                        })}
                        ${renderTeamScoreRow({
                          sportGroup: item.sportGroup,
                          teamId: item.awayTeamId || "",
                          teamName: item.awayName,
                          teamAbbr: item.awayAbbr || "",
                          teamLogo: item.awayLogo || "",
                          score: item.awayScore
                        })}
                      </div>
                      <div class="match-meta"><span>${escapeHtml(formatDateTime(item.date))}</span><span>${escapeHtml(item.venue)}</span></div>
                    </a>
                  `
                )
                .join("")}</div>`
            : '<div class="message-box">No saved history found yet. It is generated automatically after matches are final.</div>'
        }
      </div>
    </section>

    ${renderTrustSignalsSection({
      title: "History = SEO Engine",
      lead: "Permanent result pages compound traffic over time through team-vs-team and tournament queries."
    })}
  `;

  const filter = qs("#history-filter");
  if (filter) {
    filter.addEventListener("change", (event) => {
      state.historyFilter = event.target.value;
      renderHistoryPage();
    });
  }

  setSeo({
    title: "Match History | LiveScoreFree",
    description: "Browse stored match history for past results, tournaments, and completed live events.",
    keywords: ["match history", "past sports matches", "tournament results"],
    path: "/history",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "LiveScoreFree Match History",
      url: `${SEO_BASE.origin}/history`
    }
  });
}

function renderTopLeaguesPage() {
  const main = qs("#main");
  if (!main) {
    return;
  }

  const summaries = topLeagueSummaries();
  const sorted = [...summaries].sort((left, right) => right.live - left.live || right.total - left.total);

  main.innerHTML = `
    <section class="section ad-band">
      ${renderAdSlot({
        title: "Top Leagues Sponsor",
        size: "728x90",
        placement: "High-intent league navigation placement"
      })}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Top Leagues Live Matches</h2>
        <p>Fast league overview built for crawlable route structure and quick indexing.</p>
      </div>
      <div class="league-grid">
        ${sorted
          .map(
            (league) => `
              <a class="league-card auto-bg-surface" data-link href="${escapeHtml(routeForLeague(league.key))}" ${buildAutoBackgroundAttrs({
                sportGroup: league.sportGroup,
                leagueKey: league.key,
                fit: "cover",
                position: "center",
                strength: 0.25
              })}>
                <img class="league-art" src="${escapeHtml(getLeagueImagePath(league.key, league.sportGroup))}" alt="${escapeHtml(league.label)}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(LEAGUE_IMAGE_MAP[league.key] || SPORT_IMAGE_MAP[league.sportGroup] || SPORT_IMAGE_MAP.default)}'">
                <h3>${escapeHtml(league.label)}</h3>
                <p>${escapeHtml(league.region)}</p>
                <p>${league.live} live now</p>
                <p>${league.total} matches today</p>
              </a>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>League Match Feed</h2>
        <p>Includes live and results links for each match card.</p>
      </div>
      ${renderMatchGrid(
        state.matches.filter((match) => TOP_LEAGUE_KEYS.includes(match.leagueKey)).slice(0, 40),
        "Top league matches are currently unavailable."
      )}
    </section>

    ${renderTrustSignalsSection({
      title: "League Reach",
      lead: "League pages combine live coverage, result depth, and recurring fan intent."
    })}
  `;

  setSeo({
    title: "Top Leagues Live Scores | LiveScoreFree",
    description: "Top leagues with live counts, match cards, and direct live/results pages.",
    keywords: ["top leagues live score", "premier league live", "nba live", "nfl live"],
    path: "/top-leagues",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Top Leagues",
      url: `${SEO_BASE.origin}/top-leagues`
    }
  });
}

function collectLeagueTeams(leagueKey, matches, historyEntries = []) {
  const teamMap = new Map();

  const addTeam = ({ teamId = "", name = "", abbr = "", logo = "", status = "upcoming", date = "", venue = "" }) => {
    const cleanName = String(name || "").trim();
    if (!cleanName) {
      return;
    }
    const key = teamId ? `id:${teamId}` : `name:${slugify(cleanName)}`;
    if (!teamMap.has(key)) {
      teamMap.set(key, {
        key,
        teamId: String(teamId || ""),
        name: cleanName,
        abbr: String(abbr || "").trim(),
        logo: String(logo || ""),
        total: 0,
        live: 0,
        upcoming: 0,
        final: 0,
        latestDate: 0,
        venues: new Set()
      });
    }

    const item = teamMap.get(key);
    item.total += 1;
    if (status === "live") {
      item.live += 1;
    } else if (status === "final") {
      item.final += 1;
    } else {
      item.upcoming += 1;
    }
    if (!item.logo && logo) {
      item.logo = logo;
    }
    if (!item.abbr && abbr) {
      item.abbr = abbr;
    }
    const ts = new Date(date || 0).getTime();
    if (!Number.isNaN(ts)) {
      item.latestDate = Math.max(item.latestDate, ts);
    }
    if (venue) {
      item.venues.add(String(venue));
    }
  };

  for (const match of matches) {
    addTeam({
      teamId: match.homeTeamId,
      name: match.homeName,
      abbr: match.homeAbbr,
      logo: match.homeLogo,
      status: match.status,
      date: match.date,
      venue: match.venue
    });
    addTeam({
      teamId: match.awayTeamId,
      name: match.awayName,
      abbr: match.awayAbbr,
      logo: match.awayLogo,
      status: match.status,
      date: match.date,
      venue: match.venue
    });
  }

  for (const item of historyEntries) {
    addTeam({
      teamId: item.homeTeamId,
      name: item.homeName,
      logo: item.homeLogo,
      status: "final",
      date: item.date,
      venue: item.venue
    });
    addTeam({
      teamId: item.awayTeamId,
      name: item.awayName,
      logo: item.awayLogo,
      status: "final",
      date: item.date,
      venue: item.venue
    });
  }

  const leagueEvents = state.eventsByLeague[leagueKey] || [];
  for (const event of leagueEvents) {
    const competitors = event.competitions?.[0]?.competitors || [];
    for (const competitor of competitors) {
      addTeam({
        teamId: competitor.team?.id,
        name: competitor.team?.displayName || competitor.team?.name || "",
        abbr: competitor.team?.abbreviation || "",
        logo: competitor.team?.logo || "",
        status: parseStatus(event.status?.type?.name),
        date: event.date,
        venue: event.competitions?.[0]?.venue?.fullName || ""
      });
    }
  }

  return Array.from(teamMap.values())
    .map((item) => ({
      ...item,
      venueCount: item.venues.size,
      venues: Array.from(item.venues).slice(0, 3)
    }))
    .sort((left, right) => right.live - left.live || right.total - left.total || left.name.localeCompare(right.name));
}

async function fetchLeaguePlayersSnapshot(leagueKey, teams) {
  const leagueConfig = LEAGUES[leagueKey];
  if (!leagueConfig?.feed) {
    return [];
  }

  const teamTargets = teams
    .filter((team) => team.teamId)
    .slice(0, 12);
  if (!teamTargets.length) {
    return [];
  }

  const playersMap = new Map();

  await Promise.allSettled(
    teamTargets.map(async (team) => {
      const url = `${ESPN_BASE}/${leagueConfig.feed}/teams/${encodeURIComponent(team.teamId)}/roster`;
      const data = await cachedJson(url, 10 * 60 * 1000);
      const athletes = flattenEspnRosterAthletes(data).slice(0, 40);

      for (const athlete of athletes) {
        const name = athlete.displayName || athlete.fullName || "Player";
        const id = String(athlete.id || "");
        const key = id ? `id:${id}` : `${slugify(name)}:${team.teamId}`;
        if (playersMap.has(key)) {
          continue;
        }
        playersMap.set(key, {
          id: key,
          playerId: id,
          name,
          teamName: team.name,
          teamId: String(team.teamId || ""),
          sportGroup: leagueConfig.sportGroup || "football",
          position: athlete.position?.abbreviation || athlete.position?.displayName || "",
          jersey: athlete.jersey || "",
          headshot: athlete.headshot?.href || athlete.image?.href || "",
          country: athlete.birthPlace?.country || athlete.nationality || ""
        });
      }
    })
  );

  return Array.from(playersMap.values())
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, 180);
}

function renderLeagueScheduleTable(matches) {
  if (!matches.length) {
    return '<div class="message-box">No scheduled fixtures available for this league right now.</div>';
  }

  const rows = matches
    .slice()
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
    .slice(0, 120)
    .map(
      (match) => `
        <tr>
          <td>${escapeHtml(formatDate(match.date))}</td>
          <td>${escapeHtml(formatTime(match.date))}</td>
          <td>
            ${renderTeamNameControl({
              sportGroup: match.sportGroup,
              teamId: match.homeTeamId || "",
              teamName: match.homeName,
              teamAbbr: match.homeAbbr || "",
              teamLogo: match.homeLogo || "",
              fallbackIcon: "TM",
              className: "inline-entity-link"
            })}
            <span class="subtle">vs</span>
            ${renderTeamNameControl({
              sportGroup: match.sportGroup,
              teamId: match.awayTeamId || "",
              teamName: match.awayName,
              teamAbbr: match.awayAbbr || "",
              teamLogo: match.awayLogo || "",
              fallbackIcon: "TM",
              className: "inline-entity-link"
            })}
          </td>
          <td>${escapeHtml(match.venue)}</td>
          <td>${statusBadge(match)}</td>
          <td><a data-link href="${escapeHtml(routeForMatch(match))}">Open</a></td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="table-wrap">
      <table class="source-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Match</th>
            <th>Venue</th>
            <th>Status</th>
            <th>Page</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderLeagueTeamsGrid(teams, sportGroup = "football") {
  if (!teams.length) {
    return '<div class="message-box">No team information published for this league yet.</div>';
  }

  return `
    <div class="league-team-grid">
      ${teams
        .map(
          (team) => `
            <article class="panel">
              <div class="league-team-head">
                ${
                  team.logo
                    ? `<span class="entity-link-btn league-team-logo-link" role="link" tabindex="0" data-team-route="${escapeHtml(routeForTeam({
                        sportGroup,
                        teamId: team.teamId || "",
                        teamName: team.name
                      }))}" title="${escapeHtml(`Open ${team.name} team page`)}"><img src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name)}" loading="lazy" onerror="this.style.display='none'"></span>`
                    : `<span class="league-team-fallback">${escapeHtml((team.abbr || team.name.slice(0, 3)).toUpperCase())}</span>`
                }
                <div>
                  ${renderTeamNameControl({
                    sportGroup,
                    teamId: team.teamId || "",
                    teamName: team.name,
                    teamAbbr: team.abbr || "",
                    teamLogo: "",
                    fallbackIcon: "TM",
                    className: "inline-entity-link"
                  })}
                  <p class="subtle">${escapeHtml(team.abbr || "Team")}${team.teamId ? ` | ID ${escapeHtml(team.teamId)}` : ""}</p>
                </div>
              </div>
              <div class="match-info-grid">
                <div class="info-card"><span>Total Matches</span><strong>${team.total}</strong></div>
                <div class="info-card"><span>Live</span><strong>${team.live}</strong></div>
                <div class="info-card"><span>Upcoming</span><strong>${team.upcoming}</strong></div>
                <div class="info-card"><span>Final</span><strong>${team.final}</strong></div>
              </div>
              <p class="subtle">Venues: ${team.venueCount ? escapeHtml(team.venues.join(", ")) : "Venue info pending"}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderLeaguePlayersGrid(players, sportGroup = "football") {
  if (!players.length) {
    return '<div class="message-box">Player profiles are not available for this league feed right now.</div>';
  }

  return `
    <div class="league-player-grid">
      ${players
        .map(
          (player) => `
            <article class="lineup-item">
              <div style="display:flex;align-items:center;gap:10px;">
                ${
                  player.headshot
                    ? `<span class="entity-link-btn player-avatar-link" role="link" tabindex="0" data-player-route="${escapeHtml(routeForPlayer({
                        sportGroup: player.sportGroup || sportGroup,
                        playerId: normalizeNumericEntityId(player.playerId || ""),
                        playerName: player.name,
                        teamId: player.teamId || "",
                        teamName: player.teamName || ""
                      }))}" title="${escapeHtml(`Open ${player.name} player page`)}"><img src="${escapeHtml(player.headshot)}" alt="${escapeHtml(player.name)}" loading="lazy" onerror="this.style.display='none'" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:1px solid var(--line)"></span>`
                    : '<span class="league-team-fallback">PLR</span>'
                }
                <div style="min-width:0;">
                  ${renderPlayerNameControl({
                    sportGroup: player.sportGroup || sportGroup,
                    playerId: player.playerId || "",
                    playerName: player.name,
                    teamId: player.teamId || "",
                    teamName: player.teamName || ""
                  })}
                  <div class="subtle" style="font-size:12px;">
                    ${
                      player.teamName
                        ? renderTeamNameControl({
                            sportGroup,
                            teamId: player.teamId || "",
                            teamName: player.teamName,
                            teamAbbr: "",
                            teamLogo: "",
                            fallbackIcon: "TM",
                            className: "inline-entity-link"
                          })
                        : ""
                    }
                  </div>
                </div>
              </div>
              <div class="subtle" style="margin-top:6px;font-size:12px;">
                ${escapeHtml([player.position, player.jersey ? `#${player.jersey}` : "", player.country].filter(Boolean).join(" | ") || "Profile details unavailable")}
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderLeagueSectionLinks(leagueKey, activeSection) {
  const items = [
    { id: "overview", label: "Overview" },
    { id: "live", label: "Live" },
    { id: "upcoming", label: "Upcoming" },
    { id: "schedule", label: "Schedule" },
    { id: "results", label: "Results" },
    { id: "history", label: "History" },
    { id: "teams", label: "Teams" },
    { id: "players", label: "Players" }
  ];

  return `
    <div class="league-route-links">
      ${items
        .map((item) => `<a class="league-route-link ${activeSection === item.id ? "active" : ""}" data-link href="${escapeHtml(routeForLeague(leagueKey, item.id))}">${escapeHtml(item.label)}</a>`)
        .join("")}
    </div>
  `;
}

async function renderLeaguePage(leagueKey, section = "overview") {
  const main = qs("#main");
  if (!main) {
    return;
  }

  const safeSection = LEAGUE_PAGE_SECTIONS.includes(section) ? section : "overview";
  const leagueConfig = LEAGUES[leagueKey] || null;
  const matches = state.matches.filter((match) => match.leagueKey === leagueKey);
  const historyEntries = state.history.filter((item) => item.leagueKey === leagueKey).slice(0, 300);

  if (!leagueConfig && !matches.length && !historyEntries.length) {
    renderNotFoundPage();
    return;
  }

  const leagueLabel = leagueConfig?.label || matches[0]?.leagueLabel || historyEntries[0]?.leagueLabel || leagueKey;
  const sportGroup = leagueConfig?.sportGroup || matches[0]?.sportGroup || historyEntries[0]?.sportGroup || "football";
  const sportLabel = SPORT_GROUPS[sportGroup]?.label || sportGroup;
  const region = LEAGUE_REGIONS[leagueKey] || "International";

  const live = matches.filter((match) => match.status === "live");
  const upcoming = matches.filter((match) => match.status === "upcoming");
  const results = matches.filter((match) => match.status === "final");
  const scheduleMatches = matches.filter((match) => match.status !== "final");
  const teams = collectLeagueTeams(leagueKey, matches, historyEntries);

  let players = [];
  if (safeSection === "overview" || safeSection === "players") {
    players = await fetchLeaguePlayersSnapshot(leagueKey, teams);
  }
  const playerPreview = safeSection === "overview" ? players.slice(0, 24) : players;

  const shouldShow = (name) => safeSection === "overview" || safeSection === name;
  const sectionLabel = safeSection === "overview" ? "Overview" : safeSection.charAt(0).toUpperCase() + safeSection.slice(1);

  main.innerHTML = `
    <section class="hero auto-bg-surface" ${buildAutoBackgroundAttrs({
      sportGroup,
      leagueKey,
      fit: "cover",
      position: "center",
      strength: 0.24
    })}>
      <div class="hero-top">
        <div>
          <h1>${escapeHtml(leagueLabel)} <span>${escapeHtml(sectionLabel)}</span></h1>
          <p>${escapeHtml(sportLabel)} league coverage with live matches, upcoming fixtures, results, history, team and player info.</p>
          <p class="subtle">Region: ${escapeHtml(region)} | Scope: ${escapeHtml(region === "International" ? "International" : "Regional")} | Route: /league/${escapeHtml(leagueKey)}</p>
        </div>
      </div>
      <div class="hero-stat-grid">
        <div class="stat-box"><strong>${live.length}</strong><span>Live Matches</span></div>
        <div class="stat-box"><strong>${upcoming.length}</strong><span>Upcoming</span></div>
        <div class="stat-box"><strong>${results.length}</strong><span>Results</span></div>
        <div class="stat-box"><strong>${teams.length}</strong><span>Teams</span></div>
      </div>
      ${renderLeagueSectionLinks(leagueKey, safeSection)}
    </section>

    ${shouldShow("live") ? `
      <section class="section">
        <div class="section-head"><h2>Live Match Pages</h2><p>All live events auto-filled automatically.</p></div>
        ${renderMatchGrid(live, "No live matches in this league right now.")}
      </section>
    ` : ""}

    ${shouldShow("upcoming") ? `
      <section class="section">
        <div class="section-head"><h2>Upcoming Matches</h2><p>Auto-updating fixtures for this league.</p></div>
        ${renderMatchGrid(upcoming, "No upcoming fixtures available right now.")}
      </section>
    ` : ""}

    ${shouldShow("schedule") ? `
      <section class="section">
        <div class="section-head"><h2>Schedule & Venues</h2><p>Date, kickoff time, venue, and direct match page links.</p></div>
        ${renderLeagueScheduleTable(scheduleMatches)}
      </section>
    ` : ""}

    ${shouldShow("results") ? `
      <section class="section">
        <div class="section-head"><h2>League Results</h2><p>Final score pages for completed league matches.</p></div>
        ${renderMatchGrid(results, "No final results available right now.")}
      </section>
    ` : ""}

    ${shouldShow("history") ? `
      <section class="section">
        <div class="section-head"><h2>League Match History</h2><p>Historical matches stored from completed events.</p></div>
        ${
          historyEntries.length
            ? `<div class="grid">${historyEntries
                .map(
                  (item) => `
                    <a class="match-card auto-bg-surface" data-link href="/${item.sportGroup}/results/${item.slug}" ${buildAutoBackgroundAttrs({
                      sportGroup: item.sportGroup,
                      leagueKey: item.leagueKey || leagueKey,
                      fit: "cover",
                      position: "center",
                      strength: 0.2
                    })}>
                      <div class="match-league"><span>${SPORT_GROUPS[item.sportGroup]?.icon || "SPT"} ${escapeHtml(item.leagueLabel)}</span><span class="badge-result">FINAL</span></div>
                    <div class="match-teams">
                      ${renderTeamScoreRow({
                        sportGroup: item.sportGroup,
                        teamId: item.homeTeamId || "",
                        teamName: item.homeName,
                        teamAbbr: item.homeAbbr || "",
                        teamLogo: item.homeLogo || "",
                        score: item.homeScore
                      })}
                      ${renderTeamScoreRow({
                        sportGroup: item.sportGroup,
                        teamId: item.awayTeamId || "",
                        teamName: item.awayName,
                        teamAbbr: item.awayAbbr || "",
                        teamLogo: item.awayLogo || "",
                        score: item.awayScore
                      })}
                    </div>
                      <div class="match-meta"><span>${escapeHtml(formatDateTime(item.date))}</span><span>${escapeHtml(item.venue)}</span></div>
                    </a>
                  `
                )
                .join("")}</div>`
            : '<div class="message-box">No stored league history found yet.</div>'
        }
      </section>
    ` : ""}

    ${shouldShow("teams") ? `
      <section class="section">
        <div class="section-head"><h2>League Teams</h2><p>Team-level activity across live, upcoming, and completed matches.</p></div>
        ${renderLeagueTeamsGrid(teams, sportGroup)}
      </section>
    ` : ""}

    ${shouldShow("players") ? `
      <section class="section">
        <div class="section-head"><h2>League Players</h2><p>Player list from available roster endpoints.</p></div>
        ${renderLeaguePlayersGrid(playerPreview, sportGroup)}
      </section>
    ` : ""}
  `;

  setSeo({
    title: `${leagueLabel} ${sectionLabel} | LiveScoreFree`,
    description: `${leagueLabel} ${sectionLabel.toLowerCase()} page with live matches, upcoming schedule, venues, teams, players, results, and history.`,
    keywords: [
      `${leagueLabel.toLowerCase()} live score`,
      `${leagueLabel.toLowerCase()} schedule`,
      `${leagueLabel.toLowerCase()} teams`,
      `${leagueLabel.toLowerCase()} players`,
      `${leagueLabel.toLowerCase()} results`
    ],
    path: routeForLeague(leagueKey, safeSection),
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${leagueLabel} ${sectionLabel}`,
      url: `${SEO_BASE.origin}${routeForLeague(leagueKey, safeSection)}`
    }
  });
}

function renderSportPage(sport) {
  const sportMeta = SPORT_GROUPS[sport];
  const main = qs("#main");
  if (!main) {
    return;
  }

  if (!sportMeta) {
    renderNotFoundPage();
    return;
  }

  const matches = state.matches.filter((match) => match.sportGroup === sport);
  const live = matches.filter((match) => match.status === "live");
  const upcoming = matches.filter((match) => match.status === "upcoming");
  const results = matches.filter((match) => match.status === "final");
  const nextKickoff = upcoming.length ? formatDateTime(upcoming[0].date) : "No scheduled kickoff";
  const latestResult = results.length ? `${results[0].homeName} ${results[0].homeScore} - ${results[0].awayScore} ${results[0].awayName}` : "No final scores yet";
  const sportLeagues = Array.from(new Set(matches.map((match) => match.leagueLabel))).slice(0, 4);

  main.innerHTML = `
    <section class="hero">
      <div class="hero-top">
        <div>
          <h1>${sportMeta.icon} ${escapeHtml(sportMeta.label)} Live Scores</h1>
          <p>${escapeHtml(sportMeta.description)}</p>
          <p class="subtle">Auto background and sport visuals adapt to this page.</p>
        </div>
        <aside class="sport-hero-media">
          <img src="${escapeHtml(getSportImagePath(sport))}" alt="${escapeHtml(sportMeta.label)} visual" loading="lazy">
          <div class="sport-hero-meta">
            <strong>Next kickoff</strong>
            <span>${escapeHtml(nextKickoff)}</span>
            <strong>Latest result</strong>
            <span>${escapeHtml(latestResult)}</span>
          </div>
        </aside>
      </div>
      <div class="sport-info-grid">
        <article class="info-card"><span>Live Right Now</span><strong>${live.length}</strong></article>
        <article class="info-card"><span>Upcoming</span><strong>${upcoming.length}</strong></article>
        <article class="info-card"><span>Completed</span><strong>${results.length}</strong></article>
        <article class="info-card"><span>Leagues Covered</span><strong>${sportLeagues.length || 0}</strong></article>
      </div>
      ${
        sportLeagues.length
          ? `<div class="sport-league-strip">${sportLeagues.map((league) => `<span>${escapeHtml(league)}</span>`).join("")}</div>`
          : ""
      }
      <div class="hero-stat-grid">
        <div class="stat-box"><strong>${live.length}</strong><span>Live</span></div>
        <div class="stat-box"><strong>${upcoming.length}</strong><span>Upcoming</span></div>
        <div class="stat-box"><strong>${results.length}</strong><span>Results</span></div>
        <div class="stat-box"><strong>${matches.length}</strong><span>Total</span></div>
      </div>
    </section>

    <section class="section ad-band">
      ${renderAdSlot({
        title: `${sportMeta.label} Hub Sponsor`,
        size: "728x90",
        placement: `${sportMeta.label} live and results hub banner`
      })}
    </section>

    <section class="section">
      <div class="section-head"><h2>Sport Insights</h2><p>Realtime info and image-based context for ${escapeHtml(sportMeta.label)}.</p></div>
      <div class="match-info-grid">
        <div class="info-card"><span>Live Feed Status</span><strong>${state.providerStatus.espn.ok || state.providerStatus.sportsdb.ok ? "Active" : "Retrying"}</strong></div>
        <div class="info-card"><span>Update Mode</span><strong>Automatic</strong></div>
        <div class="info-card"><span>Auto Routes</span><strong>/${sport}/live/* and /${sport}/results/*</strong></div>
        <div class="info-card"><span>Background Mode</span><strong>${state.backgroundMode === "custom" ? "Custom image" : "Auto rotating sport scenes"}</strong></div>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2>Live Matches</h2><p>/${sport}/live/slug pages are generated automatically.</p></div>
      ${renderMatchGrid(live, `No ${sportMeta.label.toLowerCase()} matches are live right now.`)}
    </section>

    <section class="section">
      <div class="section-head"><h2>Upcoming Matches</h2><p>Auto-updating schedule.</p></div>
      ${renderMatchGrid(upcoming, "No upcoming matches available.")}
    </section>

    <section class="section">
      <div class="section-head"><h2>Results</h2><p>Finished matches move to /${sport}/results/slug.</p></div>
      ${renderMatchGrid(results, "No results posted yet.")}
    </section>

    ${renderTrustSignalsSection({
      title: `${sportMeta.label} Audience Signals`,
      lead: "Auto-generated sport pages help fans find live and final scores quickly."
    })}
  `;

  setSeo({
    title: `${sportMeta.label} Live Scoreboard | LiveScoreFree`,
    description: `${sportMeta.label} live scores with commentary, team lineups, stats, and timeline updates.`,
    keywords: [`${sportMeta.label.toLowerCase()} live scores`, `${sportMeta.label.toLowerCase()} results`, `${sportMeta.label.toLowerCase()} commentary`],
    path: `/sport/${sport}`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${sportMeta.label} Live Scoreboard`,
      url: `${SEO_BASE.origin}/sport/${sport}`
    }
  });
}

function findMatch(sport, slug) {
  if (sport && state.matchIndex.has(`${sport}:${slug}`)) {
    return state.matchIndex.get(`${sport}:${slug}`);
  }

  if (state.matchIndex.has(slug)) {
    const genericMatch = state.matchIndex.get(slug);
    if (!sport || genericMatch.sportGroup === sport) {
      return genericMatch;
    }
  }

  const historyItem = state.history.find((item) => item.slug === slug && (!sport || item.sportGroup === sport));
  if (historyItem) {
    return {
      ...historyItem,
      feedPath: historyItem.feedPath || LEAGUES[historyItem.leagueKey]?.feed || "soccer/eng.1",
      source: historyItem.source || "espn",
      sourceId: historyItem.sourceId || String(historyItem.id || ""),
      status: "final",
      statusDetail: "Final",
      route: `/${historyItem.sportGroup}/results/${historyItem.slug}`
    };
  }

  return null;
}

function getCandidateFeedsForSport(sportGroup, leagueKeys = []) {
  const fromLeagues = leagueKeys
    .map((key) => LEAGUES[key]?.feed || "")
    .filter(Boolean);
  const fromSport = (SPORT_GROUPS[sportGroup]?.leagues || [])
    .map((key) => LEAGUES[key]?.feed || "")
    .filter(Boolean);
  return Array.from(new Set([...fromLeagues, ...fromSport])).slice(0, 12);
}

function collectTeamSnapshotFromState(sportGroup, token) {
  const sourceMatches = [
    ...state.matches,
    ...state.history.map((item) => ({
      ...item,
      status: "final",
      route: routeForAnyMatch({ ...item, status: "final" })
    }))
  ].filter((item) => item.sportGroup === sportGroup);

  const safeToken = token || { id: "", nameSlug: "" };
  const collected = {
    sportGroup,
    teamId: "",
    teamName: "",
    teamAbbr: "",
    teamLogo: "",
    leagueKeys: new Set(),
    venues: new Set(),
    matches: [],
    live: 0,
    upcoming: 0,
    final: 0,
    total: 0
  };

  for (const match of sourceMatches) {
    const sides = [
      {
        side: "home",
        teamId: String(match.homeTeamId || ""),
        teamName: String(match.homeName || ""),
        teamAbbr: String(match.homeAbbr || ""),
        teamLogo: String(match.homeLogo || "")
      },
      {
        side: "away",
        teamId: String(match.awayTeamId || ""),
        teamName: String(match.awayName || ""),
        teamAbbr: String(match.awayAbbr || ""),
        teamLogo: String(match.awayLogo || "")
      }
    ];

    const matchedSide = sides.find((side) => {
      if (safeToken.id) {
        return side.teamId && side.teamId === safeToken.id;
      }
      if (safeToken.nameSlug) {
        return slugify(side.teamName) === safeToken.nameSlug;
      }
      return false;
    });

    if (!matchedSide) {
      continue;
    }

    if (!collected.teamName) {
      collected.teamName = matchedSide.teamName;
    }
    if (!collected.teamId && matchedSide.teamId) {
      collected.teamId = matchedSide.teamId;
    }
    if (!collected.teamAbbr && matchedSide.teamAbbr) {
      collected.teamAbbr = matchedSide.teamAbbr;
    }
    if (!collected.teamLogo && matchedSide.teamLogo) {
      collected.teamLogo = matchedSide.teamLogo;
    }
    if (match.leagueKey) {
      collected.leagueKeys.add(String(match.leagueKey));
    }
    if (match.venue) {
      collected.venues.add(String(match.venue));
    }

    const status = match.status === "final" ? "final" : match.status === "live" ? "live" : "upcoming";
    collected[status] += 1;
    collected.total += 1;
    collected.matches.push({
      ...match,
      status,
      route: match.route || routeForAnyMatch(match)
    });
  }

  if (!collected.teamName) {
    return null;
  }

  collected.matches.sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
  return collected;
}

function dedupePlayerRows(players) {
  const seen = new Set();
  const rows = [];
  for (const item of players || []) {
    const idPart = String(item.playerId || item.id || "");
    const namePart = slugify(item.name || item.playerName || "");
    const key = `${idPart || "name"}:${namePart}`;
    if (!namePart || seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push(item);
  }
  return rows;
}

function yearsFromDate(dateValue) {
  const safeDate = String(dateValue || "").trim();
  if (!safeDate) {
    return "";
  }
  const parsed = new Date(safeDate);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return String(Math.max(0, new Date().getFullYear() - parsed.getFullYear()));
}

function firstFilledValue(...values) {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    const text = String(value).trim();
    if (text) {
      return text;
    }
  }
  return "";
}

function normalizeEspnPlayerRow(player) {
  const id = String(player?.id || player?.athlete?.id || "");
  const athlete = player?.athlete || player || {};
  return {
    playerId: id,
    name: athlete.displayName || athlete.fullName || athlete.shortName || "Player",
    shortName: athlete.shortName || "",
    position: athlete.position?.abbreviation || athlete.position?.displayName || "",
    jersey: athlete.jersey || "",
    age: athlete.age || "",
    height: athlete.displayHeight || "",
    weight: athlete.displayWeight || "",
    country: athlete.birthPlace?.country || athlete.nationality || "",
    headshot: athlete.headshot?.href || athlete.image?.href || "",
    experience: athlete.experience?.displayValue || ""
  };
}

function normalizeEspnAthleteProfileRow(profile) {
  const athlete = profile?.athlete || profile || {};
  const team = profile?.team || athlete?.team || {};
  return {
    playerId: String(athlete.id || ""),
    name: athlete.displayName || athlete.fullName || athlete.shortName || "",
    shortName: athlete.shortName || "",
    position: athlete.position?.displayName || athlete.position?.abbreviation || "",
    jersey: athlete.jersey || "",
    age: firstFilledValue(athlete.age),
    height: athlete.displayHeight || "",
    weight: athlete.displayWeight || "",
    country: athlete.birthPlace?.country || athlete.nationality || "",
    headshot: athlete.headshot?.href || athlete.image?.href || "",
    experience: athlete.experience?.displayValue || "",
    bio: athlete.bio || athlete.description || "",
    teamId: String(team.id || ""),
    teamName: team.displayName || team.name || ""
  };
}

function normalizeSportsDbPlayerRow(player) {
  if (!player || typeof player !== "object") {
    return {};
  }
  return {
    playerId: String(player.idPlayer || ""),
    name: player.strPlayer || "",
    shortName: player.strPlayer || "",
    position: player.strPosition || "",
    jersey: player.strNumber || "",
    age: yearsFromDate(player.dateBorn),
    height: player.strHeight || "",
    weight: player.strWeight || "",
    country: player.strNationality || player.strCountry || "",
    headshot: player.strCutout || player.strThumb || player.strRender || "",
    experience: "",
    bio: player.strDescriptionEN || "",
    teamId: String(player.idTeam || ""),
    teamName: player.strTeam || ""
  };
}

function mergePlayerProfileRows(...rows) {
  const sources = rows.filter((row) => row && typeof row === "object");
  return {
    playerId: firstFilledValue(...sources.map((row) => row.playerId || row.id || "")),
    name: firstFilledValue(...sources.map((row) => row.name || row.playerName || "")),
    shortName: firstFilledValue(...sources.map((row) => row.shortName || "")),
    position: firstFilledValue(...sources.map((row) => row.position || "")),
    jersey: firstFilledValue(...sources.map((row) => row.jersey || "")),
    age: firstFilledValue(...sources.map((row) => row.age || "")),
    height: firstFilledValue(...sources.map((row) => row.height || "")),
    weight: firstFilledValue(...sources.map((row) => row.weight || "")),
    country: firstFilledValue(...sources.map((row) => row.country || "")),
    headshot: firstFilledValue(...sources.map((row) => row.headshot || "")),
    experience: firstFilledValue(...sources.map((row) => row.experience || "")),
    bio: firstFilledValue(...sources.map((row) => row.bio || "")),
    teamId: firstFilledValue(...sources.map((row) => row.teamId || "")),
    teamName: firstFilledValue(...sources.map((row) => row.teamName || "")),
    shortLabel: firstFilledValue(...sources.map((row) => row.shortLabel || "")),
    playerMeta: firstFilledValue(...sources.map((row) => buildPlayerMetaLine(row)))
  };
}

function findMatchingPlayerProfile(players, { playerIds = [], names = [] } = {}) {
  const idSet = new Set(
    (playerIds || [])
      .map((value) => normalizeNumericEntityId(value))
      .filter(Boolean)
  );
  const slugSet = new Set(
    (names || [])
      .map((value) => slugify(value))
      .filter(Boolean)
  );

  let best = null;
  let bestScore = -1;

  for (const item of players || []) {
    const itemId = normalizeNumericEntityId(item.playerId || item.id || "");
    const candidateSlugs = [
      slugify(item.name || item.playerName || ""),
      slugify(item.shortName || "")
    ].filter(Boolean);

    let score = 0;
    if (itemId && idSet.has(itemId)) {
      score += 8;
    }
    if (candidateSlugs.some((slug) => slugSet.has(slug))) {
      score += 6;
    }
    if (item.headshot) {
      score += 2;
    }
    if (item.position) {
      score += 1;
    }
    if (item.teamName) {
      score += 1;
    }

    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : null;
}

function resolveTeamSnapshotForPlayer(sportGroup, candidates = []) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const safeId = normalizeNumericEntityId(candidate.teamId || candidate.id || "");
    const safeName = String(candidate.teamName || candidate.name || (candidate.nameSlug ? candidate.nameSlug.replace(/-/g, " ") : "") || "").trim();
    if (safeId) {
      const byId = collectTeamSnapshotFromState(sportGroup, { id: safeId, nameSlug: "" });
      if (byId) {
        return byId;
      }
    }
    if (safeName) {
      const byName = collectTeamSnapshotFromState(sportGroup, { id: "", nameSlug: slugify(safeName) });
      if (byName) {
        return byName;
      }
    }
  }
  return null;
}

function extractEspnTeamObject(payload) {
  const candidates = [
    payload?.team,
    payload?.sports?.[0]?.leagues?.[0]?.teams?.[0]?.team,
    payload?.sports?.[0]?.leagues?.[0]?.teams?.[0],
    payload?.league?.teams?.[0]?.team,
    payload?.league?.teams?.[0]
  ];
  return candidates.find((item) => item && typeof item === "object") || null;
}

function extractEspnStaffRows(teamPayload, rosterPayload) {
  const staff = [];
  const pushRow = (name, role) => {
    const safeName = String(name || "").trim();
    if (!safeName) {
      return;
    }
    const safeRole = String(role || "Staff").trim() || "Staff";
    const key = `${safeName.toLowerCase()}|${safeRole.toLowerCase()}`;
    if (staff.some((item) => item.key === key)) {
      return;
    }
    staff.push({ key, name: safeName, role: safeRole });
  };

  const coachBlocks = [
    ...(Array.isArray(rosterPayload?.coaches) ? rosterPayload.coaches : []),
    ...(Array.isArray(teamPayload?.coaches) ? teamPayload.coaches : [])
  ];
  coachBlocks.forEach((coach) => {
    pushRow(coach?.fullName || coach?.displayName, coach?.position || coach?.title || "Coach");
  });

  const staffBlocks = [
    ...(Array.isArray(rosterPayload?.staff) ? rosterPayload.staff : []),
    ...(Array.isArray(teamPayload?.staff) ? teamPayload.staff : [])
  ];
  staffBlocks.forEach((item) => {
    pushRow(item?.fullName || item?.displayName || item?.name, item?.position || item?.jobTitle || "Staff");
  });

  return staff.slice(0, 24);
}

async function fetchEspnTeamRealtimeBundle(sportGroup, teamId, leagueKeys = []) {
  const safeTeamId = String(teamId || "");
  if (!safeTeamId) {
    return null;
  }

  const feeds = getCandidateFeedsForSport(sportGroup, leagueKeys);
  for (const feedPath of feeds) {
    const [teamRes, rosterRes] = await Promise.allSettled([
      cachedJson(`${ESPN_BASE}/${feedPath}/teams/${encodeURIComponent(safeTeamId)}`, 90000),
      cachedJson(`${ESPN_BASE}/${feedPath}/teams/${encodeURIComponent(safeTeamId)}/roster`, 90000)
    ]);

    if (teamRes.status !== "fulfilled" && rosterRes.status !== "fulfilled") {
      continue;
    }

    const teamPayload = teamRes.status === "fulfilled" ? teamRes.value : null;
    const rosterPayload = rosterRes.status === "fulfilled" ? rosterRes.value : null;
    const teamObject = extractEspnTeamObject(teamPayload) || extractEspnTeamObject(rosterPayload) || null;
    const players = dedupePlayerRows(flattenEspnRosterAthletes(rosterPayload || {}).map((item) => normalizeEspnPlayerRow(item)));
    const staff = extractEspnStaffRows(teamPayload, rosterPayload);

    return {
      feedPath,
      team: teamObject,
      players,
      staff
    };
  }

  return null;
}

async function fetchSportsDbTeamRealtimeBundle(teamName = "", teamId = "") {
  const safeName = String(teamName || "").trim();
  const safeTeamId = String(teamId || "").trim();
  let team = null;

  if (safeTeamId) {
    try {
      const byId = await cachedJson(`${SPORTSDB_BASE}/lookupteam.php?id=${encodeURIComponent(safeTeamId)}`, 120000);
      team = Array.isArray(byId?.teams) ? byId.teams[0] : null;
    } catch (_error) {
      team = null;
    }
  }

  if (!team && safeName) {
    try {
      const byName = await cachedJson(`${SPORTSDB_BASE}/searchteams.php?t=${encodeURIComponent(safeName)}`, 120000);
      team = Array.isArray(byName?.teams) ? byName.teams[0] : null;
    } catch (_error) {
      team = null;
    }
  }

  if (!team) {
    return null;
  }

  let players = [];
  try {
    const playersData = await cachedJson(`${SPORTSDB_BASE}/lookup_all_players.php?id=${encodeURIComponent(team.idTeam)}`, 120000);
    players = dedupePlayerRows(
      (Array.isArray(playersData?.player) ? playersData.player : []).map((player) => ({
        playerId: String(player.idPlayer || ""),
        name: player.strPlayer || "Player",
        shortName: player.strPlayer || "",
        position: player.strPosition || "",
        jersey: player.strNumber || "",
        age: player.dateBorn ? String(Math.max(0, new Date().getFullYear() - new Date(player.dateBorn).getFullYear())) : "",
        height: player.strHeight || "",
        weight: player.strWeight || "",
        country: player.strNationality || "",
        headshot: player.strCutout || player.strThumb || player.strRender || "",
        experience: ""
      }))
    );
  } catch (_error) {
    players = [];
  }

  const staff = [];
  if (team.strManager) {
    staff.push({ key: `manager:${team.strManager}`, name: team.strManager, role: "Manager" });
  }
  if (team.strCoach) {
    staff.push({ key: `coach:${team.strCoach}`, name: team.strCoach, role: "Coach" });
  }

  return { team, players: players.slice(0, 80), staff };
}

function renderTeamPlayersGrid(players, sportGroup, teamMeta = {}) {
  if (!players.length) {
    return '<div class="message-box">Full player list will appear when the roster feed is available.</div>';
  }

  return `
    <div class="league-player-grid">
      ${players
        .map(
          (player) => `
            <article class="lineup-item">
              <div style="display:flex;align-items:center;gap:10px;">
                ${
                  player.headshot
                    ? `<span class="entity-link-btn player-avatar-link" role="link" tabindex="0" data-player-route="${escapeHtml(routeForPlayer({
                        sportGroup,
                        playerId: normalizeNumericEntityId(player.playerId || player.id || ""),
                        playerName: player.name,
                        teamId: teamMeta.teamId || "",
                        teamName: teamMeta.teamName || ""
                      }))}" title="${escapeHtml(`Open ${player.name} player page`)}"><img src="${escapeHtml(player.headshot)}" alt="${escapeHtml(player.name)}" loading="lazy" onerror="this.style.display='none'" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:1px solid var(--line)"></span>`
                    : '<span class="league-team-fallback">PLR</span>'
                }
                <div style="min-width:0;">
                  ${renderPlayerNameControl({
                    sportGroup,
                    playerId: player.playerId || player.id || "",
                    playerName: player.name,
                    teamId: teamMeta.teamId || "",
                    teamName: teamMeta.teamName || ""
                  })}
                  ${
                    player.shortName && player.shortName !== player.name
                      ? `<div class="subtle" style="font-size:11px;">${escapeHtml(player.shortName)}</div>`
                      : ""
                  }
                </div>
              </div>
              <div class="subtle" style="margin-top:6px;font-size:12px;">
                ${escapeHtml(buildPlayerMetaLine(player) || "Profile details are updating.")}
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderTeamStaffGrid(staffRows) {
  if (!staffRows.length) {
    return '<div class="message-box">Staff details are not available for this team right now.</div>';
  }
  return `
    <div class="match-info-grid">
      ${staffRows
        .map(
          (item) => `
            <article class="info-card">
              <span>${escapeHtml(item.role || "Staff")}</span>
              <strong>${escapeHtml(item.name || "Unknown")}</strong>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

async function renderTeamPage(route) {
  const main = qs("#main");
  if (!main) {
    return;
  }

  const sportGroup = SPORT_GROUPS[route.sport] ? route.sport : "football";
  const token = parseEntityRouteToken(route.teamToken);
  const snapshot = collectTeamSnapshotFromState(sportGroup, token);

  if (!snapshot) {
    renderNotFoundPage();
    return;
  }

  main.innerHTML = '<div class="message-box">Loading team profile, players, staff, and realtime match context...</div>';

  const [espnBundleResult, sportsDbBundleResult] = await Promise.allSettled([
    fetchEspnTeamRealtimeBundle(sportGroup, snapshot.teamId, [...snapshot.leagueKeys]),
    fetchSportsDbTeamRealtimeBundle(snapshot.teamName, snapshot.teamId)
  ]);

  const espnBundle = espnBundleResult.status === "fulfilled" ? espnBundleResult.value : null;
  const sportsDbBundle = sportsDbBundleResult.status === "fulfilled" ? sportsDbBundleResult.value : null;

  const espnTeam = espnBundle?.team || {};
  const sdbTeam = sportsDbBundle?.team || {};
  const teamName = snapshot.teamName || espnTeam.displayName || sdbTeam.strTeam || "Team";
  const teamId = snapshot.teamId || String(espnTeam.id || sdbTeam.idTeam || "");
  const teamLogo =
    snapshot.teamLogo ||
    espnTeam.logo ||
    espnTeam.logos?.[0]?.href ||
    sdbTeam.strBadge ||
    sdbTeam.strLogo ||
    "";
  const teamAbbr = snapshot.teamAbbr || espnTeam.abbreviation || sdbTeam.strTeamShort || "";

  const liveMatches = snapshot.matches.filter((item) => item.status === "live");
  const upcomingMatches = snapshot.matches.filter((item) => item.status === "upcoming");
  const finalMatches = snapshot.matches.filter((item) => item.status === "final").sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  const nextKickoff = upcomingMatches.length ? formatDateTime(upcomingMatches[0].date) : "No scheduled kickoff";

  const players = dedupePlayerRows([
    ...(espnBundle?.players || []),
    ...(sportsDbBundle?.players || [])
  ]).slice(0, 120);
  const staffRows = dedupePlayerRows([
    ...(espnBundle?.staff || []),
    ...(sportsDbBundle?.staff || [])
  ]).map((item) => ({
    name: item.name || item.playerName || "Staff",
    role: item.role || "Staff"
  }));

  const venue = espnTeam.venue?.fullName || sdbTeam.strStadium || Array.from(snapshot.venues)[0] || "Venue TBC";
  const region = sdbTeam.strCountry || espnTeam.location || LEAGUE_REGIONS[Array.from(snapshot.leagueKeys)[0]] || "International";
  const founded = espnTeam.founded || sdbTeam.intFormedYear || "Unknown";
  const website = sdbTeam.strWebsite ? `https://${String(sdbTeam.strWebsite).replace(/^https?:\/\//i, "")}` : "";
  const description = sdbTeam.strDescriptionEN || espnTeam.description || "";

  main.innerHTML = `
    <div class="detail-page">
      <section class="detail-hero auto-bg-surface" ${buildAutoBackgroundAttrs({
        sportGroup,
        leagueKey: Array.from(snapshot.leagueKeys)[0] || "",
        fit: "cover",
        position: "center",
        strength: 0.24
      })}>
        <div class="detail-head">
          <div>
            <h1>${escapeHtml(teamName)}</h1>
            <p class="subtle">${escapeHtml(SPORT_GROUPS[sportGroup]?.label || sportGroup)} team profile with full squad, staff, and realtime match context.</p>
          </div>
          <div class="detail-head-actions">
            ${teamLogo ? `<img class="team-head-logo" src="${escapeHtml(teamLogo)}" alt="${escapeHtml(teamName)}" loading="lazy" onerror="this.style.display='none'">` : ""}
            <span class="badge-live">TEAM</span>
          </div>
        </div>
        <div class="hero-stat-grid">
          <div class="stat-box"><strong>${snapshot.live}</strong><span>Live Matches</span></div>
          <div class="stat-box"><strong>${snapshot.upcoming}</strong><span>Upcoming</span></div>
          <div class="stat-box"><strong>${snapshot.final}</strong><span>Final Results</span></div>
          <div class="stat-box"><strong>${players.length}</strong><span>Players</span></div>
        </div>
        <p class="subtle">Next kickoff: ${escapeHtml(nextKickoff)}</p>
      </section>

      <section class="panel">
        <h2>Team Information</h2>
        <div class="match-info-grid">
          <article class="info-card"><span>Team</span><strong>${escapeHtml(teamName)}</strong></article>
          <article class="info-card"><span>Abbreviation</span><strong>${escapeHtml(teamAbbr || "N/A")}</strong></article>
          <article class="info-card"><span>Region</span><strong>${escapeHtml(region)}</strong></article>
          <article class="info-card"><span>Founded</span><strong>${escapeHtml(String(founded))}</strong></article>
          <article class="info-card"><span>Venue</span><strong>${escapeHtml(venue)}</strong></article>
          <article class="info-card"><span>Team ID</span><strong>${escapeHtml(teamId || "N/A")}</strong></article>
        </div>
        ${
          website
            ? `<p style="margin-top:10px;"><a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">Official website</a></p>`
            : ""
        }
        ${
          description
            ? `<p class="subtle" style="margin-top:10px;">${escapeHtml(description.slice(0, 600))}</p>`
            : ""
        }
      </section>

      <section class="section">
        <div class="section-head"><h2>Live Matches</h2><p>Active matches involving ${escapeHtml(teamName)}.</p></div>
        ${renderMatchGrid(liveMatches, "No live matches for this team right now.")}
      </section>

      <section class="section">
        <div class="section-head"><h2>Upcoming Matches</h2><p>Scheduled fixtures for ${escapeHtml(teamName)}.</p></div>
        ${renderMatchGrid(upcomingMatches, "No upcoming matches are scheduled for this team.")}
      </section>

      <section class="section">
        <div class="section-head"><h2>Latest Results</h2><p>Recent final matches involving ${escapeHtml(teamName)}.</p></div>
        ${renderMatchGrid(finalMatches.slice(0, 16), "No final results available yet for this team.")}
      </section>

      <section class="section">
        <div class="section-head"><h2>Full Squad</h2><p>Player list with profile links.</p></div>
        ${renderTeamPlayersGrid(players, sportGroup, { teamId, teamName })}
      </section>

      <section class="section">
        <div class="section-head"><h2>Staff</h2><p>Coaching and team staff profiles.</p></div>
        ${renderTeamStaffGrid(staffRows)}
      </section>
    </div>
  `;

  setSeo({
    title: `${teamName} Team Profile | LiveScoreFree`,
    description: `${teamName} team page with realtime fixtures, full player list, staff details, venue info, and recent results.`,
    keywords: [`${teamName} team`, `${teamName} players`, `${teamName} live score`, "team squad", "team staff"],
    path: routeForTeam({ sportGroup, teamId, teamName }),
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SportsTeam",
      name: teamName,
      sport: SPORT_GROUPS[sportGroup]?.label || sportGroup,
      url: `${SEO_BASE.origin}${routeForTeam({ sportGroup, teamId, teamName })}`
    }
  });
}

async function fetchEspnAthleteRealtimeProfile(sportGroup, athleteId, teamToken = "") {
  const safeId = String(athleteId || "");
  if (!safeId) {
    return null;
  }
  const token = parseEntityRouteToken(teamToken);
  const teamId = token.id || "";
  const feeds = getCandidateFeedsForSport(sportGroup);

  for (const feedPath of feeds) {
    const urls = [];
    if (teamId) {
      urls.push(`${ESPN_BASE}/${feedPath}/teams/${encodeURIComponent(teamId)}/athletes/${encodeURIComponent(safeId)}`);
    }
    urls.push(`${ESPN_BASE}/${feedPath}/athletes/${encodeURIComponent(safeId)}`);

    for (const url of urls) {
      try {
        const data = await cachedJson(url, 120000);
        const athlete = data?.athlete || data;
        if (athlete && (athlete.displayName || athlete.fullName || athlete.id)) {
          return {
            athlete,
            team: data?.team || athlete?.team || null
          };
        }
      } catch (_error) {
        // try next URL
      }
    }
  }

  return null;
}

async function fetchSportsDbPlayerRealtimeProfile(playerToken, sportGroup) {
  const token = parseEntityRouteToken(playerToken);
  let player = null;

  if (token.id) {
    try {
      const byId = await cachedJson(`${SPORTSDB_BASE}/lookupplayer.php?id=${encodeURIComponent(token.id)}`, 120000);
      player = Array.isArray(byId?.players) ? byId.players[0] : null;
    } catch (_error) {
      player = null;
    }
  }

  if (!player && token.nameSlug) {
    const searchName = token.nameSlug.replace(/-/g, " ");
    try {
      const byName = await cachedJson(`${SPORTSDB_BASE}/searchplayers.php?p=${encodeURIComponent(searchName)}`, 120000);
      const list = Array.isArray(byName?.player) ? byName.player : [];
      const wantedSport = SPORTSDB_SPORTS[sportGroup] || "";
      player = list.find((item) => !wantedSport || String(item.strSport || "").toLowerCase() === wantedSport.toLowerCase()) || list[0] || null;
    } catch (_error) {
      player = null;
    }
  }

  return player;
}

async function renderPlayerPage(route) {
  const main = qs("#main");
  if (!main) {
    return;
  }

  const sportGroup = SPORT_GROUPS[route.sport] ? route.sport : "football";
  const playerToken = parseEntityRouteToken(route.playerToken);
  const playerId = playerToken.id || "";

  main.innerHTML = '<div class="message-box">Loading player profile and realtime team context...</div>';

  const [espnProfileResult, sportsDbProfileResult] = await Promise.allSettled([
    fetchEspnAthleteRealtimeProfile(sportGroup, playerId, route.teamToken || ""),
    fetchSportsDbPlayerRealtimeProfile(route.playerToken, sportGroup)
  ]);

  const espnProfile = espnProfileResult.status === "fulfilled" ? espnProfileResult.value : null;
  const sdbPlayer = sportsDbProfileResult.status === "fulfilled" ? sportsDbProfileResult.value : null;
  const espnPlayerRow = normalizeEspnAthleteProfileRow(espnProfile);
  const sportsDbPlayerRow = normalizeSportsDbPlayerRow(sdbPlayer);
  const athlete = espnProfile?.athlete || {};

  const snapshot = resolveTeamSnapshotForPlayer(sportGroup, [
    route.teamToken ? parseEntityRouteToken(route.teamToken) : null,
    { teamId: espnPlayerRow.teamId, teamName: espnPlayerRow.teamName },
    { teamId: sportsDbPlayerRow.teamId, teamName: sportsDbPlayerRow.teamName }
  ]);

  const [espnBundleResult, sportsDbBundleResult] = snapshot
    ? await Promise.allSettled([
        fetchEspnTeamRealtimeBundle(sportGroup, snapshot.teamId, [...snapshot.leagueKeys]),
        fetchSportsDbTeamRealtimeBundle(snapshot.teamName, snapshot.teamId)
      ])
    : [{ status: "fulfilled", value: null }, { status: "fulfilled", value: null }];

  const espnBundle = espnBundleResult.status === "fulfilled" ? espnBundleResult.value : null;
  const sportsDbBundle = sportsDbBundleResult.status === "fulfilled" ? sportsDbBundleResult.value : null;
  const rosterPlayer = findMatchingPlayerProfile(
    dedupePlayerRows([
      ...(espnBundle?.players || []),
      ...(sportsDbBundle?.players || [])
    ]),
    {
      playerIds: [
        playerId,
        espnPlayerRow.playerId,
        sportsDbPlayerRow.playerId
      ],
      names: [
        espnPlayerRow.name,
        espnPlayerRow.shortName,
        sportsDbPlayerRow.name,
        playerToken.nameSlug?.replace(/-/g, " ")
      ]
    }
  );
  const mergedPlayer = mergePlayerProfileRows(
    rosterPlayer,
    espnPlayerRow,
    sportsDbPlayerRow,
    {
      name: playerToken.nameSlug?.replace(/-/g, " ") || "",
      playerId
    }
  );

  const playerName = mergedPlayer.name || "Player";
  const teamName = mergedPlayer.teamName || snapshot?.teamName || "";
  const teamId = mergedPlayer.teamId || snapshot?.teamId || "";
  const teamRoute = teamName ? routeForTeam({ sportGroup, teamId, teamName }) : "";
  const headshot = mergedPlayer.headshot || "";
  const position = mergedPlayer.position || "";
  const jersey = mergedPlayer.jersey || "";
  const age = mergedPlayer.age || "";
  const height = mergedPlayer.height || "";
  const weight = mergedPlayer.weight || "";
  const country = mergedPlayer.country || "";
  const experience = mergedPlayer.experience || "";
  const bio = mergedPlayer.bio || "";
  const playerDisplayId = mergedPlayer.playerId || playerId || sdbPlayer?.idPlayer || "N/A";
  const profileMeta = mergedPlayer.playerMeta || "";
  const relatedMatches = snapshot?.matches?.length
    ? snapshot.matches.slice(0, 12)
    : teamName
      ? state.matches.filter((match) => match.sportGroup === sportGroup && (match.homeName === teamName || match.awayName === teamName)).slice(0, 12)
      : [];

  main.innerHTML = `
    <div class="detail-page">
      <section class="detail-hero auto-bg-surface" ${buildAutoBackgroundAttrs({
        sportGroup,
        leagueKey: "",
        fit: "cover",
        position: "center",
        strength: 0.22
      })}>
        <div class="detail-head">
          <div>
            <h1>${escapeHtml(playerName)}</h1>
            <p class="subtle">${escapeHtml(SPORT_GROUPS[sportGroup]?.label || sportGroup)} player profile with realtime team context and auto-updating roster details.</p>
          </div>
          <div class="detail-head-actions">
            ${
              headshot
                ? `<img class="player-profile-headshot" src="${escapeHtml(headshot)}" alt="${escapeHtml(playerName)}" loading="lazy" onerror="this.style.display='none'">`
                : `<span class="player-profile-fallback">${escapeHtml((playerName || "PL").split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase())}</span>`
            }
            <span class="badge-live">PLAYER</span>
          </div>
        </div>
        <div class="hero-stat-grid">
          <div class="stat-box"><strong>${escapeHtml(position || "N/A")}</strong><span>Position</span></div>
          <div class="stat-box"><strong>${escapeHtml(jersey ? `#${jersey}` : "N/A")}</strong><span>Jersey</span></div>
          <div class="stat-box"><strong>${escapeHtml(String(age || "N/A"))}</strong><span>Age</span></div>
          <div class="stat-box"><strong>${escapeHtml(country || "N/A")}</strong><span>Country</span></div>
        </div>
        ${
          profileMeta
            ? `<p class="subtle" style="margin-top:10px;">${escapeHtml(profileMeta)}</p>`
            : ""
        }
      </section>

      <section class="panel">
        <h2>Player Information</h2>
        <div class="match-info-grid">
          <article class="info-card"><span>Name</span><strong>${escapeHtml(playerName)}</strong></article>
          <article class="info-card"><span>Position</span><strong>${escapeHtml(position || "N/A")}</strong></article>
          <article class="info-card"><span>Height</span><strong>${escapeHtml(height || "N/A")}</strong></article>
          <article class="info-card"><span>Weight</span><strong>${escapeHtml(weight || "N/A")}</strong></article>
          <article class="info-card"><span>Experience</span><strong>${escapeHtml(experience || "N/A")}</strong></article>
          <article class="info-card"><span>Player ID</span><strong>${escapeHtml(playerDisplayId)}</strong></article>
        </div>
        ${
          teamRoute
            ? `<p style="margin-top:10px;">Team: <button class="inline-entity-link entity-link-btn" type="button" data-team-route="${escapeHtml(teamRoute)}">${escapeHtml(teamName)}</button></p>`
            : ""
        }
        ${
          bio
            ? `<p class="subtle" style="margin-top:10px;">${escapeHtml(String(bio).slice(0, 700))}</p>`
            : ""
        }
      </section>

      <section class="section">
        <div class="section-head"><h2>Team Match Context</h2><p>Recent team matches connected to this player context.</p></div>
        ${renderMatchGrid(relatedMatches, "No current team match context available for this player.")}
      </section>
    </div>
  `;

  setSeo({
    title: `${playerName} Player Profile | LiveScoreFree`,
    description: `${playerName} player page with position, team context, and match links on LiveScoreFree.`,
    keywords: [`${playerName} player`, `${playerName} stats`, `${playerName} live score`, "player profile"],
    path: routeForPlayer({ sportGroup, playerId: normalizeNumericEntityId(playerDisplayId), playerName, teamId, teamName }),
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: playerName,
      url: `${SEO_BASE.origin}${routeForPlayer({ sportGroup, playerId: normalizeNumericEntityId(playerDisplayId), playerName, teamId, teamName })}`
    }
  });
}

function renderStatsRows(summary) {
  const teams = summary.boxscore?.teams || [];
  if (teams.length !== 2) {
    return '<div class="message-box">Match statistics are not available for this event.</div>';
  }

  const homeStats = teams[0].statistics || [];
  const awayStats = teams[1].statistics || [];
  const rows = [];

  for (let index = 0; index < Math.min(10, homeStats.length, awayStats.length); index += 1) {
    const left = homeStats[index];
    const right = awayStats[index];
    const leftNumber = parseNumeric(left.displayValue);
    const rightNumber = parseNumeric(right.displayValue);
    const total = leftNumber + rightNumber || 1;

    const leftPercent = Math.max(3, Math.round((leftNumber / total) * 100));
    const rightPercent = Math.max(3, 100 - leftPercent);

    rows.push(`
      <div class="stat-row">
        <strong>${escapeHtml(left.displayValue)}</strong>
        <div class="stat-bar"><div class="stat-fill-home" style="width:${leftPercent}%"></div></div>
        <span class="subtle">${escapeHtml(left.label || left.name || "Stat")}</span>
        <div class="stat-bar"><div class="stat-fill-away" style="width:${rightPercent}%"></div></div>
        <strong>${escapeHtml(right.displayValue)}</strong>
      </div>
    `);
  }

  return rows.length ? `<div class="stats-list">${rows.join("")}</div>` : '<div class="message-box">No comparable stat rows found.</div>';
}

function renderCommentaryRows(summary) {
  const plays = summary.plays || [];
  if (!plays.length) {
    return '<div class="message-box">Commentary is not available for this match.</div>';
  }

  const rows = plays
    .slice(-18)
    .reverse()
    .map(
      (play, index) => `
        <article class="commentary-item" style="animation-delay:${index * 18}ms">
          <strong>${escapeHtml(play.clock?.displayValue || play.period?.displayValue || "Update")}</strong>
          <p>${escapeHtml(play.text || play.type?.text || "Live match update")}</p>
        </article>
      `
    )
    .join("");

  return `<div class="commentary-list">${rows}</div>`;
}

function renderTimelineRows(summary) {
  const source = summary.scoringPlays?.length ? summary.scoringPlays : summary.plays || [];
  if (!source.length) {
    return '<div class="message-box">Timeline events are not available yet.</div>';
  }

  const rows = source
    .slice(-14)
    .reverse()
    .map(
      (item, index) => `
        <article class="timeline-item" style="animation-delay:${index * 24}ms">
          <strong>${escapeHtml(item.clock?.displayValue || (item.period?.number ? `Period ${item.period.number}` : "Timeline"))}</strong>
          <p>${escapeHtml(item.text || item.shortText || item.type?.text || "Event update")}</p>
        </article>
      `
    )
    .join("");

  return `<div class="timeline-list">${rows}</div>`;
}

function buildPlayerMetaLine(player) {
  const parts = [];
  if (player.position) {
    parts.push(player.position);
  }
  if (player.jersey) {
    parts.push(`#${player.jersey}`);
  }
  if (player.age) {
    parts.push(`${player.age}y`);
  }
  if (player.height) {
    parts.push(player.height);
  }
  if (player.weight) {
    parts.push(player.weight);
  }
  if (player.country) {
    parts.push(player.country);
  }
  if (player.experience) {
    parts.push(`EXP ${player.experience}`);
  }
  return parts.join(" | ");
}

function mapEspnRosterEntries(roster, rosterDetailsByTeam = {}) {
  const teamId = String(roster?.team?.id || "");
  const detailPlayers = rosterDetailsByTeam[teamId]?.players || [];
  const detailMap = new Map(detailPlayers.map((player) => [String(player.id || ""), player]));

  const entries = (roster.entries || []).map((entry) => {
    const athlete = entry.athlete || {};
    const detail = detailMap.get(String(athlete.id || "")) || {};
    return {
      id: athlete.id || detail.id || `${athlete.displayName || "player"}-${entry.jersey || ""}`,
      name: athlete.displayName || detail.displayName || detail.fullName || "Player",
      shortName: athlete.shortName || detail.shortName || "",
      position: entry.position?.abbreviation || detail.position?.abbreviation || detail.position?.displayName || "",
      jersey: entry.jersey || detail.jersey || "",
      age: athlete.age || detail.age || "",
      height: athlete.displayHeight || detail.displayHeight || "",
      weight: athlete.displayWeight || detail.displayWeight || "",
      country: athlete.birthPlace?.country || detail.birthPlace?.country || detail.nationality || "",
      headshot: athlete.headshot?.href || detail.headshot?.href || detail.image?.href || "",
      starter: entry.starter === true,
      experience: detail.experience?.displayValue || ""
    };
  });

  const existingIds = new Set(entries.map((item) => String(item.id)));
  for (const detail of detailPlayers) {
    const id = String(detail.id || "");
    if (!id || existingIds.has(id)) {
      continue;
    }
    entries.push({
      id,
      name: detail.displayName || detail.fullName || "Player",
      shortName: detail.shortName || "",
      position: detail.position?.abbreviation || detail.position?.displayName || "",
      jersey: detail.jersey || "",
      age: detail.age || "",
      height: detail.displayHeight || "",
      weight: detail.displayWeight || "",
      country: detail.birthPlace?.country || detail.nationality || "",
      headshot: detail.headshot?.href || detail.image?.href || "",
      starter: false,
      experience: detail.experience?.displayValue || ""
    });
  }

  return entries.slice(0, 28);
}

function renderLineupRows(summary, rosterDetailsByTeam = {}, match = null) {
  const rosters = summary.rosters || [];
  if (!rosters.length) {
    return '<div class="message-box">Team lineups are not published for this match.</div>';
  }

  return `
    <div class="layout-split">
      ${rosters
        .slice(0, 2)
        .map(
          (roster) => `
            <div class="panel">
              <h2>
                ${renderTeamNameControl({
                  sportGroup: match?.sportGroup || "",
                  teamId: String(roster.team?.id || ""),
                  teamName: roster.team?.displayName || roster.team?.shortDisplayName || "Team lineup",
                  teamAbbr: roster.team?.abbreviation || "",
                  teamLogo: roster.team?.logo || roster.team?.logos?.[0]?.href || "",
                  fallbackIcon: "TM",
                  className: "inline-entity-link team-heading-link"
                })}
              </h2>
              <p class="subtle">Realtime player and lineup details.</p>
              <div class="lineup-list">
                ${mapEspnRosterEntries(roster, rosterDetailsByTeam)
                  .map(
                    (entry, index) => `
                      <div class="lineup-item" style="animation-delay:${index * 10}ms">
                        <div style="display:flex;align-items:center;gap:10px;">
                          ${
                            entry.headshot
                              ? `<span class="entity-link-btn player-avatar-link" role="link" tabindex="0" data-player-route="${escapeHtml(routeForPlayer({
                                  sportGroup: match?.sportGroup || "",
                                  playerId: normalizeNumericEntityId(entry.id || ""),
                                  playerName: entry.name || "Player",
                                  teamId: String(roster.team?.id || ""),
                                  teamName: roster.team?.displayName || roster.team?.shortDisplayName || ""
                                }))}" title="${escapeHtml(`Open ${(entry.name || "Player")} player page`)}"><img src="${escapeHtml(entry.headshot)}" alt="${escapeHtml(entry.name)}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:1px solid var(--line)" loading="lazy" onerror="this.style.display='none'"></span>`
                              : '<span style="width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--surface-soft);font-size:11px;font-weight:700;">PLR</span>'
                          }
                          <div style="min-width:0;flex:1;">
                            ${renderPlayerNameControl({
                              sportGroup: match?.sportGroup || "",
                              playerId: entry.id || "",
                              playerName: entry.name || "Player",
                              teamId: String(roster.team?.id || ""),
                              teamName: roster.team?.displayName || roster.team?.shortDisplayName || ""
                            })}
                            ${
                              entry.shortName
                                ? `<div class="subtle" style="font-size:11px;">${escapeHtml(entry.shortName)}</div>`
                                : ""
                            }
                          </div>
                          ${
                            entry.starter
                              ? '<span class="badge-live" style="font-size:10px;">STARTER</span>'
                              : ""
                          }
                        </div>
                        ${
                          buildPlayerMetaLine(entry)
                            ? `<div class="subtle" style="margin-top:6px;font-size:12px;">${escapeHtml(buildPlayerMetaLine(entry))}</div>`
                            : '<div class="subtle" style="margin-top:6px;font-size:12px;">Profile details unavailable for this player.</div>'
                        }
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function flattenEspnRosterAthletes(data) {
  const players = [];
  const blocks = Array.isArray(data?.athletes) ? data.athletes : [];
  for (const block of blocks) {
    if (Array.isArray(block?.items)) {
      players.push(...block.items);
      continue;
    }
    if (block && typeof block === "object" && block.id) {
      players.push(block);
    }
  }
  return players;
}

async function fetchEspnTeamRosterDetails(match, summary) {
  const competitors = summary?.header?.competitions?.[0]?.competitors || [];
  const teamDetails = {};

  await Promise.allSettled(
    competitors.map(async (competitor) => {
      const teamId = String(competitor?.team?.id || "");
      if (!teamId) {
        return;
      }
      const url = `${ESPN_BASE}/${match.feedPath}/teams/${encodeURIComponent(teamId)}/roster`;
      const data = await cachedJson(url, 120000);
      teamDetails[teamId] = {
        teamName: competitor.team?.displayName || data?.team?.displayName || "Team",
        players: flattenEspnRosterAthletes(data)
      };
    })
  );

  return teamDetails;
}

async function fetchSportsDbMatchBundle(match) {
  const eventId = String(match.sourceId || match.id || "").replace(/^sdb-/, "");
  if (!eventId) {
    return null;
  }

  const [eventData, statsData, timelineData, lineupData] = await Promise.allSettled([
    cachedJson(`${SPORTSDB_BASE}/lookupevent.php?id=${encodeURIComponent(eventId)}`, 15000),
    cachedJson(`${SPORTSDB_BASE}/lookupeventstats.php?id=${encodeURIComponent(eventId)}`, 15000),
    cachedJson(`${SPORTSDB_BASE}/lookuptimeline.php?id=${encodeURIComponent(eventId)}`, 15000),
    cachedJson(`${SPORTSDB_BASE}/lookuplineup.php?id=${encodeURIComponent(eventId)}`, 15000)
  ]);

  return {
    event:
      eventData.status === "fulfilled"
        ? (Array.isArray(eventData.value?.events) ? eventData.value.events[0] : Array.isArray(eventData.value?.event) ? eventData.value.event[0] : null)
        : null,
    stats: statsData.status === "fulfilled" ? (statsData.value?.eventstats || statsData.value?.stats || []) : [],
    timeline: timelineData.status === "fulfilled" ? (timelineData.value?.timeline || []) : [],
    lineup: lineupData.status === "fulfilled" ? (lineupData.value?.lineup || []) : []
  };
}

function renderSportsDbStatsRows(stats) {
  if (!stats.length) {
    return '<div class="message-box">Match statistics are not available for this event.</div>';
  }
  const rows = stats
    .slice(0, 12)
    .map((item) => {
      const left = parseNumeric(item.intHome);
      const right = parseNumeric(item.intAway);
      const total = left + right || 1;
      const leftPercent = Math.max(3, Math.round((left / total) * 100));
      const rightPercent = Math.max(3, 100 - leftPercent);
      return `
      <div class="stat-row">
        <strong>${escapeHtml(item.intHome ?? "-")}</strong>
        <div class="stat-bar"><div class="stat-fill-home" style="width:${leftPercent}%"></div></div>
        <span class="subtle">${escapeHtml(item.strStat || "Stat")}</span>
        <div class="stat-bar"><div class="stat-fill-away" style="width:${rightPercent}%"></div></div>
        <strong>${escapeHtml(item.intAway ?? "-")}</strong>
      </div>`;
    })
    .join("");
  return `<div class="stats-list">${rows}</div>`;
}

function renderSportsDbTimelineRows(timeline) {
  if (!timeline.length) {
    return '<div class="message-box">Timeline events are not available yet.</div>';
  }
  const rows = timeline
    .slice(-18)
    .reverse()
    .map(
      (item, index) => `
      <article class="timeline-item" style="animation-delay:${index * 24}ms">
        <strong>${escapeHtml(item.intTime ? `${item.intTime}'` : item.strTimeline || "Timeline")}</strong>
        <p>${escapeHtml(item.strEvent || item.strTimeline || "Event update")}${item.strPlayer ? ` - ${escapeHtml(item.strPlayer)}` : ""}</p>
      </article>`
    )
    .join("");
  return `<div class="timeline-list">${rows}</div>`;
}

function renderSportsDbCommentaryRows(timeline) {
  if (!timeline.length) {
    return '<div class="message-box">Commentary is not available for this match.</div>';
  }
  const rows = timeline
    .slice(-20)
    .reverse()
    .map(
      (item, index) => `
      <article class="commentary-item" style="animation-delay:${index * 18}ms">
        <strong>${escapeHtml(item.intTime ? `${item.intTime}'` : item.strTimeline || "Update")}</strong>
        <p>${escapeHtml(item.strEvent || item.strTimeline || "Live update")}${item.strPlayer ? ` - ${escapeHtml(item.strPlayer)}` : ""}</p>
      </article>`
    )
    .join("");
  return `<div class="commentary-list">${rows}</div>`;
}

function renderSportsDbLineupRows(lineup, match = null) {
  if (!lineup.length) {
    return '<div class="message-box">Team lineups are not published for this match.</div>';
  }

  const grouped = new Map();
  for (const item of lineup) {
    const key = item.strTeam || item.strSide || "Team";
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(item);
  }

  return `
    <div class="layout-split">
      ${Array.from(grouped.entries())
        .slice(0, 2)
        .map(
          ([team, entries]) => `
            <div class="panel">
              <h2>
                ${renderTeamNameControl({
                  sportGroup: match?.sportGroup || "",
                  teamId: "",
                  teamName: team,
                  teamAbbr: team.slice(0, 3).toUpperCase(),
                  teamLogo: "",
                  fallbackIcon: "TM",
                  className: "inline-entity-link team-heading-link"
                })}
              </h2>
              <p class="subtle">Realtime player and lineup details.</p>
              <div class="lineup-list">
                ${entries
                  .slice(0, 28)
                  .map(
                    (entry, index) => `
                      <div class="lineup-item" style="animation-delay:${index * 10}ms">
                        <div style="display:flex;align-items:center;gap:10px;">
                          ${
                            entry.strCutout || entry.strRender || entry.strThumb
                              ? `<span class="entity-link-btn player-avatar-link" role="link" tabindex="0" data-player-route="${escapeHtml(routeForPlayer({
                                  sportGroup: match?.sportGroup || "",
                                  playerId: normalizeNumericEntityId(String(entry.idPlayer || "")),
                                  playerName: entry.strPlayer || "Player",
                                  teamName: team
                                }))}" title="${escapeHtml(`Open ${(entry.strPlayer || "Player")} player page`)}"><img src="${escapeHtml(entry.strCutout || entry.strRender || entry.strThumb)}" alt="${escapeHtml(entry.strPlayer || "Player")}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:1px solid var(--line)" loading="lazy" onerror="this.style.display='none'"></span>`
                              : '<span style="width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--surface-soft);font-size:11px;font-weight:700;">PLR</span>'
                          }
                          <div style="min-width:0;flex:1;">
                            ${renderPlayerNameControl({
                              sportGroup: match?.sportGroup || "",
                              playerId: String(entry.idPlayer || ""),
                              playerName: entry.strPlayer || "Player",
                              teamName: team
                            })}
                            ${
                              entry.strCutout || entry.strThumb
                                ? `<div class="subtle" style="font-size:11px;">Realtime profile available</div>`
                                : ""
                            }
                          </div>
                        </div>
                        <div class="subtle" style="margin-top:6px;font-size:12px;">
                          ${escapeHtml(
                            [
                              entry.strPosition || "",
                              entry.strNumber ? `#${entry.strNumber}` : "",
                              entry.strCountry || entry.strNationality || "",
                              entry.strStatus || ""
                            ]
                              .filter(Boolean)
                              .join(" | ") || "Profile details unavailable for this player."
                          )}
                        </div>
                      </div>`
                  )
                  .join("")}
              </div>
            </div>`
        )
        .join("")}
    </div>`;
}

function renderRealtimeSourceUpdates(match, summary, sportsDbBundle) {
  const sourceLabel = match.source === "sportsdb" ? "TheSportsDB realtime" : "ESPN realtime";
  let rows = "";

  if (match.source === "sportsdb") {
    const timeline = sportsDbBundle?.timeline || [];
    rows = timeline
      .slice(-10)
      .reverse()
      .map(
        (item, index) => `
          <article class="timeline-item" style="animation-delay:${index * 14}ms">
            <strong>${escapeHtml(item.intTime ? `${item.intTime}'` : "LIVE")}</strong>
            <p>${escapeHtml(item.strEvent || item.strTimeline || "Match update")} <span class="subtle">[${sourceLabel}]</span></p>
          </article>`
      )
      .join("");
  } else {
    const plays = summary?.plays || [];
    rows = plays
      .slice(-10)
      .reverse()
      .map(
        (play, index) => `
          <article class="timeline-item" style="animation-delay:${index * 14}ms">
            <strong>${escapeHtml(play.clock?.displayValue || "LIVE")}</strong>
            <p>${escapeHtml(play.text || play.type?.text || "Match update")} <span class="subtle">[${sourceLabel}]</span></p>
          </article>`
      )
      .join("");
  }

  if (!rows) {
    rows = '<div class="message-box">No realtime update entries are available from the current live feed.</div>';
  }

  return `
    <section class="panel">
      <h2>Realtime Source Updates</h2>
      <p class="subtle">${sourceLabel}</p>
      <div class="timeline-list">${rows}</div>
    </section>
  `;
}

function normalizeTeamToken(name) {
  return slugify(String(name || ""));
}

function hasNumericScore(value) {
  return /-?\d+/.test(String(value ?? ""));
}

function extractEspnStatPairs(summary) {
  const teams = summary?.boxscore?.teams || [];
  if (teams.length !== 2) {
    return [];
  }

  const homeStats = teams[0].statistics || [];
  const awayStats = teams[1].statistics || [];
  const pairs = [];

  for (let index = 0; index < Math.min(homeStats.length, awayStats.length); index += 1) {
    const home = homeStats[index];
    const away = awayStats[index];
    pairs.push({
      label: home.label || home.name || "Stat",
      homeDisplay: home.displayValue ?? "-",
      awayDisplay: away.displayValue ?? "-",
      homeValue: parseNumeric(home.displayValue),
      awayValue: parseNumeric(away.displayValue)
    });
  }

  return pairs;
}

function extractSportsDbStatPairs(sportsDbBundle) {
  const stats = sportsDbBundle?.stats || [];
  return stats.map((item) => ({
    label: item.strStat || "Stat",
    homeDisplay: item.intHome ?? "-",
    awayDisplay: item.intAway ?? "-",
    homeValue: parseNumeric(item.intHome),
    awayValue: parseNumeric(item.intAway)
  }));
}

function extractMatchStatPairs(match, summary, sportsDbBundle) {
  if (match.source === "sportsdb") {
    return extractSportsDbStatPairs(sportsDbBundle);
  }
  return extractEspnStatPairs(summary);
}

function findStatPair(statPairs, keywords) {
  return statPairs.find((item) => {
    const label = String(item.label || "").toLowerCase();
    return keywords.some((keyword) => label.includes(keyword));
  });
}

function buildHeroMetrics(statPairs) {
  const candidates = [
    { label: "Possession", keys: ["possession"] },
    { label: "Shots", keys: ["total shots", "shots"] },
    { label: "Shots On Target", keys: ["shots on target", "on target"] },
    { label: "Corners", keys: ["corner"] }
  ];

  const metrics = [];
  for (const candidate of candidates) {
    const pair = findStatPair(statPairs, candidate.keys);
    if (!pair) {
      continue;
    }
    metrics.push({
      label: candidate.label,
      homeDisplay: pair.homeDisplay,
      awayDisplay: pair.awayDisplay
    });
  }

  return metrics.slice(0, 4);
}

function renderHeroMetrics(metrics) {
  if (!metrics.length) {
    return '<div class="subtle">Live metrics will appear as the feed publishes stats.</div>';
  }

  return `
    <div class="hero-metrics">
      ${metrics
        .map(
          (metric) => `
            <article class="metric-pill">
              <p>${escapeHtml(metric.label)}</p>
              <strong>${escapeHtml(metric.homeDisplay)} - ${escapeHtml(metric.awayDisplay)}</strong>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function buildSimilarScoreboardMatches(match, limit = 8) {
  const currentKey = `${match.sportGroup}:${match.slug}`;
  const seen = new Set([currentKey]);
  const pool = [...state.matches, ...state.history];

  const ranked = pool
    .filter((item) => item && `${item.sportGroup}:${item.slug}` !== currentKey)
    .map((item) => {
      let score = 0;
      if (item.sportGroup === match.sportGroup) score += 30;
      if (item.leagueKey === match.leagueKey) score += 26;
      if (item.homeName === match.homeName || item.awayName === match.homeName) score += 18;
      if (item.homeName === match.awayName || item.awayName === match.awayName) score += 18;
      if (item.status === "live") score += 8;
      if (item.status === match.status) score += 6;
      score += Number(item.trendingScore || 0) * 0.02;
      return { item, score };
    })
    .sort((left, right) => right.score - left.score);

  const picks = [];
  for (const entry of ranked) {
    const key = `${entry.item.sportGroup}:${entry.item.slug}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    picks.push(entry.item);
    if (picks.length >= limit) {
      break;
    }
  }

  return picks;
}

function selectMatchInsightPairs(match, statPairs) {
  const preferenceMap = {
    football: [["possession"], ["shots on target", "on target"], ["total shots", "shots"], ["corner"], ["fouls"], ["yellow"]],
    baseball: [["runs"], ["hits"], ["errors"], ["strike"], ["walk"], ["left on base"]],
    hockey: [["shots on goal", "sog"], ["possession"], ["penalty"], ["faceoff"], ["hit"], ["power play"]],
    basketball: [["field goal", "fg"], ["three point", "3pt"], ["free throw", "ft"], ["rebounds"], ["assists"], ["turnovers"]],
    tennis: [["aces"], ["double faults"], ["1st serve"], ["break"], ["winners"], ["unforced"]],
    cricket: [["runs"], ["wickets"], ["overs"], ["boundaries"], ["economy"], ["strike rate"]],
    nfl: [["yards"], ["touchdown"], ["first down"], ["turnover"], ["penalt"], ["possession"]],
    rugby: [["tries"], ["penalt"], ["conversion"], ["possession"], ["metres"], ["tackle"]],
    mma: [["significant"], ["takedown"], ["control"], ["submission"], ["knockdown"], ["accuracy"]],
    f1: [["laps"], ["pit"], ["gap"], ["sector"], ["speed"], ["position"]],
    default: [["possession"], ["shots"], ["shots on target"], ["corner"], ["fouls"], ["assists"]]
  };

  const preferences = preferenceMap[match.sportGroup] || preferenceMap.default;
  const chosen = [];
  const used = new Set();

  for (const keywords of preferences) {
    const pair = findStatPair(statPairs, keywords);
    if (!pair) {
      continue;
    }
    const key = String(pair.label || "").toLowerCase();
    if (used.has(key)) {
      continue;
    }
    used.add(key);
    chosen.push(pair);
  }

  for (const pair of statPairs) {
    if (chosen.length >= 6) {
      break;
    }
    const key = String(pair.label || "").toLowerCase();
    if (used.has(key)) {
      continue;
    }
    used.add(key);
    chosen.push(pair);
  }

  return chosen.slice(0, 6);
}

function renderMatchInsightPanel({
  match,
  statPairs = [],
  infoItems = [],
  favoriteKey = "",
  isFavorite = false,
  reminderKey = "",
  hasReminder = false
}) {
  const sportLabel = match.sportLabel || SPORT_GROUPS[match.sportGroup]?.label || "Match";
  const insightPairs = selectMatchInsightPairs(match, statPairs);
  const homeLabel = match.homeAbbr || compactTeamLabel(match.homeName, match.homeAbbr);
  const awayLabel = match.awayAbbr || compactTeamLabel(match.awayName, match.awayAbbr);
  const syncLabel =
    match.status === "live"
      ? "Realtime auto-sync"
      : match.status === "upcoming"
        ? "Prematch auto-sync"
        : "Final published sync";

  const tableHtml = insightPairs.length
    ? `
      <div class="match-insight-table-wrap">
        <table class="match-insight-table">
          <thead>
            <tr>
              <th>${escapeHtml(homeLabel)}</th>
              <th>Metric</th>
              <th>${escapeHtml(awayLabel)}</th>
            </tr>
          </thead>
          <tbody>
            ${insightPairs
              .map(
                (pair) => `
                  <tr>
                    <td>${escapeHtml(pair.homeDisplay || "-")}</td>
                    <th>${escapeHtml(pair.label || "Stat")}</th>
                    <td>${escapeHtml(pair.awayDisplay || "-")}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
    : infoItems.length
      ? `
        <div class="match-insight-table-wrap">
          <table class="match-insight-table match-insight-table-info">
            <tbody>
              ${infoItems
                .slice(0, 5)
                .map(
                  (item) => `
                    <tr>
                      <th>${escapeHtml(item.label || "Info")}</th>
                      <td colspan="2">${escapeHtml(item.value || "Unknown")}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
      : '<div class="message-box">Match details will appear here as the live feed publishes sport data.</div>';

  return `
    <aside class="match-insight-panel auto-bg-surface" ${buildAutoBackgroundAttrs({
      sportGroup: match.sportGroup,
      leagueKey: match.leagueKey,
      fit: "contain",
      position: "center",
      strength: 0.1
    })}>
      <div class="match-insight-head">
        <div class="match-insight-title">
          <img src="${escapeHtml(getSportImagePath(match.sportGroup))}" alt="${escapeHtml(sportLabel)} image" loading="lazy">
          <div>
            <strong>${escapeHtml(sportLabel)}</strong>
            <span>${escapeHtml(syncLabel)}</span>
          </div>
        </div>
        ${statusBadge(match)}
      </div>
      ${tableHtml}
      <div class="match-insight-actions">
        <button class="tool-btn match-favorite-btn ${isFavorite ? "active" : ""}" type="button" data-favorite-match="${escapeHtml(favoriteKey)}">${isFavorite ? "Saved" : "Favorite"}</button>
        ${
          match.status === "upcoming"
            ? `<button class="tool-btn match-reminder-btn ${hasReminder ? "active" : ""}" type="button" aria-pressed="${hasReminder ? "true" : "false"}" data-match-reminder="${escapeHtml(reminderKey)}" data-match-status="${escapeHtml(match.status)}"><span class="match-reminder-icon" aria-hidden="true">&#128276;</span><span data-reminder-label>${hasReminder ? "Reminder On" : "Notify"}</span></button>`
            : ""
        }
      </div>
    </aside>
  `;
}

function getSummaryOfficials(summary) {
  const officials = summary?.boxscore?.officials || summary?.header?.competitions?.[0]?.officials || [];
  return officials
    .map((item) => item?.displayName || item?.fullName || "")
    .filter(Boolean);
}

function buildMatchInfoItems(match, summary, sportsDbEvent) {
  const attendance =
    summary?.header?.competitions?.[0]?.attendance ||
    summary?.boxscore?.attendance ||
    sportsDbEvent?.intAttendance ||
    "Unknown";
  const officials = getSummaryOfficials(summary);
  const referee = officials[0] || sportsDbEvent?.strReferee || "Not published";

  return [
    { label: "Date", value: formatDate(match.date) },
    { label: "Kickoff", value: formatTime(match.date) },
    { label: "Venue", value: match.venue || "Venue TBC" },
    { label: "Attendance", value: String(attendance) },
    { label: "Referee", value: referee }
  ];
}

function renderMatchInfoGrid(items) {
  return `
    <div class="match-info-grid">
      ${items
        .map(
          (item) => `
            <div class="info-card">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value || "Unknown")}</strong>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function collectEspnEntries(node, bucket, seen = new Set()) {
  if (!node || typeof node !== "object") {
    return;
  }
  if (seen.has(node)) {
    return;
  }
  seen.add(node);

  if (Array.isArray(node)) {
    for (const item of node) {
      collectEspnEntries(item, bucket, seen);
    }
    return;
  }

  if (Array.isArray(node.entries)) {
    bucket.push(...node.entries);
  }

  for (const value of Object.values(node)) {
    if (value && typeof value === "object") {
      collectEspnEntries(value, bucket, seen);
    }
  }
}

function buildStandingStatMap(stats) {
  const map = new Map();
  for (const stat of stats || []) {
    const keys = [stat?.name, stat?.displayName, stat?.shortDisplayName, stat?.abbreviation]
      .map((item) => String(item || "").toLowerCase().trim())
      .filter(Boolean);
    for (const key of keys) {
      map.set(key, stat);
    }
  }
  return map;
}

function getStandingDisplay(statMap, keys, fallback = "-") {
  for (const key of keys) {
    const stat = statMap.get(String(key).toLowerCase());
    if (!stat) {
      continue;
    }
    if (stat.displayValue !== undefined && stat.displayValue !== null && String(stat.displayValue).trim() !== "") {
      return String(stat.displayValue);
    }
    if (stat.value !== undefined && stat.value !== null) {
      return String(stat.value);
    }
  }
  return fallback;
}

function getStandingNumber(statMap, keys, fallback = 0) {
  const value = getStandingDisplay(statMap, keys, String(fallback));
  return parseNumeric(value);
}

function mapEspnStandingEntry(entry, index) {
  const team = entry?.team || {};
  const statMap = buildStandingStatMap(entry?.stats || []);

  const rank = getStandingNumber(statMap, ["rank", "position"], index + 1);
  const played = getStandingDisplay(statMap, ["gamesplayed", "matchesplayed", "played", "mp"], "-");
  const wins = getStandingDisplay(statMap, ["wins", "win", "w"], "-");
  const draws = getStandingDisplay(statMap, ["ties", "draws", "draw", "d"], "-");
  const losses = getStandingDisplay(statMap, ["losses", "loss", "l"], "-");
  const goalsFor = getStandingDisplay(statMap, ["goalsfor", "gf", "pointsfor", "for"], "-");
  const goalsAgainst = getStandingDisplay(statMap, ["goalsagainst", "ga", "pointsagainst", "against"], "-");
  const goalDiff = getStandingDisplay(statMap, ["goaldifference", "pointdifferential", "gd", "diff"], "-");
  const points = getStandingDisplay(statMap, ["points", "pts"], "-");
  const form = getStandingDisplay(statMap, ["form"], "");

  return {
    rank: rank || index + 1,
    teamName: team.displayName || team.shortDisplayName || team.name || `Team ${index + 1}`,
    teamLogo: team.logos?.[0]?.href || "",
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDiff,
    points,
    form
  };
}

async function fetchEspnStandings(match) {
  if (!match.feedPath) {
    return [];
  }

  try {
    const data = await cachedJson(`${ESPN_BASE}/${match.feedPath}/standings`, 120000);
    const entries = [];
    collectEspnEntries(data, entries);
    const mapped = entries.map((entry, index) => mapEspnStandingEntry(entry, index));
    return mapped.filter((item) => item.teamName).slice(0, 40);
  } catch (_error) {
    return [];
  }
}

async function fetchSportsDbStandings(sportsDbEvent) {
  const leagueId = sportsDbEvent?.idLeague || sportsDbEvent?.strLeagueID;
  if (!leagueId) {
    return [];
  }

  const season = sportsDbEvent?.strSeason || String(new Date().getUTCFullYear());

  try {
    const data = await cachedJson(`${SPORTSDB_BASE}/lookuptable.php?l=${encodeURIComponent(leagueId)}&s=${encodeURIComponent(season)}`, 120000);
    const table = Array.isArray(data?.table) ? data.table : Array.isArray(data?.tables) ? data.tables : [];
    return table
      .map((row, index) => ({
        rank: parseNumeric(row.intRank || row.intPosition || index + 1) || index + 1,
        teamName: row.strTeam || `Team ${index + 1}`,
        teamLogo: row.strTeamBadge || row.strBadge || "",
        played: String(row.intPlayed || row.intGamesPlayed || "-"),
        wins: String(row.intWin || "-"),
        draws: String(row.intDraw || "-"),
        losses: String(row.intLoss || "-"),
        goalsFor: String(row.intGoalsFor || row.intGF || "-"),
        goalsAgainst: String(row.intGoalsAgainst || row.intGA || "-"),
        goalDiff: String(row.intGoalDifference || row.intGD || "-"),
        points: String(row.intPoints || row.intPts || "-"),
        form: row.strForm || ""
      }))
      .slice(0, 40);
  } catch (_error) {
    return [];
  }
}

function leagueFinalMatchSource(match) {
  const combined = [...state.history, ...state.finalMatches];
  const seen = new Set();
  const rows = [];

  for (const item of combined) {
    if (item.sportGroup !== match.sportGroup) {
      continue;
    }
    const leagueMatch =
      (item.leagueKey && match.leagueKey && item.leagueKey === match.leagueKey) ||
      String(item.leagueLabel || "").toLowerCase() === String(match.leagueLabel || "").toLowerCase();
    if (!leagueMatch) {
      continue;
    }

    const key = `${dedupeMatchKey(item)}|${String(item.date || "").slice(0, 16)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push(item);
  }

  return rows;
}

function buildLocalStandingsSnapshot(match) {
  const source = leagueFinalMatchSource(match);
  const teamMap = new Map();

  const ensureTeam = (name, logo = "") => {
    const token = normalizeTeamToken(name);
    if (!teamMap.has(token)) {
      teamMap.set(token, {
        teamName: name,
        teamLogo: logo || "",
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      });
    }
    const entry = teamMap.get(token);
    if (!entry.teamLogo && logo) {
      entry.teamLogo = logo;
    }
    return entry;
  };

  for (const item of source) {
    if (!hasNumericScore(item.homeScore) || !hasNumericScore(item.awayScore)) {
      continue;
    }
    const homeScore = parseNumeric(item.homeScore);
    const awayScore = parseNumeric(item.awayScore);

    const home = ensureTeam(item.homeName, item.homeLogo);
    const away = ensureTeam(item.awayName, item.awayLogo);

    home.played += 1;
    away.played += 1;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else if (awayScore > homeScore) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const standings = Array.from(teamMap.values()).map((entry) => ({
    rank: 0,
    teamName: entry.teamName,
    teamLogo: entry.teamLogo,
    played: String(entry.played),
    wins: String(entry.wins),
    draws: String(entry.draws),
    losses: String(entry.losses),
    goalsFor: String(entry.goalsFor),
    goalsAgainst: String(entry.goalsAgainst),
    goalDiff: String(entry.goalsFor - entry.goalsAgainst),
    points: String(entry.points),
    form: ""
  }));

  standings.sort((left, right) => {
    const pointDiff = parseNumeric(right.points) - parseNumeric(left.points);
    if (pointDiff !== 0) {
      return pointDiff;
    }
    const gdDiff = parseNumeric(right.goalDiff) - parseNumeric(left.goalDiff);
    if (gdDiff !== 0) {
      return gdDiff;
    }
    const gfDiff = parseNumeric(right.goalsFor) - parseNumeric(left.goalsFor);
    if (gfDiff !== 0) {
      return gfDiff;
    }
    return left.teamName.localeCompare(right.teamName);
  });

  standings.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return standings.slice(0, 24);
}

async function resolveStandings(match, sportsDbEvent) {
  let standings = [];

  if (match.source === "sportsdb") {
    standings = await fetchSportsDbStandings(sportsDbEvent);
  } else {
    standings = await fetchEspnStandings(match);
  }

  if (!standings.length) {
    standings = buildLocalStandingsSnapshot(match);
  }

  const homeToken = normalizeTeamToken(match.homeName);
  const awayToken = normalizeTeamToken(match.awayName);

  return standings.map((entry) => ({
    ...entry,
    highlight: [homeToken, awayToken].includes(normalizeTeamToken(entry.teamName))
  }));
}

function renderStandingsTable(standings, match = null) {
  if (!standings.length) {
    return '<div class="message-box">Standings are not available from the current match feed yet.</div>';
  }

  return `
    <div class="table-wrap">
      <table class="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>MP</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>PTS</th>
          </tr>
        </thead>
        <tbody>
          ${standings
            .map(
              (entry) => `
                <tr class="${entry.highlight ? "standings-highlight" : ""}">
                  <td>${escapeHtml(entry.rank)}</td>
                  <td>
                    <div class="table-team-cell">
                      ${renderTeamNameControl({
                        sportGroup: match?.sportGroup || "",
                        teamId: "",
                        teamName: entry.teamName,
                        teamAbbr: entry.teamName.slice(0, 3).toUpperCase(),
                        teamLogo: entry.teamLogo || "",
                        fallbackIcon: "TM",
                        className: "inline-entity-link standings-team-link"
                      })}
                    </div>
                  </td>
                  <td>${escapeHtml(entry.played)}</td>
                  <td>${escapeHtml(entry.wins)}</td>
                  <td>${escapeHtml(entry.draws)}</td>
                  <td>${escapeHtml(entry.losses)}</td>
                  <td>${escapeHtml(entry.goalsFor)}</td>
                  <td>${escapeHtml(entry.goalsAgainst)}</td>
                  <td>${escapeHtml(entry.goalDiff)}</td>
                  <td><strong>${escapeHtml(entry.points)}</strong></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function finalMatchesBySport(sportGroup) {
  const combined = [...state.history, ...state.finalMatches];
  const seen = new Set();
  const rows = [];
  for (const item of combined) {
    if (item.sportGroup !== sportGroup) {
      continue;
    }
    const key = `${dedupeMatchKey(item)}|${String(item.date || "").slice(0, 16)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push(item);
  }
  rows.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  return rows;
}

function buildTeamForm(teamName, sportGroup) {
  const token = normalizeTeamToken(teamName);
  const matches = finalMatchesBySport(sportGroup).filter((item) => {
    const home = normalizeTeamToken(item.homeName);
    const away = normalizeTeamToken(item.awayName);
    return home === token || away === token;
  });

  return matches
    .slice(0, 10)
    .map((item) => {
      if (!hasNumericScore(item.homeScore) || !hasNumericScore(item.awayScore)) {
        return "";
      }
      const homeScore = parseNumeric(item.homeScore);
      const awayScore = parseNumeric(item.awayScore);
      const isHome = normalizeTeamToken(item.homeName) === token;
      if (homeScore === awayScore) {
        return "D";
      }
      if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) {
        return "W";
      }
      return "L";
    })
    .filter(Boolean)
    .slice(0, 6);
}

function renderFormTrack(form) {
  if (!form.length) {
    return '<span class="subtle">No recent final matches.</span>';
  }
  return `
    <div class="form-track">
      ${form
        .map((result) => `<span class="form-chip form-${result.toLowerCase()}">${result}</span>`)
        .join("")}
    </div>
  `;
}

function buildHeadToHeadMatches(match) {
  const homeToken = normalizeTeamToken(match.homeName);
  const awayToken = normalizeTeamToken(match.awayName);

  return finalMatchesBySport(match.sportGroup)
    .filter((item) => {
      const home = normalizeTeamToken(item.homeName);
      const away = normalizeTeamToken(item.awayName);
      return (home === homeToken && away === awayToken) || (home === awayToken && away === homeToken);
    })
    .slice(0, 8);
}

function renderHeadToHead(h2hMatches, sportGroup = "") {
  if (!h2hMatches.length) {
    return '<div class="message-box">No head-to-head final matches found in the current history cache yet.</div>';
  }

  return `
    <div class="h2h-list">
      ${h2hMatches
        .map(
          (item) => `
            <article class="h2h-item">
              <div>
                ${renderTeamNameControl({
                  sportGroup,
                  teamId: item.homeTeamId || "",
                  teamName: item.homeName,
                  teamAbbr: item.homeAbbr || "",
                  teamLogo: item.homeLogo || "",
                  fallbackIcon: "TM",
                  className: "inline-entity-link"
                })}
                ${escapeHtml(item.homeScore)} - ${escapeHtml(item.awayScore)}
                ${renderTeamNameControl({
                  sportGroup,
                  teamId: item.awayTeamId || "",
                  teamName: item.awayName,
                  teamAbbr: item.awayAbbr || "",
                  teamLogo: item.awayLogo || "",
                  fallbackIcon: "TM",
                  className: "inline-entity-link"
                })}
              </div>
              <div class="subtle">${escapeHtml(formatDate(item.date))} | ${escapeHtml(item.leagueLabel || "League")}</div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function buildWinProbabilities(match, statPairs, homeScore, awayScore) {
  let home = 50;
  let away = 50;

  const possession = findStatPair(statPairs, ["possession"]);
  const shots = findStatPair(statPairs, ["shots on target", "total shots", "shots"]);
  const corners = findStatPair(statPairs, ["corner"]);

  if (possession) {
    home += (possession.homeValue - possession.awayValue) * 0.22;
    away -= (possession.homeValue - possession.awayValue) * 0.22;
  }
  if (shots) {
    home += (shots.homeValue - shots.awayValue) * 3.8;
    away -= (shots.homeValue - shots.awayValue) * 3.8;
  }
  if (corners) {
    home += (corners.homeValue - corners.awayValue) * 1.2;
    away -= (corners.homeValue - corners.awayValue) * 1.2;
  }

  const scoreDiff = parseNumeric(homeScore) - parseNumeric(awayScore);
  if (match.status !== "upcoming") {
    home += scoreDiff * 9;
    away -= scoreDiff * 9;
  }

  home += 2;
  away -= 2;

  home = Math.max(10, Math.min(82, home));
  away = Math.max(10, Math.min(82, away));
  let draw = Math.max(6, 100 - home - away);

  const total = home + away + draw;
  return {
    home: Math.round((home / total) * 100),
    draw: Math.round((draw / total) * 100),
    away: Math.round((away / total) * 100)
  };
}

function renderProbabilityBar(label, home, away) {
  const total = home + away || 1;
  const homePercent = Math.round((home / total) * 100);
  const awayPercent = 100 - homePercent;
  return `
    <div class="probability-row">
      <span>${escapeHtml(label)}</span>
      <div class="probability-track">
        <span class="probability-home" style="width:${homePercent}%"></span>
        <span class="probability-away" style="width:${awayPercent}%"></span>
      </div>
      <strong>${homePercent}% - ${awayPercent}%</strong>
    </div>
  `;
}

function buildMatchTabs(match, availability) {
  const tabMap = new Map(MATCH_TABS.map((item) => [item.id, item]));
  const tabs = [tabMap.get("summary")];

  const individualSports = new Set(["tennis", "f1", "mma"]);
  const noLineupSports = new Set(["f1", "mma"]);

  if (availability.hasStats) {
    tabs.push(tabMap.get("stats"));
  }
  if (availability.hasLineups && !noLineupSports.has(match.sportGroup)) {
    tabs.push(tabMap.get("lineups"));
  }
  if (availability.hasStandings && !individualSports.has(match.sportGroup)) {
    tabs.push(tabMap.get("standings"));
  }
  if (availability.hasH2H) {
    tabs.push(tabMap.get("h2h"));
  }
  if (availability.hasAnalysis) {
    tabs.push(tabMap.get("analysis"));
  }
  if (availability.hasPreview) {
    tabs.push(tabMap.get("preview"));
  }
  if (availability.hasEvents) {
    tabs.push(tabMap.get("events"));
  }

  if (!tabs.some((item) => item?.id === "stats")) {
    tabs.push(tabMap.get("stats"));
  }
  if (!tabs.some((item) => item?.id === "events")) {
    tabs.push(tabMap.get("events"));
  }

  const seen = new Set();
  return tabs.filter((item) => {
    if (!item || seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function getActiveMatchTab(match, availableTabs = MATCH_TABS) {
  const key = `${match.sportGroup}:${match.slug}`;
  const saved = state.matchTabBySlug[key];
  if (availableTabs.some((item) => item.id === saved)) {
    return saved;
  }
  return availableTabs[0]?.id || "summary";
}

function renderMatchTabButtons(activeTab, availableTabs = MATCH_TABS) {
  return `
    <nav class="match-tabs" aria-label="Match tabs">
      ${availableTabs.map(
        (tab) =>
          `<button class="match-tab-btn ${activeTab === tab.id ? "active" : ""}" type="button" data-match-tab="${tab.id}">${tab.label}</button>`
      ).join("")}
    </nav>
  `;
}

function renderTabPanel(id, content, activeTab) {
  return `<section class="match-tab-panel ${activeTab === id ? "active" : ""}" data-tab-panel="${id}">${content}</section>`;
}

function wireMatchTabs(match, availableTabs = MATCH_TABS) {
  const root = qs("#main");
  if (!root) {
    return;
  }

  const buttons = qsa(".match-tab-btn", root);
  const panels = qsa(".match-tab-panel", root);
  const key = `${match.sportGroup}:${match.slug}`;

  const activate = (tabId) => {
    buttons.forEach((button) => {
      button.classList.toggle("active", button.getAttribute("data-match-tab") === tabId);
    });
    panels.forEach((panel) => {
      panel.classList.toggle("active", panel.getAttribute("data-tab-panel") === tabId);
    });
    state.matchTabBySlug[key] = tabId;
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      activate(button.getAttribute("data-match-tab") || "summary");
    });
  });

  activate(getActiveMatchTab(match, availableTabs));
}
async function renderMatchPage(route) {
  const main = qs("#main");
  if (!main) {
    return;
  }

  let match = findMatch(route.sport, route.slug);

  if (!match && !state.loading) {
    await refreshData({ silent: true });
    match = findMatch(route.sport, route.slug);
  }

  if (!match) {
    main.innerHTML = '<div class="message-box">Match page not found yet. This URL is generated automatically from live feeds.</div>';
    setSeo({
      title: "Match Not Found | LiveScoreFree",
      description: "The match URL is not available right now. Try Live Now or Results pages.",
      keywords: ["match not found", "live scores"],
      path: state.activePath
    });
    return;
  }

  applyBackgroundForRoute({ type: "match", sport: match.sportGroup, slug: match.slug });

  const tabStateKey = `${match.sportGroup}:${match.slug}`;
  const existingActiveTab = qs(".match-tab-btn.active", main)?.getAttribute("data-match-tab");
  if (existingActiveTab && MATCH_TABS.some((item) => item.id === existingActiveTab)) {
    state.matchTabBySlug[tabStateKey] = existingActiveTab;
  }

  main.innerHTML = '<div class="message-box">Loading live score, commentary, lineups, stats, and timeline...</div>';

  const isSportsDbMatch = match.source === "sportsdb";
  let summary = null;
  let sportsDbBundle = null;
  let espnRosterDetailsByTeam = {};
  try {
    if (isSportsDbMatch) {
      sportsDbBundle = await fetchSportsDbMatchBundle(match);
    } else {
      summary = await cachedJson(`${ESPN_BASE}/${match.feedPath}/summary?event=${match.id}`, 15000);
      espnRosterDetailsByTeam = await fetchEspnTeamRosterDetails(match, summary);
    }
  } catch (_error) {
    summary = null;
    sportsDbBundle = null;
    espnRosterDetailsByTeam = {};
  }

  const canonicalMode = match.status === "final" ? "results" : "live";
  const canonicalPath = `/${match.sportGroup}/${canonicalMode}/${match.slug}`;
  const eventStatus = match.status === "final" ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled";

  const headline = `${match.homeName} vs ${match.awayName}`;
  const sportsDbEvent = sportsDbBundle?.event || null;
  const notes =
    summary?.header?.competitions?.[0]?.notes?.[0]?.headline ||
    sportsDbEvent?.strResult ||
    sportsDbEvent?.strProgress ||
    match.note ||
    "Live match update";

  const teams = summary?.header?.competitions?.[0]?.competitors || [];
  const summaryHome = teams.find((item) => item.homeAway === "home") || teams[0] || {};
  const summaryAway = teams.find((item) => item.homeAway === "away") || teams[1] || {};

  const homeScore = isSportsDbMatch ? sportsDbEvent?.intHomeScore ?? match.homeScore : summaryHome.score ?? match.homeScore;
  const awayScore = isSportsDbMatch ? sportsDbEvent?.intAwayScore ?? match.awayScore : summaryAway.score ?? match.awayScore;
  const homeLogo =
    match.homeLogo ||
    summaryHome?.team?.logo ||
    summaryHome?.team?.logos?.[0]?.href ||
    sportsDbEvent?.strHomeTeamBadge ||
    "";
  const awayLogo =
    match.awayLogo ||
    summaryAway?.team?.logo ||
    summaryAway?.team?.logos?.[0]?.href ||
    sportsDbEvent?.strAwayTeamBadge ||
    "";

  syncMatchRealtimeState(match, {
    homeLogo,
    awayLogo,
    homeScore: String(homeScore ?? match.homeScore ?? "-"),
    awayScore: String(awayScore ?? match.awayScore ?? "-")
  });
  renderTicker();

  const statPairs = extractMatchStatPairs(match, summary, sportsDbBundle);
  const heroMetrics = buildHeroMetrics(statPairs);
  const standings = await resolveStandings(match, sportsDbEvent);
  const infoItems = buildMatchInfoItems(match, summary, sportsDbEvent);
  const h2hMatches = buildHeadToHeadMatches(match);
  const homeForm = buildTeamForm(match.homeName, match.sportGroup);
  const awayForm = buildTeamForm(match.awayName, match.sportGroup);
  const probabilities = buildWinProbabilities(match, statPairs, homeScore, awayScore);

  const commentaryHtml = isSportsDbMatch
    ? renderSportsDbCommentaryRows(sportsDbBundle?.timeline || [])
    : summary
      ? renderCommentaryRows(summary)
      : '<div class="message-box">Commentary feed is unavailable for this match right now.</div>';
  const timelineHtml = isSportsDbMatch
    ? renderSportsDbTimelineRows(sportsDbBundle?.timeline || [])
    : summary
      ? renderTimelineRows(summary)
      : '<div class="message-box">Timeline feed is unavailable for this match right now.</div>';
  const statsHtml = isSportsDbMatch
    ? renderSportsDbStatsRows(sportsDbBundle?.stats || [])
    : summary
      ? renderStatsRows(summary)
      : '<div class="message-box">Stats feed is unavailable for this match right now.</div>';
  const lineupHtml = isSportsDbMatch
    ? renderSportsDbLineupRows(sportsDbBundle?.lineup || [], match)
    : summary
      ? renderLineupRows(summary, espnRosterDetailsByTeam, match)
      : '<div class="message-box">Lineup feed is unavailable for this match right now.</div>';

  const homeToken = normalizeTeamToken(match.homeName);
  const awayToken = normalizeTeamToken(match.awayName);
  const h2hHomeWins = h2hMatches.filter((item) => {
    if (!hasNumericScore(item.homeScore) || !hasNumericScore(item.awayScore)) {
      return false;
    }
    const home = normalizeTeamToken(item.homeName);
    const away = normalizeTeamToken(item.awayName);
    const homeScoreN = parseNumeric(item.homeScore);
    const awayScoreN = parseNumeric(item.awayScore);
    if (homeScoreN === awayScoreN) {
      return false;
    }
    return (home === homeToken && homeScoreN > awayScoreN) || (away === homeToken && awayScoreN > homeScoreN);
  }).length;
  const h2hAwayWins = h2hMatches.filter((item) => {
    if (!hasNumericScore(item.homeScore) || !hasNumericScore(item.awayScore)) {
      return false;
    }
    const home = normalizeTeamToken(item.homeName);
    const away = normalizeTeamToken(item.awayName);
    const homeScoreN = parseNumeric(item.homeScore);
    const awayScoreN = parseNumeric(item.awayScore);
    if (homeScoreN === awayScoreN) {
      return false;
    }
    return (home === awayToken && homeScoreN > awayScoreN) || (away === awayToken && awayScoreN > homeScoreN);
  }).length;
  const h2hDraws = h2hMatches.filter(
    (item) => hasNumericScore(item.homeScore) && hasNumericScore(item.awayScore) && parseNumeric(item.homeScore) === parseNumeric(item.awayScore)
  ).length;

  const statControlRows = [
    findStatPair(statPairs, ["possession"]),
    findStatPair(statPairs, ["shots on target", "on target"]),
    findStatPair(statPairs, ["total shots", "shots"]),
    findStatPair(statPairs, ["corner"])
  ]
    .filter(Boolean)
    .map((pair) => renderProbabilityBar(pair.label, pair.homeValue, pair.awayValue))
    .join("");

  const predictionLabel =
    probabilities.home > probabilities.away
      ? `${match.homeName} slight edge`
      : probabilities.away > probabilities.home
        ? `${match.awayName} slight edge`
        : "Balanced matchup";

  const espnPlayCount = summary?.plays?.length || 0;
  const espnTimelineCount = summary?.scoringPlays?.length || summary?.plays?.length || 0;
  const sportsDbTimelineCount = sportsDbBundle?.timeline?.length || 0;
  const sportsDbStatsCount = sportsDbBundle?.stats?.length || 0;
  const sportsDbLineupCount = sportsDbBundle?.lineup?.length || 0;
  const espnRosterCount = (summary?.rosters || []).reduce((sum, roster) => sum + ((roster?.entries || []).length), 0);
  const extraRosterCount = Object.values(espnRosterDetailsByTeam).reduce((sum, team) => sum + ((team?.players || []).length), 0);

  const availableTabs = buildMatchTabs(match, {
    hasStats: isSportsDbMatch ? sportsDbStatsCount > 0 : statPairs.length > 0,
    hasLineups: isSportsDbMatch ? sportsDbLineupCount > 0 : (espnRosterCount + extraRosterCount) > 0,
    hasStandings: standings.length > 0,
    hasH2H: h2hMatches.length > 0,
    hasAnalysis: Boolean(statControlRows) || statPairs.length > 0 || homeForm.length > 0 || awayForm.length > 0,
    hasPreview: match.status !== "final" || homeForm.length > 0 || awayForm.length > 0,
    hasEvents: isSportsDbMatch ? sportsDbTimelineCount > 0 : (espnPlayCount + espnTimelineCount) > 0
  });
  const activeTab = getActiveMatchTab(match, availableTabs);
  const tabEnabled = new Set(availableTabs.map((item) => item.id));
  const favoriteKey = `${match.sportGroup}:${match.slug}`;
  const isFavorite = isFavoriteKey(favoriteKey);
  const reminderKey = reminderMatchKey(match);
  const hasReminder = match.status === "upcoming" && isReminderActive(reminderKey);
  const similarScoreboards = buildSimilarScoreboardMatches(match, 8);
  const detailLead =
    notes && notes !== "Live match update"
      ? notes
      : match.status === "live"
        ? "Realtime match information updates automatically while this page is open."
        : match.status === "upcoming"
          ? "Prematch details are syncing automatically before kickoff."
          : "Final score and published match data are synced automatically.";
  const syncMessage =
    match.status === "live"
      ? "Realtime match sync is active."
      : match.status === "upcoming"
        ? "Prematch sync stays active until kickoff."
        : "Final summary stays synced with published match data.";

  main.innerHTML = `
    <div class="detail-page">
      <section class="detail-hero auto-bg-surface" ${buildAutoBackgroundAttrs({
        sportGroup: match.sportGroup,
        leagueKey: match.leagueKey,
        fit: "contain",
        position: "right center",
        strength: 0.18
      })}>
        <div class="upper-score-strip ${match.status === "live" ? "is-live" : ""}">
          <div class="upper-score-team">
            ${renderTeamNameControl({
              sportGroup: match.sportGroup,
              teamId: match.homeTeamId,
              teamName: match.homeName,
              teamAbbr: match.homeAbbr,
              teamLogo: homeLogo,
              fallbackIcon: "TM",
              className: "inline-entity-link hero-team-link"
            })}
            <span class="subtle upper-score-abbr">${escapeHtml(match.homeAbbr)}</span>
          </div>
          <div class="upper-score-center">
            <span class="upper-score-status">${statusBadge(match)}</span>
            <strong class="upper-score-main">${escapeHtml(homeScore)} - ${escapeHtml(awayScore)}</strong>
            <span class="subtle upper-score-clock">${escapeHtml(getStatusText(match))}</span>
          </div>
          <div class="upper-score-team upper-score-team-away">
            ${renderTeamNameControl({
              sportGroup: match.sportGroup,
              teamId: match.awayTeamId,
              teamName: match.awayName,
              teamAbbr: match.awayAbbr,
              teamLogo: awayLogo,
              fallbackIcon: "TM",
              className: "inline-entity-link hero-team-link"
            })}
            <span class="subtle upper-score-abbr">${escapeHtml(match.awayAbbr)}</span>
          </div>
        </div>

        <div class="match-hero-grid">
          <div class="match-hero-copy">
            <div class="detail-head">
              <div>
                <h1>${escapeHtml(headline)}</h1>
                <p class="subtle">${escapeHtml(match.leagueLabel)} | ${escapeHtml(match.venue)} | ${escapeHtml(formatDateTime(match.date))}</p>
                <div class="match-sport-media">
                  <img src="${escapeHtml(getSportImagePath(match.sportGroup))}" alt="${escapeHtml(match.sportLabel)} image" loading="lazy">
                  <span>${escapeHtml(match.sportLabel)} realtime match center</span>
                </div>
              </div>
            </div>
            <p class="detail-lead">${escapeHtml(detailLead)}</p>
            <p class="match-sync-note"><span class="match-sync-dot" aria-hidden="true"></span>${escapeHtml(syncMessage)}</p>
            ${match.status === "upcoming" ? `<p class="subtle reminder-help">Turn on the bell in the match panel to get a browser reminder before kickoff.</p>` : ""}
            ${renderHeroMetrics(heroMetrics)}
          </div>
          ${renderMatchInsightPanel({
            match,
            statPairs,
            infoItems,
            favoriteKey,
            isFavorite,
            reminderKey,
            hasReminder
          })}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Similar Scoreboards</h2>
          <p>Related internal links for live scores, fixtures, and results in the same sport and league.</p>
        </div>
        ${renderMatchGrid(similarScoreboards, "Similar scoreboards will appear as more live and result pages are available.")}
      </section>

      <section class="section ad-band">
        ${renderAdSlot({
          title: "Match Page Sponsor Block",
          size: "Native Sponsor",
          placement: "In-match placement near live score and tabs"
        })}
      </section>

      ${renderMatchTabButtons(activeTab, availableTabs)}

      ${tabEnabled.has("summary") ? renderTabPanel(
        "summary",
        `
          <section class="panel">
            <h2>Match Info</h2>
            ${renderMatchInfoGrid(infoItems)}
          </section>
          <section class="panel">
            <h2>Current Form</h2>
            <div class="form-vs-grid">
              <div>
                <p class="subtle">
                  ${renderTeamNameControl({
                    sportGroup: match.sportGroup,
                    teamId: match.homeTeamId || "",
                    teamName: match.homeName,
                    teamAbbr: match.homeAbbr || "",
                    teamLogo: "",
                    fallbackIcon: "TM",
                    className: "inline-entity-link"
                  })}
                </p>
                ${renderFormTrack(homeForm)}
              </div>
              <div>
                <p class="subtle">
                  ${renderTeamNameControl({
                    sportGroup: match.sportGroup,
                    teamId: match.awayTeamId || "",
                    teamName: match.awayName,
                    teamAbbr: match.awayAbbr || "",
                    teamLogo: "",
                    fallbackIcon: "TM",
                    className: "inline-entity-link"
                  })}
                </p>
                ${renderFormTrack(awayForm)}
              </div>
            </div>
          </section>
        `,
        activeTab
      ) : ""}

      ${tabEnabled.has("stats") ? renderTabPanel(
        "stats",
        `
          <section class="panel">
            <h2>Match Stats</h2>
            ${statsHtml}
          </section>
          <section class="panel">
            <h2>Control & Pressure</h2>
            ${
              statControlRows ||
              '<div class="message-box">Advanced control metrics are not available from this feed yet.</div>'
            }
          </section>
        `,
        activeTab
      ) : ""}

      ${tabEnabled.has("lineups") ? renderTabPanel(
        "lineups",
        `
          <section class="panel">
            <h2>Lineups & Players</h2>
            <p class="subtle">Starting players and available roster information from live updates.</p>
          </section>
          ${lineupHtml}
        `,
        activeTab
      ) : ""}

      ${tabEnabled.has("standings") ? renderTabPanel(
        "standings",
        `
          <section class="panel">
            <h2>${escapeHtml(match.leagueLabel)} Standings</h2>
            <p class="subtle">Live league table with direct team profile links.</p>
            ${renderStandingsTable(standings, match)}
          </section>
        `,
        activeTab
      ) : ""}

      ${tabEnabled.has("h2h") ? renderTabPanel(
        "h2h",
        `
          <section class="panel">
            <h2>Head-to-Head</h2>
            <div class="h2h-summary-grid">
              <div><span class="subtle">${escapeHtml(match.homeName)} wins</span><strong>${h2hHomeWins}</strong></div>
              <div><span class="subtle">Draws</span><strong>${h2hDraws}</strong></div>
              <div><span class="subtle">${escapeHtml(match.awayName)} wins</span><strong>${h2hAwayWins}</strong></div>
            </div>
            ${renderHeadToHead(h2hMatches, match.sportGroup)}
          </section>
        `,
        activeTab
      ) : ""}

      ${tabEnabled.has("analysis") ? renderTabPanel(
        "analysis",
        `
          <section class="panel">
            <h2>Live Match Analysis</h2>
            ${
              statControlRows ||
              '<div class="message-box">Analysis indicators will appear when live stats are published.</div>'
            }
          </section>
          <section class="panel">
            <h2>Edge Snapshot</h2>
            <div class="h2h-summary-grid">
              <div><span class="subtle">${escapeHtml(match.homeName)} win chance</span><strong>${probabilities.home}%</strong></div>
              <div><span class="subtle">Draw chance</span><strong>${probabilities.draw}%</strong></div>
              <div><span class="subtle">${escapeHtml(match.awayName)} win chance</span><strong>${probabilities.away}%</strong></div>
            </div>
            <p class="subtle">Analysis uses live stat values, scoreline momentum, and recent form signal.</p>
          </section>
        `,
        activeTab
      ) : ""}

      ${tabEnabled.has("preview") ? renderTabPanel(
        "preview",
        `
          <section class="panel">
            <h2>Match Prediction</h2>
            <div class="preview-grid">
              <article class="preview-card"><span>${escapeHtml(match.homeName)}</span><strong>${probabilities.home}%</strong></article>
              <article class="preview-card"><span>Draw</span><strong>${probabilities.draw}%</strong></article>
              <article class="preview-card"><span>${escapeHtml(match.awayName)}</span><strong>${probabilities.away}%</strong></article>
            </div>
            <p class="subtle" style="margin-top:10px;">${escapeHtml(predictionLabel)}. Model is built from live match stats and score momentum.</p>
          </section>
          <section class="panel">
            <h2>Recent Team Form</h2>
            <div class="form-vs-grid">
              <div>
                ${renderTeamNameControl({
                  sportGroup: match.sportGroup,
                  teamId: match.homeTeamId || "",
                  teamName: match.homeName,
                  teamAbbr: match.homeAbbr || "",
                  teamLogo: "",
                  fallbackIcon: "TM",
                  className: "inline-entity-link"
                })}
                ${renderFormTrack(homeForm)}
              </div>
              <div>
                ${renderTeamNameControl({
                  sportGroup: match.sportGroup,
                  teamId: match.awayTeamId || "",
                  teamName: match.awayName,
                  teamAbbr: match.awayAbbr || "",
                  teamLogo: "",
                  fallbackIcon: "TM",
                  className: "inline-entity-link"
                })}
                ${renderFormTrack(awayForm)}
              </div>
            </div>
          </section>
        `,
        activeTab
      ) : ""}

      ${tabEnabled.has("events") ? renderTabPanel(
        "events",
        `
          <section class="layout-split">
            <div class="panel">
              <h2>Commentary</h2>
              ${commentaryHtml}
            </div>
            <div class="panel">
              <h2>Timeline</h2>
              ${timelineHtml}
            </div>
          </section>
        `,
        activeTab
      ) : ""}
    </div>
  `;

  wireMatchTabs(match, availableTabs);

  setSeo({
    title: `${headline} ${canonicalMode === "results" ? "Result" : "Live Score"} | LiveScoreFree`,
    description: `${headline} live match center with summary, stats, lineups, standings, head-to-head, preview, and events on LiveScoreFree.`,
    keywords: [
      `${match.homeName} vs ${match.awayName}`,
      `${match.sportLabel.toLowerCase()} live score`,
      `${match.sportLabel.toLowerCase()} commentary`,
      "match center",
      "standings table",
      "head to head",
      "match lineups",
      "match stats"
    ],
    path: canonicalPath,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: headline,
      sport: match.sportLabel,
      startDate: match.date,
      eventStatus,
      location: {
        "@type": "Place",
        name: match.venue
      },
      competitor: [
        { "@type": "SportsTeam", name: match.homeName },
        { "@type": "SportsTeam", name: match.awayName }
      ],
      url: `${SEO_BASE.origin}${canonicalPath}`
    }
  });

  renderGlobalShareWidget();
}
function renderArticlePage({ title, lead, bodyHtml, path, description, keywords }) {
  const main = qs("#main");
  if (!main) {
    return;
  }

  main.innerHTML = `
    <article class="article">
      <h1>${escapeHtml(title)}</h1>
      <p class="lead">${escapeHtml(lead)}</p>
      ${bodyHtml}
    </article>
  `;

  setSeo({
    title: `${title} | LiveScoreFree`,
    description,
    keywords,
    path,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      url: `${SEO_BASE.origin}${path}`
    }
  });
}

function renderDonationPage() {
  renderArticlePage({
    title: "Support LiveScoreFree on Ko-fi",
    lead:
      "LiveScoreFree is a free community-powered sports scoreboard. Support from $1 or any amount helps us keep scores fast, free, and accessible to everyone.",
    path: "/donate",
    description: "Support LiveScoreFree from $1 on Ko-fi. Help keep fast free live scores online and follow transparent community impact updates.",
    keywords: ["livescore donation", "ko-fi livescorefree", "support from $1", "donation transparency", "community-powered scoreboard"],
    bodyHtml: `
      <section class="donation-hero">
        <div class="donation-hero-copy">
          <p class="donation-eyebrow">Community Powered</p>
          <h2>Support LiveScoreFree: Live Scores Without Limits</h2>
          <p>
            If you enjoy LiveScoreFree, support us at <strong>ko-fi.com/livescorefree</strong> starting from <strong>$1</strong> or any amount you like.
            Your support helps cover servers, development, and new features.
          </p>
          <div class="donation-actions">
            <a class="kofi-link kofi-link-solid" href="https://ko-fi.com/livescorefree" target="_blank" rel="noopener noreferrer">Support from $1</a>
            <a class="kofi-link kofi-link-ghost" href="https://ko-fi.com/livescorefree" target="_blank" rel="noopener noreferrer">Donate Any Amount</a>
          </div>
        </div>
        <div class="donation-logo-wrap">
          <img src="logo-mark.svg" alt="LiveScoreFree logo mark" class="donation-logo-mark" loading="lazy">
        </div>
      </section>

      ${renderDonationProgress()}

      <div class="donation-grid">
        <article class="donation-card">
          <h3>Live Infrastructure</h3>
          <p>Keep real-time refreshes, match pages, and global score coverage stable and fast.</p>
        </article>
        <article class="donation-card">
          <h3>Feature Growth</h3>
          <p>Build better player info, faster commentary, language options, and broader accessibility.</p>
        </article>
        <article class="donation-card">
          <h3>Do Good Promise</h3>
          <p>Part of community support is returned to people who need help, and updates are posted publicly.</p>
        </article>
        <article class="donation-card">
          <h3>Supporter Gift</h3>
          <p>Supporters are eligible for occasional thank-you gifts such as early feature previews and public appreciation updates.</p>
        </article>
      </div>

      <div class="donation-note">
        <strong>Transparency promise:</strong> We promise to keep LiveScoreFree free worldwide, do good with donations, and share completed impact updates on this page and social media.
      </div>

      <h2>Why Trust This Page</h2>
      <ul>
        <li>Direct Ko-fi account link: <a href="https://ko-fi.com/livescorefree" target="_blank" rel="noopener noreferrer">https://ko-fi.com/livescorefree</a></li>
        <li>Public transparency updates stay on this page for accountability.</li>
        <li>No paywall for core live scores. Donations are optional community support.</li>
      </ul>

      <h2>Transparency Updates</h2>
      <ul>
        <li><strong>March 9, 2026:</strong> Donation page and Ko-fi support link launched.</li>
        <li><strong>Next update:</strong> We will post verified support actions, receipts, and social proof updates in this section and on social channels.</li>
      </ul>
    `
  });
}

function renderFeedbackPage() {
  const notesHtml = state.feedbackNotes.length
    ? `<ul>${state.feedbackNotes
        .slice(0, 10)
        .map((item) => `<li><strong>${escapeHtml(formatDate(item.savedAt))}</strong>: ${escapeHtml(item.add)} | ${escapeHtml(item.improve)}</li>`)
        .join("")}</ul>`
    : "<p>No saved feedback notes yet.</p>";

  renderArticlePage({
    title: "Feedback",
    lead: "Tell us what can bring more value, what to improve first, and what to build next.",
    path: "/feedback",
    description: "Send LiveScoreFree feedback and roadmap suggestions.",
    keywords: ["livescore feedback", "feature request", "sports app suggestions"],
    bodyHtml: `
      <form class="form-grid" id="feedback-form">
        <div>
          <label for="feedback-add">What can we add to make LiveScoreFree better?</label>
          <textarea id="feedback-add" required placeholder="Example: Add tournament tables for cricket and tennis"></textarea>
        </div>
        <div>
          <label for="feedback-improve">What should we improve first?</label>
          <textarea id="feedback-improve" required placeholder="Example: Faster live commentary updates"></textarea>
        </div>
        <div>
          <label for="feedback-email">Your email (optional)</label>
          <input id="feedback-email" type="email" placeholder="you@example.com">
        </div>
        <button class="btn btn-primary" type="submit">Save Note + Open Email Draft</button>
      </form>

      <h2 style="margin-top:20px;">Recent Feedback Notes</h2>
      ${notesHtml}
    `
  });

  const form = qs("#feedback-form");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const add = qs("#feedback-add")?.value.trim() || "";
      const improve = qs("#feedback-improve")?.value.trim() || "";
      const email = qs("#feedback-email")?.value.trim() || "";

      if (!add || !improve) {
        showToast("Please complete both feedback notes.");
        return;
      }

      state.feedbackNotes.unshift({ add, improve, email, savedAt: Date.now() });
      state.feedbackNotes = state.feedbackNotes.slice(0, 50);
      saveFeedbackNotes();

      const subject = encodeURIComponent("LiveScoreFree Feedback");
      const body = encodeURIComponent(
        `What to add:\n${add}\n\nWhat to improve:\n${improve}\n\nEmail:\n${email || "Not provided"}`
      );
      window.location.href = `mailto:hello@livescorefree.com?subject=${subject}&body=${body}`;

      showToast("Feedback note saved locally.");
      renderFeedbackPage();
    });
  }

  renderGlobalShareWidget();
}

function renderAdvertisePage() {
  const trust = getTrustSignals();
  renderArticlePage({
    title: "Advertise on LiveScoreFree",
    lead: "Reach sports fans with fast live-score pages, high-frequency updates, and mobile-first placements.",
    path: "/advertise",
    description: "Advertise on LiveScoreFree with homepage, match-page, and league sponsorship opportunities.",
    keywords: ["advertise live score website", "sports ad placements", "match page sponsorship", "live score banner ads"],
    bodyHtml: `
      <section class="ad-offer-grid">
        <article class="ad-offer-card">
          <h3>Homepage Banner</h3>
          <p>Top visibility on Live Now page above active match cards.</p>
          <p><strong>Recommended:</strong> 728x90 (desktop), 320x100 (mobile)</p>
        </article>
        <article class="ad-offer-card">
          <h3>Match Page Sponsor</h3>
          <p>Native sponsor block on high-intent team-vs-team pages.</p>
          <p><strong>Recommended:</strong> Native card, 300x250 companion</p>
        </article>
        <article class="ad-offer-card">
          <h3>League Promotion</h3>
          <p>Top Leagues and sport hub placements for recurring fan traffic.</p>
          <p><strong>Recommended:</strong> 300x250, section sponsorship</p>
        </article>
        <article class="ad-offer-card">
          <h3>Sponsored Matches</h3>
          <p>Brand spotlight for selected fixtures and tournaments.</p>
          <p><strong>Recommended:</strong> Native + social share package</p>
        </article>
      </section>

      <h2>Current Audience Signals</h2>
      <ul>
        <li><strong>${escapeHtml(formatCompactNumber(trust.monthlyUsers))}+</strong> monthly users (projected from active match traffic)</li>
        <li><strong>${escapeHtml(String(trust.countries))}+</strong> countries reached</li>
        <li><strong>${escapeHtml(String(trust.sportsCovered))}</strong> sports covered with live updates</li>
        <li><strong>${escapeHtml(formatCompactNumber(trust.indexedPages))}+</strong> SEO pages projected per year</li>
      </ul>

      <h2>Available Ad Sizes</h2>
      <ul>
        <li>728x90 leaderboard</li>
        <li>300x250 medium rectangle</li>
        <li>320x100 mobile banner</li>
        <li>Native sponsor block on match pages</li>
      </ul>

      <h2>Ad Stack Options</h2>
      <p>LiveScoreFree can run a blended ad model:</p>
      <ul>
        <li>Ad networks (Google AdSense, Media.net, Ezoic)</li>
        <li>Direct advertisers and sponsor banners</li>
        <li>League and match-level sponsorship packages</li>
      </ul>

      <h2>Advertising Contact</h2>
      <p>Email: <a href="mailto:ads@livescorefree.com">ads@livescorefree.com</a></p>
      <p>General inquiries: <a href="mailto:hello@livescorefree.com">hello@livescorefree.com</a></p>
      <p>Response window: usually within 24-48 hours.</p>

      <h2>Trust & Compliance</h2>
      <p>
        LiveScoreFree maintains dedicated legal pages (Privacy Policy, Terms of Service, Data Sources, DMCA) and transparent community updates.
        We prioritize non-intrusive ad placements that keep score pages fast and readable.
      </p>
    `
  });
}

function renderPrivacyPage() {
  renderArticlePage({
    title: "Privacy Policy",
    lead: "Last updated: March 9, 2026.",
    path: "/privacy-policy",
    description: "LiveScoreFree privacy policy.",
    keywords: ["privacy policy", "livescore privacy"],
    bodyHtml: `
      <h2>Personal Data</h2>
      <p>LiveScoreFree does not require account creation and does not collect personal profile data for site access.</p>

      <h2>Local Storage and History</h2>
      <p>Completed match history and feedback notes may be stored locally in your browser for faster browsing.</p>

      <h2>Data Requests</h2>
      <p>Score feeds are fetched from public sports APIs. Third-party providers may process request logs under their own privacy terms.</p>

      <h2>Contact</h2>
      <p>Privacy requests: privacy@livescorefree.com</p>
    `
  });
}

function renderTermsPage() {
  renderArticlePage({
    title: "Terms of Service",
    lead: "Last updated: March 9, 2026.",
    path: "/terms-of-service",
    description: "LiveScoreFree terms of service.",
    keywords: ["terms of service", "livescore terms"],
    bodyHtml: `
      <h2>Service Scope</h2>
      <p>LiveScoreFree provides sports score information for informational use. Availability and speed can vary.</p>

      <h2>Accuracy and Liability</h2>
      <p>We aim for high accuracy but cannot guarantee uninterrupted operation. Verify mission-critical decisions with official channels.</p>

      <h2>Usage</h2>
      <p>Do not abuse, scrape excessively, or attempt to disrupt service operation.</p>

      <h2>Contact</h2>
      <p>Legal requests: legal@livescorefree.com</p>
    `
  });
}
function renderDataSourcesPage() {
  renderArticlePage({
    title: "Data Sources",
    lead: "Public data source references used by LiveScoreFree.",
    path: "/data-sources",
    description: "Data source policy for LiveScoreFree.",
    keywords: ["sports data sources", "live score api", "espn scoreboard api"],
    bodyHtml: `
      <div class="table-wrap">
        <table class="source-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Usage</th>
              <th>Type</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ESPN Scoreboard API</td>
              <td>Live and upcoming match lists</td>
              <td>Public endpoint</td>
              <td>Refreshed every 30 seconds</td>
            </tr>
            <tr>
              <td>ESPN Summary API</td>
              <td>Commentary, lineups, stats, timeline</td>
              <td>Public endpoint</td>
              <td>Loaded on match pages</td>
            </tr>
            <tr>
              <td>ESPN Standings API</td>
              <td>League standings lookups</td>
              <td>Public endpoint</td>
              <td>Used for league contexts</td>
            </tr>
            <tr>
              <td>TheSportsDB Free API</td>
              <td>Fallback live schedules and match detail enrichment</td>
              <td>Public endpoint (free key 123)</td>
              <td>Endpoints: eventsday, lookupevent, lookupeventstats, lookuptimeline, lookuplineup</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2>Realtime Source Updates</h2>
      <p>This section is intentionally shown only on the Data Sources page.</p>
      <ul>
        <li>Primary feed: ESPN realtime endpoints (scoreboard, summary, standings).</li>
        <li>Fallback feed: TheSportsDB realtime endpoints.</li>
      </ul>
      <h2>Fair Use Disclaimer</h2>
      <p>
        LiveScoreFree is an independent scoreboard interface. Team names, logos, and related marks belong to their respective owners.
        Data is displayed for informational and commentary purposes only.
      </p>
    `
  });
}

function renderDmcaPage() {
  renderArticlePage({
    title: "DMCA Policy",
    lead: "Copyright and takedown policy for LiveScoreFree.",
    path: "/dmca-policy",
    description: "DMCA policy for LiveScoreFree.",
    keywords: ["dmca", "copyright policy", "takedown request"],
    bodyHtml: `
      <h2>Submitting a Notice</h2>
      <p>Send DMCA notices to dmca@livescorefree.com with clear identification of copyrighted work and URL.</p>

      <h2>Required Information</h2>
      <ul>
        <li>Your legal name and signature.</li>
        <li>Identification of copyrighted material.</li>
        <li>Specific URLs to remove.</li>
        <li>Good-faith statement and accuracy statement under penalty of perjury.</li>
      </ul>

      <h2>Counter Notice</h2>
      <p>If your content was removed in error, send a valid counter notice to the same address.</p>
    `
  });
}

function renderAboutPage() {
  const trust = getTrustSignals();
  renderArticlePage({
    title: "About LiveScoreFree",
    lead: "Fast, clean, and legal-safe scoreboard pages focused on discoverability and user trust.",
    path: "/about",
    description: "About LiveScoreFree mission and product scope.",
    keywords: ["about livescorefree", "free live scores"],
    bodyHtml: `
      <h2>Mission</h2>
      <p>Build a free live score platform with clean route structure and match pages designed for fast discovery.</p>
      <h2>Product Focus</h2>
      <ul>
        <li>Live Now</li>
        <li>Trending Matches</li>
        <li>Today's Matches</li>
        <li>Top Leagues</li>
        <li>Auto-generated match URLs</li>
      </ul>
      <h2>Page Architecture</h2>
      <ul>
        <li><code>/live</code> for realtime scoreboards</li>
        <li><code>/sport/{sport}</code> for sport hubs</li>
        <li><code>/{sport}/live/{team-vs-team}</code> for live match pages</li>
        <li><code>/{sport}/results/{team-vs-team}</code> for finished results</li>
        <li><code>/history</code> for long-term match archive</li>
      </ul>
      <h2>Transparency Snapshot</h2>
      <ul>
        <li>${escapeHtml(formatCompactNumber(trust.monthlyUsers))}+ projected monthly users</li>
        <li>${escapeHtml(String(trust.countries))}+ countries reached</li>
        <li>${escapeHtml(formatCompactNumber(trust.indexedPages))}+ projected indexable pages/year</li>
      </ul>
      <p>Support options: <a data-link href="/donate">Donate</a> and <a data-link href="/advertise">Advertise</a>.</p>
    `
  });
}

function renderContactPage() {
  renderArticlePage({
    title: "Contact",
    lead: "Reach out for support, data corrections, and partnerships.",
    path: "/contact",
    description: "Contact details for LiveScoreFree.",
    keywords: ["contact livescorefree", "support"],
    bodyHtml: `
      <p>Email: hello@livescorefree.com</p>
      <p>Data corrections: support@livescorefree.com</p>
      <p>Advertising: ads@livescorefree.com</p>
      <p>Partnerships: partnerships@livescorefree.com</p>
    `
  });
}

function renderNotFoundPage() {
  const main = qs("#main");
  if (!main) {
    return;
  }

  main.innerHTML = `
    <div class="message-box">
      <h2>Page not found</h2>
      <p>The route is not available. Use Home or Live Score Now.</p>
      <p><a class="btn" data-link href="/home">Go to Home</a></p>
    </div>
  `;

  setSeo({
    title: "Page Not Found | LiveScoreFree",
    description: "Requested page not found on LiveScoreFree.",
    keywords: ["page not found"],
    path: state.activePath
  });
}

function needsDataRoute(routeType) {
  return ["home", "live", "upcoming", "trending", "results", "history", "top-leagues", "league", "sport", "match", "team", "player"].includes(routeType);
}

async function renderRoute() {
  const path = getCurrentPath();
  state.activePath = path;

  const route = parseRoute(path);
  markActiveNav(path);
  updateHeaderQuickNav(route);
  configureMatchDetailRefresh(route);
  applyBackgroundForRoute(route);

  if (route.type === "redirect") {
    navigate(route.to, true);
    return;
  }

  if (state.loading && needsDataRoute(route.type)) {
    const main = qs("#main");
    if (main) {
      main.innerHTML = '<div class="message-box">Loading live score feeds...</div>';
    }
    setSeo({
      title: "Loading Live Scores | LiveScoreFree",
      description: "Loading live scores and match pages.",
      keywords: ["live scores"],
      path
    });
    updateLanguageControls();
    updateLastUpdatedLabel();
    return;
  }

  if (route.type === "home") {
    renderHomePage();
  } else if (route.type === "live") {
    renderLivePage();
  } else if (route.type === "upcoming") {
    renderUpcomingPage();
  } else if (route.type === "trending") {
    renderTrendingPage();
  } else if (route.type === "results") {
    renderResultsPage();
  } else if (route.type === "history") {
    renderHistoryPage();
  } else if (route.type === "top-leagues") {
    renderTopLeaguesPage();
  } else if (route.type === "league") {
    await renderLeaguePage(route.leagueKey, route.section);
  } else if (route.type === "sport") {
    renderSportPage(route.sport);
  } else if (route.type === "match") {
    await renderMatchPage(route);
  } else if (route.type === "team") {
    await renderTeamPage(route);
  } else if (route.type === "player") {
    await renderPlayerPage(route);
  } else if (route.type === "donate") {
    renderDonationPage();
  } else if (route.type === "feedback") {
    renderFeedbackPage();
  } else if (route.type === "advertise") {
    renderAdvertisePage();
  } else if (route.type === "privacy-policy") {
    renderPrivacyPage();
  } else if (route.type === "terms-of-service") {
    renderTermsPage();
  } else if (route.type === "data-sources") {
    renderDataSourcesPage();
  } else if (route.type === "dmca-policy") {
    renderDmcaPage();
  } else if (route.type === "about") {
    renderAboutPage();
  } else if (route.type === "contact") {
    renderContactPage();
  } else {
    renderNotFoundPage();
  }

  renderGlobalShareWidget();
  updateLanguageControls();
  updateLastUpdatedLabel();
  wireNotificationControls();
  maybeShowSupportPopup(route);
}
function updateProgressBar() {
  const bar = qs("#top-progress-bar");
  if (!bar) {
    return;
  }
  const duration = REFRESH_INTERVAL_MS;
  const elapsed = duration - Math.max(0, state.nextRefreshAt - Date.now());
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  bar.style.transform = `scaleX(${progress})`;
}

function wireGlobalEvents() {
  document.addEventListener("click", async (event) => {
    if (event.target.id === "support-popup") {
      dismissSupportPopup();
      return;
    }

    if (event.target.closest("#search-trigger") || event.target.closest("#search-close") || event.target.closest("#nav-search-link")) {
      event.preventDefault();
      if (event.target.closest("#nav-search-link")) {
        closeMobileNav();
      }
      toggleSearch();
      return;
    }

    const shareNativeButton = event.target.closest("[data-share-native]");
    if (shareNativeButton) {
      event.preventDefault();
      await handleNativeShare();
      return;
    }

    const shareCopyButton = event.target.closest("[data-share-copy]");
    if (shareCopyButton) {
      event.preventDefault();
      await handleCopyShareLink();
      return;
    }

    const popupClose = event.target.closest("[data-popup-close]");
    if (popupClose) {
      event.preventDefault();
      dismissSupportPopup();
      return;
    }

    const teamRouteButton = event.target.closest("[data-team-route]");
    if (teamRouteButton) {
      event.preventDefault();
      event.stopPropagation();
      const teamRoute = teamRouteButton.getAttribute("data-team-route") || "";
      if (teamRoute.startsWith("/")) {
        navigate(teamRoute);
      }
      return;
    }

    const playerRouteButton = event.target.closest("[data-player-route]");
    if (playerRouteButton) {
      event.preventDefault();
      event.stopPropagation();
      const playerRoute = playerRouteButton.getAttribute("data-player-route") || "";
      if (playerRoute.startsWith("/")) {
        navigate(playerRoute);
      }
      return;
    }

    const favoriteMatchButton = event.target.closest("[data-favorite-match]");
    if (favoriteMatchButton) {
      event.preventDefault();
      const favoriteKey = favoriteMatchButton.getAttribute("data-favorite-match") || "";
      const favoriteNow = toggleFavoriteKey(favoriteKey);
      favoriteMatchButton.classList.toggle("active", favoriteNow);
      favoriteMatchButton.textContent = favoriteNow ? "Saved" : "Favorite";
      showToast(favoriteNow ? "Match saved to favorites." : "Match removed from favorites.");
      return;
    }

    const reminderButton = event.target.closest("[data-match-reminder]");
    if (reminderButton) {
      event.preventDefault();
      const matchStatus = reminderButton.getAttribute("data-match-status") || "";
      if (matchStatus !== "upcoming") {
        showToast("Reminders are available for upcoming matches only.");
        return;
      }

      if (!canUseBrowserNotifications()) {
        showToast("Notifications are not supported in this browser.");
        return;
      }

      if (Notification.permission === "denied") {
        showToast("Notifications are blocked. Enable them in browser site settings.");
        return;
      }

      if (Notification.permission !== "granted") {
        const ok = await requestNotificationAccess();
        if (!ok) {
          return;
        }
      }

      state.notificationPrefs.enabled = true;
      const reminderKey = reminderButton.getAttribute("data-match-reminder") || "";
      const enabledNow = toggleReminderByKey(reminderKey);
      updateReminderButtonState(reminderButton, enabledNow);

      if (enabledNow) {
        showToast(`Reminder enabled (${state.notificationPrefs.leadMinutes} min before start).`);
        triggerMatchNotifications();
      } else {
        showToast("Reminder removed for this match.");
      }
      return;
    }

    const link = event.target.closest("a[data-link]");
    if (!link) {
      return;
    }

    const href = link.getAttribute("href") || "";
    if (!href.startsWith("/")) {
      return;
    }

    if (isTouchMenuInfoEnabled() && link.hasAttribute("data-nav")) {
      const now = Date.now();
      const armedUntil = Number(link.getAttribute("data-touch-armed-until") || 0);
      if (now > armedUntil) {
        event.preventDefault();
        const navPath = link.getAttribute("data-nav") || href;
        const infoText = NAV_TOUCH_INFO[navPath] || "Open this section.";
        link.setAttribute("data-touch-armed-until", String(now + 2200));
        showTouchMenuInfo(link, infoText);
        return;
      }
    }

    event.preventDefault();

    const overlay = qs("#search-overlay");
    if (overlay && !overlay.hasAttribute("hidden")) {
      toggleSearch();
    }

    dismissSupportPopup();
    navigate(href);
  });

  window.addEventListener("popstate", () => {
    hideTouchMenuInfo();
    renderRoute();
  });

  window.addEventListener("hashchange", () => {
    if (window.location.protocol === "file:" || window.location.hash.startsWith("#/")) {
      hideTouchMenuInfo();
      renderRoute();
    }
  });

  window.addEventListener("scroll", () => {
    hideTouchMenuInfo();
  }, { passive: true });

  window.addEventListener("resize", () => {
    hideTouchMenuInfo();
  });

  window.addEventListener("keydown", (event) => {
    const routeTarget = event.target?.closest?.("[data-team-route], [data-player-route]");
    if (routeTarget && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      const routePath = routeTarget.getAttribute("data-team-route") || routeTarget.getAttribute("data-player-route") || "";
      if (routePath.startsWith("/")) {
        navigate(routePath);
      }
      return;
    }
    if (event.key === "Escape") {
      dismissSupportPopup();
      const overlay = qs("#search-overlay");
      if (overlay && !overlay.hasAttribute("hidden")) {
        toggleSearch();
      }
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "search-input") {
      executeSearch(event.target.value);
    }
  });

  const themeToggle = qs("#theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", cycleThemeMode);
  }

  const mobileToggle = qs("#mobile-nav-toggle");
  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      const nav = qs("#main-nav");
      if (!nav) {
        return;
      }
      const open = nav.classList.toggle("open");
      mobileToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  const navBackButton = qs("#nav-back-btn");
  if (navBackButton) {
    navBackButton.addEventListener("click", () => {
      const current = getCurrentPath();
      window.history.back();
      setTimeout(() => {
        if (getCurrentPath() === current) {
          navigate("/home", true);
        }
      }, 120);
    });
  }

  const navHomeButton = qs("#nav-home-btn");
  if (navHomeButton) {
    navHomeButton.addEventListener("click", () => {
      dismissSupportPopup();
      navigate("/home");
    });
  }

  const languageSelect = qs("#language-select");
  if (languageSelect) {
    languageSelect.addEventListener("change", (event) => {
      const next = event.target.value === "auto" ? "auto" : normalizeLanguageCode(event.target.value);
      state.languagePreference = next;
      localStorage.setItem(LANGUAGE_KEY, next);
      updateLanguageControls();
      showToast(next === "auto" ? "Language set to auto detect." : `Language set to ${SUPPORTED_LANGUAGES[next] || next}.`);
    });
  }

  const translateButton = qs("#translate-btn");
  if (translateButton) {
    translateButton.addEventListener("click", () => {
      openGoogleTranslateForCurrentPage();
    });
  }

  const bgModeToggle = qs("#bg-mode-toggle");
  if (bgModeToggle) {
    bgModeToggle.addEventListener("click", () => {
      toggleBackgroundMode();
    });
  }

  const bgUploadInput = qs("#bg-upload");
  if (bgUploadInput) {
    bgUploadInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      handleBackgroundUpload(file);
      event.target.value = "";
    });
  }
}

function handleRouteFromQueryFallback() {
  const params = new URLSearchParams(window.location.search);
  const fallbackPath = params.get("route");
  if (!fallbackPath) {
    return;
  }

  const normalized = normalizePath(fallbackPath);

  if (window.location.protocol === "file:") {
    window.location.hash = normalized;
  } else {
    window.history.replaceState({}, "", normalized);
  }
}

function migrateLegacyHashPath() {
  if (window.location.hash.startsWith("#/")) {
    const normalized = normalizePath(decodeURIComponent(window.location.hash.slice(1)));
    if (window.location.protocol !== "file:") {
      window.history.replaceState({}, "", normalized);
    }
  }
}

function renderHeaderSearchControl() {
  const header = qs("header") || qs(".main-header");
  if (!header) return;

  const searchTrigger = qs("#search-trigger", header);
  if (searchTrigger) {
    searchTrigger.remove();
  }

  const nav = qs("#main-nav");
  if (nav) {
    const navSearchLink = qs("#nav-search-link", nav);
    if (navSearchLink) {
      navSearchLink.remove();
    }
  }
}

function renderSearchOverlay() {
  if (qs("#search-overlay")) return;

  const el = document.createElement("div");
  el.id = "search-overlay";
  el.className = "search-overlay";
  el.setAttribute("hidden", "");
  el.innerHTML = `
    <div class="search-container">
      <div class="search-header">
        <input type="text" id="search-input" placeholder="Search teams, leagues, sports..." aria-label="Search" autocomplete="off">
        <button id="search-close" type="button" class="btn btn-primary">Close</button>
      </div>
      <div id="search-results" class="search-results"></div>
    </div>
    <style>
      .search-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(var(--bg-rgb, 7, 19, 34), 0.88);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 2000;
        padding: 20px;
        display: flex;
        flex-direction: column;
        opacity: 1;
        transition: opacity 0.2s ease-in-out;
      }
      .search-overlay[hidden] {
        display: none;
        opacity: 0;
      }
      .search-container { max-width: 600px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; height: 100%; }
      .search-header { display: flex; gap: 10px; margin-bottom: 20px; }
      #search-input {
        flex: 1; padding: 12px; font-size: 16px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        color: var(--text);
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      #search-input:focus {
        border-color: rgba(var(--page-context-accent-rgb, 79, 181, 255), 0.8);
        box-shadow: 0 0 0 3px rgba(var(--page-context-accent-rgb, 79, 181, 255), 0.2);
        outline: none;
      }
      #search-results { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
      .search-result-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--surface); border-radius: 8px; text-decoration: none; color: var(--text); border: 1px solid transparent; transition: background-color 0.2s, border-color 0.2s; }
      .search-result-item:hover, .search-result-item:focus { background: var(--surface-soft); border-color: var(--line); outline: none; }
      .search-result-info { display: flex; flex-direction: column; }
      .search-result-type { font-size: 0.75em; opacity: 0.7; text-transform: uppercase; }
    </style>
  `;
  document.body.appendChild(el);
}

function toggleSearch() {
  renderSearchOverlay();
  const overlay = qs("#search-overlay");
  const input = qs("#search-input");
  if (!overlay) return;

  const isHidden = overlay.hasAttribute("hidden");
  if (isHidden) {
    overlay.removeAttribute("hidden");
    if (input) {
      input.value = "";
      input.focus();
      qs("#search-results").innerHTML = "";
    }
    document.body.style.overflow = "hidden";
  } else {
    overlay.setAttribute("hidden", "");
    document.body.style.overflow = "";
  }
}

function executeSearch(query) {
  const term = String(query || "").toLowerCase().trim();
  const container = qs("#search-results");
  if (!container) return;

  if (term.length < 2) {
    container.innerHTML = '<div class="message-box">Type at least 2 characters to search.</div>';
    return;
  }

  const hits = [];
  const seen = new Set();

  for (const [key, group] of Object.entries(SPORT_GROUPS)) {
    if (group.label.toLowerCase().includes(term) || key.includes(term)) {
      hits.push({ type: "Sport", label: group.label, route: `/sport/${key}`, icon: group.icon, isImage: false });
    }
  }

  for (const [key, league] of Object.entries(LEAGUES)) {
    if (league.label.toLowerCase().includes(term)) {
      const sport = league.sportGroup || "football";
      hits.push({ type: "League", label: league.label, route: routeForLeague(key), icon: getLeagueIconPath(key, sport), isImage: true });
    }
  }

  const allMatches = [...state.matches, ...state.history];
  for (const match of allMatches) {
    if (hits.length > 24) break;
    
    const homeNorm = slugify(match.homeName);
    if (!seen.has(`team:${homeNorm}`) && match.homeName.toLowerCase().includes(term)) {
      seen.add(`team:${homeNorm}`);
      hits.push({ 
        type: "Team", 
        label: match.homeName, 
        route: routeForTeam({ sportGroup: match.sportGroup, teamId: match.homeTeamId, teamName: match.homeName }),
        icon: match.homeLogo, 
        isImage: !!match.homeLogo
      });
    }

    const awayNorm = slugify(match.awayName);
    if (!seen.has(`team:${awayNorm}`) && match.awayName.toLowerCase().includes(term)) {
      seen.add(`team:${awayNorm}`);
      hits.push({ 
        type: "Team", 
        label: match.awayName, 
        route: routeForTeam({ sportGroup: match.sportGroup, teamId: match.awayTeamId, teamName: match.awayName }),
        icon: match.awayLogo,
        isImage: !!match.awayLogo
      });
    }
  }
  
  if (!hits.length) {
    container.innerHTML = '<div class="message-box">No results found.</div>';
    return;
  }
  
  container.innerHTML = hits.map(hit => `
    <a href="${escapeHtml(hit.route)}" class="search-result-item" data-link>
      ${hit.isImage ? `<img src="${escapeHtml(hit.icon)}" style="width:32px;height:32px;object-fit:contain;" alt="" loading="lazy">` : `<span style="font-size:20px;">${escapeHtml(hit.icon || "🛡️")}</span>`}
      <div class="search-result-info">
        <strong>${escapeHtml(hit.label)}</strong>
        <span class="search-result-type">${escapeHtml(hit.type)}</span>
      </div>
    </a>
  `).join("");
}

function renderFooterContent() {
  const footer = qs("#main-footer") || qs("footer");
  if (!footer) return;

  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="footer-grid">
      <div class="footer-column">
        <h3>LiveScoreFree</h3>
        <p class="footer-lead">Free community-powered scoreboard with fast live updates, upcoming fixtures, top leagues, and auto-generated match pages built for fans worldwide.</p>
      </div>
      <div class="footer-column">
        <h4 class="footer-heading"><span class="footer-heading-icon" aria-hidden="true">&#127760;</span><span>Core</span></h4>
        <a data-link href="/home">Home</a>
        <a data-link href="/live">Live Score Now</a>
        <a data-link href="/upcoming">Upcoming Matches</a>
        <a data-link href="/trending">Trending Matches</a>
        <a data-link href="/results">Today's Matches</a>
        <a data-link href="/top-leagues">Top Leagues</a>
        <a data-link href="/history">Match History</a>
      </div>
      <div class="footer-column">
        <h4 class="footer-heading"><span class="footer-heading-icon" aria-hidden="true">&#10084;</span><span>Community</span></h4>
        <a data-link href="/donate">Donate (Ko-fi)</a>
        <a data-link href="/advertise">Advertise</a>
        <a data-link href="/feedback">Feedback</a>
        <a data-link href="/about">About</a>
        <a data-link href="/contact">Contact</a>
      </div>
      <div class="footer-column">
        <h4 class="footer-heading"><span class="footer-heading-icon" aria-hidden="true">&#9878;</span><span>Legal Safety</span></h4>
        <a data-link href="/privacy-policy">Privacy Policy</a>
        <a data-link href="/terms-of-service">Terms of Service</a>
        <a data-link href="/data-sources">Data Sources</a>
        <a data-link href="/dmca-policy">DMCA Policy</a>
      </div>
    </div>
    <div class="footer-meta">
      <p class="copyright">&copy; ${year} LiveScoreFree</p>
    </div>
  `;
}

async function init() {
  renderFooterContent();
  renderHeaderSearchControl();

  wireGlobalEvents();
  initTheme();
  loadHistory();
  loadFeedbackNotes();
  loadFavoriteMatches();
  loadNotificationPrefs();
  loadNotificationLog();
  loadLanguagePreference();
  loadBackgroundPreferences();
  updateLanguageControls();
  updateBackgroundControls();

  handleRouteFromQueryFallback();
  migrateLegacyHashPath();

  if (window.location.protocol === "file:") {
    if (!window.location.hash) {
      window.location.hash = "/home";
    }
  }

  await renderRoute();

  await refreshData({ silent: true });

  state.loading = false;
  await renderRoute();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // ignore registration failures
    });
  }

  setInterval(() => {
    const route = parseRoute(state.activePath);
    maybeShowSupportPopup(route);
  }, 60000);

  setInterval(async () => {
    await refreshData({ silent: true });
    const route = parseRoute(state.activePath);
    if (needsDataRoute(route.type)) {
      await renderRoute();
    }
  }, REFRESH_INTERVAL_MS);
}

init().catch((error) => {
  console.error(error);
  const main = qs("#main");
  if (main) {
    main.innerHTML = `<div class="message-box">Unexpected app error: ${escapeHtml(error.message || "unknown")}</div>`;
  }
});
