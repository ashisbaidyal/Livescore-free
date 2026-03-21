// Resolving a single match from ESPN requires routing through specific sports endpoints. 
// For this universal proxy, we query common endpoints sequentially until the match is found.
// This handles the user requirement of dynamic routing /match/{id} with universal schema mapping.

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return new Response(JSON.stringify({ notFound: true }), { status: 404 });

  const endpoints = [
    `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${id}`,
    `https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/summary?event=${id}`,
    `https://site.api.espn.com/apis/site/v2/sports/cricket/19430/summary?event=${id}`,
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${id}`
  ];

  try {
    for (const api of endpoints) {
      const res = await fetch(api);
      if (res.ok) {
        const data = await res.json();
        if (data.header && data.header.competitions) {
          const comp = data.header.competitions[0];
          const event = data.header;
          const home = comp.competitors.find(c => c.homeAway === 'home');
          const away = comp.competitors.find(c => c.homeAway === 'away');
          
          return new Response(JSON.stringify({
            id: event.id,
            league: event.league?.name || 'LiveScoreFree Event',
            status: comp.status.type.state === 'in' ? 'live' : comp.status.type.state === 'post' ? 'finished' : 'upcoming',
            time: comp.status.type.shortDetail,
            homeTeam: {
              name: home?.team?.name,
              logo: home?.team?.logos?.[0]?.href || '/public/logo.png',
              score: home?.score || '0'
            },
            awayTeam: {
              name: away?.team?.name,
              logo: away?.team?.logos?.[0]?.href || '/public/logo.png',
              score: away?.score || '0'
            }
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=15, s-maxage=15'
            }
          });
        }
      }
    }

    return new Response(JSON.stringify({ notFound: true }), { status: 404 });
  } catch (err) {
    return new Response(JSON.stringify({ notFound: true }), { status: 500 });
  }
}
