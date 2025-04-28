import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQ4l7ACPOqKi-A0UT-suVlX-La2wigaeM",
  authDomain: "application-prise-de-commande.firebaseapp.com",
  projectId: "application-prise-de-commande",
  storageBucket: "application-prise-de-commande.firebasestorage.app",
  messagingSenderId: "439549682850",
  appId: "1:439549682850:web:a5b9c2246da13e7b7a23fb"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);