const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /\?\s*`S[^`]+-\s*\$\{student\.nombreBeca/g,
    "? `S\\u00cd - ${student.nombreBeca"
  );
  fs.writeFileSync(file, content, 'utf8');
}

fixFile('src/components/HojaDeVida.jsx');
fixFile('src/components/ExpedienteModal.jsx');

console.log('Fixed SI text format in both files');
