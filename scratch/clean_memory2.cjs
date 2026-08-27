const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

file = file.replace(/if \(data\.apellidoMaterno\) data\.apellidoMaterno = autoAcentuar\(data\.apellidoMaterno\);/,
`if (data.apellidoMaterno) data.apellidoMaterno = autoAcentuar(data.apellidoMaterno);
          
          // Limpieza de datos criticos
          if (data.grupo) data.grupo = data.grupo.trim().toUpperCase();
          if (data.grado) data.grado = data.grado.trim();
          if (data.turno) data.turno = data.turno.trim();`);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);

console.log('Fixed memory cleaning');
