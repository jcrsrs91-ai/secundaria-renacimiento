const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');
const searchStr = "import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';";
const replStr = "import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp, getDocs } from 'firebase/firestore';";
c = c.replace(searchStr, replStr);
fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log('Fixed imports again');
