import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqHojgiANQWkGmQBQJsIwxRmaC2v6KUaQ",
  authDomain: "web-tec-68.firebaseapp.com",
  projectId: "web-tec-68"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const querySnapshot = await getDocs(collection(db, "students"));
  let countV = 0;
  let countFMatutino = 0;
  let possibleStudent = null;
  
  querySnapshot.forEach((d) => {
    const data = d.data();
    if (data.turno === 'Vespertino') {
      countV++;
    }
    // We are looking for the 1 student who was M, F, but might have been moved.
    // Wait, earlier there were 4 women (M) in Grupo F Matutino?
    // In the screenshot, Grupo F Matutino has 17 H, 5 M = 22.
    // And Grupo F Vespertino has 0 H, 1 M = 1 Total.
    // So we are looking for a Mujer in 1er Grado, Grupo F.
    if (data.grado === '1er Grado' && data.grupo === 'F' && data.genero === 'Mujer') {
       countFMatutino++;
       possibleStudent = {id: d.id, ...data};
    }
  });
  console.log('Total Vespertino:', countV);
  console.log('Total Mujeres en 1er Grado F:', countFMatutino);
  console.log('Possible student:', possibleStudent);
}

check();
