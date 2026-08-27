const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const search = `          if (data.nombres) data.nombres = autoAcentuar(data.nombres);
          if (data.apellidoPaterno) data.apellidoPaterno = autoAcentuar(data.apellidoPaterno);
          if (data.apellidoMaterno) data.apellidoMaterno = autoAcentuar(data.apellidoMaterno);`;

const replace = `          if (data.nombres) data.nombres = autoAcentuar(data.nombres);
          if (data.apellidoPaterno) data.apellidoPaterno = autoAcentuar(data.apellidoPaterno);
          if (data.apellidoMaterno) data.apellidoMaterno = autoAcentuar(data.apellidoMaterno);
          
          // Limpieza de datos críticos para evitar duplicados en tablas o gráficas
          if (data.grupo) data.grupo = data.grupo.trim().toUpperCase();
          if (data.grado) data.grado = data.grado.trim();
          if (data.turno) data.turno = data.turno.trim();`;

file = file.replace(search, replace);

// Also fix the import logic so new ones are clean
const searchImport = `              await addDoc(collection(db, "students"), {
                apellidoMaterno: getV(row, 'apellidomaterno', 'materno', 'apellido materno'),
                grado: getV(row, 'grado', 'grados'),
                grupo: rawGrupo,
                turno: getV(row, 'turno', 'turnos'),
                taller: rawGrupo ? getTallerPorGrupo(rawGrupo) : 'Por asignar',`;

const replaceImport = `              await addDoc(collection(db, "students"), {
                apellidoMaterno: getV(row, 'apellidomaterno', 'materno', 'apellido materno'),
                grado: getV(row, 'grado', 'grados') ? getV(row, 'grado', 'grados').trim() : '',
                grupo: rawGrupo ? rawGrupo.trim().toUpperCase() : '',
                turno: getV(row, 'turno', 'turnos') ? getV(row, 'turno', 'turnos').trim() : '',
                taller: rawGrupo ? getTallerPorGrupo(rawGrupo.trim().toUpperCase()) : 'Por asignar',`;

file = file.replace(searchImport, replaceImport);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);

console.log('Fixed memory cleaning');
