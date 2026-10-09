const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');

c = c.replace(
  "for (const code of codes) {\\n              await addDoc(collection(db, 'inventario')",
  "if (!art.id) {\n              for (const code of codes) {\n                await addDoc(collection(db, 'inventario')"
);

c = c.replace(
  "fechaIngreso: new Date().toISOString()\\n              });\\n            }",
  "fechaIngreso: new Date().toISOString()\n                });\n              }\n            }"
);

// We need to do exact replacement, regular expressions can be tricky here.
