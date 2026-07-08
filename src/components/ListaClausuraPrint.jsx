import React, { useMemo } from 'react';

export default function ListaClausuraPrint({ students, grupo, asesor }) {
  // Cálculo automático de la generación
  const generacion = useMemo(() => {
    const today = new Date();
    const month = today.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
    const year = today.getFullYear();
    // Si estamos entre enero y agosto, se gradúan este mismo año. Si es después (sep-dic), se gradúan el siguiente año.
    const gradYear = month <= 7 ? year : year + 1;
    const startYear = gradYear - 3;
    return `${startYear} - ${gradYear}`;
  }, []);

  // Sort students alphabetically
  const sortedStudents = [...students].sort((a, b) => {
    const nameA = `${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''} ${a.nombres || ''}`.trim().toUpperCase();
    const nameB = `${b.apellidoPaterno || ''} ${b.apellidoMaterno || ''} ${b.nombres || ''}`.trim().toUpperCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="w-full bg-white print:p-8 print:m-0" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
        <div className="w-20 h-20 flex-shrink-0">
          <img src="/logo-sep.png" alt="SEP" className="w-full h-full object-contain" />
        </div>
        
        <div className="flex-1 text-center px-1">
          <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">Escuela Secundaria Técnica No. 68</h1>
          <h2 className="text-base font-bold text-slate-700 tracking-widest text-indigo-900">CEREMONIA DE CLAUSURA</h2>
          
          <div className="flex justify-center items-center gap-2 mt-1">
            <div className="px-3 py-0.5 bg-slate-100 rounded-full border border-slate-300">
              <span className="text-xs font-bold text-slate-600 mr-1">GENERACIÓN:</span>
              <span className="text-sm font-black text-slate-900">{generacion}</span>
            </div>
            
            <div className="px-3 py-0.5 bg-slate-100 rounded-full border border-slate-300">
              <span className="text-sm font-black text-slate-900">3er GRADO "{grupo}"</span>
            </div>
          </div>
        </div>

        <div className="w-20 h-20 flex-shrink-0">
          <img src="/logo-escuela.png" alt="EST 68" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* LISTA DE ALUMNOS (Nombres Grandes) */}
      <div className="mt-2">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-slate-400 py-0.5 px-1 text-center text-xs text-slate-500">NOMBRE DEL ALUMNO</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((alumno, idx) => {
              const fullName = `${alumno.apellidoPaterno || ''} ${alumno.apellidoMaterno || ''} ${alumno.nombres || ''}`.trim().toUpperCase();
              return (
                <tr key={alumno.id || idx} className="border-b border-slate-200">
                  <td className="py-0.5 px-1 text-sm font-black text-slate-900 tracking-wide text-center">{fullName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PIE DE PÁGINA (Asesor) */}
      <div className="mt-4 pt-2 flex flex-col items-center justify-center break-inside-avoid">
        <div className="text-xs font-bold text-slate-500 mb-0.5">ASESOR DEL GRUPO</div>
        <div className="text-base font-black text-slate-800 uppercase px-8 py-0.5 border-b border-slate-800 text-center">
          {asesor || "_________________________________________"}
        </div>
      </div>
    </div>
  );
}
