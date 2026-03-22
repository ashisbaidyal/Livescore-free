const LEAGUE_MAP = {
  // Football (Soccer)
  "soccer": [
    "eng.1", "esp.1", "ger.1", "ita.1", "fra.1", 
    "uefa.champions", "uefa.europa", "uefa.europa.conf",
    "usa.1", "mex.1", "fifa.world", "eng.fa", "eng.league_cup",
    "esp.copa_del_rey", "ger.dfb_pokal", "ita.coppa_italia", "fra.coupe_de_france",
    "fifa.africa.nations", "fifa.asia.asian_cup", "fifa.copa_america"
  ],
  // American Football
  "football": ["nfl", "college-football", "cfl", "ufl", "xfl"],
  // Basketball
  "basketball": [
    "nba", "wnba", "mens-college-basketball", "womens-college-basketball", 
    "fiba", "nba-development", "euroleague"
  ],
  // Cricket
  "cricket": ["8039", "8040", "8048", "19430", "intl", "ipl"],
  // Tennis
  "tennis": ["atp", "wta"],
  // Hockey
  "hockey": ["nhl", "mens-college-hockey", "womens-college-hockey", "hockey-world-cup"],
  // Baseball
  "baseball": ["mlb", "college-baseball", "world-baseball-classic"],
  // MMA
  "mma": ["ufc", "bellator", "pfl", "cage-warriors"],
  // Racing
  "racing": ["f1", "nascar-premier", "irl", "motogp"],
  // Others
  "golf": ["pga", "lpga", "champions-tour", "liv"],
  "rugby": ["271937", "267979", "180659"]
};

// Map UI tabs to ESPN sport slugs
const SPORT_MAPPING = {
  "all": ["soccer", "basketball", "cricket", "tennis", "football", "baseball", "mma", "hockey"],
  "soccer": ["soccer"],
  "football": ["soccer"], // In some UIs, football means soccer
  "american-football": ["football"],
  "basketball": ["basketball"],
  "cricket": ["cricket"],
  "tennis": ["tennis"],
  "hockey": ["hockey"],
  "baseball": ["baseball"],
  "mma": ["mma"],
  "racing": ["racing"],
  "golf": ["golf"],
  "rugby": ["rugby"]
};

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sportParam = url.searchParams.get('sport') || 'all';
  
  const targetSports = SPORT_MAPPING[sportParam] || [sportParam];
  let endpoints = [];

  targetSports.forEach(s => {
    const leagues = LEAGUE_MAP[s] || [];
    leagues.forEach(l => {
      endpoints.push({
        url: `https://site.api.espn.com/apis/site/v2/sports/${s}/${l}/scoreboard`,
        sport: s,
        league: l
      });
    });
  });

  // If "all" or specific sport has no common mapping, try a default or hit more
  if (endpoints.length === 0) {
      endpoints.push({
          url: `https://site.api.espn.com/apis/site/v2/sports/${targetSports[0]}/${targetSports[0]}/scoreboard`,
          sport: targetSports[0],
          league: targetSports[0]
      });
  }

  try {
    // Limit to 10 endpoints to avoid Cloudflare subrequest limits (50) and timeout
    const limitedEndpoints = endpoints.slice(0, 15);
    const fetchPromises = limitedEndpoints.map(ep => 
      fetch(ep.url + "?limit=50")
        .then(res => res.json())
        .then(data => ({ data, sport: ep.sport, leagueSlug: ep.league }))
        .catch(() => null)
    );
    
    const results = await Promise.all(fetchPromises);
    
    let allMatches = [];
    results.filter(Boolean).forEach(res => {
      const { data, sport, leagueSlug } = res;
      if (!data.events) return;
      
      data.events.forEach(event => {
        const comp = event.competitions[0];
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');
        
        allMatches.push({
          id: event.id,
          date: event.date,
          name: event.name,
          sport: sport,
          leagueSlug: leagueSlug,
          league: data.leagues?.[0]?.name || 'Sports Event',
          status: event.status.type.state === 'in' ? 'live' : event.status.type.state === 'post' ? 'finished' : 'upcoming',
          time: event.status.type.shortDetail,
          homeTeam: {
            name: home?.team?.shortDisplayName || home?.team?.name,
            logo: home?.team?.logo || '/public/logo.png',
            score: home?.score || '0'
          },
          awayTeam: {
            name: away?.team?.shortDisplayName || away?.team?.name,
            logo: away?.team?.logo || '/public/logo.png',
            score: away?.score || '0'
          },
          highlightUrl: event.links?.find(l => l.shortText === 'Highlights' || l.shortText === 'Recap')?.href || ''
        });
      });
    });

    // Sort by date or status
    allMatches.sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (a.status !== 'live' && b.status === 'live') return 1;
        return new Date(a.date) - new Date(b.date);
    });

    return new Response(JSON.stringify({ matches: allMatches }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15, s-maxage=15',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
