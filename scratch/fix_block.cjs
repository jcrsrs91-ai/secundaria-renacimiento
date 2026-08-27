const fs = require('fs');

let cp = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');

// Wipe all acreditacion_extraordinario logic entirely
cp = cp.replace(/\) : type === 'acreditacion_extraordinario' \? \([\s\S]*?(?=\) : type === 'inscripcion_primero' \? \()/g, '');

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
         `;

cp = cp.replace(/\) : type === 'inscripcion_primero' \? \(/, extraBlock + ") : type === 'inscripcion_primero' ? (");

fs.writeFileSync('src/components/ConstanciaPrint.jsx', cp);

console.log('Fixed block');
