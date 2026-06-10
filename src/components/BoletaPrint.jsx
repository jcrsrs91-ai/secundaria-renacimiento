import React from 'react';

export default function BoletaPrint({ students = [], materiasPorGrado = {} }) {
  if (!students || students.length === 0) return null;

  return (
    <div className="print-boleta-only">
      <style>{`
        @media print {
          @page { size: letter; margin: 1cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; margin: 0 !important; padding: 0 !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .print-boleta-only { display: block !important; margin: 0; padding: 0; }
          .boleta-page { 
            page-break-after: always; 
            break-after: page;
            width: 100%; 
            height: auto;
            max-height: 25cm; 
            overflow: hidden;
            box-sizing: border-box;
            position: relative; 
            font-family: sans-serif; 
          }
          .boleta-page:last-child { page-break-after: auto; break-after: auto; }
          
          /* Watermark Oficial */
          .boleta-watermark::before {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70%;
            height: 70%;
            background-image: url('/logo-sep.png');
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            opacity: 0.05;
            z-index: 0;
          }
        }
        @media screen {
          .print-boleta-only { display: none !important; }
        }
      `}</style>

      {students.map(student => {
        const materias = materiasPorGrado[student.grado] || [];
        
        // Calcular calificaciones
        let sumGral = 0;
        let countGral = 0;
        const califs = materias.map(mat => {
          const t1 = parseFloat(student.calificaciones?.['t1']?.[mat.id]);
          const t2 = parseFloat(student.calificaciones?.['t2']?.[mat.id]);
          const t3 = parseFloat(student.calificaciones?.['t3']?.[mat.id]);
          let sum = 0, c = 0;
          if(!isNaN(t1)) { sum+=t1; c++; }
          if(!isNaN(t2)) { sum+=t2; c++; }
          if(!isNaN(t3)) { sum+=t3; c++; }
          
          const final = c > 0 ? (sum/c) : null;
          if (final !== null) { sumGral+=final; countGral++; }
          
          return {
            name: mat.name,
            t1: isNaN(t1) ? '' : t1.toFixed(1),
            t2: isNaN(t2) ? '' : t2.toFixed(1),
            t3: isNaN(t3) ? '' : t3.toFixed(1),
            final: final !== null ? final.toFixed(1) : ''
          };
        });

        const promedioFinal = countGral > 0 ? (sumGral / countGral).toFixed(1) : '';

        return (
          <div key={student.id} className="boleta-page bg-white p-6 relative boleta-watermark">
            <div className="relative z-10">
              {/* ENCABEZADO */}
              <div className="flex justify-between items-center border-b-4 border-slate-800 pb-3 mb-4">
                <img src="/logo-sep.png" alt="SEP" className="w-32 object-contain" />
                <div className="text-center flex-1 px-4">
              <h1 className="font-black text-lg tracking-widest text-slate-900 uppercase">Boleta de Evaluación</h1>
              <h2 className="font-bold text-xs text-slate-700 mt-1 uppercase">Educación Secundaria Técnica</h2>
              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Ciclo Escolar 2025-2026</p>
                </div>
                <img src="/logo-escuela.png" alt="Escuela" className="w-24 object-contain" />
              </div>

              {/* DATOS DE LA ESCUELA Y ALUMNO */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-slate-300 rounded p-2">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Datos de la Institución</div>
                  <div className="text-xs font-black text-slate-800">C.C.T: <span className="font-medium text-slate-600">12DST0077B</span></div>
                  <div className="text-xs font-black text-slate-800 uppercase">Escuela: <span className="font-medium text-slate-600">Escuela Secundaria Técnica N° 68 "Renacimiento"</span></div>
                  <div className="text-xs font-black text-slate-800 uppercase">Turno: <span className="font-medium text-slate-600">{student.turno || 'Matutino'}</span></div>
                </div>
                <div className="border border-slate-300 rounded p-2">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Datos del Alumno</div>
                  <div className="text-xs font-black text-slate-800 uppercase">Nombre: <span className="font-medium text-slate-600">{student.apellidoPaterno} {student.apellidoMaterno} {student.nombres}</span></div>
                  <div className="text-xs font-black text-slate-800 uppercase">CURP: <span className="font-medium text-slate-600">{student.curp}</span></div>
                  <div className="text-xs font-black text-slate-800 uppercase">Grado y Grupo: <span className="font-medium text-slate-600">{student.grado} "{student.grupo}"</span></div>
                </div>
              </div>

              {/* TABLA DE CALIFICACIONES */}
              <div className="border border-slate-800 rounded-md overflow-hidden mb-6 bg-white shadow-sm">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="py-2 px-3 text-left font-bold border-r border-slate-700 w-1/2 uppercase tracking-wider text-xs">Campos Formativos / Disciplinas</th>
                      <th className="py-2 px-2 text-center font-bold border-r border-slate-700 text-[10px] uppercase">1er<br/>Periodo</th>
                      <th className="py-2 px-2 text-center font-bold border-r border-slate-700 text-[10px] uppercase">2do<br/>Periodo</th>
                      <th className="py-2 px-2 text-center font-bold border-r border-slate-700 text-[10px] uppercase">3er<br/>Periodo</th>
                      <th className="py-2 px-2 text-center font-black bg-slate-900 text-[10px] uppercase">Promedio<br/>Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {califs.map((mat, i) => {
                      const finalNum = parseFloat(mat.final);
                      const isReprobado = !isNaN(finalNum) && finalNum < 6.0;
                      return (
                        <tr key={i} className="border-b border-slate-200">
                          <td className="py-2 px-3 font-medium text-slate-800 border-r border-slate-200 uppercase text-xs">{mat.name}</td>
                          <td className="py-2 px-2 text-center border-r border-slate-200">{mat.t1}</td>
                          <td className="py-2 px-2 text-center border-r border-slate-200">{mat.t2}</td>
                          <td className="py-2 px-2 text-center border-r border-slate-200">{mat.t3}</td>
                          <td className={`py-2 px-2 text-center font-bold bg-slate-50 ${isReprobado ? 'text-rose-600' : 'text-slate-900'}`}>{mat.final}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-slate-800 bg-slate-100">
                      <td colSpan="4" className="py-3 px-3 text-right font-black uppercase text-sm border-r border-slate-300">Promedio Final del Grado</td>
                      <td className="py-3 px-2 text-center font-black text-lg text-slate-900">{promedioFinal}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ASISTENCIA (Opcional simulado) */}
              <div className="flex gap-4 mb-8">
                <div className="flex-1 border border-slate-300 rounded p-2 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Asistencia Parcial</div>
                  <div className="text-sm font-bold text-slate-800">≥ 80% (Aprobatoria)</div>
                </div>
                <div className="flex-1 border border-slate-300 rounded p-2 text-center bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Resultado de la Evaluación</div>
                  <div className="text-sm font-black text-slate-900 uppercase">
                    {promedioFinal ? (parseFloat(promedioFinal) >= 6.0 ? 'Promovido' : 'No Promovido') : 'En Curso'}
                  </div>
                </div>
              </div>

              {/* FIRMAS Y SELLOS */}
              <div className="mt-16 flex justify-between items-end px-10">
                <div className="text-center w-64">
                  <div className="border-b border-black w-full mb-1 h-8"></div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase">Nombre y Firma de la Madre, Padre o Tutor</p>
                </div>

                <div className="text-center w-64 relative">
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-28 h-28 border-4 border-slate-300 rounded-full flex flex-col items-center justify-center opacity-30 -rotate-12 z-0">
                     <p className="text-[6px] font-bold uppercase tracking-widest mb-1">SEP</p>
                     <div className="w-16 h-px bg-slate-300 mb-1"></div>
                     <p className="text-[8px] font-black uppercase text-center leading-tight">Sello de la<br/>Institución</p>
                  </div>
                  <div className="border-b border-black w-full mb-1 h-8 relative z-10"></div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase relative z-10">Profr. Juan Carlos Taboada Barajas</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5 relative z-10">Director del Plantel</p>
                </div>
              </div>

              {/* FOLIO */}
              <div className="mt-10 text-right">
                 <p className="text-[8px] text-slate-400 font-mono">FOLIO: {student.matricula}-{new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
