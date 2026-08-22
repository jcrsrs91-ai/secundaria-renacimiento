const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');
const importStr = "import { getDocs, writeBatch } from 'firebase/firestore';\n";
if (!c.includes('PURGAR BASE DE DATOS')) {
    c = importStr + c;
    const btnStr = `<button onClick={async () => { const batch = writeBatch(db); const q1 = await getDocs(collection(db, 'pagos_administrativos')); q1.forEach(d => batch.delete(d.ref)); const q2 = await getDocs(collection(db, 'pagos_extraordinarios')); q2.forEach(d => batch.delete(d.ref)); await batch.commit(); alert('¡Pagos de prueba eliminados!'); window.location.reload(); }} className="bg-red-600 text-white font-bold p-2 rounded-xl mb-4 w-full">PURGAR BASE DE DATOS Y REINICIAR (ELIMINARÁ TODOS LOS COBROS)</button>`;
    c = c.replace(/<div className="flex flex-col lg:flex-row gap-4/, btnStr + '\n              <div className="flex flex-col lg:flex-row gap-4');
    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
    console.log('Injected Purge button');
} else {
    console.log('Already injected');
}
