import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  Users,
  Clock,
  GraduationCap,
  Megaphone,
  Activity,
  FileSpreadsheet,
  Calculator,
  Package,
  HeartHandshake,
  ClipboardCheck,
  Library,
  Printer,
  MessageSquare,
  Key,
  ChevronRight
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const QUICK_ACCESS_CARDS = [
  { id: 'control-escolar', name: 'Control Escolar', desc: 'Expedientes y calificaciones', path: '/panel/control-escolar', icon: Users, color: 'bg-sky-100 text-sky-700' },
  { id: 'portal-docente', name: 'Portal Docente', desc: 'Captura por asignatura', path: '/panel/portal-docente', icon: FileSpreadsheet, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'asistencia', name: 'Prefectura / Asistencia', desc: 'Escáner QR y reportes', path: '/panel/asistencia', icon: ClipboardCheck, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'inventario', name: 'Inventario y Resguardos', desc: 'Bienes y cartas de resguardo', path: '/panel/inventario', icon: Package, color: 'bg-amber-100 text-amber-700' },
  { id: 'contraloria', name: 'Contraloría', desc: 'Pagos y corte de caja', path: '/panel/contraloria', icon: Calculator, color: 'bg-teal-100 text-teal-700' },
  { id: 'buzon', name: 'Buzón de Tutores', desc: 'Mensajes en tiempo real', path: '/panel/buzon', icon: MessageSquare, color: 'bg-rose-100 text-rose-700' },
  { id: 'trabajo-social', name: 'Trabajo Social', desc: 'Justificantes y seguimiento', path: '/panel/trabajo-social', icon: HeartHandshake, color: 'bg-pink-100 text-pink-700' },
  { id: 'coordinacion', name: 'Coordinación', desc: 'Supervisión académica', path: '/panel/coordinacion', icon: GraduationCap, color: 'bg-violet-100 text-violet-700' },
  { id: 'biblioteca', name: 'Biblioteca', desc: 'Acervo y préstamos', path: '/panel/biblioteca', icon: Library, color: 'bg-orange-100 text-orange-700' },
  { id: 'impresion-documentos', name: 'Impresión Documentos', desc: 'Boletas y constancias', path: '/panel/impresion-documentos', icon: Printer, color: 'bg-slate-100 text-slate-700' },
  { id: 'avisos', name: 'Avisos Escolares', desc: 'Muro informativo', path: '/panel/avisos', icon: Megaphone, color: 'bg-cyan-100 text-cyan-700' },
  { id: 'accesos', name: 'Accesos (Admin)', desc: 'Usuarios y permisos', path: '/panel/accesos', icon: Key, color: 'bg-purple-100 text-purple-700' }
];

export default function Dashboard() {
  const { userRole, userPermissions } = useAuth();
  const isOnlyDocente =
    userRole === 'docente' ||
    (Array.isArray(userPermissions) &&
      userPermissions.includes('portal-docente') &&
      !userPermissions.includes('all') &&
      !userPermissions.includes('control-escolar'));

  const [stats, setStats] = useState([
    { name: 'Alumnos Activos', value: '...', icon: Users, color: 'bg-sky-500' },
    { name: 'Trámites Pendientes', value: '...', icon: Clock, color: 'bg-indigo-500' },
    { name: 'Alumnos Egresados', value: '...', icon: GraduationCap, color: 'bg-emerald-500' },
    { name: 'Avisos Publicados', value: '...', icon: Megaphone, color: 'bg-slate-700' },
  ]);

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (isOnlyDocente) return;

    // Escuchar estudiantes
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      let activos = 0;
      let pendientes = 0;
      let egresados = 0;

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'Activo') activos++;
        else if (data.status === 'Pendiente') pendientes++;
        else if (data.status === 'Egresado') egresados++;
      });

      setStats(prev => {
        const newStats = [...prev];
        newStats[0].value = activos.toString();
        newStats[1].value = pendientes.toString();
        newStats[2].value = egresados.toString();
        return newStats;
      });
    });

    // Escuchar avisos
    const unsubAvisos = onSnapshot(collection(db, 'avisos'), (snapshot) => {
      let totalAvisos = snapshot.size;
      setStats(prev => {
        const newStats = [...prev];
        newStats[3].value = totalAvisos.toString();
        return newStats;
      });
    });

    // Escuchar actividad reciente (últimos avisos como "actividad")
    const qAvisos = query(collection(db, 'avisos'), orderBy('createdAt', 'desc'), limit(5));
    const unsubRecent = onSnapshot(qAvisos, (snapshot) => {
      const activities = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        title: docSnap.data().title,
        date: docSnap.data().createdAt?.toDate() || new Date(),
        type: docSnap.data().type
      }));
      setRecentActivity(activities);
    });

    return () => {
      unsubStudents();
      unsubAvisos();
      unsubRecent();
    };
  }, [isOnlyDocente]);

  if (isOnlyDocente) {
    return <Navigate to="/panel/portal-docente" replace />;
  }

  const quickLinks = QUICK_ACCESS_CARDS.filter((card) => {
    if (userPermissions?.includes('all')) return true;
    if (card.id === 'inventario' && userPermissions?.includes('contraloria')) return true;
    if (card.id === 'buzon' && userPermissions?.includes('control-escolar')) return true;
    return userPermissions?.includes(card.id);
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
            <div className="p-3.5 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className={`p-2.5 sm:p-3 rounded-xl ${item.color}`}>
                    <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-slate-500 truncate">{item.name}</dt>
                    <dd>
                      <div className="text-xl sm:text-2xl font-black text-slate-900">{item.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Accesos Rápidos Táctiles */}
      {quickLinks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 px-0.5">
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {quickLinks.map((card) => (
              <Link
                key={card.id}
                to={card.path}
                className="group bg-white border border-slate-200 hover:border-primary-400 rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-2.5 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-primary-700 truncate">
                      {card.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                      {card.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 shrink-0 hidden sm:block" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            Actividad Reciente en el Muro
          </h2>
        </div>
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <div className="text-slate-500 text-sm">
              Aún no hay actividad reciente registrada en el sistema.
            </div>
          ) : (
            <ul className="space-y-4">
              {recentActivity.map(act => (
                <li key={act.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${act.type === 'warning' ? 'bg-indigo-500' : 'bg-sky-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Se publicó un nuevo aviso: <span className="font-bold">"{act.title}"</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {act.date.toLocaleDateString()} a las {act.date.toLocaleTimeString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
