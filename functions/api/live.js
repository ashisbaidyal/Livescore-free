const LEAGUE_MAP = {
  // Football
  "soccer": ["eng.1", "esp.1", "ger.1", "ita.1", "fra.1", "uefa.champions", "uefa.europa", "usa.1", "mex.1", "fifa.world"],
  "football": ["nfl", "college-football", "cfl", "ufl"],
  // Basketball
  "basketball": ["nba", "wnba", "mens-college-basketball", "womens-college-basketball", "fiba"],
  "cricket": ["19430", "8039", "8040", "8048"], // IPL, International, etc.
  "tennis": ["atp", "wta"],
  "hockey": ["nhl", "mens-college-hockey"],
  "baseball": ["mlb", "college-baseball"],
  "mma": ["ufc", "bellator", "pfl"],
  "racing": ["f1", "nascar-premier", "irl"]
};

// Map UI tabs to ESPN sport slugs
const SPORT_MAPPING = {
  "all": ["soccer", "basketball", "cricket", "tennis", "football"],
  "football": ["soccer"],
  "basketball": ["basketball"],
  "cricket": ["cricket"],
  "tennis": ["tennis"],
  "american-football": ["football"],
  "hockey": ["hockey"],
  "baseball": ["baseball"],
  "mma": ["mma"],
  "racing": ["racing"]
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
