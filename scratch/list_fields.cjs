const fs = require('fs');
const content = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');
const matches = content.match(/name="[^"]+"/g);
if (matches) {
  const unique = [...new Set(matches.map(m => m.replace('name="', '').replace('"', '')))];
  console.log('Fields:', unique.join(', '));
}
