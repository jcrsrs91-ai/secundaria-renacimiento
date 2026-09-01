const fs = require('fs');
let code = fs.readFileSync('src/components/MatriculaGruposPrint.jsx', 'utf8');

code = code.replace(/\{renderRow\('TOTALES 1ER GRADO', '1er Grado', true\)\}([\s\S]*?)<\/>\s*\)\}\s*<\/>\s*\)\}/, '{renderRow(\'TOTALES 1ER GRADO\', \'1er Grado\', true)}\n                </>\n              )}');
code = code.replace(/\{renderRow\('TOTALES 2DO GRADO', '2do Grado', true\)\}([\s\S]*?)<\/>\s*\)\}\s*<\/>\s*\)\}/, '{renderRow(\'TOTALES 2DO GRADO\', \'2do Grado\', true)}\n                </>\n              )}');
code = code.replace(/\{renderRow\('TOTALES 3ER GRADO', '3er Grado', true\)\}([\s\S]*?)<\/>\s*\)\}\s*<\/>\s*\)\}/, '{renderRow(\'TOTALES 3ER GRADO\', \'3er Grado\', true)}\n                </>\n              )}');
code = code.replace(/<\/td>\s*<\/tr>\s*\)\}\s*\)\}\s*<\/tbody>/g, '</td>\n              </tr>\n              )}\n            </tbody>');

fs.writeFileSync('src/components/MatriculaGruposPrint.jsx', code);