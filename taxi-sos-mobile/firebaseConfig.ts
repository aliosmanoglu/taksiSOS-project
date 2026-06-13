import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9MJr02xPryuKPcpHDFTYqwCsjs-N4WQo",
  authDomain: "taksi-sos.firebaseapp.com",
  projectId: "taksi-sos",
  storageBucket: "taksi-sos.firebasestorage.app",
  messagingSenderId: "911099922872",
  appId: "1:911099922872:web:fe2f54beb3684abe5be74d",
  measurementId: "G-4X2966LQQF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
