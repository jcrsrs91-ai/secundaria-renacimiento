const fs = require('fs');
let fileContent = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

// Add crossOrigin to fotoUrl
fileContent = fileContent.replace(
  '<img src={data.fotoUrl} alt="Fotografía" className="w-full h-full object-cover grayscale" />',
  '<img src={data.fotoUrl} alt="Fotografía" className="w-full h-full object-cover grayscale" crossOrigin="anonymous" />'
);

// Add skipFonts to toJpeg options and add a better catch block
fileContent = fileContent.replace(
  /const imgData = await toJpeg\(element, \{ quality: 0\.98, backgroundColor: '#ffffff', pixelRatio: 2 \}\);/,
  "const imgData = await toJpeg(element, { quality: 0.98, backgroundColor: '#ffffff', pixelRatio: 2, skipFonts: true, imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=' });"
);

fileContent = fileContent.replace(
  "alert('Hubo un error al generar el PDF. Se abrirá la opción de imprimir normal. ' + error.message);",
  "alert('Hubo un error al generar el PDF. Se abrirá la opción de imprimir normal. Error: ' + (error?.message || error || 'desconocido'));"
);

fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', fileContent);
console.log('Patched fotoUrl crossOrigin and skipFonts');
