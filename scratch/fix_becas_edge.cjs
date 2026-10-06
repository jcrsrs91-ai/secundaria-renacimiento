const fs = require('fs');

let content = fs.readFileSync('src/components/BecasReport.jsx', 'utf8');

content = content.replace(
  "      // Si no hay dato de beca, o explícitamente dice NO, lo descartamos\n      if (!s.tieneBeca) return false;",
  "      // Si no hay dato en tieneBeca, no descartamos inmediatamente, evaluamos nombreBeca más abajo\n      const tiene = (s.tieneBeca || '').toUpperCase().trim();"
);

content = content.replace(
  "      const tiene = s.tieneBeca.toUpperCase().trim();",
  ""
);

fs.writeFileSync('src/components/BecasReport.jsx', content, 'utf8');
console.log('Fixed undefined tieneBeca edge case');
