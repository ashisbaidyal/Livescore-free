/**
 * /api/standings
 * Endpoint: GET /api/standings?league=eng.1
 * Returns: League standings table
 * Caching: 3600 seconds (1 hour)
 */

import { getEnv, getIntEnv, getCorsHeaders, jsonResponse } from "../_shared.js";

const LEAGUE_MAPPING = {
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

const cache = new Map();

function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

async function fetchEspnStandings(espnBase, leagueId, timeout) {
  try {
    const espnLeague = LEAGUE_MAPPING[leagueId] || `soccer/${leagueId}`;
    const url = `${espnBase}/${espnLeague}/standings`;
    const response = await fetchWithTimeout(url, {
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
        goalDifference: (entry.stats?.find((s) => s.name === "pointsFor")?.value || 0) -
                        (entry.stats?.find((s) => s.name === "pointsAgainst")?.value || 0)
      });
    });
  }

  return standings;
}

export async function onRequest(context) {
  const { request, env } = context;
  const startTime = Date.now();

  const ESPN_BASE = getEnv(env, "ESPN_API_BASE", "https://site.api.espn.com/apis/site/v2/sports");
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8000);
  const CACHE_TTL = getIntEnv(env, "CACHE_TTL_STANDINGS", 3600000);

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
  const cached = cache.get(cacheKey);

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

    cache.set(cacheKey, {
      data: standings,
      timestamp: Date.now()
    });

    return jsonResponse({
      success: true,
      data: standings,
      cached: false,
      leagueId: league,
      teamCount: standings.length,
      lastUpdated: new Date().toISOString(),
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
