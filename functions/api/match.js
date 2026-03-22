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
      
      // Extract lineups if available
      const extractLineup = (teamId) => {
        if (!data.boxscore || !data.boxscore.players) return [];
        const teamBox = data.boxscore.players.find(p => p.team?.id === teamId);
        if (!teamBox || !teamBox.players) return [];
        
        // Flatten and filter starters if possible, or just top players
        const players = [];
        teamBox.players.forEach(group => {
            if (group.statistics && group.statistics[0] && group.statistics[0].athletes) {
                group.statistics[0].athletes.forEach(ath => {
                    players.push({
                        name: ath.athlete.displayName,
                        number: ath.athlete.jersey || '',
                        position: ath.athlete.position?.abbreviation || '',
                        starter: ath.starter || false
                    });
                });
            }
        });
        return players;
      };

      const homeLineup = extractLineup(home?.team?.id);
      const awayLineup = extractLineup(away?.team?.id);

      // Extract timeline/plays if available
      const timeline = [];
      if (data.plays) {
          // Get last 10 plays, focus on goals and key events
          data.plays.slice(-10).reverse().forEach(play => {
              const isGoal = play.type?.text?.toLowerCase().includes('goal');
              const isCard = play.type?.text?.toLowerCase().includes('card');
              
              const teamId = play.team?.id;
              let side = 'neutral';
              if (teamId === home?.team?.id) side = 'home';
              if (teamId === away?.team?.id) side = 'away';

              timeline.push({
                  time: play.clock?.displayValue || `${play.period?.number || ''}'`,
                  type: isGoal ? 'goal' : (isCard ? 'card' : 'event'),
                  player: play.text,
                  side: side
              });
          });
      }

      return new Response(JSON.stringify({
        id: event.id,
        league: data.leagues?.[0]?.name || event.league?.name || 'Sports Event',
        status: statusMap(comp.status.type.state),
        time: comp.status.type.shortDetail,
        homeTeam: {
          id: home?.team?.id,
          name: home?.team?.displayName,
          logo: home?.team?.logos?.[0]?.href || '/public/logo.png',
          score: home?.score || '0',
          lineup: homeLineup
        },
        awayTeam: {
          id: away?.team?.id,
          name: away?.team?.displayName,
          logo: away?.team?.logos?.[0]?.href || '/public/logo.png',
          score: away?.score || '0',
          lineup: awayLineup
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
