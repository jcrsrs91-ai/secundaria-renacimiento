import React, { useMemo } from 'react';
import { UserMinus, Printer, X, Calendar, MapPin, AlertCircle, Hash, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export default function DesertoresPrint({ bajas = [], onClose }) {
  // Función para calcular edad
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edad--;
    }
    return edad;
  };

  // Ordenar alfabéticamente
  const bajasOrdenadas = [...bajas].sort((a, b) => {
    const nameA = `${a.apellidoPaterno} ${a.apellidoMaterno} ${a.nombres}`.trim().toLowerCase();
    const nameB = `${b.apellidoPaterno} ${b.apellidoMaterno} ${b.nombres}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const chartData = useMemo(() => {
    const data = {
      '1er Grado': 0,
      '2do Grado': 0,
      '3er Grado': 0
    };
    
    bajas.forEach(b => {
      const g = b.grado;
      if (data[g] !== undefined) {
        data[g]++;
      }
    });

    return [
      { name: '1er Grado', Bajas: data['1er Grado'], fill: '#ef4444' }, // Red
      { name: '2do Grado', Bajas: data['2do Grado'], fill: '#f43f5e' }, // Rose
      { name: '3er Grado', Bajas: data['3er Grado'], fill: '#e11d48' }  // Dark Rose
    ];
  }, [bajas]);

  return (
    <div className="print-desertores-only relative bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white font-sans text-slate-800">
      <style>
        {`
          @media print {
            @page { size: letter portrait; margin: 0.5cm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; zoom: 0.95; }
            * { overflow: visible !important; }
            aside, header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
            .no-print { display: none !important; }
            .page-break-inside-avoid { page-break-inside: avoid; }
            .print-desertores-only { display: block !important; margin: 0; padding: 0; }
          }
        `}
      </style>

      {/* Botones Flotantes para la pantalla */}
      <div className="flex justify-center mb-8 gap-4 print:hidden no-print">
        <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
          <Printer className="w-5 h-5 mr-2" />
          Imprimir Reporte
        </button>
        {onClose && (
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
            <X className="w-5 h-5 mr-2" />
            Cerrar Vista Previa
          </button>
        )}
      </div>

      <div className="bg-white max-w-4xl mx-auto p-10 rounded-2xl shadow-xl print:shadow-none print:p-0 print:rounded-none">
        
        {/* Encabezado Elegante */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-slate-200 pb-6 print:border-black print:pb-1 print:mb-4">
          <img src="/logo-sep.png" alt="SEP" className="h-16 w-auto object-contain print:h-12" />
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase print:text-lg print:leading-tight">RELACIÓN DE ALUMNOS DESERTORES</h1>
            <h2 className="text-base font-bold text-slate-600 mt-1 uppercase print:text-xs print:mt-0 print:leading-tight">Escuela Secundaria Técnica N° 68 "Renacimiento"</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 print:text-[10px] print:mt-0 print:leading-tight">Ciclo Escolar 2025-2026 • Formato E6</p>
          </div>
          <img src="/logo-escuela.png" alt="Escuela" className="h-20 w-auto object-contain print:h-14" />
        </div>

        {/* Resumen Total Bajas */}
        <div className="flex justify-center mb-8 print:mb-4">
          <div className="bg-rose-50 border border-rose-100 px-6 py-3 rounded-xl flex items-center gap-4 print:border-none print:bg-transparent print:p-0">
            <div className="bg-rose-100 p-2 rounded-lg print:hidden">
              <UserMinus className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-rose-600 font-bold uppercase tracking-wider mb-0.5 print:text-black">Total de Bajas Registradas</p>
              <p className="text-3xl font-black text-rose-700 leading-none print:text-xl print:text-black">{bajasOrdenadas.length}</p>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="mt-6">
          
          {bajasOrdenadas.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserMinus className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Sin bajas registradas</h3>
              <p className="text-slate-500">No hay ningún alumno con estatus de deserción en este ciclo escolar.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Gráfica (Imprimible y Optimizada) */}
              <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm break-inside-avoid print:shadow-none print:border-slate-400 print:p-4 mb-6 print:mb-12">
                <h3 className="text-center text-sm font-black text-slate-800 mb-4 uppercase tracking-wide print:text-black print:mb-6">
                  Distribución de Bajas por Grado
                </h3>
                <div className="h-64 w-full max-w-2xl mx-auto mt-4 print:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#1e293b', fontWeight: 700, fontSize: 12}} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 600}} />
                      <RechartsTooltip 
                        cursor={{fill: '#f1f5f9'}}
                        contentStyle={{borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: 'none'}}
                        labelStyle={{color: '#1e293b', marginBottom: '4px', fontWeight: 'bold'}}
                      />
                      <Bar dataKey="Bajas" radius={[4, 4, 0, 0]} barSize={50}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla Desglosada */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-400 print:rounded-none mt-6">
                <table className="min-w-full divide-y divide-slate-200 text-sm print:text-[10px]">
                  <thead>
                    <tr className="bg-slate-800 text-white print:bg-slate-200 print:text-black">
                      <th className="px-3 py-3 text-center font-bold border-r border-slate-700 print:border-slate-400 w-12 print:py-1">N°</th>
                      <th className="px-4 py-3 text-left font-bold border-r border-slate-700 print:border-slate-400 print:py-1">NOMBRE COMPLETO DEL ALUMNO</th>
                      <th className="px-3 py-3 text-center font-bold border-r border-slate-700 print:border-slate-400 print:py-1">SEXO</th>
                      <th className="px-3 py-3 text-center font-bold border-r border-slate-700 print:border-slate-400 print:py-1">GRADO Y GRUPO</th>
                      <th className="px-4 py-3 text-left font-bold border-r border-slate-700 print:border-slate-400 print:py-1">CAUSA DE DESERCIÓN OFICIAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white print:divide-slate-400">
                    {bajasOrdenadas.map((s, idx) => {
                      const nombreCompleto = `${s.apellidoPaterno} ${s.apellidoMaterno} ${s.nombres}`.toUpperCase();
                      const gradoGrupo = `${s.grado[0]} "${s.grupo}"`;
                      const motivo = (s.motivoBaja || 'CAUSA NO ESPECIFICADA').toUpperCase();
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors text-slate-700 print:text-black break-inside-avoid">
                          <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-400 print:py-1 font-bold">{idx + 1}</td>
                          <td className="px-4 py-2 text-left border-r border-slate-200 print:border-slate-400 print:py-1 font-semibold">{nombreCompleto}</td>
                          <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-400 print:py-1">{s.genero === 'Mujer' ? 'M' : 'H'}</td>
                          <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-400 print:py-1 font-bold">{gradoGrupo}</td>
                          <td className="px-4 py-2 text-left print:py-1 text-rose-700 font-bold print:text-black">{motivo}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pie de página oficial */}
          {bajasOrdenadas.length > 0 && (
            <div className="mt-12 pt-10 border-t border-slate-200 print:mt-6 print:pt-4 break-inside-avoid">
              <p className="text-xs font-semibold text-slate-500 text-center mb-10 flex items-center justify-center bg-slate-100 py-3 rounded-xl print:text-[10px] print:bg-transparent print:mb-6 print:text-black">
                <span className="w-2 h-2 rounded-full bg-slate-400 mr-2 inline-block print:bg-black"></span>
                NOTA: Esta relación deberá anexarse al concentrado de alumnos desertores en la Etapa de Zona Escolar.
              </p>
              
              <div className="mt-16 pt-8 flex justify-center print:mt-8 print:pt-2">
                <div className="text-center w-80 print:w-64">
                  <div className="border-t-2 border-slate-800 pt-2 font-bold text-slate-800 text-sm print:border-black print:text-[10px] print:pt-1">PROFR. JUAN CARLOS TABOADA BARAJAS</div>
                  <div className="mt-1 text-slate-500 text-xs font-semibold tracking-wide print:text-black print:text-[8px] print:mt-0">DIRECTOR DE LA ESCUELA</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
