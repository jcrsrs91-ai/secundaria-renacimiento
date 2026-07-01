import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

const generatePrefix = (name) => {
  if (!name) return 'ART';
  const cleanName = name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-zA-Z\s]/g, "") // Quitar números y caracteres especiales
    .trim()
    .toUpperCase();
  
  const words = cleanName.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 'ART';
  
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    return (words[0].substring(0, 2) + words[1][0]).toUpperCase();
  } else {
    return (words[0].substring(0, 3)).toUpperCase().padEnd(3, 'X');
  }
};

async function migrateResguardos() {
  console.log('Fetching resguardos...');
  const snapshot = await getDocs(collection(db, 'resguardos'));
  let updated = 0;
  
  for (const document of snapshot.docs) {
    const data = document.data();
    let changed = false;
    
    if (data.articulos && Array.isArray(data.articulos)) {
      const newArticulos = data.articulos.map(art => {
        if (art.codigo && art.codigo.includes('INV-AUTO-')) {
          changed = true;
          const prefix = generatePrefix(art.descripcion || art.articulo || art.marca);
          const newCode = art.codigo.replace(/INV-AUTO-/g, `${prefix}-`);
          console.log(`Migrating: ${art.codigo} -> ${newCode}`);
          return { ...art, codigo: newCode };
        }
        return art;
      });
      
      if (changed) {
        await updateDoc(doc(db, 'resguardos', document.id), { articulos: newArticulos });
        updated++;
        console.log(`Updated document: ${document.id}`);
      }
    }
  }
  
  console.log(`Migration complete. Updated ${updated} resguardos.`);
  process.exit(0);
}

migrateResguardos().catch(console.error);
