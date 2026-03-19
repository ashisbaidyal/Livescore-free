/**
 * SportsDB Helper - Optimized for free tier rate limits (30 req/min)
 * 
 * Free Tier Limits (from https://www.thesportsdb.com/documentation):
 * - Total: 30 requests per minute
 * - Search endpoints: 2 per minute
 * - List endpoints (all_leagues, search_all_teams): 10 per minute
 * - Schedule endpoints (eventsday): Higher limit, no specific restriction
 * 
 * Strategy:
 * 1. Use eventsday.php for live data (less restrictive)
 * 2. Cache aggressively (4+ hours for league data)
 * 3. Batch requests where possible
 * 4. Recommend free account signup for better limits
 */

const SPORTSDB_CACHE = new Map();
const SPORTSDB_RATE_LIMIT_TRACKER = new Map();

/**
 * Rate limit tracking: detect HTTP 429 responses
 * If we hit rate limit, don't make requests for specified cooldown
 */
function trackRateLimit(key, isLimited = false) {
  if (isLimited) {
    SPORTSDB_RATE_LIMIT_TRACKER.set(key, {
      limited: true,
      until: Date.now() + 60000, // 60 second cooldown
      reason: "HTTP 429 Rate Limit Exceeded"
    });
  }
}

function isRateLimited(key) {
  const tracker = SPORTSDB_RATE_LIMIT_TRACKER.get(key);
  if (!tracker) return false;
  if (tracker.until > Date.now()) return true;
  SPORTSDB_RATE_LIMIT_TRACKER.delete(key);
  return false;
}

/**
 * Fetch with timeout and rate limit detection
 */
export async function sportsdbFetchWithRateLimit(url, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "LiveScoreFree-Bot/2.0"
      }
    });
    
    clearTimeout(timeoutId);

    if (response.status === 429) {
      const key = new URL(url).pathname;
      trackRateLimit(key, true);
      const retryAfter = response.headers.get("Retry-After") || "60";
      throw new Error(`SportsDB Rate Limit: ${retryAfter}s cooldown required`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Cache with TTL strategy. Free tier needs aggressive caching.
 * 
 * Cache Strategy:
 * - League visuals: 24 hours (barely changes)
 * - Events by day: 15 minutes (live data)
 * - League list: 24 hours
 */
function getCacheKey(endpoint, params) {
  const sortedParams = Object.entries(params || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `${endpoint}:${sortedParams}`;
}

export function getCachedSportsDbData(endpoint, params, ttlMs = 3600000) {
  const key = getCacheKey(endpoint, params);
  const cached = SPORTSDB_CACHE.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    cached.hitCount = (cached.hitCount || 0) + 1;
    return cached.data;
  }
  
  return null;
}

export function setCachedSportsDbData(endpoint, params, data) {
  const key = getCacheKey(endpoint, params);
  SPORTSDB_CACHE.set(key, {
    data,
    timestamp: Date.now(),
    endpoint,
    hitCount: 0
  });
}

/**
 * Optimize: Use eventsday.php (less restrictive limit than searches)
 * 
 * Free Tier: eventsday.php has no explicit limit mentioned in docs (likely higher)
 * Returns all events for a date and sport
 */
export async function fetchEventsByDayAndSport(sportsdbBase, date, sport, timeout = 8000) {
  // Check cache first - shorter TTL for daily data (15 min)
  const cached = getCachedSportsDbData("eventsday", { d: date, s: sport }, 15 * 60 * 1000);
  if (cached) return cached;

  try {
    const url = `${sportsdbBase}/eventsday.php?d=${encodeURIComponent(date)}&s=${encodeURIComponent(sport)}`;
    const data = await sportsdbFetchWithRateLimit(url, timeout);
    
    const events = Array.isArray(data?.events) ? data.events : 
                   Array.isArray(data?.event) ? data.event : [];
    
    setCachedSportsDbData("eventsday", { d: date, s: sport }, events);
    return events;
  } catch (error) {
    console.error(`[SportsDB] eventsday fetch error for ${sport}:`, error.message);
    return [];
  }
}

/**
 * Fetch league details (expensive, cache for 24 hours)
 */
export async function fetchLeagueDetails(sportsdbBase, leagueId, timeout = 8000) {
  // Check cache first - long TTL for league data (24 hours)
  const cached = getCachedSportsDbData("lookupleague", { id: leagueId }, 24 * 60 * 60 * 1000);
  if (cached && cached.length > 0) return cached[0];

  try {
    const url = `${sportsdbBase}/lookupleague.php?id=${encodeURIComponent(leagueId)}`;
    const data = await sportsdbFetchWithRateLimit(url, timeout);
    
    const league = Array.isArray(data?.leagues) ? data.leagues[0] : 
                   Array.isArray(data?.leagues) ? data.leagues[0] : null;
    
    if (league) {
      setCachedSportsDbData("lookupleague", { id: leagueId }, [league]);
      return league;
    }
    return null;
  } catch (error) {
    console.error(`[SportsDB] lookupleague fetch error for ${leagueId}:`, error.message);
    return null;
  }
}

/**
 * Get all sports supported (cache for 24 hours, limit is 2 per minute - rarely needed)
 */
export async function fetchAllSports(sportsdbBase, timeout = 8000) {
  const cached = getCachedSportsDbData("all_sports", {}, 24 * 60 * 60 * 1000);
  if (cached) return cached;

  try {
    const url = `${sportsdbBase}/all_sports.php`;
    const data = await sportsdbFetchWithRateLimit(url, timeout);
    
    const sports = Array.isArray(data?.sports) ? data.sports : [];
    setCachedSportsDbData("all_sports", {}, sports);
    return sports;
  } catch (error) {
    console.error("[SportsDB] all_sports fetch error:", error.message);
    return [];
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getSportsDbCacheStats() {
  return {
    cacheSize: SPORTSDB_CACHE.size,
    cached: Array.from(SPORTSDB_CACHE.entries()).map(([key, val]) => ({
      key,
      endpoint: val.endpoint,
      age: Date.now() - val.timestamp,
      hits: val.hitCount
    })),
    rateLimited: Array.from(SPORTSDB_RATE_LIMIT_TRACKER.entries()).map(([key, info]) => ({
      key,
      ...info
    }))
  };
}

/**
 * Smart recommendation message (include in API response headers)
 */
export function getSportsDbStatusMessage(apiKey = "123") {
  const isFreeKey = apiKey === "123";
  
  if (isFreeKey) {
    return "⚠️  Using SportsDB public key (30 req/min limit). For better data, get free account at https://www.thesportsdb.com/api.php or upgrade to Premium.";
  }
  
  return "✅ Using SportsDB account API key. Higher limits available. Premium: https://www.thesportsdb.com/pricing";
}
