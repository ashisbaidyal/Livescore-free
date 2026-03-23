import {
  SPORT_LEAGUES,
  coreApiUrl,
  dedupeById,
  fetchJson,
  jsonResponse,
  normalizeArticle,
  normalizeAthlete,
  normalizeLeagueParam,
  normalizeScoreboardEvent,
  normalizeSportParam,
  normalizeStandingsEntries,
  normalizeTeamEntry,
  normalizeRosterGroups,
  resolveTeamFromRef,
  siteApiUrl
} from "./_shared.js";

function getLeaguePairs(sport, league, limit = 4) {
  if (league) {
    return [{ sport, league }];
  }

  if (sport === "all") {
    return [
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "esp.1" },
      { sport: "soccer", league: "uefa.champions" },
      { sport: "basketball", league: "nba" },
      { sport: "basketball", league: "wnba" },
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

async function getNormalizedNews(sport, league, teamId = "") {
  const leaguePairs = getLeaguePairs(sport, league, sport === "all" ? 12 : 4);
  const responses = await Promise.all(
    leaguePairs.map(async ({ sport: pairSport, league: pairLeague }) => {
      try {
        const data = await fetchJson(
          siteApiUrl(pairSport, pairLeague, "news", {
            ...(teamId ? { team: teamId } : {}),
            limit: 18
          })
        );
        return (data.articles || []).map(normalizeArticle);
      } catch (error) {
        return [];
      }
    })
  );

  return {
    articles: dedupeById(responses.flat())
      .sort((left, right) => toTimestamp(right.published) - toTimestamp(left.published))
      .slice(0, 40),
    meta: {
      feeds: leaguePairs.length
    }
  };
}

async function getNormalizedStandings(sport, league) {
  const data = await fetchJson(siteApiUrl(sport, league, "standings"));
  return {
    standings: data.standings,
    children: data.children,
    entries: normalizeStandingsEntries(data)
  };
}

async function getNormalizedTeams(sport, league) {
  const leaguePairs = getLeaguePairs(sport, league, sport === "all" ? 8 : 2);
  const responses = await Promise.all(
    leaguePairs.map(async ({ sport: pairSport, league: pairLeague }) => {
      try {
        const data = await fetchJson(siteApiUrl(pairSport, pairLeague, "teams"));
        const rawTeams = data.sports?.[0]?.leagues?.[0]?.teams || data.teams || [];
        return rawTeams.map((entry) => normalizeTeamEntry(entry, pairSport, pairLeague));
      } catch (error) {
        return [];
      }
    })
  );

  return {
    teams: dedupeById(responses.flat()),
    rawTeams: []
  };
}

async function getNormalizedPlayers(sport, league, limit = 16) {
  const athletesList = await fetchJson(coreApiUrl(sport, league, "athletes", { limit, active: "true" }));
  const refs = (athletesList.items || athletesList.entries || athletesList.athletes || [])
    .map((item) => item.$ref || item.ref || item.href || "")
    .filter(Boolean)
    .slice(0, limit);

  const detailResults = await Promise.all(
    refs.map(async (ref) => {
      try {
        const detail = await fetchJson(ref);
        const athlete = normalizeAthlete(detail, { sport, league });
        const team = athlete.teamRef ? await resolveTeamFromRef(athlete.teamRef) : null;
        return {
          ...athlete,
          team: team
            ? {
                id: team.id,
                name: team.name,
                abbreviation: team.abbreviation,
                logo: team.logo
              }
            : null
        };
      } catch (error) {
        return null;
      }
    })
  );

  return {
    athletes: dedupeById(detailResults.filter(Boolean))
  };
}

async function resolveTeamId(sport, league, id, name) {
  if (id) return id;
  if (!name) return "";
  const data = await getNormalizedTeams(sport, league);
  const loweredName = String(name).toLowerCase();
  return (
    data.teams.find(
      (team) =>
        team.name.toLowerCase() === loweredName ||
        team.shortName.toLowerCase() === loweredName ||
        team.slug.toLowerCase() === loweredName.replace(/\s+/g, "-")
    )?.id || ""
  );
}

async function getNormalizedTeamProfile(sport, league, id = "", name = "") {
  const teamId = await resolveTeamId(sport, league, id, name);
  if (!teamId) {
    return {
      team: null,
      roster: [],
      injuries: [],
      schedule: []
    };
  }

  const [teamDetail, rosterData, injuriesData, scheduleData] = await Promise.all([
    fetchJson(siteApiUrl(sport, league, `teams/${teamId}`)).catch(() => null),
    fetchJson(siteApiUrl(sport, league, `teams/${teamId}/roster`)).catch(() => null),
    fetchJson(siteApiUrl(sport, league, `teams/${teamId}/injuries`)).catch(() => null),
    fetchJson(siteApiUrl(sport, league, `teams/${teamId}/schedule`)).catch(() => null)
  ]);

  const team = normalizeTeamEntry(teamDetail?.team || teamDetail || { id: teamId, name }, sport, league);
  const roster = rosterData ? normalizeRosterGroups(rosterData) : [];
  const injuries = (injuriesData?.injuries || []).map((injury) => ({
    id: injury.id || "",
    athlete: {
      id: injury.athlete?.id || "",
      displayName: injury.athlete?.displayName || "",
      headshot: injury.athlete?.headshot || {}
    },
    status: injury.status || "",
    detail: injury.detail || "",
    date: injury.date || ""
  }));
  const rawScheduleEvents = [
    ...(Array.isArray(scheduleData?.events) ? scheduleData.events : []),
    ...(scheduleData?.team?.nextEvents || []).flatMap((item) => item?.events || []),
    ...(Array.isArray(scheduleData?.schedule?.events) ? scheduleData.schedule.events : [])
  ];
  const scheduleEvents = dedupeById(
    rawScheduleEvents.map((event) => normalizeScoreboardEvent(event, sport, league, scheduleData?.team?.displayName || team.name))
  ).sort((left, right) => new Date(left.date) - new Date(right.date));

  return {
    team,
    roster,
    injuries,
    schedule: scheduleEvents
  };
}

async function getNormalizedAthleteProfile(sport, league, athleteId) {
  if (!athleteId) {
    return { athlete: null, bio: null, news: [] };
  }

  const detail = await fetchJson(coreApiUrl(sport, league, `athletes/${athleteId}`));
  const athlete = normalizeAthlete(detail, { sport, league });
  const team = athlete.teamRef ? await resolveTeamFromRef(athlete.teamRef) : null;

  const [bioData, newsData] = await Promise.all([
    fetchJson(siteApiUrl(sport, league, `athletes/${athleteId}/bio`)).catch(() => null),
    fetchJson(siteApiUrl(sport, league, `athletes/${athleteId}/news`)).catch(() => null)
  ]);

  return {
    athlete: {
      ...athlete,
      team: team
        ? {
            id: team.id,
            name: team.name,
            abbreviation: team.abbreviation,
            logo: team.logo
          }
        : null
    },
    bio: bioData,
    news: (newsData?.articles || []).map(normalizeArticle)
  };
}

async function getNormalizedScores(sport, league, date = "") {
  const leaguePairs = getLeaguePairs(sport, league, sport === "all" ? 10 : 4);
  const responses = await Promise.all(
    leaguePairs.map(async ({ sport: pairSport, league: pairLeague }) => {
      try {
        const data = await fetchJson(siteApiUrl(pairSport, pairLeague, "scoreboard", date ? { dates: date } : {}));
        const leagueName = data.leagues?.[0]?.name || pairLeague.toUpperCase();
        return (data.events || []).map((event) => normalizeScoreboardEvent(event, pairSport, pairLeague, leagueName));
      } catch (error) {
        return [];
      }
    })
  );

  return {
    matches: dedupeById(responses.flat())
      .sort((left, right) => new Date(left.date) - new Date(right.date))
  };
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const type = String(url.searchParams.get("type") || "news").toLowerCase();
  const inputLeague = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const inputSport = url.searchParams.get("sport") || url.searchParams.get("s") || "soccer";
  const sport = normalizeSportParam(inputSport, inputLeague);
  const league = inputLeague ? normalizeLeagueParam(inputLeague, sport) : sport === "all" ? "" : normalizeLeagueParam("", sport);
  const teamId = url.searchParams.get("team") || "";
  const id = url.searchParams.get("id") || "";
  const name = url.searchParams.get("name") || "";
  const parsedLimit = parseInt(url.searchParams.get("limit") || "16", 10);
  const limit = Math.max(1, Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 16, 24));
  const date = url.searchParams.get("date") || "";

  try {
    switch (type) {
      case "news":
        return jsonResponse(await getNormalizedNews(sport, league, teamId), 300);
      case "standings":
        return jsonResponse(await getNormalizedStandings(sport, league), 300);
      case "teams":
        return jsonResponse(await getNormalizedTeams(sport, league), 300);
      case "team":
        return jsonResponse(await getNormalizedTeamProfile(sport, league, id, name), 300);
      case "players":
        return jsonResponse(await getNormalizedPlayers(sport, league, limit), 300);
      case "athlete":
      case "player":
        return jsonResponse(await getNormalizedAthleteProfile(sport, league, id), 300);
      case "roster": {
        const profile = await getNormalizedTeamProfile(sport, league, id, name);
        return jsonResponse({ roster: profile.roster, team: profile.team }, 300);
      }
      case "scores":
      case "scoreboard":
        return jsonResponse(await getNormalizedScores(sport, league, date), 60);
      default:
        return jsonResponse(
          {
            error: "Invalid type",
            supported: ["news", "standings", "teams", "team", "players", "player", "athlete", "roster", "scores"]
          },
          60,
          400
        );
    }
  } catch (error) {
    return jsonResponse(
      {
        error: error.message,
        type,
        sport,
        league,
        leaguesKnown: SPORT_LEAGUES[sport] || []
      },
      30,
      500
    );
  }
}
