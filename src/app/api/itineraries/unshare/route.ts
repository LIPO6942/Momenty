import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { userId, itineraryId } = await req.json();
    if (!userId || !itineraryId) {
      return NextResponse.json({ error: 'Missing userId or itineraryId' }, { status: 400 });
    }
    const ref = doc(db, 'users', userId, 'itineraries', itineraryId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        const data = snap.data();
        if (data.shareToken) {
            await deleteDoc(doc(db, 'shared_itineraries', data.shareToken));
        }
    }
    await setDoc(ref, { shareEnabled: false, shareToken: null, sharedAt: null }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Unshare itinerary error', e);
    return NextResponse.json({ error: 'Failed to disable sharing' }, { status: 500 });
  }
}
