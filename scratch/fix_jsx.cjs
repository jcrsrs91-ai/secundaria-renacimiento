const fs = require('fs');

let content = fs.readFileSync('src/components/BecasReport.jsx', 'utf8');

content = content.replace(
  "Padrón de Becas Escolar {selectedGrado !== 'TODOS' ? \\`- \\${selectedGrado}er GRADO\\` : ''}",
  "Padrón de Becas Escolar {selectedGrado !== 'TODOS' ? `- ${selectedGrado}er GRADO` : ''}"
);

fs.writeFileSync('src/components/BecasReport.jsx', content, 'utf8');
console.log('Fixed JSX syntax error');
