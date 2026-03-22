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
      
      // Extract stats from boxscore.teams
      const stats = [];
      if (data.boxscore && data.boxscore.teams) {
        const homeTeamStats = data.boxscore.teams.find(t => t.homeAway === 'home')?.statistics || [];
        const awayTeamStats = data.boxscore.teams.find(t => t.homeAway === 'away')?.statistics || [];
        
        homeTeamStats.forEach(hs => {
            const as = awayTeamStats.find(s => s.name === hs.name);
            stats.push({
                label: hs.label,
                home: hs.displayValue,
                away: as ? as.displayValue : '0'
            });
        });
      }
      
      // Extract lineups from rosters
      const extractLineup = (side) => {
        if (!data.rosters) return [];
        const teamRoster = data.rosters.find(r => r.homeAway === side);
        if (!teamRoster || !teamRoster.roster) return [];
        
        return teamRoster.roster.map(entry => ({
            name: entry.athlete.displayName,
            number: entry.jersey || '',
            position: entry.position?.abbreviation || '',
            starter: entry.starter || false,
            face: entry.athlete.headshot?.href || ''
        }));
      };

      const homeLineup = extractLineup('home');
      const awayLineup = extractLineup('away');

      // Extract Odds (Pickcenter)
      const odds = data.pickcenter?.[0] || null;

      // Extract timeline/plays if available
      const timeline = [];
      const plays = data.plays || data.header?.competitions?.[0]?.details || [];
      if (plays) {
          // Focus on goals and key events
          plays.slice(-30).reverse().forEach(play => {
              const text = play.text || play.athletesInvolved?.[0]?.displayName || '';
              const type = play.type?.text?.toLowerCase() || play.type?.name?.toLowerCase() || '';
              const isGoal = type.includes('goal');
              const isCard = type.includes('card');
              const isSub = type.includes('substitution');
              
              const teamId = play.team?.id;
              let side = 'neutral';
              if (teamId === home?.team?.id) side = 'home';
              if (teamId === away?.team?.id) side = 'away';

              timeline.push({
                  time: play.clock?.displayValue || play.clock?.value || '0\'',
                  type: isGoal ? 'goal' : (isCard ? 'card' : (isSub ? 'substitution' : 'event')),
                  player: text,
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
        timeline: timeline,
        odds: odds ? {
            details: odds.details,
            homeOdds: odds.homeTeamOdds?.moneyLine,
            awayOdds: odds.awayTeamOdds?.moneyLine,
            drawOdds: odds.drawOdds?.moneyLine
        } : null
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
