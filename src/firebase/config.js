import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAE5gtT5m893XAMe5Uac_PVHGppiE3ABXM",
  authDomain: "registro-usuarios-7b67a.firebaseapp.com",
  projectId: "registro-usuarios-7b67a",
  storageBucket: "registro-usuarios-7b67a.firebasestorage.app",
  messagingSenderId: "308018004150",
  appId: "1:308018004150:web:e4b0e15dbdc6e9abf56617",
  measurementId: "G-7GJX2XVV8C",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const isApiKeyPlaceholder = false;

export {
  app,
  auth,
  db,
  storage,
  analytics,
  firebaseConfig,
  isApiKeyPlaceholder,
};
