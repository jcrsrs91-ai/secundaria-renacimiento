const fs = require('fs');

let content = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');

// Replace any corrupted SÍ with S\u00cd (SÍ)
content = content.replace(
  /\?\s*`S[^`]+-\s*\$\{student\.nombreBeca/g,
  "? `S\\u00cd - ${student.nombreBeca"
);

// Just in case, replace the old 'SÍ' too
content = content.replace(
  /: 'S[^']+'/g,
  ": 'S\\u00cd'"
);

fs.writeFileSync('src/components/HojaDeVida.jsx', content, 'utf8');
console.log('Fixed SI text format in HojaDeVida');
