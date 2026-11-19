import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingBuzonWidget from '../components/FloatingBuzonWidget';
import {
  Package,  
  LayoutDashboard, 
  Users, 
  Calculator, 
  HeartHandshake, 
  GraduationCap, 
  ClipboardCheck, 
  Library,
  LogOut,
  UsersRound,
  Printer,
  Megaphone,
  MessageSquare,
  Key,
  FileSpreadsheet,
  BellRing,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

const SHORT_LABELS = {
  home: 'Inicio',
  'portal-docente': 'Docente',
  'control-escolar': 'Control',
  asistencia: 'Asistencia',
  contraloria: 'Caja',
  inventario: 'Inventario',
  'trabajo-social': 'T. Social',
  coordinacion: 'Coord.',
  biblioteca: 'Biblioteca',
  'impresion-documentos': 'Imprimir',
  avisos: 'Avisos',
  buzon: 'Buzón',
  accesos: 'Accesos',
  familiar: 'Mi Portal'
};

export default function DashboardLayout() {
  const { currentUser, userPermissions, userRole, userName, logout } = useAuth();
  const location = useLocation();
  const [unreadBuzonCount, setUnreadBuzonCount] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('est68_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('est68_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isOnlyDocente =
    userRole === 'docente' ||
    (Array.isArray(userPermissions) &&
      userPermissions.includes('portal-docente') &&
      !userPermissions.includes('all') &&
      !userPermissions.includes('control-escolar'));

  const canSeeBuzon = Boolean(
    currentUser &&
    (userRole === 'superadmin' ||
      userPermissions?.includes('all') ||
      userPermissions?.includes('buzon') ||
      userPermissions?.includes('control-escolar'))
  );

  const menu = currentUser ? [
    { name: 'Panel Principal', path: '/panel', icon: LayoutDashboard, id: 'home' },
    { name: 'Portal Docente (Calificaciones)', path: '/panel/portal-docente', icon: FileSpreadsheet, id: 'portal-docente' },
    { name: 'Control Escolar', path: '/panel/control-escolar', icon: Users, id: 'control-escolar' },
    { name: 'Contraloría', path: '/panel/contraloria', icon: Calculator, id: 'contraloria' },
    { name: 'Inventario y Resguardos', path: '/panel/inventario', icon: Package, id: 'inventario' },
    { name: 'Trabajo Social', path: '/panel/trabajo-social', icon: HeartHandshake, id: 'trabajo-social' },
    { name: 'Coordinación Académica', path: '/panel/coordinacion', icon: GraduationCap, id: 'coordinacion' },
    { name: 'Prefectura / Asistencia', path: '/panel/asistencia', icon: ClipboardCheck, id: 'asistencia' },
    { name: 'Biblioteca', path: '/panel/biblioteca', icon: Library, id: 'biblioteca' },
    { name: 'Impresión Documentos', path: '/panel/impresion-documentos', icon: Printer, id: 'impresion-documentos' },
    { name: 'Avisos Escolares', path: '/panel/avisos', icon: Megaphone, id: 'avisos' },
    { name: 'Buzón de Tutores', path: '/panel/buzon', icon: MessageSquare, id: 'buzon' },
    { name: 'Accesos (Admin)', path: '/panel/accesos', icon: Key, id: 'accesos' }
  ].filter(item => {
    if (item.id === 'home') return !isOnlyDocente;
    if (userPermissions?.includes('all')) return true;
    if (item.id === 'inventario' && userPermissions?.includes('contraloria')) return true;
    if (item.id === 'buzon' && userPermissions?.includes('control-escolar')) return true;
    return userPermissions?.includes(item.id);
  }) : [
    { name: 'Mi Portal Familiar', path: '/panel/portal-familiar', icon: UsersRound, id: 'familiar' },
  ];

  // Destinos prioritarios para barra de navegación inferior móvil (máximo 4 + botón Menú)
  const priorityOrder = ['home', 'control-escolar', 'portal-docente', 'inventario', 'asistencia', 'buzon', 'contraloria'];
  const prioritized = priorityOrder
    .map(pid => menu.find(m => m.id === pid))
    .filter(Boolean);
  const bottomNavItems = [...prioritized];
  for (const m of menu) {
    if (bottomNavItems.length >= 4) break;
    if (!bottomNavItems.some(b => b.path === m.path)) {
      bottomNavItems.push(m);
    }
  }
  const bottomBarFinal = bottomNavItems.slice(0, 4);
  const currentTitle = menu.find(m => m.path === location.pathname)?.name || 'Panel';
  const userInitial = (userName || currentUser?.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="flex h-[100dvh] print:h-auto bg-slate-50 print:bg-white overflow-hidden print:overflow-visible">
      {/* Sidebar Adaptativo para Tableta (Navigation Rail colapsable) y Escritorio */}
      <aside
        className={`hidden md:flex ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        } shrink-0 bg-slate-900 text-slate-300 flex-col transition-all duration-200 ease-in-out print:hidden`}
      >
        <div className={`h-16 flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'} bg-slate-950 border-b border-slate-800`}>
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              title="Expandir barra lateral"
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black tracking-tight flex items-center justify-center transition-colors"
            >
              68
            </button>
          ) : (
            <>
              <div className="min-w-0 pr-2">
                <span className="font-bold text-white tracking-wider block leading-tight">EST N°68</span>
                {userName && (
                  <span className="text-[11px] text-slate-400 truncate block font-medium">{userName}</span>
                )}
              </div>
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                title="Colapsar barra lateral"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <nav className={`space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {menu.map((item) => {
              const isActive = location.pathname === item.path;
              const isBuzon = item.id === 'buzon';
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`relative flex items-center ${
                    sidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                  } rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm'
                      : isBuzon && unreadBuzonCount > 0
                        ? 'bg-red-950/70 text-red-200 border border-red-500/40 hover:bg-red-900/70'
                        : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? '' : 'truncate'}`}>
                    <div className={`relative flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`}>
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : isBuzon && unreadBuzonCount > 0 ? 'text-red-400 animate-bounce' : 'text-slate-400'}`} />
                      {sidebarCollapsed && isBuzon && unreadBuzonCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 text-[9px] font-black bg-red-600 text-white rounded-full flex items-center justify-center ring-2 ring-slate-900">
                          {unreadBuzonCount}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                  </div>
                  {!sidebarCollapsed && isBuzon && unreadBuzonCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-[11px] font-black bg-red-600 text-white rounded-full shadow animate-pulse">
                      {unreadBuzonCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-t border-slate-800`}>
          <button
            onClick={logout}
            title={sidebarCollapsed ? 'Cerrar Sesión' : undefined}
            className={`w-full flex items-center ${
              sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
            } text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors`}
          >
            <LogOut className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
            {!sidebarCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Cajón Lateral Deslizable para Celular (Modal Drawer) */}
      {mobileDrawerOpen && (
        <div className="md:hidden print:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative w-[82vw] max-w-[300px] h-full bg-slate-900 text-slate-200 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-4 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="min-w-0 pr-2">
                <span className="font-black text-white tracking-wider block leading-tight">EST N°68 "RENACIMIENTO"</span>
                {(userName || currentUser?.email) && (
                  <span className="text-[11px] text-sky-400 truncate block font-medium">
                    {userName || currentUser?.email}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white shrink-0"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {menu.map((item) => {
                const isActive = location.pathname === item.path;
                const isBuzon = item.id === 'buzon';
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-sm'
                        : isBuzon && unreadBuzonCount > 0
                          ? 'bg-red-950/70 text-red-200 border border-red-500/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center min-w-0">
                      <item.icon className={`mr-3 h-5 w-5 shrink-0 ${isActive ? 'text-white' : isBuzon && unreadBuzonCount > 0 ? 'text-red-400' : 'text-slate-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isBuzon && unreadBuzonCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-[11px] font-black bg-red-600 text-white rounded-full">
                        {unreadBuzonCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-800 shrink-0 pb-safe">
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-xl transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        <header className="h-14 md:h-16 bg-white shadow-sm flex items-center justify-between px-3 sm:px-5 lg:px-8 border-b border-slate-200 no-print shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="hidden md:inline-flex p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0"
              title={sidebarCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 truncate">
              {currentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {canSeeBuzon && unreadBuzonCount > 0 && (
              <Link
                to="/panel/buzon"
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-extrabold hover:bg-red-100 transition animate-pulse"
              >
                <BellRing className="w-4 h-4 text-red-600 shrink-0" />
                <span className="sm:hidden font-black">{unreadBuzonCount}</span>
                <span className="hidden sm:inline">
                  {unreadBuzonCount === 1
                    ? '1 Mensaje nuevo de Tutor'
                    : `${unreadBuzonCount} Mensajes nuevos de Tutores`}
                </span>
              </Link>
            )}
            {currentUser && (
              <>
                <div className="hidden sm:block text-xs font-medium text-slate-500 max-w-[180px] truncate">
                  {userName ? <span className="font-bold text-slate-700">{userName}</span> : currentUser.email}
                </div>
                <div
                  className="sm:hidden w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0"
                  title={userName || currentUser.email}
                >
                  {userInitial}
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto print:overflow-visible p-3 sm:p-5 lg:p-8 pb-24 md:pb-8 print:p-0">
          <div className="mx-auto max-w-7xl print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Barra de Navegación Inferior Fija para Celular (Thumb Zone) */}
      <nav
        aria-label="Navegación rápida móvil"
        className="md:hidden print:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] pb-safe"
      >
        <div
          className="grid items-stretch h-16"
          style={{
            gridTemplateColumns: `repeat(${bottomBarFinal.length + (menu.length > 1 ? 1 : 0)}, minmax(0, 1fr))`
          }}
        >
          {bottomBarFinal.map((item) => {
            const isActive = location.pathname === item.path;
            const isBuzon = item.id === 'buzon';
            const shortText = SHORT_LABELS[item.id] || item.name.split(' ')[0];
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-bold transition-colors ${
                  isActive ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 inset-x-3 h-0.5 bg-primary-600 rounded-b-full" />
                )}
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-500'}`} />
                  {isBuzon && unreadBuzonCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 text-[9px] font-black bg-red-600 text-white rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadBuzonCount}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-full leading-tight">{shortText}</span>
              </Link>
            );
          })}

          {menu.length > 1 && (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-bold transition-colors ${
                mobileDrawerOpen ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Menu className="w-5 h-5" />
              <span className="leading-tight">Menú</span>
            </button>
          )}
        </div>
      </nav>

      {/* Burbuja Flotante Interactiva en Todas las Pantallas */}
      {canSeeBuzon && (
        <FloatingBuzonWidget onUnreadCountChange={setUnreadBuzonCount} />
      )}
    </div>
  );
}
