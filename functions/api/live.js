import {
  buildFeedMeta,
  checkRateLimit,
  SPORT_LEAGUES,
  calculateTTL,
  dedupeById,
  fetchLeagueScoreboard,
  getTargetSports,
  jsonResponse,
  normalizeLeagueParam,
  normalizeScoreboardEvent,
  normalizeSportParam,
  siteApiUrl
} from "./_shared.js";

const LIVE_SPORT_LIMITS = {
  soccer: 8,
  basketball: 4,
  football: 4,
  hockey: 3,
  baseball: 3,
  cricket: 3,
  tennis: 2,
  mma: 2,
  racing: 2,
  golf: 2,
  rugby: 2,
  "rugby-league": 2,
  volleyball: 2,
  "water-polo": 2,
  lacrosse: 2,
  "field-hockey": 2,
  "australian-football": 2
};

function buildEndpoints(sportParam, leagueParam) {
  const targetSports = getTargetSports(sportParam, leagueParam);
  const normalizedLeague = normalizeLeagueParam(leagueParam);

  if (normalizedLeague) {
    const sport = normalizeSportParam(sportParam, normalizedLeague);
    return [{ sport, league: normalizedLeague }];
  }

  if (sportParam === "all") {
    return targetSports.flatMap((sport) =>
      (SPORT_LEAGUES[sport] || []).slice(0, LIVE_SPORT_LIMITS[sport] || 2).map((league) => ({ sport, league }))
    );
  }

  return targetSports.flatMap((sport) =>
    (SPORT_LEAGUES[sport] || [normalizeLeagueParam("", sport)]).slice(0, LIVE_SPORT_LIMITS[sport] || 4).map((league) => ({ sport, league }))
  );
}

function sortMatches(left, right) {
  const statusOrder = { live: 0, upcoming: 1, finished: 2 };
  const statusDiff = (statusOrder[left.status] ?? 9) - (statusOrder[right.status] ?? 9);
  if (statusDiff !== 0) return statusDiff;

  if (left.status === "finished" && right.status === "finished") {
    return new Date(right.date) - new Date(left.date);
  }

  return new Date(left.date) - new Date(right.date);
}

function isFreshLiveFeedMatch(match = {}, now = new Date()) {
  if (match.status === "live") return true;

  const matchTime = new Date(match.date || "");
  if (Number.isNaN(matchTime.getTime())) return false;

  const hoursFromNow = (matchTime.getTime() - now.getTime()) / 36e5;

  if (match.status === "upcoming") {
    return hoursFromNow >= -6 && hoursFromNow <= 168;
  }

  if (match.status === "finished") {
    return hoursFromNow >= -36 && hoursFromNow <= 1;
  }

  return false;
}

export async function onRequest(context) {
  const { request } = context;
  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  if (!checkRateLimit(clientIp, "live", 120, 60000)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "60" }
    });
  }
  const url = new URL(request.url);
  const sportParam = String(url.searchParams.get("sport") || url.searchParams.get("s") || "all").toLowerCase();
  const leagueParam = url.searchParams.get("league") || url.searchParams.get("l") || "";

  try {
    const endpoints = buildEndpoints(sportParam, leagueParam).slice(0, 64);
    const results = await Promise.all(
      endpoints.map(async ({ sport, league }) => {
        try {
          const data = await fetchLeagueScoreboard(sport, league, { limit: 50 });
          const leagueName = data.leagues?.[0]?.name || league.toUpperCase();
          return (data.events || []).map((event) => normalizeScoreboardEvent(event, sport, league, leagueName));
        } catch (error) {
          return [];
        }
      })
    );

    const allMatches = dedupeById(results.flat());
    const now = new Date();
    const matches = allMatches.filter((match) => isFreshLiveFeedMatch(match, now)).sort(sortMatches);

    // Calculate TTL based on match statuses
    const hasLive = matches.some(m => m.status === "live");
    const { ttl, reason } = calculateTTL(hasLive ? "live" : "upcoming");

    return jsonResponse(
      {
        matches,
        meta: {
          sport: sportParam,
          league: normalizeLeagueParam(leagueParam),
          endpoints: endpoints.length,
          hasLive,
          staleRemoved: Math.max(0, allMatches.length - matches.length),
          ...buildFeedMeta()
        }
      },
      ttl,
      200,
      reason
    );
  } catch (error) {
    return jsonResponse(
      {
        error: error.message,
        matches: [],
        meta: buildFeedMeta({ degraded: true })
      },
      15,
      500,
      "error-fallback"
    );
  }
}
