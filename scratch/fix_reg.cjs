const fs = require('fs');
let reg = fs.readFileSync('src/components/RegularizacionPrint.jsx', 'utf8');

// replace the button inside the map
reg = reg.replace(/\{onPrintConstanciaExtra && \([\s\S]*?<\/button>\s*\)\}/g, '');

const search = `{item.regularizadas.length > 0 ? (`;
const replace = `{item.regularizadas.length > 0 ? (
                          <div>
                            {onPrintConstanciaExtra && (
                               <button 
                                 onClick={() => onPrintConstanciaExtra(item.student, item.regularizadas)}
                                 className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold flex items-center w-full justify-center no-print mb-2"
                                 title="Imprimir Constancia Global"
                               >
                                 Imprimir Constancia Global
                               </button>
                            )}`;
reg = reg.replace(search, replace);
reg = reg.replace(/<\/ul>\s*\) : \(/, '</ul>\n                          </div>\n                        ) : (');

fs.writeFileSync('src/components/RegularizacionPrint.jsx', reg);
console.log('Fixed RegularizacionPrint');
