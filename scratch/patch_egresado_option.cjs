const fs = require('fs');

// Patch RegularizacionPrint.jsx
let regFile = fs.readFileSync('src/components/RegularizacionPrint.jsx', 'utf8');

const regexOptions = /<option value="3er Grado">3er Grado<\/option>/;
if (regFile.includes('<option value="3er Grado">3er Grado</option>') && !regFile.includes('<option value="Egresado">Egresados</option>')) {
  regFile = regFile.replace(regexOptions, '<option value="3er Grado">3er Grado</option>\n            <option value="Egresado">Egresados</option>');
  fs.writeFileSync('src/components/RegularizacionPrint.jsx', regFile);
  console.log('Patched options');
} else {
  console.log('Already patched or not found');
}
