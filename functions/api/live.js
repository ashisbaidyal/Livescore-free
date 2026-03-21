const ESPN_ENDPOINTS = {
  all: [
    'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
    'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard',
    'https://site.api.espn.com/apis/site/v2/sports/cricket/19430/scoreboard', // IPL as fallback
    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    'https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard'
  ],
  football: [
    'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
    'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard'
  ],
  cricket: ['https://site.api.espn.com/apis/site/v2/sports/cricket/19430/scoreboard'],
  basketball: ['https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'],
  tennis: ['https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard']
};

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sport = url.searchParams.get('sport') || 'all';
  
  const endpoints = ESPN_ENDPOINTS[sport] || ESPN_ENDPOINTS.all;

  try {
    const fetchPromises = endpoints.map(api => fetch(api).then(res => res.json()).catch(() => null));
    const results = await Promise.all(fetchPromises);
    
    let allMatches = [];
    results.filter(Boolean).forEach(data => {
      if (!data.events) return;
      data.events.forEach(event => {
        const comp = event.competitions[0];
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');
        
        allMatches.push({
          id: event.id,
          date: event.date,
          name: event.name,
          league: data.leagues?.[0]?.name || 'Sports Event',
          status: event.status.type.state === 'in' ? 'live' : event.status.type.state === 'post' ? 'finished' : 'upcoming',
          time: event.status.type.shortDetail,
          homeTeam: {
            name: home?.team?.name,
            logo: home?.team?.logo || '/public/logo.png',
            score: home?.score || '0'
          },
          awayTeam: {
            name: away?.team?.name,
            logo: away?.team?.logo || '/public/logo.png',
            score: away?.score || '0'
          }
        });
      });
    });

    return new Response(JSON.stringify({ matches: allMatches }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=15, s-maxage=15'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), { status: 500 });
  }
}
