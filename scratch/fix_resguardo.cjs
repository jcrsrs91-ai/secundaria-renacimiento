const fs = require('fs');
const path = 'src/pages/dashboard/Inventario.jsx';
let content = fs.readFileSync(path, 'utf8');

// Use simple string replacement
const searchString = `    } else if (modalOpen === 'resguardo') {
      try {
        const validItems = formData.articulos.filter(art => art.cantidad || art.descripcion || art.marca || art.articulo);
        if (validItems.length > 0) {
          let autoCodeOffsets = {};
          // 1. Crear art`;

const insertAutoLink = `    } else if (modalOpen === 'resguardo') {
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
          
          let autoCodeOffsets = {};
          // 1. Crear art`;

const fixedContent = content.replace(searchString, insertAutoLink);
if (fixedContent === content) {
    console.log("Failed to find resguardo block 1!");
} else {
    content = fixedContent;
}

const searchValidation = `          // Verificar duplicados en c`;
const validationBlock = content.substring(content.indexOf(searchValidation), content.indexOf(`          let finalResguardoArticulos = resguardoArticulos;`));

const replacementValidation = `          // Verificar duplicados en códigos manuales, SOLO si se va a crear un item nuevo
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
          }
`;

if(validationBlock.includes("Verificar duplicados")) {
    content = content.replace(validationBlock, replacementValidation);
} else {
    console.log("Failed to find validation block!");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Done fixing resguardo logic.");
