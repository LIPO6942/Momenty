import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const source = searchParams.get('source');

  try {
    if (source === 'itunes') {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q || '')}&media=music&limit=15`);
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const response = await fetch(`https://api-v2.hearthis.at/search/?t=${encodeURIComponent(q || '')}&count=15&page=1`);
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 500 });
  }
}
