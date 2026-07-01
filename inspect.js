import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBqHojgiANQWkGmQBQJsIwxRmaC2v6KUaQ",
  authDomain: "web-tec-68.firebaseapp.com",
  projectId: "web-tec-68",
  storageBucket: "web-tec-68.firebasestorage.app",
  messagingSenderId: "616654034170",
  appId: "1:616654034170:web:183c9053253a67316be543",
  measurementId: "G-FJP8HNZG3C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectInventory() {
  const snapshot = await getDocs(collection(db, 'inventario'));
  console.log(`Found ${snapshot.size} items in inventario.`);
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`- ${data.articulo}: ${data.codigo} (Qty: ${data.cantidad})`);
  }
  process.exit(0);
}

inspectInventory().catch(console.error);
