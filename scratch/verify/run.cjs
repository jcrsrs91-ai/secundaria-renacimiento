// Imprime cada constancia a PDF con Chrome headless (mismo CSS de impresión real).
// Uso: node scratch/verify/run.cjs <etiqueta> [tramite]
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('scratch/verify/out');
fs.mkdirSync(outDir, { recursive: true });

const tag = process.argv[2] || 'run';
const tramiteArg = process.argv[3] || '';
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

for (const [type, grado] of variantes) {
  const nombre = `${tag}_${type}${grado ? '_' + grado.slice(0, 3) : ''}.pdf`;
  const pdf = path.join(outDir, nombre);
  if (fs.existsSync(pdf)) fs.unlinkSync(pdf);
  let url = `http://localhost:5199/verify-constancia.html?type=${type}`;
  if (grado) url += `&grado=${encodeURIComponent(grado)}`;
  if (tramiteArg) url += `&tramite=${encodeURIComponent(tramiteArg)}`;
  try {
    execFileSync(chrome, [
      '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
      '--virtual-time-budget=8000', `--print-to-pdf=${pdf}`, url,
    ], { stdio: 'ignore', timeout: 60000 });
  } catch (e) { /* chrome puede devolver código distinto de 0 */ }
  console.log(fs.existsSync(pdf) ? 'ok   ' : 'FALLO', nombre);
}
