import {
  buildFeedMeta,
  dedupeById,
  fetchJson,
  jsonResponse,
  normalizeLeagueParam,
  normalizeSportParam,
  normalizeTeamEntry,
  siteApiUrl,
  SPORT_LEAGUES,
  isIplLeague,
  normalizeScoreboardEvent,
  normalizeStandingsEntries,
  getIplScoreboardUrl,
  getIplStandingsUrl
} from "./_shared.js";

function getLeaguePairs(sport, league, limit = 4) {
  if (league) return [{ sport, league }];
  if (sport === "all") {
    return [
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "esp.1" },
      { sport: "basketball", league: "nba" },
      { sport: "football", league: "nfl" },
      { sport: "hockey", league: "nhl" },
      { sport: "baseball", league: "mlb" },
      { sport: "cricket", league: "ipl" }
    ];
  }
  return (SPORT_LEAGUES[sport] || []).slice(0, limit).map((slug) => ({ sport, league: slug }));
}

async function getIplTeams() {
  const [scoreboard, standingsData] = await Promise.all([
    fetchJson(getIplScoreboardUrl()),
    fetchJson(getIplStandingsUrl()).catch(() => ({ children: [], standings: [] }))
  ]);
  const entries = normalizeStandingsEntries(standingsData);
  const standingsMap = new Map(
    entries.filter((e) => e?.team?.id).map((e) => [String(e.team.id), e])
  );
  const matches = (scoreboard.events || []).map((event) =>
    normalizeScoreboardEvent(event, "cricket", "ipl", scoreboard.leagues?.[0]?.name || "IPL")
  );
  return dedupeById((scoreboard.teams || []).map((t) => normalizeTeamEntry(t, "cricket", "ipl"))).map((team) => {
    const standing = standingsMap.get(String(team.id));
    const schedule = matches.filter(
      (m) => String(m.homeTeam?.id) === String(team.id) || String(m.awayTeam?.id) === String(team.id)
    );
    return {
      ...team,
      venue: schedule.find((m) => m.status === "upcoming")?.venue || team.venue || "",
      record: standing ? `${standing.stats?.find((s) => s.name?.toLowerCase() === "matchesplayed")?.displayValue || "0"} Mat` : team.record || "",
      sport: "cricket",
      league: "ipl"
    };
  });
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const inputSport = url.searchParams.get("sport") || url.searchParams.get("s") || "soccer";
  const inputLeague = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const sport = normalizeSportParam(inputSport, inputLeague);
  const league = inputLeague
    ? normalizeLeagueParam(inputLeague, sport)
    : sport === "all" ? "" : normalizeLeagueParam("", sport);

  try {
    if (isIplLeague(sport, league)) {
      return jsonResponse({
        teams: await getIplTeams(),
        meta: buildFeedMeta({ type: "teams", sport, league })
      }, 300);
    }

    const pairs = getLeaguePairs(sport, league, sport === "all" ? 8 : 3);
    const results = await Promise.all(
      pairs.map(async ({ sport: s, league: l }) => {
        try {
          if (isIplLeague(s, l)) return getIplTeams();
          const data = await fetchJson(siteApiUrl(s, l, "teams"));
          const rawTeams = data.sports?.[0]?.leagues?.[0]?.teams || data.teams || [];
          return rawTeams.map((entry) => normalizeTeamEntry(entry, s, l));
        } catch {
          return [];
        }
      })
    );

    return jsonResponse({
      teams: dedupeById(results.flat()),
      meta: buildFeedMeta({ type: "teams", sport, league, feeds: pairs.length })
    }, 300);
  } catch (error) {
    return jsonResponse({
      teams: [],
      error: error.message,
      meta: buildFeedMeta({ degraded: true, type: "teams", sport, league })
    }, 30, 500);
  }
}
