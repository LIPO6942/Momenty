import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qStr = searchParams.get('q')?.trim();
    if (!qStr || qStr.length < 2) return NextResponse.json({ users: [] });

    const qLower = qStr.toLowerCase();
    const usersRef = adminDb.collection('users');
    const resultsMap = new Map<string, any>();

    // --- Search 1: by displayNameLower (case-insensitive prefix) ---
    const nameSnap = await usersRef
      .where('displayNameLower', '>=', qLower)
      .where('displayNameLower', '<=', qLower + '\uf8ff')
      .limit(10)
      .get();

    nameSnap.docs.forEach(doc => {
      resultsMap.set(doc.id, {
        uid: doc.id,
        displayName: doc.data().displayName,
        email: doc.data().email,
        photoURL: doc.data().photoURL,
        fcmToken: doc.data().fcmToken,
      });
    });

    // Fallback: if no displayNameLower field yet, search by displayName (case-sensitive)
    if (resultsMap.size === 0) {
      const nameSnap2 = await usersRef
        .where('displayName', '>=', qStr)
        .where('displayName', '<=', qStr + '\uf8ff')
        .limit(10)
        .get();
      nameSnap2.docs.forEach(doc => {
        resultsMap.set(doc.id, {
          uid: doc.id,
          displayName: doc.data().displayName,
          email: doc.data().email,
          photoURL: doc.data().photoURL,
          fcmToken: doc.data().fcmToken,
        });
      });
    }

    // --- Search 2: by email (exact match or prefix) ---
    const emailSnap = await usersRef
      .where('email', '>=', qLower)
      .where('email', '<=', qLower + '\uf8ff')
      .limit(10)
      .get();

    emailSnap.docs.forEach(doc => {
      if (!resultsMap.has(doc.id)) {
        resultsMap.set(doc.id, {
          uid: doc.id,
          displayName: doc.data().displayName,
          email: doc.data().email,
          photoURL: doc.data().photoURL,
          fcmToken: doc.data().fcmToken,
        });
      }
    });

    const users = Array.from(resultsMap.values()).slice(0, 10);
    return NextResponse.json({ users });

  } catch (e) {
    console.error('[Users Search] Error:', e);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
