import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyAE5gtT5m893XAMe5Uac_PVHGppiE3ABXM",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "registro-usuarios-7b67a.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "registro-usuarios-7b67a",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "registro-usuarios-7b67a.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "308018004150",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:308018004150:web:e4b0e15dbdc6e9abf56617",
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7GJX2XVV8C",
};

// Validar si la API Key está configurada correctamente
const isApiKeyPlaceholder =
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.includes("tu_api_key") ||
  firebaseConfig.apiKey.trim() === "";

if (isApiKeyPlaceholder) {
  console.warn(
    "[Firebase] La API Key no está configurada o es un marcador de posición. Por favor actualiza VITE_FIREBASE_API_KEY en tu archivo .env.local"
  );
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, db, storage, auth, analytics, firebaseConfig, isApiKeyPlaceholder };
