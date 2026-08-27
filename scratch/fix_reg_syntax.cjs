const fs = require('fs');
let reg = fs.readFileSync('src/components/RegularizacionPrint.jsx', 'utf8');

// The replacement was accidentally done to item.adeudos
// Let's fix that
reg = reg.replace(/<\/ul>\s*<\/div>\s*\) : \(\s*<span className="text-emerald-600/g, 
`</ul>
                        ) : (
                        <span className="text-emerald-600`);

fs.writeFileSync('src/components/RegularizacionPrint.jsx', reg);
console.log('Fixed syntax error');
