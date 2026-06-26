import React from 'react';
import { Printer, X, Trophy } from 'lucide-react';

export default function CuadroHonorListaPrint({ ganadores = [], grado, turno, periodoName, onClose }) {
  return (
    <div className="print-honor-only fixed inset-0 z-50 overflow-y-auto print:relative print:inset-auto print:overflow-visible bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white font-sans text-slate-800">
      <style>
        {`
          @media print {
            @page { size: letter portrait; margin: 0.5cm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; zoom: 0.95; }
            * { overflow: visible !important; }
            aside, header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
            .no-print { display: none !important; }
            .print-honor-only { display: block !important; margin: 0; padding: 0; }
          }
        `}
      </style>

      {/* Botones Flotantes para la pantalla */}
      <div className="flex justify-center mb-8 gap-4 print:hidden no-print">
        <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
          <Printer className="w-5 h-5 mr-2" />
          Imprimir Lista
        </button>
        {onClose && (
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
            <X className="w-5 h-5 mr-2" />
            Cerrar Vista Previa
          </button>
        )}
      </div>

      <div className="bg-white max-w-4xl mx-auto p-10 rounded-2xl shadow-xl print:shadow-none print:p-0 print:rounded-none">
        
        {/* Encabezado Oficial */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-slate-200 pb-6 print:border-black print:pb-2 print:mb-6">
          <img src="/logo-sep.png" alt="SEP" className="h-16 w-auto object-contain print:h-12" />
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase print:text-xl print:leading-tight">CUADRO DE HONOR</h1>
            <h2 className="text-base font-bold text-slate-600 mt-1 uppercase print:text-sm print:mt-0 print:leading-tight">Escuela Secundaria Técnica N° 68 "Renacimiento"</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 print:text-[11px] print:mt-0 print:leading-tight">
              {grado} • Turno {turno} • {periodoName} • Ciclo Escolar 2025-2026
            </p>
          </div>
          <img src="/logo-escuela.png" alt="Escuela" className="h-20 w-auto object-contain print:h-14" />
        </div>

        {/* Resumen Total */}
        <div className="flex justify-center mb-8 print:hidden no-print">
          <div className="bg-amber-50 border border-amber-200 px-6 py-3 rounded-xl flex items-center gap-4">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-wider mb-0.5">Alumnos Destacados</p>
              <p className="text-3xl font-black text-amber-800 leading-none">{ganadores.length}</p>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="mt-6">
          {ganadores.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Sin alumnos destacados</h3>
              <p className="text-slate-500">No hay alumnos registrados en el cuadro de honor para este periodo.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-400 print:rounded-none">
              <table className="min-w-full divide-y divide-slate-200 text-sm print:text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white print:bg-slate-200 print:text-black">
                    <th className="px-3 py-3 text-center font-bold border-r border-slate-700 print:border-slate-400 w-24 print:py-2">LUGAR</th>
                    <th className="px-4 py-3 text-left font-bold border-r border-slate-700 print:border-slate-400 print:py-2">NOMBRE COMPLETO DEL ALUMNO</th>
                    <th className="px-3 py-3 text-center font-bold border-r border-slate-700 print:border-slate-400 w-24 print:py-2">GRUPO</th>
                    <th className="px-4 py-3 text-center font-bold border-slate-700 print:border-slate-400 w-32 print:py-2">PROMEDIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white print:divide-slate-400">
                  {ganadores.map((g, idx) => {
                    const nombreCompleto = `${g.student.apellidoPaterno} ${g.student.apellidoMaterno} ${g.student.nombres}`.toUpperCase();
                    let lugarBadge = '';
                    if (g.place === 1) lugarBadge = '1ER LUGAR';
                    else if (g.place === 2) lugarBadge = '2DO LUGAR';
                    else if (g.place === 3) lugarBadge = '3ER LUGAR';
                    else lugarBadge = `${g.place}TO LUGAR`;
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors text-slate-700 print:text-black break-inside-avoid">
                        <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-400 print:py-2 font-black text-amber-700 print:text-black">{lugarBadge}</td>
                        <td className="px-4 py-2 text-left border-r border-slate-200 print:border-slate-400 print:py-2 font-semibold">{nombreCompleto}</td>
                        <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-400 print:py-2 font-bold">{g.student.grupo}</td>
                        <td className="px-4 py-2 text-center print:py-2 font-black text-indigo-700 print:text-black text-base">
                          {(Math.floor((g.average + 0.00001) * 10) / 10).toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pie de página oficial */}
          {ganadores.length > 0 && (
            <div className="mt-16 pt-10 border-t border-slate-200 print:mt-12 print:pt-6 break-inside-avoid">
              <div className="flex justify-center print:mt-8 print:pt-2">
                <div className="text-center w-80 print:w-64">
                  <div className="border-t-2 border-slate-800 pt-2 font-bold text-slate-800 text-sm print:border-black print:text-xs print:pt-1">PROFR. JUAN CARLOS TABOADA BARAJAS</div>
                  <div className="mt-1 text-slate-500 text-xs font-semibold tracking-wide print:text-black print:text-[10px] print:mt-0">DIRECTOR DE LA ESCUELA</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
