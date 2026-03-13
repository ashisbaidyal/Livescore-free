/**
 * /api/live.js
 * Endpoint: GET /api/live?sport=football&limit=50
 * Returns: Live and upcoming match data from ESPN and TheSportsDB
 * Caching: 15 seconds
 * 
 * @author LiveScoreFree Team
 * @version 2.0
 * @updated 2026-03-13
 */

const ESPN_BASE = process.env.ESPN_API_BASE || "https://site.api.espn.com/apis/site/v2/sports";
const SPORTSDB_BASE = process.env.SPORTSDB_API_BASE || "https://www.thesportsdb.com/api/v1/json/123";
const API_VERSION = process.env.API_VERSION || "2.0";
const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase();

// Cache with TTL
const cache = new Map();
const CACHE_TTL = parseInt(process.env.CACHE_TTL_LIVE || "15000", 10); // 15 seconds
const MAX_CACHE_ENTRIES = parseInt(process.env.MAX_CACHE_ENTRIES || "100", 10);
const REQUEST_TIMEOUT = parseInt(process.env.API_TIMEOUT || "8000", 10); // 8 seconds timeout

// Request rate limiting
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || "60000", 10); // 1 minute
const MAX_REQUESTS_PER_WINDOW = parseInt(process.env.MAX_REQUESTS_PER_WINDOW || "100", 10);
const ENABLE_RATE_LIMITING = (process.env.ENABLE_RATE_LIMITING || "true").toLowerCase() === "true";

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

function getCacheKey(sport) {
  return `live-${sport}`;
}

function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_TTL;
}

function checkRateLimit(ip) {
  if (!ENABLE_RATE_LIMITING) return true;

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const requests = requestCounts.get(ip).filter(t => t > windowStart);
  
  if (requests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  requests.push(now);
  requestCounts.set(ip, requests);
  return true;
}

async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
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

async function fetchEspnMatches(sportFeed = "soccer/eng.1") {
  try {
    const url = `${ESPN_BASE}/${sportFeed}/events?limit=50&status=in,upcoming`;
    const response = await fetchWithTimeout(url, {
      headers: { 
        "User-Agent": "LiveScoreFree-Bot/2.0",
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);
    
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error("[API/live] ESPN fetch error:", error.message);
    return [];
  }
}

async function fetchSportsDbMatches(league = "133602") {
  try {
    const url = `${SPORTSDB_BASE}/eventslast.php?id=${league}`;
    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "LiveScoreFree-Bot/2.0",
        "Accept": "application/json"
      }
    });
    
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

function pruneCache() {
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

export default async function handler(req, res) {
  const startTime = Date.now();
  const cacheSeconds = Math.max(1, Math.floor(CACHE_TTL / 1000));

  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`);
  res.setHeader("X-API-Version", API_VERSION);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    res.setHeader("Retry-After", Math.ceil(RATE_LIMIT_WINDOW / 1000).toString());
    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      message: "Too many requests. Please wait a moment.",
      version: API_VERSION
    });
  }

  const sport = (req.query.sport || "football").toLowerCase();
  const sportFeed = SPORT_FEEDS[sport] || SPORT_FEEDS.default;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200); // Cap at 200
  const cacheKey = getCacheKey(sport);

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(200).json({
      success: true,
      data: cached.data,
      cached: true,
      cacheAge: Date.now() - cached.timestamp,
      timestamp: cached.timestamp,
      count: cached.data.length,
      version: API_VERSION
    });
  }

  try {
    // Fetch from ESPN first
    const espnMatches = await fetchEspnMatches(sportFeed);
    let normalizedMatches = espnMatches.map(normalizeMatch);

    // If ESPN feed is empty, fallback to SportsDB
    if (!normalizedMatches.length) {
      const sportsDbMatches = await fetchSportsDbMatches();
      normalizedMatches = sportsDbMatches.map(normalizeMatch);
    }

    normalizedMatches = normalizedMatches.slice(0, limit);

    // Store in cache
    cache.set(cacheKey, {
      data: normalizedMatches,
      timestamp: Date.now()
    });
    
    pruneCache();

    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(200).json({
      success: true,
      data: normalizedMatches,
      cached: false,
      timestamp: Date.now(),
      count: normalizedMatches.length,
      version: API_VERSION
    });
  } catch (error) {
    if (LOG_LEVEL !== "silent") {
      console.error("[API/live] Request error:", error);
    }
    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch live matches",
      timestamp: Date.now()
    });
  }
}
