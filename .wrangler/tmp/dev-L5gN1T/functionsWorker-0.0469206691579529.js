var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-1XVU0o/functionsWorker-0.0469206691579529.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
function getEnv(env, key, fallback) {
  if (!env || env[key] === void 0 || env[key] === null || env[key] === "") {
    return fallback;
  }
  return env[key];
}
__name(getEnv, "getEnv");
__name2(getEnv, "getEnv");
function getIntEnv(env, key, fallback) {
  const raw = getEnv(env, key, fallback);
  const value = parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}
__name(getIntEnv, "getIntEnv");
__name2(getIntEnv, "getIntEnv");
function getBoolEnv(env, key, fallback) {
  const raw = getEnv(env, key, fallback ? "true" : "false");
  if (typeof raw === "boolean") return raw;
  return String(raw).toLowerCase() === "true";
}
__name(getBoolEnv, "getBoolEnv");
__name2(getBoolEnv, "getBoolEnv");
function getClientIp(request) {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp;
  const xff = request.headers.get("X-Forwarded-For");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}
__name(getClientIp, "getClientIp");
__name2(getClientIp, "getClientIp");
function normalizeOriginValue(value) {
  return String(value || "").trim().replace(/\/$/, "");
}
__name(normalizeOriginValue, "normalizeOriginValue");
__name2(normalizeOriginValue, "normalizeOriginValue");
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
    return originUrl.protocol === expectedProtocol && (originHostname === expectedHostname || originHostname.endsWith(`.${expectedHostname}`));
  } catch {
    return false;
  }
}
__name(originMatchesPattern, "originMatchesPattern");
__name2(originMatchesPattern, "originMatchesPattern");
function getCorsHeaders(request, env, extra = {}) {
  const allowed = getEnv(env, "ALLOWED_ORIGINS", "*");
  const origin = request.headers.get("Origin");
  let allowOrigin = "*";
  if (allowed !== "*" && origin) {
    const allowedList = allowed.split(",").map((item) => item.trim()).filter(Boolean);
    const matchingOrigin = allowedList.find((item) => originMatchesPattern(origin, item));
    allowOrigin = matchingOrigin ? origin : allowedList[0] || "*";
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
__name(getCorsHeaders, "getCorsHeaders");
__name2(getCorsHeaders, "getCorsHeaders");
function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}
__name(jsonResponse, "jsonResponse");
__name2(jsonResponse, "jsonResponse");
var CRICBUZZ_LIVE_URL = "https://www.cricbuzz.com/match-api/livematches.json";
var CRICINFO_RSS_URL = "https://static.cricinfo.com/rss/livescores.xml";
var cache = /* @__PURE__ */ new Map();
var requestCounts = /* @__PURE__ */ new Map();
function getCacheKey() {
  return "cricket-live";
}
__name(getCacheKey, "getCacheKey");
__name2(getCacheKey, "getCacheKey");
function isCacheValid(timestamp, ttl) {
  return Date.now() - timestamp < ttl;
}
__name(isCacheValid, "isCacheValid");
__name2(isCacheValid, "isCacheValid");
function pruneCache(maxEntries) {
  if (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}
__name(pruneCache, "pruneCache");
__name2(pruneCache, "pruneCache");
function checkRateLimit(ip, windowMs, maxRequests, enabled) {
  if (!enabled) return true;
  const now = Date.now();
  const windowStart = now - windowMs;
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  const requests = requestCounts.get(ip).filter((t) => t > windowStart);
  if (requests.length >= maxRequests) {
    requestCounts.set(ip, requests);
    return false;
  }
  requests.push(now);
  requestCounts.set(ip, requests);
  return true;
}
__name(checkRateLimit, "checkRateLimit");
__name2(checkRateLimit, "checkRateLimit");
async function fetchWithTimeout(url, options = {}, timeout = 8e3) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
__name(fetchWithTimeout, "fetchWithTimeout");
__name2(fetchWithTimeout, "fetchWithTimeout");
function stripCdata(text = "") {
  return String(text || "").replace(/^<!\[CDATA\[/i, "").replace(/\]\]>$/i, "").trim();
}
__name(stripCdata, "stripCdata");
__name2(stripCdata, "stripCdata");
function parseStatusFromText(text = "") {
  const token = String(text || "").toLowerCase();
  if (token.includes("live") || token.includes("in progress") || token.includes("innings") || token.includes("stumps") || token.includes("break") || token.includes("day")) {
    return { status: "IN_PROGRESS", detail: text || "Live" };
  }
  if (token.includes("won") || token.includes("completed") || token.includes("final") || token.includes("abandon") || token.includes("no result") || token.includes("tie")) {
    return { status: "FINAL", detail: text || "Final" };
  }
  return { status: "SCHEDULED", detail: text || "Scheduled" };
}
__name(parseStatusFromText, "parseStatusFromText");
__name2(parseStatusFromText, "parseStatusFromText");
function splitTeamAndScore(segment = "") {
  const trimmed = String(segment || "").trim();
  if (!trimmed) {
    return { name: "", score: "-" };
  }
  const match2 = trimmed.match(/^(.*?)(\d.*)$/);
  if (!match2) {
    return { name: trimmed, score: "-" };
  }
  return { name: match2[1].trim(), score: match2[2].trim() };
}
__name(splitTeamAndScore, "splitTeamAndScore");
__name2(splitTeamAndScore, "splitTeamAndScore");
function parseRssItems(xml = "") {
  const items = [];
  const regex = /<item>([\s\S]*?)<\/item>/gi;
  let match2 = null;
  while (match2 = regex.exec(xml)) {
    const block = match2[1] || "";
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const title = stripCdata(titleMatch ? titleMatch[1] : "");
    const link = stripCdata(linkMatch ? linkMatch[1] : "");
    const pubDate = stripCdata(dateMatch ? dateMatch[1] : "");
    if (!title) {
      continue;
    }
    items.push({ title, link, pubDate });
  }
  return items;
}
__name(parseRssItems, "parseRssItems");
__name2(parseRssItems, "parseRssItems");
function buildRssEvents(items = []) {
  return items.map((item, index) => {
    const title = item.title || "";
    const statusInfo = parseStatusFromText(title);
    const head = title.split(" - ")[0];
    const vsSplit = head.split(/\svs?\s/i);
    let home = "";
    let away = "";
    let homeScore = "-";
    let awayScore = "-";
    if (vsSplit.length >= 2) {
      const left = splitTeamAndScore(vsSplit[0]);
      const right = splitTeamAndScore(vsSplit.slice(1).join(" v "));
      home = left.name || "Home";
      away = right.name || "Away";
      homeScore = left.score || "-";
      awayScore = right.score || "-";
    } else {
      home = title.slice(0, 24).trim() || "Home";
      away = "Away";
    }
    return {
      id: `rss-${index}-${home.replace(/\s+/g, "-").toLowerCase()}`,
      date: item.pubDate || (/* @__PURE__ */ new Date()).toISOString(),
      status: {
        type: {
          name: statusInfo.status,
          shortDetail: statusInfo.detail,
          description: statusInfo.detail
        }
      },
      name: "Cricket",
      competitions: [
        {
          competitors: [
            {
              homeAway: "home",
              team: {
                displayName: home,
                abbreviation: home.slice(0, 3).toUpperCase(),
                logo: ""
              },
              score: homeScore
            },
            {
              homeAway: "away",
              team: {
                displayName: away,
                abbreviation: away.slice(0, 3).toUpperCase(),
                logo: ""
              },
              score: awayScore
            }
          ],
          venue: { fullName: "" },
          status: {
            type: {
              name: statusInfo.status,
              shortDetail: statusInfo.detail,
              description: statusInfo.detail
            }
          }
        }
      ]
    };
  });
}
__name(buildRssEvents, "buildRssEvents");
__name2(buildRssEvents, "buildRssEvents");
async function onRequest(context) {
  const { request, env } = context;
  const startTime = Date.now();
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const CACHE_TTL = getIntEnv(env, "CACHE_TTL_LIVE", 15e3);
  const MAX_CACHE_ENTRIES = getIntEnv(env, "MAX_CACHE_ENTRIES", 100);
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8e3);
  const RATE_LIMIT_WINDOW = getIntEnv(env, "RATE_LIMIT_WINDOW", 6e4);
  const MAX_REQUESTS_PER_WINDOW = getIntEnv(env, "MAX_REQUESTS_PER_WINDOW", 100);
  const ENABLE_RATE_LIMITING = getBoolEnv(env, "ENABLE_RATE_LIMITING", true);
  const LOG_LEVEL = getEnv(env, "LOG_LEVEL", "info").toLowerCase();
  const cacheSeconds = Math.max(1, Math.floor(CACHE_TTL / 1e3));
  const baseHeaders = getCorsHeaders(request, env, {
    "Content-Type": "application/json",
    "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
    "X-API-Version": API_VERSION
  });
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({ success: false, error: "Method not allowed", version: API_VERSION }, {
      status: 405,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp, RATE_LIMIT_WINDOW, MAX_REQUESTS_PER_WINDOW, ENABLE_RATE_LIMITING)) {
    return jsonResponse({
      success: false,
      error: "Rate limit exceeded",
      message: "Too many requests. Please wait a moment.",
      version: API_VERSION
    }, {
      status: 429,
      headers: {
        ...baseHeaders,
        "Retry-After": Math.ceil(RATE_LIMIT_WINDOW / 1e3).toString(),
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const cacheKey = getCacheKey();
  const cached = cache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp, CACHE_TTL)) {
    return jsonResponse({
      success: true,
      events: cached.events,
      cached: true,
      cacheAge: Date.now() - cached.timestamp,
      timestamp: cached.timestamp,
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  try {
    let events = [];
    try {
      const response = await fetchWithTimeout(CRICBUZZ_LIVE_URL, {
        headers: {
          "User-Agent": "LiveScoreFree-Bot/2.0",
          "Accept": "application/json"
        }
      }, REQUEST_TIMEOUT);
      if (response.ok) {
        const payload = await response.json();
        const matches = Array.isArray(payload?.matches) ? payload.matches : [];
        if (matches.length) {
          events = [];
          cache.set(cacheKey, {
            events: matches,
            timestamp: Date.now()
          });
          pruneCache(MAX_CACHE_ENTRIES);
          return jsonResponse({
            success: true,
            matches,
            cached: false,
            timestamp: Date.now(),
            version: API_VERSION
          }, {
            status: 200,
            headers: {
              ...baseHeaders,
              "X-Response-Time": `${Date.now() - startTime}ms`
            }
          });
        }
      }
    } catch (error) {
      if (LOG_LEVEL !== "silent") {
        console.warn("[API/cricket-live] Cricbuzz fetch failed:", error.message);
      }
    }
    try {
      const response = await fetchWithTimeout(CRICINFO_RSS_URL, {
        headers: {
          "User-Agent": "LiveScoreFree-Bot/2.0",
          "Accept": "application/rss+xml, application/xml"
        }
      }, REQUEST_TIMEOUT);
      if (response.ok) {
        const xml = await response.text();
        const items = parseRssItems(xml);
        events = buildRssEvents(items);
      }
    } catch (error) {
      if (LOG_LEVEL !== "silent") {
        console.warn("[API/cricket-live] RSS fetch failed:", error.message);
      }
    }
    cache.set(cacheKey, {
      events,
      timestamp: Date.now()
    });
    pruneCache(MAX_CACHE_ENTRIES);
    return jsonResponse({
      success: true,
      events,
      cached: false,
      timestamp: Date.now(),
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  } catch (error) {
    if (LOG_LEVEL !== "silent") {
      console.error("[API/cricket-live] Request error:", error);
    }
    return jsonResponse({
      success: false,
      error: error.message || "Failed to fetch cricket data",
      timestamp: Date.now()
    }, {
      status: 500,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
var bootTime = Date.now();
var healthCheck = {
  lastCheck: 0,
  status: {
    espn: { ok: false, latency: 0, lastError: null },
    sportsdb: { ok: false, latency: 0, lastError: null },
    cloudflare: { ok: true, latency: 0 }
  }
};
async function checkEspnHealth(espnBase, timeout) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(`${espnBase}/soccer/eng.1/events?limit=1`, {
      signal: controller.signal,
      headers: { "User-Agent": "LiveScoreFree-Health-Check/2.0" }
    });
    clearTimeout(timer);
    const latency = Date.now() - startTime;
    healthCheck.status.espn = {
      ok: response.ok,
      latency,
      lastError: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    healthCheck.status.espn = {
      ok: false,
      latency: Date.now() - startTime,
      lastError: error.message
    };
  }
}
__name(checkEspnHealth, "checkEspnHealth");
__name2(checkEspnHealth, "checkEspnHealth");
async function checkSportsDbHealth(sportsDbBase, timeout) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(`${sportsDbBase}/leaguestable.php?l=133602&s=2025`, {
      signal: controller.signal,
      headers: { "User-Agent": "LiveScoreFree-Health-Check/2.0" }
    });
    clearTimeout(timer);
    const latency = Date.now() - startTime;
    healthCheck.status.sportsdb = {
      ok: response.ok,
      latency,
      lastError: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    healthCheck.status.sportsdb = {
      ok: false,
      latency: Date.now() - startTime,
      lastError: error.message
    };
  }
}
__name(checkSportsDbHealth, "checkSportsDbHealth");
__name2(checkSportsDbHealth, "checkSportsDbHealth");
function getSystemHealth() {
  const espnOk = healthCheck.status.espn.ok;
  const sportsdbOk = healthCheck.status.sportsdb.ok;
  let overallStatus = "healthy";
  if (!espnOk && !sportsdbOk) {
    overallStatus = "unhealthy";
  } else if (!espnOk || !sportsdbOk) {
    overallStatus = "degraded";
  }
  return overallStatus;
}
__name(getSystemHealth, "getSystemHealth");
__name2(getSystemHealth, "getSystemHealth");
async function onRequest2(context) {
  const { request, env } = context;
  const ESPN_BASE = getEnv(env, "ESPN_API_BASE", "https://site.api.espn.com/apis/site/v2/sports");
  const SPORTSDB_BASE = getEnv(env, "SPORTSDB_API_BASE", "https://www.thesportsdb.com/api/v1/json/123");
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 5e3);
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const baseHeaders = getCorsHeaders(request, env, {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=10, s-maxage=10",
    "X-API-Version": API_VERSION
  });
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }
  await Promise.all([
    checkEspnHealth(ESPN_BASE, REQUEST_TIMEOUT),
    checkSportsDbHealth(SPORTSDB_BASE, REQUEST_TIMEOUT)
  ]);
  healthCheck.lastCheck = Date.now();
  const status = getSystemHealth();
  const statusCode = status === "healthy" ? 200 : status === "degraded" ? 207 : 503;
  const cf = request.cf || {};
  return jsonResponse({
    status,
    timestamp: Date.now(),
    uptime: Math.floor((Date.now() - bootTime) / 1e3),
    environment: getEnv(env, "CF_PAGES_BRANCH", getEnv(env, "ENVIRONMENT", "unknown")),
    region: cf.colo || "unknown",
    country: cf.country || "unknown",
    providers: healthCheck.status,
    version: API_VERSION,
    deployment: {
      project: getEnv(env, "CF_PAGES_PROJECT_NAME", "unknown"),
      branch: getEnv(env, "CF_PAGES_BRANCH", "unknown"),
      commit: getEnv(env, "CF_PAGES_COMMIT_SHA", "unknown"),
      url: getEnv(env, "CF_PAGES_URL", "unknown")
    }
  }, {
    status: statusCode,
    headers: baseHeaders
  });
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
var SPORT_FEEDS = {
  football: "soccer/eng.1",
  soccer: "soccer/eng.1",
  cricket: "cricket",
  basketball: "basketball/nba",
  tennis: "tennis",
  nfl: "football/nfl",
  hockey: "hockey/nhl",
  baseball: "baseball/mlb",
  rugby: "rugby",
  f1: "racing/f1",
  default: "soccer/eng.1"
};
var cache2 = /* @__PURE__ */ new Map();
var requestCounts2 = /* @__PURE__ */ new Map();
function getCacheKey2(sport) {
  return `live-${sport}`;
}
__name(getCacheKey2, "getCacheKey2");
__name2(getCacheKey2, "getCacheKey");
function isCacheValid2(timestamp, ttl) {
  return Date.now() - timestamp < ttl;
}
__name(isCacheValid2, "isCacheValid2");
__name2(isCacheValid2, "isCacheValid");
function pruneCache2(maxEntries) {
  if (cache2.size > maxEntries) {
    const oldestKey = cache2.keys().next().value;
    cache2.delete(oldestKey);
  }
}
__name(pruneCache2, "pruneCache2");
__name2(pruneCache2, "pruneCache");
function checkRateLimit2(ip, windowMs, maxRequests, enabled) {
  if (!enabled) return true;
  const now = Date.now();
  const windowStart = now - windowMs;
  if (!requestCounts2.has(ip)) {
    requestCounts2.set(ip, []);
  }
  const requests = requestCounts2.get(ip).filter((t) => t > windowStart);
  if (requests.length >= maxRequests) {
    requestCounts2.set(ip, requests);
    return false;
  }
  requests.push(now);
  requestCounts2.set(ip, requests);
  return true;
}
__name(checkRateLimit2, "checkRateLimit2");
__name2(checkRateLimit2, "checkRateLimit");
async function fetchWithTimeout2(url, options = {}, timeout = 8e3) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
__name(fetchWithTimeout2, "fetchWithTimeout2");
__name2(fetchWithTimeout2, "fetchWithTimeout");
async function fetchEspnMatches(espnBase, sportFeed, timeout) {
  try {
    const url = `${espnBase}/${sportFeed}/events?limit=50&status=in,upcoming`;
    const response = await fetchWithTimeout2(url, {
      headers: {
        "User-Agent": "LiveScoreFree-Bot/2.0",
        "Accept": "application/json"
      }
    }, timeout);
    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error("[API/live] ESPN fetch error:", error.message);
    return [];
  }
}
__name(fetchEspnMatches, "fetchEspnMatches");
__name2(fetchEspnMatches, "fetchEspnMatches");
async function fetchSportsDbMatches(sportsDbBase, timeout) {
  try {
    const url = `${sportsDbBase}/eventslast.php?id=133602`;
    const response = await fetchWithTimeout2(url, {
      headers: {
        "User-Agent": "LiveScoreFree-Bot/2.0",
        "Accept": "application/json"
      }
    }, timeout);
    if (!response.ok) throw new Error(`SportsDB API error: ${response.status}`);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("[API/live] SportsDB fetch error:", error.message);
    return [];
  }
}
__name(fetchSportsDbMatches, "fetchSportsDbMatches");
__name2(fetchSportsDbMatches, "fetchSportsDbMatches");
function normalizeMatch(event) {
  return {
    id: event.id || event.idEvent || "",
    homeTeam: event.competitions?.[0]?.competitors?.[0]?.team?.displayName || event.strHomeTeam || "",
    awayTeam: event.competitions?.[0]?.competitors?.[1]?.team?.displayName || event.strAwayTeam || "",
    homeScore: parseInt(event.competitions?.[0]?.competitors?.[0]?.score) || 0,
    awayScore: parseInt(event.competitions?.[0]?.competitors?.[1]?.score) || 0,
    status: event.status?.type?.description || event.status?.type?.name || event.strStatus || event.status || "NOT_STARTED",
    date: event.date || event.dateEvent || "",
    league: event.league?.name || event.strLeague || "",
    venue: event.competitions?.[0]?.venue?.fullName || event.strVenue || "",
    sportGroup: normalizeSport(event)
  };
}
__name(normalizeMatch, "normalizeMatch");
__name2(normalizeMatch, "normalizeMatch");
function normalizeSport(event) {
  const sport = (event.sports?.[0]?.name || event.strSport || "").toLowerCase();
  const map = {
    soccer: "football",
    football: "nfl",
    basketball: "basketball",
    cricket: "cricket",
    tennis: "tennis",
    hockey: "hockey",
    baseball: "baseball"
  };
  return map[sport] || "football";
}
__name(normalizeSport, "normalizeSport");
__name2(normalizeSport, "normalizeSport");
async function onRequest3(context) {
  const { request, env } = context;
  const startTime = Date.now();
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const CACHE_TTL = getIntEnv(env, "CACHE_TTL_LIVE", 15e3);
  const MAX_CACHE_ENTRIES = getIntEnv(env, "MAX_CACHE_ENTRIES", 100);
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8e3);
  const RATE_LIMIT_WINDOW = getIntEnv(env, "RATE_LIMIT_WINDOW", 6e4);
  const MAX_REQUESTS_PER_WINDOW = getIntEnv(env, "MAX_REQUESTS_PER_WINDOW", 100);
  const ENABLE_RATE_LIMITING = getBoolEnv(env, "ENABLE_RATE_LIMITING", true);
  const LOG_LEVEL = getEnv(env, "LOG_LEVEL", "info").toLowerCase();
  const ESPN_BASE = getEnv(env, "ESPN_API_BASE", "https://site.api.espn.com/apis/site/v2/sports");
  const SPORTSDB_BASE = getEnv(env, "SPORTSDB_API_BASE", "https://www.thesportsdb.com/api/v1/json/123");
  const cacheSeconds = Math.max(1, Math.floor(CACHE_TTL / 1e3));
  const baseHeaders = getCorsHeaders(request, env, {
    "Content-Type": "application/json",
    "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
    "X-API-Version": API_VERSION
  });
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({
      success: false,
      error: "Method not allowed",
      version: API_VERSION
    }, {
      status: 405,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const url = new URL(request.url);
  const sport = (url.searchParams.get("sport") || "football").toLowerCase();
  const limitRaw = parseInt(url.searchParams.get("limit") || "50", 10);
  const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 50, 200);
  const cacheKey = getCacheKey2(sport);
  const clientIp = getClientIp(request);
  if (!checkRateLimit2(clientIp, RATE_LIMIT_WINDOW, MAX_REQUESTS_PER_WINDOW, ENABLE_RATE_LIMITING)) {
    return jsonResponse({
      success: false,
      error: "Rate limit exceeded",
      message: "Too many requests. Please wait a moment.",
      version: API_VERSION
    }, {
      status: 429,
      headers: {
        ...baseHeaders,
        "Retry-After": Math.ceil(RATE_LIMIT_WINDOW / 1e3).toString(),
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const cached = cache2.get(cacheKey);
  if (cached && isCacheValid2(cached.timestamp, CACHE_TTL)) {
    return jsonResponse({
      success: true,
      data: cached.data,
      cached: true,
      cacheAge: Date.now() - cached.timestamp,
      timestamp: cached.timestamp,
      count: cached.data.length,
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  try {
    const sportFeed = SPORT_FEEDS[sport] || SPORT_FEEDS.default;
    const espnMatches = await fetchEspnMatches(ESPN_BASE, sportFeed, REQUEST_TIMEOUT);
    let normalizedMatches = espnMatches.map(normalizeMatch);
    if (!normalizedMatches.length) {
      const sportsDbMatches = await fetchSportsDbMatches(SPORTSDB_BASE, REQUEST_TIMEOUT);
      normalizedMatches = sportsDbMatches.map(normalizeMatch);
    }
    normalizedMatches = normalizedMatches.slice(0, limit);
    cache2.set(cacheKey, {
      data: normalizedMatches,
      timestamp: Date.now()
    });
    pruneCache2(MAX_CACHE_ENTRIES);
    return jsonResponse({
      success: true,
      data: normalizedMatches,
      cached: false,
      timestamp: Date.now(),
      count: normalizedMatches.length,
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  } catch (error) {
    if (LOG_LEVEL !== "silent") {
      console.error("[API/live] Request error:", error);
    }
    return jsonResponse({
      success: false,
      error: error.message || "Failed to fetch live matches",
      timestamp: Date.now()
    }, {
      status: 500,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
}
__name(onRequest3, "onRequest3");
__name2(onRequest3, "onRequest");
var MLB_BASE_URL = "https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1";
var cache3 = /* @__PURE__ */ new Map();
var requestCounts3 = /* @__PURE__ */ new Map();
function getCacheKey3(dateKey) {
  return `mlb-live-${dateKey}`;
}
__name(getCacheKey3, "getCacheKey3");
__name2(getCacheKey3, "getCacheKey");
function isCacheValid3(timestamp, ttl) {
  return Date.now() - timestamp < ttl;
}
__name(isCacheValid3, "isCacheValid3");
__name2(isCacheValid3, "isCacheValid");
function pruneCache3(maxEntries) {
  if (cache3.size > maxEntries) {
    const oldestKey = cache3.keys().next().value;
    cache3.delete(oldestKey);
  }
}
__name(pruneCache3, "pruneCache3");
__name2(pruneCache3, "pruneCache");
function checkRateLimit3(ip, windowMs, maxRequests, enabled) {
  if (!enabled) return true;
  const now = Date.now();
  const windowStart = now - windowMs;
  if (!requestCounts3.has(ip)) {
    requestCounts3.set(ip, []);
  }
  const requests = requestCounts3.get(ip).filter((t) => t > windowStart);
  if (requests.length >= maxRequests) {
    requestCounts3.set(ip, requests);
    return false;
  }
  requests.push(now);
  requestCounts3.set(ip, requests);
  return true;
}
__name(checkRateLimit3, "checkRateLimit3");
__name2(checkRateLimit3, "checkRateLimit");
async function fetchWithTimeout3(url, options = {}, timeout = 8e3) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
__name(fetchWithTimeout3, "fetchWithTimeout3");
__name2(fetchWithTimeout3, "fetchWithTimeout");
function getUtcDateString() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
__name(getUtcDateString, "getUtcDateString");
__name2(getUtcDateString, "getUtcDateString");
function normalizeStatus(status = {}) {
  const token = String(status?.abstractGameState || status?.detailedState || "").toUpperCase();
  if (token.includes("LIVE") || token.includes("IN PROGRESS") || token.includes("IN_PROGRESS")) {
    return { name: "IN_PROGRESS", detail: status?.detailedState || "Live" };
  }
  if (token.includes("FINAL") || token.includes("COMPLETED") || token.includes("GAME OVER")) {
    return { name: "FINAL", detail: status?.detailedState || "Final" };
  }
  return { name: "SCHEDULED", detail: status?.detailedState || "Scheduled" };
}
__name(normalizeStatus, "normalizeStatus");
__name2(normalizeStatus, "normalizeStatus");
function pickTeamName(team = {}) {
  return team?.name || team?.teamName || "Team";
}
__name(pickTeamName, "pickTeamName");
__name2(pickTeamName, "pickTeamName");
function pickTeamAbbr(team = {}, fallback = "TEAM") {
  return team?.abbreviation || team?.abbr || fallback.slice(0, 3).toUpperCase();
}
__name(pickTeamAbbr, "pickTeamAbbr");
__name2(pickTeamAbbr, "pickTeamAbbr");
function pickTeamScore(side = {}) {
  const score = side?.score;
  if (score === null || score === void 0) {
    return "-";
  }
  return String(score);
}
__name(pickTeamScore, "pickTeamScore");
__name2(pickTeamScore, "pickTeamScore");
function buildEvents(games = []) {
  return games.map((game) => {
    const home = game?.teams?.home || {};
    const away = game?.teams?.away || {};
    const homeTeam = home.team || {};
    const awayTeam = away.team || {};
    const homeName = pickTeamName(homeTeam);
    const awayName = pickTeamName(awayTeam);
    const statusInfo = normalizeStatus(game?.status || {});
    const statusDetail = statusInfo.detail;
    const venue = game?.venue?.name || "";
    return {
      id: String(game?.gamePk || ""),
      date: game?.gameDate || (/* @__PURE__ */ new Date()).toISOString(),
      name: `${homeName} vs ${awayName}`,
      status: {
        type: {
          name: statusInfo.name,
          shortDetail: statusDetail,
          description: statusDetail
        }
      },
      competitions: [
        {
          competitors: [
            {
              homeAway: "home",
              team: {
                id: String(homeTeam.id || ""),
                displayName: homeName,
                abbreviation: pickTeamAbbr(homeTeam, homeName),
                logo: ""
              },
              score: pickTeamScore(home)
            },
            {
              homeAway: "away",
              team: {
                id: String(awayTeam.id || ""),
                displayName: awayName,
                abbreviation: pickTeamAbbr(awayTeam, awayName),
                logo: ""
              },
              score: pickTeamScore(away)
            }
          ],
          venue: { fullName: venue },
          status: {
            type: {
              name: statusInfo.name,
              shortDetail: statusDetail,
              description: statusDetail
            }
          }
        }
      ],
      source: "mlb"
    };
  }).filter((event) => event.id && event.competitions?.[0]?.competitors?.length === 2);
}
__name(buildEvents, "buildEvents");
__name2(buildEvents, "buildEvents");
async function onRequest4(context) {
  const { request, env } = context;
  const startTime = Date.now();
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const CACHE_TTL = getIntEnv(env, "CACHE_TTL_LIVE", 15e3);
  const MAX_CACHE_ENTRIES = getIntEnv(env, "MAX_CACHE_ENTRIES", 100);
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8e3);
  const RATE_LIMIT_WINDOW = getIntEnv(env, "RATE_LIMIT_WINDOW", 6e4);
  const MAX_REQUESTS_PER_WINDOW = getIntEnv(env, "MAX_REQUESTS_PER_WINDOW", 100);
  const ENABLE_RATE_LIMITING = getBoolEnv(env, "ENABLE_RATE_LIMITING", true);
  const LOG_LEVEL = getEnv(env, "LOG_LEVEL", "info").toLowerCase();
  const cacheSeconds = Math.max(1, Math.floor(CACHE_TTL / 1e3));
  const baseHeaders = getCorsHeaders(request, env, {
    "Content-Type": "application/json",
    "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
    "X-API-Version": API_VERSION
  });
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({ success: false, error: "Method not allowed", version: API_VERSION }, {
      status: 405,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const clientIp = getClientIp(request);
  if (!checkRateLimit3(clientIp, RATE_LIMIT_WINDOW, MAX_REQUESTS_PER_WINDOW, ENABLE_RATE_LIMITING)) {
    return jsonResponse({
      success: false,
      error: "Rate limit exceeded",
      message: "Too many requests. Please wait a moment.",
      version: API_VERSION
    }, {
      status: 429,
      headers: {
        ...baseHeaders,
        "Retry-After": Math.ceil(RATE_LIMIT_WINDOW / 1e3).toString(),
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const dateKey = getUtcDateString();
  const cacheKey = getCacheKey3(dateKey);
  const cached = cache3.get(cacheKey);
  if (cached && isCacheValid3(cached.timestamp, CACHE_TTL)) {
    return jsonResponse({
      success: true,
      events: cached.events,
      cached: true,
      cacheAge: Date.now() - cached.timestamp,
      timestamp: cached.timestamp,
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  try {
    const url = `${MLB_BASE_URL}&date=${encodeURIComponent(dateKey)}`;
    const response = await fetchWithTimeout3(url, {
      headers: {
        "User-Agent": "LiveScoreFree-Bot/2.0",
        "Accept": "application/json"
      }
    }, REQUEST_TIMEOUT);
    if (!response.ok) {
      throw new Error(`MLB API error: ${response.status}`);
    }
    const payload = await response.json();
    const dates = Array.isArray(payload?.dates) ? payload.dates : [];
    const games = dates.flatMap((date) => Array.isArray(date?.games) ? date.games : []);
    const events = buildEvents(games);
    cache3.set(cacheKey, {
      events,
      timestamp: Date.now()
    });
    pruneCache3(MAX_CACHE_ENTRIES);
    return jsonResponse({
      success: true,
      events,
      cached: false,
      timestamp: Date.now(),
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  } catch (error) {
    if (LOG_LEVEL !== "silent") {
      console.error("[API/mlb-live] Request error:", error);
    }
    return jsonResponse({
      success: false,
      error: error.message || "Failed to fetch MLB data",
      timestamp: Date.now()
    }, {
      status: 500,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
}
__name(onRequest4, "onRequest4");
__name2(onRequest4, "onRequest");
var NHL_SCORE_URL = "https://api-web.nhle.com/v1/score/now";
var cache4 = /* @__PURE__ */ new Map();
var requestCounts4 = /* @__PURE__ */ new Map();
function getCacheKey4() {
  return "nhl-live";
}
__name(getCacheKey4, "getCacheKey4");
__name2(getCacheKey4, "getCacheKey");
function isCacheValid4(timestamp, ttl) {
  return Date.now() - timestamp < ttl;
}
__name(isCacheValid4, "isCacheValid4");
__name2(isCacheValid4, "isCacheValid");
function pruneCache4(maxEntries) {
  if (cache4.size > maxEntries) {
    const oldestKey = cache4.keys().next().value;
    cache4.delete(oldestKey);
  }
}
__name(pruneCache4, "pruneCache4");
__name2(pruneCache4, "pruneCache");
function checkRateLimit4(ip, windowMs, maxRequests, enabled) {
  if (!enabled) return true;
  const now = Date.now();
  const windowStart = now - windowMs;
  if (!requestCounts4.has(ip)) {
    requestCounts4.set(ip, []);
  }
  const requests = requestCounts4.get(ip).filter((t) => t > windowStart);
  if (requests.length >= maxRequests) {
    requestCounts4.set(ip, requests);
    return false;
  }
  requests.push(now);
  requestCounts4.set(ip, requests);
  return true;
}
__name(checkRateLimit4, "checkRateLimit4");
__name2(checkRateLimit4, "checkRateLimit");
async function fetchWithTimeout4(url, options = {}, timeout = 8e3) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
__name(fetchWithTimeout4, "fetchWithTimeout4");
__name2(fetchWithTimeout4, "fetchWithTimeout");
function normalizeStatus2(state = "") {
  const token = String(state || "").toUpperCase();
  if (token.includes("LIVE") || token.includes("CRIT") || token.includes("IN_PROGRESS")) {
    return { name: "IN_PROGRESS", detail: "Live" };
  }
  if (token.includes("FINAL") || token.includes("OFF") || token.includes("COMPLETED")) {
    return { name: "FINAL", detail: "Final" };
  }
  return { name: "SCHEDULED", detail: "Scheduled" };
}
__name(normalizeStatus2, "normalizeStatus2");
__name2(normalizeStatus2, "normalizeStatus");
function pickTeamName2(team = {}) {
  return team?.name?.default || team?.placeName?.default || team?.name || team?.placeName || "Team";
}
__name(pickTeamName2, "pickTeamName2");
__name2(pickTeamName2, "pickTeamName");
function pickTeamAbbr2(team = {}, fallback = "TEAM") {
  return team?.abbrev || team?.abbreviation || fallback.slice(0, 3).toUpperCase();
}
__name(pickTeamAbbr2, "pickTeamAbbr2");
__name2(pickTeamAbbr2, "pickTeamAbbr");
function pickTeamScore2(team = {}) {
  const score = team?.score ?? team?.goals;
  if (score === null || score === void 0) {
    return "-";
  }
  return String(score);
}
__name(pickTeamScore2, "pickTeamScore2");
__name2(pickTeamScore2, "pickTeamScore");
function buildEvents2(games = []) {
  return games.map((game) => {
    const homeTeam = game.homeTeam || {};
    const awayTeam = game.awayTeam || {};
    const homeName = pickTeamName2(homeTeam);
    const awayName = pickTeamName2(awayTeam);
    const statusInfo = normalizeStatus2(game.state || game.gameState || game.status || "");
    const statusDetail = game.gameState || game.state || statusInfo.detail;
    const venue = game.venue?.default || game.venue?.name || "";
    return {
      id: String(game.id || ""),
      date: game.startTimeUTC || game.gameDate || (/* @__PURE__ */ new Date()).toISOString(),
      name: `${homeName} vs ${awayName}`,
      status: {
        type: {
          name: statusInfo.name,
          shortDetail: statusDetail,
          description: statusDetail
        }
      },
      competitions: [
        {
          competitors: [
            {
              homeAway: "home",
              team: {
                id: String(homeTeam.id || ""),
                displayName: homeName,
                abbreviation: pickTeamAbbr2(homeTeam, homeName),
                logo: ""
              },
              score: pickTeamScore2(homeTeam)
            },
            {
              homeAway: "away",
              team: {
                id: String(awayTeam.id || ""),
                displayName: awayName,
                abbreviation: pickTeamAbbr2(awayTeam, awayName),
                logo: ""
              },
              score: pickTeamScore2(awayTeam)
            }
          ],
          venue: { fullName: venue },
          status: {
            type: {
              name: statusInfo.name,
              shortDetail: statusDetail,
              description: statusDetail
            }
          }
        }
      ],
      source: "nhl"
    };
  }).filter((event) => event.id && event.competitions?.[0]?.competitors?.length === 2);
}
__name(buildEvents2, "buildEvents2");
__name2(buildEvents2, "buildEvents");
async function onRequest5(context) {
  const { request, env } = context;
  const startTime = Date.now();
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const CACHE_TTL = getIntEnv(env, "CACHE_TTL_LIVE", 15e3);
  const MAX_CACHE_ENTRIES = getIntEnv(env, "MAX_CACHE_ENTRIES", 100);
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8e3);
  const RATE_LIMIT_WINDOW = getIntEnv(env, "RATE_LIMIT_WINDOW", 6e4);
  const MAX_REQUESTS_PER_WINDOW = getIntEnv(env, "MAX_REQUESTS_PER_WINDOW", 100);
  const ENABLE_RATE_LIMITING = getBoolEnv(env, "ENABLE_RATE_LIMITING", true);
  const LOG_LEVEL = getEnv(env, "LOG_LEVEL", "info").toLowerCase();
  const cacheSeconds = Math.max(1, Math.floor(CACHE_TTL / 1e3));
  const baseHeaders = getCorsHeaders(request, env, {
    "Content-Type": "application/json",
    "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
    "X-API-Version": API_VERSION
  });
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({ success: false, error: "Method not allowed", version: API_VERSION }, {
      status: 405,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const clientIp = getClientIp(request);
  if (!checkRateLimit4(clientIp, RATE_LIMIT_WINDOW, MAX_REQUESTS_PER_WINDOW, ENABLE_RATE_LIMITING)) {
    return jsonResponse({
      success: false,
      error: "Rate limit exceeded",
      message: "Too many requests. Please wait a moment.",
      version: API_VERSION
    }, {
      status: 429,
      headers: {
        ...baseHeaders,
        "Retry-After": Math.ceil(RATE_LIMIT_WINDOW / 1e3).toString(),
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const cacheKey = getCacheKey4();
  const cached = cache4.get(cacheKey);
  if (cached && isCacheValid4(cached.timestamp, CACHE_TTL)) {
    return jsonResponse({
      success: true,
      events: cached.events,
      cached: true,
      cacheAge: Date.now() - cached.timestamp,
      timestamp: cached.timestamp,
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  try {
    const response = await fetchWithTimeout4(NHL_SCORE_URL, {
      headers: {
        "User-Agent": "LiveScoreFree-Bot/2.0",
        "Accept": "application/json"
      }
    }, REQUEST_TIMEOUT);
    if (!response.ok) {
      throw new Error(`NHL API error: ${response.status}`);
    }
    const payload = await response.json();
    const games = Array.isArray(payload?.games) ? payload.games : [];
    const events = buildEvents2(games);
    cache4.set(cacheKey, {
      events,
      timestamp: Date.now()
    });
    pruneCache4(MAX_CACHE_ENTRIES);
    return jsonResponse({
      success: true,
      events,
      cached: false,
      timestamp: Date.now(),
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  } catch (error) {
    if (LOG_LEVEL !== "silent") {
      console.error("[API/nhl-live] Request error:", error);
    }
    return jsonResponse({
      success: false,
      error: error.message || "Failed to fetch NHL data",
      timestamp: Date.now()
    }, {
      status: 500,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
}
__name(onRequest5, "onRequest5");
__name2(onRequest5, "onRequest");
var ALLOWED_HOSTS = /* @__PURE__ */ new Set([
  "site.api.espn.com",
  "www.thesportsdb.com",
  "gnews.io"
]);
function isAllowedUpstream(url) {
  return /^https:$/i.test(url.protocol) && ALLOWED_HOSTS.has(url.hostname);
}
__name(isAllowedUpstream, "isAllowedUpstream");
__name2(isAllowedUpstream, "isAllowedUpstream");
async function onRequest6(context) {
  const { request, env } = context;
  const startTime = Date.now();
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8e3);
  const baseHeaders = getCorsHeaders(request, env, {
    "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    "X-API-Version": API_VERSION
  });
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({
      success: false,
      error: "Method not allowed",
      version: API_VERSION
    }, {
      status: 405,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const incomingUrl = new URL(request.url);
  const target = incomingUrl.searchParams.get("url");
  if (!target) {
    return jsonResponse({
      success: false,
      error: "Missing url parameter",
      version: API_VERSION
    }, {
      status: 400,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  let upstreamUrl;
  try {
    upstreamUrl = new URL(target);
  } catch (_error) {
    return jsonResponse({
      success: false,
      error: "Invalid upstream url",
      version: API_VERSION
    }, {
      status: 400,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  if (!isAllowedUpstream(upstreamUrl)) {
    return jsonResponse({
      success: false,
      error: "Upstream host is not allowed",
      version: API_VERSION
    }, {
      status: 403,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: request.method,
      signal: controller.signal,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "LiveScoreFree-Proxy/2.0"
      }
    });
    const responseHeaders = new Headers(baseHeaders);
    responseHeaders.set("Content-Type", upstreamResponse.headers.get("Content-Type") || "application/json");
    responseHeaders.set("X-Upstream-Host", upstreamUrl.hostname);
    responseHeaders.set("X-Response-Time", `${Date.now() - startTime}ms`);
    if (request.method === "HEAD") {
      return new Response(null, {
        status: upstreamResponse.status,
        headers: responseHeaders
      });
    }
    const body = await upstreamResponse.text();
    return new Response(body, {
      status: upstreamResponse.status,
      headers: responseHeaders
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message || "Upstream fetch failed",
      version: API_VERSION
    }, {
      status: 502,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  } finally {
    clearTimeout(timer);
  }
}
__name(onRequest6, "onRequest6");
__name2(onRequest6, "onRequest");
var LEAGUE_MAPPING = {
  "eng.1": "soccer/eng.1",
  "esp.1": "soccer/esp.1",
  "ita.1": "soccer/ita.1",
  "ger.1": "soccer/ger.1",
  "fra.1": "soccer/fra.1",
  "nba": "basketball/nba",
  "nfl": "football/nfl",
  "nhl": "hockey/nhl",
  "mlb": "baseball/mlb"
};
var cache5 = /* @__PURE__ */ new Map();
function fetchWithTimeout5(url, options = {}, timeout = 8e3) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}
__name(fetchWithTimeout5, "fetchWithTimeout5");
__name2(fetchWithTimeout5, "fetchWithTimeout");
async function fetchEspnStandings(espnBase, leagueId, timeout) {
  try {
    const espnLeague = LEAGUE_MAPPING[leagueId] || `soccer/${leagueId}`;
    const url = `${espnBase}/${espnLeague}/standings`;
    const response = await fetchWithTimeout5(url, {
      headers: { "User-Agent": "LiveScoreFree-Bot/1.0" }
    }, timeout);
    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);
    const data = await response.json();
    return extractStandings(data);
  } catch (error) {
    console.error("ESPN standings fetch error:", error);
    return [];
  }
}
__name(fetchEspnStandings, "fetchEspnStandings");
__name2(fetchEspnStandings, "fetchEspnStandings");
function extractStandings(data) {
  const standings = [];
  if (data.standings?.[0]?.entries) {
    data.standings[0].entries.forEach((entry, rank) => {
      standings.push({
        rank: rank + 1,
        teamId: entry.team?.id || "",
        teamName: entry.team?.displayName || "",
        teamLogo: entry.team?.logo || "",
        points: entry.points || 0,
        played: entry.stats?.find((s) => s.name === "gamesPlayed")?.value || 0,
        won: entry.stats?.find((s) => s.name === "wins")?.value || 0,
        lost: entry.stats?.find((s) => s.name === "losses")?.value || 0,
        drawn: entry.stats?.find((s) => s.name === "draws")?.value || 0,
        goalsFor: entry.stats?.find((s) => s.name === "pointsFor")?.value || 0,
        goalsAgainst: entry.stats?.find((s) => s.name === "pointsAgainst")?.value || 0,
        goalDifference: (entry.stats?.find((s) => s.name === "pointsFor")?.value || 0) - (entry.stats?.find((s) => s.name === "pointsAgainst")?.value || 0)
      });
    });
  }
  return standings;
}
__name(extractStandings, "extractStandings");
__name2(extractStandings, "extractStandings");
async function onRequest7(context) {
  const { request, env } = context;
  const startTime = Date.now();
  const ESPN_BASE = getEnv(env, "ESPN_API_BASE", "https://site.api.espn.com/apis/site/v2/sports");
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8e3);
  const CACHE_TTL = getIntEnv(env, "CACHE_TTL_STANDINGS", 36e5);
  const cacheSeconds = Math.max(1, Math.floor(CACHE_TTL / 1e3));
  const baseHeaders = getCorsHeaders(request, env, {
    "Content-Type": "application/json",
    "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
    "X-API-Version": API_VERSION
  });
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({
      success: false,
      error: "Method not allowed",
      version: API_VERSION
    }, {
      status: 405,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const url = new URL(request.url);
  const league = url.searchParams.get("league");
  if (!league) {
    return jsonResponse({
      success: false,
      error: "Missing league parameter",
      version: API_VERSION
    }, {
      status: 400,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const cacheKey = `standings-${league}`;
  const cached = cache5.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return jsonResponse({
      success: true,
      data: cached.data,
      cached: true,
      timestamp: cached.timestamp,
      leagueId: league,
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  try {
    const standings = await fetchEspnStandings(ESPN_BASE, league, REQUEST_TIMEOUT);
    if (standings.length === 0) {
      return jsonResponse({
        success: false,
        error: `No standings found for league: ${league}`,
        version: API_VERSION
      }, {
        status: 404,
        headers: {
          ...baseHeaders,
          "X-Response-Time": `${Date.now() - startTime}ms`
        }
      });
    }
    cache5.set(cacheKey, {
      data: standings,
      timestamp: Date.now()
    });
    return jsonResponse({
      success: true,
      data: standings,
      cached: false,
      leagueId: league,
      teamCount: standings.length,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  } catch (error) {
    console.error("Standings API error:", error);
    return jsonResponse({
      success: false,
      error: error.message || "Failed to fetch standings",
      version: API_VERSION
    }, {
      status: 500,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
}
__name(onRequest7, "onRequest7");
__name2(onRequest7, "onRequest");
var cache6 = /* @__PURE__ */ new Map();
async function fetchWithTimeout6(url, options = {}, timeout = 8e3) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}
__name(fetchWithTimeout6, "fetchWithTimeout6");
__name2(fetchWithTimeout6, "fetchWithTimeout");
async function fetchEspnTimeline(espnBase, matchId, timeout) {
  try {
    const url = `${espnBase}/soccer/eng.1/events/${matchId}`;
    const response = await fetchWithTimeout6(url, {
      headers: { "User-Agent": "LiveScoreFree-Bot/1.0" }
    }, timeout);
    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);
    const data = await response.json();
    return extractTimeline(data);
  } catch (error) {
    console.error("ESPN timeline fetch error:", error);
    return [];
  }
}
__name(fetchEspnTimeline, "fetchEspnTimeline");
__name2(fetchEspnTimeline, "fetchEspnTimeline");
async function fetchSportsDbTimeline(sportsDbBase, eventId, timeout) {
  try {
    const url = `${sportsDbBase}/eventslast.php?id=${eventId}`;
    const response = await fetchWithTimeout6(url, {
      headers: { "User-Agent": "LiveScoreFree-Bot/1.0" }
    }, timeout);
    if (!response.ok) throw new Error(`SportsDB API error: ${response.status}`);
    const data = await response.json();
    return extractSportsDbTimeline(data);
  } catch (error) {
    console.error("SportsDB timeline fetch error:", error);
    return [];
  }
}
__name(fetchSportsDbTimeline, "fetchSportsDbTimeline");
__name2(fetchSportsDbTimeline, "fetchSportsDbTimeline");
function getEventPlayer(event = {}) {
  return event.athlete?.displayName || event.athlete?.fullName || event.player?.displayName || event.player?.fullName || "";
}
__name(getEventPlayer, "getEventPlayer");
__name2(getEventPlayer, "getEventPlayer");
function extractTimeline(data) {
  const events = [];
  if (data.competitions?.[0]?.competitors) {
    const competitors = data.competitions[0].competitors;
    competitors.forEach((competitor) => {
      if (competitor.events) {
        competitor.events.forEach((event) => {
          events.push({
            minute: event.clock?.displayValue || "0'",
            type: normalizeEventType(event.type),
            description: event.description || "",
            team: competitor.team?.displayName || "",
            teamId: competitor.team?.id || "",
            player: getEventPlayer(event),
            timestamp: event.date || Date.now()
          });
        });
      }
    });
  }
  return events.sort((a, b) => parseInt(a.minute) - parseInt(b.minute));
}
__name(extractTimeline, "extractTimeline");
__name2(extractTimeline, "extractTimeline");
function extractSportsDbTimeline(data) {
  if (!data.results?.[0]) return [];
  const match2 = data.results[0];
  const events = [];
  if (match2.strHomeGoalDetails) {
    match2.strHomeGoalDetails.split(";").forEach((goal) => {
      if (goal.trim()) {
        const parts = goal.trim().split("(");
        events.push({
          minute: parts[1]?.replace(")", "") || "0'",
          type: "goal",
          description: `Goal by ${parts[0]?.trim()}`,
          team: match2.strHomeTeam || "",
          player: parts[0]?.trim() || "",
          timestamp: Date.now()
        });
      }
    });
  }
  if (match2.strAwayGoalDetails) {
    match2.strAwayGoalDetails.split(";").forEach((goal) => {
      if (goal.trim()) {
        const parts = goal.trim().split("(");
        events.push({
          minute: parts[1]?.replace(")", "") || "0'",
          type: "goal",
          description: `Goal by ${parts[0]?.trim()}`,
          team: match2.strAwayTeam || "",
          player: parts[0]?.trim() || "",
          timestamp: Date.now()
        });
      }
    });
  }
  return events.sort((a, b) => parseInt(a.minute) - parseInt(b.minute));
}
__name(extractSportsDbTimeline, "extractSportsDbTimeline");
__name2(extractSportsDbTimeline, "extractSportsDbTimeline");
function normalizeEventType(type) {
  const typeMap = {
    goal: "goal",
    yellow_card: "yellow-card",
    red_card: "red-card",
    substitution: "substitution",
    own_goal: "own-goal",
    penalty: "penalty"
  };
  return typeMap[type?.toLowerCase()] || "event";
}
__name(normalizeEventType, "normalizeEventType");
__name2(normalizeEventType, "normalizeEventType");
async function onRequest8(context) {
  const { request, env } = context;
  const startTime = Date.now();
  const ESPN_BASE = getEnv(env, "ESPN_API_BASE", "https://site.api.espn.com/apis/site/v2/sports");
  const SPORTSDB_BASE = getEnv(env, "SPORTSDB_API_BASE", "https://www.thesportsdb.com/api/v1/json/123");
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8e3);
  const CACHE_TTL = getIntEnv(env, "CACHE_TTL_TIMELINE", 1e4);
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const cacheSeconds = Math.max(1, Math.floor(CACHE_TTL / 1e3));
  const baseHeaders = getCorsHeaders(request, env, {
    "Content-Type": "application/json",
    "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
    "X-API-Version": API_VERSION
  });
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({
      success: false,
      error: "Method not allowed",
      version: API_VERSION
    }, {
      status: 405,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const url = new URL(request.url);
  const matchId = url.searchParams.get("match");
  if (!matchId) {
    return jsonResponse({
      success: false,
      error: "Missing match parameter",
      version: API_VERSION
    }, {
      status: 400,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  const cacheKey = `timeline-${matchId}`;
  const cached = cache6.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return jsonResponse({
      success: true,
      data: cached.data,
      cached: true,
      timestamp: cached.timestamp,
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
  try {
    let timeline = await fetchEspnTimeline(ESPN_BASE, matchId, REQUEST_TIMEOUT);
    if (!timeline.length) {
      timeline = await fetchSportsDbTimeline(SPORTSDB_BASE, matchId, REQUEST_TIMEOUT);
    }
    cache6.set(cacheKey, {
      data: timeline,
      timestamp: Date.now()
    });
    return jsonResponse({
      success: true,
      data: timeline,
      cached: false,
      matchId,
      eventCount: timeline.length,
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  } catch (error) {
    console.error("Timeline API error:", error);
    return jsonResponse({
      success: false,
      error: error.message || "Failed to fetch timeline",
      version: API_VERSION
    }, {
      status: 500,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
}
__name(onRequest8, "onRequest8");
__name2(onRequest8, "onRequest");
async function onRequest9(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname || "/";
  if (path.startsWith("/api/") || path.startsWith("/.well-known/") || path === "/robots.txt" || path === "/sitemap.xml" || path === "/manifest.json" || path === "/sw.js" || path === "/favicon.ico") {
    return next();
  }
  const lastSegment = path.split("/").pop() || "";
  if (lastSegment.includes(".")) {
    return next();
  }
  const rewrittenUrl = new URL("/", request.url);
  const rewrittenRequest = new Request(rewrittenUrl.toString(), request);
  if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
    return env.ASSETS.fetch(rewrittenRequest);
  }
  return fetch(rewrittenRequest);
}
__name(onRequest9, "onRequest9");
__name2(onRequest9, "onRequest");
var routes = [
  {
    routePath: "/api/cricket-live",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/health",
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
    routePath: "/api/mlb-live",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/nhl-live",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/api/proxy",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/api/standings",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/api/timeline",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest9],
    modules: []
  }
];
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
__name2(lexer, "lexer");
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
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
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
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
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
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
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
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
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
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
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
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
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
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
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
          passThroughOnException: /* @__PURE__ */ __name2(() => {
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
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
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
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
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
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
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
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
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
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
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
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
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
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// C:/Users/ashis/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
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
var middleware_ensure_req_body_drained_default2 = drainBody2;

// C:/Users/ashis/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-p1sCh7/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// C:/Users/ashis/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-p1sCh7/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
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
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
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
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
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
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.0469206691579529.js.map
