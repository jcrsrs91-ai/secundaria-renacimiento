const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const oldUnique = `  const uniqueUbicaciones = useMemo(() => {
    const ubs = new Set();
    inventario.forEach(item => {
      if (item.ubicacion && typeof item.ubicacion === 'string' && item.ubicacion.trim()) {
        ubs.add(item.ubicacion.trim());
      }
    });
    resguardos.forEach(res => {
      res.articulos?.forEach(art => {
         if (art.ubicacion && typeof art.ubicacion === 'string' && art.ubicacion.trim()) {
            ubs.add(art.ubicacion.trim());
         }
      });
    });
    return Array.from(ubs).sort();
  }, [inventario, resguardos]);`;

const newUnique = `  const uniqueUbicaciones = useMemo(() => {
    const ubs = new Set();
    // Extraer de ubicaciones de inventario
    inventario.forEach(item => {
      if (item.ubicacion && typeof item.ubicacion === 'string' && item.ubicacion.trim()) {
        ubs.add(item.ubicacion.trim());
      }
    });
    // Extraer de las áreas de resguardo directamente
    resguardos.forEach(res => {
      if (res.areaResguardante && typeof res.areaResguardante === 'string' && res.areaResguardante.trim()) {
         ubs.add(res.areaResguardante.trim());
      }
      res.articulos?.forEach(art => {
         if (art.ubicacion && typeof art.ubicacion === 'string' && art.ubicacion.trim()) {
            ubs.add(art.ubicacion.trim());
         }
      });
    });
    return Array.from(ubs).sort();
  }, [inventario, resguardos]);`;

code = code.replace(oldUnique, newUnique);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
console.log('Unique ubicaciones patched.');
