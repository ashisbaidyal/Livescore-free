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

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123";

// Cache with TTL
const cache = new Map();
const CACHE_TTL = 15000; // 15 seconds
const MAX_CACHE_ENTRIES = 100;
const REQUEST_TIMEOUT = 8000; // 8 seconds timeout

// Request rate limiting
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

function getCacheKey(sport) {
  return `live-${sport}`;
}

function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_TTL;
}

function checkRateLimit(ip) {
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

async function fetchEspnMatches(sport = "soccer/eng.1") {
  try {
    const url = `${ESPN_BASE}/${sport}/events?limit=50&status=in,upcoming`;
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
    const response = await fetchWithTimeout(url);
    
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

function pruneCache() {
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");
  res.setHeader("X-API-Version", "2.0");
  res.setHeader("X-Response-Time", Date.now().toString());

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      message: "Too many requests. Please wait a moment."
    });
  }

  const sport = req.query.sport || "football";
  const limit = Math.min(parseInt(req.query.limit) || 50, 200); // Cap at 200
  const cacheKey = getCacheKey(sport);

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return res.status(200).json({
      success: true,
      data: cached.data,
      cached: true,
      cacheAge: Date.now() - cached.timestamp,
      timestamp: cached.timestamp,
      count: cached.data.length
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
    
    pruneCache();

    return res.status(200).json({
      success: true,
      data: normalizedMatches,
      cached: false,
      timestamp: Date.now(),
      count: normalizedMatches.length,
      version: "2.0"
    });
  } catch (error) {
    console.error("[API/live] Request error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch live matches",
      timestamp: Date.now()
    });
  }
}
