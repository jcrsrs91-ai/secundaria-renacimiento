const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

c = c.replace(/await addDoc\(collection\(db, 'tramites_pendientes'\), \{[\s\S]*?\}\);/g, `await addDoc(collection(db, 'tramites_pendientes'), {
            nombreAlumno: pagoFormData.nombre,
            pagoId: pagoRef.id,
            conceptoPago: conceptoConcatenado,
            fechaSolicitud: new Date().toISOString(),
            estado: 'Pendiente',
            cajaId: cajaTurno?.id || 'sin-caja',
            turno: cajaTurno?.turno || 'N/A'
          });`);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log("Patched fields");
