const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// 1. handleSaveEdit replacement
const oldSaveEdit = `      const itemRef = doc(db, 'inventario', editingItem.id);
      await updateDoc(itemRef, {
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

const newSaveEdit = `      const itemRef = doc(db, 'inventario', editingItem.id);
      await updateDoc(itemRef, {
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
      });

      // Sincronización con Actas de Resguardo
      try {
        if (originalItem && originalItem.ubicacion !== editingItem.ubicacion) {
          if (originalItem.ubicacion) {
            const oldRes = resguardos.find(r => r.areaResguardante === originalItem.ubicacion);
            if (oldRes && oldRes.articulos) {
              const updatedArts = oldRes.articulos.filter(a => a.codigo !== originalItem.codigo);
              await updateDoc(doc(db, 'resguardos', oldRes.id), { articulos: updatedArts });
            }
          }
          if (editingItem.ubicacion) {
            const newRes = resguardos.find(r => r.areaResguardante === editingItem.ubicacion);
            if (newRes) {
              const updatedArts = newRes.articulos ? [...newRes.articulos] : [];
              const filtered = updatedArts.filter(a => a.codigo !== editingItem.codigo);
              filtered.push({
                id: editingItem.id,
                cantidad: 1,
                descripcion: editingItem.descripcion || editingItem.articulo || '',
                marca: editingItem.marca || '',
                serie: editingItem.serie || '',
                codigo: editingItem.codigo,
                estado: editingItem.estado || 'Bueno'
              });
              await updateDoc(doc(db, 'resguardos', newRes.id), { articulos: filtered });
            }
          }
        } else {
          // Si la ubicación no cambió, actualizar el item dentro del resguardo si existe
          if (editingItem.ubicacion) {
            const currRes = resguardos.find(r => r.areaResguardante === editingItem.ubicacion);
            if (currRes && currRes.articulos) {
              const hasItem = currRes.articulos.some(a => a.codigo === originalItem.codigo);
              if (hasItem) {
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
              }
            }
          }
        }
      } catch (syncErr) {
        console.error("Error sincronizando con resguardos:", syncErr);
      }`;

code = code.replace(oldSaveEdit, newSaveEdit);

// 2. handlePrintSubmit (Resguardo Generation)
const oldResguardoGen = `          const resguardoDoc = {
            folio: formData.folio || '',
            fecha: formData.fecha || new Date().toISOString().split('T')[0],
            nombreResguardante: formData.nombreResguardante || '',
            areaResguardante: formData.areaResguardante || '',
            nombreContralor: formData.nombreContralor || 'Profr. Juan Carlos Taboada B.',
            observaciones: formData.observaciones || '',
            articulos: resguardoArticulos,
            fechaRegistro: new Date().toISOString()
          };
          await addDoc(collection(db, 'resguardos'), resguardoDoc);`;

const newResguardoGen = `          let finalResguardoArticulos = resguardoArticulos;
          const existingResguardo = resguardos.find(r => 
            r.areaResguardante === formData.areaResguardante && 
            r.nombreResguardante === formData.nombreResguardante
          );
          
          if (existingResguardo) {
            const mergedArticulos = existingResguardo.articulos ? [...existingResguardo.articulos] : [];
            for (const newArt of resguardoArticulos) {
              const idx = mergedArticulos.findIndex(a => a.codigo === newArt.codigo);
              if (idx !== -1) {
                mergedArticulos[idx] = { ...mergedArticulos[idx], ...newArt };
              } else {
                mergedArticulos.push(newArt);
              }
            }
            finalResguardoArticulos = mergedArticulos;
            await updateDoc(doc(db, 'resguardos', existingResguardo.id), {
              articulos: mergedArticulos,
              fecha: formData.fecha || existingResguardo.fecha,
              folio: formData.folio || existingResguardo.folio,
              observaciones: formData.observaciones || existingResguardo.observaciones
            });
          } else {
            const resguardoDoc = {
              folio: formData.folio || '',
              fecha: formData.fecha || new Date().toISOString().split('T')[0],
              nombreResguardante: formData.nombreResguardante || '',
              areaResguardante: formData.areaResguardante || '',
              nombreContralor: formData.nombreContralor || 'Profr. Juan Carlos Taboada B.',
              observaciones: formData.observaciones || '',
              articulos: resguardoArticulos,
              fechaRegistro: new Date().toISOString()
            };
            await addDoc(collection(db, 'resguardos'), resguardoDoc);
          }`;

code = code.replace(oldResguardoGen, newResguardoGen);

// 3. Update dataToPrint assignment
const oldDataToPrint = `          // Usar artículos consolidados en la impresión
          dataToPrint.articulos = resguardoArticulos;`;
const newDataToPrint = `          // Usar artículos consolidados en la impresión
          dataToPrint.articulos = typeof finalResguardoArticulos !== 'undefined' ? finalResguardoArticulos : resguardoArticulos;`;

code = code.replace(oldDataToPrint, newDataToPrint);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
console.log('Done sync patching.');
