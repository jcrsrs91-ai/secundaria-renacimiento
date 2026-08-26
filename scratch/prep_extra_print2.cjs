const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// Add state
file = file.replace(
  /const \[extraStudent, setExtraStudent\] = useState\(null\);/,
  "const [extraStudent, setExtraStudent] = useState(null);\n  const [extraordinarioToPrint, setExtraordinarioToPrint] = useState(null);"
);

// Pass to ConstanciaPrint
file = file.replace(
  /\{printMode === 'constancia' && <ConstanciaPrint student=\{printData\} type=\{constanciaType\} materiasPorGrado=\{materiasPorGrado\} \/>\}/,
  "{printMode === 'constancia' && <ConstanciaPrint student={printData} type={constanciaType} materiasPorGrado={materiasPorGrado} extraordinarioSelected={extraordinarioToPrint} />}"
);

// Pass onPrintConstanciaExtra to RegularizacionPrint
file = file.replace(
  /<RegularizacionPrint[\s\S]*?onCaptureExtra=\{handleCaptureExtra\}[\s\S]*?onClose=\{\(\) => setActiveTab\('activos'\)\}[\s\S]*?\/>/,
  `<RegularizacionPrint 
            activos={directorio} 
            materiasPorGrado={materiasPorGrado} 
            onCaptureExtra={handleCaptureExtra} 
            onPrintConstanciaExtra={(student, mat) => {
              setExtraordinarioToPrint({
                materia: mat.name,
                calificacion: mat.finalGrade,
                fecha: mat.fecha,
                periodo: mat.periodo || ''
              });
              setPrintData(student);
              setConstanciaType('acreditacion_extraordinario');
              setPrintMode('constancia');
              setTimeout(() => window.print(), 800);
            }}
            onClose={() => setActiveTab('activos')} 
          />`
);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Fixed ControlEscolar');

let reg = fs.readFileSync('src/components/RegularizacionPrint.jsx', 'utf8');

reg = reg.replace(
  /export default function RegularizacionPrint\(\{ activos, materiasPorGrado, onCaptureExtra, onClose \}\) \{/,
  "export default function RegularizacionPrint({ activos, materiasPorGrado, onCaptureExtra, onPrintConstanciaExtra, onClose }) {"
);

reg = reg.replace(
  /<div className="text-\[10px\] text-slate-500 ml-4">Fecha: \{mat\.fecha\}<\/div>/g,
  `<div className="text-[10px] text-slate-500 ml-4 flex items-center justify-between">
                                  <span>Fecha: {mat.fecha} | Periodo: {mat.periodo || 'N/A'}</span>
                                  {onPrintConstanciaExtra && (
                                    <button 
                                      onClick={() => onPrintConstanciaExtra(item.student, mat)}
                                      className="ml-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-bold inline-flex items-center no-print"
                                      title="Imprimir Constancia"
                                    >
                                      Imprimir
                                    </button>
                                  )}
                                </div>`
);
fs.writeFileSync('src/components/RegularizacionPrint.jsx', reg);
console.log('Fixed RegularizacionPrint');
