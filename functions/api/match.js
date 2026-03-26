import {
  buildFallbackUrls,
  buildFeedMeta,
  FALLBACK_LOGO,
  SPORT_LEAGUES,
  fetchWithFallback,
  getDefaultLeague,
  jsonResponse,
  mapStatus,
  normalizeLeagueParam,
  normalizeScoreboardEvent,
  normalizeSportParam,
  parseDateRange,
  siteApiUrl
} from "./_shared.js";

function buildInternalApiUrl(request, path, params = {}) {
  const url = new URL(path, request.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function fetchInternalJson(request, path, params = {}) {
  const response = await fetch(buildInternalApiUrl(request, path, params), {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Internal request failed: ${response.status} for ${path}`);
  }

  return response.json();
}

async function fetchExternalJson(sport, league, resource, query = {}) {
  const response = await fetchWithFallback(buildFallbackUrls(sport, league, resource, query), {}, 5000);
  return response.json();
}

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
    .slice(-50) // Increased from 40 to 50 for more history
    .reverse()
    .map((play) => {
      const text = play.text || play.athletesInvolved?.[0]?.displayName || "";
      const type = (play.type?.text || play.type?.name || "").toLowerCase();
      const teamId = play.team?.id || "";
      let side = "neutral";
      if (teamId === homeId) side = "home";
      if (teamId === awayId) side = "away";

      // Enhanced event typing
      let eventType = "event";
      if (type.includes("goal") || type.includes("score")) eventType = "goal";
      else if (type.includes("yellow") || type.includes("caution")) eventType = "yellow-card";
      else if (type.includes("red") || type.includes("ejection")) eventType = "red-card";
      else if (type.includes("sub") || type.includes("replace")) eventType = "substitution";
      else if (type.includes("shot") || type.includes("attempt")) eventType = "shot";
      else if (type.includes("foul") || type.includes("penalty")) eventType = "foul";
      else if (type.includes("corner")) eventType = "corner";
      else if (type.includes("var") || type.includes("review")) eventType = "var";

      return {
        time: play.clock?.displayValue || play.clock?.value || "0'",
        type: eventType,
        text: text, // Keep original text
        player: play.athletesInvolved?.[0]?.displayName || "",
        side,
        score: play.homeScore !== undefined ? `${play.homeScore} - ${play.awayScore}` : null
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
    commentary: (data.commentary || []).map((entry) => ({
      time: entry.time || entry.clock?.displayValue || "",
      text: entry.text || "",
      type: entry.type?.text || "commentary"
    })).concat((data.news || []).map(n => ({ text: n.headline, type: "news" }))), // Merge news and commentary
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

function normalizeFeedFallbackSummary(match = {}) {
  return {
    id: match.id || "",
    sport: match.sport || "soccer",
    leagueSlug: match.leagueSlug || "eng.1",
    league: match.league || (match.leagueSlug || "MATCH").toUpperCase(),
    status: match.status || "upcoming",
    statusText: match.statusText || "",
    time: match.time || "",
    date: match.date || "",
    venue: match.venue || "",
    broadcast: match.broadcast || "",
    homeTeam: {
      ...(match.homeTeam || {}),
      name: match.homeTeam?.name || "Home Team",
      logo: match.homeTeam?.logo || FALLBACK_LOGO,
      score: match.homeTeam?.score || "0",
      lineup: []
    },
    awayTeam: {
      ...(match.awayTeam || {}),
      name: match.awayTeam?.name || "Away Team",
      logo: match.awayTeam?.logo || FALLBACK_LOGO,
      score: match.awayTeam?.score || "0",
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

async function findFeedFallback(request, id, sport, league) {
  const normalizedSport = normalizeSportParam(sport, league);
  const normalizedLeague = normalizeLeagueParam(league, normalizedSport);
  const candidates = [];
  const pushCandidate = (path, params = {}) => {
    const key = `${path}:${JSON.stringify(params)}`;
    if (candidates.some((candidate) => candidate.key === key)) return;
    candidates.push({ key, path, params });
  };

  pushCandidate("/api/live", { sport: normalizedSport, league: normalizedLeague });
  pushCandidate("/api/live", { sport: normalizedSport });
  pushCandidate("/api/upcoming", { sport: normalizedSport, league: normalizedLeague, days: 7 });
  pushCandidate("/api/upcoming", { sport: normalizedSport, days: 7 });
  pushCandidate("/api/live", { sport: "all" });
  pushCandidate("/api/upcoming", { sport: "all", days: 7 });

  for (const candidate of candidates) {
    try {
      const data = await fetchInternalJson(request, candidate.path, candidate.params);
      const match = (data.matches || []).find((entry) => String(entry.id) === String(id));
      if (match) {
        return normalizeFeedFallbackSummary(match);
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

async function findScoreboardFallback(id, sport, league) {
  const candidates = buildScoreboardCandidates(sport, league);
  for (const candidate of candidates) {
    try {
      const data = await fetchExternalJson(candidate.sport, candidate.league, "scoreboard", { dates: candidate.date, limit: 100 });
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
    return jsonResponse({ notFound: true, meta: buildFeedMeta({ degraded: true }) }, 30, 404);
  }

  try {
    let summaryData = null;
    for (const candidate of buildSummaryCandidates(id, sport, league)) {
      try {
        const candidateUrl = new URL(candidate);
        const pathMatch = candidateUrl.pathname.match(/\/sports\/([^/]+)\/([^/]+)\/summary$/);
        if (!pathMatch) continue;
        const [, candidateSport, candidateLeague] = pathMatch;
        const eventId = candidateUrl.searchParams.get("event") || id;
        summaryData = await fetchExternalJson(candidateSport, candidateLeague, "summary", { event: eventId });
        if (summaryData?.header?.competitions?.length) break;
      } catch (error) {
        summaryData = null;
      }
    }

    if (!summaryData?.header?.competitions?.length) {
      const feedFallback = await findFeedFallback(request, id, sport, league);
      if (feedFallback) {
        return jsonResponse({ ...feedFallback, meta: buildFeedMeta({ fallback: "feed" }) }, 15);
      }

      const fallback = await findScoreboardFallback(id, sport, league);
      if (!fallback) {
        return jsonResponse({ notFound: true, meta: buildFeedMeta({ degraded: true }) }, 30, 404);
      }
      return jsonResponse({ ...fallback, meta: buildFeedMeta() }, 15);
    }

    return jsonResponse({ ...normalizeSummary(summaryData, sport, league), meta: buildFeedMeta() }, 15);
  } catch (error) {
    return jsonResponse({ error: error.message, meta: buildFeedMeta({ degraded: true }) }, 15, 500);
  }
}
