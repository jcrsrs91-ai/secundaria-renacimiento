import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Clock, User, Activity, FileText } from 'lucide-react';

export default function BitacoraTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Escuchar los últimos 300 movimientos de la bitácora, del más reciente al más antiguo
    const q = query(
      collection(db, 'bitacora_movimientos'),
      orderBy('fecha', 'desc'),
      limit(300)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Error cargando bitácora:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      (log.usuario && log.usuario.toLowerCase().includes(term)) ||
      (log.accion && log.accion.toLowerCase().includes(term)) ||
      (log.detalle && log.detalle.toLowerCase().includes(term)) ||
      (log.modulo && log.modulo.toLowerCase().includes(term))
    );
  });

  const getActionColor = (accion) => {
    const a = accion.toLowerCase();
    if (a.includes('alta') || a.includes('aceptar') || a.includes('crear')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (a.includes('baja') || a.includes('eliminar') || a.includes('borrar')) return 'bg-red-100 text-red-800 border-red-200';
    if (a.includes('calificación') || a.includes('evaluar')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (a.includes('edición') || a.includes('modificar')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-indigo-600" />
            Bitácora de Movimientos
          </h2>
          <p className="text-sm text-slate-500">Registro de auditoría de las últimas acciones realizadas en el sistema.</p>
        </div>
        
        <div className="w-full md:w-96 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por usuario, acción o detalle..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            Cargando historial de movimientos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha y Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Módulo</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Acción</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No se encontraron movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-slate-400" />
                          {log.fecha ? (
                            <span>
                              {log.fecha.toDate().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} <br/>
                              <span className="text-xs text-slate-400 font-medium">{log.fecha.toDate().toLocaleTimeString('es-MX')}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Procesando...</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-700">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-slate-400" />
                          {log.usuario}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">
                        {log.modulo}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getActionColor(log.accion || '')}`}>
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-700 max-w-md truncate" title={log.detalle}>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{log.detalle}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
