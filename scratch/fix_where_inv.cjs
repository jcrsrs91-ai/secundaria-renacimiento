const fs = require('fs');

let inv = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');

inv = inv.replace(
  "import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';",
  "import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp, where } from 'firebase/firestore';"
);

fs.writeFileSync('src/pages/dashboard/Inventario.jsx', inv);
console.log("Fixed where import in Inventario");
