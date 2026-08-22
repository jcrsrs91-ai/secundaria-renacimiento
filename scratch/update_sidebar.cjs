const fs = require('fs');
let c = fs.readFileSync('src/layouts/DashboardLayout.jsx', 'utf8');

// Add Package icon import if not present
if (!c.includes('Package') && c.includes('lucide-react')) {
  c = c.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { Package, $1} from 'lucide-react';");
}

// Add the Sidebar link
if (!c.includes('href: "/panel/inventario"')) {
  c = c.replace(/\{\s*name: 'Contraloría',\s*href: '\/panel\/contraloria',\s*icon: Wallet\s*\}/, "{ name: 'Contraloría', href: '/panel/contraloria', icon: Wallet },\n  { name: 'Inventario y Resguardos', href: '/panel/inventario', icon: Package }");
}

fs.writeFileSync('src/layouts/DashboardLayout.jsx', c);
console.log("DashboardLayout.jsx updated");
