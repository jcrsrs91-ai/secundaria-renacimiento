const fs = require('fs');
const path = 'src/pages/dashboard/Inventario.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const validItems = formData\.articulos\.filter\(art => art\.cantidad \|\| art\.descripcion \|\| art\.marca \|\| art\.articulo\);\r?\n\s*if \(validItems\.length > 0\) \{\r?\n\s*let autoCodeOffsets = \{\};/;

const replacement = `const validItems = formData.articulos.filter(art => art.cantidad || art.descripcion || art.marca || art.articulo);
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
          
          let autoCodeOffsets = {};`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Regex succeeded.");
} else {
    console.log("Regex failed.");
}
