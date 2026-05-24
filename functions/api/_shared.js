export const FALLBACK_LOGO = "/icons/icon-192.png";
export const FALLBACK_HERO = "/icons/hero-fallback.svg";
export const IPL_SERIES_ID = "8048";
export const IPL_SEASON = "2026";
export const IPL_SQUAD_ARTICLE_URL = "https://www.espn.in/cricket/story/_/id/47324999/ipl-2026-how-csk-dc-gt-kkr-lsg-mi-pbks-rcb-rr-srh-stack-auction";

// Centralized Backend Configuration
export const BACKEND_CONFIG = {
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

// Global cache for in-flight requests within the same isolate
// Helps prevent 'thundering herd' when multiple requests hit the same worker instance
const IN_FLIGHT_REQUESTS = new Map();
const IN_FLIGHT_TEXT_REQUESTS = new Map();

export const SPORT_LEAGUES = {
  soccer: [
    "eng.1", "esp.1", "ger.1", "ita.1", "fra.1", "usa.1", "mex.1", 
    "ned.1", "por.1", "bel.1", "tur.1", "arg.1", "bra.1", "ksa.1", "jpn.1",
    "uefa.champions", "uefa.europa", "uefa.europa.conf", "uefa.nations",
    "fifa.world", "fifa.worldq.uefa", "fifa.friendly", "conmebol.america",
    "caf.nations", "afc.asian.cup", "concacaf.gold"
  ],
  football: ["nfl", "college-football", "ufl", "xfl", "cfl"],
  basketball: [
    "nba", "wnba", "mens-college-basketball", "womens-college-basketball", 
    "fiba", "nba-development", "nbl", "euroleague"
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

export const SPORT_ALIASES = {
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

export const LEAGUE_ALIASES = {
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

export function normalizeSportParam(inputSport = "all", inputLeague = "") {
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

export function normalizeLeagueParam(inputLeague = "", fallbackSport = "") {
  const league = String(inputLeague || "").trim().toLowerCase();
  if (!league) {
    return fallbackSport ? getDefaultLeague(fallbackSport) : "";
  }

  return LEAGUE_ALIASES[league] || league;
}

export function getDefaultLeague(sport = "soccer") {
  const normalizedSport = normalizeSportParam(sport);
  return SPORT_LEAGUES[normalizedSport]?.[0] || "eng.1";
}

export function getTargetSports(sportParam = "all", leagueParam = "") {
  const normalizedSport = normalizeSportParam(sportParam, leagueParam);
  if (normalizedSport === "all") {
    return ["soccer", "basketball", "football", "hockey", "baseball", "cricket", "tennis", "mma", "racing", "golf", "rugby", "rugby-league", "volleyball", "water-polo", "lacrosse", "field-hockey", "australian-football"];
  }
  return [normalizedSport];
}

export function siteApiUrl(sport, league, resource, query = {}) {
  const url = new URL(`${BACKEND_CONFIG.sources.espn_site}/sports/${sport}/${league}/${resource}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export function coreApiUrl(sport, league, resource, query = {}) {
  const url = new URL(`${BACKEND_CONFIG.sources.espn_core}/sports/${sport}/leagues/${league}/${resource}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export function siteWebApiUrl(path, query = {}, version = "site") {
  const base = version === "v2" ? BACKEND_CONFIG.sources.espn_web_v2 : BACKEND_CONFIG.sources.espn_web;
  const safePath = String(path || "").replace(/^\/+/, "");
  const url = new URL(`${base}/${safePath}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export function isIplLeague(sport = "", league = "") {
  const normalizedSport = normalizeSportParam(sport, league);
  const normalizedLeague = String(league || "").trim().toLowerCase();
  return normalizedSport === "cricket" && normalizedLeague === "ipl";
}

export function getIplScoreboardUrl(query = {}) {
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

export function getIplStandingsUrl(query = {}) {
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

export function getIplSquadArticleUrl() {
  return IPL_SQUAD_ARTICLE_URL;
}

export async function fetchJson(url, init = {}) {
  // Deduplicate in-flight requests for the same URL in the same isolate
  if (IN_FLIGHT_REQUESTS.has(url)) {
    return IN_FLIGHT_REQUESTS.get(url);
  }

  const promise = (async () => {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          'Accept': 'application/json',
          'User-Agent': 'LivescoreFree-Bot/2.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} for ${url}`);
      }
      
      return await response.json();
    } finally {
      // Always cleanup the map once done
      IN_FLIGHT_REQUESTS.delete(url);
    }
  })();

  IN_FLIGHT_REQUESTS.set(url, promise);
  return promise;
}

export async function fetchText(url, init = {}) {
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

export async function fetchLeagueScoreboard(sport, league, query = {}) {
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

export async function fetchLeagueStandings(sport, league, query = {}) {
  if (isIplLeague(sport, league)) {
    return fetchJson(getIplStandingsUrl(query));
  }
  return fetchJson(siteApiUrl(sport, league, "standings", query));
}

export function jsonResponse(payload, cacheSeconds = 30, status = 200, reason = "") {
  // Enhanced Cache-Control for thundering herd prevention at the edge
  // stale-while-revalidate allows serving slightly old data while background refresh happens
  // stale-if-error allows serving old data if the origin remains down
  const swr = 60; 
  const sie = 600;
  
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=${swr}, stale-if-error=${sie}`,
    "Access-Control-Allow-Origin": "*",
    "X-Robots-Tag": "noindex, nofollow"
  };
  
  if (reason) {
    headers["X-Cache-TTL-Reason"] = reason;
  }
  
  return new Response(JSON.stringify(payload), {
    status,
    headers
  });
}

export function buildFeedMeta(extra = {}) {
  return {
    provider: "espn-public",
    providerLabel: "ESPN public sports APIs",
    freeTier: true,
    generatedAt: new Date().toISOString(),
    ...extra
  };
}

export function calculateTTL(status = "upcoming", matchDate = "", sport = "soccer") {
  // status: "live", "upcoming", or "finished"
  // matchDate: ISO date string (e.g., "2024-03-23T15:30Z")

  const now = new Date();
  let ttl = 15; // Default 15 seconds for most dynamic data
  let reason = "default";

  if (status === "live") {
    // Live matches refresh very frequently
    if (sport === "basketball" || sport === "hockey" || sport === "baseball") {
      ttl = 2; // Faster sports = near-instant updates
      reason = "live-ultra-fast-" + sport;
    } else if (sport === "soccer" || sport === "football") {
      ttl = 5; // Soccer/NFL standard
      reason = "live-standard-" + sport;
    } else {
      ttl = 10;
      reason = "live-other";
    }
  } else if (status === "upcoming") {
    // Upcoming matches: more frequently as kickoff approaches
    if (matchDate) {
      const matchTime = new Date(matchDate);
      const minutesUntil = (matchTime - now) / 1000 / 60;

      if (minutesUntil < 0) {
        // Match already started, treat as live
        ttl = 5;
        reason = "upcoming-started";
      } else if (minutesUntil < 15) {
        // Less than 15 minutes: refresh every 10 seconds for lineup/pre-match updates
        ttl = 10;
        reason = "upcoming-imminent";
      } else if (minutesUntil < 60) {
        // Less than 1 hour: refresh every 30 seconds
        ttl = 30;
        reason = "upcoming-soon";
      } else if (minutesUntil < 1440) {
        // Within 24 hours: refresh every 2 minutes
        ttl = 120;
        reason = "upcoming-today";
      } else {
        // More than 1 day away: refresh every 10 minutes
        ttl = 600;
        reason = "upcoming-future";
      }
    } else {
      ttl = 60; // Default for upcoming with no date
      reason = "upcoming-default";
    }
  } else if (status === "finished") {
    // Finished matches rarely change
    ttl = 900; // 15 minutes for final scores/cleanup
    reason = "finished";
  }

  return { ttl, reason };
}

export async function fetchWithFallback(urlArray, init = {}, timeout = 5000) {
  // Try each URL in sequence with timeout, return first success
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
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

  throw new Error(`fetchWithFallback: All ${urlArray.length} URLs failed. Errors: ${errors.join(' | ')}`);
}

export function buildFallbackUrls(sport, league, resource, query = {}) {
  // Build array of fallback URLs, primary first
  const urls = [];

  // Node 1: Primary Site API
  urls.push(siteApiUrl(sport, league, resource, query));

  // Node 2: Core API (Secondary ESPN Infrastructure)
  if (["scoreboard", "teams", "standings", "athletes", "summary", "news"].includes(resource)) {
    urls.push(coreApiUrl(sport, league, resource, query));
  }

  // Node 3: Public ESPN CDN (Third-party mirror pattern)
  // Some resources are available via a different public CDN path
  if (resource === "scoreboard") {
    const cdnUrl = new URL(`${BACKEND_CONFIG.sources.espn_web}/sports/${sport}/${league}/scoreboard`);
    Object.entries(query).forEach(([key, value]) => cdnUrl.searchParams.set(key, value));
    urls.push(cdnUrl.toString());
  }

  return urls;
}

export function dedupeById(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.id || item?.uid || JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mapStatus(state = "pre") {
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "upcoming";
}

function resolveScoreboardStatus(statusType = {}, event = {}, competition = {}) {
  const state = String(statusType?.state || event?.status?.type?.state || competition?.status?.type?.state || "pre").toLowerCase();
  const completed = Boolean(
    statusType?.completed
    ?? event?.status?.type?.completed
    ?? competition?.status?.type?.completed
    ?? event?.status?.completed
    ?? competition?.status?.completed
  );

  if (completed) return "finished";

  const statusText = [
    statusType?.shortDetail,
    statusType?.detail,
    statusType?.description,
    event?.status?.type?.shortDetail,
    event?.status?.type?.detail,
    competition?.status?.type?.shortDetail,
    competition?.status?.type?.detail
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(^|\b)(final|full time|full-time|ft|game over|won by|match tied|match drawn|abandoned|cancelled|canceled)(\b|$)/.test(statusText)) {
    return "finished";
  }

  return mapStatus(state);
}

export function parseDateRange(daysAhead = 7) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i <= daysAhead; i += 1) {
    const next = new Date(now);
    next.setDate(now.getDate() + i);
    dates.push(
      `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, "0")}${String(next.getDate()).padStart(2, "0")}`
    );
  }
  return dates;
}

export function extractLeagueName(scoreboard = {}, fallbackLeague = "") {
  return scoreboard.leagues?.[0]?.name || fallbackLeague || "Sports Event";
}

export function normalizeArticle(article = {}) {
  const image = article.images?.[0]?.url || article.images?.[0]?.href || article.image || "";
  const url =
    article.links?.web?.href ||
    article.links?.api?.news?.href ||
    article.link ||
    article.url ||
    "";
  const byline =
    typeof article.byline === "string"
      ? article.byline
      : article.byline?.name || article.source?.name || article.source || "";

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

export function normalizeScoreboardEvent(event = {}, sport, leagueSlug, leagueName = "") {
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
    status: resolveScoreboardStatus(statusType, event, competition),
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
      leader: homeLeader
        ? {
            name: homeLeader.athlete?.displayName || "",
            value: homeLeader.displayValue || ""
          }
        : null,
      linescores: normalizeCricketLinescores(home.linescores || [])
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
      leader: awayLeader
        ? {
            name: awayLeader.athlete?.displayName || "",
            value: awayLeader.displayValue || ""
          }
        : null,
      linescores: normalizeCricketLinescores(away.linescores || [])
    }
  };
}

export function normalizeCricketLinescores(linescores = []) {
  return (Array.isArray(linescores) ? linescores : []).map((entry) => {
    const period = Number(entry?.period ?? entry?.value ?? 0);
    const runs = Number(entry?.runs);
    const wickets = Number(entry?.wickets);
    const oversRaw = entry?.overs;
    const overs = Number.isFinite(oversRaw) ? oversRaw : Number(String(oversRaw || "").trim());
    return {
      period: Number.isFinite(period) ? period : 0,
      runs: Number.isFinite(runs) ? runs : null,
      wickets: Number.isFinite(wickets) ? wickets : null,
      overs: Number.isFinite(overs) ? overs : null,
      isBatting: Boolean(entry?.isBatting),
      isCurrent: Boolean(entry?.isCurrent),
      description: String(entry?.description || "").trim()
    };
  });
}

export function normalizeTeamEntry(entry = {}, sport = "soccer", league = "eng.1") {
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

export function normalizeRosterGroups(data = {}) {
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

export function normalizeAthlete(detail = {}, fallback = {}) {
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

export function extractTrailingId(ref = "") {
  const parts = String(ref).split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

export async function resolveTeamFromRef(ref = "") {
  if (!ref) return null;
  try {
    const data = await fetchJson(ref);
    return normalizeTeamEntry({ team: data });
  } catch (error) {
    return null;
  }
}

export function normalizeStandingsEntries(data = {}) {
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
