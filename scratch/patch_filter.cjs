const fs = require('fs');

let file = fs.readFileSync('src/components/RegularizacionPrint.jsx', 'utf8');

// Change the filter logic
const regex = /return adeudosData\.filter\(item => item\.student\.grado === filtroGrado\);/;
if (regex.test(file)) {
  file = file.replace(regex, `return adeudosData.filter(item => item.student.grado && item.student.grado.includes(filtroGrado));`);
  fs.writeFileSync('src/components/RegularizacionPrint.jsx', file);
  console.log('Patched filter logic');
} else {
  console.log('Regex not matched');
}
