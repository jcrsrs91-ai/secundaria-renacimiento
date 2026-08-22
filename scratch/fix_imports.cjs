const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');
c = c.replace("import { getDocs, writeBatch } from 'firebase/firestore';\n", '');
if (!c.includes('getDocs')) {
    c = c.replace('writeBatch, serverTimestamp', 'writeBatch, getDocs, serverTimestamp');
}
fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log('Fixed imports');
