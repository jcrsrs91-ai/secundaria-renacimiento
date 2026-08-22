const fs = require('fs');
const path = 'src/pages/dashboard/Contraloria.jsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Hook state changes & Firebase query for resguardos
const onSnapshotInventarioEnd = `      setInventario(items);
    });
    return () => unsubscribe();
  }, []);`;

const onSnapshotResguardos = `

  useEffect(() => {
    const q = query(collection(db, 'actas_resguardo')); // Asumiendo que es actas_resguardo o resguardos. Intentaremos con 'actas_resguardo' o 'resguardos'.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setResguardos(items.reverse());
    }, (error) => {
      console.warn("No se pudo cargar la colección resguardos:", error);
    });
    return () => unsubscribe();
  }, []);
`;

if (!c.includes("collection(db, 'actas_resguardo')")) {
    c = c.replace(onSnapshotInventarioEnd, onSnapshotInventarioEnd + onSnapshotResguardos);
}

// 2. Navigation changes
const oldNav = `      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pagos')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'pagos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <DollarSign className="w-4 h-4 mr-2" /> Registro de Pagos
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'inventario' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <PackageOpen className="w-4 h-4 mr-2" /> Inventario de Mobiliario
          </button>
          <button
            onClick={() => setActiveTab('resguardos')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'resguardos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <FileText className="w-4 h-4 mr-2" /> Historial de Resguardos
          </button>
        </nav>
      </div>`;

const newNav = `      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pagos')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'pagos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <DollarSign className="w-4 h-4 mr-2" /> Control de Ingresos
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${(activeTab === 'inventario' || activeTab === 'resguardos') ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <PackageOpen className="w-4 h-4 mr-2" /> Control de Bienes Escolares
          </button>
        </nav>
      </div>

      {(activeTab === 'inventario' || activeTab === 'resguardos') && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 mb-6 flex gap-4">
          <button
            onClick={() => setActiveTab('inventario')}
            className={\`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center \${activeTab === 'inventario' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}\`}
          >
            <PackageOpen className="w-4 h-4 mr-2" /> Inventario Físico
          </button>
          <button
            onClick={() => setActiveTab('resguardos')}
            className={\`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center \${activeTab === 'resguardos' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}\`}
          >
            <FileText className="w-4 h-4 mr-2" /> Historial de Resguardos (Actas)
          </button>
        </div>
      )}`;

if (!c.includes('Control de Bienes Escolares')) {
    c = c.replace(oldNav, newNav);
}

// 3. Fix resguardos table mapping
const oldResguardosTbody = `              <tbody className="divide-y divide-slate-200">
                {pagosRecientes.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.folio}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 font-bold">{p.alumno}</div>
                      <div className="text-xs text-slate-500">{p.grado !== 'N/A' ? \`\${p.grado} - Grupo \${p.grupo}\` : 'Sin grado/grupo asignado'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.concepto}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{p.monto}</td>
                    <td className="px-6 py-4 text-sm">
                      {p.estado === 'Pagado' ? (
                        <span className="text-emerald-600 flex items-center font-bold">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Pagado el {p.fecha}
                        </span>
                      ) : (
                        <button 
                          onClick={() => registrarCobro(p.id)}
                          className="px-3 py-1 bg-primary-600 text-white rounded-md text-xs font-bold hover:bg-primary-700 shadow-sm"
                        >
                          Registrar Cobro
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>`;

const newResguardosTbody = `              <tbody className="divide-y divide-slate-200">
                {resguardos.length > 0 ? resguardos.filter(r => 
                    r.resguardante?.toLowerCase().includes(resguardoSearch.toLowerCase()) ||
                    r.folio?.toLowerCase().includes(resguardoSearch.toLowerCase())
                ).map(r => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{r.folio || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.fecha ? (r.fecha.toDate ? r.fecha.toDate().toLocaleDateString() : r.fecha) : 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">{r.resguardante || 'Desconocido'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.area || r.cargo || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {r.articulos ? r.articulos.length : 0} artículos
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                        <button 
                          onClick={() => {
                            setEditingResguardo(r);
                            setModalOpen('editResguardo');
                          }}
                          className="text-primary-600 hover:text-primary-800 font-medium text-xs"
                        >
                          Ver / Editar
                        </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 italic">No hay actas de resguardo registradas.</td>
                  </tr>
                )}
              </tbody>`;

// We use regex to carefully match the old table body inside the resguardos tab
// Wait, I will just use string index replacement to be perfectly safe, as resguardos comes AFTER 'activeTab === 'resguardos''

const resguardosIndex = c.indexOf("{activeTab === 'resguardos' &&");
if (resguardosIndex !== -1 && c.includes('pagosRecientes.map(p => (', resguardosIndex)) {
    const tableIndex = c.indexOf('<tbody', resguardosIndex);
    const tableEndIndex = c.indexOf('</tbody>', tableIndex) + 8;
    c = c.substring(0, tableIndex) + newResguardosTbody + c.substring(tableEndIndex);
}

fs.writeFileSync(path, c);
console.log("Master patch for UI structure applied successfully");
