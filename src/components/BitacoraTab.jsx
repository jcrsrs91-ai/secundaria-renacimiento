import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Clock, User, Activity, FileText, Filter, Calendar, Download, ArrowRight, RotateCcw, Users } from 'lucide-react';
import Papa from 'papaparse';
import { downloadExcelFriendlyCsv } from '../utils/exportCsv';

export default function BitacoraTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('TODOS');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [dateRange, setDateRange] = useState('TODOS'); // 'HOY', '7DIAS', 'MES', 'TODOS'

  useEffect(() => {
    // Escuchar los últimos 500 movimientos de la bitácora, del más reciente al más antiguo
    const q = query(
      collection(db, 'bitacora_movimientos'),
      orderBy('fecha', 'desc'),
      limit(500)
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

  const getLogDate = (log) => {
    if (log.fecha && typeof log.fecha.toDate === 'function') {
      return log.fecha.toDate();
    }
    if (log.timestampISO) {
      const d = new Date(log.timestampISO);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const getActionCategory = (accion = '') => {
    const a = accion.toLowerCase();
    if (a.includes('edición') || a.includes('expediente') || a.includes('beca') || a.includes('grupo') || a.includes('turno') || a.includes('reactivación') || a.includes('asignación masiva')) {
      return 'EXPEDIENTE';
    }
    if (a.includes('alta') || a.includes('aceptar') || a.includes('importación')) {
      return 'ALTAS';
    }
    if (a.includes('baja') || a.includes('eliminar') || a.includes('eliminación')) {
      return 'BAJAS';
    }
    if (a.includes('calificación') || a.includes('calificaciones') || a.includes('disciplina') || a.includes('sábana') || a.includes('extraordinario')) {
      return 'CALIFICACIONES';
    }
    if (a.includes('foto') || a.includes('fotografía') || a.includes('documento') || a.includes('constancia') || a.includes('acuse')) {
      return 'DOCUMENTOS_FOTOS';
    }
    return 'SISTEMA';
  };

  // Lista única de usuarios que han registrado movimientos
  const uniqueUsers = useMemo(() => {
    const set = new Set();
    logs.forEach(l => {
      if (l.usuario) set.add(l.usuario);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtrar primero por fecha y categoría y texto para calcular productividad y tabla
  const logsByDateAndCategory = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOf7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return logs.filter(log => {
      const logDate = getLogDate(log);
      if (dateRange === 'HOY' && (!logDate || logDate < startOfToday)) return false;
      if (dateRange === '7DIAS' && (!logDate || logDate < startOf7Days)) return false;
      if (dateRange === 'MES' && (!logDate || logDate < startOfMonth)) return false;

      if (selectedCategory !== 'TODAS') {
        const cat = getActionCategory(log.accion || '');
        if (cat !== selectedCategory) return false;
      }

      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchUser = log.usuario && log.usuario.toLowerCase().includes(term);
        const matchAccion = log.accion && log.accion.toLowerCase().includes(term);
        const matchDetalle = log.detalle && log.detalle.toLowerCase().includes(term);
        const matchModulo = log.modulo && log.modulo.toLowerCase().includes(term);
        if (!matchUser && !matchAccion && !matchDetalle && !matchModulo) return false;
      }

      return true;
    });
  }, [logs, dateRange, selectedCategory, searchTerm]);

  // Resumen de movimientos por usuario (compañero)
  const userCounts = useMemo(() => {
    const counts = {};
    logsByDateAndCategory.forEach(log => {
      const u = log.usuario || 'Desconocido';
      counts[u] = (counts[u] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [logsByDateAndCategory]);

  // Logs finales aplicando también el filtro de usuario seleccionado
  const filteredLogs = useMemo(() => {
    if (selectedUser === 'TODOS') return logsByDateAndCategory;
    return logsByDateAndCategory.filter(l => (l.usuario || 'Desconocido') === selectedUser);
  }, [logsByDateAndCategory, selectedUser]);

  const getActionColor = (accion = '') => {
    const a = accion.toLowerCase();
    if (a.includes('baja') || a.includes('eliminar') || a.includes('eliminación') || a.includes('revocar')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (a.includes('alta') || a.includes('aceptar') || a.includes('autorizar') || a.includes('importación') || a.includes('reactivación')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (a.includes('calificación') || a.includes('calificaciones') || a.includes('disciplina') || a.includes('sábana')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    if (a.includes('beca')) {
      return 'bg-teal-100 text-teal-800 border-teal-200';
    }
    if (a.includes('foto') || a.includes('fotografía')) {
      return 'bg-sky-100 text-sky-800 border-sky-200';
    }
    if (a.includes('edición') || a.includes('modificar') || a.includes('grupo') || a.includes('asignación')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert("No hay movimientos en el filtro actual para exportar.");
      return;
    }

    const rows = filteredLogs.map(log => {
      const d = getLogDate(log);
      return {
        'Fecha': d ? d.toLocaleDateString('es-MX') : '',
        'Hora': d ? d.toLocaleTimeString('es-MX') : '',
        'Usuario': log.usuario || 'Desconocido',
        'Módulo': log.modulo || '',
        'Acción': log.accion || '',
        'Detalle del Movimiento': log.detalle || ''
      };
    });

    const csv = Papa.unparse(rows, { delimiter: '\t' });
    downloadExcelFriendlyCsv(`Bitacora_Movimientos_${new Date().toISOString().split('T')[0]}.csv`, csv);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedUser('TODOS');
    setSelectedCategory('TODAS');
    setDateRange('TODOS');
  };

  return (
    <div className="space-y-4">
      {/* Encabezado y Acciones */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-600" />
              Bitácora de Auditoría y Movimientos del Personal
            </h2>
            <p className="text-sm text-slate-500">
              Supervisa en tiempo real las ediciones de expediente, becas, altas, bajas, fotos y calificaciones realizadas por cada compañero.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {(searchTerm || selectedUser !== 'TODOS' || selectedCategory !== 'TODAS' || dateRange !== 'TODOS') && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Limpiar Filtros
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <Download className="w-4 h-4 mr-1.5" /> Exportar Bitácora (Excel)
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Buscador */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Buscar Alumno o Detalle</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Ej. nombre, grupo, beca, baja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Filtro por Compañero / Usuario */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Compañero / Usuario
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium bg-slate-50 focus:bg-white text-slate-700"
            >
              <option value="TODOS">Todos los usuarios ({uniqueUsers.length})</option>
              {uniqueUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo de Movimiento */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Tipo de Movimiento
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium bg-slate-50 focus:bg-white text-slate-700"
            >
              <option value="TODAS">Todas las acciones</option>
              <option value="EXPEDIENTE">Edición de Expediente / Beca / Grupo</option>
              <option value="ALTAS">Altas, Aceptación e Importación CSV</option>
              <option value="BAJAS">Bajas y Eliminaciones</option>
              <option value="CALIFICACIONES">Captura de Calificaciones</option>
              <option value="DOCUMENTOS_FOTOS">Fotografías y Documentos</option>
              <option value="SISTEMA">Accesos y Cierre de Ciclo</option>
            </select>
          </div>

          {/* Filtro por Periodo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Periodo de Tiempo
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium bg-slate-50 focus:bg-white text-slate-700"
            >
              <option value="TODOS">Todo el historial reciente</option>
              <option value="HOY">Solo Hoy</option>
              <option value="7DIAS">Últimos 7 días</option>
              <option value="MES">Este Mes</option>
            </select>
          </div>
        </div>

        {/* Tarjetas de Actividad por Compañero */}
        {userCounts.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              Movimientos por Compañero (Haz clic en un usuario para filtrar sus acciones):
            </p>
            <div className="flex flex-wrap gap-2">
              {userCounts.map(([usr, count]) => {
                const isSelected = selectedUser === usr;
                return (
                  <button
                    key={usr}
                    type="button"
                    onClick={() => setSelectedUser(isSelected ? 'TODOS' : usr)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'
                    }`}
                  >
                    <User className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`} />
                    <span>{usr}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-black ${
                      isSelected ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Mostrando {filteredLogs.length} movimiento(s)
          </span>
          {selectedUser !== 'TODOS' && (
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Filtrado por: {selectedUser}
            </span>
          )}
        </div>

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
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Fecha y Hora</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-56">Usuario</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-44">Módulo / Acción</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle Completo de los Cambios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                      No se encontraron movimientos registrados con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const logDate = getLogDate(log);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors align-top">
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600">
                          <div className="flex items-start">
                            <Clock className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-slate-400 shrink-0" />
                            {logDate ? (
                              <div>
                                <span className="font-bold text-slate-700">
                                  {logDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <br />
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {logDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Procesando...</span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                          <div className="flex items-center break-all">
                            <User className="w-3.5 h-3.5 mr-1.5 text-indigo-500 shrink-0" />
                            <span>{log.usuario}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-xs">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getActionColor(log.accion || '')}`}>
                              {log.accion}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {log.modulo}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-xs text-slate-700">
                          {Array.isArray(log.cambios) && log.cambios.length > 0 ? (
                            <div className="space-y-1.5">
                              {log.alumnoNombre && (
                                <div className="font-bold text-slate-800">
                                  Alumno: <span className="text-indigo-700">{log.alumnoNombre}</span>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {log.cambios.map((c, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-slate-800 text-[11px]"
                                  >
                                    <strong className="text-amber-900">{c.campo}:</strong>
                                    <span className="line-through text-slate-400">{c.antes}</span>
                                    <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span className="font-bold text-emerald-700">{c.despues}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start leading-relaxed whitespace-normal break-words">
                              <FileText className="w-3.5 h-3.5 mr-2 mt-0.5 text-slate-400 shrink-0" />
                              <span>{log.detalle}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
