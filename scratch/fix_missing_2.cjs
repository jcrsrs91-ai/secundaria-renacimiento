const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// Inject corteConfig state
const targetState = "const [activeIngresoTab, setActiveIngresoTab] = useState('generales');";
if (!c.includes('const [corteConfig, setCorteConfig]')) {
  c = c.replace(targetState, `const [corteConfig, setCorteConfig] = useState({ fechaInicio: new Date().toISOString().split('T')[0], fechaFin: new Date().toISOString().split('T')[0], turno: 'Ambos' });\n  const [activeIngresoTab, setActiveIngresoTab] = useState('generales');`);
}

// Add FileSpreadsheet, Wallet, AlertTriangle if missing
if (!c.includes('FileSpreadsheet')) {
   c = c.replace("from 'lucide-react';", ", FileSpreadsheet } from 'lucide-react';");
}
if (!c.includes('Wallet')) {
   c = c.replace("from 'lucide-react';", ", Wallet } from 'lucide-react';");
}
if (!c.includes('AlertTriangle')) {
   c = c.replace("from 'lucide-react';", ", AlertTriangle } from 'lucide-react';");
}

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c.replace(/\} ,/g, ','));
console.log("Fixed missing items unconditionally");
