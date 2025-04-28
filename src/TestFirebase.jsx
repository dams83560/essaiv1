import React, { useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  // Remplacez ces valeurs par VOS informations d'identification Firebase
  apiKey: "AIzaSyCQ4l7ACPOqKi-A0UT-suVlX-La2wigaeM",
  authDomain: "application-prise-de-commande.firebaseapp.com",
  projectId: "application-prise-de-commande",
  storageBucket: "application-prise-de-commande.firebasestorage.app",
  messagingSenderId: "439549682850",
  appId: "1:439549682850:web:a5b9c2246da13e7b7a23fb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function TestFirebase() {
  useEffect(() => {
    async function fetchData() {
      try {
        const querySnapshot = await getDocs(collection(db, "test")); // Changez "test" si nécessaire
        querySnapshot.forEach((doc) => {
          console.log(doc.id, " => ", doc.data());
        });
      } catch (error) {
        console.error("Erreur Firebase:", error);
      }
    }

    fetchData();
  }, []);

  return (
    <div>
      <h1>Test Firebase</h1>
    </div>
  );
}

export default TestFirebase;