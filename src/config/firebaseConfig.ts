import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_BASE_API_KEYS,
  authDomain: import.meta.env.VITE_BASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_BASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_BASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_BASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_BASE_APP_ID
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);
const db = getFirestore(app);

export {
  firebaseAuth,
  db
}