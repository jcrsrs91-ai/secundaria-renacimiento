const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const modalCode = `
    {showPagoAdminModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-xl text-slate-800 flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-primary-600" /> Registrar Pago Libre
              </h3>
              <button onClick={() => setShowPagoAdminModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleGuardarPagoManual} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Ingreso</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setPagoFormData({...pagoFormData, tipo: 'administrativo', concepto: ''})} className={\`p-3 border rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all \${pagoFormData.tipo === 'administrativo' ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500' : 'bg-white text-slate-500 hover:bg-slate-50'}\`}>
                    <FileText className="w-5 h-5" /> Trámites Generales
                  </button>
                  <button type="button" onClick={() => setPagoFormData({...pagoFormData, tipo: 'extraordinario', concepto: 'Examen Extraordinario de '})} className={\`p-3 border rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all \${pagoFormData.tipo === 'extraordinario' ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500' : 'bg-white text-slate-500 hover:bg-slate-50'}\`}>
                    <AlertTriangle className="w-5 h-5" /> Examen Extraordinario
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Persona / Alumno</label>
                <input type="text" required value={pagoFormData.nombre} onChange={e => setPagoFormData({...pagoFormData, nombre: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Ej. Juan Pérez López" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Concepto de Pago</label>
                {pagoFormData.tipo === 'administrativo' ? (
                  <select required value={pagoFormData.concepto} onChange={e => setPagoFormData({...pagoFormData, concepto: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="">Selecciona un concepto...</option>
                    <option value="Constancia de Estudios">Constancia de Estudios</option>
                    <option value="Reposición de Credencial">Reposición de Credencial</option>
                    <option value="Paquete Escolar">Paquete Escolar</option>
                    <option value="Donación / Aportación">Donación / Aportación Voluntaria</option>
                    <option value="Otro">Otro (Especificar en notas)</option>
                  </select>
                ) : (
                  <input type="text" required value={pagoFormData.concepto} onChange={e => setPagoFormData({...pagoFormData, concepto: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500" placeholder="Ej. Examen Extraordinario de Matemáticas" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Monto Cobrado ($)</label>
                  <input type="number" step="0.01" required value={pagoFormData.monto} onChange={e => setPagoFormData({...pagoFormData, monto: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-bold text-emerald-600" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Método de Pago</label>
                  <select value={pagoFormData.metodo} onChange={e => setPagoFormData({...pagoFormData, metodo: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Depósito">Depósito Bancario</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPagoAdminModal(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> {isSubmitting ? 'Guardando...' : 'Registrar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

c = c.replace(/<\/>\s*\);\s*\}/, modalCode + '\n    </>\n  );\n}');

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log('Restored modal at root level');
