const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

file = file.replace(/let cleanTurno = data\.turno\.trim\(\);\s*\/\/\s*Fix para alumnos con turno Vespertino por error\s*if \(cleanTurno === 'Vespertino'\) \{\s*cleanTurno = 'Matutino';\s*\}/, 
`const cleanTurno = data.turno.trim();`);

file = file.replace(/if \(data\.turno !== cleanTurno && doc\.id\) updateDoc\(doc\.ref, \{ turno: cleanTurno \}\)\.catch\(console\.error\);\s*data\.turno = cleanTurno;/,
`if (data.turno !== cleanTurno && doc.id) updateDoc(doc.ref, { turno: cleanTurno }).catch(console.error);
               data.turno = cleanTurno;

               // El usuario indico que si hay alumnos en Vespertino, usan otras letras (ej. L).
               // Si hay alguien en Vespertino que tiene F, lo pasamos a L
               if (data.turno === 'Vespertino' && data.grupo === 'F') {
                   const nuevoGrupo = 'L';
                   if (doc.id) updateDoc(doc.ref, { grupo: nuevoGrupo }).catch(console.error);
                   data.grupo = nuevoGrupo;
               }`);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);

console.log('Fixed regex Vespertino to L logic');
