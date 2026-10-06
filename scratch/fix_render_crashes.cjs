const fs = require('fs');

let content = fs.readFileSync('src/components/BecasReport.jsx', 'utf8');

content = content.replace(
  "{s.sexo?.toUpperCase().startsWith('M') ? 'M' : 'H'}",
  "{s.sexo ? String(s.sexo).toUpperCase().startsWith('M') ? 'M' : 'H' : 'H'}"
);

content = content.replace(
  "{s.nombreBeca ? s.nombreBeca.toUpperCase() : 'NO ESPECIFICADO'}",
  "{s.nombreBeca ? String(s.nombreBeca).toUpperCase() : 'NO ESPECIFICADO'}"
);

fs.writeFileSync('src/components/BecasReport.jsx', content, 'utf8');
console.log('Fixed render crashes');
