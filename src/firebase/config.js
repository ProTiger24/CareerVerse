import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDMQPo3fgETJftU2Jm7mZs2w8K3XL6i9Ng",
  authDomain: "careerverse-f0a15.firebaseapp.com",
  projectId: "careerverse-f0a15",
  storageBucket: "careerverse-f0a15.firebasestorage.app",
  messagingSenderId: "221005770943",
  appId: "1:221005770943:web:6524e8d7d0794dd487d60a",
  measurementId: "G-FSLYZ6FYZS",
  databaseURL: "https://careerverse-f0a15-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);   // ← এই লাইন যোগ করলাম
export const storage = getStorage(app);

export default app;
