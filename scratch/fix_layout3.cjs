const fs = require('fs');

let lay = fs.readFileSync('src/layouts/DashboardLayout.jsx', 'utf8');

// Fix the bad regex replacement
lay = lay.replace(/import\s*\{\s*Package\s*,\s*/, 'import { ');
if (lay.includes("import { Package,  Outlet")) {
    lay = lay.replace("import { Package,  Outlet", "import { Outlet");
}

if (!lay.includes('Package,') && lay.includes('lucide-react')) {
  lay = lay.replace(/import \{([^}]*)\} from 'lucide-react';/, "import { Package, $1} from 'lucide-react';");
}

fs.writeFileSync('src/layouts/DashboardLayout.jsx', lay);
console.log("Fixed Layout again");
