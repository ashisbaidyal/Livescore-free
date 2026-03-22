// info.js - Fetches Standings and News from ESPN
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'news'; // news, standings, players
    const sport = url.searchParams.get('sport') || 'soccer';
    const league = url.searchParams.get('league') || 'eng.1';

    let apiUrl = '';
    
    if (type === 'news') {
      apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/news`;
    } else if (type === 'standings') {
      apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/standings`;
    } else if (type === 'players') {
      // Use core API for athletes (top 20)
      apiUrl = `https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${league}/athletes?limit=20&active=true`;
    } else if (type === 'teams') {
      apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams`;
    }

    if (!apiUrl) return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });

    const response = await fetch(apiUrl);
    const data = await response.json();

    // If type is players, we might need to fetch individual athlete details because the list only gives URLs
    // But for now, we'll just return the list or handle it in the frontend if needed.
    // Actually, for "Auto" we should try to give a better summary if possible.

    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
}
