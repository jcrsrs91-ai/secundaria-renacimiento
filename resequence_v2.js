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

async function resequenceV2() {
  console.log('Fetching inventario...');
  const invSnapshot = await getDocs(collection(db, 'inventario'));
  
  const counters = {};
  const codeMapping = {}; // maps doc.id to newCode
  const oldCodeToNewCode = {}; // maps old string code to new string code
  
  let updatedInv = 0;
  let skippedInv = 0;
  
  for (const document of invSnapshot.docs) {
    const data = document.data();
    const currentCode = data.codigo || '';
    
    // Determine if we should replace this code
    // Replace if it matches our auto-generated 3-letter semantic code, OR if it's the old fallback formats
    const isSemanticCode = /^[A-Z]{3}-\d+$/.test(currentCode);
    const isOldAutoCode = currentCode.startsWith('INV-RESG-') || currentCode.startsWith('INV-AUTO-');
    
    if (isSemanticCode || isOldAutoCode || currentCode === '') {
      // Re-generate using the new prefix logic
      const prefix = generatePrefix(data.articulo || data.descripcion || '');
      if (!counters[prefix]) counters[prefix] = 0;
      
      counters[prefix]++;
      const newCode = `${prefix}-${String(counters[prefix]).padStart(4, '0')}`;
      
      codeMapping[document.id] = newCode;
      if (currentCode) {
        oldCodeToNewCode[currentCode] = newCode;
      }
      
      if (currentCode !== newCode) {
        await updateDoc(doc(db, 'inventario', document.id), {
          codigo: newCode
        });
        updatedInv++;
      } else {
        // Even if the code didn't change (e.g. VEN-0001 remains VEN-0001), we still record it in mapping for resguardos
        codeMapping[document.id] = newCode;
      }
    } else {
      // It's a manual code (like I4504...), SKIP IT!
      console.log(`Skipping manual code: ${currentCode} for ${data.articulo}`);
      // However, we still map its ID to its OWN code so Resguardos can sync properly
      codeMapping[document.id] = currentCode;
      oldCodeToNewCode[currentCode] = currentCode;
      skippedInv++;
    }
  }
  
  console.log(`Updated ${updatedInv} items, skipped ${skippedInv} manual items in inventario.`);
  
  console.log('Fetching resguardos...');
  const resgSnapshot = await getDocs(collection(db, 'resguardos'));
  let updatedResg = 0;
  
  for (const document of resgSnapshot.docs) {
    const data = document.data();
    let changed = false;
    
    if (data.articulos && Array.isArray(data.articulos)) {
      const newArticulos = data.articulos.map(art => {
        let newCode = art.codigo;
        
        // Match by ID to keep it perfectly synced
        if (art.id && codeMapping[art.id]) {
          newCode = codeMapping[art.id];
        } 
        // Or by exact old string code if no ID
        else if (art.codigo && oldCodeToNewCode[art.codigo]) {
          newCode = oldCodeToNewCode[art.codigo];
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
  
  console.log(`Updated codes in ${updatedResg} resguardos.`);
  process.exit(0);
}

resequenceV2().catch(console.error);
