const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// Find the block {activeTab === 'corte' && ( ... )}
let idx = c.indexOf('{activeTab === \'corte\' && (');
let str = c.substring(idx);
let open = 0;
let endIdx = -1;
for(let i=0; i<str.length; i++) {
  if(str[i] === '{') open++;
  if(str[i] === '}') open--;
  if(open === 0 && i > 0) { endIdx = i; break; }
}

const originalBlock = str.substring(0, endIdx+1);

const newBlock = `{activeTab === 'corte' && (
  <div className="space-y-6 max-w-4xl mx-auto">
    {(() => {
      // Calculate current shift totals
      const pagosTurno = [...pagosAdmin, ...pagosExtra].filter(p => p.cajaId === cajaTurno.id);
      
      const totalEfectivo = pagosTurno.filter(p => p.metodo === 'Efectivo').reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0);
      const totalTransferencia = pagosTurno.filter(p => p.metodo === 'Transferencia').reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0);
      const totalTerminal = pagosTurno.filter(p => p.metodo === 'Tarjeta').reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0);
      
      const totalIngresos = totalEfectivo + totalTransferencia + totalTerminal;
      const totalGastos = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
      
      const fondoEfectivo = Number(cajaTurno.fondoInicial) || 0;
      
      const totalEnCajaFisica = fondoEfectivo + totalEfectivo - totalGastos;
      const totalEnBanco = totalTransferencia + totalTerminal;
      
      return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="w-6 h-6 mr-2 text-indigo-600" /> Corte de Caja en Curso
            </div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold">
              Turno {cajaTurno.turno}
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500 font-medium mb-1">Fondo Inicial</p>
              <p className="text-xl font-bold text-slate-700">\${fondoEfectivo.toFixed(2)}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-600 font-medium mb-1">Ingresos (Efectivo)</p>
              <p className="text-xl font-bold text-emerald-700">+ \${totalEfectivo.toFixed(2)}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
              <p className="text-sm text-rose-600 font-medium mb-1">Gastos (Egresos)</p>
              <p className="text-xl font-bold text-rose-700">- \${totalGastos.toFixed(2)}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 shadow-inner">
              <p className="text-sm text-indigo-600 font-bold mb-1">EFECTIVO EN CAJÓN</p>
              <p className="text-2xl font-black text-indigo-700">\${totalEnCajaFisica.toFixed(2)}</p>
            </div>
          </div>
          
          <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2">Ingresos No Físicos (Directo a Banco)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500 font-medium mb-1">Transferencias</p>
              <p className="text-xl font-bold text-slate-700">\${totalTransferencia.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500 font-medium mb-1">Terminal (Tarjeta)</p>
              <p className="text-xl font-bold text-slate-700">\${totalTerminal.toFixed(2)}</p>
            </div>
            <div className="bg-sky-50 p-4 rounded-lg border border-sky-200">
              <p className="text-sm text-sky-600 font-medium mb-1">Total a Banco</p>
              <p className="text-xl font-bold text-sky-700">\${totalEnBanco.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button onClick={() => handleCerrarCaja({fondoEfectivo, totalEfectivo, totalGastos, totalEnCajaFisica, totalTransferencia, totalTerminal, totalEnBanco})} className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md transition-colors text-lg">
              <Archive className="w-5 h-5 mr-2" /> Cerrar Caja Definitivamente
            </button>
          </div>
        </div>
      )
    })()}
  </div>
)}`;

c = c.replace(originalBlock, newBlock);

// Now add handleCerrarCaja
const cerrarCajaFunc = `
  const handleCerrarCaja = async (totales) => {
    if(!window.confirm("¿Estás seguro que deseas cerrar la caja del turno " + cajaTurno.turno + "? Esta acción guardará el historial del corte y bloqueará el sistema hasta que se inicie un nuevo turno.")) return;
    
    try {
      // 1. Save the Corte document
      const corteRef = await addDoc(collection(db, "cortes_caja"), {
        cajaId: cajaTurno.id,
        turno: cajaTurno.turno,
        usuario: currentUser?.email || 'admin',
        fechaCierre: serverTimestamp(),
        fondoInicial: totales.fondoEfectivo,
        ingresosEfectivo: totales.totalEfectivo,
        gastosEfectivo: totales.totalGastos,
        efectivoFinalEnCajon: totales.totalEnCajaFisica,
        ingresosTransferencia: totales.totalTransferencia,
        ingresosTerminal: totales.totalTerminal,
        totalBanco: totales.totalEnBanco,
        granTotalRecaudado: totales.totalEfectivo + totales.totalTransferencia + totales.totalTerminal
      });
      
      // 2. Mark the current caja session as closed
      const cajaRef = doc(db, "sesiones_caja", cajaTurno.id);
      await updateDoc(cajaRef, {
        estado: 'Cerrada',
        fechaCierre: serverTimestamp(),
        corteId: corteRef.id
      });
      
      toast.success("Corte de Caja guardado. El turno ha sido cerrado.");
      setCajaTurno(null);
      setActiveTab('pagos');
      
    } catch(err) {
      console.error(err);
      toast.error("Error al cerrar caja.");
    }
  };
`;

// Insert it right before exportarRelacionIngresos
c = c.replace('const exportarRelacionIngresos = () => {', cerrarCajaFunc + '\n  const exportarRelacionIngresos = () => {');

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log("Corte de Caja UI replaced and function added.");
