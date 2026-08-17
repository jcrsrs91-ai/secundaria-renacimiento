const fs = require('fs');

// Patch App.jsx
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace(
  "import Login from './pages/Login';",
  "import Login from './pages/Login';\nimport RegistroStaff from './pages/public/RegistroStaff';\nimport GestionAccesos from './pages/dashboard/GestionAccesos';"
);
app = app.replace(
  '<Route path="/admin" element={<Login />} />',
  '<Route path="/admin" element={<Login />} />\n      <Route path="/registro-staff" element={<RegistroStaff />} />'
);
app = app.replace(
  '<Route path="buzon" element={<BuzonTutores />} />',
  '<Route path="buzon" element={<BuzonTutores />} />\n          <Route path="accesos" element={<GestionAccesos />} />'
);
fs.writeFileSync('src/App.jsx', app);

// Patch AuthContext.jsx
let auth = fs.readFileSync('src/context/AuthContext.jsx', 'utf8');
auth = auth.replace(
  "import { onAuthStateChanged, signOut } from 'firebase/auth';",
  "import { onAuthStateChanged, signOut } from 'firebase/auth';\nimport { doc, getDoc } from 'firebase/firestore';\nimport { db } from '../firebase';"
);
auth = auth.replace(
  "const [currentUser, setCurrentUser] = useState(null);",
  "const [currentUser, setCurrentUser] = useState(null);\n  const [userPermissions, setUserPermissions] = useState(null);\n  const [userRole, setUserRole] = useState(null);"
);
const onAuthOld = `const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });`;
const onAuthNew = `const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserPermissions(userDoc.data().permissions || []);
            setUserRole(userDoc.data().role || 'staff');
          } else {
            // Backwards compatibility for the original admin
            setUserPermissions(['all']);
            setUserRole('superadmin');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserPermissions(null);
        setUserRole(null);
      }
      setCurrentUser(user);
      setLoading(false);
    });`;
auth = auth.replace(onAuthOld, onAuthNew);
auth = auth.replace(
    "currentUser,",
    "currentUser,\n    userPermissions,\n    userRole,"
);
fs.writeFileSync('src/context/AuthContext.jsx', auth);

// Patch DashboardLayout.jsx
let dash = fs.readFileSync('src/layouts/DashboardLayout.jsx', 'utf8');
dash = dash.replace(
  "const { currentUser, logout } = useAuth();",
  "const { currentUser, userPermissions, userRole, logout } = useAuth();"
);
dash = dash.replace(
  "import { \n  LayoutDashboard, ",
  "import { \n  LayoutDashboard, \n  Key,"
);

const menuOld = `const menu = currentUser ? [
    { name: 'Panel Principal', path: '/panel', icon: LayoutDashboard },
    { name: 'Control Escolar', path: '/panel/control-escolar', icon: Users },
    { name: 'Contraloría', path: '/panel/contraloria', icon: Calculator },
    { name: 'Trabajo Social', path: '/panel/trabajo-social', icon: HeartHandshake },
    { name: 'Coordinación Académica', path: '/panel/coordinacion', icon: GraduationCap },
    { name: 'Prefectura / Asistencia', path: '/panel/asistencia', icon: ClipboardCheck },
    { name: 'Biblioteca', path: '/panel/biblioteca', icon: Library },
    { name: 'Impresión Documentos', path: '/panel/impresion-documentos', icon: Printer },
    { name: 'Avisos Escolares', path: '/panel/avisos', icon: Megaphone },
    { name: 'Buzón de Tutores', path: '/panel/buzon', icon: MessageSquare },
  ] : [`;
const menuNew = `const menu = currentUser ? [
    { name: 'Panel Principal', path: '/panel', icon: LayoutDashboard, id: 'home' },
    { name: 'Control Escolar', path: '/panel/control-escolar', icon: Users, id: 'control-escolar' },
    { name: 'Contraloría', path: '/panel/contraloria', icon: Calculator, id: 'contraloria' },
    { name: 'Trabajo Social', path: '/panel/trabajo-social', icon: HeartHandshake, id: 'trabajo-social' },
    { name: 'Coordinación Académica', path: '/panel/coordinacion', icon: GraduationCap, id: 'coordinacion' },
    { name: 'Prefectura / Asistencia', path: '/panel/asistencia', icon: ClipboardCheck, id: 'asistencia' },
    { name: 'Biblioteca', path: '/panel/biblioteca', icon: Library, id: 'biblioteca' },
    { name: 'Impresión Documentos', path: '/panel/impresion-documentos', icon: Printer, id: 'impresion-documentos' },
    { name: 'Avisos Escolares', path: '/panel/avisos', icon: Megaphone, id: 'avisos' },
    { name: 'Buzón de Tutores', path: '/panel/buzon', icon: MessageSquare, id: 'buzon' },
    { name: 'Accesos (Admin)', path: '/panel/accesos', icon: Key, id: 'accesos' }
  ].filter(item => {
    if (item.id === 'home') return true;
    if (userPermissions?.includes('all')) return true;
    return userPermissions?.includes(item.id);
  }) : [`;
dash = dash.replace(menuOld, menuNew);
fs.writeFileSync('src/layouts/DashboardLayout.jsx', dash);
