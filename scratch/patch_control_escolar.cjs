const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// 1. Add Search State for Aspirantes
if (!c.includes('const [searchAspirantes, setSearchAspirantes] = useState("");')) {
    c = c.replace(
        'const [tramitesPagados, setTramitesPagados] = useState([]);',
        'const [tramitesPagados, setTramitesPagados] = useState([]);\n  const [searchAspirantes, setSearchAspirantes] = useState("");'
    );
}

// 2. Change Aceptar Aspirante to NOT overwrite grupo/taller
c = c.replace(
    /grupo:\s*"Por asignar",\s*taller:\s*"Por asignar"/g,
    '// grupo y taller se mantienen como los selecciono el aspirante'
);

// 3. Filter pendientes based on search
if (!c.includes('const filteredPendientes = pendientes.filter')) {
    c = c.replace(
        'const pendientes = students.filter(s => s.status === \'Pendiente\');',
        'const pendientes = students.filter(s => s.status === \'Pendiente\');\n  const filteredPendientes = pendientes.filter(p => `${p.nombres} ${p.apellidoPaterno} ${p.apellidoMaterno} ${p.curp}`.toLowerCase().includes(searchAspirantes.toLowerCase()));'
    );
}

// 4. Render the Search Bar and use filteredPendientes
c = c.replace(
    /<th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Trámite<\/th>/,
    `<tr><td colSpan="4" className="px-6 py-3 bg-gray-50 border-b border-gray-200"><input type="text" placeholder="Buscar alumno pendiente por nombre o CURP..." value={searchAspirantes} onChange={(e) => setSearchAspirantes(e.target.value)} className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm" /></td></tr>\n                <tr><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Trámite</th>`
);

// wait, the "Trámite" text might have special encoding, I'll use regex.
c = c.replace(
    /<th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tr.mite<\/th>/g,
    `<tr><td colSpan="4" className="px-6 py-3 bg-gray-50 border-b border-gray-200"><input type="text" placeholder="Buscar aspirante por nombre o CURP..." value={searchAspirantes} onChange={(e) => setSearchAspirantes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm" /></td></tr><tr><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Trámite</th>`
);

c = c.replace(
    /pendientes\.map\(p =>/g,
    'filteredPendientes.map(p =>'
);

c = c.replace(
    /pendientes\.length === 0/g,
    'filteredPendientes.length === 0'
);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', c);
console.log("ControlEscolar patched.");
