import { Users, AlertTriangle, BookOpen, Clock } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { name: 'Alumnos Activos', value: '854', icon: Users, color: 'bg-blue-500' },
    { name: 'Expedientes Pendientes', value: '12', icon: Clock, color: 'bg-amber-500' },
    { name: 'Alertas de Asistencia', value: '5', icon: AlertTriangle, color: 'bg-rose-500' },
    { name: 'Libros en Préstamo', value: '43', icon: BookOpen, color: 'bg-emerald-500' },
  ];

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

      <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Actividad Reciente</h2>
        <div className="text-slate-500 text-sm">
          Aún no hay actividad registrada en el sistema. Las altas, bajas y notificaciones aparecerán aquí.
        </div>
      </div>
    </div>
  );
}
