import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBqHojgiANQWkGmQBQJsIwxRmaC2v6KUaQ",
  authDomain: "web-tec-68.firebaseapp.com",
  projectId: "web-tec-68",
  storageBucket: "web-tec-68.firebasestorage.app",
  messagingSenderId: "616654034170",
  appId: "1:616654034170:web:183c9053253a67316be543",
  measurementId: "G-FJP8HNZG3C"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
