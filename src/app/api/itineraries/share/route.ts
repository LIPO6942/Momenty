import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

function randomToken() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as any).randomUUID();
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function POST(req: Request) {
  try {
    const { userId, itineraryId } = await req.json();
    if (!userId || !itineraryId) {
      return NextResponse.json({ error: 'Missing userId or itineraryId' }, { status: 400 });
    }
    const token = randomToken();
    const now = new Date().toISOString();
    const ref = doc(db, 'users', userId, 'itineraries', itineraryId);
    await setDoc(ref, { shareEnabled: true, shareToken: token, sharedAt: now }, { merge: true });
    return NextResponse.json({ token });
  } catch (e) {
    console.error('Share itinerary error', e);
    return NextResponse.json({ error: 'Failed to enable sharing' }, { status: 500 });
  }
}
