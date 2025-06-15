// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBoDfu2puhh_GCf6Z-HQLQ0G91NE5Xxweo",
  authDomain: "secrm-be360.firebaseapp.com",
  projectId: "secrm-be360",
  storageBucket: "secrm-be360.firebasestorage.app",
  messagingSenderId: "734392139141",
  appId: "1:734392139141:web:b634f2c0ca483f93ff18ec"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
