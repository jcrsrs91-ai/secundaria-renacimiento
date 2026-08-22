const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');

// Rename component
c = c.replace(/export default function Contraloria\(\) \{/, 'export default function Inventario() {');

// Change default tab
c = c.replace(/const \[activeTab, setActiveTab\] = useState\('pagos'\);/, "const [activeTab, setActiveTab] = useState('inventario');");

// Strip the entire navbar for Pagos/Gastos/Corte
c = c.replace(/<button\s*onClick=\{\(\) => setActiveTab\('pagos'\)\}[\s\S]*?<\/button>/, '');
c = c.replace(/<button\s*onClick=\{\(\) => setActiveTab\('gastos'\)\}[\s\S]*?<\/button>/, '');
c = c.replace(/<button\s*onClick=\{\(\) => setActiveTab\('corte'\)\}[\s\S]*?<\/button>/, '');

// The CajaLockScreen ternary is tricky. In Contraloria_original.jsx, it looks like:
// {(!cajaTurno && (activeTab === 'pagos' || activeTab === 'gastos' || activeTab === 'corte')) ? (
//    <CajaLockScreen ... />
// ) : (
//    <>
//      {activeTab === 'pagos' && ...}
//      ...
//      {activeTab === 'resguardos' && ...}
//    </>
// )}
//
// We can just leave this lock screen logic! If activeTab is 'inventario' or 'resguardos', it evaluates to false, so it renders the `else` block (the tabs we want).
// BUT we should remove the 'pagos', 'gastos', 'corte' JSX to avoid compiling unused variables or massive file sizes.
// Actually, to be safe and avoid breaking anything, we could just LEAVE the unused JSX in `Inventario.jsx`! It won't render because we removed the buttons to switch to them, and the default tab is 'inventario'.
// Wait! Leaving it might cause issues if it uses `handlePrintTicketPago` which we might delete, etc.
// No, if we just leave it, it works perfectly. It's just dead code.
// Let's remove the whole `cajaTurno` lock screen wrapping so it's clean, or just leave it.
// Leaving it is the safest 0-risk approach to get it working in 10 seconds.
// But wait, what about the name of the component? `export default function Inventario()`.
// I will just remove the buttons, change the default tab, and it's done!

fs.writeFileSync('src/pages/dashboard/Inventario.jsx', c);
console.log("Inventario restored from original and modified.");
