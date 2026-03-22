// This Pages Middleware intercepts the RAW `match.html` payload and dynamically 
// queries the match data to inject native Server-Side Rendered (SSR) HTML SEO `<meta>` tags.
// Essential for WhatsApp, Twitter, and native Google Bot crawlers.

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // Fetch the raw static HTML
  let response = await next();

  // If no ID is present, just return the static HTML 
  if (!id || response.status !== 200) {
    return response;
  }

  try {
    // We clone the raw URL to call our internal API directly
    const apiURL = new URL(context.request.url);
    apiURL.pathname = '/api/match';
    apiURL.searchParams.set('id', id);

    const apiResponse = await fetch(apiURL.toString());
    
    if (!apiResponse.ok) return response;
    
    const matchData = await apiResponse.json();
    
    if (matchData.notFound) return response;

    // Rewrite exactly what we need into the HTML stream 
    const metaTitle = `Live: ${matchData.homeTeam.name} vs ${matchData.awayTeam.name} | LiveScoreFree`;
    const metaDesc = `Follow the ${matchData.league} live match between ${matchData.homeTeam.name} and ${matchData.awayTeam.name}. Scores updated every 15 seconds.`;

    class SEOInjector {
      element(element) {
        // Find </title> or inject manually
        element.prepend(`<title>${metaTitle}</title>`, { html: true });
        element.append(`<meta name="description" content="${metaDesc}">`, { html: true });
        element.append(`<meta property="og:title" content="${metaTitle}">`, { html: true });
        element.append(`<meta property="og:description" content="${metaDesc}">`, { html: true });
        element.append(`<meta property="og:image" content="${matchData.homeTeam.logo}">`, { html: true });
        element.append(`<meta name="twitter:card" content="summary_large_image">`, { html: true });
      }
    }

    // Cloudflare HTMLRewriter allows us to parse and modify HTML on the Edge before it hits the browser
    return new HTMLRewriter()
      .on('head', new SEOInjector())
      .transform(response);

  } catch (err) {
    // Failsafe: return unmodified HTML
    return response;
  }
}
