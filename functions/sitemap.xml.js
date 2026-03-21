// Dynamically generates an XML sitemap for search crawlers on the Edge.
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const hostname = url.protocol + '//' + url.hostname;

  try {
    // We fetch current live and upcoming data to list dynamic paths
    const apiURL = new URL(request.url);
    apiURL.pathname = '/api/live';
    apiURL.searchParams.set('sport', 'all');
    
    const apiResponse = await fetch(apiURL.toString());
    const data = await apiResponse.json();
    const matches = data.matches || [];

    const urlStore = [
      { loc: `${hostname}/`, priority: '1.0', changefreq: 'always' }
    ];

    matches.forEach(match => {
      urlStore.push({
        loc: `${hostname}/match.html?id=${match.id}`,
        priority: '0.8',
        changefreq: 'hourly'
      });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlStore.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=600'
      }
    });

  } catch (err) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}
