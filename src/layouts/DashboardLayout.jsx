import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Calculator, 
  HeartHandshake, 
  GraduationCap, 
  ClipboardCheck, 
  Library,
  LogOut,
  UsersRound,
  Printer
} from 'lucide-react';

export default function DashboardLayout() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const menu = currentUser ? [
    { name: 'Panel Principal', path: '/panel', icon: LayoutDashboard },
    { name: 'Control Escolar', path: '/panel/control-escolar', icon: Users },
    { name: 'Contraloría', path: '/panel/contraloria', icon: Calculator },
    { name: 'Trabajo Social', path: '/panel/trabajo-social', icon: HeartHandshake },
    { name: 'Coordinación Académica', path: '/panel/coordinacion', icon: GraduationCap },
    { name: 'Prefectura / Asistencia', path: '/panel/asistencia', icon: ClipboardCheck },
    { name: 'Biblioteca', path: '/panel/biblioteca', icon: Library },
    { name: 'Impresión Documentos', path: '/panel/impresion-documentos', icon: Printer },
  ] : [
    { name: 'Mi Portal Familiar', path: '/panel/portal-familiar', icon: UsersRound },
  ];

  return (
    <div className="flex h-screen print:h-auto bg-slate-50 print:bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all">
        <div className="h-16 flex items-center px-6 bg-slate-950 font-bold text-white tracking-wider border-b border-slate-800">
          EST N°68
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {menu.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        <header className="h-16 bg-white shadow-sm flex items-center px-8 border-b border-slate-200 no-print">
          <h1 className="text-xl font-semibold text-slate-800">
            {menu.find(m => m.path === location.pathname)?.name || 'Panel'}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto print:overflow-visible p-8 print:p-0">
          <div className="mx-auto max-w-7xl print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
