var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/_shared.js
var FALLBACK_LOGO = "/icons/icon-192.png";
var IPL_SERIES_ID = "8048";
var IPL_SEASON = "2026";
var IPL_SQUAD_ARTICLE_URL = "https://www.espn.in/cricket/story/_/id/47324999/ipl-2026-how-csk-dc-gt-kkr-lsg-mi-pbks-rcb-rr-srh-stack-auction";
var BACKEND_CONFIG = {
  sources: {
    espn_site: "https://site.api.espn.com/apis/site/v2",
    espn_core: "https://sports.core.api.espn.com/v2",
    espn_web: "https://site.web.api.espn.com/apis/site/v2",
    espn_web_v2: "https://site.web.api.espn.com/apis/v2"
  },
  defaults: {
    sport: "soccer",
    league: "eng.1"
  }
};
var IN_FLIGHT_REQUESTS = /* @__PURE__ */ new Map();
var IN_FLIGHT_TEXT_REQUESTS = /* @__PURE__ */ new Map();
var SPORT_LEAGUES = {
  soccer: [
    "eng.1",
    "esp.1",
    "ger.1",
    "ita.1",
    "fra.1",
    "usa.1",
    "mex.1",
    "ned.1",
    "por.1",
    "bel.1",
    "tur.1",
    "arg.1",
    "bra.1",
    "ksa.1",
    "jpn.1",
    "uefa.champions",
    "uefa.europa",
    "uefa.europa.conf",
    "uefa.nations",
    "fifa.world",
    "fifa.worldq.uefa",
    "fifa.friendly",
    "conmebol.america",
    "caf.nations",
    "afc.asian.cup",
    "concacaf.gold"
  ],
  football: ["nfl", "college-football", "ufl", "xfl", "cfl"],
  basketball: [
    "nba",
    "wnba",
    "mens-college-basketball",
    "womens-college-basketball",
    "fiba",
    "nba-development",
    "nbl",
    "euroleague"
  ],
  baseball: ["mlb", "college-baseball", "mexican-winter-league", "dominican-winter-league", "caribbean-series"],
  hockey: ["nhl", "mens-college-hockey", "womens-college-hockey", "hockey-world-cup"],
  cricket: ["icc.t20", "ipl", "icc.odi", "icc.test", "bbl", "psl", "cpl"],
  tennis: ["atp", "wta"],
  mma: ["ufc", "bellator", "ifc", "lfa", "ksw", "cage-warriors"],
  racing: ["f1", "irl", "nascar-premier", "nascar-secondary", "nascar-truck"],
  golf: ["pga", "lpga", "champions-tour", "dp-world-tour", "liv", "korn-ferry-tour"],
  rugby: ["164205", "180659", "267979", "242041", "289262"],
  "rugby-league": ["3"],
  volleyball: ["mens-college-volleyball", "womens-college-volleyball"],
  "water-polo": ["mens-college-water-polo", "womens-college-water-polo"],
  lacrosse: ["nll", "pll", "mens-college-lacrosse", "womens-college-lacrosse"],
  "field-hockey": ["ncaa-womens-field-hockey"],
  "australian-football": ["afl"]
};
var SPORT_ALIASES = {
  "american-football": "football",
  footbal: "football",
  futbol: "soccer",
  footballs: "soccer",
  soccer: "soccer",
  cricket: "cricket",
  basketball: "basketball",
  baseball: "baseball",
  hockey: "hockey",
  tennis: "tennis",
  mma: "mma",
  racing: "racing",
  golf: "golf",
  rugby: "rugby",
  "rugby-league": "rugby-league",
  volleyball: "volleyball",
  "water-polo": "water-polo",
  lacrosse: "lacrosse",
  "field-hockey": "field-hockey",
  "australian-football": "australian-football"
};
var LEAGUE_ALIASES = {
  mls: "usa.1",
  "saudi-pro-league": "ksa.1",
  "j-league": "jpn.1",
  "liga-mx": "mex.1",
  eredivisie: "ned.1",
  "premier-league": "eng.1",
  epl: "eng.1",
  laliga: "esp.1",
  "la-liga": "esp.1",
  bundesliga: "ger.1",
  "serie-a": "ita.1",
  "ligue-1": "fra.1",
  ucl: "uefa.champions",
  "champions-league": "uefa.champions",
  "europa-league": "uefa.europa",
  "conference-league": "uefa.europa.conf",
  "world-cup": "fifa.world",
  "saudi-pro": "ksa.1",
  "primeira-liga": "por.1",
  "liga-portugal": "por.1",
  "jupiler-pro-league": "bel.1",
  "super-lig": "tur.1",
  nfl: "nfl",
  nba: "nba",
  nhl: "nhl",
  mlb: "mlb",
  atp: "atp",
  wta: "wta",
  ufc: "ufc",
  f1: "f1",
  afl: "afl",
  ipl: "ipl",
  pga: "pga",
  lpga: "lpga"
};
function normalizeSportParam(inputSport = "all", inputLeague = "") {
  const sport = String(inputSport || "all").trim().toLowerCase();
  const league = normalizeLeagueParam(inputLeague);
  if (sport === "all") return "all";
  if (SPORT_ALIASES[sport]) return SPORT_ALIASES[sport];
  if (sport === "football") {
    if (league && SPORT_LEAGUES.football.includes(league)) return "football";
    return "football";
  }
  return sport;
}
__name(normalizeSportParam, "normalizeSportParam");
function normalizeLeagueParam(inputLeague = "", fallbackSport = "") {
  const league = String(inputLeague || "").trim().toLowerCase();
  if (!league) {
    return fallbackSport ? getDefaultLeague(fallbackSport) : "";
  }
  return LEAGUE_ALIASES[league] || league;
}
__name(normalizeLeagueParam, "normalizeLeagueParam");
function getDefaultLeague(sport = "soccer") {
  const normalizedSport = normalizeSportParam(sport);
  return SPORT_LEAGUES[normalizedSport]?.[0] || "eng.1";
}
__name(getDefaultLeague, "getDefaultLeague");
function getTargetSports(sportParam = "all", leagueParam = "") {
  const normalizedSport = normalizeSportParam(sportParam, leagueParam);
  if (normalizedSport === "all") {
    return ["soccer", "basketball", "football", "hockey", "baseball", "cricket", "tennis", "mma", "racing", "golf", "rugby", "rugby-league", "volleyball", "water-polo", "lacrosse", "field-hockey", "australian-football"];
  }
  return [normalizedSport];
}
__name(getTargetSports, "getTargetSports");
function siteApiUrl(sport, league, resource, query = {}) {
  const url = new URL(`${BACKEND_CONFIG.sources.espn_site}/sports/${sport}/${league}/${resource}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== void 0 && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}
__name(siteApiUrl, "siteApiUrl");
function coreApiUrl(sport, league, resource, query = {}) {
  const url = new URL(`${BACKEND_CONFIG.sources.espn_core}/sports/${sport}/leagues/${league}/${resource}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== void 0 && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}
__name(coreApiUrl, "coreApiUrl");
function siteWebApiUrl(path, query = {}, version = "site") {
  const base = version === "v2" ? BACKEND_CONFIG.sources.espn_web_v2 : BACKEND_CONFIG.sources.espn_web;
  const safePath = String(path || "").replace(/^\/+/, "");
  const url = new URL(`${base}/${safePath}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== void 0 && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}
__name(siteWebApiUrl, "siteWebApiUrl");
function isIplLeague(sport = "", league = "") {
  const normalizedSport = normalizeSportParam(sport, league);
  const normalizedLeague = String(league || "").trim().toLowerCase();
  return normalizedSport === "cricket" && normalizedLeague === "ipl";
}
__name(isIplLeague, "isIplLeague");
function getIplScoreboardUrl(query = {}) {
  const { dates, ...safeQuery } = query || {};
  return siteWebApiUrl(`sports/cricket/${IPL_SERIES_ID}/scoreboard`, {
    contentorigin: "espn",
    lang: "en",
    limit: 300,
    region: "us",
    season: IPL_SEASON,
    section: "cricinfo",
    sort: "events:asc",
    tz: "America/New_York",
    ...safeQuery
  });
}
__name(getIplScoreboardUrl, "getIplScoreboardUrl");
function getIplStandingsUrl(query = {}) {
  return siteWebApiUrl(`sports/cricket/${IPL_SERIES_ID}/standings`, {
    lang: "en",
    region: "us",
    season: IPL_SEASON,
    seasontype: 1,
    sort: "rank:asc",
    type: 0,
    ...query
  }, "v2");
}
__name(getIplStandingsUrl, "getIplStandingsUrl");
function getIplSquadArticleUrl() {
  return IPL_SQUAD_ARTICLE_URL;
}
__name(getIplSquadArticleUrl, "getIplSquadArticleUrl");
async function fetchJson(url, init = {}) {
  if (IN_FLIGHT_REQUESTS.has(url)) {
    return IN_FLIGHT_REQUESTS.get(url);
  }
  const promise = (async () => {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          "Accept": "application/json",
          "User-Agent": "LivescoreFree-Bot/2.0"
        }
      });
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} for ${url}`);
      }
      return await response.json();
    } finally {
      IN_FLIGHT_REQUESTS.delete(url);
    }
  })();
  IN_FLIGHT_REQUESTS.set(url, promise);
  return promise;
}
__name(fetchJson, "fetchJson");
async function fetchText(url, init = {}) {
  if (IN_FLIGHT_TEXT_REQUESTS.has(url)) {
    return IN_FLIGHT_TEXT_REQUESTS.get(url);
  }
  const promise = (async () => {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          Accept: "text/html, text/plain;q=0.9, */*;q=0.8",
          "User-Agent": "LivescoreFree-Bot/2.0"
        }
      });
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} for ${url}`);
      }
      return await response.text();
    } finally {
      IN_FLIGHT_TEXT_REQUESTS.delete(url);
    }
  })();
  IN_FLIGHT_TEXT_REQUESTS.set(url, promise);
  return promise;
}
__name(fetchText, "fetchText");
async function fetchLeagueScoreboard(sport, league, query = {}) {
  if (isIplLeague(sport, league)) {
    return fetchJson(getIplScoreboardUrl(query));
  }
  const response = await fetchWithFallback(buildFallbackUrls(sport, league, "scoreboard", query), {
    headers: {
      Accept: "application/json"
    }
  });
  return response.json();
}
__name(fetchLeagueScoreboard, "fetchLeagueScoreboard");
async function fetchLeagueStandings(sport, league, query = {}) {
  if (isIplLeague(sport, league)) {
    return fetchJson(getIplStandingsUrl(query));
  }
  return fetchJson(siteApiUrl(sport, league, "standings", query));
}
__name(fetchLeagueStandings, "fetchLeagueStandings");
function jsonResponse(payload, cacheSeconds = 30, status = 200, reason = "") {
  const swr = 60;
  const sie = 600;
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=${swr}, stale-if-error=${sie}`,
    "Access-Control-Allow-Origin": "*"
  };
  if (reason) {
    headers["X-Cache-TTL-Reason"] = reason;
  }
  return new Response(JSON.stringify(payload), {
    status,
    headers
  });
}
__name(jsonResponse, "jsonResponse");
function buildFeedMeta(extra = {}) {
  return {
    provider: "espn-public",
    providerLabel: "ESPN public sports APIs",
    freeTier: true,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    ...extra
  };
}
__name(buildFeedMeta, "buildFeedMeta");
function calculateTTL(status = "upcoming", matchDate = "", sport = "soccer") {
  const now = /* @__PURE__ */ new Date();
  let ttl = 15;
  let reason = "default";
  if (status === "live") {
    if (sport === "basketball" || sport === "hockey" || sport === "baseball") {
      ttl = 2;
      reason = "live-ultra-fast-" + sport;
    } else if (sport === "soccer" || sport === "football") {
      ttl = 5;
      reason = "live-standard-" + sport;
    } else {
      ttl = 10;
      reason = "live-other";
    }
  } else if (status === "upcoming") {
    if (matchDate) {
      const matchTime = new Date(matchDate);
      const minutesUntil = (matchTime - now) / 1e3 / 60;
      if (minutesUntil < 0) {
        ttl = 5;
        reason = "upcoming-started";
      } else if (minutesUntil < 15) {
        ttl = 10;
        reason = "upcoming-imminent";
      } else if (minutesUntil < 60) {
        ttl = 30;
        reason = "upcoming-soon";
      } else if (minutesUntil < 1440) {
        ttl = 120;
        reason = "upcoming-today";
      } else {
        ttl = 600;
        reason = "upcoming-future";
      }
    } else {
      ttl = 60;
      reason = "upcoming-default";
    }
  } else if (status === "finished") {
    ttl = 900;
    reason = "finished";
  }
  return { ttl, reason };
}
__name(calculateTTL, "calculateTTL");
async function fetchWithFallback(urlArray, init = {}, timeout = 5e3) {
  if (!Array.isArray(urlArray) || urlArray.length === 0) {
    throw new Error("fetchWithFallback: No URLs provided");
  }
  const errors = [];
  for (const url of urlArray) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          ...init.headers,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        }
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        return response;
      }
      errors.push(`${url}: ${response.status} ${response.statusText}`);
    } catch (error) {
      clearTimeout(timeoutId);
      errors.push(`${url}: ${error.message}`);
      continue;
    }
  }
  throw new Error(`fetchWithFallback: All ${urlArray.length} URLs failed. Errors: ${errors.join(" | ")}`);
}
__name(fetchWithFallback, "fetchWithFallback");
function buildFallbackUrls(sport, league, resource, query = {}) {
  const urls = [];
  urls.push(siteApiUrl(sport, league, resource, query));
  if (["scoreboard", "teams", "standings", "athletes", "summary", "news"].includes(resource)) {
    urls.push(coreApiUrl(sport, league, resource, query));
  }
  if (resource === "scoreboard") {
    const cdnUrl = new URL(`${BACKEND_CONFIG.sources.espn_web}/sports/${sport}/${league}/scoreboard`);
    Object.entries(query).forEach(([key, value]) => cdnUrl.searchParams.set(key, value));
    urls.push(cdnUrl.toString());
  }
  return urls;
}
__name(buildFallbackUrls, "buildFallbackUrls");
function dedupeById(items = []) {
  const seen = /* @__PURE__ */ new Set();
  return items.filter((item) => {
    const key = item?.id || item?.uid || JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
__name(dedupeById, "dedupeById");
function mapStatus(state = "pre") {
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "upcoming";
}
__name(mapStatus, "mapStatus");
function parseDateRange(daysAhead = 7) {
  const dates = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = 0; i <= daysAhead; i += 1) {
    const next = new Date(now);
    next.setDate(now.getDate() + i);
    dates.push(
      `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, "0")}${String(next.getDate()).padStart(2, "0")}`
    );
  }
  return dates;
}
__name(parseDateRange, "parseDateRange");
function extractLeagueName(scoreboard = {}, fallbackLeague = "") {
  return scoreboard.leagues?.[0]?.name || fallbackLeague || "Sports Event";
}
__name(extractLeagueName, "extractLeagueName");
function normalizeArticle(article = {}) {
  const image = article.images?.[0]?.url || article.images?.[0]?.href || article.image || "";
  const url = article.links?.web?.href || article.links?.api?.news?.href || article.link || article.url || "";
  const byline = typeof article.byline === "string" ? article.byline : article.byline?.name || article.source?.name || article.source || "";
  return {
    id: article.id || article.story || article.headline,
    headline: article.headline || "Untitled story",
    title: article.headline || article.title || "Untitled story",
    description: article.description || article.story || "",
    summary: article.description || article.story || "",
    published: article.published || article.lastModified || "",
    byline,
    images: article.images || [],
    image,
    categories: article.categories || [],
    links: article.links || {},
    url
  };
}
__name(normalizeArticle, "normalizeArticle");
function normalizeScoreboardEvent(event = {}, sport, leagueSlug, leagueName = "") {
  const competition = event.competitions?.[0] || {};
  const competitors = competition.competitors || [];
  const home = competitors.find((entry) => entry.homeAway === "home") || {};
  const away = competitors.find((entry) => entry.homeAway === "away") || {};
  const statusType = event.status?.type || competition.status?.type || {};
  const venue = competition.venue || {};
  const broadcasts = competition.broadcasts || [];
  const homeLeader = home.leaders?.[0]?.leaders?.[0];
  const awayLeader = away.leaders?.[0]?.leaders?.[0];
  return {
    id: event.id,
    uid: event.uid || "",
    date: event.date || competition.date || "",
    name: event.name || event.shortName || "Match",
    shortName: event.shortName || event.name || "Match",
    sport,
    leagueSlug,
    leagueSearchValue: leagueSlug,
    league: leagueName || extractLeagueName({ leagues: [{ name: leagueName }] }, leagueName),
    status: mapStatus(statusType.state),
    statusText: statusType.detail || statusType.description || statusType.shortDetail || "",
    time: statusType.shortDetail || statusType.detail || "",
    period: event.status?.period || competition.status?.period || null,
    displayClock: event.status?.displayClock || "",
    venue: venue.fullName || "",
    venueCity: venue.address?.city || "",
    broadcast: broadcasts.map((entry) => entry.media?.shortName || entry.names?.join(", ")).filter(Boolean).join(", "),
    highlightUrl: event.links?.find((entry) => ["Highlights", "Recap"].includes(entry.shortText))?.href || "",
    homeTeam: {
      id: home.team?.id || "",
      name: home.team?.shortDisplayName || home.team?.displayName || home.team?.name || "Home",
      fullName: home.team?.displayName || home.team?.name || "Home",
      abbreviation: home.team?.abbreviation || "",
      logo: home.team?.logo || home.team?.logos?.[0]?.href || FALLBACK_LOGO,
      score: home.score || "0",
      winner: Boolean(home.winner),
      record: home.records?.[0]?.summary || "",
      color: home.team?.color || "",
      leader: homeLeader ? {
        name: homeLeader.athlete?.displayName || "",
        value: homeLeader.displayValue || ""
      } : null
    },
    awayTeam: {
      id: away.team?.id || "",
      name: away.team?.shortDisplayName || away.team?.displayName || away.team?.name || "Away",
      fullName: away.team?.displayName || away.team?.name || "Away",
      abbreviation: away.team?.abbreviation || "",
      logo: away.team?.logo || away.team?.logos?.[0]?.href || FALLBACK_LOGO,
      score: away.score || "0",
      winner: Boolean(away.winner),
      record: away.records?.[0]?.summary || "",
      color: away.team?.color || "",
      leader: awayLeader ? {
        name: awayLeader.athlete?.displayName || "",
        value: awayLeader.displayValue || ""
      } : null
    }
  };
}
__name(normalizeScoreboardEvent, "normalizeScoreboardEvent");
function normalizeTeamEntry(entry = {}, sport = "soccer", league = "eng.1") {
  const team = entry.team || entry;
  return {
    id: team.id || "",
    name: team.displayName || team.name || "Team",
    shortName: team.shortDisplayName || team.abbreviation || team.name || "Team",
    abbreviation: team.abbreviation || "",
    slug: team.slug || "",
    location: team.location || "",
    color: team.color || "",
    alternateColor: team.alternateColor || "",
    isActive: team.isActive !== false,
    logo: team.logos?.[0]?.href || team.logo || FALLBACK_LOGO,
    venue: team.venue?.fullName || entry.venue?.fullName || "",
    record: entry.record?.items?.[0]?.summary || entry.record?.summary || team.record || "",
    sport,
    league
  };
}
__name(normalizeTeamEntry, "normalizeTeamEntry");
function normalizeRosterGroups(data = {}) {
  const groups = data.athletes || [];
  const athletes = [];
  groups.forEach((group) => {
    (group.items || []).forEach((athlete) => {
      athletes.push({
        id: athlete.id || "",
        firstName: athlete.firstName || "",
        lastName: athlete.lastName || "",
        fullName: athlete.displayName || `${athlete.firstName || ""} ${athlete.lastName || ""}`.trim(),
        shortName: athlete.shortName || athlete.displayName || "",
        jersey: athlete.jersey || "",
        age: athlete.age || "",
        displayHeight: athlete.displayHeight || athlete.height || "",
        displayWeight: athlete.displayWeight || athlete.weight || "",
        position: athlete.position || group.position || {},
        status: athlete.status || {},
        headshot: athlete.headshot || { href: FALLBACK_LOGO }
      });
    });
  });
  return athletes;
}
__name(normalizeRosterGroups, "normalizeRosterGroups");
function normalizeAthlete(detail = {}, fallback = {}) {
  return {
    id: detail.id || fallback.id || "",
    firstName: detail.firstName || fallback.firstName || "",
    lastName: detail.lastName || fallback.lastName || "",
    fullName: detail.displayName || fallback.displayName || fallback.fullName || "Athlete",
    shortName: detail.shortName || fallback.shortName || detail.displayName || "Athlete",
    age: detail.age || fallback.age || "",
    displayHeight: detail.displayHeight || fallback.displayHeight || "",
    displayWeight: detail.displayWeight || fallback.displayWeight || "",
    jersey: detail.jersey || fallback.jersey || "",
    active: detail.active !== false,
    position: detail.position || fallback.position || {},
    experience: detail.experience || fallback.experience || {},
    citizenship: detail.citizenship || fallback.citizenship || "",
    birthPlace: detail.birthPlace || fallback.birthPlace || {},
    status: detail.status || fallback.status || { name: detail.active === false ? "Inactive" : "Active" },
    headshot: detail.headshot || fallback.headshot || { href: FALLBACK_LOGO },
    teamRef: detail.team?.$ref || "",
    teamId: extractTrailingId(detail.team?.$ref || ""),
    sport: fallback.sport || "",
    league: fallback.league || ""
  };
}
__name(normalizeAthlete, "normalizeAthlete");
function extractTrailingId(ref = "") {
  const parts = String(ref).split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}
__name(extractTrailingId, "extractTrailingId");
async function resolveTeamFromRef(ref = "") {
  if (!ref) return null;
  try {
    const data = await fetchJson(ref);
    return normalizeTeamEntry({ team: data });
  } catch (error) {
    return null;
  }
}
__name(resolveTeamFromRef, "resolveTeamFromRef");
function normalizeStandingsEntries(data = {}) {
  const entries = [];
  if (Array.isArray(data.standings)) {
    data.standings.forEach((standing) => {
      if (Array.isArray(standing?.entries)) {
        entries.push(...standing.entries);
      }
    });
  }
  if (Array.isArray(data.children)) {
    data.children.forEach((child) => {
      if (Array.isArray(child?.standings?.entries)) {
        entries.push(...child.standings.entries);
      }
    });
  }
  return dedupeById(entries);
}
__name(normalizeStandingsEntries, "normalizeStandingsEntries");

// api/blog.js
var SPORT_LABELS = {
  all: "All Sports",
  soccer: "Soccer",
  football: "Football",
  basketball: "Basketball",
  baseball: "Baseball",
  hockey: "Hockey",
  cricket: "Cricket",
  tennis: "Tennis",
  mma: "MMA",
  racing: "Racing",
  golf: "Golf",
  rugby: "Rugby",
  "rugby-league": "Rugby League",
  volleyball: "Volleyball",
  "water-polo": "Water Polo",
  lacrosse: "Lacrosse",
  "field-hockey": "Field Hockey",
  "australian-football": "Aussie Rules"
};
var STOP_WORDS = /* @__PURE__ */ new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "after",
  "before",
  "into",
  "about",
  "have",
  "will",
  "their",
  "they",
  "them",
  "your",
  "what",
  "when",
  "where",
  "while",
  "over",
  "under",
  "amid",
  "into",
  "out",
  "why",
  "how",
  "new",
  "now",
  "say",
  "says",
  "vs"
]);
function getLeaguePairs(sport, league, limit = 4) {
  if (league) {
    return [{ sport, league }];
  }
  if (sport === "all") {
    return [
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "uefa.champions" },
      { sport: "basketball", league: "nba" },
      { sport: "football", league: "nfl" },
      { sport: "hockey", league: "nhl" },
      { sport: "baseball", league: "mlb" },
      { sport: "cricket", league: "ipl" },
      { sport: "tennis", league: "atp" },
      { sport: "mma", league: "ufc" },
      { sport: "racing", league: "f1" },
      { sport: "golf", league: "pga" }
    ];
  }
  return (SPORT_LEAGUES[sport] || []).slice(0, limit).map((slug) => ({ sport, league: slug }));
}
__name(getLeaguePairs, "getLeaguePairs");
function toTimestamp(value = "") {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
__name(toTimestamp, "toTimestamp");
function slugify(value = "") {
  return String(value || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
}
__name(slugify, "slugify");
function titleCase(value = "") {
  return String(value || "").split(/[\s.-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
__name(titleCase, "titleCase");
function extractDomain(url = "") {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return "";
  }
}
__name(extractDomain, "extractDomain");
function getSourceFavicon(url = "") {
  const domain = extractDomain(url);
  return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : "/icons/icon-192.png";
}
__name(getSourceFavicon, "getSourceFavicon");
function trimSentence(value = "", limit = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1)).trimEnd()}\u2026`;
}
__name(trimSentence, "trimSentence");
function buildLeagueLabel(league = "", matches = []) {
  const liveLeague = matches.find((match2) => match2?.league)?.league;
  if (liveLeague) return liveLeague;
  if (!league) return "Global sports";
  return titleCase(league.replace(/\./g, " "));
}
__name(buildLeagueLabel, "buildLeagueLabel");
function buildScoreboardDates() {
  const dates = [];
  const now = /* @__PURE__ */ new Date();
  for (let offset = -1; offset <= 2; offset += 1) {
    const point = new Date(now);
    point.setDate(now.getDate() + offset);
    dates.push(
      `${point.getFullYear()}${String(point.getMonth() + 1).padStart(2, "0")}${String(point.getDate()).padStart(2, "0")}`
    );
  }
  return dates;
}
__name(buildScoreboardDates, "buildScoreboardDates");
async function fetchEditorialArticles(sport, league, limit = 18) {
  const pairs = getLeaguePairs(sport, league, sport === "all" ? 8 : 4);
  const responses = await Promise.all(
    pairs.map(async ({ sport: pairSport, league: pairLeague }) => {
      try {
        const data = await fetchJson(
          siteApiUrl(pairSport, pairLeague, "news", {
            limit: 14
          })
        );
        return (data.articles || []).map((rawArticle) => {
          const article = normalizeArticle(rawArticle);
          const domain = extractDomain(article.url);
          return {
            ...article,
            source: {
              name: rawArticle.source?.name || article.byline || domain || "Public sports source",
              url: article.url || "",
              domain,
              favicon: getSourceFavicon(article.url)
            },
            sport: pairSport,
            league: pairLeague
          };
        });
      } catch (error) {
        return [];
      }
    })
  );
  return {
    articles: dedupeById(responses.flat()).sort((left, right) => toTimestamp(right.published) - toTimestamp(left.published)).slice(0, limit),
    feeds: pairs.length
  };
}
__name(fetchEditorialArticles, "fetchEditorialArticles");
async function fetchContextMatches(sport, league) {
  const dates = buildScoreboardDates();
  const pairs = getLeaguePairs(sport, league, sport === "all" ? 6 : 3);
  const responses = await Promise.all(
    pairs.flatMap(
      ({ sport: pairSport, league: pairLeague }) => dates.map(async (date) => {
        try {
          const data = await fetchJson(siteApiUrl(pairSport, pairLeague, "scoreboard", { dates: date, limit: 40 }));
          const leagueName = data.leagues?.[0]?.name || titleCase(pairLeague);
          return (data.events || []).map((event) => normalizeScoreboardEvent(event, pairSport, pairLeague, leagueName));
        } catch (error) {
          return [];
        }
      })
    )
  );
  return dedupeById(responses.flat()).sort((left, right) => toTimestamp(left.date) - toTimestamp(right.date)).slice(0, 32);
}
__name(fetchContextMatches, "fetchContextMatches");
function scoreMatchAgainstArticle(article, match2) {
  const haystack = `${article.headline || ""} ${article.description || ""} ${article.summary || ""}`.toLowerCase();
  const terms = [
    match2?.homeTeam?.name,
    match2?.homeTeam?.abbreviation,
    match2?.awayTeam?.name,
    match2?.awayTeam?.abbreviation,
    match2?.league
  ].map((value) => String(value || "").trim().toLowerCase()).filter(Boolean);
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}
__name(scoreMatchAgainstArticle, "scoreMatchAgainstArticle");
function findRelatedMatch(article, matches = []) {
  const scored = matches.map((match2) => ({ match: match2, score: scoreMatchAgainstArticle(article, match2) })).sort((left, right) => right.score - left.score);
  return scored[0]?.score > 0 ? scored[0].match : matches[0] || null;
}
__name(findRelatedMatch, "findRelatedMatch");
function pickVertical(article, relatedMatch, sportLabel) {
  const text = `${article.headline || ""} ${article.description || ""}`.toLowerCase();
  if (/transfer|trade|sign|contract|loan/.test(text)) return "Transfer Radar";
  if (/injur|return|availability|absence/.test(text)) return "Availability Watch";
  if (relatedMatch?.status === "upcoming") return "Next Match Guide";
  if (relatedMatch?.status === "live") return "Live Form Brief";
  if (relatedMatch?.status === "finished") return "Final Whistle Takeaways";
  if (/draft|prospect|academy/.test(text)) return "Future Watch";
  return `${sportLabel} Fan Brief`;
}
__name(pickVertical, "pickVertical");
function buildKeywords(article, sportLabel, leagueLabel, relatedMatch) {
  const keywords = /* @__PURE__ */ new Set([
    sportLabel,
    `${sportLabel} news`,
    `${sportLabel} blog`,
    `${sportLabel} fan guide`,
    leagueLabel,
    `${leagueLabel} analysis`,
    article.source?.domain || article.source?.name || "public sports source"
  ]);
  (article.categories || []).forEach((category) => {
    if (category?.name) keywords.add(category.name);
  });
  [relatedMatch?.homeTeam?.name, relatedMatch?.awayTeam?.name, relatedMatch?.league].forEach((item) => {
    if (item) keywords.add(item);
  });
  String(article.headline || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !STOP_WORDS.has(word)).slice(0, 8).forEach((word) => keywords.add(word));
  return Array.from(keywords).slice(0, 14);
}
__name(buildKeywords, "buildKeywords");
function buildExcerpt(article, sportLabel, leagueLabel, relatedMatch, vertical) {
  const focus = relatedMatch ? `${relatedMatch.homeTeam.name} vs ${relatedMatch.awayTeam.name}` : leagueLabel;
  const summary = trimSentence(article.description || article.summary || article.headline, 120);
  return `${vertical} for ${sportLabel} fans: ${summary || "A rewritten evergreen update"} with context around ${focus}.`;
}
__name(buildExcerpt, "buildExcerpt");
function buildSections(article, sportLabel, leagueLabel, relatedMatch, vertical, contextMatches = []) {
  const topic = trimSentence(article.headline || article.title || `${sportLabel} update`, 90);
  const summary = trimSentence(article.description || article.summary || "", 180);
  const nextMatch = contextMatches.find((match2) => match2.status === "upcoming") || relatedMatch;
  const recentFinal = contextMatches.filter((match2) => match2.status === "finished").sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date))[0];
  return [
    {
      heading: `Why ${topic} matters right now`,
      paragraphs: [
        `${sportLabel} supporters tracking ${leagueLabel} need more than a fast headline. This fan brief rewrites the live news cycle into an evergreen read, so the core takeaway stays useful after the first rush of updates has passed.`,
        summary ? `${summary} The bigger angle is how this storyline changes the short-term mood around ${leagueLabel}, whether the focus is form, selection, tactics, or momentum.` : `The focus here is the bigger picture behind the headline and how it shifts expectations around ${leagueLabel}.`
      ]
    },
    {
      heading: `${vertical} for fans following ${leagueLabel}`,
      paragraphs: [
        relatedMatch ? `${relatedMatch.homeTeam.name} and ${relatedMatch.awayTeam.name} give this story a match-day frame. ${relatedMatch.status === "live" ? "With the game active, each update carries immediate tactical weight." : relatedMatch.status === "upcoming" ? "Because the fixture is still ahead, supporters can treat this as a preview of what matters next." : "With the final score already set, the discussion becomes about what comes next rather than what just happened."}` : `${leagueLabel} is moving quickly, so the best long-term blog angle is not the flashiest quote but the recurring theme behind it: selection pressure, form swings, and how supporters should read the next round of coverage.`,
        nextMatch ? `The next useful checkpoint for readers is ${nextMatch.homeTeam.name} vs ${nextMatch.awayTeam.name}. That fixture gives the audience a concrete moment to measure whether this storyline fades or grows.` : `The next checkpoint is the upcoming slate around ${leagueLabel}, where reaction usually turns into evidence.`
      ]
    },
    {
      heading: `Form, schedule, and what to watch next`,
      paragraphs: [
        recentFinal ? `Recent results still shape the tone. ${recentFinal.homeTeam.name} ${recentFinal.homeTeam.score}-${recentFinal.awayTeam.score} ${recentFinal.awayTeam.name} is the kind of scoreline fans use to test whether the headline fits a larger pattern or only one cycle of attention.` : `Recent results remain the best filter for separating a real trend from a short burst of attention.`,
        `For searchers looking for ${sportLabel.toLowerCase()} analysis, ${leagueLabel.toLowerCase()} form, and reliable fan context, the strongest signal is whether the same theme keeps showing up across team news, match windows, and selection decisions.`
      ]
    }
  ];
}
__name(buildSections, "buildSections");
function buildReadingTime(sections = []) {
  const totalWords = sections.reduce(
    (count, section) => count + (section.paragraphs || []).reduce(
      (sectionCount, paragraph) => sectionCount + String(paragraph || "").split(/\s+/).filter(Boolean).length,
      0
    ),
    0
  );
  return Math.max(3, Math.round(totalWords / 165));
}
__name(buildReadingTime, "buildReadingTime");
function buildPost(article, index, context) {
  const relatedMatch = findRelatedMatch(article, context.matches);
  const vertical = pickVertical(article, relatedMatch, context.sportLabel);
  const headlineSeed = trimSentence(article.headline || article.title || `${context.sportLabel} fan guide`, 96);
  const title = relatedMatch ? `${context.sportLabel} fan guide: what ${headlineSeed.toLowerCase()} means for ${relatedMatch.homeTeam.name} vs ${relatedMatch.awayTeam.name}` : `${context.sportLabel} fan guide: ${headlineSeed}`;
  const sections = buildSections(article, context.sportLabel, context.leagueLabel, relatedMatch, vertical, context.matches);
  const slugSeed = `${context.sport}-${context.league || "all"}-${article.id || article.headline || index}`;
  const keywords = buildKeywords(article, context.sportLabel, context.leagueLabel, relatedMatch);
  const excerpt = buildExcerpt(article, context.sportLabel, context.leagueLabel, relatedMatch, vertical);
  const quote = relatedMatch ? `Supporters will judge this story by what happens next in ${relatedMatch.homeTeam.name} vs ${relatedMatch.awayTeam.name}.` : `The headline moves fast, but the better fan read comes from the trend underneath it.`;
  return {
    id: article.id || slugSeed,
    slug: slugify(slugSeed),
    sport: context.sport,
    sportLabel: context.sportLabel,
    league: context.league,
    leagueLabel: context.leagueLabel,
    vertical,
    title,
    headline: article.headline || article.title || title,
    seoTitle: `${title} | ${context.sportLabel} blog`,
    seoDescription: trimSentence(excerpt, 158),
    excerpt,
    description: excerpt,
    image: article.image || "/icons/hero-fallback.svg",
    published: article.published || (/* @__PURE__ */ new Date()).toISOString(),
    byline: article.byline || "LivescoreFree editorial desk",
    readingTime: buildReadingTime(sections),
    categories: article.categories || [],
    keywords,
    source: article.source,
    quote,
    sections,
    relatedMatch,
    relatedMatches: context.matches.filter((match2) => match2.id !== relatedMatch?.id).slice(0, 3)
  };
}
__name(buildPost, "buildPost");
function buildSectionBuckets(posts = []) {
  const bucketMap = /* @__PURE__ */ new Map();
  posts.forEach((post) => {
    const key = post.vertical || "Fan Brief";
    if (!bucketMap.has(key)) bucketMap.set(key, []);
    bucketMap.get(key).push(post);
  });
  return Array.from(bucketMap.entries()).slice(0, 4).map(([title, items]) => ({
    title,
    items: items.slice(0, 4)
  }));
}
__name(buildSectionBuckets, "buildSectionBuckets");
async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sport = normalizeSportParam(url.searchParams.get("sport") || url.searchParams.get("s") || "all");
  const league = normalizeLeagueParam(url.searchParams.get("league") || url.searchParams.get("l") || "", sport === "all" ? "" : sport);
  const slug = String(url.searchParams.get("slug") || "").trim();
  const parsedLimit = parseInt(url.searchParams.get("limit") || "16", 10);
  const limit = Math.max(6, Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 16, 24));
  try {
    const [editorialFeed, contextMatches] = await Promise.all([
      fetchEditorialArticles(sport, league, limit + 6),
      fetchContextMatches(sport, league)
    ]);
    const sportLabel = SPORT_LABELS[sport] || titleCase(sport);
    const leagueLabel = buildLeagueLabel(league, contextMatches);
    const contextData = {
      sport,
      league,
      sportLabel,
      leagueLabel,
      matches: contextMatches
    };
    const posts = editorialFeed.articles.slice(0, limit).map((article, index) => buildPost(article, index, contextData));
    if (slug) {
      const post = posts.find((entry) => entry.slug === slug) || null;
      if (!post) {
        return jsonResponse(
          {
            post: null,
            relatedPosts: posts.slice(0, 4),
            meta: buildFeedMeta({
              sport,
              league,
              notFound: true
            })
          },
          120,
          404
        );
      }
      return jsonResponse(
        {
          post,
          relatedPosts: posts.filter((entry) => entry.slug !== slug).slice(0, 4),
          meta: buildFeedMeta({
            sport,
            league,
            feeds: editorialFeed.feeds,
            matches: contextMatches.length,
            view: "detail"
          })
        },
        300
      );
    }
    return jsonResponse(
      {
        featured: posts[0] || null,
        posts,
        trending: posts.slice(0, 5),
        sections: buildSectionBuckets(posts.slice(1)),
        meta: buildFeedMeta({
          sport,
          sportLabel,
          league,
          leagueLabel,
          feeds: editorialFeed.feeds,
          matches: contextMatches.length,
          view: "hub"
        })
      },
      300
    );
  } catch (error) {
    return jsonResponse(
      {
        featured: null,
        posts: [],
        trending: [],
        sections: [],
        error: error.message,
        meta: buildFeedMeta({
          sport,
          league,
          degraded: true
        })
      },
      60,
      500
    );
  }
}
__name(onRequest, "onRequest");

// api/info.js
function getLeaguePairs2(sport, league, limit = 4) {
  if (league) {
    return [{ sport, league }];
  }
  if (sport === "all") {
    return [
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "esp.1" },
      { sport: "soccer", league: "uefa.champions" },
      { sport: "basketball", league: "nba" },
      { sport: "basketball", league: "wnba" },
      { sport: "football", league: "nfl" },
      { sport: "hockey", league: "nhl" },
      { sport: "baseball", league: "mlb" },
      { sport: "cricket", league: "ipl" },
      { sport: "tennis", league: "atp" },
      { sport: "mma", league: "ufc" },
      { sport: "racing", league: "f1" },
      { sport: "golf", league: "pga" }
    ];
  }
  return (SPORT_LEAGUES[sport] || []).slice(0, limit).map((slug) => ({ sport, league: slug }));
}
__name(getLeaguePairs2, "getLeaguePairs");
function toTimestamp2(value = "") {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
__name(toTimestamp2, "toTimestamp");
var IPL_ROLE_LABELS = {
  batters: "Batter",
  wicketkeepers: "Wicketkeeper",
  allrounders: "All-rounder",
  spinners: "Spinner",
  "fast bowlers": "Fast bowler"
};
function normalizeIplKey(value = "") {
  return String(value || "").toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9]+/g, "");
}
__name(normalizeIplKey, "normalizeIplKey");
function decodeHtmlEntities(value = "") {
  return String(value || "").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))).replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16))).replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&apos;/gi, "'").replace(/&#39;/gi, "'").replace(/&rsquo;/gi, "'").replace(/&lsquo;/gi, "'").replace(/&ndash;/gi, "-").replace(/&mdash;/gi, "-").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}
__name(decodeHtmlEntities, "decodeHtmlEntities");
function stripHtml(value = "") {
  return decodeHtmlEntities(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
__name(stripHtml, "stripHtml");
function slugify2(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
__name(slugify2, "slugify");
function deriveShortName(fullName = "") {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts.join(" ");
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
__name(deriveShortName, "deriveShortName");
function getIplRoleMeta(category = "") {
  const normalized = String(category || "").trim().toLowerCase();
  const displayName = IPL_ROLE_LABELS[normalized] || "Squad";
  const abbreviation = displayName.split(/[\s-]+/).map((chunk) => chunk[0] || "").join("").slice(0, 3).toUpperCase();
  return {
    name: displayName,
    displayName,
    abbreviation
  };
}
__name(getIplRoleMeta, "getIplRoleMeta");
function extractIplPlayerNames(playersHtml = "") {
  const plain = stripHtml(playersHtml).replace(/\s*,\s*/g, ",").replace(/\.+$/g, "");
  return plain.split(",").map((name) => name.replace(/\s+/g, " ").trim().replace(/\.$/, "")).filter(Boolean);
}
__name(extractIplPlayerNames, "extractIplPlayerNames");
function buildIplPlayer(team, fullName, category = "", order = 0) {
  const cleanedName = String(fullName || "").replace(/\s+/g, " ").trim().replace(/\.$/, "");
  const parts = cleanedName.split(/\s+/);
  const role = getIplRoleMeta(category);
  return {
    id: `ipl-${team.id}-${slugify2(cleanedName)}`,
    firstName: parts[0] || cleanedName,
    lastName: parts.slice(1).join(" "),
    fullName: cleanedName,
    shortName: deriveShortName(cleanedName),
    age: "",
    displayHeight: "",
    displayWeight: "",
    jersey: "",
    active: true,
    order,
    position: role,
    experience: {},
    citizenship: "",
    birthPlace: {},
    status: { name: "Active" },
    headshot: { href: team.logo || "" },
    team: {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      logo: team.logo
    },
    sport: "cricket",
    league: "ipl"
  };
}
__name(buildIplPlayer, "buildIplPlayer");
function aliasIplStandingEntry(entry = {}) {
  const stats = Array.isArray(entry.stats) ? [...entry.stats] : [];
  const existingNames = new Set(stats.map((stat) => String(stat?.name || "").toLowerCase()));
  const aliases = [
    ["matchesPlayed", ["gamesplayed", "games_played"]],
    ["matchesWon", ["wins", "winsoverall"]],
    ["matchesLost", ["losses", "loss"]],
    ["matchPoints", ["points"]],
    ["netrr", ["netrunrate", "nrr"]]
  ];
  aliases.forEach(([sourceName, aliasNames]) => {
    const source = stats.find((stat) => String(stat?.name || "").toLowerCase() === sourceName.toLowerCase());
    if (!source) return;
    aliasNames.forEach((alias) => {
      if (existingNames.has(alias)) return;
      stats.push({
        ...source,
        name: alias
      });
      existingNames.add(alias);
    });
  });
  return {
    ...entry,
    stats
  };
}
__name(aliasIplStandingEntry, "aliasIplStandingEntry");
function findIplStat(entry = {}, names = []) {
  const stats = Array.isArray(entry.stats) ? entry.stats : [];
  return stats.find((stat) => names.includes(String(stat?.name || "").toLowerCase())) || null;
}
__name(findIplStat, "findIplStat");
function formatIplRecord(entry = {}) {
  const played = findIplStat(entry, ["matchesplayed", "gamesplayed", "games_played"])?.displayValue || "0";
  const won = findIplStat(entry, ["matcheswon", "wins", "winsoverall"])?.displayValue || "0";
  const lost = findIplStat(entry, ["matcheslost", "losses", "loss"])?.displayValue || "0";
  const points = findIplStat(entry, ["matchpoints", "points"])?.displayValue || "0";
  return `${played} Mat | ${won}W-${lost}L | ${points} Pts`;
}
__name(formatIplRecord, "formatIplRecord");
async function getIplScoreboardData() {
  return fetchJson(getIplScoreboardUrl());
}
__name(getIplScoreboardData, "getIplScoreboardData");
async function getIplStandingsData() {
  return fetchJson(getIplStandingsUrl());
}
__name(getIplStandingsData, "getIplStandingsData");
async function getIplTeamsDirectory() {
  const [scoreboard, standingsData] = await Promise.all([
    getIplScoreboardData(),
    getIplStandingsData().catch(() => ({ children: [], standings: [] }))
  ]);
  const standingsEntries = normalizeStandingsEntries(standingsData).map(aliasIplStandingEntry);
  const standingsByTeamId = new Map(
    standingsEntries.filter((entry) => entry?.team?.id).map((entry) => [String(entry.team.id), entry])
  );
  const matches = (scoreboard.events || []).map(
    (event) => normalizeScoreboardEvent(event, "cricket", "ipl", scoreboard.leagues?.[0]?.name || "Indian Premier League")
  );
  const teams = dedupeById((scoreboard.teams || []).map((team) => normalizeTeamEntry(team, "cricket", "ipl"))).map((team) => {
    const standing = standingsByTeamId.get(String(team.id));
    const teamSchedule = matches.filter((match2) => String(match2.homeTeam?.id) === String(team.id) || String(match2.awayTeam?.id) === String(team.id)).sort((left, right) => new Date(left.date) - new Date(right.date));
    const venue = teamSchedule.find((match2) => match2.status === "upcoming")?.venue || teamSchedule[0]?.venue || team.venue || "";
    return {
      ...team,
      venue,
      record: standing ? formatIplRecord(standing) : team.record || "IPL 2026 squad",
      sport: "cricket",
      league: "ipl"
    };
  });
  return {
    scoreboard,
    matches,
    teams,
    standingsEntries
  };
}
__name(getIplTeamsDirectory, "getIplTeamsDirectory");
async function getIplRosterDirectory() {
  const { teams } = await getIplTeamsDirectory();
  const teamByKey = new Map(teams.map((team) => [normalizeIplKey(team.name), team]));
  const rostersByTeamId = /* @__PURE__ */ new Map();
  const athletes = [];
  const seenAthletes = /* @__PURE__ */ new Set();
  let html = "";
  try {
    html = await fetchText(getIplSquadArticleUrl());
  } catch (error) {
    return {
      teams,
      athletes,
      rostersByTeamId
    };
  }
  const headings = Array.from(html.matchAll(/<h2>([\s\S]*?)<\/h2>/gi));
  headings.forEach((headingMatch, index) => {
    const teamName = stripHtml(headingMatch[1]);
    const team = teamByKey.get(normalizeIplKey(teamName));
    if (!team) return;
    const sectionStart = (headingMatch.index || 0) + headingMatch[0].length;
    const sectionEnd = headings[index + 1]?.index || html.length;
    const sectionHtml = html.slice(sectionStart, sectionEnd);
    const rosterMatch = sectionHtml.match(/<p><b>Full(?:\s+[^<]+)?\s+squad<\/b><\/p>\s*<ul>([\s\S]*?)<\/ul>/i);
    const rosterHtml = rosterMatch?.[1] || "";
    const categoryMatches = Array.from(rosterHtml.matchAll(/<li>\s*<p><b>([^<]+)<\/b>:\s*([\s\S]*?)<\/li>/gi));
    const roster = [];
    let order = 0;
    categoryMatches.forEach((categoryMatch) => {
      const category = stripHtml(categoryMatch[1]);
      const playerNames = extractIplPlayerNames(categoryMatch[2]);
      playerNames.forEach((playerName) => {
        order += 1;
        const athlete = buildIplPlayer(team, playerName, category, order);
        roster.push(athlete);
        if (!seenAthletes.has(athlete.id)) {
          seenAthletes.add(athlete.id);
          athletes.push(athlete);
        }
      });
    });
    rostersByTeamId.set(String(team.id), roster);
  });
  return {
    teams,
    athletes,
    rostersByTeamId
  };
}
__name(getIplRosterDirectory, "getIplRosterDirectory");
async function getNormalizedIplStandings() {
  const data = await getIplStandingsData();
  const entries = normalizeStandingsEntries(data).map(aliasIplStandingEntry);
  return {
    standings: data.standings,
    children: data.children,
    entries
  };
}
__name(getNormalizedIplStandings, "getNormalizedIplStandings");
async function getNormalizedIplTeams() {
  const { teams } = await getIplTeamsDirectory();
  return {
    teams,
    rawTeams: []
  };
}
__name(getNormalizedIplTeams, "getNormalizedIplTeams");
async function getNormalizedIplPlayers(limit = 16) {
  const { athletes } = await getIplRosterDirectory();
  return {
    athletes: athletes.slice(0, limit)
  };
}
__name(getNormalizedIplPlayers, "getNormalizedIplPlayers");
async function getNormalizedIplTeamProfile(id = "", name = "") {
  const [{ teams, matches }, { rostersByTeamId }] = await Promise.all([
    getIplTeamsDirectory(),
    getIplRosterDirectory()
  ]);
  const normalizedName = normalizeIplKey(name);
  const team = teams.find((entry) => String(entry.id) === String(id)) || teams.find((entry) => normalizeIplKey(entry.name) === normalizedName);
  if (!team) {
    return {
      team: null,
      roster: [],
      injuries: [],
      schedule: []
    };
  }
  const schedule = matches.filter((match2) => String(match2.homeTeam?.id) === String(team.id) || String(match2.awayTeam?.id) === String(team.id)).sort((left, right) => new Date(left.date) - new Date(right.date));
  return {
    team,
    roster: rostersByTeamId.get(String(team.id)) || [],
    injuries: [],
    schedule
  };
}
__name(getNormalizedIplTeamProfile, "getNormalizedIplTeamProfile");
async function getNormalizedIplAthleteProfile(athleteId = "") {
  const { athletes } = await getIplRosterDirectory();
  const athlete = athletes.find((entry) => String(entry.id) === String(athleteId));
  if (!athlete) {
    return {
      athlete: null,
      bio: null,
      news: []
    };
  }
  const bio = {
    summary: `${athlete.fullName} is part of the ${athlete.team?.name || "IPL"} squad for the 2026 Indian Premier League season.`,
    sections: [
      {
        title: "Squad Snapshot",
        stats: [
          { name: "Team", value: athlete.team?.abbreviation || athlete.team?.name || "IPL" },
          { name: "Role", value: athlete.position?.displayName || "Squad" },
          { name: "Season", value: "IPL 2026" }
        ]
      }
    ]
  };
  return {
    athlete,
    bio,
    news: []
  };
}
__name(getNormalizedIplAthleteProfile, "getNormalizedIplAthleteProfile");
async function getNormalizedNews(sport, league, teamId = "") {
  const leaguePairs = getLeaguePairs2(sport, league, sport === "all" ? 12 : 4);
  const responses = await Promise.all(
    leaguePairs.map(async ({ sport: pairSport, league: pairLeague }) => {
      try {
        const data = await fetchJson(
          siteApiUrl(pairSport, pairLeague, "news", {
            ...teamId ? { team: teamId } : {},
            limit: 18
          })
        );
        return (data.articles || []).map(normalizeArticle);
      } catch (error) {
        return [];
      }
    })
  );
  return {
    articles: dedupeById(responses.flat()).sort((left, right) => toTimestamp2(right.published) - toTimestamp2(left.published)).slice(0, 40),
    meta: {
      feeds: leaguePairs.length
    }
  };
}
__name(getNormalizedNews, "getNormalizedNews");
async function getNormalizedStandings(sport, league) {
  if (isIplLeague(sport, league)) {
    return getNormalizedIplStandings();
  }
  try {
    const data = await fetchLeagueStandings(sport, league);
    return {
      standings: data.standings,
      children: data.children,
      entries: normalizeStandingsEntries(data)
    };
  } catch (error) {
    return { standings: [], children: [], entries: [] };
  }
}
__name(getNormalizedStandings, "getNormalizedStandings");
async function getNormalizedTeams(sport, league) {
  if (isIplLeague(sport, league)) {
    return getNormalizedIplTeams();
  }
  const leaguePairs = getLeaguePairs2(sport, league, sport === "all" ? 8 : 2);
  const responses = await Promise.all(
    leaguePairs.map(async ({ sport: pairSport, league: pairLeague }) => {
      try {
        const data = await fetchJson(siteApiUrl(pairSport, pairLeague, "teams"));
        const rawTeams = data.sports?.[0]?.leagues?.[0]?.teams || data.teams || [];
        return rawTeams.map((entry) => normalizeTeamEntry(entry, pairSport, pairLeague));
      } catch (error) {
        return [];
      }
    })
  );
  return {
    teams: dedupeById(responses.flat()),
    rawTeams: []
  };
}
__name(getNormalizedTeams, "getNormalizedTeams");
async function getNormalizedPlayers(sport, league, limit = 16) {
  if (isIplLeague(sport, league)) {
    return getNormalizedIplPlayers(limit);
  }
  try {
    const athletesList = await fetchJson(coreApiUrl(sport, league, "athletes", { limit, active: "true" }));
    const refs = (athletesList.items || athletesList.entries || athletesList.athletes || []).map((item) => item.$ref || item.ref || item.href || "").filter(Boolean).slice(0, limit);
    const detailResults = await Promise.all(
      refs.map(async (ref) => {
        try {
          const detail = await fetchJson(ref);
          const athlete = normalizeAthlete(detail, { sport, league });
          const team = athlete.teamRef ? await resolveTeamFromRef(athlete.teamRef) : null;
          return {
            ...athlete,
            team: team ? {
              id: team.id,
              name: team.name,
              abbreviation: team.abbreviation,
              logo: team.logo
            } : null
          };
        } catch (error) {
          return null;
        }
      })
    );
    return {
      athletes: dedupeById(detailResults.filter(Boolean))
    };
  } catch (error) {
    return { athletes: [] };
  }
}
__name(getNormalizedPlayers, "getNormalizedPlayers");
async function resolveTeamId(sport, league, id, name) {
  if (id) return id;
  if (!name) return "";
  const data = await getNormalizedTeams(sport, league);
  const loweredName = String(name).toLowerCase();
  return data.teams.find(
    (team) => team.name.toLowerCase() === loweredName || team.shortName.toLowerCase() === loweredName || team.slug.toLowerCase() === loweredName.replace(/\s+/g, "-")
  )?.id || "";
}
__name(resolveTeamId, "resolveTeamId");
async function getNormalizedTeamProfile(sport, league, id = "", name = "") {
  if (isIplLeague(sport, league)) {
    return getNormalizedIplTeamProfile(id, name);
  }
  const teamId = await resolveTeamId(sport, league, id, name);
  if (!teamId) {
    return {
      team: null,
      roster: [],
      injuries: [],
      schedule: []
    };
  }
  const [teamDetail, rosterData, injuriesData, scheduleData] = await Promise.all([
    fetchJson(siteApiUrl(sport, league, `teams/${teamId}`)).catch(() => null),
    fetchJson(siteApiUrl(sport, league, `teams/${teamId}/roster`)).catch(() => null),
    fetchJson(siteApiUrl(sport, league, `teams/${teamId}/injuries`)).catch(() => null),
    fetchJson(siteApiUrl(sport, league, `teams/${teamId}/schedule`)).catch(() => null)
  ]);
  const team = normalizeTeamEntry(teamDetail?.team || teamDetail || { id: teamId, name }, sport, league);
  const roster = rosterData ? normalizeRosterGroups(rosterData) : [];
  const injuries = (injuriesData?.injuries || []).map((injury) => ({
    id: injury.id || "",
    athlete: {
      id: injury.athlete?.id || "",
      displayName: injury.athlete?.displayName || "",
      headshot: injury.athlete?.headshot || {}
    },
    status: injury.status || "",
    detail: injury.detail || "",
    date: injury.date || ""
  }));
  const rawScheduleEvents = [
    ...Array.isArray(scheduleData?.events) ? scheduleData.events : [],
    ...(scheduleData?.team?.nextEvents || []).flatMap((item) => item?.events || []),
    ...Array.isArray(scheduleData?.schedule?.events) ? scheduleData.schedule.events : []
  ];
  const scheduleEvents = dedupeById(
    rawScheduleEvents.map((event) => normalizeScoreboardEvent(event, sport, league, scheduleData?.team?.displayName || team.name))
  ).sort((left, right) => new Date(left.date) - new Date(right.date));
  return {
    team,
    roster,
    injuries,
    schedule: scheduleEvents
  };
}
__name(getNormalizedTeamProfile, "getNormalizedTeamProfile");
async function getNormalizedAthleteProfile(sport, league, athleteId) {
  if (isIplLeague(sport, league)) {
    return getNormalizedIplAthleteProfile(athleteId);
  }
  if (!athleteId) {
    return { athlete: null, bio: null, news: [] };
  }
  const detail = await fetchJson(coreApiUrl(sport, league, `athletes/${athleteId}`));
  const athlete = normalizeAthlete(detail, { sport, league });
  const team = athlete.teamRef ? await resolveTeamFromRef(athlete.teamRef) : null;
  const [bioData, newsData] = await Promise.all([
    fetchJson(siteApiUrl(sport, league, `athletes/${athleteId}/bio`)).catch(() => null),
    fetchJson(siteApiUrl(sport, league, `athletes/${athleteId}/news`)).catch(() => null)
  ]);
  return {
    athlete: {
      ...athlete,
      team: team ? {
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        logo: team.logo
      } : null
    },
    bio: bioData,
    news: (newsData?.articles || []).map(normalizeArticle)
  };
}
__name(getNormalizedAthleteProfile, "getNormalizedAthleteProfile");
async function getNormalizedScores(sport, league, date = "") {
  if (isIplLeague(sport, league)) {
    const data = await getIplScoreboardData();
    const leagueName = data.leagues?.[0]?.name || "Indian Premier League";
    const matches = (data.events || []).map((event) => normalizeScoreboardEvent(event, "cricket", "ipl", leagueName));
    const filteredMatches = date ? matches.filter((match2) => {
      const parsed = new Date(match2.date);
      const matchDate = `${parsed.getFullYear()}${String(parsed.getMonth() + 1).padStart(2, "0")}${String(parsed.getDate()).padStart(2, "0")}`;
      return matchDate === date;
    }) : matches;
    return {
      matches: dedupeById(filteredMatches).sort((left, right) => new Date(left.date) - new Date(right.date))
    };
  }
  const leaguePairs = getLeaguePairs2(sport, league, sport === "all" ? 10 : 4);
  const responses = await Promise.all(
    leaguePairs.map(async ({ sport: pairSport, league: pairLeague }) => {
      try {
        const data = await fetchLeagueScoreboard(pairSport, pairLeague, date ? { dates: date } : {});
        const leagueName = data.leagues?.[0]?.name || pairLeague.toUpperCase();
        return (data.events || []).map((event) => normalizeScoreboardEvent(event, pairSport, pairLeague, leagueName));
      } catch (error) {
        return [];
      }
    })
  );
  return {
    matches: dedupeById(responses.flat()).sort((left, right) => new Date(left.date) - new Date(right.date))
  };
}
__name(getNormalizedScores, "getNormalizedScores");
async function onRequest2(context) {
  const { request } = context;
  const url = new URL(request.url);
  const type = String(url.searchParams.get("type") || "news").toLowerCase();
  const inputLeague = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const inputSport = url.searchParams.get("sport") || url.searchParams.get("s") || "soccer";
  const sport = normalizeSportParam(inputSport, inputLeague);
  const league = inputLeague ? normalizeLeagueParam(inputLeague, sport) : sport === "all" ? "" : normalizeLeagueParam("", sport);
  const teamId = url.searchParams.get("team") || "";
  const id = url.searchParams.get("id") || "";
  const name = url.searchParams.get("name") || "";
  const parsedLimit = parseInt(url.searchParams.get("limit") || "16", 10);
  const limit = Math.max(1, Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 16, 24));
  const date = url.searchParams.get("date") || "";
  try {
    switch (type) {
      case "news":
        return jsonResponse(
          {
            ...await getNormalizedNews(sport, league, teamId),
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      case "standings":
        return jsonResponse(
          {
            ...await getNormalizedStandings(sport, league),
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      case "teams":
        return jsonResponse(
          {
            ...await getNormalizedTeams(sport, league),
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      case "team":
        return jsonResponse(
          {
            ...await getNormalizedTeamProfile(sport, league, id, name),
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      case "players":
        return jsonResponse(
          {
            ...await getNormalizedPlayers(sport, league, limit),
            meta: buildFeedMeta({ type, sport, league, limit })
          },
          300
        );
      case "athlete":
      case "player":
        return jsonResponse(
          {
            ...await getNormalizedAthleteProfile(sport, league, id),
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      case "roster": {
        const profile = await getNormalizedTeamProfile(sport, league, id, name);
        return jsonResponse(
          {
            roster: profile.roster,
            team: profile.team,
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      }
      case "scores":
      case "scoreboard":
        return jsonResponse(
          {
            ...await getNormalizedScores(sport, league, date),
            meta: buildFeedMeta({ type, sport, league, date })
          },
          60
        );
      default:
        return jsonResponse(
          {
            error: "Invalid type",
            supported: ["news", "standings", "teams", "team", "players", "player", "athlete", "roster", "scores"],
            meta: buildFeedMeta({ degraded: true, type, sport, league })
          },
          60,
          400
        );
    }
  } catch (error) {
    return jsonResponse(
      {
        error: error.message,
        type,
        sport,
        league,
        leaguesKnown: SPORT_LEAGUES[sport] || [],
        meta: buildFeedMeta({ degraded: true, type, sport, league })
      },
      30,
      500
    );
  }
}
__name(onRequest2, "onRequest");

// api/live.js
var LIVE_SPORT_LIMITS = {
  soccer: 8,
  basketball: 4,
  football: 4,
  hockey: 3,
  baseball: 3,
  cricket: 3,
  tennis: 2,
  mma: 2,
  racing: 2,
  golf: 2,
  rugby: 2,
  "rugby-league": 2,
  volleyball: 2,
  "water-polo": 2,
  lacrosse: 2,
  "field-hockey": 2,
  "australian-football": 2
};
function buildEndpoints(sportParam, leagueParam) {
  const targetSports = getTargetSports(sportParam, leagueParam);
  const normalizedLeague = normalizeLeagueParam(leagueParam);
  if (normalizedLeague) {
    const sport = normalizeSportParam(sportParam, normalizedLeague);
    return [{ sport, league: normalizedLeague }];
  }
  if (sportParam === "all") {
    return targetSports.flatMap(
      (sport) => (SPORT_LEAGUES[sport] || []).slice(0, LIVE_SPORT_LIMITS[sport] || 2).map((league) => ({ sport, league }))
    );
  }
  return targetSports.flatMap(
    (sport) => (SPORT_LEAGUES[sport] || [normalizeLeagueParam("", sport)]).slice(0, LIVE_SPORT_LIMITS[sport] || 4).map((league) => ({ sport, league }))
  );
}
__name(buildEndpoints, "buildEndpoints");
function sortMatches(left, right) {
  const statusOrder = { live: 0, upcoming: 1, finished: 2 };
  const statusDiff = (statusOrder[left.status] ?? 9) - (statusOrder[right.status] ?? 9);
  if (statusDiff !== 0) return statusDiff;
  if (left.status === "finished" && right.status === "finished") {
    return new Date(right.date) - new Date(left.date);
  }
  return new Date(left.date) - new Date(right.date);
}
__name(sortMatches, "sortMatches");
async function onRequest3(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sportParam = String(url.searchParams.get("sport") || url.searchParams.get("s") || "all").toLowerCase();
  const leagueParam = url.searchParams.get("league") || url.searchParams.get("l") || "";
  try {
    const endpoints = buildEndpoints(sportParam, leagueParam).slice(0, 64);
    const results = await Promise.all(
      endpoints.map(async ({ sport, league }) => {
        try {
          const data = await fetchLeagueScoreboard(sport, league, { limit: 50 });
          const leagueName = data.leagues?.[0]?.name || league.toUpperCase();
          return (data.events || []).map((event) => normalizeScoreboardEvent(event, sport, league, leagueName));
        } catch (error) {
          return [];
        }
      })
    );
    const matches = dedupeById(results.flat()).sort(sortMatches);
    const hasLive = matches.some((m) => m.status === "live");
    const { ttl, reason } = calculateTTL(hasLive ? "live" : "upcoming");
    return jsonResponse(
      {
        matches,
        meta: {
          sport: sportParam,
          league: normalizeLeagueParam(leagueParam),
          endpoints: endpoints.length,
          hasLive,
          ...buildFeedMeta()
        }
      },
      ttl,
      200,
      reason
    );
  } catch (error) {
    return jsonResponse(
      {
        error: error.message,
        matches: [],
        meta: buildFeedMeta({ degraded: true })
      },
      15,
      500,
      "error-fallback"
    );
  }
}
__name(onRequest3, "onRequest");

// api/match.js
function buildInternalApiUrl(request, path, params = {}) {
  const url = new URL(path, request.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== void 0 && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}
__name(buildInternalApiUrl, "buildInternalApiUrl");
async function fetchInternalJson(request, path, params = {}) {
  const response = await fetch(buildInternalApiUrl(request, path, params), {
    headers: {
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`Internal request failed: ${response.status} for ${path}`);
  }
  return response.json();
}
__name(fetchInternalJson, "fetchInternalJson");
async function fetchExternalJson(sport, league, resource, query = {}) {
  const response = await fetchWithFallback(buildFallbackUrls(sport, league, resource, query), {}, 5e3);
  return response.json();
}
__name(fetchExternalJson, "fetchExternalJson");
function buildSummaryCandidates(id, sport, league) {
  const normalizedSport = normalizeSportParam(sport, league);
  const normalizedLeague = normalizeLeagueParam(league, normalizedSport);
  const candidates = [];
  const pushCandidate = /* @__PURE__ */ __name((candidateSport, candidateLeague) => {
    if (!candidateSport || !candidateLeague) return;
    if (candidates.some((entry) => entry.sport === candidateSport && entry.league === candidateLeague)) return;
    candidates.push({ sport: candidateSport, league: candidateLeague });
  }, "pushCandidate");
  pushCandidate(normalizedSport, normalizedLeague);
  (SPORT_LEAGUES[normalizedSport] || []).slice(0, 6).forEach((candidateLeague) => pushCandidate(normalizedSport, candidateLeague));
  pushCandidate("soccer", "eng.1");
  pushCandidate("soccer", "esp.1");
  pushCandidate("basketball", "nba");
  pushCandidate("football", "nfl");
  return candidates.map(
    ({ sport: candidateSport, league: candidateLeague }) => siteApiUrl(candidateSport, candidateLeague, "summary", { event: id })
  );
}
__name(buildSummaryCandidates, "buildSummaryCandidates");
function buildScoreboardCandidates(sport, league) {
  const normalizedSport = normalizeSportParam(sport, league);
  const normalizedLeague = normalizeLeagueParam(league, normalizedSport);
  const candidates = [];
  const dates = parseDateRange(6);
  const pushPair = /* @__PURE__ */ __name((candidateSport, candidateLeague) => {
    if (!candidateSport || !candidateLeague) return;
    if (candidates.some((entry) => entry.sport === candidateSport && entry.league === candidateLeague)) return;
    candidates.push({ sport: candidateSport, league: candidateLeague });
  }, "pushPair");
  pushPair(normalizedSport, normalizedLeague);
  (SPORT_LEAGUES[normalizedSport] || []).slice(0, 4).forEach((candidateLeague) => pushPair(normalizedSport, candidateLeague));
  pushPair("soccer", "eng.1");
  pushPair("basketball", "nba");
  pushPair("football", "nfl");
  return candidates.flatMap(
    ({ sport: candidateSport, league: candidateLeague }) => dates.map((date) => ({ sport: candidateSport, league: candidateLeague, date }))
  );
}
__name(buildScoreboardCandidates, "buildScoreboardCandidates");
function getCompetitionContext(data = {}) {
  const header = data.header || {};
  const competition = header.competitions?.[0] || data.competitions?.[0] || {};
  const competitors = competition.competitors || [];
  return {
    header,
    competition,
    competitors,
    home: competitors.find((entry) => entry.homeAway === "home") || {},
    away: competitors.find((entry) => entry.homeAway === "away") || {}
  };
}
__name(getCompetitionContext, "getCompetitionContext");
function uniqueBy(items = [], keyBuilder = (item) => JSON.stringify(item)) {
  const seen = /* @__PURE__ */ new Set();
  return items.filter((item) => {
    const key = keyBuilder(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
__name(uniqueBy, "uniqueBy");
function normalizeStatValue(entry = {}) {
  const value = entry.displayValue ?? entry.value ?? entry.summary ?? entry.display ?? "";
  return String(value || "").trim();
}
__name(normalizeStatValue, "normalizeStatValue");
function buildStatPairs(homeStats = [], awayStats = []) {
  const awayMap = /* @__PURE__ */ new Map();
  awayStats.forEach((entry) => {
    const key = String(entry.name || entry.label || entry.displayName || entry.abbreviation || "").trim().toLowerCase();
    if (key) awayMap.set(key, entry);
  });
  const stats = [];
  homeStats.forEach((entry) => {
    const key = String(entry.name || entry.label || entry.displayName || entry.abbreviation || "").trim().toLowerCase();
    const label = entry.label || entry.displayName || entry.name || entry.abbreviation || "";
    const homeValue = normalizeStatValue(entry);
    const awayValue = normalizeStatValue(awayMap.get(key) || {});
    if (!label || !homeValue && !awayValue) return;
    stats.push({
      label,
      home: homeValue || "\u2014",
      away: awayValue || "\u2014"
    });
  });
  if (!stats.length) {
    awayStats.forEach((entry) => {
      const label = entry.label || entry.displayName || entry.name || entry.abbreviation || "";
      const awayValue = normalizeStatValue(entry);
      if (!label || !awayValue) return;
      stats.push({
        label,
        home: "\u2014",
        away: awayValue
      });
    });
  }
  return uniqueBy(stats, (entry) => `${entry.label}:${entry.home}:${entry.away}`);
}
__name(buildStatPairs, "buildStatPairs");
function formatLeaderValue(leader = {}) {
  const name = leader.athlete?.shortName || leader.athlete?.displayName || "";
  const value = leader.displayValue || leader.value || "";
  return [name, value].filter(Boolean).join(" ").trim();
}
__name(formatLeaderValue, "formatLeaderValue");
function buildSyntheticStatsFromContext(data = {}) {
  const { competition, home, away } = getCompetitionContext(data);
  const stats = [];
  const directStats = buildStatPairs(home.statistics || [], away.statistics || []);
  if (directStats.length) return directStats.slice(0, 8);
  const homeRecord = home.records?.[0]?.summary || "";
  const awayRecord = away.records?.[0]?.summary || "";
  if (homeRecord || awayRecord) {
    stats.push({
      label: "Record",
      home: homeRecord || "\u2014",
      away: awayRecord || "\u2014"
    });
  }
  const maxLeaderGroups = Math.max(home.leaders?.length || 0, away.leaders?.length || 0);
  for (let index = 0; index < maxLeaderGroups; index += 1) {
    const homeGroup = home.leaders?.[index] || {};
    const awayGroup = away.leaders?.[index] || {};
    const label = homeGroup.displayName || awayGroup.displayName || homeGroup.name || awayGroup.name || "";
    const homeValue = formatLeaderValue(homeGroup.leaders?.[0] || {});
    const awayValue = formatLeaderValue(awayGroup.leaders?.[0] || {});
    if (!label || !homeValue && !awayValue) continue;
    stats.push({
      label,
      home: homeValue || "\u2014",
      away: awayValue || "\u2014"
    });
  }
  const lastPlayText = competition.situation?.lastPlay?.text || data.situation?.lastPlay?.text || "";
  const statusText = competition.status?.type?.detail || competition.status?.type?.shortDetail || "";
  if (lastPlayText || statusText) {
    stats.push({
      label: "Latest Update",
      home: (lastPlayText || statusText || "Match update").slice(0, 54),
      away: statusText || mapStatus(competition.status?.type?.state)
    });
  }
  return uniqueBy(stats, (entry) => `${entry.label}:${entry.home}:${entry.away}`).slice(0, 8);
}
__name(buildSyntheticStatsFromContext, "buildSyntheticStatsFromContext");
function buildSyntheticLineupFromLeaders(competitor = {}) {
  const players = (competitor.leaders || []).flatMap(
    (group, groupIndex) => (group.leaders || []).map((leader, leaderIndex) => ({
      name: leader.athlete?.displayName || leader.athlete?.shortName || "",
      number: leader.athlete?.jersey || "",
      position: group.displayName || group.name || "Key Player",
      starter: groupIndex === 0 || leaderIndex === 0,
      face: leader.athlete?.headshot?.href || FALLBACK_LOGO
    }))
  ).filter((entry) => entry.name);
  return uniqueBy(players, (entry) => entry.name.toLowerCase()).slice(0, 8);
}
__name(buildSyntheticLineupFromLeaders, "buildSyntheticLineupFromLeaders");
function buildLineupFromBoxscore(data = {}, side = "home", teamId = "") {
  const boxes = data.boxscore?.players || [];
  const box = boxes.find((entry) => {
    const boxTeamId = String(entry.team?.id || entry.team?.$ref || "");
    return teamId && boxTeamId.includes(String(teamId)) || entry.homeAway === side;
  });
  if (!box?.statistics?.length) return [];
  const players = box.statistics.flatMap(
    (group, groupIndex) => (group.athletes || []).map((athlete, athleteIndex) => ({
      name: athlete.athlete?.displayName || athlete.displayName || athlete.name || "",
      number: athlete.athlete?.jersey || athlete.jersey || "",
      position: athlete.athlete?.position?.abbreviation || athlete.position?.abbreviation || group.displayName || "Player",
      starter: athlete.starter ?? (groupIndex === 0 && athleteIndex < 5),
      face: athlete.athlete?.headshot?.href || athlete.headshot?.href || FALLBACK_LOGO
    }))
  ).filter((entry) => entry.name);
  return uniqueBy(players, (entry) => entry.name.toLowerCase()).slice(0, 12);
}
__name(buildLineupFromBoxscore, "buildLineupFromBoxscore");
function inferTimelineSide(teamId = "", homeId = "", awayId = "") {
  if (teamId && String(teamId) === String(homeId)) return "home";
  if (teamId && String(teamId) === String(awayId)) return "away";
  return "neutral";
}
__name(inferTimelineSide, "inferTimelineSide");
function formatTimelineDate(value = "") {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
__name(formatTimelineDate, "formatTimelineDate");
function buildSyntheticTimelineFromContext(data = {}, homeId = "", awayId = "") {
  const { header, competition, home, away } = getCompetitionContext(data);
  const items = [];
  const statusType = competition.status?.type || {};
  const displayClock = competition.status?.displayClock || statusType.shortDetail || statusType.detail || "";
  const lastPlayText = competition.situation?.lastPlay?.text || data.situation?.lastPlay?.text || "";
  const lastPlayTeamId = competition.situation?.lastPlay?.team?.id || data.situation?.lastPlay?.team?.id || "";
  if (lastPlayText) {
    items.push({
      time: displayClock || "LIVE",
      type: "event",
      text: lastPlayText,
      player: lastPlayText,
      side: inferTimelineSide(lastPlayTeamId, homeId, awayId)
    });
  }
  const statusText = statusType.detail || statusType.shortDetail || statusType.description || "";
  if (statusText) {
    items.push({
      time: displayClock || mapStatus(statusType.state).toUpperCase(),
      type: mapStatus(statusType.state) === "finished" ? "result" : "event",
      text: statusText,
      player: statusText,
      side: "neutral"
    });
  }
  const scheduledText = formatTimelineDate(competition.date || header.date || "");
  if (scheduledText) {
    items.push({
      time: "DATE",
      type: "event",
      text: `Scheduled for ${scheduledText}`,
      player: `Scheduled for ${scheduledText}`,
      side: "neutral"
    });
  }
  if (competition.venue?.fullName) {
    items.push({
      time: "VENUE",
      type: "event",
      text: `Venue: ${competition.venue.fullName}`,
      player: `Venue: ${competition.venue.fullName}`,
      side: "neutral"
    });
  }
  [
    { side: "home", competitor: home },
    { side: "away", competitor: away }
  ].forEach(({ side, competitor }) => {
    const leaderGroup = competitor.leaders?.[0];
    const leader = leaderGroup?.leaders?.[0];
    const leaderText = formatLeaderValue(leader);
    if (!leaderText) return;
    items.push({
      time: "STAR",
      type: "event",
      text: leaderText,
      player: leaderText,
      side
    });
  });
  return uniqueBy(items, (entry) => `${entry.time}:${entry.text}:${entry.side}`).slice(0, 8);
}
__name(buildSyntheticTimelineFromContext, "buildSyntheticTimelineFromContext");
function buildSyntheticLineupFromTeam(team = {}) {
  const leader = team.leader || null;
  if (!leader?.name && !leader?.value) return [];
  return [
    {
      name: leader.name || team.name || "Key Player",
      number: "",
      position: "Key Player",
      starter: true,
      face: team.logo || FALLBACK_LOGO
    }
  ];
}
__name(buildSyntheticLineupFromTeam, "buildSyntheticLineupFromTeam");
function buildSyntheticStatsFromMatch(match2 = {}) {
  const stats = [];
  if (match2.homeTeam?.record || match2.awayTeam?.record) {
    stats.push({
      label: "Record",
      home: match2.homeTeam?.record || "\u2014",
      away: match2.awayTeam?.record || "\u2014"
    });
  }
  if (match2.homeTeam?.leader || match2.awayTeam?.leader) {
    stats.push({
      label: "Top Performer",
      home: [match2.homeTeam?.leader?.name, match2.homeTeam?.leader?.value].filter(Boolean).join(" ") || "\u2014",
      away: [match2.awayTeam?.leader?.name, match2.awayTeam?.leader?.value].filter(Boolean).join(" ") || "\u2014"
    });
  }
  if (match2.statusText || match2.time) {
    stats.push({
      label: "Match Status",
      home: match2.statusText || match2.time || match2.status || "Update",
      away: match2.league || match2.leagueSlug || "League"
    });
  }
  return uniqueBy(stats, (entry) => `${entry.label}:${entry.home}:${entry.away}`).slice(0, 6);
}
__name(buildSyntheticStatsFromMatch, "buildSyntheticStatsFromMatch");
function buildSyntheticTimelineFromMatch(match2 = {}) {
  const items = [];
  if (match2.statusText || match2.time) {
    const statusText = match2.statusText || match2.time || `${match2.status || "scheduled"} update`;
    items.push({
      time: match2.time || match2.status?.toUpperCase() || "UPDATE",
      type: match2.status === "finished" ? "result" : "event",
      text: statusText,
      player: statusText,
      side: "neutral"
    });
  }
  const scheduledText = formatTimelineDate(match2.date || "");
  if (scheduledText) {
    items.push({
      time: "DATE",
      type: "event",
      text: `Scheduled for ${scheduledText}`,
      player: `Scheduled for ${scheduledText}`,
      side: "neutral"
    });
  }
  if (match2.venue) {
    items.push({
      time: "VENUE",
      type: "event",
      text: `Venue: ${match2.venue}`,
      player: `Venue: ${match2.venue}`,
      side: "neutral"
    });
  }
  [
    { side: "home", team: match2.homeTeam || {} },
    { side: "away", team: match2.awayTeam || {} }
  ].forEach(({ side, team }) => {
    if (!team.leader?.name && !team.leader?.value) return;
    const leaderText = [team.leader?.name, team.leader?.value].filter(Boolean).join(" ");
    items.push({
      time: "STAR",
      type: "event",
      text: leaderText,
      player: leaderText,
      side
    });
  });
  return uniqueBy(items, (entry) => `${entry.time}:${entry.text}:${entry.side}`).slice(0, 6);
}
__name(buildSyntheticTimelineFromMatch, "buildSyntheticTimelineFromMatch");
function normalizeStats(data = {}) {
  const boxscoreTeams = data.boxscore?.teams || [];
  const homeStats = boxscoreTeams.find((team) => team.homeAway === "home")?.statistics || [];
  const awayStats = boxscoreTeams.find((team) => team.homeAway === "away")?.statistics || [];
  const boxscoreStats = buildStatPairs(homeStats, awayStats);
  if (boxscoreStats.length) return boxscoreStats.slice(0, 8);
  return buildSyntheticStatsFromContext(data);
}
__name(normalizeStats, "normalizeStats");
function normalizeLineup(data = {}, side = "home") {
  const roster = data.rosters?.find((entry) => entry.homeAway === side);
  if (roster?.roster?.length) {
    return roster.roster.map((entry) => ({
      name: entry.athlete?.displayName || "",
      number: entry.jersey || "",
      position: entry.position?.abbreviation || "",
      starter: Boolean(entry.starter),
      face: entry.athlete?.headshot?.href || FALLBACK_LOGO
    }));
  }
  const { home, away } = getCompetitionContext(data);
  const competitor = side === "home" ? home : away;
  const teamId = competitor.team?.id || "";
  const boxscoreLineup = buildLineupFromBoxscore(data, side, teamId);
  if (boxscoreLineup.length) return boxscoreLineup;
  return buildSyntheticLineupFromLeaders(competitor);
}
__name(normalizeLineup, "normalizeLineup");
function normalizeTimeline(data = {}, homeId = "", awayId = "") {
  const plays = data.plays || data.header?.competitions?.[0]?.details || [];
  const timeline = (plays || []).slice(-50).reverse().map((play) => {
    const text = play.text || play.athletesInvolved?.[0]?.displayName || "";
    const type = (play.type?.text || play.type?.name || "").toLowerCase();
    const teamId = play.team?.id || "";
    let side = "neutral";
    if (teamId === homeId) side = "home";
    if (teamId === awayId) side = "away";
    let eventType = "event";
    if (type.includes("goal") || type.includes("score")) eventType = "goal";
    else if (type.includes("yellow") || type.includes("caution")) eventType = "yellow-card";
    else if (type.includes("red") || type.includes("ejection")) eventType = "red-card";
    else if (type.includes("sub") || type.includes("replace")) eventType = "substitution";
    else if (type.includes("shot") || type.includes("attempt")) eventType = "shot";
    else if (type.includes("foul") || type.includes("penalty")) eventType = "foul";
    else if (type.includes("corner")) eventType = "corner";
    else if (type.includes("var") || type.includes("review")) eventType = "var";
    return {
      time: play.clock?.displayValue || play.clock?.value || "0'",
      type: eventType,
      text,
      // Keep original text
      player: play.athletesInvolved?.[0]?.displayName || "",
      side,
      score: play.homeScore !== void 0 ? `${play.homeScore} - ${play.awayScore}` : null
    };
  });
  if (timeline.length) return timeline;
  return buildSyntheticTimelineFromContext(data, homeId, awayId);
}
__name(normalizeTimeline, "normalizeTimeline");
function normalizeOdds(data = {}) {
  const odds = data.pickcenter?.[0] || null;
  if (!odds) return null;
  return {
    details: odds.details || "Match Odds",
    homeOdds: odds.homeTeamOdds?.moneyLine || odds.homeTeamOdds?.current?.moneyLine || "-",
    awayOdds: odds.awayTeamOdds?.moneyLine || odds.awayTeamOdds?.current?.moneyLine || "-",
    drawOdds: odds.drawOdds?.moneyLine || odds.drawOdds?.current?.moneyLine || null
  };
}
__name(normalizeOdds, "normalizeOdds");
function normalizeSummary(data = {}, fallbackSport = "soccer", fallbackLeague = "eng.1") {
  const header = data.header || {};
  const competition = header.competitions?.[0] || {};
  const home = competition.competitors?.find((entry) => entry.homeAway === "home") || {};
  const away = competition.competitors?.find((entry) => entry.homeAway === "away") || {};
  const statusType = competition.status?.type || {};
  const timeline = normalizeTimeline(data, home.team?.id || "", away.team?.id || "");
  const commentary = (data.commentary || []).map((entry) => ({
    time: entry.time || entry.clock?.displayValue || "",
    text: entry.text || "",
    type: entry.type?.text || "commentary"
  }));
  if (!commentary.length && timeline.length) {
    timeline.slice(0, 6).forEach((entry) => {
      commentary.push({
        time: entry.time || "",
        text: entry.text || entry.player || "",
        type: entry.type || "commentary"
      });
    });
  }
  return {
    id: header.id || competition.id || "",
    sport: fallbackSport,
    leagueSlug: fallbackLeague,
    league: data.leagues?.[0]?.name || header.league?.name || fallbackLeague.toUpperCase(),
    status: mapStatus(statusType.state),
    statusText: statusType.detail || statusType.description || statusType.shortDetail || "",
    time: statusType.shortDetail || statusType.detail || "",
    date: header.competitions?.[0]?.date || header.season?.type?.name || "",
    venue: competition.venue?.fullName || "",
    broadcast: competition.broadcasts?.map((entry) => entry.media?.shortName || entry.names?.join(", ")).filter(Boolean).join(", "),
    homeTeam: {
      id: home.team?.id || "",
      name: home.team?.displayName || home.team?.name || "Home Team",
      abbreviation: home.team?.abbreviation || "",
      logo: home.team?.logos?.[0]?.href || home.team?.logo || FALLBACK_LOGO,
      score: home.score || "0",
      lineup: normalizeLineup(data, "home")
    },
    awayTeam: {
      id: away.team?.id || "",
      name: away.team?.displayName || away.team?.name || "Away Team",
      abbreviation: away.team?.abbreviation || "",
      logo: away.team?.logos?.[0]?.href || away.team?.logo || FALLBACK_LOGO,
      score: away.score || "0",
      lineup: normalizeLineup(data, "away")
    },
    stats: normalizeStats(data),
    timeline,
    commentary: commentary.concat((data.news || []).map((entry) => ({ text: entry.headline, type: "news" }))),
    odds: normalizeOdds(data),
    h2h: [],
    situation: data.situation || null
  };
}
__name(normalizeSummary, "normalizeSummary");
function normalizeFallbackScoreboardSummary(event = {}, sport = "soccer", league = "eng.1", leagueName = "") {
  const normalized = normalizeScoreboardEvent(event, sport, league, leagueName);
  const syntheticTimeline = buildSyntheticTimelineFromMatch(normalized);
  return {
    id: normalized.id,
    sport: normalized.sport,
    leagueSlug: normalized.leagueSlug,
    league: normalized.league,
    status: normalized.status,
    statusText: normalized.statusText,
    time: normalized.time,
    date: normalized.date,
    venue: normalized.venue,
    broadcast: normalized.broadcast,
    homeTeam: {
      ...normalized.homeTeam,
      lineup: buildSyntheticLineupFromTeam(normalized.homeTeam)
    },
    awayTeam: {
      ...normalized.awayTeam,
      lineup: buildSyntheticLineupFromTeam(normalized.awayTeam)
    },
    stats: buildSyntheticStatsFromMatch(normalized),
    timeline: syntheticTimeline,
    commentary: syntheticTimeline.map((entry) => ({
      time: entry.time,
      text: entry.text || entry.player || "",
      type: entry.type || "commentary"
    })),
    odds: null,
    h2h: [],
    situation: null
  };
}
__name(normalizeFallbackScoreboardSummary, "normalizeFallbackScoreboardSummary");
function normalizeFeedFallbackSummary(match2 = {}, h2h = []) {
  const syntheticTimeline = buildSyntheticTimelineFromMatch(match2);
  return {
    id: match2.id || "",
    sport: match2.sport || "soccer",
    leagueSlug: match2.leagueSlug || "eng.1",
    league: match2.league || (match2.leagueSlug || "MATCH").toUpperCase(),
    status: match2.status || "upcoming",
    statusText: match2.statusText || "",
    time: match2.time || "",
    date: match2.date || "",
    venue: match2.venue || "",
    broadcast: match2.broadcast || "",
    homeTeam: {
      ...match2.homeTeam || {},
      name: match2.homeTeam?.name || "Home Team",
      logo: match2.homeTeam?.logo || FALLBACK_LOGO,
      score: match2.homeTeam?.score || "0",
      lineup: Array.isArray(match2.homeTeam?.lineup) && match2.homeTeam.lineup.length ? match2.homeTeam.lineup : buildSyntheticLineupFromTeam(match2.homeTeam || {})
    },
    awayTeam: {
      ...match2.awayTeam || {},
      name: match2.awayTeam?.name || "Away Team",
      logo: match2.awayTeam?.logo || FALLBACK_LOGO,
      score: match2.awayTeam?.score || "0",
      lineup: Array.isArray(match2.awayTeam?.lineup) && match2.awayTeam.lineup.length ? match2.awayTeam.lineup : buildSyntheticLineupFromTeam(match2.awayTeam || {})
    },
    stats: buildSyntheticStatsFromMatch(match2),
    timeline: syntheticTimeline,
    commentary: syntheticTimeline.map((entry) => ({
      time: entry.time,
      text: entry.text || entry.player || "",
      type: entry.type || "commentary"
    })),
    odds: null,
    h2h,
    situation: null
  };
}
__name(normalizeFeedFallbackSummary, "normalizeFeedFallbackSummary");
function hasUsefulSummaryText(value = "", blocked = []) {
  const text = String(value || "").trim();
  if (!text) return false;
  return !blocked.some((entry) => text.toLowerCase() === String(entry || "").trim().toLowerCase());
}
__name(hasUsefulSummaryText, "hasUsefulSummaryText");
function isGenericTeam(team = {}) {
  const name = String(team.name || team.fullName || "").trim().toLowerCase();
  const abbreviation = String(team.abbreviation || "").trim().toLowerCase();
  return !name || ["home team", "away team", "home", "away", "tbd"].includes(name) || ["hom", "awa", "tbd"].includes(abbreviation);
}
__name(isGenericTeam, "isGenericTeam");
function needsSummaryHydration(summary = {}) {
  if (!summary?.homeTeam || !summary?.awayTeam) return true;
  if (isGenericTeam(summary.homeTeam) || isGenericTeam(summary.awayTeam)) return true;
  if (!hasUsefulSummaryText(summary.league, ["sports event", "upcoming event"])) return true;
  if (!hasUsefulSummaryText(summary.date, ["scheduled event"])) return true;
  if (summary.status === "upcoming" && !hasUsefulSummaryText(summary.venue, ["tbd", "tbd stadium"])) return true;
  const hasStats = Array.isArray(summary.stats) && summary.stats.length > 0;
  const hasTimeline = Array.isArray(summary.timeline) && summary.timeline.length > 0;
  const hasLineups = Array.isArray(summary.homeTeam?.lineup) && summary.homeTeam.lineup.length > 0 || Array.isArray(summary.awayTeam?.lineup) && summary.awayTeam.lineup.length > 0;
  if ((summary.status === "live" || summary.status === "finished") && (!hasStats || !hasTimeline || !hasLineups)) return true;
  if (summary.status === "upcoming" && (!Array.isArray(summary.h2h) || !summary.h2h.length)) return true;
  return false;
}
__name(needsSummaryHydration, "needsSummaryHydration");
function pickSummaryText(primary, fallback, blocked = []) {
  if (hasUsefulSummaryText(primary, blocked)) return String(primary).trim();
  if (hasUsefulSummaryText(fallback, blocked)) return String(fallback).trim();
  return String(primary || fallback || "").trim();
}
__name(pickSummaryText, "pickSummaryText");
function mergeSummaryPayload(primary = {}, fallback = {}) {
  const primaryHome = primary.homeTeam || {};
  const primaryAway = primary.awayTeam || {};
  const fallbackHome = fallback.homeTeam || {};
  const fallbackAway = fallback.awayTeam || {};
  return {
    ...fallback,
    ...primary,
    sport: primary.sport || fallback.sport || "soccer",
    leagueSlug: primary.leagueSlug || fallback.leagueSlug || "eng.1",
    league: pickSummaryText(primary.league, fallback.league, ["sports event", "upcoming event"]),
    status: primary.status || fallback.status || "upcoming",
    statusText: pickSummaryText(primary.statusText, fallback.statusText),
    time: pickSummaryText(primary.time, fallback.time, ["00:00"]),
    date: pickSummaryText(primary.date, fallback.date, ["scheduled event"]),
    venue: pickSummaryText(primary.venue, fallback.venue, ["tbd", "tbd stadium"]),
    broadcast: pickSummaryText(primary.broadcast, fallback.broadcast),
    stats: Array.isArray(primary.stats) && primary.stats.length ? primary.stats : fallback.stats || [],
    timeline: Array.isArray(primary.timeline) && primary.timeline.length ? primary.timeline : fallback.timeline || [],
    commentary: Array.isArray(primary.commentary) && primary.commentary.length ? primary.commentary : fallback.commentary || [],
    odds: primary.odds || fallback.odds || null,
    h2h: Array.isArray(primary.h2h) && primary.h2h.length ? primary.h2h : fallback.h2h || [],
    situation: primary.situation || fallback.situation || null,
    homeTeam: {
      ...fallbackHome,
      ...primaryHome,
      name: !isGenericTeam(primaryHome) ? primaryHome.name || fallbackHome.name || "Home Team" : fallbackHome.name || primaryHome.name || "Home Team",
      fullName: !isGenericTeam(primaryHome) ? primaryHome.fullName || fallbackHome.fullName || primaryHome.name || fallbackHome.name || "Home Team" : fallbackHome.fullName || primaryHome.fullName || fallbackHome.name || primaryHome.name || "Home Team",
      logo: primaryHome.logo || fallbackHome.logo || FALLBACK_LOGO,
      score: primaryHome.score ?? fallbackHome.score ?? "0",
      lineup: Array.isArray(primaryHome.lineup) && primaryHome.lineup.length ? primaryHome.lineup : fallbackHome.lineup || []
    },
    awayTeam: {
      ...fallbackAway,
      ...primaryAway,
      name: !isGenericTeam(primaryAway) ? primaryAway.name || fallbackAway.name || "Away Team" : fallbackAway.name || primaryAway.name || "Away Team",
      fullName: !isGenericTeam(primaryAway) ? primaryAway.fullName || fallbackAway.fullName || primaryAway.name || fallbackAway.name || "Away Team" : fallbackAway.fullName || primaryAway.fullName || fallbackAway.name || primaryAway.name || "Away Team",
      logo: primaryAway.logo || fallbackAway.logo || FALLBACK_LOGO,
      score: primaryAway.score ?? fallbackAway.score ?? "0",
      lineup: Array.isArray(primaryAway.lineup) && primaryAway.lineup.length ? primaryAway.lineup : fallbackAway.lineup || []
    }
  };
}
__name(mergeSummaryPayload, "mergeSummaryPayload");
function buildTeamKeySet(team = {}) {
  return new Set(
    [
      team.id,
      team.abbreviation,
      team.name,
      team.fullName
    ].map((value) => String(value || "").trim().toLowerCase()).filter(Boolean)
  );
}
__name(buildTeamKeySet, "buildTeamKeySet");
function isSameMatchup(match2 = {}, homeTeam = {}, awayTeam = {}) {
  const homeKeys = buildTeamKeySet(homeTeam);
  const awayKeys = buildTeamKeySet(awayTeam);
  const candidateHomeKeys = buildTeamKeySet(match2.homeTeam || {});
  const candidateAwayKeys = buildTeamKeySet(match2.awayTeam || {});
  const hasKeyMatch = /* @__PURE__ */ __name((left, right) => [...left].some((value) => right.has(value)), "hasKeyMatch");
  const direct = hasKeyMatch(homeKeys, candidateHomeKeys) && hasKeyMatch(awayKeys, candidateAwayKeys);
  const reverse = hasKeyMatch(homeKeys, candidateAwayKeys) && hasKeyMatch(awayKeys, candidateHomeKeys);
  return direct || reverse;
}
__name(isSameMatchup, "isSameMatchup");
function formatHeadToHeadDate(value = "") {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
__name(formatHeadToHeadDate, "formatHeadToHeadDate");
function normalizeHeadToHead(matches = [], homeTeam = {}, awayTeam = {}, excludeId = "") {
  return uniqueBy(
    matches.filter((match2) => String(match2.id) !== String(excludeId)).filter((match2) => match2.status === "finished").filter((match2) => isSameMatchup(match2, homeTeam, awayTeam)).sort((left, right) => new Date(right.date) - new Date(left.date)).slice(0, 5).map((match2) => ({
      date: formatHeadToHeadDate(match2.date),
      home: match2.homeTeam?.abbreviation || match2.homeTeam?.name || "Home",
      away: match2.awayTeam?.abbreviation || match2.awayTeam?.name || "Away",
      score: `${match2.homeTeam?.score || "0"} - ${match2.awayTeam?.score || "0"}`,
      result: match2.statusText || "Final"
    })),
    (entry) => `${entry.date}:${entry.home}:${entry.away}:${entry.score}`
  );
}
__name(normalizeHeadToHead, "normalizeHeadToHead");
async function buildHeadToHeadFallback(request, match2 = {}, sport = "soccer", league = "eng.1") {
  if (!match2.homeTeam || !match2.awayTeam) return [];
  const candidates = [];
  const pushCandidate = /* @__PURE__ */ __name((path, params = {}) => {
    const key = `${path}:${JSON.stringify(params)}`;
    if (candidates.some((entry) => entry.key === key)) return;
    candidates.push({ key, path, params });
  }, "pushCandidate");
  pushCandidate("/api/results", { sport, league, days: 7 });
  pushCandidate("/api/results", { sport, days: 7 });
  pushCandidate("/api/results", { sport: "all", days: 7 });
  const matches = [];
  for (const candidate of candidates) {
    try {
      const data = await fetchInternalJson(request, candidate.path, candidate.params);
      matches.push(...data.matches || []);
    } catch (error) {
      continue;
    }
  }
  return normalizeHeadToHead(matches, match2.homeTeam, match2.awayTeam, match2.id);
}
__name(buildHeadToHeadFallback, "buildHeadToHeadFallback");
async function findFeedFallback(request, id, sport, league) {
  const normalizedSport = normalizeSportParam(sport, league);
  const normalizedLeague = normalizeLeagueParam(league, normalizedSport);
  const candidates = [];
  const pushCandidate = /* @__PURE__ */ __name((path, params = {}) => {
    const key = `${path}:${JSON.stringify(params)}`;
    if (candidates.some((candidate) => candidate.key === key)) return;
    candidates.push({ key, path, params });
  }, "pushCandidate");
  pushCandidate("/api/results", { sport: normalizedSport, league: normalizedLeague, days: 7 });
  pushCandidate("/api/results", { sport: normalizedSport, days: 7 });
  pushCandidate("/api/live", { sport: normalizedSport, league: normalizedLeague });
  pushCandidate("/api/live", { sport: normalizedSport });
  pushCandidate("/api/upcoming", { sport: normalizedSport, league: normalizedLeague, days: 7 });
  pushCandidate("/api/upcoming", { sport: normalizedSport, days: 7 });
  pushCandidate("/api/results", { sport: "all", days: 7 });
  pushCandidate("/api/live", { sport: "all" });
  pushCandidate("/api/upcoming", { sport: "all", days: 7 });
  for (const candidate of candidates) {
    try {
      const data = await fetchInternalJson(request, candidate.path, candidate.params);
      const match2 = (data.matches || []).find((entry) => String(entry.id) === String(id));
      if (match2) {
        const h2h = await buildHeadToHeadFallback(request, match2, normalizedSport, normalizedLeague);
        return normalizeFeedFallbackSummary(match2, h2h);
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}
__name(findFeedFallback, "findFeedFallback");
async function findScoreboardFallback(id, sport, league) {
  const candidates = buildScoreboardCandidates(sport, league);
  for (const candidate of candidates) {
    try {
      const data = await fetchExternalJson(candidate.sport, candidate.league, "scoreboard", { dates: candidate.date, limit: 100 });
      const event = (data.events || []).find((entry) => String(entry.id) === String(id));
      if (event) {
        return normalizeFallbackScoreboardSummary(
          event,
          candidate.sport,
          candidate.league,
          data.leagues?.[0]?.name || candidate.league.toUpperCase()
        );
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}
__name(findScoreboardFallback, "findScoreboardFallback");
async function onRequest4(context) {
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const sport = normalizeSportParam(url.searchParams.get("sport") || "soccer", url.searchParams.get("league") || "");
  const league = normalizeLeagueParam(url.searchParams.get("league") || "", sport || getDefaultLeague("soccer"));
  if (!id) {
    return jsonResponse({ notFound: true, meta: buildFeedMeta({ degraded: true }) }, 30, 404);
  }
  try {
    let summaryData = null;
    for (const candidate of buildSummaryCandidates(id, sport, league)) {
      try {
        const candidateUrl = new URL(candidate);
        const pathMatch = candidateUrl.pathname.match(/\/sports\/([^/]+)\/([^/]+)\/summary$/);
        if (!pathMatch) continue;
        const [, candidateSport, candidateLeague] = pathMatch;
        const eventId = candidateUrl.searchParams.get("event") || id;
        summaryData = await fetchExternalJson(candidateSport, candidateLeague, "summary", { event: eventId });
        if (summaryData?.header?.competitions?.length) break;
      } catch (error) {
        summaryData = null;
      }
    }
    if (!summaryData?.header?.competitions?.length) {
      const feedFallback = await findFeedFallback(request, id, sport, league);
      if (feedFallback) {
        return jsonResponse({ ...feedFallback, meta: buildFeedMeta({ fallback: "feed" }) }, 15);
      }
      const fallback = await findScoreboardFallback(id, sport, league);
      if (!fallback) {
        return jsonResponse({ notFound: true, meta: buildFeedMeta({ degraded: true }) }, 30, 404);
      }
      return jsonResponse({ ...fallback, meta: buildFeedMeta() }, 15);
    }
    const normalizedSummary = normalizeSummary(summaryData, sport, league);
    if (needsSummaryHydration(normalizedSummary)) {
      const feedFallback = await findFeedFallback(request, id, sport, league);
      if (feedFallback) {
        return jsonResponse({ ...mergeSummaryPayload(normalizedSummary, feedFallback), meta: buildFeedMeta({ fallback: "summary+feed" }) }, 15);
      }
      const scoreboardFallback = await findScoreboardFallback(id, sport, league);
      if (scoreboardFallback) {
        return jsonResponse({ ...mergeSummaryPayload(normalizedSummary, scoreboardFallback), meta: buildFeedMeta({ fallback: "summary+scoreboard" }) }, 15);
      }
    }
    return jsonResponse({ ...normalizedSummary, meta: buildFeedMeta() }, 15);
  } catch (error) {
    return jsonResponse({ error: error.message, meta: buildFeedMeta({ degraded: true }) }, 15, 500);
  }
}
__name(onRequest4, "onRequest");

// api/news.js
function getLeaguePairs3(sport, league, limit = 6) {
  if (league) return [{ sport, league }];
  if (sport === "all") {
    return [
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "uefa.champions" },
      { sport: "basketball", league: "nba" },
      { sport: "football", league: "nfl" },
      { sport: "hockey", league: "nhl" },
      { sport: "baseball", league: "mlb" },
      { sport: "cricket", league: "ipl" },
      { sport: "tennis", league: "atp" },
      { sport: "mma", league: "ufc" },
      { sport: "racing", league: "f1" },
      { sport: "golf", league: "pga" }
    ];
  }
  return (SPORT_LEAGUES[sport] || []).slice(0, limit).map((slug) => ({ sport, league: slug }));
}
__name(getLeaguePairs3, "getLeaguePairs");
function toTimestamp3(value = "") {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
__name(toTimestamp3, "toTimestamp");
async function onRequest5(context) {
  const { request } = context;
  const url = new URL(request.url);
  const inputSport = url.searchParams.get("sport") || url.searchParams.get("s") || "all";
  const inputLeague = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const sport = normalizeSportParam(inputSport, inputLeague);
  const league = inputLeague ? normalizeLeagueParam(inputLeague, sport) : sport === "all" ? "" : normalizeLeagueParam("", sport);
  const teamId = url.searchParams.get("team") || "";
  const parsedLimit = parseInt(url.searchParams.get("limit") || "20", 10);
  const limit = Math.max(6, Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 20, 40));
  try {
    const pairs = getLeaguePairs3(sport, league, sport === "all" ? 10 : 4);
    const results = await Promise.all(
      pairs.map(async ({ sport: s, league: l }) => {
        try {
          const data = await fetchJson(
            siteApiUrl(s, l, "news", {
              ...teamId ? { team: teamId } : {},
              limit: 18
            })
          );
          return (data.articles || []).map((article) => ({
            ...normalizeArticle(article),
            sport: s,
            league: l
          }));
        } catch {
          return [];
        }
      })
    );
    const articles = dedupeById(results.flat()).sort((a, b) => toTimestamp3(b.published) - toTimestamp3(a.published)).slice(0, limit);
    return jsonResponse({
      articles,
      trending: articles.slice(0, 5),
      latest: articles.slice(0, 10),
      meta: buildFeedMeta({ type: "news", sport, league, feeds: pairs.length })
    }, 300);
  } catch (error) {
    return jsonResponse({
      articles: [],
      trending: [],
      latest: [],
      error: error.message,
      meta: buildFeedMeta({ degraded: true, type: "news", sport, league })
    }, 30, 500);
  }
}
__name(onRequest5, "onRequest");

// api/players.js
function stripHtml2(value = "") {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/&amp;/gi, "&").replace(/&nbsp;/gi, " ").replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c))).replace(/\s+/g, " ").trim();
}
__name(stripHtml2, "stripHtml");
function slugify3(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
__name(slugify3, "slugify");
function deriveShortName2(fullName = "") {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts.join(" ");
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
__name(deriveShortName2, "deriveShortName");
async function getIplPlayers(limit = 24) {
  const [scoreboard, html] = await Promise.all([
    fetchJson(getIplScoreboardUrl()),
    fetchText(getIplSquadArticleUrl()).catch(() => "")
  ]);
  const teams = (scoreboard.teams || []).map((t) => normalizeTeamEntry(t, "cricket", "ipl"));
  const teamByKey = new Map(teams.map((t) => [String(t.name || "").toLowerCase().replace(/[^a-z0-9]+/g, ""), t]));
  const athletes = [];
  const seen = /* @__PURE__ */ new Set();
  const headings = Array.from(html.matchAll(/<h2>([\s\S]*?)<\/h2>/gi));
  headings.forEach((heading, idx) => {
    const teamName = stripHtml2(heading[1]);
    const key = String(teamName).toLowerCase().replace(/[^a-z0-9]+/g, "");
    const team = teamByKey.get(key);
    if (!team) return;
    const start = (heading.index || 0) + heading[0].length;
    const end = headings[idx + 1]?.index || html.length;
    const section = html.slice(start, end);
    const rosterMatch = section.match(/<p><b>Full(?:\s+[^<]+)?\s+squad<\/b><\/p>\s*<ul>([\s\S]*?)<\/ul>/i);
    if (!rosterMatch) return;
    const categories = Array.from(rosterMatch[1].matchAll(/<li>\s*<p><b>([^<]+)<\/b>:\s*([\s\S]*?)<\/li>/gi));
    categories.forEach((cat) => {
      const category = stripHtml2(cat[1]);
      const names = stripHtml2(cat[2]).replace(/\s*,\s*/g, ",").replace(/\.+$/, "").split(",").map((n) => n.trim()).filter(Boolean);
      names.forEach((name) => {
        const id = `ipl-${team.id}-${slugify3(name)}`;
        if (seen.has(id)) return;
        seen.add(id);
        athletes.push({
          id,
          fullName: name,
          shortName: deriveShortName2(name),
          position: { name: category, displayName: category, abbreviation: category.slice(0, 3).toUpperCase() },
          headshot: { href: team.logo || "" },
          team: { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: team.logo },
          sport: "cricket",
          league: "ipl"
        });
      });
    });
  });
  return athletes.slice(0, limit);
}
__name(getIplPlayers, "getIplPlayers");
async function onRequest6(context) {
  const { request } = context;
  const url = new URL(request.url);
  const inputSport = url.searchParams.get("sport") || url.searchParams.get("s") || "soccer";
  const inputLeague = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const sport = normalizeSportParam(inputSport, inputLeague);
  const league = inputLeague ? normalizeLeagueParam(inputLeague, sport) : sport === "all" ? "" : normalizeLeagueParam("", sport);
  const parsedLimit = parseInt(url.searchParams.get("limit") || "24", 10);
  const limit = Math.max(1, Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 24, 48));
  const teamId = url.searchParams.get("team") || "";
  try {
    if (isIplLeague(sport, league)) {
      const athletes2 = await getIplPlayers(limit);
      const filtered2 = teamId ? athletes2.filter((a) => String(a.team?.id) === String(teamId)) : athletes2;
      return jsonResponse({
        athletes: filtered2,
        meta: buildFeedMeta({ type: "players", sport, league })
      }, 300);
    }
    const leagues = league ? [{ sport, league }] : (SPORT_LEAGUES[sport] || []).slice(0, 3).map((l) => ({ sport, league: l }));
    const results = await Promise.all(
      leagues.map(async ({ sport: s, league: l }) => {
        try {
          const list = await fetchJson(coreApiUrl(s, l, "athletes", { limit, active: "true" }));
          const refs = (list.items || list.entries || list.athletes || []).map((i) => i.$ref || i.ref || i.href || "").filter(Boolean).slice(0, limit);
          return Promise.all(
            refs.map(async (ref) => {
              try {
                const detail = await fetchJson(ref);
                const athlete = normalizeAthlete(detail, { sport: s, league: l });
                const team = athlete.teamRef ? await resolveTeamFromRef(athlete.teamRef) : null;
                return {
                  ...athlete,
                  team: team ? { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: team.logo } : null
                };
              } catch {
                return null;
              }
            })
          );
        } catch {
          return [];
        }
      })
    );
    const athletes = dedupeById(results.flat().filter(Boolean));
    const filtered = teamId ? athletes.filter((a) => String(a.team?.id) === String(teamId)) : athletes;
    return jsonResponse({
      athletes: filtered.slice(0, limit),
      meta: buildFeedMeta({ type: "players", sport, league, feeds: leagues.length })
    }, 300);
  } catch (error) {
    return jsonResponse({
      athletes: [],
      error: error.message,
      meta: buildFeedMeta({ degraded: true, type: "players", sport, league })
    }, 30, 500);
  }
}
__name(onRequest6, "onRequest");

// api/results.js
var RESULTS_SPORT_LIMITS = {
  soccer: 6,
  basketball: 4,
  football: 4,
  hockey: 3,
  baseball: 3,
  cricket: 2,
  tennis: 2,
  mma: 2,
  racing: 2,
  golf: 2,
  rugby: 2,
  "rugby-league": 2,
  volleyball: 2,
  "water-polo": 2,
  lacrosse: 2,
  "field-hockey": 2,
  "australian-football": 2
};
function parsePastDateRange(daysBack = 4) {
  const dates = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = 0; i <= daysBack; i += 1) {
    const previous = new Date(now);
    previous.setDate(now.getDate() - i);
    dates.push(
      `${previous.getFullYear()}${String(previous.getMonth() + 1).padStart(2, "0")}${String(previous.getDate()).padStart(2, "0")}`
    );
  }
  return dates;
}
__name(parsePastDateRange, "parsePastDateRange");
function buildResultsEndpoints(sportParam, leagueParam, daysBack) {
  const normalizedLeague = normalizeLeagueParam(leagueParam);
  const dates = parsePastDateRange(daysBack);
  if (normalizedLeague) {
    const sport = normalizeSportParam(sportParam, normalizedLeague);
    if (isIplLeague(sport, normalizedLeague)) {
      return [{ sport, league: normalizedLeague, date: "" }];
    }
    return dates.map((date) => ({ sport, league: normalizedLeague, date }));
  }
  const targetSports = getTargetSports(sportParam, leagueParam);
  if (sportParam === "all") {
    return targetSports.flatMap(
      (sport) => (SPORT_LEAGUES[sport] || []).slice(0, RESULTS_SPORT_LIMITS[sport] || 2).flatMap(
        (league) => isIplLeague(sport, league) ? [{ sport, league, date: "" }] : dates.slice(0, Math.min(daysBack + 1, sport === "soccer" ? 4 : 3)).map((date) => ({ sport, league, date }))
      )
    );
  }
  return targetSports.flatMap(
    (sport) => (SPORT_LEAGUES[sport] || [normalizeLeagueParam("", sport)]).slice(0, RESULTS_SPORT_LIMITS[sport] || 3).flatMap(
      (league) => isIplLeague(sport, league) ? [{ sport, league, date: "" }] : dates.slice(0, Math.min(daysBack + 1, 5)).map((date) => ({ sport, league, date }))
    )
  );
}
__name(buildResultsEndpoints, "buildResultsEndpoints");
async function onRequest7(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sportParam = String(url.searchParams.get("sport") || url.searchParams.get("s") || "all").toLowerCase();
  const leagueParam = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const parsedDays = parseInt(url.searchParams.get("days") || "4", 10);
  const daysBack = Math.max(1, Math.min(Number.isFinite(parsedDays) ? parsedDays : 4, 7));
  try {
    const endpoints = buildResultsEndpoints(sportParam, leagueParam, daysBack).slice(0, 96);
    const results = await Promise.all(
      endpoints.map(async ({ sport, league, date }) => {
        try {
          const data = await fetchLeagueScoreboard(sport, league, { dates: date, limit: 50 });
          const leagueName = data.leagues?.[0]?.name || league.toUpperCase();
          return (data.events || []).map((event) => normalizeScoreboardEvent(event, sport, league, leagueName)).filter((match2) => match2.status === "finished");
        } catch (error) {
          return [];
        }
      })
    );
    const matches = dedupeById(results.flat()).sort((left, right) => new Date(right.date) - new Date(left.date));
    return jsonResponse(
      {
        matches,
        meta: {
          sport: sportParam,
          league: normalizeLeagueParam(leagueParam),
          daysBack,
          endpoints: endpoints.length,
          ...buildFeedMeta()
        }
      },
      180
    );
  } catch (error) {
    return jsonResponse(
      {
        error: error.message,
        matches: [],
        meta: buildFeedMeta({ degraded: true })
      },
      30,
      500
    );
  }
}
__name(onRequest7, "onRequest");

// api/standings.js
function getLeaguePairs4(sport, league, limit = 4) {
  if (league) return [{ sport, league }];
  if (sport === "all") {
    return [
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "esp.1" },
      { sport: "soccer", league: "ger.1" },
      { sport: "soccer", league: "ita.1" },
      { sport: "soccer", league: "fra.1" },
      { sport: "soccer", league: "uefa.champions" },
      { sport: "basketball", league: "nba" },
      { sport: "football", league: "nfl" },
      { sport: "hockey", league: "nhl" },
      { sport: "baseball", league: "mlb" },
      { sport: "cricket", league: "ipl" }
    ];
  }
  return (SPORT_LEAGUES[sport] || []).slice(0, limit).map((slug) => ({ sport, league: slug }));
}
__name(getLeaguePairs4, "getLeaguePairs");
function aliasIplStandingEntry2(entry = {}) {
  const stats = Array.isArray(entry.stats) ? [...entry.stats] : [];
  const existingNames = new Set(stats.map((s) => String(s?.name || "").toLowerCase()));
  const aliases = [
    ["matchesPlayed", ["gamesplayed", "games_played"]],
    ["matchesWon", ["wins", "winsoverall"]],
    ["matchesLost", ["losses", "loss"]],
    ["matchPoints", ["points"]],
    ["netrr", ["netrunrate", "nrr"]]
  ];
  aliases.forEach(([src, targets]) => {
    const source = stats.find((s) => String(s?.name || "").toLowerCase() === src.toLowerCase());
    if (!source) return;
    targets.forEach((alias) => {
      if (existingNames.has(alias)) return;
      stats.push({ ...source, name: alias });
      existingNames.add(alias);
    });
  });
  return { ...entry, stats };
}
__name(aliasIplStandingEntry2, "aliasIplStandingEntry");
async function onRequest8(context) {
  const { request } = context;
  const url = new URL(request.url);
  const inputSport = url.searchParams.get("sport") || url.searchParams.get("s") || "soccer";
  const inputLeague = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const sport = normalizeSportParam(inputSport, inputLeague);
  const league = inputLeague ? normalizeLeagueParam(inputLeague, sport) : sport === "all" ? "" : normalizeLeagueParam("", sport);
  try {
    if (isIplLeague(sport, league)) {
      const data = await fetchJson(getIplStandingsUrl());
      const entries = normalizeStandingsEntries(data).map(aliasIplStandingEntry2);
      return jsonResponse({
        standings: data.standings,
        children: data.children,
        entries,
        meta: buildFeedMeta({ type: "standings", sport, league })
      }, 300);
    }
    if (league) {
      const data = await fetchLeagueStandings(sport, league);
      return jsonResponse({
        standings: data.standings,
        children: data.children,
        entries: normalizeStandingsEntries(data),
        meta: buildFeedMeta({ type: "standings", sport, league })
      }, 300);
    }
    const pairs = getLeaguePairs4(sport, league, 6);
    const results = await Promise.all(
      pairs.map(async ({ sport: s, league: l }) => {
        try {
          if (isIplLeague(s, l)) {
            const data2 = await fetchJson(getIplStandingsUrl());
            return {
              sport: s,
              league: l,
              entries: normalizeStandingsEntries(data2).map(aliasIplStandingEntry2)
            };
          }
          const data = await fetchLeagueStandings(s, l);
          return {
            sport: s,
            league: l,
            entries: normalizeStandingsEntries(data)
          };
        } catch {
          return { sport: s, league: l, entries: [] };
        }
      })
    );
    return jsonResponse({
      leagues: results.filter((r) => r.entries.length > 0),
      meta: buildFeedMeta({ type: "standings", sport, league, feeds: pairs.length })
    }, 300);
  } catch (error) {
    return jsonResponse({
      error: error.message,
      standings: [],
      entries: [],
      leagues: [],
      meta: buildFeedMeta({ degraded: true, type: "standings", sport, league })
    }, 30, 500);
  }
}
__name(onRequest8, "onRequest");

// api/teams.js
function getLeaguePairs5(sport, league, limit = 4) {
  if (league) return [{ sport, league }];
  if (sport === "all") {
    return [
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "esp.1" },
      { sport: "basketball", league: "nba" },
      { sport: "football", league: "nfl" },
      { sport: "hockey", league: "nhl" },
      { sport: "baseball", league: "mlb" },
      { sport: "cricket", league: "ipl" }
    ];
  }
  return (SPORT_LEAGUES[sport] || []).slice(0, limit).map((slug) => ({ sport, league: slug }));
}
__name(getLeaguePairs5, "getLeaguePairs");
async function getIplTeams() {
  const [scoreboard, standingsData] = await Promise.all([
    fetchJson(getIplScoreboardUrl()),
    fetchJson(getIplStandingsUrl()).catch(() => ({ children: [], standings: [] }))
  ]);
  const entries = normalizeStandingsEntries(standingsData);
  const standingsMap = new Map(
    entries.filter((e) => e?.team?.id).map((e) => [String(e.team.id), e])
  );
  const matches = (scoreboard.events || []).map(
    (event) => normalizeScoreboardEvent(event, "cricket", "ipl", scoreboard.leagues?.[0]?.name || "IPL")
  );
  return dedupeById((scoreboard.teams || []).map((t) => normalizeTeamEntry(t, "cricket", "ipl"))).map((team) => {
    const standing = standingsMap.get(String(team.id));
    const schedule = matches.filter(
      (m) => String(m.homeTeam?.id) === String(team.id) || String(m.awayTeam?.id) === String(team.id)
    );
    return {
      ...team,
      venue: schedule.find((m) => m.status === "upcoming")?.venue || team.venue || "",
      record: standing ? `${standing.stats?.find((s) => s.name?.toLowerCase() === "matchesplayed")?.displayValue || "0"} Mat` : team.record || "",
      sport: "cricket",
      league: "ipl"
    };
  });
}
__name(getIplTeams, "getIplTeams");
async function onRequest9(context) {
  const { request } = context;
  const url = new URL(request.url);
  const inputSport = url.searchParams.get("sport") || url.searchParams.get("s") || "soccer";
  const inputLeague = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const sport = normalizeSportParam(inputSport, inputLeague);
  const league = inputLeague ? normalizeLeagueParam(inputLeague, sport) : sport === "all" ? "" : normalizeLeagueParam("", sport);
  try {
    if (isIplLeague(sport, league)) {
      return jsonResponse({
        teams: await getIplTeams(),
        meta: buildFeedMeta({ type: "teams", sport, league })
      }, 300);
    }
    const pairs = getLeaguePairs5(sport, league, sport === "all" ? 8 : 3);
    const results = await Promise.all(
      pairs.map(async ({ sport: s, league: l }) => {
        try {
          if (isIplLeague(s, l)) return getIplTeams();
          const data = await fetchJson(siteApiUrl(s, l, "teams"));
          const rawTeams = data.sports?.[0]?.leagues?.[0]?.teams || data.teams || [];
          return rawTeams.map((entry) => normalizeTeamEntry(entry, s, l));
        } catch {
          return [];
        }
      })
    );
    return jsonResponse({
      teams: dedupeById(results.flat()),
      meta: buildFeedMeta({ type: "teams", sport, league, feeds: pairs.length })
    }, 300);
  } catch (error) {
    return jsonResponse({
      teams: [],
      error: error.message,
      meta: buildFeedMeta({ degraded: true, type: "teams", sport, league })
    }, 30, 500);
  }
}
__name(onRequest9, "onRequest");

// api/upcoming.js
var UPCOMING_SPORT_LIMITS = {
  soccer: 5,
  basketball: 3,
  football: 3,
  hockey: 2,
  baseball: 2,
  cricket: 2,
  tennis: 2,
  mma: 2,
  racing: 2,
  golf: 2,
  rugby: 1
};
function buildUpcomingEndpoints(sportParam, leagueParam, daysAhead) {
  const normalizedLeague = normalizeLeagueParam(leagueParam);
  const dates = parseDateRange(daysAhead);
  if (normalizedLeague) {
    const sport = normalizeSportParam(sportParam, normalizedLeague);
    if (isIplLeague(sport, normalizedLeague)) {
      return [{ sport, league: normalizedLeague, date: "" }];
    }
    return dates.map((date) => ({ sport, league: normalizedLeague, date }));
  }
  const targetSports = getTargetSports(sportParam, leagueParam);
  if (sportParam === "all") {
    return targetSports.flatMap(
      (sport) => (SPORT_LEAGUES[sport] || []).slice(0, UPCOMING_SPORT_LIMITS[sport] || 1).flatMap(
        (league) => isIplLeague(sport, league) ? [{ sport, league, date: "" }] : dates.slice(0, Math.min(daysAhead + 1, sport === "soccer" ? 4 : 2)).map((date) => ({ sport, league, date }))
      )
    );
  }
  return targetSports.flatMap(
    (sport) => (SPORT_LEAGUES[sport] || [normalizeLeagueParam("", sport)]).slice(0, UPCOMING_SPORT_LIMITS[sport] || 3).flatMap(
      (league) => isIplLeague(sport, league) ? [{ sport, league, date: "" }] : dates.slice(0, Math.min(daysAhead + 1, 6)).map((date) => ({ sport, league, date }))
    )
  );
}
__name(buildUpcomingEndpoints, "buildUpcomingEndpoints");
async function onRequest10(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sportParam = String(url.searchParams.get("sport") || url.searchParams.get("s") || "all").toLowerCase();
  const leagueParam = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const parsedDays = parseInt(url.searchParams.get("days") || "7", 10);
  const daysAhead = Math.max(1, Math.min(Number.isFinite(parsedDays) ? parsedDays : 7, 10));
  try {
    const endpoints = buildUpcomingEndpoints(sportParam, leagueParam, daysAhead).slice(0, 70);
    const results = await Promise.all(
      endpoints.map(async ({ sport, league, date }) => {
        try {
          const data = await fetchLeagueScoreboard(sport, league, { dates: date, limit: 50 });
          const leagueName = data.leagues?.[0]?.name || league.toUpperCase();
          return (data.events || []).map((event) => normalizeScoreboardEvent(event, sport, league, leagueName)).filter((match2) => match2.status === "upcoming");
        } catch (error) {
          return [];
        }
      })
    );
    const matches = dedupeById(results.flat()).sort((left, right) => new Date(left.date) - new Date(right.date));
    return jsonResponse(
      {
        matches,
        meta: {
          sport: sportParam,
          league: normalizeLeagueParam(leagueParam),
          daysAhead,
          endpoints: endpoints.length,
          ...buildFeedMeta()
        }
      },
      90
    );
  } catch (error) {
    return jsonResponse(
      {
        error: error.message,
        matches: [],
        meta: buildFeedMeta({ degraded: true })
      },
      30,
      500
    );
  }
}
__name(onRequest10, "onRequest");

// api/ws.js
function buildInternalApiUrl2(request, path, params = {}) {
  const url = new URL(path, request.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== void 0 && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}
__name(buildInternalApiUrl2, "buildInternalApiUrl");
async function fetchSubscriptionJson(request, path, params = {}) {
  const response = await fetch(buildInternalApiUrl2(request, path, params), {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`Subscription request failed: ${response.status} for ${path}`);
  }
  return response.json();
}
__name(fetchSubscriptionJson, "fetchSubscriptionJson");
var CHANNEL_CONFIG = {
  live: { path: "/api/live", intervalMs: 5e3 },
  match: { path: "/api/match", intervalMs: 5e3 },
  results: { path: "/api/results", intervalMs: 6e4 },
  upcoming: { path: "/api/upcoming", intervalMs: 9e4 },
  standings: { path: "/api/standings", intervalMs: 3e5 },
  teams: { path: "/api/teams", intervalMs: 3e5 },
  players: { path: "/api/players", intervalMs: 6e5 },
  news: { path: "/api/news", intervalMs: 6e5 },
  blog: { path: "/api/blog", intervalMs: 6e5 }
};
async function onRequest11(context) {
  const { request } = context;
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected Upgrade: websocket", { status: 426 });
  }
  const [client, server] = new WebSocketPair();
  server.accept();
  const channels = /* @__PURE__ */ new Map();
  function buildParams(channel) {
    const params = {};
    if (channel.sport) params.sport = channel.sport;
    if (channel.league) params.league = channel.league;
    if (channel.id) params.id = channel.id;
    if (channel.days) params.days = channel.days;
    if (channel.limit) params.limit = channel.limit;
    return params;
  }
  __name(buildParams, "buildParams");
  async function pushChannelData(channelKey) {
    const channel = channels.get(channelKey);
    if (!channel) return;
    try {
      const config = CHANNEL_CONFIG[channel.type] || CHANNEL_CONFIG.live;
      const results = await fetchSubscriptionJson(request, config.path, buildParams(channel));
      server.send(JSON.stringify({
        type: channel.type,
        channel: channelKey,
        timestamp: Date.now(),
        data: results
      }));
    } catch (err) {
      console.error(`WS Push Error [${channelKey}]:`, err.message);
    }
  }
  __name(pushChannelData, "pushChannelData");
  function subscribeChannel(message) {
    const type = message.target || message.type || "live";
    const config = CHANNEL_CONFIG[type];
    if (!config) {
      server.send(JSON.stringify({ type: "error", message: `Unknown channel: ${type}` }));
      return;
    }
    const channelKey = `${type}:${message.sport || "all"}:${message.league || ""}:${message.id || ""}`;
    if (channels.has(channelKey)) {
      server.send(JSON.stringify({ type: "already_subscribed", channel: channelKey }));
      return;
    }
    const channel = {
      type,
      sport: normalizeSportParam(message.sport || "all"),
      league: normalizeLeagueParam(message.league || ""),
      id: message.id || "",
      days: message.days || "",
      limit: message.limit || "",
      timer: null
    };
    const intervalMs = message.isLive ? Math.min(config.intervalMs, 5e3) : config.intervalMs;
    channels.set(channelKey, channel);
    pushChannelData(channelKey);
    channel.timer = setInterval(() => pushChannelData(channelKey), intervalMs);
    server.send(JSON.stringify({
      type: "subscribed",
      channel: channelKey,
      target: type,
      intervalMs
    }));
  }
  __name(subscribeChannel, "subscribeChannel");
  function unsubscribeChannel(message) {
    const type = message.target || message.type || "live";
    const channelKey = `${type}:${message.sport || "all"}:${message.league || ""}:${message.id || ""}`;
    const channel = channels.get(channelKey);
    if (channel) {
      if (channel.timer) clearInterval(channel.timer);
      channels.delete(channelKey);
      server.send(JSON.stringify({ type: "unsubscribed", channel: channelKey }));
    }
  }
  __name(unsubscribeChannel, "unsubscribeChannel");
  function cleanupAll() {
    channels.forEach((channel) => {
      if (channel.timer) clearInterval(channel.timer);
    });
    channels.clear();
  }
  __name(cleanupAll, "cleanupAll");
  server.addEventListener("message", async (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === "subscribe") {
        if (Array.isArray(message.channels)) {
          message.channels.forEach((ch) => subscribeChannel({ ...ch, sport: ch.sport || message.sport, league: ch.league || message.league }));
        } else {
          subscribeChannel(message);
        }
        return;
      }
      if (message.type === "unsubscribe") {
        unsubscribeChannel(message);
        return;
      }
      if (message.type === "unsubscribe_all") {
        cleanupAll();
        server.send(JSON.stringify({ type: "unsubscribed_all" }));
        return;
      }
      if (message.type === "ping") {
        server.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        return;
      }
    } catch (err) {
      server.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  });
  server.addEventListener("close", cleanupAll);
  server.addEventListener("error", cleanupAll);
  return new Response(null, { status: 101, webSocket: client });
}
__name(onRequest11, "onRequest");

// match.js
async function onRequest12(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  let response = await next();
  if (!id || response.status !== 200) {
    return response;
  }
  try {
    const apiURL = new URL(context.request.url);
    apiURL.pathname = "/api/match";
    apiURL.searchParams.set("id", id);
    const apiResponse = await fetch(apiURL.toString());
    if (!apiResponse.ok) return response;
    const matchData = await apiResponse.json();
    if (matchData.notFound) return response;
    const metaTitle = `Live: ${matchData.homeTeam.name} vs ${matchData.awayTeam.name} | LiveScoreFree`;
    const metaDesc = `Follow the ${matchData.league} live match between ${matchData.homeTeam.name} and ${matchData.awayTeam.name}. Scores updated every 15 seconds.`;
    class SEOInjector {
      static {
        __name(this, "SEOInjector");
      }
      element(element) {
        element.prepend(`<title>${metaTitle}</title>`, { html: true });
        element.append(`<meta name="description" content="${metaDesc}">`, { html: true });
        element.append(`<meta property="og:title" content="${metaTitle}">`, { html: true });
        element.append(`<meta property="og:description" content="${metaDesc}">`, { html: true });
        element.append(`<meta property="og:image" content="${matchData.homeTeam.logo}">`, { html: true });
        element.append(`<meta name="twitter:card" content="summary_large_image">`, { html: true });
      }
    }
    return new HTMLRewriter().on("head", new SEOInjector()).transform(response);
  } catch (err) {
    return response;
  }
}
__name(onRequest12, "onRequest");

// sitemap.xml.js
async function onRequest13(context) {
  const { request } = context;
  const url = new URL(request.url);
  const hostname = url.protocol + "//" + url.hostname;
  try {
    const apiURL = new URL(request.url);
    apiURL.pathname = "/api/live";
    apiURL.searchParams.set("sport", "all");
    const apiResponse = await fetch(apiURL.toString());
    const data = await apiResponse.json();
    const matches = data.matches || [];
    const urlStore = [
      { loc: `${hostname}/`, priority: "1.0", changefreq: "always" }
    ];
    matches.forEach((match2) => {
      urlStore.push({
        loc: `${hostname}/match.html?id=${match2.id}`,
        priority: "0.8",
        changefreq: "hourly"
      });
    });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlStore.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=600"
      }
    });
  } catch (err) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { "Content-Type": "application/xml" }
    });
  }
}
__name(onRequest13, "onRequest");

// ../.wrangler/tmp/pages-mpwgFw/functionsRoutes-0.2739706276098257.mjs
var routes = [
  {
    routePath: "/api/blog",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/info",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/live",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/match",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/news",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/api/players",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/api/results",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/api/standings",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  },
  {
    routePath: "/api/teams",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest9]
  },
  {
    routePath: "/api/upcoming",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest10]
  },
  {
    routePath: "/api/ws",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest11]
  },
  {
    routePath: "/match",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest12]
  },
  {
    routePath: "/sitemap.xml",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest13]
  }
];

// C:/Users/ashis/AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// C:/Users/ashis/AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// C:/Users/ashis/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// C:/Users/ashis/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-oI1afN/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// C:/Users/ashis/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-oI1afN/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.2384928324161537.mjs.map
