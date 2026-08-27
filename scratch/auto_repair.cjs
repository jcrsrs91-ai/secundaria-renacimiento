const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const search = `          // Limpieza de datos criticos
          if (data.grupo) data.grupo = data.grupo.trim().toUpperCase();
          if (data.grado) data.grado = data.grado.trim();
          if (data.turno) data.turno = data.turno.trim();`;

const replace = `          // Limpieza de datos criticos y auto-correccion en base de datos
          if (data.grupo) {
             const cleanGrupo = data.grupo.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
             if (data.grupo !== cleanGrupo && doc.id) {
                 // Auto-reparar en base de datos silenciosamente
                 updateDoc(doc.ref, { grupo: cleanGrupo }).catch(console.error);
             }
             data.grupo = cleanGrupo;
          }
          if (data.grado) {
             const cleanGrado = data.grado.trim();
             if (data.grado !== cleanGrado && doc.id) updateDoc(doc.ref, { grado: cleanGrado }).catch(console.error);
             data.grado = cleanGrado;
          }
          if (data.turno) {
             const cleanTurno = data.turno.trim();
             if (data.turno !== cleanTurno && doc.id) updateDoc(doc.ref, { turno: cleanTurno }).catch(console.error);
             data.turno = cleanTurno;
          }`;

file = file.replace(search, replace);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);

console.log('Added auto-repair');
