/**
 * /api/timeline.js
 * Endpoint: GET /api/timeline?match=id
 * Returns: Match timeline events (goals, yellow cards, red cards, substitutions)
 * Caching: 10 seconds
 */

const ESPN_BASE = process.env.ESPN_API_BASE || "https://site.api.espn.com/apis/site/v2/sports";
const SPORTSDB_BASE = process.env.SPORTSDB_API_BASE || "https://www.thesportsdb.com/api/v1/json/123";
const REQUEST_TIMEOUT = parseInt(process.env.API_TIMEOUT || "8000", 10);
const CACHE_TTL = parseInt(process.env.CACHE_TTL_TIMELINE || "10000", 10); // 10 seconds default
const API_VERSION = process.env.API_VERSION || "2.0";

const cache = new Map();

async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchEspnTimeline(matchId) {
  try {
    const url = `${ESPN_BASE}/soccer/eng.1/events/${matchId}`;
    const response = await fetchWithTimeout(url, {
      headers: { "User-Agent": "LiveScoreFree-Bot/1.0" }
    });

    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);

    const data = await response.json();
    return extractTimeline(data);
  } catch (error) {
    console.error("ESPN timeline fetch error:", error);
    return [];
  }
}

async function fetchSportsDbTimeline(eventId) {
  try {
    const url = `${SPORTSDB_BASE}/eventslast.php?id=${eventId}`;
    const response = await fetchWithTimeout(url, {
      headers: { "User-Agent": "LiveScoreFree-Bot/1.0" }
    });

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

  // Parse goals
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

  const { match: matchId } = req.query;

  if (!matchId) {
    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(400).json({
      success: false,
      error: "Missing match parameter",
      version: API_VERSION
    });
  }

  const cacheKey = `timeline-${matchId}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(200).json({
      success: true,
      data: cached.data,
      cached: true,
      timestamp: cached.timestamp,
      version: API_VERSION
    });
  }

  try {
    let timeline = await fetchEspnTimeline(matchId);

    // Fallback to SportsDB if ESPN returns no events
    if (!timeline.length) {
      timeline = await fetchSportsDbTimeline(matchId);
    }

    cache.set(cacheKey, {
      data: timeline,
      timestamp: Date.now()
    });

    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(200).json({
      success: true,
      data: timeline,
      cached: false,
      matchId,
      eventCount: timeline.length,
      version: API_VERSION
    });
  } catch (error) {
    console.error("Timeline API error:", error);
    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch timeline",
      version: API_VERSION
    });
  }
}
