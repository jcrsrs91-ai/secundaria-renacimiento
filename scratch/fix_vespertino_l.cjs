const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const search = `            if (data.turno) {
               let cleanTurno = data.turno.trim();
               // Fix para alumnos con turno Vespertino por error
               if (cleanTurno === 'Vespertino') {
                   cleanTurno = 'Matutino';
               }
               if (data.turno !== cleanTurno && doc.id) updateDoc(doc.ref, { turno: cleanTurno }).catch(console.error);
               data.turno = cleanTurno;
            }`;

const replace = `            if (data.turno) {
               const cleanTurno = data.turno.trim();
               if (data.turno !== cleanTurno && doc.id) updateDoc(doc.ref, { turno: cleanTurno }).catch(console.error);
               data.turno = cleanTurno;
               
               // El usuario indico que si hay alumnos en Vespertino, usan otras letras (ej. L).
               // Si hay alguien en Vespertino que accidentalmente tiene F, lo pasamos a L automáticamente.
               if (data.turno === 'Vespertino' && data.grupo === 'F') {
                   const nuevoGrupo = 'L';
                   if (doc.id) updateDoc(doc.ref, { grupo: nuevoGrupo }).catch(console.error);
                   data.grupo = nuevoGrupo;
               }
            }`;

file = file.replace(search, replace);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);

console.log('Fixed Vespertino to L logic');
