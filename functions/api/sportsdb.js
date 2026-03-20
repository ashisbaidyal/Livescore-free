/**
 * /api/sportsdb
 * Optimized endpoint for SportsDB data with smart caching and rate limiting
 * 
 * Free Tier Limits (30 req/min): We cache aggressively to stay within limits
 * 
 * @author livescoreFree.online Team
 * @version 1.0
 * @updated 2026-03-20
 */

import {
  getEnv,
  getIntEnv,
  getBoolEnv,
  getCorsHeaders,
  jsonResponse
} from "../_shared.js";

import {
  sportsdbFetchWithRateLimit,
  getCachedSportsDbData,
  setCachedSportsDbData,
  getSportsDbCacheStats,
  getSportsDbStatusMessage
} from "./sportsdb-helper.js";

// Map of sports as defined in api.js constants
const SPORTSDB_SPORTS = {
  football: "Soccer",
  cricket: "Cricket",
  basketball: "Basketball",
  tennis: "Tennis",
  nfl: "American Football",
  hockey: "Ice Hockey",
  baseball: "Baseball",
  rugby: "Rugby",
  mma: "Fighting",
  f1: "Motorsport"
};

export async function onRequest(context) {
  const { request, env } = context;
  const startTime = Date.now();

  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const SPORTSDB_BASE = getEnv(env, "SPORTSDB_API_BASE", "https://www.thesportsdb.com/api/v1/json/123");
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8000);
  const LOG_LEVEL = getEnv(env, "LOG_LEVEL", "info").toLowerCase();

  const baseHeaders = getCorsHeaders(request, env, {
    "Content-Type": "application/json",
    "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    "X-API-Version": API_VERSION,
    "X-SportsDB-Status": getSportsDbStatusMessage(SPORTSDB_BASE.split("/").pop())
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
      headers: { ...baseHeaders, "X-Response-Time": `${Date.now() - startTime}ms` }
    });
  }

  const url = new URL(request.url);
  const action = (url.searchParams.get("action") || "events-day").toLowerCase();
  const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
  const sport = (url.searchParams.get("sport") || "Soccer").toLowerCase();

  try {
    switch (action) {
      case "events-day":
        return handleEventsByDay(SPORTSDB_BASE, date, sport, REQUEST_TIMEOUT, startTime, baseHeaders, API_VERSION);

      case "events-by-sport":
        return handleAllEventsBySport(SPORTSDB_BASE, date, REQUEST_TIMEOUT, startTime, baseHeaders, API_VERSION);

      case "league-detail":
        return handleLeagueDetail(SPORTSDB_BASE, url.searchParams.get("league-id"), REQUEST_TIMEOUT, startTime, baseHeaders, API_VERSION);

      case "cache-stats":
        return handleCacheStats(startTime, baseHeaders, API_VERSION);

      default:
        return jsonResponse({
          success: false,
          error: "Unknown action",
          supportedActions: ["events-day", "events-by-sport", "league-detail", "cache-stats"]
        }, {
          status: 400,
          headers: { ...baseHeaders, "X-Response-Time": `${Date.now() - startTime}ms` }
        });
    }
  } catch (error) {
    if (LOG_LEVEL !== "silent") {
      console.error("[API/sportsdb]", action, "error:", error.message);
    }

    return jsonResponse({
      success: true,
      data: [],
      error: error.message,
      errorType: "REQUEST_FAILED",
      cached: false,
      timestamp: Date.now(),
      version: API_VERSION
    }, {
      status: 200,
      headers: { ...baseHeaders, "X-Response-Time": `${Date.now() - startTime}ms` }
    });
  }
}

