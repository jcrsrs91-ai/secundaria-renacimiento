import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CalendarDays, Printer, Users, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportesAsistencia() {
  const [datosMensuales, setDatosMensuales] = useState([]);
  const [resumenHoy, setResumenHoy] = useState({ entradas: 0, salidas: 0, totalAlumnos: 0, faltas: 0 });
  const [cargando, setCargando] = useState(true);
  
  // Rango de fechas por defecto: este mes
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Obtener total de alumnos activos
      const alumnosSnapshot = await getDocs(collection(db, 'students'));
      const totalAlumnos = alumnosSnapshot.size;

      // 2. Definir rango
      const fInicio = new Date(fechaInicio + 'T00:00:00');
      const fFin = new Date(fechaFin + 'T23:59:59');

      // 3. Obtener asistencias en el rango
      const q = query(
        collection(db, 'asistencias'),
        where('timestamp', '>=', Timestamp.fromDate(fInicio)),
        where('timestamp', '<=', Timestamp.fromDate(fFin))
      );
      
      const asisSnapshot = await getDocs(q);
      const asistencias = asisSnapshot.docs.map(doc => doc.data());

      // 4. Procesar para Gráfica (Agrupar por Fecha)
      const agrupadoPorDia = {};
      
      // Inicializar el diccionario con las fechas del rango (si no son muchas)
      const fechaActual = new Date(fInicio);
      while(fechaActual <= fFin) {
        const strDate = fechaActual.toISOString().split('T')[0];
        agrupadoPorDia[strDate] = { fecha: strDate, Entradas: 0, Salidas: 0 };
        fechaActual.setDate(fechaActual.getDate() + 1);
      }

      let entradasHoyCount = 0;
      let salidasHoyCount = 0;
      const strHoy = new Date().toISOString().split('T')[0];

      asistencias.forEach(a => {
        if (!a.timestamp) return;
        const d = a.timestamp.toDate();
        const strDate = d.toISOString().split('T')[0];
        
        if (agrupadoPorDia[strDate]) {
          if (a.tipo === 'ENTRADA') agrupadoPorDia[strDate].Entradas++;
          if (a.tipo === 'SALIDA') agrupadoPorDia[strDate].Salidas++;
        }

        if (strDate === strHoy) {
          if (a.tipo === 'ENTRADA') entradasHoyCount++;
          if (a.tipo === 'SALIDA') salidasHoyCount++;
        }
      });

      const datosGrafica = Object.values(agrupadoPorDia).sort((a, b) => a.fecha.localeCompare(b.fecha));
      setDatosMensuales(datosGrafica);

      setResumenHoy({
        entradas: entradasHoyCount,
        salidas: salidasHoyCount,
        totalAlumnos: totalAlumnos,
        faltas: totalAlumnos - entradasHoyCount // Aproximación
      });

    } catch (error) {
      console.error("Error al cargar reportes:", error);
      toast.error('No se pudieron cargar los reportes');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [fechaInicio, fechaFin]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Controles (Ocultos en impresión) */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <CalendarDays className="w-5 h-5 text-gray-500" />
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={e => setFechaInicio(e.target.value)}
              className="border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <span className="text-gray-400">a</span>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={e => setFechaFin(e.target.value)}
              className="border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
        
        <button 
          onClick={handlePrint}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir Reporte
        </button>
      </div>

      {/* Encabezado visible solo en impresión */}
      <div className="hidden print:block text-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold font-serif text-gray-900">Escuela Secundaria "Renacimiento"</h1>
        <p className="text-gray-600">Reporte de Asistencia Estudiantil</p>
        <p className="text-gray-500 text-sm mt-1">Periodo: {fechaInicio} al {fechaFin}</p>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas de Resumen (Hoy) */}
          <h2 className="text-lg font-bold text-gray-800 mb-2 print:text-base">Métricas de Hoy ({new Date().toLocaleDateString('es-MX')})</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Matrícula Total</p>
                <p className="text-2xl font-bold text-gray-900">{resumenHoy.totalAlumnos}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Entradas Registradas</p>
                <p className="text-2xl font-bold text-gray-900">{resumenHoy.entradas}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Salidas Registradas</p>
                <p className="text-2xl font-bold text-gray-900">{resumenHoy.salidas}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Inasistencias (Aprox.)</p>
                <p className="text-2xl font-bold text-gray-900">{resumenHoy.faltas < 0 ? 0 : resumenHoy.faltas}</p>
              </div>
            </div>
          </div>

          {/* Gráfica */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Tendencia de Asistencia (Periodo Seleccionado)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosMensuales} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="fecha" stroke="#9ca3af" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Salidas" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="hidden print:block text-center mt-12 pt-8 text-sm text-gray-500">
            <p>______________________________________</p>
            <p className="mt-2">Firma del Director(a) / Supervisor(a)</p>
          </div>
        </>
      )}
    </div>
  );
}
