const fs = require('fs');

let inv = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');

inv = inv.replace(
  "inventario.filter(i => i.nombre.toLowerCase().includes(inventarioSearch.toLowerCase()))",
  "inventario.filter(i => (i.nombre || '').toLowerCase().includes(inventarioSearch.toLowerCase()))"
);

fs.writeFileSync('src/pages/dashboard/Inventario.jsx', inv);
console.log("Fixed undefined filter");
