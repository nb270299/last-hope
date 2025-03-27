import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvfAWNCP2hPFDTSRgywBt_MQ7y06-_1kE",
  authDomain: "last-hope-b1bf9.firebaseapp.com",
  projectId: "last-hope-b1bf9",
  storageBucket: "last-hope-b1bf9.firebasestorage.app",
  messagingSenderId: "347036643244",
  appId: "1:347036643244:web:66245c4c5591b64f2fd409"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };