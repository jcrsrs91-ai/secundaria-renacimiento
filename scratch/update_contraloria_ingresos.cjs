const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// 1. Add Icons and hooks
if (!c.includes('Calendar as CalendarIcon')) {
   c = c.replace(
     "import { Users, BookOpen, Clock, FileText, CheckCircle2, ShieldCheck, Search, Filter, Megaphone, Activity, Download, Printer, Plus, Edit, Trash2, X, AlertTriangle, Image as ImageIcon, BarChart as BarChartIcon, PieChart as PieChartIcon, Check, Package, PackageOpen, LayoutDashboard, Wallet, TrendingUp, TrendingDown, ArrowLeftRight, Settings, ScanLine, Smartphone } from 'lucide-react';",
     "import { Users, BookOpen, Clock, FileText, CheckCircle2, ShieldCheck, Search, Filter, Megaphone, Activity, Download, Printer, Plus, Edit, Trash2, X, AlertTriangle, Image as ImageIcon, BarChart as BarChartIcon, PieChart as PieChartIcon, Check, Package, PackageOpen, LayoutDashboard, Wallet, TrendingUp, TrendingDown, ArrowLeftRight, Settings, ScanLine, Smartphone, Calendar as CalendarIcon, FileSpreadsheet } from 'lucide-react';"
   );
}

// 2. Add State variables
const stateTarget = "const [activeTab, setActiveTab] = useState('pagos');";
const stateReplacement = `const [activeTab, setActiveTab] = useState('pagos');

  // Nuevos estados para Ingresos Avanzados
  const [activeIngresoTab, setActiveIngresoTab] = useState('generales');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [pagosAdmin, setPagosAdmin] = useState([]);
  const [pagosExtra, setPagosExtra] = useState([]);
  
  const [showPagoAdminModal, setShowPagoAdminModal] = useState(false);
  const [pagoFormData, setPagoFormData] = useState({
    nombre: '', concepto: '', monto: '', metodo: 'Efectivo', tipo: 'administrativo', fecha: new Date().toISOString().split('T')[0]
  });
`;
if (!c.includes('activeIngresoTab')) {
    c = c.replace(stateTarget, stateReplacement);
}

// 3. Add useEffect and Filtering Logic
const effectTarget = `  useEffect(() => {
    const q = query(collection(db, 'inventario'));`;
