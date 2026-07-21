import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Fill these in with your own Firebase project's web config.
// Firebase Console -> Project Settings -> General -> "Your apps" -> Web app -> SDK setup and config.
// These values are NOT secret — Firebase web config is meant to be public.
// Your data is protected by the Firestore Security Rules (see README), not by hiding these.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyB5GqanO_vR0wSQSNOgExAOrARA7smhBaw",
  authDomain: "overload-workout.firebaseapp.com",
  projectId: "overload-workout",
  storageBucket: "overload-workout.firebasestorage.app",
  messagingSenderId: "862149813578",
  appId: "1:862149813578:web:2171382d58b3fe17288db3",
  measurementId: "G-6TR0FVMQW5",
};


export const firebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Persistent local cache keeps the app working offline and syncs automatically
// once back online — this replaces what localStorage used to do for us.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
});
