const fs = require('fs');
let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// Replace the inputs
const target = `<div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Calificaci\u00f3n Final (Aprobatoria)</label>`;

const newPeriodoHtml = `<div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Periodo</label>
                      <select 
                        value={extraData[mat.id]?.periodo || ''}
                        onChange={(e) => setExtraData(prev => ({ 
                          ...prev, 
                          [mat.id]: { ...prev[mat.id], periodo: e.target.value } 
                        }))}
                        className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                      >
                        <option value="">Seleccione...</option>
                        <option value="Agosto">Agosto</option>
                        <option value="Septiembre">Septiembre</option>
                        <option value="Noviembre">Noviembre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Calificaci\u00f3n Final (Aprobatoria)</label>`;
                      
if (file.includes(target) && !file.includes('Agosto')) {
  file = file.replace(target, newPeriodoHtml);
} else {
  // if already replaced or string not found
  const regex = /<label className="block text-xs font-semibold text-slate-600 mb-1">Calificaci[\u00f3\uFFFD]n Final \(Aprobatoria\)<\/label>/;
  if (regex.test(file) && !file.includes('Agosto')) {
     file = file.replace(regex, `
     <label className="block text-xs font-semibold text-slate-600 mb-1">Periodo</label>
     <select 
       value={extraData[mat.id]?.periodo || ''}
       onChange={(e) => setExtraData(prev => ({ 
         ...prev, 
         [mat.id]: { ...prev[mat.id], periodo: e.target.value } 
       }))}
       className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-orange-500 focus:ring-orange-500"
     >
       <option value="">Seleccione...</option>
       <option value="Agosto">Agosto</option>
       <option value="Septiembre">Septiembre</option>
       <option value="Noviembre">Noviembre</option>
     </select>
   </div>
   <div>
     <label className="block text-xs font-semibold text-slate-600 mb-1">Calificaci\u00f3n Final (Aprobatoria)</label>
     `);
  }
}

// Add the constancia button if it's not there
const constanciaTramiteBtn = `<button onClick={() => { setConstanciaType('terminacion_tramite'); setPrintMode('constancia'); closeModal(); }} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-start group">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Constancia Certificado en Trámite</h3>
                    <p className="text-xs text-slate-500 mt-1">Para egresados sin adeudos, indica que su certificado oficial está en proceso.</p>
                  </div>
                </button>`;
                
if (!file.includes('terminacion_tramite')) {
  // Find where constancias are added
  const regexBtns = /<h3 className="font-bold text-slate-800">Constancia con Calificaciones<\/h3>[\s\S]*?<\/button>/;
  if (regexBtns.test(file)) {
    const matched = file.match(regexBtns)[0];
    file = file.replace(matched, matched + "\n" + constanciaTramiteBtn);
  }
}

// Also need to save the periodo!
const regexSave = /newReg\[matId\] = {\s*calificacion: parseFloat\(extraData\[matId\]\.calificacion\),\s*fecha: extraData\[matId\]\.fecha\s*};/g;
if (regexSave.test(file)) {
  file = file.replace(regexSave, "newReg[matId] = { calificacion: parseFloat(extraData[matId].calificacion), fecha: extraData[matId].fecha, periodo: extraData[matId].periodo };");
}

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Patched ControlEscolar.jsx again');