const effectReplacement = `  // Efecto para Pagos Administrativos y Extraordinarios
  useEffect(() => {
    const qAdmin = query(collection(db, 'pagos_administrativos'));
    const unsubAdmin = onSnapshot(qAdmin, snap => {
      setPagosAdmin(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const qExtra = query(collection(db, 'pagos_extraordinarios'));
    const unsubExtra = onSnapshot(qExtra, snap => {
      setPagosExtra(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => { unsubAdmin(); unsubExtra(); };
  }, []);

  // Lógica de Filtros y Combinación de Ingresos
  const todosLosPagosGenerales = [
    ...pagosRecientes.map(p => ({ ...p, tipoIngreso: 'sistema' })),
    ...pagosAdmin.map(p => ({ 
      ...p, 
      tipoIngreso: 'manual', 
      folio: p.id.substring(0, 6).toUpperCase(), 
      alumno: p.nombre, 
      montoNum: parseFloat(p.monto), 
      monto: \`$\${parseFloat(p.monto).toFixed(2)}\`,
      pagoFecha: p.createdAt 
    }))
  ].sort((a, b) => {
     const dateA = a.pagoFecha?.toDate ? a.pagoFecha.toDate() : new Date(a.pagoFecha || 0);
     const dateB = b.pagoFecha?.toDate ? b.pagoFecha.toDate() : new Date(b.pagoFecha || 0);
     return dateB - dateA;
  });

  const filteredPagosGenerales = todosLosPagosGenerales.filter(p => {
    const matchesSearch = !pagosSearch || p.alumno?.toLowerCase().includes(pagosSearch.toLowerCase()) || p.folio?.toLowerCase().includes(pagosSearch.toLowerCase());
    const matchesGrado = pagosGrado === 'Todos' || p.grado === pagosGrado;
    const matchesGrupo = pagosGrupo === 'Todos' || p.grupo === pagosGrupo;
    
    let matchesFecha = true;
    if (fechaInicio || fechaFin) {
       const pDate = p.pagoFecha?.toDate ? p.pagoFecha.toDate() : new Date(p.pagoFecha || new Date());
       pDate.setHours(0,0,0,0);
       if (fechaInicio && new Date(fechaInicio + 'T00:00:00') > pDate) matchesFecha = false;
       if (fechaFin && new Date(fechaFin + 'T23:59:59') < pDate) matchesFecha = false;
    }
    
    return matchesSearch && matchesGrado && matchesGrupo && matchesFecha;
  });

  const filteredPagosExtra = pagosExtra.map(p => ({
      ...p, 
      folio: p.id.substring(0, 6).toUpperCase(), 
      alumno: p.nombre, 
      montoNum: parseFloat(p.monto), 
      monto: \`$\${parseFloat(p.monto).toFixed(2)}\`,
      pagoFecha: p.createdAt 
  })).filter(p => {
    const matchesSearch = !pagosSearch || p.alumno?.toLowerCase().includes(pagosSearch.toLowerCase());
    let matchesFecha = true;
    if (fechaInicio || fechaFin) {
       const pDate = p.pagoFecha?.toDate ? p.pagoFecha.toDate() : new Date(p.pagoFecha || new Date());
       pDate.setHours(0,0,0,0);
       if (fechaInicio && new Date(fechaInicio + 'T00:00:00') > pDate) matchesFecha = false;
       if (fechaFin && new Date(fechaFin + 'T23:59:59') < pDate) matchesFecha = false;
    }
    return matchesSearch && matchesFecha;
  }).sort((a, b) => {
     const dateA = a.pagoFecha?.toDate ? a.pagoFecha.toDate() : new Date(a.pagoFecha || 0);
     const dateB = b.pagoFecha?.toDate ? b.pagoFecha.toDate() : new Date(b.pagoFecha || 0);
     return dateB - dateA;
  });

  const handleGuardarPagoManual = async (e) => {
    e.preventDefault();
    if(!pagoFormData.nombre || !pagoFormData.concepto || !pagoFormData.monto) {
      toast.error('Llena todos los campos.');
      return;
    }
    setIsSubmitting(true);
    try {
      const collectionName = pagoFormData.tipo === 'administrativo' ? 'pagos_administrativos' : 'pagos_extraordinarios';
      await addDoc(collection(db, collectionName), {
        nombre: pagoFormData.nombre,
        concepto: pagoFormData.concepto,
        monto: parseFloat(pagoFormData.monto),
        metodo: pagoFormData.metodo,
        createdAt: serverTimestamp(),
        estado: 'Pagado'
      });
      toast.success('Pago registrado exitosamente');
      setShowPagoAdminModal(false);
      setPagoFormData({ nombre: '', concepto: '', monto: '', metodo: 'Efectivo', tipo: 'administrativo', fecha: new Date().toISOString().split('T')[0] });
    } catch(err) {
      toast.error('Error al registrar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const exportarRelacionIngresos = () => {
    const dataToExport = activeIngresoTab === 'generales' ? filteredPagosGenerales : filteredPagosExtra;
    if (dataToExport.length === 0) {
      alert("No hay registros para exportar en las fechas seleccionadas.");
      return;
    }
    
    const csvData = dataToExport.map(p => ({
      'Folio': p.folio || '',
      'Alumno/Persona': p.alumno || p.nombre || '',
      'Concepto': p.concepto || '',
      'Monto': p.monto || '',
      'Método': p.metodo || 'Efectivo',
      'Fecha': p.pagoFecha?.toDate ? p.pagoFecha.toDate().toLocaleDateString() : new Date(p.pagoFecha || Date.now()).toLocaleDateString()
    }));
    
    const csv = Papa.unparse(csvData, { delimiter: ';' });
    const blob = new Blob(["\\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', \`Relacion_Ingresos_\${activeIngresoTab}_\${new Date().toISOString().split('T')[0]}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const q = query(collection(db, 'inventario'));`;
if (!c.includes('todosLosPagosGenerales')) {
    c = c.replace(effectTarget, effectReplacement);
}

// 4. Update the UI for the pagos tab
const uiStart = c.indexOf(`{activeTab === 'pagos' && (`);
const uiEnd = c.indexOf(`{activeTab === 'gastos' && (`);

