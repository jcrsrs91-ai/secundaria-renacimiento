const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const uniqueUbicacionesCode = `
  const uniqueUbicaciones = useMemo(() => {
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
  }, [inventario, resguardos]);
`;

if (!code.includes('const uniqueUbicaciones = useMemo')) {
  code = code.replace('const [modalOpen, setModalOpen]', uniqueUbicacionesCode + '\n  const [modalOpen, setModalOpen]');
  fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
  console.log('Injected uniqueUbicaciones successfully.');
} else {
  console.log('uniqueUbicaciones already exists.');
}
