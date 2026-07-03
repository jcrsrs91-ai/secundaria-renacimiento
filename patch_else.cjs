const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const oldElse = `              if (hasItem) {
                const updatedArts = currRes.articulos.map(a => {
                  if (a.codigo === originalItem.codigo) {
                    return {
                      ...a,
                      descripcion: editingItem.descripcion || editingItem.articulo || '',
                      marca: editingItem.marca || '',
                      serie: editingItem.serie || '',
                      codigo: editingItem.codigo,
                      estado: editingItem.estado || 'Bueno'
                    };
                  }
                  return a;
                });
                await updateDoc(doc(db, 'resguardos', currRes.id), { articulos: updatedArts });
              }`;

const newElse = `              if (hasItem) {
                const updatedArts = currRes.articulos.map(a => {
                  if (a.codigo === originalItem.codigo) {
                    return {
                      ...a,
                      descripcion: editingItem.descripcion || editingItem.articulo || '',
                      marca: editingItem.marca || '',
                      serie: editingItem.serie || '',
                      codigo: editingItem.codigo,
                      estado: editingItem.estado || 'Bueno'
                    };
                  }
                  return a;
                });
                await updateDoc(doc(db, 'resguardos', currRes.id), { articulos: updatedArts });
              } else {
                // Si no lo tiene, lo agregamos (para sincronizar ediciones atrasadas)
                const newArt = {
                  id: editingItem.id,
                  cantidad: 1,
                  descripcion: editingItem.descripcion || editingItem.articulo || '',
                  marca: editingItem.marca || '',
                  serie: editingItem.serie || '',
                  codigo: editingItem.codigo,
                  estado: editingItem.estado || 'Bueno'
                };
                const updatedArts = [...currRes.articulos, newArt];
                await updateDoc(doc(db, 'resguardos', currRes.id), { articulos: updatedArts });
              }`;

code = code.replace(oldElse, newElse);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
console.log('Else patched.');
