const fs = require('fs');
const p = 'src/components/ConstanciaPrint.jsx';
let raw = fs.readFileSync(p, 'utf8');
const crlf = raw.includes('\r\n');
let s = raw.replace(/\r\n/g, '\n');

function rep(oldStr, newStr, label) {
  const n = s.split(oldStr).length - 1;
  if (n !== 1) { console.error(`[${label}] coincidencias: ${n} (se esperaba 1)`); process.exit(1); }
  s = s.replace(oldStr, () => newStr);
  console.log('OK  ', label);
}

// 1) Mayúsculas en TODAS las constancias (solo text-transform: no cambia márgenes ni interlineado)
rep(
  "type === 'simple' ? 'px-12 py-6 leading-relaxed uppercase' : 'px-10 py-6 leading-relaxed'}`} ",
  "type === 'simple' ? 'px-12 py-6 leading-relaxed' : 'px-10 py-6 leading-relaxed'} uppercase`} ",
  'uppercase global'
);

// 2) "A quien corresponda:" ya no debe forzarse a minúsculas
rep(
  "'mt-4 text-[12pt] normal-case font-normal'} text-left`}>\n              {type === 'simple' ? 'A QUIEN CORRESPONDA:' : 'A quien corresponda:'}",
  "'mt-4 text-[12pt] font-normal'} text-left`}>\n              {type === 'simple' ? 'A QUIEN CORRESPONDA:' : 'A quien corresponda:'}",
  'a quien corresponda'
);

// 3) Terminación: misma frase con el trámite elegido, conservando su fecha fija y su espaciado bloqueado
rep(
  "A petición de la parte interesada y para los fines legales que a la misma convenga, se expide la presente constancia en la ciudad sede, <strong>a los 15 días del mes de julio del año 2026</strong>.",
  "A petición de la parte interesada y para {formatearTextoTramite(tramiteToUse)}, se expide la presente constancia en la ciudad sede, <strong>a los 15 días del mes de julio del año 2026</strong>.",
  'terminacion tramite'
);

// 4) Resto de constancias (calificaciones, trámite, promedios, tutor, extraordinario)
rep(
  "A petición de la parte interesada y para los fines legales que a la misma convenga, se expide la presente constancia en la ciudad sede, a los {new Date().getDate()} días del mes de {new Date().toLocaleString('es-MX', { month: 'long' })} del año {new Date().getFullYear()}.",
  "A petición de la parte interesada y para {formatearTextoTramite(tramiteToUse)}, se expide la presente constancia en la ciudad sede, a los {new Date().getDate()} días del mes de {new Date().toLocaleString('es-MX', { month: 'long' })} del año {new Date().getFullYear()}.",
  'cierre generico'
);

fs.writeFileSync(p, crlf ? s.replace(/\n/g, '\r\n') : s, 'utf8');
console.log('Archivo guardado.');
