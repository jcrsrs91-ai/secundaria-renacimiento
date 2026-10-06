const fs = require('fs');

let content = fs.readFileSync('src/components/BecasReport.jsx', 'utf8');

content = content.replace(
  "return (a.apellidos || '').localeCompare(b.apellidos || '');",
  "return String(a.apellidos || '').localeCompare(String(b.apellidos || ''));"
);

fs.writeFileSync('src/components/BecasReport.jsx', content, 'utf8');
console.log('Fixed localeCompare crashes');
