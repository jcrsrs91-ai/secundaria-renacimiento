const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// Inject the Gasto Modal JSX near the bottom before the last </div>
const gastoModalJSX = `
      {showGastoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-rose-500" /> Registrar Nuevo Egreso
              </h3>
              <button onClick={() => setShowGastoModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría del Gasto</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-slate-700"
                  value={gastoFormData.categoria || 'Otros'}
                  onChange={e => setGastoFormData({...gastoFormData, categoria: e.target.value})}
                >
                  <option value="Mantenimiento">Mantenimiento (Climas, Herrería, etc.)</option>
                  <option value="Papelería">Papelería y Oficina</option>
                  <option value="Limpieza">Artículos de Limpieza</option>
                  <option value="Eventos">Eventos y Convivencias</option>
                  <option value="Otros">Otros Egresos</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Concepto Detallado</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Ej. Reparación clima 3er grado"
                  value={gastoFormData.concepto}
                  onChange={e => setGastoFormData({...gastoFormData, concepto: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto Retirado de Caja ($)</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xl font-mono text-rose-600 font-bold"
                  placeholder="0.00"
                  value={gastoFormData.monto}
                  onChange={e => setGastoFormData({...gastoFormData, monto: e.target.value})}
                />
              </div>
              <button 
                onClick={async () => {
                  if (!gastoFormData.concepto || !gastoFormData.monto) return alert('Completa todos los campos');
                  try {
                    await addDoc(collection(db, 'gastos'), {
                      concepto: gastoFormData.concepto,
                      categoria: gastoFormData.categoria || 'Otros',
                      monto: parseFloat(gastoFormData.monto),
                      fecha: new Date().toISOString(),
                      cajaId: cajaTurno?.id || 'sin-caja',
                      registradoPor: currentUser?.email || 'admin'
                    });
                    toast.success('Gasto registrado correctamente');
                    setShowGastoModal(false);
                    setGastoFormData({ concepto: '', monto: '', fecha: new Date().toISOString().split('T')[0], categoria: 'Otros' });
                  } catch (e) {
                    toast.error('Error al guardar gasto');
                  }
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors mt-4"
              >
                Registrar Salida de Efectivo
              </button>
            </div>
          </div>
        </div>
      )}
`;

if (!c.includes('Categoría del Gasto')) {
    c = c.replace(/\{\s*\/\*\s*MODAL DE GASTOS\s*\*\/\s*\}\s*$/m, gastoModalJSX); // Just in case
    // If not found, place it before the closing `)}</div></>);`
    if (!c.includes(gastoModalJSX)) {
        c = c.replace(/(}\s*)(\s*<\/div>\n\s*<\/>\n\s*\);\n\s*\}\n*$)/, '$1\n' + gastoModalJSX + '\n$2');
    }
    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
    console.log("Injected Gasto Modal");
} else {
    console.log("Already injected Gasto Modal");
}
