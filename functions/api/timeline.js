/**
 * /api/timeline
 * Endpoint: GET /api/timeline?match=id
 * Returns: Match timeline events
 * Caching: 10 seconds
 */

import { getEnv, getIntEnv, getCorsHeaders, jsonResponse } from "../_shared.js";

const cache = new Map();

async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchEspnTimeline(espnBase, matchId, timeout) {
  try {
    const url = `${espnBase}/soccer/eng.1/events/${matchId}`;
    const response = await fetchWithTimeout(url, {
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

async function fetchSportsDbTimeline(sportsDbBase, eventId, timeout) {
  try {
    const url = `${sportsDbBase}/eventslast.php?id=${eventId}`;
    const response = await fetchWithTimeout(url, {
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

function getEventPlayer(event = {}) {
  return (
    event.athlete?.displayName ||
    event.athlete?.fullName ||
    event.player?.displayName ||
    event.player?.fullName ||
    ""
  );
}

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

function extractSportsDbTimeline(data) {
  if (!data.results?.[0]) return [];

  const match = data.results[0];
  const events = [];

  if (match.strHomeGoalDetails) {
    match.strHomeGoalDetails.split(";").forEach((goal) => {
      if (goal.trim()) {
        const parts = goal.trim().split("(");
        events.push({
          minute: parts[1]?.replace(")", "") || "0'",
          type: "goal",
          description: `Goal by ${parts[0]?.trim()}`,
          team: match.strHomeTeam || "",
          player: parts[0]?.trim() || "",
          timestamp: Date.now()
        });
      }
    });
  }

  if (match.strAwayGoalDetails) {
    match.strAwayGoalDetails.split(";").forEach((goal) => {
      if (goal.trim()) {
        const parts = goal.trim().split("(");
        events.push({
          minute: parts[1]?.replace(")", "") || "0'",
          type: "goal",
          description: `Goal by ${parts[0]?.trim()}`,
          team: match.strAwayTeam || "",
          player: parts[0]?.trim() || "",
          timestamp: Date.now()
        });
      }
    });
  }

  return events.sort((a, b) => parseInt(a.minute) - parseInt(b.minute));
}

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

export async function onRequest(context) {
  const { request, env } = context;
  const startTime = Date.now();

  const ESPN_BASE = getEnv(env, "ESPN_API_BASE", "https://site.api.espn.com/apis/site/v2/sports");
  const SPORTSDB_BASE = getEnv(env, "SPORTSDB_API_BASE", "https://www.thesportsdb.com/api/v1/json/123");
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8000);
  const CACHE_TTL = getIntEnv(env, "CACHE_TTL_TIMELINE", 10000);
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");

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
  const cached = cache.get(cacheKey);

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

    cache.set(cacheKey, {
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
