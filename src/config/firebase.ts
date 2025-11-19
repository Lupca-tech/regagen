import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// In production, you would typically use the GOOGLE_APPLICATION_CREDENTIALS env var
// pointing to a JSON file, or let the platform (like Google Cloud Run) handle auth automatically.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), 
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "regagen.appspot.com"
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();