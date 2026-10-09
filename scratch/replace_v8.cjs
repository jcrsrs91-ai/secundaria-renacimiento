const fs = require('fs');
const path = 'src/components/Formato911.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  /{key: '9.2', type: '9.2', label: 'Egresados', tableIndex: 8},/g,
  ''
);

const oldJSX = `{['13 años o menos', '14 años', '15 años', '16 años', '17 años', '18 años y más', 'Total'].map((edad, i) => (
                    <tr key={i} className={edad === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{edad}</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  ))}`;

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

if (c.includes(oldJSX)) {
  c = c.replace(oldJSX, newJSX);
  fs.writeFileSync(path, c, 'utf8');
  console.log('Replaced JSX');
} else {
  console.log('Could not find old JSX');
}
