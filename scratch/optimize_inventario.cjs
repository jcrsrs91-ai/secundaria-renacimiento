const fs = require('fs');

const path = 'src/pages/dashboard/Inventario.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix the Resguardo duplicate code bug
const fixResguardoBug = `      } else if (modalOpen === 'resguardo') {
        try {
          const validItems = formData.articulos.filter(art => art.cantidad || art.descripcion || art.marca || art.articulo);
          if (validItems.length > 0) {
            
            // AUTO-LINK: Asignar ID existente a los articulos introducidos manualmente por codigo
            validItems.forEach(art => {
              if (!art.id && (art.codigo || art.inventario)) {
                const manualCode = art.codigo || art.inventario;
                const existing = inventario.find(i => i.codigo === manualCode);
                if (existing) {
                  art.id = existing.id;
                  art.descripcion = existing.descripcion || existing.articulo || art.descripcion;
                  art.marca = existing.marca || art.marca;
                  art.serie = existing.serie || art.serie;
                }
              }
            });
            `;

content = content.replace(
  `      } else if (modalOpen === 'resguardo') {\n        try {\n          const validItems = formData.articulos.filter(art => art.cantidad || art.descripcion || art.marca || art.articulo);\n          if (validItems.length > 0) {`,
  fixResguardoBug
);

// 2. Disable validation error IF it's a resguardo linking an existing item
const oldValidation = `// Verificar duplicados en códigos manuales
          for (const art of validItems) {
            const qty = Number(art.cantidad) || 1;
            const baseCode = art._generatedBaseCode || art.codigo || art.inventario;
            if (baseCode) {
               const { codes } = generateCodeRange(baseCode, qty);
               for (const code of codes) {
                 if (inventario.some(i => i.codigo === code && i.id !== art.id)) {
                   toast.error(\`El código de inventario \${code} ya existe en el sistema. Usa otro folio.\`);
                   setIsSubmitting(false);
                   return;
                 }
               }
            }
          }`;

const newValidation = `// Verificar duplicados en códigos manuales, SOLO si se va a crear un item nuevo (guardarEnInventario)
          if (formData.guardarEnInventario) {
            for (const art of validItems) {
              const qty = Number(art.cantidad) || 1;
              const baseCode = art._generatedBaseCode || art.codigo || art.inventario;
              if (baseCode) {
                 const { codes } = generateCodeRange(baseCode, qty);
                 for (const code of codes) {
                   if (inventario.some(i => i.codigo === code && i.id !== art.id)) {
                     toast.error(\`El código de inventario \${code} ya existe en el sistema. Usa otro folio.\`);
                     setIsSubmitting(false);
                     return;
                   }
                 }
              }
            }
          }`;

content = content.replace(
  `          // Verificar duplicados en c├│digos manuales
          for (const art of validItems) {
            const qty = Number(art.cantidad) || 1;
            const baseCode = art._generatedBaseCode || art.codigo || art.inventario;
            if (baseCode) {
               const { codes } = generateCodeRange(baseCode, qty);
               for (const code of codes) {
                 if (inventario.some(i => i.codigo === code && i.id !== art.id)) {
                   toast.error(\`El c├│digo de inventario \${code} ya existe en el sistema. Usa otro folio.\`);
                   setIsSubmitting(false);
                   return;
                 }
               }
            }
          }`,
  newValidation
);

// To avoid encoding issues, fallback to utf-8 matching
content = content.replace(
  /          \/\/ Verificar duplicados en c.digos manuales\r?\n          for \(const art of validItems\) \{\r?\n            const qty = Number\(art.cantidad\) \|\| 1;\r?\n            const baseCode = art._generatedBaseCode \|\| art.codigo \|\| art.inventario;\r?\n            if \(baseCode\) \{\r?\n               const \{ codes \} = generateCodeRange\(baseCode, qty\);\r?\n               for \(const code of codes\) \{\r?\n                 if \(inventario.some\(i => i.codigo === code && i.id !== art.id\)\) \{\r?\n                   toast.error\(`El c.digo de inventario \$\{code\} ya existe en el sistema. Usa otro folio.`\);\r?\n                   setIsSubmitting\(false\);\r?\n                   return;\r?\n                 \}\r?\n               \}\r?\n            \}\r?\n          \}/g,
  newValidation
);

// Strip out unused POS effects that load hundreds of students
content = content.replace(/  useEffect\(\(\) => \{\r?\n    const q = query\(collection\(db, 'students'\)\);\r?\n    const unsubscribe = onSnapshot\(q, \(snapshot\) => \{[\s\S]*?setPagosRecientes\(items\.reverse\(\)\); setAllStudentsRaw\(rawItems\);\r?\n    \}\);\r?\n    return \(\) => unsubscribe\(\);\r?\n  \}, \[\]\);\r?\n/g, '');

content = content.replace(/  useEffect\(\(\) => \{\r?\n    const qAdmin = query\(collection\(db, 'pagos_administrativos'\)\);[\s\S]*?    return \(\) => \{ unsubAdmin\(\); unsubExtra\(\); \};\r?\n  \}, \[\]\);\r?\n/g, '');

content = content.replace(/  useEffect\(\(\) => \{\r?\n    \/\/ Escuchar si ya hay una caja abierta para este usuario[\s\S]*?    \}\);\r?\n    return \(\) => unsub\(\);\r?\n  \}, \[\]\);\r?\n/g, '');

content = content.replace(/  \/\/ Escuchar gastos \(egresos\) de la caja actual\r?\n  useEffect\(\(\) => \{[\s\S]*?    \}\);\r?\n    return \(\) => unsub\(\);\r?\n  \}, \[cajaTurno\]\);\r?\n/g, '');

// Clean up POS Tabs in the render section
// Since JSX stripping via regex is brittle, we'll try a focused string replacement on the big tab buttons.
// Find the buttons for "pagos", "gastos", "dashboard", "corte" and remove them.
content = content.replace(/<button\r?\n            onClick=\{\(\) => setActiveTab\('pagos'\)\}[\s\S]*?<\/button>/g, '');
content = content.replace(/<button\r?\n            onClick=\{\(\) => setActiveTab\('gastos'\)\}[\s\S]*?<\/button>/g, '');
content = content.replace(/<button\r?\n            onClick=\{\(\) => setActiveTab\('dashboard'\)\}[\s\S]*?<\/button>/g, '');
content = content.replace(/<button\r?\n            onClick=\{\(\) => setActiveTab\('corte'\)\}[\s\S]*?<\/button>/g, '');

fs.writeFileSync(path, content, 'utf8');
console.log('Done optimizing Inventario.jsx');
