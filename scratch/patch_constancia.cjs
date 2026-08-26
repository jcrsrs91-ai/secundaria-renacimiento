const fs = require('fs');

let content = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');

// The line is:
// <strong>{student.manualPromedio ? `${student.manualPromedio} (${promedioALetras(student.manualPromedio)})` : '___ (_________________)'}</strong>.
// But only for type === 'inscripcion_primero'

const searchStr = `concluy\u00f3 su Educaci\u00f3n Primaria con un promedio de <strong>{student.manualPromedio ? \`\${student.manualPromedio} (\${promedioALetras(student.manualPromedio)})\` : '___ (_________________)'}</strong>`;
const replaceStr = `concluy\u00f3 su Educaci\u00f3n Primaria con un promedio de <strong>{(student.promedioEscuela || student.manualPromedio) ? \`\${student.promedioEscuela || student.manualPromedio} (\${promedioALetras(student.promedioEscuela || student.manualPromedio)})\` : '___ (_________________)'}</strong>`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync('src/components/ConstanciaPrint.jsx', content);
  console.log('Patched ConstanciaPrint.jsx successfully');
} else {
  console.log('Search string not found, trying regex...');
  const regex = /concluy[\u00f3\uFFFD]+ su Educaci[\u00f3\uFFFD]+n Primaria con un promedio de <strong>\{student\.manualPromedio \? `\$\{student\.manualPromedio\} \(\$\{promedioALetras\(student\.manualPromedio\)\}\)` : '___ \(_________________\)'\}<\/strong>/;
  if (regex.test(content)) {
    content = content.replace(regex, `concluy\u00f3 su Educaci\u00f3n Primaria con un promedio de <strong>{(student.promedioEscuela || student.manualPromedio) ? \`\${student.promedioEscuela || student.manualPromedio} (\${promedioALetras(student.promedioEscuela || student.manualPromedio)})\` : '___ (_________________)'}</strong>`);
    fs.writeFileSync('src/components/ConstanciaPrint.jsx', content);
    console.log('Patched with regex');
  } else {
    console.log('Failed to patch, could not find the exact string.');
  }
}
