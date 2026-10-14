import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAFkmsmaKt_cuIJwUF02nMUkTxQgUnpXbs",
    authDomain: "codeplaces.firebaseapp.com",
    projectId: "codeplaces",
    storageBucket: "codeplaces.firebasestorage.app",
    messagingSenderId: "991051457607",
    appId: "1:991051457607:web:da96e67ab62cfff51c7d62",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
