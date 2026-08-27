const fs = require('fs');

// 1. RegularizacionPrint.jsx
let reg = fs.readFileSync('src/components/RegularizacionPrint.jsx', 'utf8');
reg = reg.replace(/\{onPrintConstanciaExtra && \([\s\S]*?<\/button>\s*\)\}/g, '');
reg = reg.replace(/\{item\.regularizadas\.length > 0 \? \(/, `{item.regularizadas.length > 0 ? (
                          <div className="space-y-2">
                            {onPrintConstanciaExtra && (
                               <button 
                                 onClick={() => onPrintConstanciaExtra(item.student, item.regularizadas)}
                                 className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold flex items-center w-full justify-center no-print"
                                 title="Imprimir Constancia Global"
                               >
                                 Imprimir Constancia Global
                               </button>
                            )}`);
reg = reg.replace(/<ul className="list-disc list-inside space-y-1">/, '<ul className="list-disc list-inside space-y-1 mt-2">');
fs.writeFileSync('src/components/RegularizacionPrint.jsx', reg);

// 2. ControlEscolar.jsx
let ce = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');
const ceReplaceStr = `onPrintConstanciaExtra={(student, matsArray) => {
                const formattedMats = matsArray.map(mat => ({
                  materia: mat.name,
                  calificacion: mat.finalGrade,
                  fecha: mat.fecha,
                  periodo: mat.periodo || ''
                }));
                setExtraordinarioToPrint(formattedMats);`;
ce = ce.replace(/onPrintConstanciaExtra=\{\(student, mat\) => \{[\s\S]*?periodo: mat\.periodo \|\| ''\n\s*\}\);/, ceReplaceStr);
fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', ce);

console.log('Fixed ControlEscolar and RegularizacionPrint');
