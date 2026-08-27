const fs = require('fs');

let file = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');

// Insert terminacion_tramite
file = file.replace(
  /\{type === 'terminacion' \? \(/,
  `{type === 'terminacion_tramite' ? (
           <p className="mb-6 indent-12">
             Que el (la) alumno(a) <strong>{autoAcentuar(student.apellidoPaterno)} {autoAcentuar(student.apellidoMaterno)} {autoAcentuar(student.nombres)}</strong>, con fecha de nacimiento <strong>{student.fechaNacimiento || extraerFechaDeCurp(student.curp) || '___/___/_____'}</strong>, Clave Única de Registro de Población (CURP) <strong>{student.curp || '__________________'}</strong> y matrícula escolar <strong>{student.matricula}</strong>, concluyó satisfactoriamente sus estudios correspondientes a la Educación Secundaria en el ciclo escolar {config?.cicloEscolarActual || '2025-2026'} en esta Institución Educativa. Por lo anterior, <strong>no adeuda ninguna asignatura</strong> y su Certificado Oficial de Terminación de Estudios se encuentra actualmente <strong>en trámite</strong>.
           </p>
         ) : type === 'terminacion' ? (`
);

// Insert acreditacion_extraordinario
// we need to insert it right before type === 'inscripcion_primero'
file = file.replace(
  /(\) : type === 'inscripcion_primero' \? \()/g,
  `) : type === 'acreditacion_extraordinario' ? (
           <p className="mb-6 indent-12">
             Que el (la) alumno(a) <strong>{autoAcentuar(student.apellidoPaterno)} {autoAcentuar(student.apellidoMaterno)} {autoAcentuar(student.nombres)}</strong>, con fecha de nacimiento <strong>{student.fechaNacimiento || extraerFechaDeCurp(student.curp) || '___/___/_____'}</strong>, Clave Única de Registro de Población (CURP) <strong>{student.curp || '__________________'}</strong> y matrícula escolar <strong>{student.matricula}</strong>, presentó y aprobó el examen extraordinario de la materia <strong>{extraordinarioSelected?.materia || '__________________'}</strong> obteniendo una calificación de <strong>{extraordinarioSelected?.calificacion || '___'}</strong> el día <strong>{extraordinarioSelected?.fecha ? new Date(extraordinarioSelected.fecha + 'T12:00:00Z').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '__________________'}</strong> correspondiente al periodo <strong>{extraordinarioSelected?.periodo || '__________________'}</strong>. Se extiende la presente constancia debido a que su Certificado Oficial de terminación de estudios se encuentra actualmente en trámite.
           </p>
         $1`
);

// We need to add extraordinarioSelected to props
file = file.replace(
  /export default function ConstanciaPrint\(\{ student, type = 'simple', materiasPorGrado = \{\} \}\) \{/,
  `export default function ConstanciaPrint({ student, type = 'simple', materiasPorGrado = {}, extraordinarioSelected = null }) {`
);

// update terminacion text at the bottom to match terminacion_tramite
file = file.replace(
  /\{\(type === 'terminacion'\) && \(/,
  `{(type === 'terminacion' || type === 'terminacion_tramite') && (`
);
file = file.replace(
  /\{type === 'terminacion' && \(/,
  `{(type === 'terminacion' || type === 'terminacion_tramite') && (`
);

// Let's also restore 8b45cee (use promedioEscuela for primer grado in Constancias)
// in inscripcion_primero:
// replace: concluyó su Educación Primaria con un promedio de <strong>{student.manualPromedio ? \`\${student.manualPromedio} (\${promedioALetras(student.manualPromedio)})\` : '___ (_________________)'}</strong>
file = file.replace(
  /concluyó su Educación Primaria con un promedio de <strong>\{student\.manualPromedio \? \`\\\$\\{student\.manualPromedio\\} \(\\\$\\{promedioALetras\(student\.manualPromedio\)\\}\)\` : '___ \(.+?\)'\}<\/strong>/,
  `concluyó su Educación Primaria con un promedio de <strong>{(student.promedioEscuela || student.manualPromedio) ? \`\${student.promedioEscuela || student.manualPromedio} (\${promedioALetras(student.promedioEscuela || student.manualPromedio)})\` : '___ (_________________)'}</strong>`
);

fs.writeFileSync('src/components/ConstanciaPrint.jsx', file);
console.log('Restored fully!');
