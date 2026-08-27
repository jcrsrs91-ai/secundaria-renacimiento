const fs = require('fs');

// Fix the "Año" in ConstanciaPrint
let file = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');
file = file.replace(/A O/g, 'AÑO');
file = file.replace(/Ao/g, 'Año');
file = file.replace(/1 Trim/g, '1° Trim');
file = file.replace(/2 Trim/g, '2° Trim');
file = file.replace(/3 Trim/g, '3° Trim');
file = file.replace(/snica/g, 'Única');
file = file.replace(/Poblacin/g, 'Población');
file = file.replace(/matrcula/g, 'matrícula');
file = file.replace(/concluy/g, 'concluyó');
file = file.replace(/Educacin/g, 'Educación');
file = file.replace(/institucin/g, 'institución');
fs.writeFileSync('src/components/ConstanciaPrint.jsx', file);

// Fix the periodo in RegularizacionPrint
let regFile = fs.readFileSync('src/components/RegularizacionPrint.jsx', 'utf8');
regFile = regFile.replace(/regularizadas\.push\(\{ \.\.\.mat, finalGrade: reg\.calificacion, fecha: reg\.fecha, isHistoric: true \}\);/g, 
  "regularizadas.push({ ...mat, finalGrade: reg.calificacion, fecha: reg.fecha, periodo: reg.periodo, isHistoric: true });");

regFile = regFile.replace(/regularizadas\.push\(\{ \.\.\.histMat, finalGrade: reg\.calificacion, fecha: reg\.fecha, isHistoric: true \}\);/g, 
  "regularizadas.push({ ...histMat, finalGrade: reg.calificacion, fecha: reg.fecha, periodo: reg.periodo, isHistoric: true });");

fs.writeFileSync('src/components/RegularizacionPrint.jsx', regFile);
console.log('Fixed both files');
