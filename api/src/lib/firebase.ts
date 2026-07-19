import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let app: admin.app.App | undefined;

export function getFirebaseAdmin(): admin.app.App {
  if (app) return app;

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

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `Firebase service account credentials not found in env variables or at ${serviceAccountPath}`
      );
    }

    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return app;
}
