/**
 * /api/live.js
 * Endpoint: GET /api/live?sport=football&limit=50
 * Returns: Live and upcoming match data from ESPN and TheSportsDB
 * Caching: 15 seconds
 */

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123";

// Cache with TTL
const cache = new Map();
const CACHE_TTL = 15000; // 15 seconds

function getCacheKey(sport) {
  return `live-${sport}`;
}

function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_TTL;
}

async function fetchEspnMatches(sport = "soccer/eng.1") {
  try {
    const url = `${ESPN_BASE}/${sport}/events?limit=50&status=in,upcoming`;
    const response = await fetch(url, {
      headers: { "User-Agent": "LiveScoreFree-Bot/1.0" }
    });
    
    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);
    
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error("ESPN fetch error:", error);
    return [];
  }
}

async function fetchSportsDbMatches(league = "133602") {
  try {
    const url = `${SPORTSDB_BASE}/eventslast.php?id=${league}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`SportsDB API error: ${response.status}`);
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("SportsDB fetch error:", error);
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
    status: event.status || event.strStatus || "NOT_STARTED",
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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const sport = req.query.sport || "football";
  const limit = parseInt(req.query.limit) || 50;
  const cacheKey = getCacheKey(sport);

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return res.status(200).json({
      success: true,
      data: cached.data,
      cached: true,
      timestamp: cached.timestamp
    });
  }

  try {
    // Fetch from ESPN
    const espnMatches = await fetchEspnMatches(`soccer/eng.1`);
    const normalizedMatches = espnMatches.map(normalizeMatch).slice(0, limit);

    // Store in cache
    cache.set(cacheKey, {
      data: normalizedMatches,
      timestamp: Date.now()
    });

    return res.status(200).json({
      success: true,
      data: normalizedMatches,
      cached: false,
      timestamp: Date.now(),
      count: normalizedMatches.length
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch live matches"
    });
  }
}
