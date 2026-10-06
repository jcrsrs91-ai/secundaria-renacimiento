const fs = require('fs');

let content = fs.readFileSync('src/components/BecasReport.jsx', 'utf8');

// Fix string coercions to prevent crashes if Firebase returns a number instead of string
content = content.replace(
  "const nombreStr = s.nombreBeca.toUpperCase().trim();",
  "const nombreStr = String(s.nombreBeca).toUpperCase().trim();"
);

content = content.replace(
  "let rawTipo = (s.nombreBeca || 'NO ESPECIFICADO').trim();",
  "let rawTipo = String(s.nombreBeca || 'NO ESPECIFICADO').trim();"
);

content = content.replace(
  "const sexoUpper = s.sexo?.toUpperCase() || '';",
  "const sexoUpper = s.sexo ? String(s.sexo).toUpperCase() : '';"
);

fs.writeFileSync('src/components/BecasReport.jsx', content, 'utf8');
console.log('Fixed potential TypeErrors with String coercions');
