import {
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

function buildEndpoints(sportParam, leagueParam) {
  const targetSports = getTargetSports(sportParam, leagueParam);
  const normalizedLeague = normalizeLeagueParam(leagueParam);

  if (normalizedLeague) {
    const sport = normalizeSportParam(sportParam, normalizedLeague);
    return [{ sport, league: normalizedLeague }];
  }

  if (sportParam === "all") {
    return targetSports.flatMap((sport) =>
      (SPORT_LEAGUES[sport] || []).slice(0, sport === "soccer" ? 5 : 2).map((league) => ({ sport, league }))
    );
  }

  return targetSports.flatMap((sport) =>
    (SPORT_LEAGUES[sport] || [normalizeLeagueParam("", sport)]).slice(0, 6).map((league) => ({ sport, league }))
  );
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sportParam = String(url.searchParams.get("sport") || url.searchParams.get("s") || "all").toLowerCase();
  const leagueParam = url.searchParams.get("league") || url.searchParams.get("l") || "";

  try {
    const endpoints = buildEndpoints(sportParam, leagueParam).slice(0, 36);
    const results = await Promise.all(
      endpoints.map(async ({ sport, league }) => {
        try {
          const data = await fetchJson(siteApiUrl(sport, league, "scoreboard", { limit: 50 }));
          const leagueName = data.leagues?.[0]?.name || league.toUpperCase();
          return (data.events || []).map((event) => normalizeScoreboardEvent(event, sport, league, leagueName));
        } catch (error) {
          return [];
        }
      })
    );

    const matches = dedupeById(results.flat()).sort((left, right) => {
      const statusOrder = { live: 0, upcoming: 1, finished: 2 };
      const statusDiff = (statusOrder[left.status] ?? 9) - (statusOrder[right.status] ?? 9);
      if (statusDiff !== 0) return statusDiff;
      return new Date(left.date) - new Date(right.date);
    });

    return jsonResponse(
      {
        matches,
        meta: {
          sport: sportParam,
          league: normalizeLeagueParam(leagueParam),
          endpoints: endpoints.length
        }
      },
      15
    );
  } catch (error) {
    return jsonResponse({ error: error.message, matches: [] }, 15, 500);
  }
}
