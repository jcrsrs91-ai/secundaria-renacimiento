const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const regex = /<\/ul>\s*\)}\s*<\/div>/;

const inject = `</ul>
                  )}
                </div>
                {pagoFormData.tipo === 'extraordinario' && pagoFormData.nombre && (() => {
                  const selectedStudentObj = allStudentsRaw.find(s => \`\${s.apellidoPaterno || ''} \${s.apellidoMaterno || ''} \${s.nombres || ''}\`.trim() === pagoFormData.nombre);
                  if (!selectedStudentObj) return null;
                  const failed = getFailedSubjects(selectedStudentObj);
                  if (failed.length === 0) return <p className="text-sm text-emerald-600 mt-2 font-medium">Este alumno no tiene materias reprobadas detectadas.</p>;
                  return (
                    <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3">
                       <p className="text-sm font-bold text-rose-800 mb-2">Materias reprobadas detectadas:</p>
                       <div className="flex flex-wrap gap-2">
                         {failed.map(mat => (
                           <button 
                             type="button" 
                             key={mat.id}
                             onClick={() => {
                               const isFirstEmpty = pagoFormData.detalles.length === 1 && pagoFormData.detalles[0].concepto === 'Examen Extraordinario de ';
                               const newConcept = 'Examen Extraordinario de ' + mat.name;
                               if (isFirstEmpty) {
                                 setPagoFormData({...pagoFormData, detalles: [{concepto: newConcept, monto: ''}]});
                               } else {
                                 setPagoFormData({...pagoFormData, detalles: [...pagoFormData.detalles, {concepto: newConcept, monto: ''}]});
                               }
                             }}
                             className="px-2 py-1 bg-white border border-rose-300 rounded shadow-sm text-xs text-rose-700 font-bold hover:bg-rose-100 transition"
                           >
                             + {mat.name}
                           </button>
                         ))}
                       </div>
                    </div>
                  );
                })()}`;

if (!c.includes('Materias reprobadas detectadas')) {
  c = c.replace(regex, inject);
  fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
  console.log("Injected Materias Reprobadas logic.");
} else {
  console.log("Already injected.");
}
