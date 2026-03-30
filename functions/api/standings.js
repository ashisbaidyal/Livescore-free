import {
  buildFeedMeta,
  fetchLeagueStandings,
  jsonResponse,
  normalizeLeagueParam,
  normalizeStandingsEntries,
  normalizeSportParam,
  SPORT_LEAGUES,
  isIplLeague,
  fetchJson,
  getIplStandingsUrl
} from "./_shared.js";

function getLeaguePairs(sport, league, limit = 4) {
  if (league) return [{ sport, league }];
  if (sport === "all") {
    return [
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "esp.1" },
      { sport: "soccer", league: "ger.1" },
      { sport: "soccer", league: "ita.1" },
      { sport: "soccer", league: "fra.1" },
      { sport: "soccer", league: "uefa.champions" },
      { sport: "basketball", league: "nba" },
      { sport: "football", league: "nfl" },
      { sport: "hockey", league: "nhl" },
      { sport: "baseball", league: "mlb" },
      { sport: "cricket", league: "ipl" }
    ];
  }
  return (SPORT_LEAGUES[sport] || []).slice(0, limit).map((slug) => ({ sport, league: slug }));
}

function aliasIplStandingEntry(entry = {}) {
  const stats = Array.isArray(entry.stats) ? [...entry.stats] : [];
  const existingNames = new Set(stats.map((s) => String(s?.name || "").toLowerCase()));
  const aliases = [
    ["matchesPlayed", ["gamesplayed", "games_played"]],
    ["matchesWon", ["wins", "winsoverall"]],
    ["matchesLost", ["losses", "loss"]],
    ["matchPoints", ["points"]],
    ["netrr", ["netrunrate", "nrr"]]
  ];
  aliases.forEach(([src, targets]) => {
    const source = stats.find((s) => String(s?.name || "").toLowerCase() === src.toLowerCase());
    if (!source) return;
    targets.forEach((alias) => {
      if (existingNames.has(alias)) return;
      stats.push({ ...source, name: alias });
      existingNames.add(alias);
    });
  });
  return { ...entry, stats };
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
      const data = await fetchJson(getIplStandingsUrl());
      const entries = normalizeStandingsEntries(data).map(aliasIplStandingEntry);
      return jsonResponse({
        standings: data.standings,
        children: data.children,
        entries,
        meta: buildFeedMeta({ type: "standings", sport, league })
      }, 300);
    }

    if (league) {
      const data = await fetchLeagueStandings(sport, league);
      return jsonResponse({
        standings: data.standings,
        children: data.children,
        entries: normalizeStandingsEntries(data),
        meta: buildFeedMeta({ type: "standings", sport, league })
      }, 300);
    }

    const pairs = getLeaguePairs(sport, league, 6);
    const results = await Promise.all(
      pairs.map(async ({ sport: s, league: l }) => {
        try {
          if (isIplLeague(s, l)) {
            const data = await fetchJson(getIplStandingsUrl());
            return {
              sport: s,
              league: l,
              entries: normalizeStandingsEntries(data).map(aliasIplStandingEntry)
            };
          }
          const data = await fetchLeagueStandings(s, l);
          return {
            sport: s,
            league: l,
            entries: normalizeStandingsEntries(data)
          };
        } catch {
          return { sport: s, league: l, entries: [] };
        }
      })
    );

    return jsonResponse({
      leagues: results.filter((r) => r.entries.length > 0),
      meta: buildFeedMeta({ type: "standings", sport, league, feeds: pairs.length })
    }, 300);
  } catch (error) {
    return jsonResponse({
      error: error.message,
      standings: [],
      entries: [],
      leagues: [],
      meta: buildFeedMeta({ degraded: true, type: "standings", sport, league })
    }, 30, 500);
  }
}
