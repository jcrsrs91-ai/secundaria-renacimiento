const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const target = "const [pagosGrupo, setPagosGrupo] = useState('Todos');";
const inject = `const [gastos, setGastos] = useState([]);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [gastoFormData, setGastoFormData] = useState({ concepto: '', monto: '', fecha: new Date().toISOString().split('T')[0] });`;

if (!c.includes('const [gastos, setGastos] = useState([]);')) {
  c = c.replace(target, target + "\n  " + inject);
}

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log("Gastos state restored!");
