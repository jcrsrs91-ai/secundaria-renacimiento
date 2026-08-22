const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

c = c.replace(
    /<td className="px-6 py-4 text-right space-x-2">\s*<button onClick=\{\(\) => aceptarAspirante\(p\)\}/g,
    `<td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => openModal('hoja', p)} className="text-blue-600 font-medium text-sm hover:bg-blue-50 px-3 py-1 rounded border border-blue-200 transition-colors mr-2">
                          Revisar Expediente
                        </button>
                        <button onClick={() => aceptarAspirante(p)}`
);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', c);
console.log("Added button.");
