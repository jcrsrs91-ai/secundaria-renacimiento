import React from 'react';

export default function CuadroParcialPrint({ alumnos = [], materias = [], grado = '', grupo = '' }) {
  if (!alumnos || alumnos.length === 0) return null;

  const getPromedioFinal = (student, materiaId) => {
    const t1 = parseFloat(student.calificaciones?.['t1']?.[materiaId]);
    const t2 = parseFloat(student.calificaciones?.['t2']?.[materiaId]);
    const t3 = parseFloat(student.calificaciones?.['t3']?.[materiaId]);
    let sum = 0, c = 0;
    if (!isNaN(t1)) { sum += t1; c++; }
    if (!isNaN(t2)) { sum += t2; c++; }
    if (!isNaN(t3)) { sum += t3; c++; }
    return c > 0 ? (sum / c) : null;
  };

  const getPromedioGeneralAlumno = (student) => {
    let sum = 0, count = 0;
    materias.forEach(mat => {
      const final = getPromedioFinal(student, mat.id);
      if (final !== null) { sum += final; count++; }
    });
    return count > 0 ? (sum / count).toFixed(1) : '-';
  };

  return (
    <div className="print-concentrado-parcial-only">
      <style>{`
        @media print {
          @page { size: legal landscape; margin: 0.5cm; }
          html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .print-concentrado-parcial-only { display: block !important; margin: 0; padding: 0; font-family: sans-serif; }
          .landscape-page { page-break-after: always; break-after: page; width: 100%; box-sizing: border-box; }
          .landscape-page:last-child { page-break-after: auto; break-after: auto; }
          table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
        @media screen {
          .print-concentrado-parcial-only { display: none !important; }
        }
      `}</style>

      <div className="landscape-page">
        <div className="flex justify-between items-center mb-2">
          <img src="/logo-sep.png" alt="SEP" className="h-10 object-contain" />
          <div className="text-center">
            <h1 className="font-black text-lg tracking-wider uppercase">Cuadro de Concentración (Calificaciones Parciales)</h1>
            <h2 className="font-bold text-xs text-slate-700 uppercase">Escuela Secundaria Técnica N° 68 "Renacimiento"</h2>
            <p className="text-[10px] font-bold text-slate-600 mt-1 uppercase">Grado: {grado} | Grupo: "{grupo}" | Ciclo Escolar 2025-2026</p>
          </div>
          <img src="/logo-escuela.png" alt="Escuela" className="h-12 object-contain" />
        </div>

        <table className="w-full text-[8px] border border-black mb-4">
          <thead>
            <tr className="bg-slate-200">
              <th rowSpan="2" className="border border-black p-0.5 text-center w-4">N.</th>
              <th rowSpan="2" className="border border-black p-1 text-left w-40">Nombre del Alumno</th>
              {materias.map(mat => (
                <th key={mat.id} colSpan="4" className="border border-black p-0.5 text-center truncate overflow-hidden max-w-[60px]" title={mat.name}>
                  {mat.name.replace('Formación Cívica y Ética', 'F.C.E.').replace('Educación', 'Educ.').replace('Ciencias', 'Cien.')}
                </th>
              ))}
              <th rowSpan="2" className="border border-black p-1 text-center bg-slate-300 w-8">PROM<br/>GRAL</th>
            </tr>
            <tr className="bg-slate-100">
              {materias.map(mat => (
                <React.Fragment key={`sub-${mat.id}`}>
                  <th className="border border-black p-0.5 text-center w-5">T1</th>
                  <th className="border border-black p-0.5 text-center w-5">T2</th>
                  <th className="border border-black p-0.5 text-center w-5">T3</th>
                  <th className="border border-black p-0.5 text-center bg-slate-200 font-bold w-6">PF</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {alumnos.map((al, idx) => {
              return (
                <tr key={al.id}>
                  <td className="border border-black p-0.5 text-center font-bold">{idx + 1}</td>
                  <td className="border border-black p-0.5 font-medium truncate uppercase whitespace-nowrap">{al.apellidoPaterno} {al.apellidoMaterno} {al.nombres}</td>
                  {materias.map(mat => {
                    const t1 = al.calificaciones?.['t1']?.[mat.id] || '-';
                    const t2 = al.calificaciones?.['t2']?.[mat.id] || '-';
                    const t3 = al.calificaciones?.['t3']?.[mat.id] || '-';
                    const val = getPromedioFinal(al, mat.id);
                    const isFailing = val !== null && val < 6.0;
                    
                    return (
                      <React.Fragment key={`td-${mat.id}`}>
                        <td className="border border-black p-0.5 text-center">{t1}</td>
                        <td className="border border-black p-0.5 text-center">{t2}</td>
                        <td className="border border-black p-0.5 text-center">{t3}</td>
                        <td className={`border border-black p-0.5 text-center font-bold bg-slate-50 ${isFailing ? 'text-red-600' : ''}`}>
                          {val !== null ? val.toFixed(1) : '-'}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="border border-black p-0.5 text-center font-black bg-slate-200">{getPromedioGeneralAlumno(al)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-8 flex justify-between px-16 text-[10px] font-bold uppercase">
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
