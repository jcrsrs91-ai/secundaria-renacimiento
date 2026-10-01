const fs = require('fs');
const path = 'src/pages/dashboard/Inventario.jsx';
let text = fs.readFileSync(path, 'utf8');

const replacements = {
    'ÔÇó': '•',
    'Ô×ò': '+'
};

for (const [bad, good] of Object.entries(replacements)) {
    text = text.split(bad).join(good);
}

fs.writeFileSync(path, text, 'utf8');
console.log('Fixed dos mangling in Inventario.jsx');
