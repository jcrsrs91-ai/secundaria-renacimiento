const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');

const tOld = `            for (const code of codes) {
              await addDoc(collection(db, 'inventario'), {
                codigo: code,
                articulo: \`\${art.descripcion || ''} \${art.marca || ''}\`.trim() || art.articulo || '',
                descripcion: art.descripcion || art.articulo || '',
                marca: art.marca || '',
                modelo: art.modelo || '',
                serie: art.serie || '',
                observaciones: art.observaciones || '',
                ubicacion: 'Bodega Contraloría',
                cantidad: 1,
                estado: art.estado || 'Nuevo',
                fechaIngreso: new Date().toISOString()
              });
            }`;

const tNew = `            if (!art.id) {
              for (const code of codes) {
                await addDoc(collection(db, 'inventario'), {
                  codigo: code,
                  articulo: \`\${art.descripcion || ''} \${art.marca || ''}\`.trim() || art.articulo || '',
                  descripcion: art.descripcion || art.articulo || '',
                  marca: art.marca || '',
                  modelo: art.modelo || '',
                  serie: art.serie || '',
                  observaciones: art.observaciones || '',
                  ubicacion: 'Bodega Contraloría',
                  cantidad: 1,
                  estado: art.estado || 'Nuevo',
                  fechaIngreso: new Date().toISOString()
                });
              }
            }`;

c = c.replace(tOld, tNew);

// In case code ranges are generated for existing items, we should probably set `display` to `art.codigo`
// if `art.id` is true, because they already have a code!
const displayOld = `const { codes, display } = generateCodeRange(tempCode, qty);`;
const displayNew = `let codes = [];
            let display = art.codigo || '';
            if (!art.id) {
              const gen = generateCodeRange(tempCode, qty);
              codes = gen.codes;
              display = gen.display;
            }`;

c = c.replace(displayOld, displayNew);

fs.writeFileSync('src/pages/dashboard/Inventario.jsx', c, 'utf8');
console.log('Fixed duplications on recepcion loop');
