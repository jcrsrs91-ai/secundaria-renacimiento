const fs = require('fs');

const path = 'src/pages/dashboard/Inventario.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix the Resguardo duplicate code bug
const fixResguardoBug = `      } else if (modalOpen === 'resguardo') {
        try {
          const validItems = formData.articulos.filter(art => art.cantidad || art.descripcion || art.marca || art.articulo);
          if (validItems.length > 0) {
            
            // AUTO-LINK: Asignar ID existente a los articulos introducidos manualmente por codigo
            validItems.forEach(art => {
              if (!art.id && (art.codigo || art.inventario)) {
                const manualCode = art.codigo || art.inventario;
                const existing = inventario.find(i => i.codigo === manualCode);
                if (existing) {
                  art.id = existing.id;
                  art.descripcion = existing.descripcion || existing.articulo || art.descripcion;
                  art.marca = existing.marca || art.marca;
                  art.serie = existing.serie || art.serie;
                }
              }
            });
            `;

content = content.replace(
  /      \} else if \(modalOpen === 'resguardo'\) \{\r?\n        try \{\r?\n          const validItems = formData\.articulos\.filter\(art => art\.cantidad \|\| art\.descripcion \|\| art\.marca \|\| art\.articulo\);\r?\n          if \(validItems\.length > 0\) \{/,
  fixResguardoBug
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done optimizing Inventario.jsx part 2');
