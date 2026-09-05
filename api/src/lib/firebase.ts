import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

let app: App | undefined;

export function getFirebaseAdmin(): App | null {
  if (app) return app;
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  let serviceAccount: any;

  // Prefer environment variables if available
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  } else {
    const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      } catch {}
    }
  }

  if (serviceAccount) {
    try {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      return app;
    } catch (e) {
      console.warn('[FirebaseAdmin] Failed to initialize with cert:', e);
    }
  }

  return null;
}

// In-memory cache for Google public x509 certificates
let googlePublicCerts: Record<string, string> | null = null;
let certsExpiry = 0;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  if (googlePublicCerts && Date.now() < certsExpiry) {
    return googlePublicCerts;
  }
  const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
  googlePublicCerts = await res.json() as Record<string, string>;
  certsExpiry = Date.now() + maxAge * 1000;
  return googlePublicCerts;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{ phone_number?: string; uid: string }> {
  // 1. Try Firebase Admin SDK first if configured
  const adminApp = getFirebaseAdmin();
  if (adminApp) {
    try {
      const decoded = await getAuth(adminApp).verifyIdToken(idToken);
      return {
        phone_number: decoded.phone_number,
        uid: decoded.uid,
      };
    } catch (adminErr) {
      console.warn('[FirebaseAdmin] verifyIdToken failed, falling back to public cert verification:', adminErr);
    }
  }

  // 2. Fallback: Verify directly using Google's public certificates (no service account required)
  const decodedHeader = jwt.decode(idToken, { complete: true }) as any;
  const kid = decodedHeader?.header?.kid;
  if (!kid) {
    throw new Error('Invalid Firebase token: missing kid in header');
  }

  const certs = await getGooglePublicCerts();
  const cert = certs[kid];
  if (!cert) {
    throw new Error(`Invalid Firebase token: public certificate not found for kid ${kid}`);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'ask-in';
  const payload = jwt.verify(idToken, cert, {
    algorithms: ['RS256'],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  }) as any;

  return {
    phone_number: payload.phone_number,
    uid: payload.user_id || payload.sub,
  };
}
