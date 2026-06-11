import React from 'react';

export default function ListaAsistenciaPrint({ students, grado, grupo, mes, paperSize }) {
  if (!students || students.length === 0) return null;

  // Ordenar alfabéticamente por apellido paterno
  const sortedStudents = [...students].sort((a, b) => 
    a.apellidoPaterno.localeCompare(b.apellidoPaterno)
  );

  // Obtener el taller automático y el turno del primer alumno si existen
  const firstStudent = sortedStudents[0];
  const turno = firstStudent.turno || 'Matutino';
  const taller = firstStudent.taller || 'Climatización y refrigeración';

  // 25 columnas de días para pasar lista
  const columnsCount = 25;
  const headerCols = Array.from({ length: columnsCount }, (_, i) => i + 1);

  const sizeValue = paperSize === 'legal' ? 'legal landscape' : 'letter landscape';

  return (
    <div className="print-lista-asistencia-only">
      <style>{`
        @media print {
          @page { size: ${sizeValue}; margin: 1cm; }
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

      <div className="p-4 bg-white text-black text-[11px]">
        {/* Encabezado Oficial */}
        <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
          <div>
            <h1 className="font-extrabold text-sm uppercase">Escuela Secundaria Técnica N° 68</h1>
            <p className="font-bold text-[10px] uppercase text-slate-700">Clave: 12DST0068Z &bull; Iguala, Gro.</p>
          </div>
          <div className="text-right">
            <h2 className="font-black text-base uppercase tracking-wider">Lista de Asistencia Oficial</h2>
            <p className="font-bold text-[10px]">Ciclo Escolar: <span className="underline">2026 - 2027</span></p>
          </div>
        </div>

        {/* Metadatos del Grupo */}
        <div className="grid grid-cols-5 gap-2 border border-black p-3 bg-slate-50 font-bold mb-4">
          <div>Grado: <span className="font-normal">{grado}</span></div>
          <div>Grupo: <span className="font-normal">{grupo}</span></div>
          <div>Turno: <span className="font-normal">{turno}</span></div>
          <div>Mes: <span className="font-normal uppercase">{mes}</span></div>
          <div className="col-span-1 truncate" title={taller}>Taller: <span className="font-normal text-[10px]">{taller}</span></div>
        </div>

        {/* Tabla de Asistencia */}
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th className="border border-black px-2 py-1 text-center font-bold w-8 bg-slate-100">No.</th>
              <th className="border border-black px-3 py-1 text-left font-bold w-64 bg-slate-100">Nombre del Alumno</th>
              {headerCols.map(col => (
                <th key={col} className="border border-black w-6 h-6 text-center font-bold text-[8px] bg-slate-100">{col}</th>
              ))}
              <th className="border border-black px-1 py-1 text-center font-bold w-10 bg-slate-100">A</th>
              <th className="border border-black px-1 py-1 text-center font-bold w-10 bg-slate-100">F</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, index) => (
              <tr key={student.id} className="h-7">
                <td className="border border-black text-center font-bold">{index + 1}</td>
                <td className="border border-black px-3 font-semibold uppercase truncate text-[9px]">
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
        <div className="flex justify-around items-center mt-12 pt-6">
          <div className="text-center w-64 border-t border-black pt-2">
            <p className="font-bold">Profesor(a) de Grupo</p>
            <p className="text-[9px] text-slate-500">Firma / Fecha</p>
          </div>
          <div className="text-center w-64 border-t border-black pt-2">
            <p className="font-bold">Prefectura / Trabajo Social</p>
            <p className="text-[9px] text-slate-500">Firma / Sello</p>
          </div>
        </div>
      </div>
    </div>
  );
}
