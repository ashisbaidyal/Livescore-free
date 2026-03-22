// Upcoming Fixtures API — Fetches next 7 days of scheduled matches from ESPN
const LEAGUE_MAP = {
  "soccer": ["eng.1", "esp.1", "ger.1", "ita.1", "fra.1", "uefa.champions", "uefa.europa", "usa.1"],
  "football": ["nfl", "college-football"],
  "basketball": ["nba", "wnba", "mens-college-basketball"],
  "cricket": ["8039", "8040", "8048", "ipl"],
  "tennis": ["atp", "wta"],
  "hockey": ["nhl"],
  "baseball": ["mlb"],
  "mma": ["ufc", "bellator", "pfl"],
  "racing": ["f1", "nascar-premier", "irl"]
};

const SPORT_MAPPING = {
  "all": ["soccer", "basketball", "football", "hockey", "baseball", "cricket", "tennis", "mma"],
  "soccer": ["soccer"],
  "american-football": ["football"],
  "basketball": ["basketball"],
  "cricket": ["cricket"],
  "tennis": ["tennis"],
  "hockey": ["hockey"],
  "baseball": ["baseball"],
  "mma": ["mma"],
  "racing": ["racing"]
};

function getDateRange(days) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i <= days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}${mm}${dd}`);
  }
  return dates;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sportParam = url.searchParams.get('sport') || 'all';
  const daysAhead = Math.min(parseInt(url.searchParams.get('days') || '7'), 14);

  const targetSports = SPORT_MAPPING[sportParam] || [sportParam];
  const futureDates = getDateRange(daysAhead);

  // For each sport+league combo, fetch scoreboard for each future date
  // But to stay within Cloudflare subrequest limits (~50), be selective:
  // - For "all": pick top 2 leagues per sport, fetch 3 dates
  // - For specific sport: all leagues, fetch 7 dates
  let endpoints = [];

  if (sportParam === 'all') {
    // Selective: top leagues only, next 3 days
    const topLeagues = {
      "soccer": ["eng.1", "esp.1", "ger.1", "ita.1", "fra.1", "uefa.champions"],
      "basketball": ["nba"],
      "football": ["nfl"],
      "hockey": ["nhl"],
      "baseball": ["mlb"],
      "cricket": ["ipl", "8039"],
      "tennis": ["atp"],
      "mma": ["ufc"]
    };
    const datesToFetch = futureDates.slice(0, 3);

    targetSports.forEach(s => {
      const leagues = topLeagues[s] || (LEAGUE_MAP[s] || []).slice(0, 1);
      leagues.forEach(l => {
        datesToFetch.forEach(date => {
          endpoints.push({
            url: `https://site.api.espn.com/apis/site/v2/sports/${s}/${l}/scoreboard?dates=${date}&limit=20`,
            sport: s,
            league: l
          });
        });
      });
    });
  } else {
    const leagues = LEAGUE_MAP[targetSports[0]] || [targetSports[0]];
    const datesToFetch = futureDates.slice(0, 5);

    leagues.slice(0, 5).forEach(l => {
      datesToFetch.forEach(date => {
        endpoints.push({
          url: `https://site.api.espn.com/apis/site/v2/sports/${targetSports[0]}/${l}/scoreboard?dates=${date}&limit=20`,
          sport: targetSports[0],
          league: l
        });
      });
    });
  }

  // Respect Cloudflare subrequest limits
  const limitedEndpoints = endpoints.slice(0, 45);

  try {
    const fetchPromises = limitedEndpoints.map(ep =>
      fetch(ep.url)
        .then(res => res.json())
        .then(data => ({ data, sport: ep.sport, leagueSlug: ep.league }))
        .catch(() => null)
    );

    const results = await Promise.all(fetchPromises);
    const seen = new Set();
    let allMatches = [];

    results.filter(Boolean).forEach(res => {
      const { data, sport, leagueSlug } = res;
      if (!data.events) return;

      data.events.forEach(event => {
        // Deduplicate by event ID
        if (seen.has(event.id)) return;
        seen.add(event.id);

        const comp = event.competitions[0];
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');
        const state = event.status.type.state;

        // Only include upcoming (pre) matches
        if (state !== 'pre') return;

        allMatches.push({
          id: event.id,
          date: event.date,
          name: event.name,
          sport: sport,
          leagueSlug: leagueSlug,
          league: data.leagues?.[0]?.name || 'Sports Event',
          status: 'upcoming',
          time: event.status.type.shortDetail,
          venue: comp.venue?.fullName || '',
          broadcast: comp.broadcasts?.[0]?.names?.join(', ') || '',
          homeTeam: {
            name: home?.team?.shortDisplayName || home?.team?.name || 'TBD',
            logo: home?.team?.logo || '/public/logo.png',
            score: '—'
          },
          awayTeam: {
            name: away?.team?.shortDisplayName || away?.team?.name || 'TBD',
            logo: away?.team?.logo || '/public/logo.png',
            score: '—'
          }
        });
      });
    });

    // Sort by kickoff date (soonest first)
    allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));

    return new Response(JSON.stringify({ matches: allMatches, fetchedDates: futureDates.length }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120, s-maxage=120',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, matches: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
