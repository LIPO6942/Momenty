import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`https://api-v2.hearthis.at/feed/?type=popular&count=10&page=1`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch popular audio' }, { status: 500 });
  }
}
