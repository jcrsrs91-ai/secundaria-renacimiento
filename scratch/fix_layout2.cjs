const fs = require('fs');

let lay = fs.readFileSync('src/layouts/DashboardLayout.jsx', 'utf8');

lay = lay.replace('import { Package, ', 'import { ');

if (!lay.includes('Package') && lay.includes('lucide-react')) {
  lay = lay.replace(/import\s*\{([\s\S]*?)\}\s*from\s*'lucide-react';/, "import { Package, $1} from 'lucide-react';");
}

fs.writeFileSync('src/layouts/DashboardLayout.jsx', lay);
console.log("Fixed Layout for real");
