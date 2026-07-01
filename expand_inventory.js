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

const generateCodeRange = (baseCode, quantity) => {
  const qty = Number(quantity) || 1;
  if (qty <= 1) return { codes: [baseCode], display: baseCode };

  const match = baseCode.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const startNum = parseInt(numStr, 10);
    const padLength = numStr.length;
    
    const codes = [];
    for (let i = 0; i < qty; i++) {
      const currentNumStr = String(startNum + i).padStart(padLength, '0');
      codes.push(`${prefix}${currentNumStr}`);
    }
    return codes;
  }
  return [baseCode];
};

async function expandInventory() {
  console.log('Fetching inventario...');
  const snapshot = await getDocs(collection(db, 'inventario'));
  let expanded = 0;
  
  for (const document of snapshot.docs) {
    const data = document.data();
    
    // Si la cantidad es mayor a 1, el código NO incluye 'al' y no es INV-AUTO (INV-AUTO ya deberían estar migrados pero por si acaso)
    if (data.cantidad > 1 && data.codigo && !data.codigo.includes('al') && !data.codigo.includes('INV-AUTO-')) {
      console.log(`Expanding: ${data.articulo} (${data.codigo}) - Qty: ${data.cantidad}`);
      
      const codes = generateCodeRange(data.codigo, data.cantidad);
      if (codes.length > 1) {
        // Delete original
        await deleteDoc(doc(db, 'inventario', document.id));
        
        // Add new ones
        for (const code of codes) {
          await addDoc(collection(db, 'inventario'), {
            ...data,
            codigo: code,
            cantidad: 1
          });
        }
        expanded++;
      }
    }
  }
  
  console.log(`Expansion complete. Expanded ${expanded} inventory items.`);
  process.exit(0);
}

expandInventory().catch(console.error);
