const fs = require('fs');
let code = fs.readFileSync('src/components/MatriculaGruposPrint.jsx', 'utf8');

code = code.replace(
  /\{\/\*\s*PRIMER GRADO\s*\*\/\}\s*<tr>/,
  {/* PRIMER GRADO */}\n              {(selectedGrado === 'Todos' || selectedGrado === '1er Grado') && (\n                <>\n                  <tr>
);
code = code.replace(
  /\{renderRow\('TOTALES 1ER GRADO', '1er Grado', true\)\}/,
  {renderRow('TOTALES 1ER GRADO', '1er Grado', true)}\n                </>\n              )}
);

code = code.replace(
  /\{\/\*\s*SEGUNDO GRADO\s*\*\/\}\s*<tr>/,
  {/* SEGUNDO GRADO */}\n              {(selectedGrado === 'Todos' || selectedGrado === '2do Grado') && (\n                <>\n                  <tr>
);
code = code.replace(
  /\{renderRow\('TOTALES 2DO GRADO', '2do Grado', true\)\}/,
  {renderRow('TOTALES 2DO GRADO', '2do Grado', true)}\n                </>\n              )}
);

code = code.replace(
  /\{\/\*\s*TERCER GRADO\s*\*\/\}\s*<tr>/,
  {/* TERCER GRADO */}\n              {(selectedGrado === 'Todos' || selectedGrado === '3er Grado') && (\n                <>\n                  <tr>
);
code = code.replace(
  /\{renderRow\('TOTALES 3ER GRADO', '3er Grado', true\)\}/,
  {renderRow('TOTALES 3ER GRADO', '3er Grado', true)}\n                </>\n              )}
);

code = code.replace(
  /\{\/\*\s*TOTAL GLOBAL\s*\*\/\}\s*<tr>/,
  {/* TOTAL GLOBAL */}\n              {selectedGrado === 'Todos' && (\n              <tr>
);
code = code.replace(
  />\{calcDesercion\(matriculaData\.global\.bajas\.t, matriculaData\.global\.inicial\.t, matriculaData\.global\.altas\.t\)\}<\/td>\s*<\/tr>\s*<\/tbody>/,
  >{calcDesercion(matriculaData.global.bajas.t, matriculaData.global.inicial.t, matriculaData.global.altas.t)}</td>\n              </tr>\n              )}\n            </tbody>
);

fs.writeFileSync('src/components/MatriculaGruposPrint.jsx', code);