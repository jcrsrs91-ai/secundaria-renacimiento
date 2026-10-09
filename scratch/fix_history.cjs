const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');

const tOld = `          // 1. Guardar el documento general (Acta)
          await addDoc(collection(db, 'actas_recepcion'), {
            fecha: formData.fecha,
            hora: formData.hora,
            origen: formData.origen,
            proveedor: formData.proveedor,
            nombreProveedor: formData.nombreProveedor,
            nombreContralor: formData.nombreContralor,
            observaciones: formData.observaciones,
            articulosTotales: validItems.length,
            fechaRegistro: new Date().toISOString()
          });

          let autoCodeOffsets = {};
          const recepcionArticulos = [];`;

const tNew = `          let autoCodeOffsets = {};
          const recepcionArticulos = [];`;

c = c.replace(tOld, tNew);

const tOld2 = `            recepcionArticulos.push({ ...art, codigo: display });
          }
          dataToPrint.articulos = recepcionArticulos;
        }`;

const tNew2 = `            recepcionArticulos.push({ ...art, codigo: display });
          }
          
          const folioAlta = "ALTA-" + Date.now().toString().slice(-6);
          // 1. Guardar el documento general (Acta)
          await addDoc(collection(db, 'actas_recepcion'), {
            folio: folioAlta,
            tipo: 'Alta',
            fecha: formData.fecha,
            hora: formData.hora,
            origen: formData.origen,
            proveedor: formData.proveedor,
            nombreProveedor: formData.nombreProveedor,
            nombreContralor: formData.nombreContralor,
            observaciones: formData.observaciones,
            articulos: recepcionArticulos,
            articulosTotales: validItems.length,
            fechaRegistro: new Date().toISOString()
          });

          dataToPrint.articulos = recepcionArticulos;
        }`;

c = c.replace(tOld2, tNew2);

// Update useEffect to fetch actas_recepcion
const tOld3 = `  useEffect(() => {
    const qRes = query(collection(db, 'resguardos'), orderBy('fechaRegistro', 'desc'));
    const unsubscribeRes = onSnapshot(qRes, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setResguardos(items);
    });
    return () => unsubscribeRes();
  }, []);`;

const tNew3 = `  useEffect(() => {
    const qRes = query(collection(db, 'resguardos'), orderBy('fechaRegistro', 'desc'));
    const unsubscribeRes = onSnapshot(qRes, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setResguardos(prev => {
        const others = prev.filter(p => p.tipo === 'Alta');
        return [...items, ...others].sort((a,b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
      });
    });

    const qRec = query(collection(db, 'actas_recepcion'), orderBy('fechaRegistro', 'desc'));
    const unsubscribeRec = onSnapshot(qRec, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setResguardos(prev => {
        const others = prev.filter(p => p.tipo !== 'Alta');
        return [...items, ...others].sort((a,b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
      });
    });

    return () => { unsubscribeRes(); unsubscribeRec(); };
  }, []);`;

c = c.replace(tOld3, tNew3);


// Make sure the table shows Altas appropriately.
// They have 'proveedor' or 'origen' instead of 'resguardante'
const tOld4 = `<td className="px-6 py-4 text-sm text-slate-600 font-bold">{r.resguardante || r.nombreResguardante || 'Desconocido'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.area || r.areaResguardante || r.cargo || 'N/A'}</td>`;

const tNew4 = `<td className="px-6 py-4 text-sm text-slate-600 font-bold">
                      {r.tipo === 'Alta' ? 'Sistema / Escuela' : (r.resguardante || r.nombreResguardante || 'Desconocido')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {r.tipo === 'Alta' ? 'NUEVO INGRESO' : (r.area || r.areaResguardante || r.cargo || 'N/A')}
                    </td>`;

c = c.replace(tOld4, tNew4);

const tOld5 = `<button onClick={() => { setPrintData(r); setPrintMode("resguardo"); setTimeout(() => window.print(), 500); }} className="ml-4 text-indigo-600 hover:text-indigo-800 font-medium text-xs">Imprimir PDF</button>`;
const tNew5 = `<button onClick={() => { setPrintData(r); setPrintMode(r.tipo === 'Alta' ? 'recepcion' : (r.tipo === 'Baja' ? 'baja' : 'resguardo')); setTimeout(() => window.print(), 500); }} className="ml-4 text-indigo-600 hover:text-indigo-800 font-medium text-xs">Imprimir PDF</button>`;
c = c.replace(tOld5, tNew5);


fs.writeFileSync('src/pages/dashboard/Inventario.jsx', c, 'utf8');
console.log('Fixed recepcion history');
