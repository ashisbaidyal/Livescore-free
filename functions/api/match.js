import {
  FALLBACK_LOGO,
  SPORT_LEAGUES,
  fetchJson,
  getDefaultLeague,
  jsonResponse,
  mapStatus,
  normalizeLeagueParam,
  normalizeScoreboardEvent,
  normalizeSportParam,
  parseDateRange,
  siteApiUrl
} from "./_shared.js";

function buildSummaryCandidates(id, sport, league) {
  const normalizedSport = normalizeSportParam(sport, league);
  const normalizedLeague = normalizeLeagueParam(league, normalizedSport);

  const candidates = [];
  const pushCandidate = (candidateSport, candidateLeague) => {
    if (!candidateSport || !candidateLeague) return;
    if (candidates.some((entry) => entry.sport === candidateSport && entry.league === candidateLeague)) return;
    candidates.push({ sport: candidateSport, league: candidateLeague });
  };

  pushCandidate(normalizedSport, normalizedLeague);
  (SPORT_LEAGUES[normalizedSport] || []).slice(0, 6).forEach((candidateLeague) => pushCandidate(normalizedSport, candidateLeague));
  pushCandidate("soccer", "eng.1");
  pushCandidate("soccer", "esp.1");
  pushCandidate("basketball", "nba");
  pushCandidate("football", "nfl");

  return candidates.map(({ sport: candidateSport, league: candidateLeague }) =>
    siteApiUrl(candidateSport, candidateLeague, "summary", { event: id })
  );
}

function buildScoreboardCandidates(sport, league) {
  const normalizedSport = normalizeSportParam(sport, league);
  const normalizedLeague = normalizeLeagueParam(league, normalizedSport);
  const candidates = [];
  const dates = parseDateRange(6);
  const pushPair = (candidateSport, candidateLeague) => {
    if (!candidateSport || !candidateLeague) return;
    if (candidates.some((entry) => entry.sport === candidateSport && entry.league === candidateLeague)) return;
    candidates.push({ sport: candidateSport, league: candidateLeague });
  };

  pushPair(normalizedSport, normalizedLeague);
  (SPORT_LEAGUES[normalizedSport] || []).slice(0, 4).forEach((candidateLeague) => pushPair(normalizedSport, candidateLeague));
  pushPair("soccer", "eng.1");
  pushPair("basketball", "nba");
  pushPair("football", "nfl");

  return candidates.flatMap(({ sport: candidateSport, league: candidateLeague }) =>
    dates.map((date) => ({ sport: candidateSport, league: candidateLeague, date }))
  );
}

function normalizeStats(data = {}) {
  const stats = [];
  const boxscoreTeams = data.boxscore?.teams || [];
  const homeStats = boxscoreTeams.find((team) => team.homeAway === "home")?.statistics || [];
  const awayStats = boxscoreTeams.find((team) => team.homeAway === "away")?.statistics || [];

  homeStats.forEach((homeStat) => {
    const awayStat = awayStats.find((entry) => entry.name === homeStat.name);
    stats.push({
      label: homeStat.label,
      home: homeStat.displayValue,
      away: awayStat?.displayValue || "0"
    });
  });

  return stats;
}

function normalizeLineup(data = {}, side = "home") {
  const roster = data.rosters?.find((entry) => entry.homeAway === side);
  if (!roster?.roster) return [];

  return roster.roster.map((entry) => ({
    name: entry.athlete?.displayName || "",
    number: entry.jersey || "",
    position: entry.position?.abbreviation || "",
    starter: Boolean(entry.starter),
    face: entry.athlete?.headshot?.href || FALLBACK_LOGO
  }));
}

function normalizeTimeline(data = {}, homeId = "", awayId = "") {
  const plays = data.plays || data.header?.competitions?.[0]?.details || [];
  return (plays || [])
    .slice(-40)
    .reverse()
    .map((play) => {
      const text = play.text || play.athletesInvolved?.[0]?.displayName || "";
      const type = (play.type?.text || play.type?.name || "").toLowerCase();
      const teamId = play.team?.id || "";
      let side = "neutral";
      if (teamId === homeId) side = "home";
      if (teamId === awayId) side = "away";

      return {
        time: play.clock?.displayValue || play.clock?.value || "0'",
        type: type.includes("goal")
          ? "goal"
          : type.includes("card")
            ? "card"
            : type.includes("sub")
              ? "substitution"
              : "event",
        player: text,
        side
      };
    });
}

function normalizeOdds(data = {}) {
  const odds = data.pickcenter?.[0] || null;
  if (!odds) return null;

  return {
    details: odds.details || "Match Odds",
    homeOdds: odds.homeTeamOdds?.moneyLine || odds.homeTeamOdds?.current?.moneyLine || "-",
    awayOdds: odds.awayTeamOdds?.moneyLine || odds.awayTeamOdds?.current?.moneyLine || "-",
    drawOdds: odds.drawOdds?.moneyLine || odds.drawOdds?.current?.moneyLine || null
  };
}

