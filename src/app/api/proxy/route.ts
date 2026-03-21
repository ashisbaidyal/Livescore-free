import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing target url parameter' }, { status: 400 });
  }

  // Ensure we are only proxying allowed data hosts like ESPN
  if (!targetUrl.includes('api.espn.com') && !targetUrl.includes('cdn.espn.com') && !targetUrl.includes('thesportsdb')) {
     return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }

  try {
    const response = await fetch(targetUrl, {
      next: { revalidate: 15 }, // ISR: Cache this response on the Vercel Edge Network for 15 seconds
    });

    if (!response.ok) {
      throw new Error(`Upstream returned ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=59',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
