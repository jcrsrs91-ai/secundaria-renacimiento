const fs = require('fs');
let file = 'src/components/Calificaciones.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const csvContent = " \\uFEFF\ \+ Papa\.unparse\(\{ fields: headers, data \}, \{ delimiter: ",\ \}\)\.toUpperCase\(\);\s+const blob = new Blob\(\[csvContent\], \{ type: 'text\/csv;charset=utf-8;' \}\);\s+const link = document\.createElement\('a'\);\s+link\.href = URL\.createObjectURL\(blob\);\s+link\.download = ([^]+);\s+link\.click\(\);/g, 
  const csvStr = Papa.unparse({ fields: headers, data }, { delimiter: \\\t\ }).toUpperCase();\n    downloadExcelFriendlyCsv(\\$1\\, csvStr););

fs.writeFileSync(file, content);
console.log('Fixed', file);