/**
 * /api/timeline.js
 * Endpoint: GET /api/timeline?match=id
 * Returns: Match timeline events (goals, yellow cards, red cards, substitutions)
 * Caching: 10 seconds
 */

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123";

const cache = new Map();
const CACHE_TTL = 10000; // 10 seconds

async function fetchEspnTimeline(matchId) {
  try {
    const url = `${ESPN_BASE}/soccer/eng.1/events/${matchId}`;
    const response = await fetch(url, {
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
    const response = await fetch(url);

    if (!response.ok) throw new Error(`SportsDB API error: ${response.status}`);

    const data = await response.json();
    return extractSportsDbTimeline(data);
  } catch (error) {
    console.error("SportsDB timeline fetch error:", error);
    return [];
  }
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
            player: event.athlète?.displayName || "",
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=20");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { match: matchId } = req.query;

  if (!matchId) {
    return res.status(400).json({
      success: false,
      error: "Missing match parameter"
    });
  }

  const cacheKey = `timeline-${matchId}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json({
      success: true,
      data: cached.data,
      cached: true,
      timestamp: cached.timestamp
    });
  }

  try {
    const timeline = await fetchEspnTimeline(matchId);

    cache.set(cacheKey, {
      data: timeline,
      timestamp: Date.now()
    });

    return res.status(200).json({
      success: true,
      data: timeline,
      cached: false,
      matchId,
      eventCount: timeline.length
    });
  } catch (error) {
    console.error("Timeline API error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch timeline"
    });
  }
}
