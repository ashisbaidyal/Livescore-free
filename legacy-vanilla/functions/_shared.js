export function getEnv(env, key, fallback) {
  if (!env || env[key] === undefined || env[key] === null || env[key] === "") {
    return fallback;
  }
  return env[key];
}

// Synchronized Backend Configuration
export const BACKEND_CONFIG = {
  sources: {
    espn_site: "https://site.api.espn.com/apis/site/v2",
    espn_core: "https://sports.core.api.espn.com/v2",
    espn_web: "https://site.web.api.espn.com/apis/site/v2",
    thesportsdb: "https://www.thesportsdb.com/api/v1/json/123"
  }
};

export const SPORT_LEAGUES = {
  soccer: [
    "eng.1", "esp.1", "ger.1", "ita.1", "fra.1", 
    "usa.1", "mex.1", "ned.1", "por.1", "bel.1", "tur.1", 
    "arg.1", "bra.1", "ksa.1", "jpn.1",
    "uefa.champions", "uefa.europa", "uefa.europa.conf", 
    "fifa.world", "fifa.world.q.uefa"
  ],
  football: ["nfl", "college-football", "nfl-europe", "cfl", "aaf", "xfl", "ncaa-womens-football"],
  basketball: [
    "nba", "wnba", "mens-college-basketball", "womens-college-basketball", 
    "fiba-mens-world-cup", "nba-g-league", "euroleague", "nbl"
  ],
  baseball: ["mlb", "ncaa-mens-baseball"],
  hockey: ["nhl", "mens-college-hockey", "womens-college-hockey"],
  cricket: ["8", "20", "1", "ipl"],
  tennis: ["atp", "wta"],
  mma: [
    "ufc", "bellator", "ifc", "lfa", "ksw", "cage-warriors", 
    "absolute", "fng", "k1", "m1", "ifl", "dream"
  ],
  racing: ["f1", "irl", "nascar-premier", "nascar-secondary", "nascar-truck"],
  golf: ["pga", "lpga", "pga-tour-champions", "korn-ferry-tour", "dp-world-tour"],
  rugby: ["164205", "180659", "267979", "242041", "289262"],
  "rugby-league": ["3"],
  volleyball: ["mens-college-volleyball", "womens-college-volleyball"],
  "water-polo": ["mens-college-water-polo", "womens-college-water-polo"],
  lacrosse: ["nll", "pll", "mens-college-lacrosse", "womens-college-lacrosse"],
  "field-hockey": ["ncaa-womens-field-hockey"],
  "australian-football": ["afl"]
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

export function getIntEnv(env, key, fallback) {
  const raw = getEnv(env, key, fallback);
  const value = parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

export function getBoolEnv(env, key, fallback) {
  const raw = getEnv(env, key, fallback ? "true" : "false");
  if (typeof raw === "boolean") return raw;
  return String(raw).toLowerCase() === "true";
}

export function getClientIp(request) {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp;
  const xff = request.headers.get("X-Forwarded-For");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

function normalizeOriginValue(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function originMatchesPattern(origin, pattern) {
  const safeOrigin = normalizeOriginValue(origin);
  const safePattern = normalizeOriginValue(pattern);

  if (!safeOrigin || !safePattern) {
    return false;
  }

  if (safePattern === "*" || safeOrigin === safePattern) {
    return true;
  }

  const wildcardMatch = safePattern.match(/^(https?):\/\/\*\.([^/]+)$/i);
  if (!wildcardMatch) {
    return false;
  }

  try {
    const originUrl = new URL(safeOrigin);
    const expectedProtocol = `${wildcardMatch[1].toLowerCase()}:`;
    const expectedHostname = wildcardMatch[2].toLowerCase();
    const originHostname = originUrl.hostname.toLowerCase();

    return originUrl.protocol === expectedProtocol && (
      originHostname === expectedHostname ||
      originHostname.endsWith(`.${expectedHostname}`)
    );
  } catch {
    return false;
  }
}

export function getCorsHeaders(request, env, extra = {}) {
  const allowed = getEnv(env, "ALLOWED_ORIGINS", "*");
  const origin = request.headers.get("Origin");
  let allowOrigin = "*";

  if (allowed !== "*" && origin) {
    const allowedList = allowed.split(",").map((item) => item.trim()).filter(Boolean);
    const matchingOrigin = allowedList.find((item) => originMatchesPattern(origin, item));
    allowOrigin = matchingOrigin ? origin : (allowedList[0] || "*");
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, X-API-Key",
    "Access-Control-Allow-Credentials": "false",
    "Access-Control-Max-Age": "86400",
    ...extra
  };
}

export function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}


