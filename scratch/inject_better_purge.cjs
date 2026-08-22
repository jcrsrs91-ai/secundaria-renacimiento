const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const newBtn = `
const [isPurging, setIsPurging] = useState(false);
const purgeDatabase = async () => {
    try {
        setIsPurging(true);
        const batch = writeBatch(db); 
        const q1 = await getDocs(collection(db, 'pagos_administrativos')); 
        q1.forEach(d => batch.delete(d.ref)); 
        const q2 = await getDocs(collection(db, 'pagos_extraordinarios')); 
        q2.forEach(d => batch.delete(d.ref)); 
        await batch.commit(); 
        alert('¡Pagos de prueba eliminados correctamente!'); 
        window.location.reload();
    } catch(err) {
        alert('Error: ' + err.message);
        console.error(err);
    } finally {
        setIsPurging(false);
    }
};
`;

if (!c.includes('isPurging')) {
    // Inject state and function inside component
    c = c.replace('export default function Contraloria() {', 'export default function Contraloria() {\n' + newBtn);
    
    // Update button JSX
    c = c.replace(/<button onClick=\{async \(\) => \{ const batch = writeBatch\(db\);.*?<\/button>/s, 
                  `<button onClick={purgeDatabase} disabled={isPurging} className="bg-red-600 text-white font-bold p-2 rounded-xl mb-4 w-full disabled:opacity-50 flex justify-center items-center gap-2">
                     {isPurging ? 'Eliminando datos, por favor espera...' : 'PURGAR BASE DE DATOS Y REINICIAR (ELIMINARÁ TODOS LOS COBROS)'}
                   </button>`);
    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
    console.log('Injected better purge button');
} else {
    console.log('Already injected');
}
