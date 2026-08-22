const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const searchRegex = /await addDoc\(collection\(db, collectionName\), \{\s*nombre: pagoFormData\.nombre,\s*concepto: conceptoConcatenado,\s*monto: montoTotal,\s*detalles: conceptosFiltrados\.map\(d => \(\{ concepto: d\.concepto, monto: parseFloat\(d\.monto\) \}\)\),\s*metodo: pagoFormData\.metodo,\s*createdAt: serverTimestamp\(\),\s*cajaId: cajaTurno\?\.id \|\| 'sin-caja',\s*estado: 'Pagado',\s*fecha: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\s*\}\);/g;

if(searchRegex.test(c)) {
  const replacement = `const pagoRef = await addDoc(collection(db, collectionName), {
          nombre: pagoFormData.nombre,
          concepto: conceptoConcatenado,
          monto: montoTotal,
          detalles: conceptosFiltrados.map(d => ({ concepto: d.concepto, monto: parseFloat(d.monto) })),
          metodo: pagoFormData.metodo,
          createdAt: serverTimestamp(),
          cajaId: cajaTurno?.id || 'sin-caja',
          estado: 'Pagado',
          fecha: new Date().toISOString().split('T')[0]
        });
        
        // CERO PAPEL: Emitir ticket digital para Control Escolar si incluye constancia
        if (pagoFormData.tipo === 'administrativo' && conceptoConcatenado.toLowerCase().includes('constancia')) {
          await addDoc(collection(db, 'tramites_pendientes'), {
            alumno: pagoFormData.nombre,
            pagoId: pagoRef.id,
            concepto: conceptoConcatenado,
            fechaSolicitud: serverTimestamp(),
            estado: 'Pendiente',
            cajaId: cajaTurno?.id || 'sin-caja'
          });
        }`;
  
  c = c.replace(searchRegex, replacement);
  fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
  console.log("Success: Contraloria patched");
} else {
  console.log("Error: Could not find regex in Contraloria.jsx");
}
