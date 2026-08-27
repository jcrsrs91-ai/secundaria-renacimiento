const fs = require('fs');
let reg = fs.readFileSync('src/components/RegularizacionPrint.jsx', 'utf8');

reg = reg.replace(/<\/ul>\s*\) : \(\s*<span className="text-slate-400/, 
`</ul>
                          </div>
                        ) : (
                        <span className="text-slate-400`);

fs.writeFileSync('src/components/RegularizacionPrint.jsx', reg);
console.log('Fixed regularizadas div');
