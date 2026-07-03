const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// 1. Fix handleSaveEdit
const oldSaveEdit = `      await updateDoc(itemRef, {
        codigo: editingItem.codigo,
        articulo: editingItem.articulo,
        ubicacion: editingItem.ubicacion,
        cantidad: Number(editingItem.cantidad),
        estado: editingItem.estado,
        historial: newHistorial
      });`;
const newSaveEdit = `      await updateDoc(itemRef, {
        codigo: editingItem.codigo,
        articulo: editingItem.articulo,
        descripcion: editingItem.descripcion || editingItem.articulo || '',
        marca: editingItem.marca || '',
        modelo: editingItem.modelo || '',
        serie: editingItem.serie || '',
        observaciones: editingItem.observaciones || '',
        ubicacion: editingItem.ubicacion,
        cantidad: Number(editingItem.cantidad),
        estado: editingItem.estado,
        historial: newHistorial
      });`;
code = code.replace(oldSaveEdit, newSaveEdit);

// 2. Fix handlePrintSubmit (Recepción)
const oldAltaAdd = `              await addDoc(collection(db, 'inventario'), {
                codigo: code,
                articulo: \`\${art.descripcion || ''} \${art.marca || ''}\`.trim(),
                ubicacion: 'Bodega Contraloría',
                cantidad: 1,
                estado: art.estado || 'Nuevo',
                serie: art.serie || '',
                fechaIngreso: new Date().toISOString()
              });`;
const newAltaAdd = `              await addDoc(collection(db, 'inventario'), {
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
              });`;
code = code.replace(oldAltaAdd, newAltaAdd);

// 3. Fix handlePrintSubmit (Resguardo - New item add)
const oldResgAdd = `                await addDoc(collection(db, 'inventario'), {
                  codigo: code,
                  articulo: \`\${art.descripcion || ''} \${art.marca || ''}\`.trim(),
                  ubicacion: formData.areaResguardante || 'En resguardo',
                  cantidad: 1, // Guardado individualmente
                  estado: art.estado || 'Bueno',
                  serie: art.serie || '',
                  fechaIngreso: new Date().toISOString()
                });`;
const newResgAdd = `                await addDoc(collection(db, 'inventario'), {
                  codigo: code,
                  articulo: \`\${art.descripcion || ''} \${art.marca || ''}\`.trim() || art.articulo || '',
                  descripcion: art.descripcion || art.articulo || '',
                  marca: art.marca || '',
                  modelo: art.modelo || '',
                  serie: art.serie || '',
                  observaciones: art.observaciones || '',
                  ubicacion: formData.areaResguardante || 'En resguardo',
                  cantidad: 1, // Guardado individualmente
                  estado: art.estado || 'Bueno',
                  fechaIngreso: new Date().toISOString()
                });`;
code = code.replace(oldResgAdd, newResgAdd);

// 4. Fix handlePrintSubmit (Resguardo - Update existing item)
const oldResgUpdate = `              await updateDoc(itemRef, {
                ubicacion: formData.areaResguardante || 'En resguardo',
                estado: art.estado || 'Bueno',
                historial: [...currentHistorial, {
                  fecha: new Date().toISOString(),
                  accion: "Asignación de Resguardo",
                  detalle: \`Asignado a \${formData.nombreResguardante} (Folio \${formData.folio || 'S/F'}).\`,
                  usuario: "Contraloría"
                }]
              });`;
const newResgUpdate = `              await updateDoc(itemRef, {
                ubicacion: formData.areaResguardante || 'En resguardo',
                estado: art.estado || 'Bueno',
                descripcion: art.descripcion || art.articulo || invItem?.descripcion || invItem?.articulo || '',
                marca: art.marca || invItem?.marca || '',
                modelo: art.modelo || invItem?.modelo || '',
                serie: art.serie || invItem?.serie || '',
                observaciones: art.observaciones || invItem?.observaciones || '',
                historial: [...currentHistorial, {
                  fecha: new Date().toISOString(),
                  accion: "Asignación de Resguardo",
                  detalle: \`Asignado a \${formData.nombreResguardante} (Folio \${formData.folio || 'S/F'}).\`,
                  usuario: "Contraloría"
                }]
              });`;
code = code.replace(oldResgUpdate, newResgUpdate);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
console.log('Update Complete.');
