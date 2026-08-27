const fs = require('fs');

let cp = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');

cp = cp.replace(/\) : \) : type === 'acreditacion_extraordinario' \? \(/, ") : type === 'acreditacion_extraordinario' ? (");

fs.writeFileSync('src/components/ConstanciaPrint.jsx', cp);
console.log('Fixed syntax error');
