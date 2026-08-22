const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

c = c.replace(
    '<th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Grado / Escuela Anterior</th>\n                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>',
    '<th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Grado / Escuela Anterior</th>\n                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha Solicitud</th>\n                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>'
);

c = c.replace(
    '<td colSpan="4" className="px-6 py-8 text-center text-slate-500">No hay solicitudes pendientes.</td>',
    '<td colSpan="5" className="px-6 py-8 text-center text-slate-500">No hay solicitudes pendientes.</td>'
);

c = c.replace(
    /\{\s*p\.grado\s*\}\s*<br\/>\s*<span className="text-xs text-slate-400">\{\s*p\.escuelaProcedencia\s*\}<\/span>\s*<\/td>/,
    `{p.grado} <br/> <span className="text-xs text-slate-400">{p.escuelaProcedencia}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {p.fechaRegistro ? (p.fechaRegistro?.toDate ? p.fechaRegistro.toDate().toLocaleDateString('es-MX') : new Date(p.fechaRegistro).toLocaleDateString('es-MX')) : 'N/A'}
                      </td>`
);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', c);
console.log("Added date column.");
