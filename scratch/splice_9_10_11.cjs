const fs = require('fs');
let lines = fs.readFileSync('src/components/Formato911.jsx', 'utf8').split('\n');

function replaceTable(titleStr, rowsObjStr) {
  let startIdx = lines.findIndex(l => l.includes(titleStr));
  if (startIdx === -1) return false;
  let tbodyIdx = startIdx;
  while (!lines[tbodyIdx].includes('<tbody>')) tbodyIdx++;
  
  let endTbodyIdx = tbodyIdx;
  while (!lines[endTbodyIdx].includes('</tbody>')) endTbodyIdx++;

  const newJSX = `                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => {
                    const rowData = i < 3 ? ${rowsObjStr}[i] : ${rowsObjStr}.reduce((acc, row) => acc.map((v, j) => v + row[j]), Array(9).fill(0));
                    return (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-emerald-50 text-emerald-900' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
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

  lines.splice(tbodyIdx + 1, endTbodyIdx - tbodyIdx - 1, newJSX);
  return true;
}

replaceTable('9. Escriba el', 'calculosReprobados.rows9');
replaceTable('10. De las alumnas', 'calculosReprobados.rows10');
replaceTable('11. De las alumnas', 'calculosReprobados.rows11');

fs.writeFileSync('src/components/Formato911.jsx', lines.join('\n'), 'utf8');
console.log('Tables 9,10,11 replaced!');
