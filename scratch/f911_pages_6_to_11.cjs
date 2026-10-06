const fs = require('fs');

const p6_to_p11 = `
          {/* CONTINUACIÓN SECCIÓN V (Páginas 6 a 11) */}
          <div className="mt-8 space-y-12">
            {/* Pregunta 2 */}
            <div>
              <p className="text-sm font-semibold mb-2">2. Escriba por sexo, la cantidad de alumnas y alumnos indígenas o hablantes de lengua indígena.</p>
              <table className="text-xs text-center border-collapse border border-slate-300 w-full max-w-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pregunta 3 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">3. Escriba el número de alumnas y alumnos que proceden de escuela primaria general, indígena y/o comunitaria desglosándolo por grado y sexo.</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[600px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2" rowSpan="2"></th>
                    <th className="border border-slate-300 p-2" rowSpan="2">Sexo</th>
                    <th className="border border-slate-300 p-2" colSpan="2">Primero</th>
                    <th className="border border-slate-300 p-2" rowSpan="2">Segundo</th>
                    <th className="border border-slate-300 p-2" rowSpan="2">Tercero</th>
                    <th className="border border-slate-300 p-2 bg-slate-100" rowSpan="2">Total</th>
                  </tr>
                  <tr>
                    <th className="border border-slate-300 p-2">Nvo. Ingreso</th>
                    <th className="border border-slate-300 p-2">Repetidor</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {tipo: 'Primaria General'},
                    {tipo: 'Primaria Indígena'},
                    {tipo: 'Primaria Comunitaria'}
                  ].map((row, i) => (
                    <React.Fragment key={i}>
                      <tr>
                        <td className="border border-slate-300 p-2 text-left font-semibold" rowSpan="2">{row.tipo}</td>
                        <td className="border border-slate-300 p-2">Hombres</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2">Mujeres</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pregunta 4 y 5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold mb-2">4. Escriba el nombre de la lengua materna que hablan las alumnas y alumnos procedentes de escuela primaria indígena.</p>
                <div className="flex gap-2 items-center">
                  <span className="text-sm">Clave</span>
                  <input type="text" className="w-16 border border-slate-300 rounded px-2 py-1" />
                  <span className="text-sm ml-4">Lengua materna</span>
                  <input type="text" className="flex-1 border border-slate-300 rounded px-2 py-1 border-b-2" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">5. Escriba la cantidad de alumnas y alumnos que son atendidos por la Unidad de Servicios de Apoyo a la Educación Regular (USAER), desglosándola por sexo.</p>
                <table className="text-xs text-center border-collapse border border-slate-300 w-full max-w-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                      <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pregunta 6 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">6. Escriba la cantidad de alumnas y alumnos con discapacidades, neurodivergencia u otras condiciones, desglosándolos por grado y sexo.</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2" rowSpan="2">Condición del alumnado</th>
                    <th className="border border-slate-300 p-2" colSpan="3">Primero</th>
                    <th className="border border-slate-300 p-2" colSpan="3">Segundo</th>
                    <th className="border border-slate-300 p-2" colSpan="3">Tercero</th>
                    <th className="border border-slate-300 p-2 bg-slate-100" colSpan="3">Total</th>
                  </tr>
                  <tr>
                    <th className="border border-slate-300 p-1">Hom</th>
                    <th className="border border-slate-300 p-1">Muj</th>
                    <th className="border border-slate-300 p-1">Total</th>
                    <th className="border border-slate-300 p-1">Hom</th>
                    <th className="border border-slate-300 p-1">Muj</th>
                    <th className="border border-slate-300 p-1">Total</th>
                    <th className="border border-slate-300 p-1">Hom</th>
                    <th className="border border-slate-300 p-1">Muj</th>
                    <th className="border border-slate-300 p-1">Total</th>
                    <th className="border border-slate-300 p-1 bg-slate-100">Hom</th>
                    <th className="border border-slate-300 p-1 bg-slate-100">Muj</th>
                    <th className="border border-slate-300 p-1 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Ceguera', 'Baja visión', 'Sordera', 'Hipoacusia', 'Sordoceguera',
                    'Discapacidad motriz', 'Discapacidad intelectual', 'Discapacidad psicosocial',
                    'Trastorno del espectro autista', 'Discapacidad múltiple', 'TDAH*',
                    'Aptitudes sobresalientes', 'Otras condiciones', 'Total'
                  ].map((cond, i) => (
                    <tr key={i} className={cond === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{cond}</td>
                      <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td><td className="border border-slate-300 p-2 bg-slate-100">0</td><td className="border border-slate-300 p-2 bg-slate-100">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pregunta 7 */}
            <div>
              <p className="text-sm font-semibold mb-2">7. Escriba el número de alumnas y alumnos nacidos fuera de México, desglosándolos por sexo.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-lg">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2 text-left">País o lugar</th>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                      <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Estados Unidos', 'Canadá', 'Centroamérica y el Caribe', 'Sudamérica', 'África', 'Asia', 'Europa', 'Oceanía', 'Total'].map((lugar, i) => (
                      <tr key={i} className={lugar === 'Total' ? 'font-bold bg-slate-50' : ''}>
                        <td className="border border-slate-300 p-2 text-left">{lugar}</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pregunta 8 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">8. Escriba el número de alumnas y alumnos egresados de 3er. grado durante el ciclo escolar, desglosándolos por edad, sexo...</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Edad</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Con trastorno</th>
                    <th className="border border-slate-300 p-2">Apt. Sobresalientes</th>
                    <th className="border border-slate-300 p-2">Otras condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {['13 años o menos', '14 años', '15 años', '16 años', '17 años', '18 años y más', 'Total'].map((edad, i) => (
                    <tr key={i} className={edad === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{edad}</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pregunta 9 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">9. Escriba el número de alumnas y alumnos que reprobaron una o más asignaturas durante el ciclo escolar...</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Grado</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Con trastorno</th>
                    <th className="border border-slate-300 p-2">Apt. Sobresalientes</th>
                    <th className="border border-slate-300 p-2">Otras condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pregunta 10 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">10. De las alumnas y alumnos reportados en la pregunta anterior, escriba cuántos se regularizaron (aprobaron todas las asignaturas) al 30 de septiembre...</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Grado</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Con trastorno</th>
                    <th className="border border-slate-300 p-2">Apt. Sobresalientes</th>
                    <th className="border border-slate-300 p-2">Otras condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pregunta 11 y 12 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold mb-2">11. De las alumnas y alumnos reportados en la pregunta 9, escriba la cantidad de ellos que están inscritos en el presente ciclo escolar y continúan como irregulares (adeudan asignaturas)...</p>
                <table className="w-full text-xs text-center border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2" colSpan="2">SEGUNDO</th>
                      <th className="border border-slate-300 p-2" colSpan="2">TERCERO</th>
                      <th className="border border-slate-300 p-2 bg-slate-100" rowSpan="2">TOTAL</th>
                    </tr>
                    <tr>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <p className="text-sm font-semibold mb-2">12. Escriba, por grado, el número de directivos con grupo y docentes.</p>
                <table className="w-full text-xs text-center border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2">Primero</th>
                      <th className="border border-slate-300 p-2">Segundo</th>
                      <th className="border border-slate-300 p-2">Tercero</th>
                      <th className="border border-slate-300 p-2">Más de un grado</th>
                      <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-slate-500 mt-2 italic">*Únicamente para Telesecundarias.</p>
              </div>
            </div>

            {/* Pregunta 13 */}
            <div>
              <p className="text-sm font-semibold mb-2">13. Escriba el número de alumnas y alumnos afromexicanos o afrodescendientes por autoadscripción de los padres...</p>
              <table className="w-full max-w-xs text-xs text-center border-collapse border border-slate-300">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pregunta 14 */}
            <div>
              <p className="text-sm font-semibold mb-2">14. Escriba el número de alumnas y alumnos, según su lugar de residencia y desglóselos por sexo.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
                <table className="w-full text-xs text-center border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2 text-left">Estado</th>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Coahuila', 'Colima', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán'].map((estado, i) => (
                      <tr key={i}>
                        <td className="border border-slate-300 p-2 text-left">{estado}</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2">0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="w-full text-xs text-center border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2 text-left">Estado</th>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas', 'Fuera de México'].map((estado, i) => (
                      <tr key={i}>
                        <td className="border border-slate-300 p-2 text-left">{estado}</td>
                        <td className="border border-slate-300 p-2">0</td>
                        <td className="border border-slate-300 p-2">0</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-slate-50">
                      <td className="border border-slate-300 p-2 text-left">Total</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
`;

let content = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

// The end of Section V is marked by `</table>\n          </div>\n        </section>\n\n      </div>`
const insertTarget = /<\/table>\s*<\/div>\s*<\/section>\s*<\/div>\s*<\/div>\s*\);\s*\}/;

if (content.match(insertTarget)) {
  content = content.replace(
    /<\/table>\s*<\/div>\s*<\/section>\s*<\/div>/,
    `</table>\n          </div>\n${p6_to_p11}\n        </section>\n\n      </div>`
  );
  fs.writeFileSync('src/components/Formato911.jsx', content, 'utf8');
  console.log('Appended pages 6 to 11 to Section V');
} else {
  console.log('Target not found!');
}
