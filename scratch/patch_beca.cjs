const fs = require('fs');

let fileContent = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');

fileContent = fileContent.replace(
  /if\(input\) input\.style\.display = e\.target\.value === '[^']+' \? 'block' : 'none';/,
  "if(input) input.style.display = e.target.value !== 'NO' ? 'block' : 'none';"
);

fileContent = fileContent.replace(
  /style=\{\{display: studentData\?\.tieneBeca === '[^']+' \? 'block' : 'none'\}\}/,
  "style={{display: studentData?.tieneBeca && studentData?.tieneBeca !== 'NO' ? 'block' : 'none'}}"
);

fs.writeFileSync('src/pages/public/PreInscripcion.jsx', fileContent);
console.log('Patched PreInscripcion.jsx');
