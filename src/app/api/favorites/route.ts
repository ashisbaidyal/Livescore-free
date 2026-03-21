import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Favorite from '@/models/Favorite';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectToDatabase();
    const favorites = await Favorite.find({ userId });
    return NextResponse.json({ success: true, data: favorites });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, targetId, metadata } = body;

    if (!userId || !type || !targetId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await Favorite.findOne({ userId, type, targetId });
    if (existing) return NextResponse.json({ success: true, data: existing });

    const favorite = await Favorite.create({ userId, type, targetId, metadata });
    return NextResponse.json({ success: true, data: favorite });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const targetId = searchParams.get('targetId');

    if (!userId || !type || !targetId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await connectToDatabase();
    await Favorite.deleteOne({ userId, type, targetId });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
