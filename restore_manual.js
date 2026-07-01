import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

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

async function restoreManual() {
  const logContent = fs.readFileSync('C:\\Users\\Julio\\.gemini\\antigravity\\brain\\1a65a11c-50d4-42e9-8e32-0a0674212f00\\.system_generated\\tasks\\task-4963.log', 'utf8');
  
  // Find all manual codes
  const lines = logContent.split('\n');
  const manualItems = []; // { articulo, codigo }
  
  for (const line of lines) {
    const match = line.match(/^- (.*?): (.*?) \(Qty/);
    if (match) {
      const articulo = match[1];
      const codigo = match[2];
      
      // If code is not auto-generated semantic (like BUT-0001), not INV-RESG-, not INV-AUTO-
      if (!/^[A-Z]{3}-\d+$/.test(codigo) && !codigo.startsWith('INV-RESG-') && !codigo.startsWith('INV-AUTO-')) {
        manualItems.push({ articulo, codigo });
      }
    }
  }
  
  console.log(`Found ${manualItems.length} manual items to restore.`);
  
  const invSnapshot = await getDocs(collection(db, 'inventario'));
  const restoredIds = new Set();
  const idToManualMap = {};
  
  let restoredCount = 0;
  
  for (const item of manualItems) {
    // Find an item in inventario with the same articulo that hasn't been restored yet
    const docToRestore = invSnapshot.docs.find(d => {
      const data = d.data();
      return data.articulo === item.articulo && !restoredIds.has(d.id);
    });
    
    if (docToRestore) {
      restoredIds.add(docToRestore.id);
      idToManualMap[docToRestore.id] = item.codigo;
      
      await updateDoc(doc(db, 'inventario', docToRestore.id), {
        codigo: item.codigo
      });
      restoredCount++;
      console.log(`Restored ${item.codigo} for ${item.articulo}`);
    } else {
      console.log(`COULD NOT FIND doc for ${item.articulo} to restore ${item.codigo}`);
    }
  }
  
  console.log(`Restored ${restoredCount} items in inventario.`);
  
  // Now restore in resguardos
  console.log('Restoring resguardos...');
  const resgSnapshot = await getDocs(collection(db, 'resguardos'));
  let updatedResg = 0;
  
  for (const document of resgSnapshot.docs) {
    const data = document.data();
    let changed = false;
    
    if (data.articulos && Array.isArray(data.articulos)) {
      const newArticulos = data.articulos.map(art => {
        if (art.id && idToManualMap[art.id]) {
          changed = true;
          return { ...art, codigo: idToManualMap[art.id] };
        }
        return art;
      });
      
      if (changed) {
        await updateDoc(doc(db, 'resguardos', document.id), { articulos: newArticulos });
        updatedResg++;
      }
    }
  }
  
  console.log(`Restored manual codes in ${updatedResg} resguardos.`);
  process.exit(0);
}

restoreManual().catch(console.error);
