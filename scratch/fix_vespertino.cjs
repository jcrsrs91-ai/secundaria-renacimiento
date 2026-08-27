const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const search = `          if (data.turno) {
             const cleanTurno = data.turno.trim();
             if (data.turno !== cleanTurno && doc.id) updateDoc(doc.ref, { turno: cleanTurno }).catch(console.error);
             data.turno = cleanTurno;
          }`;

const replace = `          if (data.turno) {
             let cleanTurno = data.turno.trim();
             // Fix para alumnos con turno Vespertino por error
             if (cleanTurno === 'Vespertino') {
                 cleanTurno = 'Matutino';
             }
             if (data.turno !== cleanTurno && doc.id) updateDoc(doc.ref, { turno: cleanTurno }).catch(console.error);
             data.turno = cleanTurno;
          }`;

file = file.replace(search, replace);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);

console.log('Added Vespertino auto-fix');
