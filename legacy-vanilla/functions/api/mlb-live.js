/**
 * /api/mlb-live
 * Endpoint: GET /api/mlb-live
 * Returns: Live MLB events from official MLB StatsAPI.
 * Caching: 10-15 seconds
 *
 * @author livescoreFree.online Team
 * @version 1.0
 * @updated 2026-03-15
 */

import {
  getEnv,
  getIntEnv,
  getBoolEnv,
  getClientIp,
  getCorsHeaders,
  jsonResponse
} from "../_shared.js";

const MLB_BASE_URL = "https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1";

const cache = new Map();
const requestCounts = new Map();

function getCacheKey(dateKey) {
  return `mlb-live-${dateKey}`;
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

function getUtcDateString() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

function pickTeamName(team = {}) {
  return team?.name || team?.teamName || "Team";
}

function pickTeamAbbr(team = {}, fallback = "TEAM") {
  return team?.abbreviation || team?.abbr || fallback.slice(0, 3).toUpperCase();
}

function pickTeamScore(side = {}) {
  const score = side?.score;
  if (score === null || score === undefined) {
    return "-";
  }
  return String(score);
}

function buildEvents(games = []) {
  return games
    .map((game) => {
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
        date: game?.gameDate || new Date().toISOString(),
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
    })
    .filter((event) => event.id && event.competitions?.[0]?.competitors?.length === 2);
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
        "Retry-After": Math.ceil(RATE_LIMIT_WINDOW / 1000).toString(),
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }

  const dateKey = getUtcDateString();
  const cacheKey = getCacheKey(dateKey);
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
    const url = `${MLB_BASE_URL}&date=${encodeURIComponent(dateKey)}`;
    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "livescoreFree.online-Bot/2.0",
        "Accept": "application/json"
      }
    }, REQUEST_TIMEOUT);

    if (!response.ok) {
      throw new Error(`MLB API error: ${response.status}`);
    }

    const payload = await response.json();
    const dates = Array.isArray(payload?.dates) ? payload.dates : [];
    const games = dates.flatMap((date) => (Array.isArray(date?.games) ? date.games : []));
    const events = buildEvents(games);

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





