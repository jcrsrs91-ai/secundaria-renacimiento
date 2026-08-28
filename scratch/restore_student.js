import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqHojgiANQWkGmQBQJsIwxRmaC2v6KUaQ",
  authDomain: "web-tec-68.firebaseapp.com",
  projectId: "web-tec-68"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function restore() {
  const q = query(collection(db, "students"), where("curp", "==", "PIGL141120MGRNMZA9"));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
     console.log("No student found with that CURP");
     return;
  }
  
  querySnapshot.forEach(async (d) => {
    await updateDoc(doc(db, "students", d.id), {
       turno: 'Vespertino',
       grupo: 'L'
    });
    console.log("RESTORED student to Vespertino L!");
  });
}

restore();
