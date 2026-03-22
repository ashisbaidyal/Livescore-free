import {
  SPORT_LEAGUES,
  coreApiUrl,
  dedupeById,
  extractTrailingId,
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

async function getNormalizedNews(sport, league, teamId = "") {
  const data = await fetchJson(siteApiUrl(sport, league, "news", teamId ? { team: teamId } : {}));
  return {
    articles: (data.articles || []).map(normalizeArticle)
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
  const data = await fetchJson(siteApiUrl(sport, league, "teams"));
  const rawTeams = data.sports?.[0]?.leagues?.[0]?.teams || data.teams || [];
  return {
    teams: rawTeams.map((entry) => normalizeTeamEntry(entry, sport, league)),
    rawTeams
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
  const scheduleEvents = (scheduleData?.events || []).map((event) =>
    normalizeScoreboardEvent(event, sport, league, scheduleData?.team?.displayName || team.name)
  );

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
  const data = await fetchJson(siteApiUrl(sport, league, "scoreboard", date ? { dates: date } : {}));
  const leagueName = data.leagues?.[0]?.name || league.toUpperCase();
  return {
    matches: (data.events || []).map((event) => normalizeScoreboardEvent(event, sport, league, leagueName))
  };
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const type = String(url.searchParams.get("type") || "news").toLowerCase();
  const inputLeague = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const inputSport = url.searchParams.get("sport") || url.searchParams.get("s") || "soccer";
  const sport = normalizeSportParam(inputSport, inputLeague);
  const league = normalizeLeagueParam(inputLeague, sport);
  const teamId = url.searchParams.get("team") || "";
  const id = url.searchParams.get("id") || "";
  const name = url.searchParams.get("name") || "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "16", 10), 24);
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
