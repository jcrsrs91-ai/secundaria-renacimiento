const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// 1. Add State
if (!c.includes('const [searchAspirantes, setSearchAspirantes] = useState("");')) {
    c = c.replace(
        'const [tramitesPagados, setTramitesPagados] = useState([]);',
        'const [tramitesPagados, setTramitesPagados] = useState([]);\n  const [searchAspirantes, setSearchAspirantes] = useState("");'
    );
}

// 2. Fix Aceptar Aspirante logic (preserve grupo and taller)
c = c.replace(
    /grupo:\s*"Por asignar",\n\s*taller:\s*"Por asignar"/g,
    '// grupo y taller preservados'
);

// 3. Filter pendientes based on search
if (!c.includes('const filteredPendientes = pendientes.filter')) {
    c = c.replace(
        'const pendientes = students.filter(s => s.status === \'Pendiente\');',
        'const pendientes = students.filter(s => s.status === \'Pendiente\');\n  const filteredPendientes = pendientes.filter(p => `${p.nombres} ${p.apellidoPaterno} ${p.apellidoMaterno} ${p.curp}`.toLowerCase().includes(searchAspirantes.toLowerCase()));'
    );
}

// 5. Use filteredPendientes instead of pendientes in the map
c = c.replace(
    /pendientes\.map\(p =>/g,
    'filteredPendientes.map(p =>'
);

c = c.replace(
    /pendientes\.length === 0/g,
    'filteredPendientes.length === 0'
);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', c);
console.log("State and logic patched.");
