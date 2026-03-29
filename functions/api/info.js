import {
  buildFeedMeta,
  SPORT_LEAGUES,
  coreApiUrl,
  dedupeById,
  fetchJson,
  fetchLeagueScoreboard,
  fetchLeagueStandings,
  fetchText,
  getIplScoreboardUrl,
  getIplSquadArticleUrl,
  getIplStandingsUrl,
  isIplLeague,
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

const IPL_ROLE_LABELS = {
  batters: "Batter",
  wicketkeepers: "Wicketkeeper",
  allrounders: "All-rounder",
  spinners: "Spinner",
  "fast bowlers": "Fast bowler"
};

function normalizeIplKey(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function decodeHtmlEntities(value = "") {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(value = "") {
  return decodeHtmlEntities(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveShortName(fullName = "") {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts.join(" ");
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function getIplRoleMeta(category = "") {
  const normalized = String(category || "").trim().toLowerCase();
  const displayName = IPL_ROLE_LABELS[normalized] || "Squad";
  const abbreviation = displayName
    .split(/[\s-]+/)
    .map((chunk) => chunk[0] || "")
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return {
    name: displayName,
    displayName,
    abbreviation
  };
}

function extractIplPlayerNames(playersHtml = "") {
  const plain = stripHtml(playersHtml)
    .replace(/\s*,\s*/g, ",")
    .replace(/\.+$/g, "");

  return plain
    .split(",")
    .map((name) => name.replace(/\s+/g, " ").trim().replace(/\.$/, ""))
    .filter(Boolean);
}

function buildIplPlayer(team, fullName, category = "", order = 0) {
  const cleanedName = String(fullName || "").replace(/\s+/g, " ").trim().replace(/\.$/, "");
  const parts = cleanedName.split(/\s+/);
  const role = getIplRoleMeta(category);

  return {
    id: `ipl-${team.id}-${slugify(cleanedName)}`,
    firstName: parts[0] || cleanedName,
    lastName: parts.slice(1).join(" "),
    fullName: cleanedName,
    shortName: deriveShortName(cleanedName),
    age: "",
    displayHeight: "",
    displayWeight: "",
    jersey: "",
    active: true,
    order,
    position: role,
    experience: {},
    citizenship: "",
    birthPlace: {},
    status: { name: "Active" },
    headshot: { href: team.logo || "" },
    team: {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      logo: team.logo
    },
    sport: "cricket",
    league: "ipl"
  };
}

function aliasIplStandingEntry(entry = {}) {
  const stats = Array.isArray(entry.stats) ? [...entry.stats] : [];
  const existingNames = new Set(stats.map((stat) => String(stat?.name || "").toLowerCase()));
  const aliases = [
    ["matchesPlayed", ["gamesplayed", "games_played"]],
    ["matchesWon", ["wins", "winsoverall"]],
    ["matchesLost", ["losses", "loss"]],
    ["matchPoints", ["points"]],
    ["netrr", ["netrunrate", "nrr"]]
  ];

  aliases.forEach(([sourceName, aliasNames]) => {
    const source = stats.find((stat) => String(stat?.name || "").toLowerCase() === sourceName.toLowerCase());
    if (!source) return;
    aliasNames.forEach((alias) => {
      if (existingNames.has(alias)) return;
      stats.push({
        ...source,
        name: alias
      });
      existingNames.add(alias);
    });
  });

  return {
    ...entry,
    stats
  };
}

function findIplStat(entry = {}, names = []) {
  const stats = Array.isArray(entry.stats) ? entry.stats : [];
  return (
    stats.find((stat) => names.includes(String(stat?.name || "").toLowerCase())) || null
  );
}

function formatIplRecord(entry = {}) {
  const played = findIplStat(entry, ["matchesplayed", "gamesplayed", "games_played"])?.displayValue || "0";
  const won = findIplStat(entry, ["matcheswon", "wins", "winsoverall"])?.displayValue || "0";
  const lost = findIplStat(entry, ["matcheslost", "losses", "loss"])?.displayValue || "0";
  const points = findIplStat(entry, ["matchpoints", "points"])?.displayValue || "0";
  return `${played} Mat | ${won}W-${lost}L | ${points} Pts`;
}

async function getIplScoreboardData() {
  return fetchJson(getIplScoreboardUrl());
}

async function getIplStandingsData() {
  return fetchJson(getIplStandingsUrl());
}

async function getIplTeamsDirectory() {
  const [scoreboard, standingsData] = await Promise.all([
    getIplScoreboardData(),
    getIplStandingsData().catch(() => ({ children: [], standings: [] }))
  ]);

  const standingsEntries = normalizeStandingsEntries(standingsData).map(aliasIplStandingEntry);
  const standingsByTeamId = new Map(
    standingsEntries
      .filter((entry) => entry?.team?.id)
      .map((entry) => [String(entry.team.id), entry])
  );

  const matches = (scoreboard.events || []).map((event) =>
    normalizeScoreboardEvent(event, "cricket", "ipl", scoreboard.leagues?.[0]?.name || "Indian Premier League")
  );

  const teams = dedupeById((scoreboard.teams || []).map((team) => normalizeTeamEntry(team, "cricket", "ipl"))).map((team) => {
    const standing = standingsByTeamId.get(String(team.id));
    const teamSchedule = matches
      .filter((match) => String(match.homeTeam?.id) === String(team.id) || String(match.awayTeam?.id) === String(team.id))
      .sort((left, right) => new Date(left.date) - new Date(right.date));
    const venue = teamSchedule.find((match) => match.status === "upcoming")?.venue || teamSchedule[0]?.venue || team.venue || "";

    return {
      ...team,
      venue,
      record: standing ? formatIplRecord(standing) : team.record || "IPL 2026 squad",
      sport: "cricket",
      league: "ipl"
    };
  });

  return {
    scoreboard,
    matches,
    teams,
    standingsEntries
  };
}

async function getIplRosterDirectory() {
  const { teams } = await getIplTeamsDirectory();
  const teamByKey = new Map(teams.map((team) => [normalizeIplKey(team.name), team]));
  const rostersByTeamId = new Map();
  const athletes = [];
  const seenAthletes = new Set();

  let html = "";
  try {
    html = await fetchText(getIplSquadArticleUrl());
  } catch (error) {
    return {
      teams,
      athletes,
      rostersByTeamId
    };
  }

  const headings = Array.from(html.matchAll(/<h2>([\s\S]*?)<\/h2>/gi));
  headings.forEach((headingMatch, index) => {
    const teamName = stripHtml(headingMatch[1]);
    const team = teamByKey.get(normalizeIplKey(teamName));
    if (!team) return;

    const sectionStart = (headingMatch.index || 0) + headingMatch[0].length;
    const sectionEnd = headings[index + 1]?.index || html.length;
    const sectionHtml = html.slice(sectionStart, sectionEnd);
    const rosterMatch = sectionHtml.match(/<p><b>Full(?:\s+[^<]+)?\s+squad<\/b><\/p>\s*<ul>([\s\S]*?)<\/ul>/i);
    const rosterHtml = rosterMatch?.[1] || "";
    const categoryMatches = Array.from(rosterHtml.matchAll(/<li>\s*<p><b>([^<]+)<\/b>:\s*([\s\S]*?)<\/li>/gi));

    const roster = [];
    let order = 0;
    categoryMatches.forEach((categoryMatch) => {
      const category = stripHtml(categoryMatch[1]);
      const playerNames = extractIplPlayerNames(categoryMatch[2]);
      playerNames.forEach((playerName) => {
        order += 1;
        const athlete = buildIplPlayer(team, playerName, category, order);
        roster.push(athlete);
        if (!seenAthletes.has(athlete.id)) {
          seenAthletes.add(athlete.id);
          athletes.push(athlete);
        }
      });
    });

    rostersByTeamId.set(String(team.id), roster);
  });

  return {
    teams,
    athletes,
    rostersByTeamId
  };
}

async function getNormalizedIplStandings() {
  const data = await getIplStandingsData();
  const entries = normalizeStandingsEntries(data).map(aliasIplStandingEntry);
  return {
    standings: data.standings,
    children: data.children,
    entries
  };
}

async function getNormalizedIplTeams() {
  const { teams } = await getIplTeamsDirectory();
  return {
    teams,
    rawTeams: []
  };
}

async function getNormalizedIplPlayers(limit = 16) {
  const { athletes } = await getIplRosterDirectory();
  return {
    athletes: athletes.slice(0, limit)
  };
}

async function getNormalizedIplTeamProfile(id = "", name = "") {
  const [{ teams, matches }, { rostersByTeamId }] = await Promise.all([
    getIplTeamsDirectory(),
    getIplRosterDirectory()
  ]);

  const normalizedName = normalizeIplKey(name);
  const team = teams.find((entry) => String(entry.id) === String(id)) || teams.find((entry) => normalizeIplKey(entry.name) === normalizedName);
  if (!team) {
    return {
      team: null,
      roster: [],
      injuries: [],
      schedule: []
    };
  }

  const schedule = matches
    .filter((match) => String(match.homeTeam?.id) === String(team.id) || String(match.awayTeam?.id) === String(team.id))
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  return {
    team,
    roster: rostersByTeamId.get(String(team.id)) || [],
    injuries: [],
    schedule
  };
}

async function getNormalizedIplAthleteProfile(athleteId = "") {
  const { athletes } = await getIplRosterDirectory();
  const athlete = athletes.find((entry) => String(entry.id) === String(athleteId));
  if (!athlete) {
    return {
      athlete: null,
      bio: null,
      news: []
    };
  }

  const bio = {
    summary: `${athlete.fullName} is part of the ${athlete.team?.name || "IPL"} squad for the 2026 Indian Premier League season.`,
    sections: [
      {
        title: "Squad Snapshot",
        stats: [
          { name: "Team", value: athlete.team?.abbreviation || athlete.team?.name || "IPL" },
          { name: "Role", value: athlete.position?.displayName || "Squad" },
          { name: "Season", value: "IPL 2026" }
        ]
      }
    ]
  };

  return {
    athlete,
    bio,
    news: []
  };
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
  if (isIplLeague(sport, league)) {
    return getNormalizedIplStandings();
  }

  try {
    const data = await fetchLeagueStandings(sport, league);
    return {
      standings: data.standings,
      children: data.children,
      entries: normalizeStandingsEntries(data)
    };
  } catch (error) {
    return { standings: [], children: [], entries: [] };
  }
}

async function getNormalizedTeams(sport, league) {
  if (isIplLeague(sport, league)) {
    return getNormalizedIplTeams();
  }

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
  if (isIplLeague(sport, league)) {
    return getNormalizedIplPlayers(limit);
  }

  try {
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
  } catch (error) {
    return { athletes: [] };
  }
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
  if (isIplLeague(sport, league)) {
    return getNormalizedIplTeamProfile(id, name);
  }

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
  if (isIplLeague(sport, league)) {
    return getNormalizedIplAthleteProfile(athleteId);
  }

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
  if (isIplLeague(sport, league)) {
    const data = await getIplScoreboardData();
    const leagueName = data.leagues?.[0]?.name || "Indian Premier League";
    const matches = (data.events || []).map((event) => normalizeScoreboardEvent(event, "cricket", "ipl", leagueName));
    const filteredMatches = date
      ? matches.filter((match) => {
          const parsed = new Date(match.date);
          const matchDate = `${parsed.getFullYear()}${String(parsed.getMonth() + 1).padStart(2, "0")}${String(parsed.getDate()).padStart(2, "0")}`;
          return matchDate === date;
        })
      : matches;

    return {
      matches: dedupeById(filteredMatches).sort((left, right) => new Date(left.date) - new Date(right.date))
    };
  }

  const leaguePairs = getLeaguePairs(sport, league, sport === "all" ? 10 : 4);
  const responses = await Promise.all(
    leaguePairs.map(async ({ sport: pairSport, league: pairLeague }) => {
      try {
        const data = await fetchLeagueScoreboard(pairSport, pairLeague, date ? { dates: date } : {});
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
        return jsonResponse(
          {
            ...(await getNormalizedNews(sport, league, teamId)),
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      case "standings":
        return jsonResponse(
          {
            ...(await getNormalizedStandings(sport, league)),
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      case "teams":
        return jsonResponse(
          {
            ...(await getNormalizedTeams(sport, league)),
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      case "team":
        return jsonResponse(
          {
            ...(await getNormalizedTeamProfile(sport, league, id, name)),
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      case "players":
        return jsonResponse(
          {
            ...(await getNormalizedPlayers(sport, league, limit)),
            meta: buildFeedMeta({ type, sport, league, limit })
          },
          300
        );
      case "athlete":
      case "player":
        return jsonResponse(
          {
            ...(await getNormalizedAthleteProfile(sport, league, id)),
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      case "roster": {
        const profile = await getNormalizedTeamProfile(sport, league, id, name);
        return jsonResponse(
          {
            roster: profile.roster,
            team: profile.team,
            meta: buildFeedMeta({ type, sport, league })
          },
          300
        );
      }
      case "scores":
      case "scoreboard":
        return jsonResponse(
          {
            ...(await getNormalizedScores(sport, league, date)),
            meta: buildFeedMeta({ type, sport, league, date })
          },
          60
        );
      default:
        return jsonResponse(
          {
            error: "Invalid type",
            supported: ["news", "standings", "teams", "team", "players", "player", "athlete", "roster", "scores"],
            meta: buildFeedMeta({ degraded: true, type, sport, league })
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
        leaguesKnown: SPORT_LEAGUES[sport] || [],
        meta: buildFeedMeta({ degraded: true, type, sport, league })
      },
      30,
      500
    );
  }
}
