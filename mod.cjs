const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// Update initial states
code = code.replace(
  /{ cantidad: '', descripcion: '', marca: '', serie: '', estado: '', inventario: '' }/g,
  `{ cantidad: '', descripcion: '', marca: '', modelo: '', serie: '', estado: '', inventario: '', observaciones: '' }`
);
code = code.replace(
  /{ cantidad: '', descripcion: '', marca: '', serie: '', estado: 'Bueno', inventario: '' }/g,
  `{ cantidad: '', descripcion: '', marca: '', modelo: '', serie: '', estado: 'Bueno', inventario: '', observaciones: '' }`
);
code = code.replace(
  /{ cantidad: '', descripcion: '', marca: '', serie: '', estado: 'Bueno', codigo: '' }/g,
  `{ cantidad: '', descripcion: '', marca: '', modelo: '', serie: '', estado: 'Bueno', codigo: '', observaciones: '' }`
);

// We need to also add modelo and observaciones into the parsing in handleSaveResguardo and handleSaveResguardoEdit
// handleSaveResguardo:
//   return { ... id: art.id, cantidad: qty, descripcion: art.descripcion, marca: art.marca, serie: art.serie, codigo, estado }
code = code.replace(
  /marca: art\.marca \|\| '',\r?\n\s*serie: art\.serie \|\| '',/g,
  `marca: art.marca || '',
              modelo: art.modelo || '',
              serie: art.serie || '',
              observaciones: art.observaciones || '',`
);

// And when adding individually to inventory:
code = code.replace(
  /articulo: \`\$\{art\.descripcion \|\| ''\} \$\{art\.marca \|\| ''\}\`\.trim\(\),\r?\n\s*ubicacion/g,
  `articulo: \`\${art.descripcion || ''} \${art.marca || ''} \${art.modelo || ''}\`.trim(),
                  modelo: art.modelo || '',
                  observaciones: art.observaciones || '',
                  ubicacion`
);

fs.writeFileSync('mod.jsx', code);
console.log('Done mapping.');
