import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import ConstanciaPrint from '../../src/components/ConstanciaPrint';

const params = new URLSearchParams(window.location.search);
const type = params.get('type') || 'simple';
const tramite = params.get('tramite') || null;
const grado = params.get('grado') || '3er Grado';
const measure = params.get('measure') === '1';
const nombreLargo = params.get('largo') !== '0';

// Alumno "peor caso": nombres largos (o corto si largo=0)
const student = {
  apellidoPaterno: nombreLargo ? 'HERNANDEZ' : 'RAMOS',
  apellidoMaterno: nombreLargo ? 'VILLALOBOS' : 'DIAZ',
  nombres: nombreLargo ? 'MARIA GUADALUPE FERNANDA' : 'LUIS ANGEL',
  curp: 'HEVM100315MGRRLRA9',
  matricula: '2024EST68001',
  fechaNacimiento: '15/03/2010',
  grado,
  grupo: 'A',
  turno: 'Matutino',
  manualPromedio: '9.4',
  tutorNombre: nombreLargo ? 'JOSE LUIS HERNANDEZ RODRIGUEZ DE LA CRUZ' : 'ANA DIAZ LOPEZ',
  calificaciones: { t1: {}, t2: {}, t3: {} },
};

// Materias reales de la escuela (ControlEscolar.jsx)
const lista = {
  '1er Grado': ['Español I', 'Inglés I', 'Artes I', 'Matemáticas I', 'Ciencias I (Biología)', 'Geografía', 'Historia I', 'Formación Cívica y Ética I', 'Tecnología I', 'Educación Física I'],
  '3er Grado': ['Español III', 'Inglés III', 'Artes III', 'Matemáticas III', 'Ciencias III (Química)', 'Historia III', 'Formación Cívica y Ética III', 'Tecnología III', 'Educación Física III'],
};
const materias = lista[grado].map((name, i) => ({ id: 'm' + i, name }));
materias.forEach((m) => {
  student.calificaciones.t1[m.id] = '9.1';
  student.calificaciones.t2[m.id] = '8.7';
  student.calificaciones.t3[m.id] = '9.5';
});
const materiasPorGrado = { [grado]: materias };

const extraordinarioSelected = [
  { materia: 'Matemáticas III', calificacion: '8', fecha: '2026-07-10', periodo: 'Julio 2026' },
  { materia: 'Español III', calificacion: '9', fecha: '2026-07-11', periodo: 'Julio 2026' },
];

if (measure) {
  // Emula la impresión en pantalla para poder medir la altura real de la hoja
  const st = document.createElement('style');
  st.textContent = `
    html body #root .print-constancia-only { display: block !important; }
    html body #root .page-container { width: 8.5in !important; min-height: 0 !important; height: auto !important; margin: 0 !important; padding: 1cm !important; box-shadow: none !important; }
    html, body { margin: 0 !important; }
  `;
  document.head.appendChild(st);
}

createRoot(document.getElementById('root')).render(
  <ConstanciaPrint
    student={student}
    type={type}
    materiasPorGrado={materiasPorGrado}
    extraordinarioSelected={type === 'acreditacion_extraordinario' ? extraordinarioSelected : null}
    tramite={tramite}
  />
);

if (measure) {
  const medir = () => {
    const el = document.querySelector('.page-container');
    const h = el ? el.getBoundingClientRect().height : -1;
    const fontOk = document.fonts.check('16px "Playfair Display"');
    const pre = document.createElement('pre');
    pre.id = 'result';
    pre.textContent = Math.round(h) + '|' + (fontOk ? 'font-ok' : 'font-FALLBACK');
    document.body.appendChild(pre);
  };
  // Forzamos la descarga de la tipografía serif real y esperamos a que esté lista
  Promise.race([
    document.fonts.load('16px "Playfair Display"').then(() => document.fonts.ready),
    new Promise((r) => setTimeout(r, 6000)),
  ]).then(() => setTimeout(medir, 600));
}
