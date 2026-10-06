const fs = require('fs');

let content = fs.readFileSync('src/components/BecasReport.jsx', 'utf8');

content = content.replace(
  "const tiene = (s.tieneBeca || '').toUpperCase().trim();",
  "const tiene = String(s.tieneBeca || '').toUpperCase().trim();"
);

fs.writeFileSync('src/components/BecasReport.jsx', content, 'utf8');
console.log('Fixed tieneBeca String coercion');
