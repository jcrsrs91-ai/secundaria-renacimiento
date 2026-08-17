const fs = require('fs');

const path = 'src/layouts/DashboardLayout.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "import { \n  LayoutDashboard, ",
  "import { \n  LayoutDashboard, \n  Key,"
);

c = c.replace(
  "const { currentUser, logout } = useAuth();",
  "const { currentUser, userPermissions, userRole, logout } = useAuth();"
);

// We find the exact string "  ] : [" to replace
c = c.replace(
  "  ] : [",
  `    { name: 'Accesos (Admin)', path: '/panel/accesos', icon: Key, id: 'accesos' }
  ].map(item => ({...item, id: item.id || item.path.split('/').pop()})).filter(item => {
    if (item.path === '/panel') return true;
    if (userPermissions?.includes('all')) return true;
    return userPermissions?.includes(item.id);
  }) : [`
);

fs.writeFileSync(path, c);
