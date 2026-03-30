import {
  buildFeedMeta,
  dedupeById,
  fetchJson,
  jsonResponse,
  normalizeArticle,
  normalizeLeagueParam,
  normalizeSportParam,
  siteApiUrl,
  SPORT_LEAGUES
} from "./_shared.js";

function getLeaguePairs(sport, league, limit = 6) {
  if (league) return [{ sport, league }];
  if (sport === "all") {
    return [
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "uefa.champions" },
      { sport: "basketball", league: "nba" },
      { sport: "football", league: "nfl" },
      { sport: "hockey", league: "nhl" },
      { sport: "baseball", league: "mlb" },
      { sport: "cricket", league: "ipl" },
      { sport: "tennis", league: "atp" },
      { sport: "mma", league: "ufc" },
      { sport: "racing", league: "f1" },
      { sport: "golf", league: "pga" }
    ];
  }
  return (SPORT_LEAGUES[sport] || []).slice(0, limit).map((slug) => ({ sport, league: slug }));
}

function toTimestamp(value = "") {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const inputSport = url.searchParams.get("sport") || url.searchParams.get("s") || "all";
  const inputLeague = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const sport = normalizeSportParam(inputSport, inputLeague);
  const league = inputLeague
    ? normalizeLeagueParam(inputLeague, sport)
    : sport === "all" ? "" : normalizeLeagueParam("", sport);
  const teamId = url.searchParams.get("team") || "";
  const parsedLimit = parseInt(url.searchParams.get("limit") || "20", 10);
  const limit = Math.max(6, Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 20, 40));

  try {
    const pairs = getLeaguePairs(sport, league, sport === "all" ? 10 : 4);
    const results = await Promise.all(
      pairs.map(async ({ sport: s, league: l }) => {
        try {
          const data = await fetchJson(
            siteApiUrl(s, l, "news", {
              ...(teamId ? { team: teamId } : {}),
              limit: 18
            })
          );
          return (data.articles || []).map((article) => ({
            ...normalizeArticle(article),
            sport: s,
            league: l
          }));
        } catch { return []; }
      })
    );

    const articles = dedupeById(results.flat())
      .sort((a, b) => toTimestamp(b.published) - toTimestamp(a.published))
      .slice(0, limit);

    return jsonResponse({
      articles,
      trending: articles.slice(0, 5),
      latest: articles.slice(0, 10),
      meta: buildFeedMeta({ type: "news", sport, league, feeds: pairs.length })
    }, 300);
  } catch (error) {
    return jsonResponse({
      articles: [],
      trending: [],
      latest: [],
      error: error.message,
      meta: buildFeedMeta({ degraded: true, type: "news", sport, league })
    }, 30, 500);
  }
}
