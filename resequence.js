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
  
  // Use ONLY the first word to group things like "Butacas Aula 1" and "Butacas Aula 2" into "BUT"
  return words[0].substring(0, 3).toUpperCase().padEnd(3, 'X');
};

async function resequenceAll() {
  console.log('Fetching inventario...');
  const invSnapshot = await getDocs(collection(db, 'inventario'));
  
  const counters = {};
  const codeMapping = {}; // maps doc.id to newCode
  const oldCodeToNewCode = {}; // maps old string code to new string code
  
  let updatedInv = 0;
  
  for (const document of invSnapshot.docs) {
    const data = document.data();
    const prefix = generatePrefix(data.articulo || data.descripcion || '');
    if (!counters[prefix]) counters[prefix] = 0;
    
    // Increment counter
    counters[prefix]++;
    const newCode = `${prefix}-${String(counters[prefix]).padStart(4, '0')}`;
    
    codeMapping[document.id] = newCode;
    if (data.codigo) {
      oldCodeToNewCode[data.codigo] = newCode;
    }
    
    // Update inventory item
    await updateDoc(doc(db, 'inventario', document.id), {
      codigo: newCode
    });
    updatedInv++;
  }
  
  console.log(`Updated ${updatedInv} items in inventario.`);
  
  console.log('Fetching resguardos...');
  const resgSnapshot = await getDocs(collection(db, 'resguardos'));
  let updatedResg = 0;
  
  for (const document of resgSnapshot.docs) {
    const data = document.data();
    let changed = false;
    
    if (data.articulos && Array.isArray(data.articulos)) {
      const newArticulos = data.articulos.map(art => {
        let newCode = null;
        
        // Try to find the new code by ID first
        if (art.id && codeMapping[art.id]) {
          newCode = codeMapping[art.id];
        } 
        // Or by old code match
        else if (art.codigo && oldCodeToNewCode[art.codigo]) {
          newCode = oldCodeToNewCode[art.codigo];
        }
        
        // If it's a range like BUT-001 al BUT-005, this script won't perfectly map it if it wasn't split.
        // But since we checked earlier, they didn't have grouped ranges in inventario (Expanded 0 items).
        // If they have ranges in resguardos that aren't mapped, we'll try to re-generate them based on their old prefix.
        if (!newCode && art.codigo) {
           // It might be a consolidated range in resguardo.
           // We will just re-generate its prefix and leave the numbers?
           // Actually, if it's in resguardos, it SHOULD have an ID or exact code match because it was pulled from inventario!
        }
        
        if (newCode && newCode !== art.codigo) {
          changed = true;
          return { ...art, codigo: newCode };
        }
        return art;
      });
      
      if (changed) {
        await updateDoc(doc(db, 'resguardos', document.id), { articulos: newArticulos });
        updatedResg++;
      }
    }
  }
  
  console.log(`Updated ${updatedResg} resguardos.`);
  process.exit(0);
}

resequenceAll().catch(console.error);