if (uiStart !== -1 && uiEnd !== -1) {
   const newUI = `{activeTab === 'pagos' && (
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h3 className="font-semibold text-slate-700 text-lg">Módulo de Ingresos</h3>
                <div className="flex gap-2">
                  <button onClick={exportarRelacionIngresos} className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 shadow-sm transition-colors">
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Relación (CSV)
                  </button>
                  <button onClick={() => setShowPagoAdminModal(true)} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm transition-colors">
                    <Plus className="w-4 h-4 mr-2" /> Registrar Pago
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200">
                <button onClick={() => setActiveIngresoTab('generales')} className={\`px-4 py-2 text-sm font-medium border-b-2 transition-colors \${activeIngresoTab === 'generales' ? 'border-primary-600 text-primary-700 bg-primary-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}>Ingresos Generales</button>
                <button onClick={() => setActiveIngresoTab('extraordinarios')} className={\`px-4 py-2 text-sm font-medium border-b-2 transition-colors \${activeIngresoTab === 'extraordinarios' ? 'border-rose-600 text-rose-700 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}>Exámenes Extraordinarios</button>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full lg:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Buscar alumno/persona..." value={pagosSearch} onChange={(e) => setPagosSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" />
                </div>
                
                {activeIngresoTab === 'generales' && (
                  <div className="flex gap-2 w-full lg:w-auto">
                    <select value={pagosGrado} onChange={(e) => setPagosGrado(e.target.value)} className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                      <option value="Todos">Todos los grados</option>
                      <option value="1er Grado">1er Grado</option>
                      <option value="2do Grado">2do Grado</option>
                      <option value="3er Grado">3er Grado</option>
                    </select>
                  </div>
                )}

                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full lg:w-auto bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase px-2 w-full sm:w-auto">Filtrar por Fechas:</span>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="px-2 py-1.5 text-sm border border-slate-300 rounded-md bg-white w-full sm:w-auto" />
                  <span className="text-slate-400">-</span>
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="px-2 py-1.5 text-sm border border-slate-300 rounded-md bg-white w-full sm:w-auto" />
                  {(fechaInicio || fechaFin) && (
                    <button onClick={() => { setFechaInicio(''); setFechaFin(''); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md" title="Limpiar Fechas"><X className="w-4 h-4"/></button>
                  )}
                </div>
              </div>
            </div>
            
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Folio</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Persona / Alumno</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(activeIngresoTab === 'generales' ? filteredPagosGenerales : filteredPagosExtra).map((p, idx) => {
                   const isExtra = activeIngresoTab === 'extraordinarios';
                   const isManual = p.tipoIngreso === 'manual';
                   const badgeColor = isExtra ? 'bg-rose-100 text-rose-700 border-rose-200' : isManual ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200';
                   const badgeText = isExtra ? 'Extraordinario' : isManual ? 'Manual / Libre' : 'Inscripción';
                   return (
                  <tr key={p.id || idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">{p.folio}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">{p.alumno}</div>
                      <span className={\`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border \${badgeColor}\`}>{badgeText}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{p.concepto}</td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">{p.monto}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-emerald-600 flex items-center font-bold bg-emerald-50 w-max px-2 py-1 rounded-md">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> 
                        Pagado: {p.pagoFecha?.toDate ? p.pagoFecha.toDate().toLocaleDateString() : new Date(p.pagoFecha || Date.now()).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                )})}
                {(activeIngresoTab === 'generales' ? filteredPagosGenerales : filteredPagosExtra).length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No se encontraron pagos con los filtros seleccionados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      `;
   c = c.substring(0, uiStart) + newUI + c.substring(uiEnd);
}

// 5. Inject the PagoAdminModal logic at the bottom before final closing tags
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

const closingTagIndex = c.lastIndexOf('</div>');
if (closingTagIndex !== -1 && !c.includes('showPagoAdminModal &&')) {
  c = c.substring(0, closingTagIndex) + modalCode + c.substring(closingTagIndex);
}

// 6. Fix dashboard "Total Ingresos" to calculate everything (pagosRecientes + pagosAdmin + pagosExtra)
const dashTarget = "pagosRecientes.reduce((acc, p) => acc + (Number(p.montoNum) || 0), 0).toFixed(2)";
const dashReplacement = "([...pagosRecientes, ...pagosAdmin, ...pagosExtra].reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0)).toFixed(2)";
c = c.split(dashTarget).join(dashReplacement);

// Fix Balance General calculation as well
const bgTarget = "Ingresos: pagosRecientes.reduce((acc, p) => acc + (Number(p.montoNum) || 0), 0)";
const bgReplacement = "Ingresos: [...pagosRecientes, ...pagosAdmin, ...pagosExtra].reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0)";
c = c.split(bgTarget).join(bgReplacement);

const saldoTarget = "pagosRecientes.reduce((acc, p) => acc + (Number(p.montoNum) || 0), 0) - gastos.reduce";
const saldoReplacement = "([...pagosRecientes, ...pagosAdmin, ...pagosExtra].reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0)) - gastos.reduce";
c = c.split(saldoTarget).join(saldoReplacement);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log("Successfully updated Contraloria.jsx with Ingresos Avanzados.");
