import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";
import fs from "fs";

// Need firebase config from src/lib/firebase.js
// But it's easier to just read src/lib/firebase.js directly in node if it's a module
// Since it's a vite project, maybe it has type: module? Yes, it's a vite project.
// Or I can just parse the config out of the file.

const code = fs.readFileSync('src/lib/firebase.js', 'utf8');
const configMatch = code.match(/firebaseConfig\s*=\s*(\{[\s\S]*?\});/);

if (!configMatch) {
  console.log("Could not find firebase config");
  process.exit(1);
}

const firebaseConfig = eval('(' + configMatch[1] + ')');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, "students"), limit(5));
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log("Student:", data.nombres, data.apellidoPaterno);
    console.log("- Calificaciones:", JSON.stringify(data.calificaciones));
    console.log("- Historial:", JSON.stringify(data.historial));
  });
  process.exit(0);
}

run().catch(console.error);
