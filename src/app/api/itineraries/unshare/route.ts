import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { userId, itineraryId } = await req.json();
    if (!userId || !itineraryId) {
      return NextResponse.json({ error: 'Missing userId or itineraryId' }, { status: 400 });
    }
    const ref = doc(db, 'users', userId, 'itineraries', itineraryId);
    await setDoc(ref, { shareEnabled: false, shareToken: null, sharedAt: null }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Unshare itinerary error', e);
    return NextResponse.json({ error: 'Failed to disable sharing' }, { status: 500 });
  }
}
