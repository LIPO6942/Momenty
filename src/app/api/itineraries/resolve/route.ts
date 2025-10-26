import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, query, where } from 'firebase/firestore';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const q = query(
      collectionGroup(db, 'itineraries'),
      where('shareEnabled', '==', true),
      where('shareToken', '==', token)
    );
    const snap = await getDocs(q);
    if (snap.empty) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const docData = snap.docs[0].data();
    // Do not leak token in payload
    const { shareToken, ...safe } = docData as any;
    return NextResponse.json({ itinerary: { ...safe, id: snap.docs[0].id } });
  } catch (e) {
    console.error('Resolve share token error', e);
    return NextResponse.json({ error: 'Failed to resolve token' }, { status: 500 });
  }
}
