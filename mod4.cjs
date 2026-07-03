const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const regex = /const itemRef = doc\(db, 'inventario', editingItem\.id\);\s+await updateDoc\(itemRef, \{\s+codigo: editingItem\.codigo,\s+articulo: editingItem\.articulo,\s+ubicacion: editingItem\.ubicacion,\s+cantidad: Number\(editingItem\.cantidad\),\s+estado: editingItem\.estado,\s+historial: newHistorial\s+\}\);/;

const replacement = `const itemRef = doc(db, 'inventario', editingItem.id);
      await updateDoc(itemRef, {
        codigo: editingItem.codigo,
        articulo: editingItem.articulo,
        marca: editingItem.marca || '',
        modelo: editingItem.modelo || '',
        serie: editingItem.serie || '',
        observaciones: editingItem.observaciones || '',
        ubicacion: editingItem.ubicacion,
        cantidad: Number(editingItem.cantidad),
        estado: editingItem.estado,
        historial: newHistorial
      });`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
    console.log('handleSaveEdit updateDoc payload updated successfully.');
} else {
    console.log('Target block not found!');
}
