/**
 * Server-side Firebase Admin initialization.
 * Only import this in Next.js API routes / Server Components - NEVER in client components.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // Option 1: Full service account JSON
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      return initializeApp({ credential: cert(parsed) });
    } catch (e) {
      console.error('[Firebase Admin] Could not parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
  }

  // Option 2: Separate fields (Vercel env vars: FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = rawKey?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  // Fallback: auto-detect (Google Cloud Run / Cloud Functions)
  return initializeApp({ projectId });
}

const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
