const fs = require('fs');

let content = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const table3_2Block = `          <div className="mt-8 mb-6">
            <p className="text-sm font-semibold mb-2">2. Del total de alumnas y alumnos con beca reportados en la pregunta anterior, escriba por sexo, la cantidad según la principal institución, el programa o el tipo que la otorga:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-4xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">Institución, programa o tipo</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    '1. Acércate a tu Escuela (CONAFE)',
                    '2. Beca de Apoyo a la Educación Básica de Madres Jóvenes...',
                    '3. Beca para el Bienestar Benito Juárez de Educación Básica',
                    '4. Beca Universal para estudiantes de Educación Media Sup.',
                    '5. DIF (Desarrollo Integral de la Familia)',
                    '6. Gobierno del Estado',
                    '7. Instituto Nacional de los Pueblos Indígenas (INPI)',
                    '8. Otra institución federal',
                    '9. Particular',
                    '10. Presidencia municipal',
                    '11. Oportunidades / PROSPERA',
                    'Total'
                  ].map((beca, i) => (
                    <tr key={i} className={beca === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{beca}</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>`;

// Insert right before `{/* V. ALUMNADO Y GRUPOS (Edades) */}`
content = content.replace(
  /\s*\{\/\* V\. ALUMNADO Y GRUPOS/,
  `\n\n${table3_2Block}\n\n        {/* V. ALUMNADO Y GRUPOS`
);

// Wait, the previous block didn't remove the `</section>` of III. Let's fix that.
// I will just replace the end of Section III.
const section3Regex = /\s*\{\/\* III\. BECAS \*\/\}[\s\S]*?<\/section>/;

let match = content.match(section3Regex);
if (match) {
  let section3 = match[0];
  section3 = section3.replace(/<\/section>/, `\n${table3_2Block}`);
  content = content.replace(section3Regex, section3);
}

fs.writeFileSync('src/components/Formato911.jsx', content, 'utf8');
console.log('Added Table III.2');
