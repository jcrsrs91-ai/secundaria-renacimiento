const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// 1. Insert import
if (!code.includes('import ListaClausuraPrint')) {
  code = code.replace(
    "import KardexPrint from '../../components/KardexPrint';",
    "import KardexPrint from '../../components/KardexPrint';\nimport ListaClausuraPrint from '../../components/ListaClausuraPrint';"
  );
}

// 2. Insert state
if (!code.includes('const [asesorNombre')) {
  code = code.replace(
    "const [asisPaperSize, setAsisPaperSize] = useState('letter');",
    "const [asisPaperSize, setAsisPaperSize] = useState('letter');\n  const [asesorNombre, setAsesorNombre] = useState('');"
  );
}

// 3. Insert Button
if (!code.includes('Imprimir Lista Clausura (3ro)')) {
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
  code = code.replace(
    /<Printer className="w-5 h-5 mr-2" \/> Imprimir Lista Oficial\n              <\/button>\n            <\/div>\n          <\/div>/,
    `<Printer className="w-5 h-5 mr-2" /> Imprimir Lista Oficial\n              </button>\n            </div>\n          </div>${btnInjection}`
  );
}

// 4. Render component
if (!code.includes('<ListaClausuraPrint')) {
  code = code.replace(
    "{printMode === 'listaAsistencia' && <ListaAsistenciaPrint students={printData.students} grado={printData.grado} grupo={printData.grupo} mes={printData.mes} paperSize={printData.paperSize} />}",
    "{printMode === 'listaAsistencia' && <ListaAsistenciaPrint students={printData.students} grado={printData.grado} grupo={printData.grupo} mes={printData.mes} paperSize={printData.paperSize} />}\n      {printMode === 'listaClausura' && <ListaClausuraPrint students={printData.students} grupo={printData.grupo} asesor={printData.asesor} />}"
  );
}

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', code);
console.log('Patched ControlEscolar.jsx successfully');
