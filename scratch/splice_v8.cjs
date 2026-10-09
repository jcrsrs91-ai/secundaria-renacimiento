const fs = require('fs');
const path = 'src/components/Formato911.jsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const newJSX = `{['13 años o menos', '14 años', '15 años', '16 años', '17 años', '18 años y más', 'Total'].map((edad, i) => {
                    const rowData = i < 6 ? calculosV8[i] : calculosV8.reduce((acc, row) => acc.map((v, j) => v + row[j]), Array(9).fill(0));
                    return (
                    <tr key={i} className={edad === 'Total' ? 'font-bold bg-emerald-50 text-emerald-900' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{edad}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[0]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[1]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-200 font-bold">{rowData[2]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[3]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[4]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[5]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[6]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[7]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[8]}</td>
                    </tr>
                  )
                  })}`;

lines.splice(941, 14, newJSX);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Replaced JSX by splice!');
