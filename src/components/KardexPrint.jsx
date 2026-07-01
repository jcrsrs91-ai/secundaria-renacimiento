import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import { getCalificacionFinal } from '../utils/format';

export default function KardexPrint({ student, materiasPorGrado, onClose }) {
  if (!student) return null;

  // The student name should already be accented by the global fetcher
  const nombreCompleto = `${student.nombres} ${student.apellidoPaterno} ${student.apellidoMaterno}`.toUpperCase();
  
  // Calculate final grade for a given materia in a given historical year (or current year if applicable)
  const getHistorialMateria = (gradoKey, materiaId) => {
    // If it's the student's CURRENT grade, we calculate from current calificaciones or regularizacion
    if (student.grado === gradoKey) {
      return getCalificacionFinal(student, materiaId);
    }
    // If it's a PAST grade, we look in student.historial
    if (student.historial && student.historial[gradoKey] && student.historial[gradoKey][materiaId]) {
      const hist = student.historial[gradoKey][materiaId];
      // hist should have { t1, t2, t3 }
      const t1 = parseFloat(hist.t1);
      const t2 = parseFloat(hist.t2);
      const t3 = parseFloat(hist.t3);
      
      // Also check if passed via regularizacion in the past
      if (student.regularizacion && student.regularizacion[materiaId]) {
        return {
          valor: parseFloat(student.regularizacion[materiaId].calificacion),
          isRegularizacion: true,
          fecha: student.regularizacion[materiaId].fecha,
          t1, t2, t3
        };
      }

      let sum = 0, c = 0;
      if (!isNaN(t1)) { sum += t1; c++; }
      if (!isNaN(t2)) { sum += t2; c++; }
      if (!isNaN(t3)) { sum += t3; c++; }
      if (c > 0) {
        const finalMat = Math.floor((sum / c + 0.00001) * 10) / 10;
        return {
          valor: finalMat,
          isRegularizacion: false,
          fecha: null,
          isReprobada: finalMat < 6,
          t1, t2, t3
        };
      }
    }
    return null;
  };

  const currentGrades = (gradoKey) => {
    const materias = materiasPorGrado[gradoKey] || [];
    let sum = 0;
    let count = 0;
    const items = materias.map(mat => {
      const hist = getHistorialMateria(gradoKey, mat.id);
      if (hist && !hist.isReprobada) {
        sum += hist.valor;
        count++;
      }
      return { materia: mat, hist };
    });
    const avg = count > 0 ? (Math.floor((sum / count + 0.00001) * 10) / 10).toFixed(1) : '-';
    return { items, avg, count, total: materias.length };
  };

  const g1 = currentGrades('1er Grado');
  const g2 = currentGrades('2do Grado');
  const g3 = currentGrades('3er Grado');

  let missingGrades = false;
  if (g1.count < g1.total || g2.count < g2.total || g3.count < g3.total) {
    missingGrades = true;
  }

  let finalAverage = '-';
  if (!missingGrades && g1.avg !== '-' && g2.avg !== '-' && g3.avg !== '-') {
    const totalSum = parseFloat(g1.avg) + parseFloat(g2.avg) + parseFloat(g3.avg);
    finalAverage = (Math.floor((totalSum / 3 + 0.00001) * 10) / 10).toFixed(1);
  }

  // Current Date for signature
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  return createPortal(
    <div id="print-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/90 flex justify-center overflow-y-auto">
      <style>
        {`
          @media print {
            @page { size: letter portrait; margin: 15mm; }
            #root { display: none !important; }
            #print-modal-overlay {
              position: static !important;
              background: white !important;
              display: block !important;
              overflow: visible !important;
            }
            .no-print { display: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>

      <div className="absolute top-4 right-8 flex gap-4 no-print z-50">
        <button 
          onClick={() => {
            setTimeout(() => window.print(), 500);
          }} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow-lg transition-colors"
        >
          <Printer className="w-5 h-5 mr-2" />
          Imprimir Kárdex
        </button>
        <button 
          onClick={onClose} 
          className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow-lg transition-colors"
        >
          <X className="w-5 h-5 mr-2" />
          Cerrar
        </button>
      </div>

      <div className="bg-white w-[215.9mm] min-h-[279.4mm] shadow-2xl relative mt-10 mb-10 mx-auto p-[15mm] text-sm text-slate-800 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div className="w-1/4">
            <img src="/logo-sep.png" alt="SEP" className="w-32 object-contain" />
          </div>
          <div className="w-1/2 text-center">
            <h1 className="font-bold text-lg uppercase leading-tight">Secretaría de Educación Pública</h1>
            <h2 className="font-bold text-md mt-1">Escuela Secundaria General "Renacimiento"</h2>
            <p className="text-xs mt-1">C.C.T. 21DES0043U</p>
            <p className="text-xs">Zona Escolar: 011</p>
          </div>
          <div className="w-1/4 flex justify-end">
            <img src="/logo-escuela.png" alt="Escuela" className="w-20 object-contain" />
          </div>
        </div>

        <h3 className="text-center font-bold text-xl mb-6 uppercase tracking-wider">Kárdex de Calificaciones</h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p><span className="font-bold">Alumno:</span> {nombreCompleto}</p>
            <p><span className="font-bold">CURP:</span> {student.curp}</p>
          </div>
          <div className="text-right">
            <p><span className="font-bold">Matrícula:</span> {student.matricula}</p>
            <p><span className="font-bold">Generación:</span> 2023-2026</p>
          </div>
        </div>

        {missingGrades && (
          <div className="bg-amber-100 border border-amber-400 text-amber-800 px-4 py-2 rounded mb-6 text-xs text-center font-bold no-print">
            Advertencia: El alumno tiene calificaciones faltantes o reprobadas. El promedio general no puede ser calculado oficialmente.
          </div>
        )}

        <div className="space-y-6">
          {[ 
            { title: 'Primer Grado', data: g1 }, 
            { title: 'Segundo Grado', data: g2 }, 
            { title: 'Tercer Grado', data: g3 } 
          ].map((grado, idx) => (
            <div key={idx}>
              <h4 className="font-bold text-md bg-slate-200 px-2 py-1 uppercase">{grado.title}</h4>
              <table className="w-full text-xs mt-2 border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-400 px-2 py-1 text-left w-1/2">Asignatura</th>
                    <th className="border border-slate-400 px-2 py-1 text-center">T1</th>
                    <th className="border border-slate-400 px-2 py-1 text-center">T2</th>
                    <th className="border border-slate-400 px-2 py-1 text-center">T3</th>
                    <th className="border border-slate-400 px-2 py-1 text-center font-bold">Final</th>
                    <th className="border border-slate-400 px-2 py-1 text-center w-1/5">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {grado.data.items.map((item, i) => (
                    <tr key={i}>
                      <td className="border border-slate-400 px-2 py-1">{item.materia.name}</td>
                      <td className="border border-slate-400 px-2 py-1 text-center">{item.hist ? item.hist.t1 : '-'}</td>
                      <td className="border border-slate-400 px-2 py-1 text-center">{item.hist ? item.hist.t2 : '-'}</td>
                      <td className="border border-slate-400 px-2 py-1 text-center">{item.hist ? item.hist.t3 : '-'}</td>
                      <td className="border border-slate-400 px-2 py-1 text-center font-bold">
                        {item.hist ? item.hist.valor : '-'}
                      </td>
                      <td className="border border-slate-400 px-2 py-1 text-center text-[10px]">
                        {item.hist?.isRegularizacion ? <span className="font-bold text-emerald-700">EXT. ({item.hist.fecha})</span> : ''}
                        {item.hist?.isReprobada ? <span className="font-bold text-red-600">ADEUDA</span> : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right mt-1">
                <span className="font-bold">Promedio Anual: </span>
                <span className="font-bold text-lg">{grado.data.avg}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t-2 border-slate-800 pt-4 flex justify-between items-center">
          <div className="font-bold text-lg uppercase">
            Promedio General Nivel Secundaria:
          </div>
          <div className="font-black text-2xl px-6 py-2 border-2 border-slate-800 rounded bg-slate-50">
            {finalAverage}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p>A petición del interesado y para los fines legales que a él convengan, se expide la presente en la localidad de Huitzilan de Serdán, Puebla, a los {dateStr}.</p>
        </div>

        <div className="mt-20 flex justify-center">
          <div className="text-center w-1/2">
            <div className="border-b border-black mb-2 mx-10"></div>
            <p className="font-bold text-sm">Prof. Juan Carlos Taboada Barajas</p>
            <p className="text-xs">Director de la Institución</p>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