function normalizeSummary(data = {}, fallbackSport = "soccer", fallbackLeague = "eng.1") {
  const header = data.header || {};
  const competition = header.competitions?.[0] || {};
  const home = competition.competitors?.find((entry) => entry.homeAway === "home") || {};
  const away = competition.competitors?.find((entry) => entry.homeAway === "away") || {};
  const statusType = competition.status?.type || {};

  return {
    id: header.id || competition.id || "",
    sport: fallbackSport,
    leagueSlug: fallbackLeague,
    league: data.leagues?.[0]?.name || header.league?.name || fallbackLeague.toUpperCase(),
    status: mapStatus(statusType.state),
    statusText: statusType.detail || statusType.description || statusType.shortDetail || "",
    time: statusType.shortDetail || statusType.detail || "",
    date: header.competitions?.[0]?.date || header.season?.type?.name || "",
    venue: competition.venue?.fullName || "",
    broadcast: competition.broadcasts?.map((entry) => entry.media?.shortName || entry.names?.join(", ")).filter(Boolean).join(", "),
    homeTeam: {
      id: home.team?.id || "",
      name: home.team?.displayName || home.team?.name || "Home Team",
      abbreviation: home.team?.abbreviation || "",
      logo: home.team?.logos?.[0]?.href || home.team?.logo || FALLBACK_LOGO,
      score: home.score || "0",
      lineup: normalizeLineup(data, "home")
    },
    awayTeam: {
      id: away.team?.id || "",
      name: away.team?.displayName || away.team?.name || "Away Team",
      abbreviation: away.team?.abbreviation || "",
      logo: away.team?.logos?.[0]?.href || away.team?.logo || FALLBACK_LOGO,
      score: away.score || "0",
      lineup: normalizeLineup(data, "away")
    },
    stats: normalizeStats(data),
    timeline: normalizeTimeline(data, home.team?.id || "", away.team?.id || ""),
    commentary: (data.news || []).map((entry) => entry.headline).filter(Boolean),
    odds: normalizeOdds(data),
    h2h: [],
    situation: data.situation || null
  };
}

function normalizeFallbackScoreboardSummary(event = {}, sport = "soccer", league = "eng.1", leagueName = "") {
  const normalized = normalizeScoreboardEvent(event, sport, league, leagueName);
  return {
    id: normalized.id,
    sport: normalized.sport,
    leagueSlug: normalized.leagueSlug,
    league: normalized.league,
    status: normalized.status,
    statusText: normalized.statusText,
    time: normalized.time,
    date: normalized.date,
    venue: normalized.venue,
    broadcast: normalized.broadcast,
    homeTeam: {
      ...normalized.homeTeam,
      lineup: []
    },
    awayTeam: {
      ...normalized.awayTeam,
      lineup: []
    },
    stats: [],
    timeline: [],
    commentary: [],
    odds: null,
    h2h: [],
    situation: null
  };
}

async function findScoreboardFallback(id, sport, league) {
  const candidates = buildScoreboardCandidates(sport, league);
  for (const candidate of candidates) {
    try {
      const data = await fetchJson(siteApiUrl(candidate.sport, candidate.league, "scoreboard", { dates: candidate.date, limit: 100 }));
      const event = (data.events || []).find((entry) => String(entry.id) === String(id));
      if (event) {
        return normalizeFallbackScoreboardSummary(
          event,
          candidate.sport,
          candidate.league,
          data.leagues?.[0]?.name || candidate.league.toUpperCase()
        );
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const sport = normalizeSportParam(url.searchParams.get("sport") || "soccer", url.searchParams.get("league") || "");
  const league = normalizeLeagueParam(url.searchParams.get("league") || "", sport || getDefaultLeague("soccer"));

  if (!id) {
    return jsonResponse({ notFound: true }, 30, 404);
  }

  try {
    let summaryData = null;
    for (const candidate of buildSummaryCandidates(id, sport, league)) {
      try {
        summaryData = await fetchJson(candidate);
        if (summaryData?.header?.competitions?.length) break;
      } catch (error) {
        summaryData = null;
      }
    }

    if (!summaryData?.header?.competitions?.length) {
      const fallback = await findScoreboardFallback(id, sport, league);
      if (!fallback) {
        return jsonResponse({ notFound: true }, 30, 404);
      }
      return jsonResponse(fallback, 15);
    }

    return jsonResponse(normalizeSummary(summaryData, sport, league), 15);
  } catch (error) {
    return jsonResponse({ error: error.message }, 15, 500);
  }
}
