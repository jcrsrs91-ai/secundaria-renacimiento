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
      { name: '1er Grado', Bajas: data['1er Grado'], fill: '#ef4444' },
      { name: '2do Grado', Bajas: data['2do Grado'], fill: '#f43f5e' },
      { name: '3er Grado', Bajas: data['3er Grado'], fill: '#e11d48' }
    ];
  }, [bajas]);

  return (
    <div className="print-desertores-only relative bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white font-sans text-slate-800">
      <style>
        {`
          @media print {
            @page { size: portrait; margin: 1cm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; }
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
              
              {/* Gráfica Interactiva (No imprimible) */}
              <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm no-print print:hidden mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  Distribución de Bajas por Grado
                </h3>
                <div className="h-72 w-full max-w-2xl mx-auto mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
                        </filter>
                        <linearGradient id="color1er" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#be123c" stopOpacity={0.9}/>
                        </linearGradient>
                        <linearGradient id="color2do" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e11d48" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#9f1239" stopOpacity={0.9}/>
                        </linearGradient>
                        <linearGradient id="color3er" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#be123c" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#881337" stopOpacity={0.9}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 600, dy: 10}} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <RechartsTooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 'bold'}}
                        labelStyle={{color: '#1e293b', marginBottom: '8px'}}
                      />
                      <Bar dataKey="Bajas" radius={[6, 6, 0, 0]} barSize={50} animationDuration={1500} filter="url(#shadow)">
                        {chartData.map((entry, index) => {
                          const grad = index === 0 ? "url(#color1er)" : index === 1 ? "url(#color2do)" : "url(#color3er)";
                          return <Cell key={`cell-${index}`} fill={grad} />
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {bajasOrdenadas.map((s, idx) => {
                const nombreCompleto = `${s.apellidoPaterno} ${s.apellidoMaterno} ${s.nombres}`.toUpperCase();
                const edad = calcularEdad(s.fechaNacimiento);
                const gradoGrupo = `${s.grado[0]} "${s.grupo}"`;
                const domicilio = `${s.calle || ''} ${s.numero || ''} ${s.colonia || ''}`.trim().toUpperCase();
                const motivo = (s.motivoBaja || 'CAUSA NO ESPECIFICADA').toUpperCase();

                return (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-4 page-break-inside-avoid relative overflow-hidden group">
                    {/* Número de lista decorativo */}
                    <div className="absolute -top-3 -right-3 text-[80px] font-black text-slate-50 leading-none select-none z-0">
                      {idx + 1}
                    </div>

                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-black text-slate-800">{nombreCompleto}</h3>
                          {s.genero === 'Mujer' ? (
                            <span className="px-2.5 py-0.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-full text-xs font-bold uppercase">Mujer</span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-bold uppercase">Hombre</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                          <Hash className="w-4 h-4 text-slate-400" />
                          <span>Matrícula: {s.matricula || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-1.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-sm">
                          <GraduationCap className="w-4 h-4" />
                          {gradoGrupo}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-4 mt-2">
                      <div className="flex items-start gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nacimiento y Edad</p>
                          <p className="text-xs font-semibold text-slate-700">{s.fechaNacimiento || 'N/A'} <span className="text-slate-400 font-normal">({edad} años)</span></p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Domicilio Registrado</p>
                          <p className="text-xs font-semibold text-slate-700 break-words">{domicilio || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Alerta de Causa de Deserción */}
                    <div className="relative z-10 bg-rose-50/80 border border-rose-200/60 p-3 rounded-xl flex items-start gap-3">
                      <div className="bg-rose-100 p-1.5 rounded-lg mt-0.5">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Causa de Deserción Oficial</p>
                        <p className="text-sm font-bold text-rose-900 break-words">{motivo}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
