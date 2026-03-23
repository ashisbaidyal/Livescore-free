import {
  SPORT_LEAGUES,
  dedupeById,
  fetchJson,
  getTargetSports,
  jsonResponse,
  normalizeLeagueParam,
  normalizeScoreboardEvent,
  normalizeSportParam,
  parseDateRange,
  siteApiUrl
} from "./_shared.js";

const UPCOMING_SPORT_LIMITS = {
  soccer: 5,
  basketball: 3,
  football: 3,
  hockey: 2,
  baseball: 2,
  cricket: 2,
  tennis: 2,
  mma: 2,
  racing: 2,
  golf: 2,
  rugby: 1
};

function buildUpcomingEndpoints(sportParam, leagueParam, daysAhead) {
  const normalizedLeague = normalizeLeagueParam(leagueParam);
  const dates = parseDateRange(daysAhead);

  if (normalizedLeague) {
    const sport = normalizeSportParam(sportParam, normalizedLeague);
    return dates.map((date) => ({ sport, league: normalizedLeague, date }));
  }

  const targetSports = getTargetSports(sportParam, leagueParam);
  if (sportParam === "all") {
    return targetSports.flatMap((sport) =>
      (SPORT_LEAGUES[sport] || [])
        .slice(0, UPCOMING_SPORT_LIMITS[sport] || 1)
        .flatMap((league) => dates.slice(0, Math.min(daysAhead + 1, sport === "soccer" ? 4 : 2)).map((date) => ({ sport, league, date })))
    );
  }

  return targetSports.flatMap((sport) =>
    (SPORT_LEAGUES[sport] || [normalizeLeagueParam("", sport)])
      .slice(0, UPCOMING_SPORT_LIMITS[sport] || 3)
      .flatMap((league) => dates.slice(0, Math.min(daysAhead + 1, 6)).map((date) => ({ sport, league, date })))
  );
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sportParam = String(url.searchParams.get("sport") || url.searchParams.get("s") || "all").toLowerCase();
  const leagueParam = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const parsedDays = parseInt(url.searchParams.get("days") || "7", 10);
  const daysAhead = Math.max(1, Math.min(Number.isFinite(parsedDays) ? parsedDays : 7, 10));

  try {
    const endpoints = buildUpcomingEndpoints(sportParam, leagueParam, daysAhead).slice(0, 70);
    const results = await Promise.all(
      endpoints.map(async ({ sport, league, date }) => {
        try {
          const data = await fetchJson(siteApiUrl(sport, league, "scoreboard", { dates: date, limit: 50 }));
          const leagueName = data.leagues?.[0]?.name || league.toUpperCase();
          return (data.events || [])
            .map((event) => normalizeScoreboardEvent(event, sport, league, leagueName))
            .filter((match) => match.status === "upcoming");
        } catch (error) {
          return [];
        }
      })
    );

    const matches = dedupeById(results.flat()).sort((left, right) => new Date(left.date) - new Date(right.date));

    return jsonResponse(
      {
        matches,
        meta: {
          sport: sportParam,
          league: normalizeLeagueParam(leagueParam),
          daysAhead,
          endpoints: endpoints.length
        }
      },
      90
    );
  } catch (error) {
    return jsonResponse({ error: error.message, matches: [] }, 30, 500);
  }
}
