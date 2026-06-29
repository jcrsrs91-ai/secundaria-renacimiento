import React from 'react';

export default function ListaAsistenciaPrint({ students, grado, grupo, mes, paperSize }) {
  if (!students || students.length === 0) return null;

  // Ordenar alfabéticamente por nombre completo (Paterno Materno Nombres)
  const sortedStudents = [...students].sort((a, b) => {
    const nameA = `${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''} ${a.nombres || ''}`.trim().toUpperCase();
    const nameB = `${b.apellidoPaterno || ''} ${b.apellidoMaterno || ''} ${b.nombres || ''}`.trim().toUpperCase();
    return nameA.localeCompare(nameB);
  });

  // Obtener el taller automático y el turno del primer alumno si existen
  const firstStudent = sortedStudents[0];
  const turno = firstStudent.turno || 'Matutino';
  const taller = firstStudent.taller || 'Climatización y refrigeración';

  // 25 columnas de días para pasar lista
  const columnsCount = 25;
  const headerCols = Array.from({ length: columnsCount }, (_, i) => i + 1);

  const sizeValue = paperSize === 'legal' ? 'legal' : 'letter';

  return (
    <div className="print-lista-asistencia-only">
      <style>{`
        @media print {
          @page { size: ${sizeValue}; margin: 0.8cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; font-family: sans-serif; }
          .print-lista-asistencia-only { display: block !important; }
        }
        @media screen {
          .print-lista-asistencia-only { display: none !important; }
        }
      `}</style>

      <div className="p-2 bg-white text-black text-[10px]">
        {/* Encabezado Oficial */}
        <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
          <div>
            <h1 className="font-extrabold text-xs uppercase">Escuela Secundaria Técnica N° 68</h1>
            <p className="font-bold text-[9px] uppercase text-slate-700">Clave: 12DST0068Z &bull; Iguala, Gro.</p>
          </div>
          <div className="text-right">
            <h2 className="font-black text-xs uppercase tracking-wider">Lista de Asistencia Oficial</h2>
            <p className="font-bold text-[9px]">Ciclo Escolar: <span className="underline">2026 - 2027</span></p>
          </div>
        </div>

        {/* Metadatos del Grupo */}
        <div className="grid grid-cols-3 gap-2 border border-black p-2 bg-slate-50 font-bold mb-3 text-[9px]">
          <div>Grado: <span className="font-normal">{grado}</span></div>
          <div>Grupo: <span className="font-normal">{grupo}</span></div>
          <div>Turno: <span className="font-normal">{turno}</span></div>
          <div>Mes: <span className="font-normal uppercase">{mes}</span></div>
          <div className="col-span-2 truncate" title={taller}>Taller: <span className="font-normal text-[8.5px]">{taller}</span></div>
        </div>

        {/* Tabla de Asistencia */}
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th className="border border-black px-1 py-0.5 text-center font-bold w-6 bg-slate-100 text-[8px]">No.</th>
              <th className="border border-black px-2 py-0.5 text-left font-bold w-44 bg-slate-100 text-[8px]">Nombre del Alumno</th>
              {headerCols.map(col => (
                <th key={col} className="border border-black w-4 h-5 text-center font-bold text-[7px] bg-slate-100">{col}</th>
              ))}
              <th className="border border-black px-0.5 py-0.5 text-center font-bold w-6 bg-slate-100 text-[8px]">A</th>
              <th className="border border-black px-0.5 py-0.5 text-center font-bold w-6 bg-slate-100 text-[8px]">F</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, index) => (
              <tr key={student.id} className="h-[21px]">
                <td className="border border-black text-center font-bold text-[8px]">{index + 1}</td>
                <td className="border border-black px-2 font-semibold uppercase truncate text-[8px]" title={`${student.apellidoPaterno} ${student.apellidoMaterno} ${student.nombres}`}>
                  {student.apellidoPaterno} {student.apellidoMaterno} {student.nombres}
                </td>
                {headerCols.map(col => (
                  <td key={col} className="border border-black text-center"></td>
                ))}
                <td className="border border-black text-center bg-slate-50/50"></td>
                <td className="border border-black text-center bg-slate-50/50"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Firmas de Autorización */}
        <div className="flex justify-around items-center mt-8 pt-4">
          <div className="text-center w-48 border-t border-black pt-1">
            <p className="font-bold text-[9px]">Profesor(a) de Grupo</p>
            <p className="text-[8px] text-slate-500">Firma / Fecha</p>
          </div>
          <div className="text-center w-48 border-t border-black pt-1">
            <p className="font-bold text-[9px]">Prefectura / Trabajo Social</p>
            <p className="text-[8px] text-slate-500">Firma / Sello</p>
          </div>
        </div>
      </div>
    </div>
  );
}
