const fs = require('fs');

let content = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');

// The line is: ? student.nombreBeca ? String(student.nombreBeca).toUpperCase() : 'SÍ' 
content = content.replace(
  "? student.nombreBeca ? String(student.nombreBeca).toUpperCase() : 'SÍ'",
  "? `SÍ - ${student.nombreBeca ? String(student.nombreBeca).toUpperCase().trim() : 'NO ESPECIFICADO'}`"
);

fs.writeFileSync('src/components/HojaDeVida.jsx', content, 'utf8');
console.log('Fixed Beca text format in HojaDeVida');
