// Synchronized Global Data Sources
export const LSF_CONFIG = window.LSF_CONFIG || {
  api: {
    live: "/api/live",
    match: "/api/match",
    upcoming: "/api/upcoming",
    info: "/api/info"
  },
  sources: {
    espn: "https://site.api.espn.com",
    espn_core: "https://sports.core.api.espn.com",
    espn_cdn: "https://cdn.espn.com",
    sportsdb: "https://www.thesportsdb.com/api/v1/json/123"
  }
};

export const ESPN_BASE = `${LSF_CONFIG.sources.espn}/apis/site/v2/sports`;
export const ESPN_CORE_BASE = LSF_CONFIG.sources.espn_core;
export const ESPN_CDN_BASE = LSF_CONFIG.sources.espn_cdn;
export const SPORTSDB_BASE = LSF_CONFIG.sources.sportsdb;
export const CRICBUZZ_LIVE_URL = "/api/cricket-live";
export const NHL_LIVE_URL = "/api/nhl-live";
export const MLB_LIVE_URL = "/api/mlb-live";
export const REFRESH_INTERVAL_MS = 15000;
export const MATCH_DETAIL_REFRESH_MS = 12000;

export const HISTORY_KEY = "lsf_history_v3";
export const FEEDBACK_KEY = "lsf_feedback_v1";
export const THEME_KEY = "lsf_theme_preference";
export const FAVORITES_KEY = "lsf_favorites_v1";
export const NOTIFICATION_PREFS_KEY = "lsf_notification_prefs_v1";
export const NOTIFICATION_LOG_KEY = "lsf_notification_log_v1";
export const LANGUAGE_KEY = "lsf_language_preference";
export const SUPPORT_POPUP_KEY = "lsf_support_popup_last_shown";
export const SUPPORT_POPUP_INTERVAL_MS = 1000 * 60 * 22;
export const APP_BOOT_TS = Date.now();
export const BACKGROUND_MODE_KEY = "lsf_background_mode";
export const CUSTOM_BACKGROUND_KEY = "lsf_custom_background";
export const PWA_PROMPT_KEY = "lsf_pwa_prompt_dismissed_v1";
export const PWA_INSTALLED_KEY = "lsf_pwa_installed_v1";
export const BACKGROUND_ROTATION_MS = 22000;
export const BACKGROUND_SCENE_GROUPS = {
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
export const SPORT_DISPLAY_NAMES = {
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
  afl: "🏉 Aussie Rules",
  lacrosse: "🥍 Lacrosse",
  volleyball: "🏐 Volleyball",
  waterpolo: "🤽 Water Polo",
  fieldhockey: "🏑 Field Hockey",
  rugbyleague: "🏉 Rugby League",
  default: "🏆 Sports"
};
export const LEAGUE_DISPLAY_NAMES = {
  "eng.1": "⚽ Premier League",
  "esp.1": "⚽ La Liga",
  "uefa.champions": "⚽ Champions League",
  "ita.1": "⚽ Serie A",
  "ger.1": "⚽ Bundesliga",
  "fra.1": "⚽ Ligue 1",
  "ned.1": "⚽ Eredivisie",
  "por.1": "⚽ Primeira Liga",
  "eng.fa": "⚽ FA Cup",
  "eng.league_cup": "⚽ Carabao Cup",
  "uefa.europa": "⚽ Europa League",
  "usa.1": "⚽ MLS",
  "mex.1": "⚽ Liga MX",
  "bra.1": "⚽ Brasileirão",
  "arg.1": "⚽ Primera División",
  "cricket": "🏏 Cricket",
  "nba": "🏀 NBA",
  "ncaamb": "🏀 NCAA Basketball",
  "wnba": "🏀 WNBA",
  "fiba": "🏀 FIBA World Cup",
  "tennis": "🎾 Tennis",
  "atp": "🎾 ATP Tour",
  "wta": "🎾 WTA Tour",
  "nfl": "🏈 NFL",
  "college-football": "🏈 NCAA Football",
  "nhl": "🏒 NHL",
  "mens-college-hockey": "🏒 NCAA Hockey",
  "mlb": "⚾ MLB",
  "college-baseball": "⚾ NCAA Baseball",
  "pga": "⛳ PGA TOUR",
  "lpga": "⛳ LPGA",
  "liv": "⛳ LIV Golf",
  "rugby": "🏉 Rugby",
  "mma": "🥊 MMA / UFC",
  "f1": "🏎️ Formula 1",
  "irl": "🏎️ IndyCar",
  "default": "🏆 Sports"
};
export const LEAGUE_VISUAL_MATCHERS = {
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
export const SPORT_CONTEXT_TONES = {
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
  golf: { accent: "132 228 95", glow: "57 181 74" },
  
  // New ESPN Sports Tones
  afl: { accent: "255 75 87", glow: "79 181 255" },
  lacrosse: { accent: "79 181 255", glow: "255 130 64" },
  rugbyleague: { accent: "255 97 84", glow: "57 181 74" },
  fieldhockey: { accent: "47 149 64", glow: "255 182 72" },
  volleyball: { accent: "132 228 95", glow: "79 181 255" },
  waterpolo: { accent: "66 163 255", glow: "57 181 74" },
  
  default: { accent: "79 181 255", glow: "57 181 74" }
};
export const LEAGUE_PAGE_SECTIONS = ["overview", "live", "upcoming", "results", "history", "teams", "players", "schedule"];
export const MATCH_TABS = [
  { id: "summary", label: "Summary" },
  { id: "stats", label: "Stats" },
  { id: "lineups", label: "Lineups" },
  { id: "standings", label: "Table" },
  { id: "analysis", label: "Analysis" },
  { id: "preview", label: "Preview" },
  { id: "events", label: "Events" }
];
export const TEAM_TABS = [
  { id: "info", label: "Info" },
  { id: "live", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
  { id: "results", label: "Results" },
  { id: "squad", label: "Squad" },
  { id: "staff", label: "Staff" }
];
export const PLAYER_TABS = [
  { id: "bio", label: "Bio" },
  { id: "matches", label: "Matches" }
];

export const PROXIED_DATA_HOSTS = new Set([
  "site.api.espn.com",
  "sports.core.api.espn.com",
  "cdn.espn.com",
  "www.thesportsdb.com",
  "gnews.io"
]);

export const LEAGUES = {
  "eng.1": { feed: "soccer/eng.1", label: "Premier League", sportGroup: "football" },
  "esp.1": { feed: "soccer/esp.1", label: "La Liga", sportGroup: "football" },
  "uefa.champions": { feed: "soccer/uefa.champions", label: "UEFA Champions League", sportGroup: "football" },
  "uefa.europa": { feed: "soccer/uefa.europa", label: "UEFA Europa League", sportGroup: "football" },
  "ita.1": { feed: "soccer/ita.1", label: "Serie A", sportGroup: "football" },
  "ger.1": { feed: "soccer/ger.1", label: "Bundesliga", sportGroup: "football" },
  "fra.1": { feed: "soccer/fra.1", label: "Ligue 1", sportGroup: "football" },
  "ned.1": { feed: "soccer/ned.1", label: "Eredivisie", sportGroup: "football" },
  "por.1": { feed: "soccer/por.1", label: "Primeira Liga", sportGroup: "football" },
  "tur.1": { feed: "soccer/tur.1", label: "Süper Lig", sportGroup: "football" },
  "sco.1": { feed: "soccer/sco.1", label: "Scottish Premiership", sportGroup: "football" },
  "bel.1": { feed: "soccer/bel.1", label: "Belgian Pro League", sportGroup: "football" },
  "usa.1": { feed: "soccer/usa.1", label: "MLS", sportGroup: "football" },
  "mex.1": { feed: "soccer/mex.1", label: "Liga MX", sportGroup: "football" },
  "bra.1": { feed: "soccer/bra.1", label: "Brasileirão", sportGroup: "football" },
  "arg.1": { feed: "soccer/arg.1", label: "Primera División", sportGroup: "football" },
  "aus.1": { feed: "soccer/aus.1", label: "A-League", sportGroup: "football" },
  "eng.fa": { feed: "soccer/eng.fa", label: "FA Cup", sportGroup: "football" },
  "eng.league_cup": { feed: "soccer/eng.league_cup", label: "Carabao Cup", sportGroup: "football" },
  cricket: { feed: "cricket", label: "Cricket", sportGroup: "cricket" },
  nba: { feed: "basketball/nba", label: "NBA", sportGroup: "basketball" },
  ncaamb: { feed: "basketball/mens-college-basketball", label: "NCAA Basketball", sportGroup: "basketball" },
  wnba: { feed: "basketball/wnba", label: "WNBA", sportGroup: "basketball" },
  "nba-development": { feed: "basketball/nba-development", label: "G League", sportGroup: "basketball" },
  fiba: { feed: "basketball/fiba", label: "FIBA World Cup", sportGroup: "basketball" },
  tennis: { feed: "tennis", label: "Tennis", sportGroup: "tennis" },
  atp: { feed: "tennis/atp", label: "ATP Tour", sportGroup: "tennis" },
  wta: { feed: "tennis/wta", label: "WTA Tour", sportGroup: "tennis" },
  nfl: { feed: "football/nfl", label: "NFL", sportGroup: "nfl" },
  "college-football": { feed: "football/college-football", label: "NCAA Football", sportGroup: "nfl" },
  ufl: { feed: "football/ufl", label: "UFL", sportGroup: "nfl" },
  nhl: { feed: "hockey/nhl", label: "NHL", sportGroup: "hockey" },
  "mens-college-hockey": { feed: "hockey/mens-college-hockey", label: "NCAA Hockey", sportGroup: "hockey" },
  mlb: { feed: "baseball/mlb", label: "MLB", sportGroup: "baseball" },
  "college-baseball": { feed: "baseball/college-baseball", label: "NCAA Baseball", sportGroup: "baseball" },
  pga: { feed: "golf/pga", label: "PGA TOUR", sportGroup: "golf" },
  lpga: { feed: "golf/lpga", label: "LPGA", sportGroup: "golf" },
  liv: { feed: "golf/liv", label: "LIV Golf", sportGroup: "golf" },
  eur: { feed: "golf/eur", label: "DP World Tour", sportGroup: "golf" },
  rugby: { feed: "rugby", label: "Rugby", sportGroup: "rugby" },
  mma: { feed: "mma/ufc", label: "MMA / UFC", sportGroup: "mma" },
  f1: { feed: "racing/f1", label: "Formula 1", sportGroup: "f1" },
  irl: { feed: "racing/irl", label: "IndyCar", sportGroup: "f1" },
  "nascar-premier": { feed: "racing/nascar-premier", label: "NASCAR Cup", sportGroup: "f1" },
  
  // New Missing ESPN Sports
  afl: { feed: "australian-football/afl", label: "Aussie Rules (AFL)", sportGroup: "afl" },
  pll: { feed: "lacrosse/pll", label: "Premier Lacrosse League", sportGroup: "lacrosse" },
  "mens-college-lacrosse": { feed: "lacrosse/mens-college-lacrosse", label: "NCAA Mens Lacrosse", sportGroup: "lacrosse" },
  "rugby-league": { feed: "rugby-league/nrl", label: "NRL (Rugby League)", sportGroup: "rugbyleague" },
  "field-hockey": { feed: "field-hockey/fih", label: "FIH Pro League", sportGroup: "fieldhockey" },
  "mens-college-volleyball": { feed: "volleyball/mens-college-volleyball", label: "NCAA Volleyball", sportGroup: "volleyball" },
  "mens-college-water-polo": { feed: "water-polo/mens-college-water-polo", label: "NCAA Water Polo", sportGroup: "waterpolo" }
};

export const TOP_LEAGUE_KEYS = ["eng.1", "esp.1", "uefa.champions", "uefa.europa", "ita.1", "ger.1", "fra.1", "por.1", "nba", "nfl", "cricket", "tennis", "mlb", "nhl", "pga", "f1", "atp"];
export const LEAGUE_REGIONS = {
  "eng.1": "England",
  "esp.1": "Spain",
  "uefa.champions": "Europe",
  "uefa.europa": "Europe",
  "ita.1": "Italy",
  "ger.1": "Germany",
  "fra.1": "France",
  "ned.1": "Netherlands",
  "por.1": "Portugal",
  "tur.1": "Turkey",
  "sco.1": "Scotland",
  "bel.1": "Belgium",
  "usa.1": "United States",
  "mex.1": "Mexico",
  "bra.1": "Brazil",
  "arg.1": "Argentina",
  "aus.1": "Australia",
  cricket: "International",
  nba: "United States",
  ncaamb: "United States",
  wnba: "United States",
  tennis: "International",
  nfl: "United States",
  nhl: "North America",
  mlb: "United States",
  rugby: "International",
  mma: "International",
  f1: "International",
  
  // New ESPN Leagues Regions
  afl: "Australia",
  pll: "United States",
  "mens-college-lacrosse": "United States",
  "rugby-league": "International",
  "field-hockey": "International",
  "mens-college-volleyball": "United States",
  "mens-college-water-polo": "United States"
};

export const SPORT_GROUPS = {
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
  f1: { label: "F1", icon: "F1", leagues: ["f1", "irl", "nascar-premier"], description: "Formula 1 and racing live coverage." },
  golf: { label: "Golf", icon: "GLF", leagues: ["pga", "lpga", "liv", "eur"], description: "Golf live tour coverage." },
  
  // New ESPN Sports
  afl: { label: "Aussie Rules", icon: "AFL", leagues: ["afl"], description: "AFL live score coverage." },
  lacrosse: { label: "Lacrosse", icon: "LAX", leagues: ["pll", "mens-college-lacrosse"], description: "Lacrosse live scores and schedule." },
  rugbyleague: { label: "Rugby League", icon: "NRL", leagues: ["rugby-league"], description: "NRL live score coverage." },
  fieldhockey: { label: "Field Hockey", icon: "FIH", leagues: ["field-hockey"], description: "FIH live coverage." },
  volleyball: { label: "Volleyball", icon: "VBL", leagues: ["mens-college-volleyball"], description: "Volleyball live scores." },
  waterpolo: { label: "Water Polo", icon: "WTP", leagues: ["mens-college-water-polo"], description: "Water Polo live scores." }
};

export const SPORT_IMAGE_MAP = {
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
  golf: "sport-default.svg",
  
  // New ESPN Sports image mapping
  afl: "sport-default.svg",
  lacrosse: "sport-default.svg",
  rugbyleague: "sport-default.svg",
  fieldhockey: "sport-default.svg",
  volleyball: "sport-default.svg",
  waterpolo: "sport-default.svg",
  
  default: "sport-default.svg"
};

export const LEAGUE_IMAGE_MAP = {
  "eng.1":          "https://www.thesportsdb.com/images/media/league/banner/i6o0kh1549879062.jpg",
  "esp.1":          "https://www.thesportsdb.com/images/media/league/banner/ocw5uc1549040374.jpg",
  "uefa.champions": "https://www.thesportsdb.com/images/media/league/banner/qyxfq01623762927.jpg",
  "ita.1":          "https://www.thesportsdb.com/images/media/league/banner/bksvyw1549879527.jpg",
  "ger.1":          "https://www.thesportsdb.com/images/media/league/banner/d7t9nq1549879432.jpg",
  "fra.1":          "https://www.thesportsdb.com/images/media/league/banner/8lgehr1549879368.jpg",
  "ned.1":          "https://www.thesportsdb.com/images/media/league/banner/jrtvhv1549879620.jpg",
  "por.1":          "https://www.thesportsdb.com/images/media/league/banner/7onmyv1576065525.jpg",
  "sco.1":          "https://www.thesportsdb.com/images/media/league/banner/gsqywj1519478915.jpg",
  "mex.1":          "https://www.thesportsdb.com/images/media/league/banner/muyqhv1549879544.jpg",
  "usa.1":          "https://www.thesportsdb.com/images/media/league/banner/nwqgqy1549879668.jpg",
  "bra.1":          "https://www.thesportsdb.com/images/media/league/banner/ptqqus1549879283.jpg",
  "arg.1":          "https://www.thesportsdb.com/images/media/league/banner/ouxx431549879218.jpg",
  "uefa.europa":    "https://www.thesportsdb.com/images/media/league/banner/l3j0151623762951.jpg",
  "uefa.conference":"https://www.thesportsdb.com/images/media/league/banner/vxgsyq1623762964.jpg",
  nba:              "https://www.thesportsdb.com/images/media/league/banner/teywwv1423166995.jpg",
  ncaamb:           "https://www.thesportsdb.com/images/media/league/banner/teywwv1423166995.jpg",
  nfl:              "https://www.thesportsdb.com/images/media/league/banner/ydwwur1432498866.jpg",
  mlb:              "https://www.thesportsdb.com/images/media/league/banner/xpypvv1431540526.jpg",
  nhl:              "https://www.thesportsdb.com/images/media/league/banner/yyvvtu1448813151.jpg",
  cricket:          "https://www.thesportsdb.com/images/media/league/banner/c6ccc01548545456.jpg",
  ipl:              "https://www.thesportsdb.com/images/media/league/banner/c6ccc01548545456.jpg",
  tennis:           "https://www.thesportsdb.com/images/media/league/banner/qqqyyy1418740917.jpg",
  wta:              "https://www.thesportsdb.com/images/media/league/banner/qqqyyy1418740917.jpg",
  rugby:            "https://www.thesportsdb.com/images/media/league/banner/yvwvtu1448813185.jpg",
  mma:              "https://www.thesportsdb.com/images/media/league/banner/vupwuv1511099295.jpg",
  f1:               "https://www.thesportsdb.com/images/media/league/banner/yvwvtu1448813185.jpg",
  default:          "https://www.thesportsdb.com/images/media/league/banner/yvwvtu1448813185.jpg"
};

export const SPORT_ALIASES = {
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
  f1: "f1",
  
  // New ESPN Sports Aliases
  afl: "afl",
  lacrosse: "lacrosse",
  rugbyleague: "rugbyleague",
  fieldhockey: "fieldhockey",
  volleyball: "volleyball",
  waterpolo: "waterpolo"
};

export const SPORTSDB_SPORTS = {
  football: "Soccer",
  cricket: "Cricket",
  basketball: "Basketball",
  tennis: "Tennis"
};

export const SEO_BASE = {
  site: "livescoreFree.online",
  origin: "https://livescoreFree.online"
};

export const GLOBAL_SEO_KEYWORDS = [
  "live score",
  "livescoreFree.online",
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

export const NAV_TOUCH_INFO = {
  "/home": "Home dashboard with live overview, leagues, and sport hubs.",
  "/live": "Live Score Now page with only currently live matches.",
  "/upcoming": "Upcoming matches with kickoff times and pre-match pages.",
  "/trending": "Most active and trending matches across top competitions.",
  "/results": "Today's completed matches and latest final scores.",
  "/top-leagues": "Top leagues with dedicated pages, fixtures, teams, and player info.",
  "/history": "Past matches archive with stored results and details."
};

export const DONATION_MONTHLY_GOAL_USD = 120;
export const DONATION_BASE_SUPPORT_USD = 54;
export const DONATION_KOFI_URL = "https://ko-fi.com/livescorefree";
export const TRUST_SIGNAL_BASELINE = {
  monthlyUsers: 50000,
  countries: 120
};

export const SUPPORTED_LANGUAGES = {
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





