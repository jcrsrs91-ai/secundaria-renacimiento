import React from 'react';
import { UserMinus, Printer, X, Calendar, MapPin, AlertCircle, Hash, GraduationCap } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 flex justify-center overflow-y-auto print:bg-white print:block print:inset-auto print:overflow-visible custom-scrollbar">
      <style>
        {`
          @media print {
            @page { size: portrait; margin: 12mm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; }
            * { overflow: visible !important; }
            aside, header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
            .no-print { display: none !important; }
            .page-break-inside-avoid { page-break-inside: avoid; }
          }
        `}
      </style>

      {/* Controles NO imprimibles */}
      <div className="absolute top-6 right-6 flex gap-3 no-print fixed z-[60]">
        <button 
          onClick={() => window.print()} 
          className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition font-bold"
        >
          <Printer className="w-5 h-5 mr-2" /> Imprimir Reporte
        </button>
        <button onClick={onClose} className="p-2.5 bg-white text-slate-500 rounded-xl shadow-lg hover:bg-slate-100 hover:text-slate-800 transition">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div id="printable-desertores" className="bg-white my-10 w-full max-w-[210mm] mx-auto shadow-2xl rounded-2xl overflow-hidden print:my-0 print:shadow-none print:border-none print:rounded-none print:max-w-none text-slate-800">
        
        {/* Encabezado Principal */}
        <div className="bg-slate-800 px-10 py-10 text-white relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-700 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600 rounded-full opacity-20 blur-2xl"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner">
                <UserMinus className="w-10 h-10 text-rose-300" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-1">
                  Relación de Alumnos Desertores
                </h1>
                <p className="text-slate-300 font-medium tracking-wide">
                  Ciclo Escolar 2025-2026 • Formato E6
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 inline-block shadow-inner">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Bajas</p>
                <p className="text-3xl font-black text-rose-400 leading-none">{bajasOrdenadas.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-10 bg-slate-50/50">
          
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
              {bajasOrdenadas.map((s, idx) => {
                const nombreCompleto = `${s.apellidoPaterno} ${s.apellidoMaterno} ${s.nombres}`.toUpperCase();
                const edad = calcularEdad(s.fechaNacimiento);
                const gradoGrupo = `${s.grado[0]} "${s.grupo}"`;
                const domicilio = `${s.calle || ''} ${s.numero || ''} ${s.colonia || ''}`.trim().toUpperCase();
                const motivo = (s.motivoBaja || 'CAUSA NO ESPECIFICADA').toUpperCase();

                return (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5 page-break-inside-avoid relative overflow-hidden group">
                    {/* Número de lista decorativo */}
                    <div className="absolute -top-4 -right-4 text-[100px] font-black text-slate-50 leading-none select-none z-0">
                      {idx + 1}
                    </div>

                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-black text-slate-800">{nombreCompleto}</h3>
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
                          <p className="text-sm font-semibold text-slate-700">{s.fechaNacimiento || 'N/A'} <span className="text-slate-400 font-normal">({edad} años)</span></p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Domicilio Registrado</p>
                          <p className="text-sm font-semibold text-slate-700 break-words">{domicilio || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Alerta de Causa de Deserción */}
                    <div className="relative z-10 mt-2 bg-rose-50/80 border border-rose-200/60 p-4 rounded-xl flex items-start gap-4">
                      <div className="bg-rose-100 p-2 rounded-lg mt-0.5">
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Causa de Deserción Oficial</p>
                        <p className="text-base font-bold text-rose-900 break-words">{motivo}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pie de página oficial */}
          {bajasOrdenadas.length > 0 && (
            <div className="mt-12 pt-10 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 text-center mb-10 flex items-center justify-center bg-slate-100 py-3 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-slate-400 mr-2 inline-block"></span>
                NOTA: Esta relación deberá anexarse al concentrado de alumnos desertores en la Etapa de Zona Escolar.
              </p>
              
              <div className="text-center w-full max-w-sm mx-auto">
                <div className="border-b-2 border-slate-800 w-full mb-3"></div>
                <div className="text-slate-800 font-black tracking-wide text-sm mb-1">NOMBRE Y FIRMA DEL DIRECTOR(A)</div>
                <div className="text-slate-400 font-semibold text-xs tracking-widest">SELLO DE LA INSTITUCIÓN</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
