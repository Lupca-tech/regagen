import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseInitialized = false;

try {
  if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "regagen.firebasestorage.app"
    });
    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
  } else if (!admin.apps.length) {
    console.warn('Firebase not configured - using mock mode. Set FIREBASE_SERVICE_ACCOUNT to enable Firebase.');
  }
} catch (error) {
  console.warn('Firebase initialization failed - using mock mode:', error);
}

export const db = firebaseInitialized ? admin.firestore() : null;
export const auth = firebaseInitialized ? admin.auth() : null;
export const storage = firebaseInitialized ? admin.storage() : null;
export const isFirebaseEnabled = firebaseInitialized;
