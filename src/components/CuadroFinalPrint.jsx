import React from 'react';
import { truncateTo1Dec, getCalificacionFinal } from '../utils/format';

export default function CuadroFinalPrint({ alumnos = [], materias = [], grado = '', grupo = '' }) {
  if (!alumnos || alumnos.length === 0) return null;

  // Calcular métricas
  const matriculaTotal = alumnos.length;
  let reprobadosPorMateria = {};
  let sumaPorMateria = {};
  let countPorMateria = {};
  
  materias.forEach(mat => {
    reprobadosPorMateria[mat.id] = 0;
    sumaPorMateria[mat.id] = 0;
    countPorMateria[mat.id] = 0;
  });

  const getPromedioFinalObj = (student, materiaId) => {
    return getCalificacionFinal(student, materiaId);
  };

  const getPromedioGeneralAlumno = (student) => {
    let sum = 0, count = 0;
    materias.forEach(mat => {
      const finalObj = getPromedioFinalObj(student, mat.id);
      if (finalObj !== null) { sum += finalObj.valor; count++; }
    });
    return count > 0 ? truncateTo1Dec(sum / count) : '-';
  };

  return (
    <div className="print-concentrado-only">
      <style>{`
        @media print {
          @page { size: portrait; margin: 0.5cm; }
          html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .print-concentrado-only { display: block !important; margin: 0; padding: 0; font-family: sans-serif; }
          .portrait-page { page-break-after: always; break-after: page; width: 100%; box-sizing: border-box; }
          .portrait-page:last-child { page-break-after: auto; break-after: auto; }
          table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
        @media screen {
          .print-concentrado-only { display: none !important; }
        }
      `}</style>

      <div className="portrait-page">
        <div className="flex justify-between items-center mb-4">
          <img src="/logo-sep.png" alt="SEP" className="h-12 object-contain" />
          <div className="text-center">
            <h1 className="font-black text-xl tracking-wider uppercase">Cuadro de Concentración (Promedios Finales)</h1>
            <h2 className="font-bold text-sm text-slate-700 uppercase">Escuela Secundaria Técnica N° 68 "Renacimiento"</h2>
            <p className="text-xs font-bold text-slate-600 mt-1 uppercase">Grado: {grado} | Grupo: "{grupo}" | Ciclo Escolar 2025-2026</p>
          </div>
          <img src="/logo-escuela.png" alt="Escuela" className="h-14 object-contain" />
        </div>

        <table className="w-full text-[8px] border border-black mb-6">
          <thead>
            <tr className="bg-slate-200">
              <th className="border border-black p-0.5 text-center w-5">No.</th>
              <th className="border border-black p-0.5 text-left w-48">Nombre del Alumno</th>
              {materias.map(mat => (
                <th key={mat.id} className="border border-black p-0.5 text-center truncate overflow-hidden max-w-[45px] text-[7px]" title={mat.name}>
                  {mat.name.replace('Formación Cívica y Ética', 'F.C.E.').replace('Educación', 'Educ.').replace('Ciencias', 'Cien.')}
                </th>
              ))}
              <th className="border border-black p-1 text-center bg-slate-300">PROM<br/>GRAL</th>
              <th className="border border-black p-1 text-center bg-red-100 text-red-800 text-[6px]">MAT<br/>REP</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((al, idx) => {
              let matRepAlumno = 0;
              return (
                <tr key={al.id}>
                  <td className="border border-black p-0.5 text-center font-bold">{idx + 1}</td>
                  <td className="border border-black p-0.5 font-medium truncate uppercase whitespace-nowrap">{al.apellidoPaterno} {al.apellidoMaterno} {al.nombres}</td>
                  {materias.map(mat => {
                    const finalObj = getPromedioFinalObj(al, mat.id);
                    let val = null;
                    let isReg = false;
                    
                    if (finalObj !== null) {
                      val = finalObj.valor;
                      isReg = finalObj.isRegularizacion;
                      sumaPorMateria[mat.id] += val;
                      countPorMateria[mat.id]++;
                      if (val < 6.0) {
                        reprobadosPorMateria[mat.id]++;
                        matRepAlumno++;
                      }
                    }
                    
                    const isFailing = val !== null && val < 6.0;
                    return (
                      <td key={mat.id} className={`border border-black p-0.5 text-center font-bold ${isFailing ? 'text-red-600' : ''}`}>
                        {val !== null ? `${truncateTo1Dec(val)}${isReg ? '*' : ''}` : '-'}
                      </td>
                    );
                  })}
                  <td className="border border-black p-0.5 text-center font-black bg-slate-100">{getPromedioGeneralAlumno(al)}</td>
                  <td className={`border border-black p-0.5 text-center font-black ${matRepAlumno > 0 ? 'text-red-700 bg-red-50' : 'text-slate-300'}`}>
                    {matRepAlumno}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100">
              <td colSpan="2" className="border border-black p-0.5 text-right font-black uppercase text-[7px]">Promedio Grupal por Materia:</td>
              {materias.map(mat => {
                const promGral = countPorMateria[mat.id] > 0 ? truncateTo1Dec(sumaPorMateria[mat.id] / countPorMateria[mat.id]) : '-';
                return <td key={mat.id} className="border border-black p-0.5 text-center font-black text-blue-800">{promGral}</td>;
              })}
              <td className="border border-black p-0.5 bg-slate-200"></td>
              <td className="border border-black p-0.5 bg-slate-200"></td>
            </tr>
            <tr className="bg-red-50">
              <td colSpan="2" className="border border-black p-0.5 text-right font-black uppercase text-red-700 text-[7px]">Alumnos Reprobados:</td>
              {materias.map(mat => (
                <td key={mat.id} className="border border-black p-0.5 text-center font-black text-red-700">{reprobadosPorMateria[mat.id]}</td>
              ))}
              <td className="border border-black p-0.5 bg-slate-200"></td>
              <td className="border border-black p-0.5 bg-slate-200"></td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-12 flex justify-between px-16 text-xs font-bold uppercase">
          <div className="text-center w-48 border-t border-black pt-1">
            Profr. / Profra.<br/>Tutor de Grupo
          </div>
          <div className="text-center w-48 border-t border-black pt-1">
            Profr. Juan Carlos Taboada<br/>Director
          </div>
        </div>
      </div>
    </div>
  );
}
