const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const regex = /<button onClick=\{async \(\) => \{\s*if\(window\.confirm\('¿Estás seguro de eliminar este pago\? Esta acción no se puede deshacer\.'\)\) \{\s*try \{\s*const colName = p\.sysTipo === 'Extra' \? 'pagos_extraordinarios' : 'pagos_administrativos';\s*await deleteDoc\(doc\(db, colName, p\.id\)\);\s*toast\.success\('Pago eliminado exitosamente'\);\s*\} catch \(error\) \{\s*toast\.error\('Error al eliminar el pago'\);\s*\}\s*\}\s*\}\} className="text-slate-400 hover:text-rose-600 transition-colors p-1" title="Eliminar Pago">/g;

// Fallback regex for weird encoding
const regex2 = /<button onClick=\{async \(\) => \{\s*if\(window\.confirm\('Ests seguro de eliminar este pago\? Esta accin no se puede deshacer\.'\)\) \{\s*try \{\s*const colName = p\.sysTipo === 'Extra' \? 'pagos_extraordinarios' : 'pagos_administrativos';\s*await deleteDoc\(doc\(db, colName, p\.id\)\);\s*toast\.success\('Pago eliminado exitosamente'\);\s*\} catch \(error\) \{\s*toast\.error\('Error al eliminar el pago'\);\s*\}\s*\}\s*\}\} className="text-slate-400 hover:text-rose-600 transition-colors p-1" title="Eliminar Pago">/g;


const replacement = `<button onClick={async () => {
                         if(window.confirm('¿Estás seguro de eliminar este pago? Esta acción no se puede deshacer.')) {
                           try {
                             if (p.tipoIngreso === 'sistema') {
                               await updateDoc(doc(db, 'students', p.id), { pagoInscripcion: false, pagoFecha: null });
                             } else {
                               const colName = p.sysTipo === 'Extra' ? 'pagos_extraordinarios' : 'pagos_administrativos';
                               await deleteDoc(doc(db, colName, p.id));
                             }
                             toast.success('Pago eliminado exitosamente');
                           } catch (error) {
                             toast.error('Error al eliminar el pago');
                           }
                         }
                       }} className="text-slate-400 hover:text-rose-600 transition-colors p-1" title="Eliminar Pago">`;

let matched = false;
if (regex.test(c)) {
  c = c.replace(regex, replacement);
  matched = true;
} else if (regex2.test(c)) {
  c = c.replace(regex2, replacement);
  matched = true;
} else {
    // try a more generic replacement
    const genericRegex = /<button onClick=\{async \(\) => \{\s*if\(window\.confirm\([^)]*\)\) \{\s*try \{\s*const colName = p\.sysTipo[^;]*;\s*await deleteDoc\([^)]*\)\);\s*toast\.success\([^)]*\);\s*\} catch \(error\) \{\s*toast\.error\([^)]*\);\s*\}\s*\}\s*\}\} className="text-slate-400 hover:text-rose-600 transition-colors p-1" title="Eliminar Pago">/g;
    if (genericRegex.test(c)) {
        c = c.replace(genericRegex, replacement);
        matched = true;
    }
}

if (matched) {
    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
    console.log("Patched delete logic successfully");
} else {
    console.log("Could not find the delete logic to patch");
}
