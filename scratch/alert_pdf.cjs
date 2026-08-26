const fs = require('fs');
let content = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

content = content.replace(
  "console.error('Error generating PDF:', error);",
  "console.error('Error generating PDF:', error); alert('Error PDF: ' + (error.message || error));"
);

fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', content);
