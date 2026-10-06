const fs = require('fs');
let f911 = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const table2Block = `          <div className="mt-8 mb-6">
            <p className="text-sm font-semibold mb-2">2. De las alumnas y alumnos provenientes de escuelas de otro país reportados en la pregunta anterior, desglóselos según el país o lugar y sexo.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-2xl">
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
        </section>`;

// Replace the end of Section II
f911 = f911.replace(
  /<\/table>\s*<\/div>\s*<\/div>\s*<\/section>/,
  `</table>\n            </div>\n          </div>\n\n${table2Block}`
);

fs.writeFileSync('src/components/Formato911.jsx', f911, 'utf8');
console.log('Table II.2 added successfully.');
