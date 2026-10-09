const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

c = c.replace(
  /if \(a\.grado === '1er Grado' \|\| a\.grado === '1ero' \|\| a\.grado === '1'\) edadIndex = 1; \/\/ 12\s*else if \(a\.grado === '2do Grado' \|\| a\.grado === '2do' \|\| a\.grado === '2'\) edadIndex = 2; \/\/ 13/,
  "if (a.grado?.includes('1er') || a.grado === '1ero' || a.grado === '1') edadIndex = 1; // 12\n          else if (a.grado?.includes('2do') || a.grado === '2') edadIndex = 2; // 13"
);

c = c.replace(
  /let g = '1';\s*if \(a\.grado === '2do Grado' \|\| a\.grado === '2do' \|\| a\.grado === '2'\) g = '2';\s*if \(a\.grado === '3er Grado' \|\| a\.grado === '3ero' \|\| a\.grado === '3ro' \|\| a\.grado === '3'\) g = '3';/,
  "let g = '1';\n        if (a.grado?.includes('2do') || a.grado === '2') g = '2';\n        if (a.grado?.includes('3er') || a.grado?.includes('3ro') || a.grado === '3ero' || a.grado === '3') g = '3';"
);

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
