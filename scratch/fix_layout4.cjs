const fs = require('fs');

let lay = fs.readFileSync('src/layouts/DashboardLayout.jsx', 'utf8');

if (!lay.includes("path: '/panel/inventario'")) {
    lay = lay.replace(
        /\{\s*name:\s*'Contralor[^']+',\s*path:\s*'\/panel\/contraloria',\s*icon:\s*Calculator,\s*id:\s*'contraloria'\s*\}/,
        "{ name: 'Contraloría', path: '/panel/contraloria', icon: Calculator, id: 'contraloria' },\n    { name: 'Inventario y Resguardos', path: '/panel/inventario', icon: Package, id: 'inventario' }"
    );
    
    // Also modify the filter to show inventario if they had contraloria access
    lay = lay.replace(
        /return userPermissions\?\.includes\(item\.id\);/,
        "if (item.id === 'inventario' && userPermissions?.includes('contraloria')) return true;\n    return userPermissions?.includes(item.id);"
    );
}

fs.writeFileSync('src/layouts/DashboardLayout.jsx', lay);
console.log("Fixed Layout completely");
