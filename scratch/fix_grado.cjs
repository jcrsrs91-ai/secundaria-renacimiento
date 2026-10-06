const fs = require('fs');

let content = fs.readFileSync('src/components/BecasReport.jsx', 'utf8');

// 1. Fix the filter
content = content.replace(
  "return activos.filter(a => String(a.grado) === selectedGrado);",
  "return activos.filter(a => String(a.grado).startsWith(selectedGrado));"
);

// 2. Fix the Grado key format
content = content.replace(
  "const grado = s.grado || '?';",
  "const grado = s.grado ? String(s.grado).charAt(0) : '?';"
);

// 3. Fix the table cell display
content = content.replace(
  "<td className=\"p-3 text-center text-slate-600\">{s.grado}°</td>",
  "<td className=\"p-3 text-center text-slate-600\">{s.grado ? String(s.grado).charAt(0) : '?'}°</td>"
);

fs.writeFileSync('src/components/BecasReport.jsx', content, 'utf8');
console.log('Fixed Grado filtering and display formatting');
