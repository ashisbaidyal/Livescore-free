/**
 * /api/standings.js
 * Endpoint: GET /api/standings?league=eng.1
 * Returns: League standings table (Rank, Team, Points, Played, Won, Lost)
 * Caching: 3600 seconds (1 hour)
 */

const ESPN_BASE = process.env.ESPN_API_BASE || "https://site.api.espn.com/apis/site/v2/sports";
const API_VERSION = process.env.API_VERSION || "2.0";
const REQUEST_TIMEOUT = parseInt(process.env.API_TIMEOUT || "8000", 10);
const CACHE_TTL = parseInt(process.env.CACHE_TTL_STANDINGS || "3600000", 10); // 1 hour default

const cache = new Map();

function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

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

async function fetchEspnStandings(leagueId) {
  try {
    const espnLeague = LEAGUE_MAPPING[leagueId] || `soccer/${leagueId}`;
    const url = `${ESPN_BASE}/${espnLeague}/standings`;
    const response = await fetchWithTimeout(url, {
      headers: { "User-Agent": "LiveScoreFree-Bot/1.0" }
    });

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

function normalizeStandings(data) {
  return data.map((item, idx) => ({
    rank: idx + 1,
    teamName: item.strTeam || "",
    teamId: item.idTeam || "",
    played: parseInt(item.intPlayed) || 0,
    won: parseInt(item.intWin) || 0,
    lost: parseInt(item.intLoss) || 0,
    drawn: parseInt(item.intDraw) || 0,
    points: parseInt(item.intPoints) || 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0
  }));
}

export default async function handler(req, res) {
  const startTime = Date.now();
  const cacheSeconds = Math.max(1, Math.floor(CACHE_TTL / 1000));

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`);
  res.setHeader("X-API-Version", API_VERSION);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { league } = req.query;

  if (!league) {
    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(400).json({
      success: false,
      error: "Missing league parameter",
      version: API_VERSION
    });
  }

  const cacheKey = `standings-${league}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(200).json({
      success: true,
      data: cached.data,
      cached: true,
      timestamp: cached.timestamp,
      leagueId: league,
      version: API_VERSION
    });
  }

  try {
    const standings = await fetchEspnStandings(league);

    if (standings.length === 0) {
      res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
      return res.status(404).json({
        success: false,
        error: `No standings found for league: ${league}`,
        version: API_VERSION
      });
    }

    // Cache results
    cache.set(cacheKey, {
      data: standings,
      timestamp: Date.now()
    });

    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(200).json({
      success: true,
      data: standings,
      cached: false,
      leagueId: league,
      teamCount: standings.length,
      lastUpdated: new Date().toISOString(),
      version: API_VERSION
    });
  } catch (error) {
    console.error("Standings API error:", error);
    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch standings",
      version: API_VERSION
    });
  }
}
