import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDZqf0WTniw0M3DluOsnno_llPeezpLoQw",
  authDomain: "bytecraft-9a520.firebaseapp.com",
  projectId: "bytecraft-9a520",
  storageBucket: "bytecraft-9a520.firebasestorage.app",
  messagingSenderId: "943245521391",
  appId: "1:943245521391:web:90a1e2ff4271f3a956461a",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);