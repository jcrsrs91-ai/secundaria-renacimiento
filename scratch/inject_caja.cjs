const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const importAuth = "import { useAuth } from '../../context/AuthContext';\nimport CajaLockScreen from '../../components/CajaLockScreen';\n";

if (!c.includes('CajaLockScreen')) {
    // 1. Add imports
    c = c.replace(/import \{ db \} from '\.\.\/\.\.\/firebase';/, importAuth + "import { db } from '../../firebase';");

    // 2. Add state
    const stateInjections = `
  const { currentUser } = useAuth();
  const [cajaTurno, setCajaTurno] = useState(null); // { id, turno, fondoInicial }
  const [gastos, setGastos] = useState([]);
  
  useEffect(() => {
    // Escuchar si ya hay una caja abierta para este usuario
    const q = query(collection(db, 'cajas'), where('estado', '==', 'abierta'));
    const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
           // Asumimos que solo hay una caja abierta a la vez
           const doc = snapshot.docs[0];
           setCajaTurno({ id: doc.id, ...doc.data() });
        } else {
           setCajaTurno(null);
        }
    });
    return () => unsub();
  }, []);
  
  // Escuchar gastos (egresos) de la caja actual
  useEffect(() => {
    if (!cajaTurno) return;
    const q = query(collection(db, 'gastos'), where('cajaId', '==', cajaTurno.id));
    const unsub = onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach(d => items.push({ id: d.id, ...d.data() }));
        setGastos(items);
    });
    return () => unsub();
  }, [cajaTurno]);
`;
    c = c.replace('export default function Contraloria() {', 'export default function Contraloria() {\n' + stateInjections);

    // 3. Wrap return with CajaLockScreen for specific tabs
    // The main return is: `return (\n    <>\n    <div className={\`space-y-6 ${printMode ? "hidden" : ""} print:${receiptPago ? "hidden" : "block"}\`}>`
    // We will conditionally render the content.
    
    const targetReturn = 'return (\n    <>\n    <div className={`space-y-6 ${printMode ? "hidden" : ""} print:${receiptPago ? "hidden" : "block"}`}>';
    const replaceReturn = `return (
    <>
    <div className={\`space-y-6 \${printMode ? "hidden" : ""} print:\${receiptPago ? "hidden" : "block"}\`}>
      {(!cajaTurno && (activeTab === 'pagos' || activeTab === 'gastos' || activeTab === 'corte')) ? (
         <CajaLockScreen userEmail={currentUser?.email} onCajaAbierta={(id, turno, fondo) => setCajaTurno({id, turno, fondoInicial: fondo})} />
      ) : (
        <>
`;
    
    // We must close the `<>` at the very end of the file.
    // Let's find the end of the file and replace `</>\n  );` with `</>\n  )}</div></>);`
    
    c = c.replace(targetReturn, replaceReturn);
    c = c.replace(/<\/div>\n\s*<\/>\n\s*\);\n\s*\}\n*$/, '</div>\n    </>\n    )}\n    </div>\n    </>\n  );\n}');

    // 4. Update 'cajaId' injection when making payments
    // Look for `addDoc(collection(db, 'pagos_administrativos')` and `pagos_extraordinarios`
    // and inject `cajaId: cajaTurno?.id,`
    
    c = c.replace(/createdAt: serverTimestamp\(\),/g, "createdAt: serverTimestamp(),\n          cajaId: cajaTurno?.id || 'sin-caja',");

    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
    console.log("Injected Caja Lock and Hooks");
} else {
    console.log("Already injected CajaLockScreen");
}
