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

// 3. ConstanciaPrint.jsx
let cp = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');
cp = cp.replace(/\) : type === 'acreditacion_extraordinario' \? \([\s\S]*?<\/p>\n\s*/g, ') : ');
const extraBlock = `) : type === 'acreditacion_extraordinario' ? (
           <div className="mb-6 indent-12 text-justify">
             Que el (la) alumno(a) <strong>{autoAcentuar(student.apellidoPaterno)} {autoAcentuar(student.apellidoMaterno)} {autoAcentuar(student.nombres)}</strong>, con fecha de nacimiento <strong>{student.fechaNacimiento || extraerFechaDeCurp(student.curp) || '___/___/_____'}</strong>, Clave Única de Registro de Población (CURP) <strong>{student.curp || '__________________'}</strong> y matrícula escolar <strong>{student.matricula}</strong>, presentó y aprobó {Array.isArray(extraordinarioSelected) && extraordinarioSelected.length > 1 ? 'los exámenes extraordinarios de las siguientes asignaturas:' : 'el examen extraordinario de la siguiente asignatura:'}
             
             <div className="my-4 ml-12 border-l-2 border-slate-400 pl-4">
               <ul className="list-disc space-y-2 text-[11pt]">
                 {(Array.isArray(extraordinarioSelected) ? extraordinarioSelected : [extraordinarioSelected]).map((mat, i) => (
                   <li key={i}>
                     <strong>{mat.materia || '__________________'}</strong>, obteniendo una calificación de <strong>{mat.calificacion || '___'}</strong> el día <strong>{mat.fecha ? new Date(mat.fecha + 'T12:00:00Z').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '__________________'}</strong> correspondiente al periodo <strong>{mat.periodo || '__________________'}</strong>.
                   </li>
                 ))}
               </ul>
             </div>
             
             Se extiende la presente constancia debido a que su Certificado Oficial de terminación de estudios se encuentra actualmente en trámite.
           </div>
         ) : `;

cp = cp.replace(/\) : type === 'inscripcion_primero' \? \(/, extraBlock + "type === 'inscripcion_primero' ? (");
fs.writeFileSync('src/components/ConstanciaPrint.jsx', cp);

console.log('Applied array rendering logic for extraordinarios');
