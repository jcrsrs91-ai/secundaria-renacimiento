const fs = require('fs');
let cp = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');
cp = cp.replace(/ex.*?menes/g, 'exámenes');
cp = cp.replace(/tr.*?mite/g, 'trámite');
fs.writeFileSync('src/components/ConstanciaPrint.jsx', cp);
