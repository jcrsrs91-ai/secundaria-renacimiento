const fs = require('fs');
let file = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');

const terminacionStr = `type === 'terminacion' ? (`;
const terminacionTramiteStr = `type === 'terminacion_tramite' ? (
           <p className="mb-6 indent-12">
             Que el (la) alumno(a) <strong>{autoAcentuar(student.apellidoPaterno)} {autoAcentuar(student.apellidoMaterno)} {autoAcentuar(student.nombres)}</strong>, con fecha de nacimiento <strong>{student.fechaNacimiento || extraerFechaDeCurp(student.curp) || '___/___/_____'}</strong>, Clave Única de Registro de Población (CURP) <strong>{student.curp || '__________________'}</strong> y matrícula escolar <strong>{student.matricula}</strong>, concluyó satisfactoriamente sus estudios correspondientes a la Educación Secundaria en el ciclo escolar {config?.cicloEscolarActual || '2025-2026'} en esta Institución Educativa. Por lo anterior, <strong>no adeuda ninguna asignatura</strong> y su Certificado Oficial de Terminación de Estudios se encuentra actualmente <strong>en trámite</strong>.
           </p>
         ) : type === 'terminacion' ? (`;

if (!file.includes("terminacion_tramite' ?")) {
  file = file.replace(terminacionStr, terminacionTramiteStr);
}

// Ensure the styles are the same as 'terminacion'
const styleStr = `type === 'terminacion' ? 'px-10 py-6 leading-relaxed' :`;
const newStyleStr = `(type === 'terminacion' || type === 'terminacion_tramite') ? 'px-10 py-6 leading-relaxed' :`;
file = file.replace(styleStr, newStyleStr);

// Averages and Dates
const avgStr = `type === 'terminacion' && (`;
const newAvgStr = `(type === 'terminacion' || type === 'terminacion_tramite') && (`;
file = file.replace(avgStr, newAvgStr);

// But wait, for the date, 'terminacion' uses "15 de julio de 2026" hardcoded. Should 'terminacion_tramite' use the current date or the hardcoded date? The user says "se expide la presente constancia ...", typically they use the current date for "en trámite". Let's use the current date (which is the fallback if it's NOT 'terminacion').
// Let's NOT change the date logic so it falls into the `else` block which uses the current date.

fs.writeFileSync('src/components/ConstanciaPrint.jsx', file);
console.log('Patched ConstanciaPrint.jsx');
