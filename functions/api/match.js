export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const sport = url.searchParams.get('sport') || 'soccer';
  const league = url.searchParams.get('league') || 'eng.1';

  if (!id) return new Response(JSON.stringify({ notFound: true }), { status: 404 });

  // Priority endpoint based on provided context
  const targetApi = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${id}`;
  
  // Fallbacks for common leagues if the provided one fails or is default
  const fallbacks = [
    `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${id}`,
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${id}`,
    `https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/summary?event=${id}`,
    `https://site.api.espn.com/apis/site/v2/sports/cricket/19430/summary?event=${id}`
  ];

  try {
    // Try target first
    let res = await fetch(targetApi);
    let data;
    
    if (res.ok) {
        data = await res.json();
    } else {
        // Try fallbacks
        for (const fb of fallbacks) {
            if (fb === targetApi) continue;
            const fbRes = await fetch(fb);
            if (fbRes.ok) {
                data = await fbRes.json();
                break;
            }
        }
    }

    if (data && data.header && data.header.competitions) {
      const comp = data.header.competitions[0];
      const event = data.header;
      const home = comp.competitors.find(c => c.homeAway === 'home');
      const away = comp.competitors.find(c => c.homeAway === 'away');
      
      // Extract stats if available
      const stats = [];
      if (data.record) {
          // Sometimes stats are in boxscore or summary
      }
      
      // Extract timeline/plays if available
      const timeline = [];
      if (data.plays) {
          data.plays.slice(-5).forEach(play => {
              timeline.push({
                  time: play.clock?.displayValue || play.period?.number,
                  type: play.type?.text?.toLowerCase().includes('goal') ? 'goal' : 'event',
                  player: play.text
              });
          });
      }

      return new Response(JSON.stringify({
        id: event.id,
        league: event.league?.name || 'Sports Event',
        status: statusMap(comp.status.type.state),
        time: comp.status.type.shortDetail,
        homeTeam: {
          name: home?.team?.displayName,
          logo: home?.team?.logos?.[0]?.href || '/public/logo.png',
          score: home?.score || '0'
        },
        awayTeam: {
          name: away?.team?.displayName,
          logo: away?.team?.logos?.[0]?.href || '/public/logo.png',
          score: away?.score || '0'
        },
        stats: stats,
        timeline: timeline
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=15, s-maxage=15',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify({ notFound: true }), { status: 404 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

function statusMap(state) {
    if (state === 'in') return 'live';
    if (state === 'post') return 'finished';
    return 'upcoming';
}
