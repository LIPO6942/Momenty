import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qStr = searchParams.get('q');
    if (!qStr || qStr.length < 2) return NextResponse.json({ users: [] });

    const usersRef = collection(db, 'users');
    // Basic search - for Better search we'd need a dedicated indexer or startAt/endAt
    const q = query(
      usersRef, 
      where('displayName', '>=', qStr),
      where('displayName', '<=', qStr + '\uf8ff'),
      limit(10)
    );
    
    const snap = await getDocs(q);
    const users = snap.docs.map(doc => ({
      uid: doc.id,
      displayName: doc.data().displayName,
      photoURL: doc.data().photoURL,
    }));

    return NextResponse.json({ users });
  } catch (e) {
    console.error('Search users error', e);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
