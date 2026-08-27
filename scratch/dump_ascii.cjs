const fs = require('fs');
const text = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');

const regex = /.{0,10}[^\x00-\x7F].{0,10}/g;
let match;
const matches = [];
while ((match = regex.exec(text)) !== null) {
  matches.push(match[0]);
}

console.log(matches.join('\n'));
