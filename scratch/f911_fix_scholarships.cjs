const fs = require('fs');
let content = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const correctOptions = `
                  {[
                    { label: 'Becas federales', isHeader: true },
                    { label: 'Beca Rita Cetina' },
                    { label: 'Otra* (*Especifique: _________)' },
                    { label: 'Total becas federales', isSubtotal: true },
                    { label: 'Otras becas', isHeader: true },
                    { label: 'Beca estatal' },
                    { label: 'Beca de fundaciones y asociaciones civiles' },
                    { label: 'Beca de la propia escuela' },
                    { label: 'Beca particular' },
                    { label: 'Beca municipal' },
                    { label: 'Otras* (*Especifique: _________)' },
                    { label: 'Total de becas', isSubtotal: true }
                  ].map((beca, i) => (
                    <tr key={i} className={beca.isSubtotal ? 'font-bold bg-slate-50' : beca.isHeader ? 'font-bold bg-slate-100' : ''}>
                      <td className={\`border border-slate-300 p-2 text-left \${beca.isHeader ? 'uppercase text-slate-700' : beca.isSubtotal ? '' : 'pl-6'}\`}>{beca.label}</td>
                      <td className="border border-slate-300 p-2">{beca.isHeader ? '' : '0'}</td>
                      <td className="border border-slate-300 p-2">{beca.isHeader ? '' : '0'}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">{beca.isHeader ? '' : '0'}</td>
                    </tr>
                  ))}
`;

const regexToReplace = /\{\[\s*'1\. Acércate a tu Escuela \(CONAFE\)'[\s\S]*?\]\.map\(\(beca, i\) => \([\s\S]*?<\/tr>\s*\)\)\}/;

if (content.match(regexToReplace)) {
  content = content.replace(regexToReplace, correctOptions.trim());
  
  // also fix the question text to match the PDF exactly
  content = content.replace(
    '2. Del total de alumnas y alumnos con beca reportados en la pregunta anterior, escriba por sexo, la cantidad según la principal institución, el programa o el tipo que la otorga:',
    '2. Escriba por sexo, el número de alumnas y alumnos con beca reportados en la pregunta anterior, y desglóselos según el origen de la beca.'
  );
  content = content.replace(
    '<th className="border border-slate-300 p-2 text-left">Institución, programa o tipo</th>',
    '<th className="border border-slate-300 p-2 text-left">Origen de la beca</th>'
  );

  fs.writeFileSync('src/components/Formato911.jsx', content, 'utf8');
  console.log('Fixed scholarship options.');
} else {
  console.log('Could not find scholarship array.');
}
