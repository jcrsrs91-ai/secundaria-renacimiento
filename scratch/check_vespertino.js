import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqHojgiANQWkGmQBQJsIwxRmaC2v6KUaQ",
  authDomain: "web-tec-68.firebaseapp.com",
  projectId: "web-tec-68"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const querySnapshot = await getDocs(collection(db, "students"));
  let vesp = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.turno === 'Vespertino') {
      vesp.push({ id: doc.id, nombre: data.nombres, grado: data.grado, grupo: data.grupo, turno: data.turno });
    }
  });
  console.log('Alumnos en Vespertino:', vesp);
}

check();
