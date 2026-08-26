const fs = require('fs');

// Patch RegularizacionPrint.jsx
let file = fs.readFileSync('src/components/RegularizacionPrint.jsx', 'utf8');

file = file.replace(
  /export default function RegularizacionPrint\(\{ activos, materiasPorGrado, onCaptureExtra, onClose \}\) \{/,
  "export default function RegularizacionPrint({ activos, materiasPorGrado, onCaptureExtra, onPrintConstanciaExtra, onClose }) {"
);

file = file.replace(
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

fs.writeFileSync('src/components/RegularizacionPrint.jsx', file);

// Patch ControlEscolar.jsx to pass onPrintConstanciaExtra
let ce = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

ce = ce.replace(
  /<RegularizacionPrint \s*activos=\{directorio\}\s*materiasPorGrado=\{materiasPorGrado\}\s*onCaptureExtra=\{handleCaptureExtra\}\s*onClose=\{\(\) => setActiveTab\('activos'\)\}\s*\/>/g,
  `<RegularizacionPrint 
              activos={directorio} 
            materiasPorGrado={materiasPorGrado} 
            onCaptureExtra={handleCaptureExtra} 
            onPrintConstanciaExtra={(student, mat) => {
              const mappedMat = {
                materia: mat.name,
                calificacion: mat.finalGrade,
                fecha: mat.fecha,
                periodo: mat.periodo || ''
              };
              setExtraStudent(mappedMat); // just to reuse something or we can pass a new prop? 
              // Wait, ConstanciaPrint receives extraordinarioSelected prop. We need a state for it!
            }}
            onClose={() => setActiveTab('activos')} 
          />`
);
fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', ce);

console.log('Patched');
