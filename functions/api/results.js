import {
  buildFeedMeta,
  SPORT_LEAGUES,
  dedupeById,
  fetchJson,
  getTargetSports,
  jsonResponse,
  normalizeLeagueParam,
  normalizeScoreboardEvent,
  normalizeSportParam,
  siteApiUrl
} from "./_shared.js";

const RESULTS_SPORT_LIMITS = {
  soccer: 6,
  basketball: 4,
  football: 4,
  hockey: 3,
  baseball: 3,
  cricket: 2,
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

function parsePastDateRange(daysBack = 4) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i <= daysBack; i += 1) {
    const previous = new Date(now);
    previous.setDate(now.getDate() - i);
    dates.push(
      `${previous.getFullYear()}${String(previous.getMonth() + 1).padStart(2, "0")}${String(previous.getDate()).padStart(2, "0")}`
    );
  }
  return dates;
}

function buildResultsEndpoints(sportParam, leagueParam, daysBack) {
  const normalizedLeague = normalizeLeagueParam(leagueParam);
  const dates = parsePastDateRange(daysBack);

  if (normalizedLeague) {
    const sport = normalizeSportParam(sportParam, normalizedLeague);
    return dates.map((date) => ({ sport, league: normalizedLeague, date }));
  }

  const targetSports = getTargetSports(sportParam, leagueParam);
  if (sportParam === "all") {
    return targetSports.flatMap((sport) =>
      (SPORT_LEAGUES[sport] || [])
        .slice(0, RESULTS_SPORT_LIMITS[sport] || 2)
        .flatMap((league) =>
          dates
            .slice(0, Math.min(daysBack + 1, sport === "soccer" ? 4 : 3))
            .map((date) => ({ sport, league, date }))
        )
    );
  }

  return targetSports.flatMap((sport) =>
    (SPORT_LEAGUES[sport] || [normalizeLeagueParam("", sport)])
      .slice(0, RESULTS_SPORT_LIMITS[sport] || 3)
      .flatMap((league) =>
        dates
          .slice(0, Math.min(daysBack + 1, 5))
          .map((date) => ({ sport, league, date }))
      )
  );
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sportParam = String(url.searchParams.get("sport") || url.searchParams.get("s") || "all").toLowerCase();
  const leagueParam = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const parsedDays = parseInt(url.searchParams.get("days") || "4", 10);
  const daysBack = Math.max(1, Math.min(Number.isFinite(parsedDays) ? parsedDays : 4, 7));

  try {
    const endpoints = buildResultsEndpoints(sportParam, leagueParam, daysBack).slice(0, 96);
    const results = await Promise.all(
      endpoints.map(async ({ sport, league, date }) => {
        try {
          const data = await fetchJson(siteApiUrl(sport, league, "scoreboard", { dates: date, limit: 50 }));
          const leagueName = data.leagues?.[0]?.name || league.toUpperCase();
          return (data.events || [])
            .map((event) => normalizeScoreboardEvent(event, sport, league, leagueName))
            .filter((match) => match.status === "finished");
        } catch (error) {
          return [];
        }
      })
    );

    const matches = dedupeById(results.flat()).sort((left, right) => new Date(right.date) - new Date(left.date));

    return jsonResponse(
      {
        matches,
        meta: {
          sport: sportParam,
          league: normalizeLeagueParam(leagueParam),
          daysBack,
          endpoints: endpoints.length,
          ...buildFeedMeta()
        }
      },
      180
    );
  } catch (error) {
    return jsonResponse(
      {
        error: error.message,
        matches: [],
        meta: buildFeedMeta({ degraded: true })
      },
      30,
      500
    );
  }
}
