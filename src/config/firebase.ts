import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration - Replace with your actual Firebase project details
const firebaseConfig = {
  apiKey: "AIzaSyCYbPSW7knEYFwQO85TOh9cU-gstMTJDUA",
  authDomain: "aussie-marketplace.firebaseapp.com",
  projectId: "aussie-marketplace",
  storageBucket: "aussie-marketplace.firebasestorage.app",
  messagingSenderId: "290098677743",
  appId: "1:290098677743:web:c77be3ea448fd55360981a",
  measurementId: "G-8LV2N4Q50C"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