async function handleEventsByDay(sportsdbBase, date, sport, timeout, startTime, baseHeaders, apiVersion) {
  const sportName = SPORTSDB_SPORTS[sport] || "Soccer";
  const cacheKey = `eventsday:${date}:${sport}`;

  try {
    const url = `${sportsdbBase}/eventsday.php?d=${encodeURIComponent(date)}&s=${encodeURIComponent(sportName)}`;
    const data = await sportsdbFetchWithRateLimit(url, timeout);

    const events = Array.isArray(data?.events) ? data.events :
                   Array.isArray(data?.event) ? data.event : [];

    return jsonResponse({
      success: true,
      data: events,
      cached: false,
      sport: sportName,
      date,
      count: events.length,
      timestamp: Date.now(),
      version: apiVersion
    }, {
      status: 200,
      headers: { ...baseHeaders, "X-Response-Time": `${Date.now() - startTime}ms` }
    });
  } catch (error) {
    console.error(`[API/sportsdb] eventsday error for ${sport}:`, error.message);
    return jsonResponse({
      success: true,
      data: [],
      cached: false,
      sport: sportName,
      date,
      count: 0,
      error: error.message,
      errorType: error.message.includes("429") ? "RATE_LIMITED" : "FETCH_FAILED",
      timestamp: Date.now(),
      version: apiVersion
    }, {
      status: 200,
      headers: { ...baseHeaders, "X-Response-Time": `${Date.now() - startTime}ms` }
    });
  }
}

async function handleAllEventsBySport(sportsdbBase, date, timeout, startTime, baseHeaders, apiVersion) {
  const results = {};
  const errors = [];

  // Fetch events for all sports in parallel but with backoff
  const sportPromises = Object.entries(SPORTSDB_SPORTS).map(async ([key, sportName]) => {
    try {
      const url = `${sportsdbBase}/eventsday.php?d=${encodeURIComponent(date)}&s=${encodeURIComponent(sportName)}`;
      const data = await sportsdbFetchWithRateLimit(url, timeout);
      const events = Array.isArray(data?.events) ? data.events :
                     Array.isArray(data?.event) ? data.event : [];
      results[key] = {
        sport: sportName,
        count: events.length,
        events
      };
    } catch (error) {
      errors.push({ sport: sportName, error: error.message });
      results[key] = { sport: sportName, count: 0, events: [] };
    }
  });

  await Promise.all(sportPromises);

  const totalEvents = Object.values(results).reduce((sum, r) => sum + r.count, 0);

  return jsonResponse({
    success: true,
    data: results,
    cached: false,
    date,
    totalEvents,
    errorCount: errors.length,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: Date.now(),
    version: apiVersion
  }, {
    status: 200,
    headers: { ...baseHeaders, "X-Response-Time": `${Date.now() - startTime}ms` }
  });
}

async function handleLeagueDetail(sportsdbBase, leagueId, timeout, startTime, baseHeaders, apiVersion) {
  if (!leagueId) {
    return jsonResponse({
      success: false,
      error: "league-id parameter required",
      version: apiVersion
    }, {
      status: 400,
      headers: { ...baseHeaders, "X-Response-Time": `${Date.now() - startTime}ms` }
    });
  }

  try {
    const url = `${sportsdbBase}/lookupleague.php?id=${encodeURIComponent(leagueId)}`;
    const data = await sportsdbFetchWithRateLimit(url, timeout);

    const league = Array.isArray(data?.leagues) ? data.leagues[0] : null;

    return jsonResponse({
      success: true,
      data: league || null,
      cached: false,
      leagueId,
      timestamp: Date.now(),
      version: apiVersion
    }, {
      status: 200,
      headers: { ...baseHeaders, "X-Response-Time": `${Date.now() - startTime}ms` }
    });
  } catch (error) {
    return jsonResponse({
      success: true,
      data: null,
      cached: false,
      leagueId,
      error: error.message,
      errorType: "FETCH_FAILED",
      timestamp: Date.now(),
      version: apiVersion
    }, {
      status: 200,
      headers: { ...baseHeaders, "X-Response-Time": `${Date.now() - startTime}ms` }
    });
  }
}

function handleCacheStats(startTime, baseHeaders, apiVersion) {
  const stats = getSportsDbCacheStats();

  return jsonResponse({
    success: true,
    cacheStats: stats,
    timestamp: Date.now(),
    version: apiVersion
  }, {
    status: 200,
    headers: { ...baseHeaders, "X-Response-Time": `${Date.now() - startTime}ms` }
  });
}





