const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const btnInjection = `
          {asisGrado === '3er Grado' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end mt-4">
              <div className="w-full md:flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nombre del Asesor (Opcional - Para lista de clausura)</label>
                <input 
                  type="text" 
                  value={asesorNombre} 
                  onChange={e => setAsesorNombre(e.target.value)} 
                  placeholder="Ej. Profa. María Pérez" 
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 bg-white"
                />
              </div>
              <div className="w-full md:w-auto">
                <button 
                  onClick={() => {
                    if (asisAlumnos.length === 0) {
                      alert("No hay alumnos activos en este grado y grupo.");
                      return;
                    }
                    setPrintData({ students: asisAlumnos, grado: asisGrado, grupo: asisGrupo, asesor: asesorNombre });
                    setPrintMode('listaClausura');
                    setTimeout(() => window.print(), 500);
                  }} 
                  className="flex items-center justify-center w-full md:w-auto px-6 py-2.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition shadow-md"
                >
                  <Award className="w-5 h-5 mr-2" /> Imprimir Lista Clausura (3ro)
                </button>
              </div>
            </div>
          )}
`;

if (!code.includes('Imprimir Lista Clausura (3ro)')) {
  const searchStr = 'Imprimir Lista Oficial\r\n              </button>\r\n            </div>\r\n          </div>';
  const searchStr2 = 'Imprimir Lista Oficial\n              </button>\n            </div>\n          </div>';
  
  let idx = code.indexOf(searchStr);
  let length = searchStr.length;
  if (idx === -1) {
    idx = code.indexOf(searchStr2);
    length = searchStr2.length;
  }
  
  if (idx !== -1) {
    code = code.substring(0, idx + length) + btnInjection + code.substring(idx + length);
    fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', code);
    console.log('Button inserted successfully');
  } else {
    console.log('Could not find the insertion point for the button');
  }
} else {
  console.log('Button already exists');
}
