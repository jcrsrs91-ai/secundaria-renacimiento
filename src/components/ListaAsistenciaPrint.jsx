import React from 'react';

export default function ListaAsistenciaPrint({ students, grado, grupo, mes, paperSize }) {
  if (!students || students.length === 0) return null;

  // Ordenar alfabéticamente por nombre completo (Paterno Materno Nombres)
  const sortedStudents = [...students].sort((a, b) => {
    const nameA = `${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''} ${a.nombres || ''}`.trim().toUpperCase();
    const nameB = `${b.apellidoPaterno || ''} ${b.apellidoMaterno || ''} ${b.nombres || ''}`.trim().toUpperCase();
    return nameA.localeCompare(nameB);
  });

  const firstStudent = sortedStudents[0];
  const turno = firstStudent.turno || 'Matutino';
  const taller = firstStudent.taller || 'Climatización y refrigeración';

  // Días hábiles (estimado 20 días por mes)
  const daysCols = Array.from({ length: 20 }, (_, i) => i + 1);
  // Trabajos / Tareas
  const taskCols = Array.from({ length: 6 }, (_, i) => i + 1);

  const sizeValue = paperSize === 'legal' ? 'legal' : 'letter';

  return (
    <div className="print-lista-asistencia-only">
      <style>{`
        @media print {
          @page { size: ${sizeValue} landscape; margin: 0.6cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .print-lista-asistencia-only { display: block !important; }
        }
        @media screen {
          .print-lista-asistencia-only { display: none !important; }
        }
        
        .eval-table th, .eval-table td {
          border: 1.5px solid #1e293b;
          padding: 2px;
        }
      `}</style>

      <div className="p-2 bg-white text-black w-full" style={{ fontSize: '9px' }}>
        {/* Encabezado Oficial SEP / NEM */}
        <div className="flex justify-between items-end border-b-[3px] border-black pb-2 mb-3">
          <div className="flex flex-col">
            <h1 className="font-extrabold text-sm uppercase tracking-wide">Esc. Sec. Técnica N° 68 "Renacimiento"</h1>
            <p className="font-bold text-[10px] uppercase text-slate-700">C.C.T: 12DST0077B &bull; Acapulco de Juárez, Gro.</p>
          </div>
          <div className="text-center">
            <h2 className="font-black text-sm uppercase tracking-widest bg-slate-200 px-4 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Lista de Asistencia y Evaluación</h2>
          </div>
          <div className="text-right">
            <p className="font-bold text-[10px]">Ciclo Escolar: <span className="underline decoration-slate-400">2025 - 2026</span></p>
            <p className="font-bold text-[10px] mt-0.5">Mes de Evaluación: <span className="underline decoration-slate-400 uppercase">{mes || '______________'}</span></p>
          </div>
        </div>

        {/* Metadatos del Grupo y Docente */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-3 font-semibold text-[10px] px-2">
          <div>Docente: <span className="font-normal border-b border-black inline-block w-64"></span></div>
          <div>Asignatura: <span className="font-normal border-b border-black inline-block w-48 text-center">{taller}</span></div>
          <div>Grado: <span className="font-bold text-[12px] underline">{grado}</span></div>
          <div>Grupo: <span className="font-bold text-[12px] underline">"{grupo}"</span></div>
          <div>Turno: <span className="font-normal">{turno}</span></div>
        </div>

        {/* Tabla Principal Integrada */}
        <table className="w-full border-collapse eval-table text-[9px]">
          <thead>
            {/* Fila Superior (Agrupaciones) */}
            <tr className="bg-slate-200">
              <th rowSpan={2} className="w-6 font-bold text-center">N°</th>
              <th rowSpan={2} className="w-[180px] font-bold text-left px-2 uppercase tracking-wide">Nombre del Alumno(a)</th>
              <th colSpan={daysCols.length + 1} className="font-bold text-center uppercase tracking-widest border-b border-slate-400 py-1">Asistencias</th>
              <th colSpan={taskCols.length} className="font-bold text-center uppercase tracking-widest border-b border-slate-400">Tareas / Trabajos</th>
              <th colSpan={3} className="font-bold text-center uppercase tracking-widest border-b border-slate-400">Evaluación</th>
              <th rowSpan={2} className="w-auto font-bold text-center uppercase tracking-widest">Observaciones</th>
            </tr>
            {/* Fila Inferior (Sub-columnas) */}
            <tr className="bg-slate-100">
              {daysCols.map(col => (
                <th key={`d-${col}`} className="w-[18px] text-center font-bold text-[8px] text-slate-600">{col}</th>
              ))}
              <th className="w-[24px] text-center font-extrabold text-[9px] bg-slate-200" title="Total de Faltas">T.F.</th>
              
              {taskCols.map(col => (
                <th key={`t-${col}`} className="w-[24px] text-center font-bold text-[8px] text-slate-600">T{col}</th>
              ))}
              
              <th className="w-[36px] text-center font-bold text-[8px]">Exam.</th>
              <th className="w-[36px] text-center font-bold text-[8px]" title="Participación">Partic.</th>
              <th className="w-[40px] text-center font-extrabold text-[9px] bg-slate-200" title="Promedio Mensual">Prom.</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, index) => (
              <tr key={student.id} className="h-[21px] even:bg-slate-50/40">
                <td className="text-center font-bold text-slate-700">{index + 1}</td>
                <td className="px-2 font-semibold uppercase truncate text-[8.5px] leading-tight" title={`${student.apellidoPaterno} ${student.apellidoMaterno} ${student.nombres}`}>
                  {student.apellidoPaterno} {student.apellidoMaterno} {student.nombres}
                </td>
                
                {/* Columnas de Asistencia vacías para rellenar */}
                {daysCols.map(col => (
                  <td key={`cell-d-${student.id}-${col}`}></td>
                ))}
                {/* Total de faltas */}
                <td className="bg-slate-100/50"></td>
                
                {/* Tareas */}
                {taskCols.map(col => (
                  <td key={`cell-t-${student.id}-${col}`}></td>
                ))}
                
                {/* Evaluación */}
                <td></td>
                <td></td>
                <td className="bg-slate-100/50"></td>
                
                {/* Observaciones */}
                <td></td>
              </tr>
            ))}
            
            {/* Fila de Promedio General del Grupo al final (Opcional, muy útil) */}
            {sortedStudents.length > 0 && (
              <tr className="h-[21px] bg-slate-100 font-bold">
                <td colSpan={2} className="text-right px-2 uppercase text-[9px]">Promedio del Grupo</td>
                <td colSpan={daysCols.length + 1}></td>
                <td colSpan={taskCols.length}></td>
                <td colSpan={2}></td>
                <td className="bg-slate-200"></td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Simbología */}
        <div className="mt-2 flex justify-between text-[8px] text-slate-600 font-medium px-2 border-t border-slate-300 pt-1">
          <p><strong className="text-black">Simbología Asistencia:</strong> ( . ) Asistencia &nbsp;|&nbsp; ( F ) Falta &nbsp;|&nbsp; ( R ) Retardo &nbsp;|&nbsp; ( J ) Justificante</p>
          <p><strong className="text-black">Simbología Evaluación:</strong> T.F. = Total Faltas &nbsp;|&nbsp; Exam. = Examen o Proyecto &nbsp;|&nbsp; Partic. = Participación</p>
        </div>

        {/* Firmas de Autorización - Estilo SEP */}
        <div className="flex justify-around items-end mt-12 pt-2 px-10">
          <div className="text-center w-56 border-t border-black pt-1">
            <p className="font-bold text-[10px] uppercase">Firma del Docente</p>
          </div>
          <div className="text-center w-56 border-t border-black pt-1">
            <p className="font-bold text-[10px] uppercase">Vo. Bo. Coordinador Académico</p>
          </div>
          <div className="text-center w-56 border-t border-black pt-1">
            <p className="font-bold text-[10px] uppercase">Prof. Juan Carlos Taboada Barajas</p>
            <p className="text-[9px] text-slate-600 font-semibold uppercase">Director del Plantel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
