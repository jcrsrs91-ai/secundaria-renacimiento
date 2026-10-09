const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');

c = c.replace(
  "const inventarioUsados = inventario.filter(i => i.estado !== 'Nuevo');",
  "const inventarioUsados = inventario; // Now this acts as GLOBAL inventory"
);

c = c.replace(
  "Bienes en Uso (Bueno, Regular, Malo)",
  "Inventario Global Consolidado (Nuevos + En Uso)"
);

fs.writeFileSync('src/pages/dashboard/Inventario.jsx', c, 'utf8');
console.log('Changed Usados to Global');
