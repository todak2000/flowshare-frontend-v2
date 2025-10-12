/* eslint-disable @typescript-eslint/no-explicit-any */
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy_build_key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:dummy',
};

// Only initialize if we have real keys (not dummy build keys) or if we're in the browser
const isDummyKey = firebaseConfig.apiKey === 'dummy_build_key';
const isBrowser = typeof window !== 'undefined';
const shouldInitialize = isBrowser || !isDummyKey;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;

if (shouldInitialize) {
  // Initialize Firebase
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
} else {
  // Return null/undefined during build with dummy keys
  app = null as any;
  auth = null as any;
  db = null as any;
  functions = null as any;
}

export { auth, db, functions };
export default app;
