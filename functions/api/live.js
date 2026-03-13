/**
 * /api/live
 * Endpoint: GET /api/live?sport=football&limit=50
 * Returns: Live and upcoming match data from ESPN and TheSportsDB
 * Caching: 15 seconds
 *
 * @author LiveScoreFree Team
 * @version 2.0
 * @updated 2026-03-13
 */

import {
  getEnv,
  getIntEnv,
  getBoolEnv,
  getClientIp,
  getCorsHeaders,
  jsonResponse
} from "../_shared.js";

const SPORT_FEEDS = {
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

const cache = new Map();
const requestCounts = new Map();

function getCacheKey(sport) {
  return `live-${sport}`;
}

function isCacheValid(timestamp, ttl) {
  return Date.now() - timestamp < ttl;
}

function pruneCache(maxEntries) {
  if (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

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

async function fetchWithTimeout(url, options = {}, timeout = 8000) {
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

async function fetchEspnMatches(espnBase, sportFeed, timeout) {
  try {
    const url = `${espnBase}/${sportFeed}/events?limit=50&status=in,upcoming`;
    const response = await fetchWithTimeout(url, {
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

async function fetchSportsDbMatches(sportsDbBase, timeout) {
  try {
    const url = `${sportsDbBase}/eventslast.php?id=133602`;
    const response = await fetchWithTimeout(url, {
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

function normalizeMatch(event) {
  return {
    id: event.id || event.idEvent || "",
    homeTeam: event.competitions?.[0]?.competitors?.[0]?.team?.displayName || event.strHomeTeam || "",
    awayTeam: event.competitions?.[0]?.competitors?.[1]?.team?.displayName || event.strAwayTeam || "",
    homeScore: parseInt(event.competitions?.[0]?.competitors?.[0]?.score) || 0,
    awayScore: parseInt(event.competitions?.[0]?.competitors?.[1]?.score) || 0,
    status: event.status?.type?.description ||
            event.status?.type?.name ||
            event.strStatus ||
            event.status ||
            "NOT_STARTED",
    date: event.date || event.dateEvent || "",
    league: event.league?.name || event.strLeague || "",
    venue: event.competitions?.[0]?.venue?.fullName || event.strVenue || "",
    sportGroup: normalizeSport(event)
  };
}

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

export async function onRequest(context) {
  const { request, env } = context;
  const startTime = Date.now();

  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const CACHE_TTL = getIntEnv(env, "CACHE_TTL_LIVE", 15000);
  const MAX_CACHE_ENTRIES = getIntEnv(env, "MAX_CACHE_ENTRIES", 100);
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8000);
  const RATE_LIMIT_WINDOW = getIntEnv(env, "RATE_LIMIT_WINDOW", 60000);
  const MAX_REQUESTS_PER_WINDOW = getIntEnv(env, "MAX_REQUESTS_PER_WINDOW", 100);
  const ENABLE_RATE_LIMITING = getBoolEnv(env, "ENABLE_RATE_LIMITING", true);
  const LOG_LEVEL = getEnv(env, "LOG_LEVEL", "info").toLowerCase();
  const ESPN_BASE = getEnv(env, "ESPN_API_BASE", "https://site.api.espn.com/apis/site/v2/sports");
  const SPORTSDB_BASE = getEnv(env, "SPORTSDB_API_BASE", "https://www.thesportsdb.com/api/v1/json/123");

  const cacheSeconds = Math.max(1, Math.floor(CACHE_TTL / 1000));
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
  const cacheKey = getCacheKey(sport);

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
        "Retry-After": Math.ceil(RATE_LIMIT_WINDOW / 1000).toString(),
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }

  const cached = cache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp, CACHE_TTL)) {
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

    cache.set(cacheKey, {
      data: normalizedMatches,
      timestamp: Date.now()
    });

    pruneCache(MAX_CACHE_ENTRIES);

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
