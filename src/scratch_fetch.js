import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqHojgiANQWkGmQBQJsIwxRmaC2v6KUaQ",
  authDomain: "web-tec-68.firebaseapp.com",
  projectId: "web-tec-68"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const querySnapshot = await getDocs(collection(db, "configuracion"));
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
  });
  const q2 = await getDocs(collection(db, "settings"));
  q2.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
  });
  console.log("Done");
  process.exit();
}
run().catch(console.error);
