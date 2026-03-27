import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export async function POST(req: Request) {
  try {
    const { fcmToken, title, body, data } = await req.json();
    
    if (!fcmToken) {
      return NextResponse.json({ error: 'Missing fcmToken' }, { status: 400 });
    }

    // Modern FCM v1 Send
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    
    console.log('[PUSH] Successfully sent message:', response);
    return NextResponse.json({ ok: true, messageId: response });

  } catch (e: any) {
    console.error('Push notification error:', e);
    
    // Fallback info if keys are missing
    if (!process.env.FIREBASE_PRIVATE_KEY) {
        return NextResponse.json({ 
            error: 'Configuration missing (FIREBASE_PRIVATE_KEY)', 
            simulated: true 
        }, { status: 200 });
    }

    return NextResponse.json({ 
        error: 'Failed to send notification', 
        details: e.message 
    }, { status: 500 });
  }
}
