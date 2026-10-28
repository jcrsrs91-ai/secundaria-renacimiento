const fs = require('fs');
const p = 'src/pages/dashboard/ControlEscolar.jsx';
const raw = fs.readFileSync(p, 'utf8');
const crlf = raw.includes('\r\n');
let s = raw.replace(/\r\n/g, '\n');

function rep(oldStr, newStr, label) {
  const n = s.split(oldStr).length - 1;
  if (n !== 1) { console.error(`[${label}] coincidencias: ${n} (se esperaba 1)`); process.exit(1); }
  s = s.replace(oldStr, () => newStr);
  console.log('OK  ', label);
}

rep(
  '<span>🏛️ Tipo de Trámite (Para Constancia Simple)</span>',
  '<span>🏛️ Tipo de Trámite (aplica a todas las constancias)</span>',
  'titulo selector'
);

rep(
  'Constancia Simple (En Mayúsculas)</h3>',
  'Constancia Simple</h3>',
  'titulo boton simple'
);

rep(
  'Formato tradicional 100% en mayúsculas certificando la inscripción y el grado cursado.',
  'Formato tradicional certificando la inscripción y el grado cursado.',
  'descripcion boton simple'
);

// Quitar la etiqueta de trámite que solo aparecía en el botón de Constancia Simple
const reChip = /\n {20}<span className="text-\[10px\] font-bold bg-primary-100 text-primary-700 px-2 py-0\.5 rounded-full uppercase">[\s\S]*?<\/span>\n/;
if (!reChip.test(s)) { console.error('[chip] no encontrado'); process.exit(1); }
s = s.replace(reChip, '\n');
console.log('OK   chip removido');

// Limite razonable al trámite personalizado
rep(
  'onChange={(e) => setConstanciaTramiteCustom(e.target.value.toUpperCase())}',
  'onChange={(e) => setConstanciaTramiteCustom(e.target.value.toUpperCase())}\n                      maxLength={90}',
  'maxLength custom'
);

fs.writeFileSync(p, crlf ? s.replace(/\n/g, '\r\n') : s, 'utf8');
console.log('Archivo guardado.');
