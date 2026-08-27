const fs = require('fs');

let cp = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');

cp = cp.replace(/<strong>\{mat\.materia \|\| '__________________'\}<\/strong>/, '<strong>{mat.materia ? mat.materia.toUpperCase() : \'__________________\'}</strong>');

fs.writeFileSync('src/components/ConstanciaPrint.jsx', cp);

console.log('Fixed materia uppercase');
