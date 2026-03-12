/**
 * /api/standings.js
 * Endpoint: GET /api/standings?league=eng.1
 * Returns: League standings table (Rank, Team, Points, Played, Won, Lost)
 * Caching: 3600 seconds (1 hour)
 */

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123";

const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

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
    const response = await fetch(url, {
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { league } = req.query;

  if (!league) {
    return res.status(400).json({
      success: false,
      error: "Missing league parameter"
    });
  }

  const cacheKey = `standings-${league}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json({
      success: true,
      data: cached.data,
      cached: true,
      timestamp: cached.timestamp,
      leagueId: league
    });
  }

  try {
    const standings = await fetchEspnStandings(league);

    if (standings.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No standings found for league: ${league}`
      });
    }

    // Cache results
    cache.set(cacheKey, {
      data: standings,
      timestamp: Date.now()
    });

    return res.status(200).json({
      success: true,
      data: standings,
      cached: false,
      leagueId: league,
      teamCount: standings.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Standings API error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch standings"
    });
  }
}
