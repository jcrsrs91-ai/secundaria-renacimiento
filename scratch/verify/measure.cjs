// Mide la altura real de cada constancia (px). Hoja carta = 1056px. Holgura = 1056 - altura (negativa = se pasa de hoja).
// Uso: node scratch/verify/measure.cjs [tramite] [largo=1|0]
const { execFileSync } = require('node:child_process');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tramiteArg = (process.argv[2] === '-' ? '' : process.argv[2]) || '';
const largo = process.argv[3] === '0' ? '0' : '1';
const variantes = [
  ['simple', ''],
  ['calificaciones', '1er Grado'],
  ['calificaciones', '3er Grado'],
  ['terminacion_tramite', ''],
  ['terminacion', ''],
  ['promedio_ciclo', ''],
  ['promedio_generacion', ''],
  ['promedio_anterior', ''],
  ['tutor', ''],
  ['inscripcion_primero', ''],
  ['acreditacion_extraordinario', ''],
];

const filas = [];
for (const [type, grado] of variantes) {
  let url = `http://localhost:5199/verify-constancia.html?measure=1&largo=${largo}&type=${type}`;
  if (grado) url += `&grado=${encodeURIComponent(grado)}`;
  if (tramiteArg) url += `&tramite=${encodeURIComponent(tramiteArg)}`;
  let out = '';
  try {
    out = execFileSync(chrome, [
      '--headless=new', '--disable-gpu', '--window-size=900,1400',
      '--virtual-time-budget=15000', '--dump-dom', url,
    ], { timeout: 90000, maxBuffer: 50 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
  } catch (e) { out = (e.stdout || '').toString('utf8'); }
  const m = out.match(/<pre id="result">(-?\d+)\|([\w-]+)<\/pre>/);
  const h = m ? Number(m[1]) : NaN;
  filas.push({ nombre: type + (grado ? ' ' + grado.slice(0, 3) : ''), h, font: m ? m[2] : '?', holgura: 1056 - h });
}
console.log('RESULTADOS (tramite="' + tramiteArg + '", nombre largo=' + largo + ')');
for (const f of filas) {
  const estado = f.holgura < 0 ? 'SE PASA' : f.holgura < 25 ? 'justo' : 'ok';
  console.log(f.nombre.padEnd(30), 'alto', String(f.h).padStart(5), 'px | holgura', String(f.holgura).padStart(5), 'px |', estado.padEnd(8), '|', f.font);
}

