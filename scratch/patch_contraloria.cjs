const fs = require('fs');
const path = 'src/pages/dashboard/Contraloria.jsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add state variables inside Contraloria component
const hookStartTarget = `  const [pagosRecientes, setPagosRecientes] = useState([]);`;
const hookReplacement = `  const [pagosRecientes, setPagosRecientes] = useState([]);
  const [pagosSearch, setPagosSearch] = useState('');
  const [pagosGrado, setPagosGrado] = useState('Todos');
  const [pagosGrupo, setPagosGrupo] = useState('Todos');

  const filteredPagos = useMemo(() => {
    return pagosRecientes.filter(p => {
      const matchSearch = p.alumno.toLowerCase().includes(pagosSearch.toLowerCase()) || p.folio.toLowerCase().includes(pagosSearch.toLowerCase());
      const matchGrado = pagosGrado === 'Todos' || p.grado === pagosGrado;
      const matchGrupo = pagosGrupo === 'Todos' || p.grupo === pagosGrupo;
      return matchSearch && matchGrado && matchGrupo;
    });
  }, [pagosRecientes, pagosSearch, pagosGrado, pagosGrupo]);
`;
if (c.includes(hookStartTarget) && !c.includes('const [pagosSearch')) {
    c = c.replace(hookStartTarget, hookReplacement);
}

// 2. Add grado and grupo inside onSnapshot for students
const onSnapshotTarget = `        const concepto = esNuevo ? 'Credencial Escolar y Paquete de Folders' : 'Renovación de Credencial Escolar';`;
const onSnapshotReplacement = `        const grado = data.grado || 'N/A';
        const grupo = data.grupo || 'N/A';
        const concepto = esNuevo ? 'Credencial Escolar y Paquete de Folders' : 'Renovación de Credencial Escolar';`;
if (c.includes(onSnapshotTarget) && !c.includes('const grado = data.grado')) {
    c = c.replace(onSnapshotTarget, onSnapshotReplacement);
}

const itemsPushTarget = `          folio,
          alumno,
          concepto,`;
const itemsPushReplacement = `          folio,
          alumno,
          grado,
          grupo,
          concepto,`;
if (c.includes(itemsPushTarget) && !c.includes('grado,\n          grupo,')) {
    c = c.replace(itemsPushTarget, itemsPushReplacement);
}


// 3. Update UI to add filters and use filteredPagos instead of pagosRecientes
const uiTarget = `          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Ingresos Recientes</h3>
            <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" /> Registrar Pago
            </button>
          </div>
          <table className="min-w-full divide-y divide-slate-200">`;

const uiReplacement = `          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="font-semibold text-slate-700">Ingresos Recientes</h3>
              <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-1" /> Registrar Pago
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-3 rounded-lg border border-slate-200">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por alumno o folio..."
                  value={pagosSearch}
                  onChange={(e) => setPagosSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                <select
                  value={pagosGrado}
                  onChange={(e) => setPagosGrado(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Todos">Todos los grados</option>
                  <option value="1er Grado">1er Grado</option>
                  <option value="2do Grado">2do Grado</option>
                  <option value="3er Grado">3er Grado</option>
                </select>
                <select
                  value={pagosGrupo}
                  onChange={(e) => setPagosGrupo(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Todos">Todos los grupos</option>
                  {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => (
                    <option key={g} value={g}>Grupo {g}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <table className="min-w-full divide-y divide-slate-200">`;
if (c.includes(uiTarget)) {
    c = c.replace(uiTarget, uiReplacement);
}

// Replace pagosRecientes.map with filteredPagos.map only in the 'pagos' tab table body
const tableTarget = `              <tbody className="divide-y divide-slate-200">
                {pagosRecientes.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.folio}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">{p.alumno}</td>`;

const tableReplacement = `              <tbody className="divide-y divide-slate-200">
                {filteredPagos.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.folio}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 font-bold">{p.alumno}</div>
                      <div className="text-xs text-slate-500">{p.grado !== 'N/A' ? \`\${p.grado} - Grupo \${p.grupo}\` : 'Sin grado/grupo asignado'}</div>
                    </td>`;
if (c.includes(tableTarget)) {
    c = c.replace(tableTarget, tableReplacement);
}

fs.writeFileSync(path, c);
console.log("Done");
