import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDrgR5OmSsktJT2PRu2o7WqQQy_9PvVP3U",
  authDomain: "banksampah-b370e.firebaseapp.com",
  projectId: "banksampah-b370e",
  storageBucket: "banksampah-b370e.firebasestorage.app",
  messagingSenderId: "17799686054",
  appId: "1:17799686054:web:2125085e8c81f71ea55167"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore & Auth
const db = getFirestore(app);
export const auth = getAuth(app);
export { app, db };