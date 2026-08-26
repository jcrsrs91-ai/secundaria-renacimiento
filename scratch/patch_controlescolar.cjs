const fs = require('fs');
let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// 1. Rename tab
file = file.replace(
  ">Regularizaci\u00f3n</button>", 
  ">Extraordinarios de Regularizaci\u00f3n</button>"
);
file = file.replace(
  "Regularizaci\u00f3n <Star", 
  "Regularizaci\u00f3n <Star" // unchanged, this is for calificaciones
);

// Wait, the tab button text is:
// >Regularizacin
//             </button>
// Let's use a regex to be safe.
file = file.replace(/>\s*Regularizaci[\u00f3\uFFFD]n\s*<\/button>/g, ">Extraordinarios de Regularizaci\u00f3n</button>");

// 2. Add Periodo to the modal
const califInputHtml = `<div>
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
                      ` + califInputHtml;
                      
file = file.replace(califInputHtml, newPeriodoHtml);

// Make the grid 3 columns
file = file.replace(/className="grid grid-cols-2 gap-4"/g, 'className="grid grid-cols-3 gap-4"');

// Modify saveExtraordinario validation
file = file.replace(/if \(extraData\[matId\]\.calificacion && extraData\[matId\]\.fecha\)/g, "if (extraData[matId].calificacion && extraData[matId].fecha && extraData[matId].periodo)");

// 3. Add new constancia button
const constanciaBtns = `<button onClick={() => { setConstanciaType('calificaciones'); setPrintMode('constancia'); closeModal(); }} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-start group">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Constancia con Calificaciones</h3>
                    <p className="text-xs text-slate-500 mt-1">Incluye la tabla de calificaciones detallada de todos los trimestres.</p>
                  </div>
                </button>`;
                
const constanciaTramiteBtn = `<button onClick={() => { setConstanciaType('terminacion_tramite'); setPrintMode('constancia'); closeModal(); }} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-start group">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Constancia Certificado en Trámite</h3>
                    <p className="text-xs text-slate-500 mt-1">Para egresados sin adeudos, indica que su certificado oficial está en proceso.</p>
                  </div>
                </button>
                `;
                
file = file.replace(constanciaBtns, constanciaBtns + "\n" + constanciaTramiteBtn);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Patched ControlEscolar.jsx');
