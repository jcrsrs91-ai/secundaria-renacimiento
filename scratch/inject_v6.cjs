const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const p6TargetRegex = /(<p className="text-sm font-semibold mb-2">6\. Escriba la cantidad de alumnas y alumnos con discapacidades, neurodivergencia u otras condiciones, desglosándolos por grado y sexo\.<\/p>[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>\s*<\/table>)/;

const p6TableBody = `
                  {calculosV6.keys.map((cond, i) => {
                    const d = calculosV6.map[cond];
                    const rowHom = d['1'].h + d['2'].h + d['3'].h;
                    const rowMuj = d['1'].m + d['2'].m + d['3'].m;
                    const rowTotal = rowHom + rowMuj;
                    return (
                      <tr key={i}>
                        <td className="border border-slate-300 p-2 text-left">{cond}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['1'].h}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['1'].m}</td>
                        <td className="border border-slate-300 p-2 bg-slate-50 font-bold">{d['1'].h + d['1'].m}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['2'].h}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['2'].m}</td>
                        <td className="border border-slate-300 p-2 bg-slate-50 font-bold">{d['2'].h + d['2'].m}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['3'].h}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['3'].m}</td>
                        <td className="border border-slate-300 p-2 bg-slate-50 font-bold">{d['3'].h + d['3'].m}</td>
                        <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{rowHom}</td>
                        <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{rowMuj}</td>
                        <td className="border border-slate-300 p-2 bg-slate-200 font-bold">{rowTotal}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold bg-slate-50">
                    <td className="border border-slate-300 p-2 text-left">Total</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['1'].h, 0)}</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['1'].m, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['1'].h + calculosV6.map[k]['1'].m, 0)}</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['2'].h, 0)}</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['2'].m, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['2'].h + calculosV6.map[k]['2'].m, 0)}</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['3'].h, 0)}</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['3'].m, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['3'].h + calculosV6.map[k]['3'].m, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-200">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['1'].h + calculosV6.map[k]['2'].h + calculosV6.map[k]['3'].h, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-200">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['1'].m + calculosV6.map[k]['2'].m + calculosV6.map[k]['3'].m, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-300">{calculosV6.keys.reduce((s, k) => { const x=calculosV6.map[k]; return s+x['1'].h+x['1'].m+x['2'].h+x['2'].m+x['3'].h+x['3'].m; }, 0)}</td>
                  </tr>
`;
c = c.replace(p6TargetRegex, "$1\n" + p6TableBody + "$2");

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
