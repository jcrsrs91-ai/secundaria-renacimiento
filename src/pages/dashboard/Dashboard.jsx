import { useState, useEffect } from 'react';
import { Users, Clock, GraduationCap, Megaphone, Activity } from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';

export default function Dashboard() {
  const [stats, setStats] = useState([
    { name: 'Alumnos Activos', value: '...', icon: Users, color: 'bg-sky-500' },
    { name: 'Trámites Pendientes', value: '...', icon: Clock, color: 'bg-indigo-500' },
    { name: 'Alumnos Egresados', value: '...', icon: GraduationCap, color: 'bg-emerald-500' },
    { name: 'Avisos Publicados', value: '...', icon: Megaphone, color: 'bg-slate-700' },
  ]);

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Escuchar estudiantes
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      let activos = 0;
      let pendientes = 0;
      let egresados = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
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
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        date: doc.data().createdAt?.toDate() || new Date(),
        type: doc.data().type
      }));
      setRecentActivity(activities);
    });

    return () => {
      unsubStudents();
      unsubAvisos();
      unsubRecent();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg ${item.color}`}>
                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">{item.name}</dt>
                    <dd>
                      <div className="text-2xl font-bold text-slate-900">{item.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
