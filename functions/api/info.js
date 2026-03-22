// info.js - Fetches Standings and News from ESPN
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'news'; // 'news' or 'standings'
  const sport = url.searchParams.get('sport') || 'soccer';
  const league = url.searchParams.get('league') || 'eng.1';

  let apiUrl = '';
  if (type === 'news') {
    apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/news?limit=10`;
  } else if (type === 'standings') {
    apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/standings`;
  }

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
