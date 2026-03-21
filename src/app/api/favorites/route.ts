import { NextResponse } from 'next/server';

export const runtime = 'edge';

// NEXT.JS ON CLOUDFLARE EDGE NOTE:
// Cloudflare Page's Edge Runtime strictly forbids native Node.js libraries (like `stream`, `net`, `tls`)
// which traditional ORMs like Mongoose rely heavily on. 
// To interact with MongoDB on Cloudflare Edge, you must use the 'MongoDB Atlas Data API' via standard HTTP fetches,
// or rely on our existing Zustand LocalStorage implementation.

export async function GET(request: Request) {
  return NextResponse.json({ 
    success: true, 
    notice: 'Database features are temporarily disabled on the Edge. Favorites are currently tracked locally via Zustand.',
    data: [] 
  });
}

export async function POST(request: Request) {
  return NextResponse.json({ 
    success: true, 
    notice: 'Database features are temporarily disabled on the Edge. Favorites are currently tracked locally via Zustand.',
  });
}

export async function DELETE(request: Request) {
  return NextResponse.json({ 
    success: true,
    notice: 'Database features are temporarily disabled on the Edge. Favorites are currently tracked locally via Zustand.',
  });
}
