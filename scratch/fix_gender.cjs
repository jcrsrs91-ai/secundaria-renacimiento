const fs = require('fs');

let content = fs.readFileSync('src/components/BecasReport.jsx', 'utf8');

// Replace all s.sexo with (s.genero || s.sexo)
content = content.replace(
  "const sexoUpper = s.sexo ? String(s.sexo).toUpperCase() : '';",
  "const sexoUpper = (s.genero || s.sexo) ? String(s.genero || s.sexo).toUpperCase() : '';"
);

content = content.replace(
  "{s.sexo ? String(s.sexo).toUpperCase().startsWith('M') ? 'M' : 'H' : 'H'}",
  "{(s.genero || s.sexo) ? String(s.genero || s.sexo).toUpperCase().startsWith('M') ? 'M' : 'H' : 'H'}"
);

fs.writeFileSync('src/components/BecasReport.jsx', content, 'utf8');
console.log('Fixed gender field from s.sexo to s.genero');
