// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);