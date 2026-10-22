import React from 'react';
import { sortStudents } from '../utils/sortUtils';
import { useGlobalConfig } from '../hooks/useGlobalConfig';

const getStudentGender = (s) => {
  const genRaw = (s.genero || s.sexo || '').trim().toUpperCase();
  if (genRaw.startsWith('M') && genRaw !== 'MASCULINO') return 'M';
  if (genRaw.startsWith('F')) return 'M';
  if (genRaw.startsWith('H') || genRaw === 'MASCULINO') return 'H';
  const curpChar = (s.curp || '').trim().toUpperCase().charAt(10);
  if (curpChar === 'M') return 'M';
  return 'H';
};

export const sortAttendanceListStudents = (studentsList = []) => {
  const iniciales = [];
  const altas = [];

  studentsList.forEach(s => {
    if (s.tipoIngreso === 'Alta') {
      altas.push(s);
    } else {
      iniciales.push(s);
    }
  });

  iniciales.sort(sortStudents);
  altas.sort((a, b) => {
    const dateA = a.fechaAlta || a.fechaIngreso || '';
    const dateB = b.fechaAlta || b.fechaIngreso || '';
    if (dateA && dateB && dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    return sortStudents(a, b);
  });

  return [...iniciales, ...altas];
};

export default function ListaAsistenciaPrint({ students, grado, grupo, paperSize }) {
  const { config } = useGlobalConfig();
  if (!students || students.length === 0) return null;

  // Ordenar: 1) Matrícula inicial (incluyendo Bajas oficiales) de A-Z, 2) Altas posteriores al 30 de sept al final
  let sortedStudents = sortAttendanceListStudents(students);

  // Calcular Existencia real (solo alumnos Activos vigentes: Hombres, Mujeres y Total)
  let existenciaH = 0;
  let existenciaM = 0;
  sortedStudents.forEach(s => {
    if (!s.isEmpty && (s.status || 'Activo') === 'Activo') {
      const gen = getStudentGender(s);
      if (gen === 'M') existenciaM++;
      else existenciaH++;
    }
  });
  const existenciaT = existenciaH + existenciaM;

  // Asegurar siempre al menos 30 filas
  const targetRows = 30;
  if (sortedStudents.length < targetRows) {
    const padCount = targetRows - sortedStudents.length;
    for (let i = 0; i < padCount; i++) {
      sortedStudents.push({
        id: `empty_${i}`,
        isEmpty: true,
        apellidoPaterno: '',
        apellidoMaterno: '',
        nombres: ''
      });
    }
  }

  const firstStudent = sortedStudents.find(s => !s.isEmpty) || sortedStudents[0];
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
          @page { size: ${sizeValue} landscape; margin: 0.35cm; }
          html, body, #root { height: 100vh !important; overflow: hidden !important; margin: 0; padding: 0; background: white; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .print-lista-asistencia-only { display: block !important; transform: scale(0.95); transform-origin: top center; width: 100%; }
        }
        @media screen {
          .print-lista-asistencia-only { display: none !important; }
        }
        
        .eval-table th, .eval-table td {
          border: 1.5px solid #1e293b;
          padding: 1.5px 2px;
        }
        .stats-summary-table th, .stats-summary-table td {
          border: 1.5px solid #1e293b;
          padding: 2px 6px;
        }
      `}</style>

      <div className="p-1 bg-white text-black w-full" style={{ fontSize: '9px' }}>
        {/* Encabezado Oficial SEP / NEM */}
        <div className="flex justify-between items-end border-b-[2.5px] border-black pb-1 mb-1.5">
          <div className="flex flex-col">
            <h1 className="font-extrabold text-sm uppercase tracking-wide">Esc. Sec. Técnica N° 68 "Renacimiento"</h1>
            <p className="font-bold text-[10px] uppercase text-slate-700">C.C.T: 12DST0077B &bull; Acapulco de Juárez, Gro.</p>
          </div>
          <div className="text-center">
            <h2 className="font-black text-sm uppercase tracking-widest bg-slate-200 px-4 py-0.5 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Lista de Asistencia y Evaluación</h2>
          </div>
          <div className="text-right">
            <p className="font-bold text-[10px]">Ciclo Escolar: <span className="underline decoration-slate-400">{config?.cicloEscolarActual || '2025 - 2026'}</span></p>
            <p className="font-bold text-[10px] mt-0.5">Trimestre a Evaluar: <span className="inline-block border-b border-black w-28 text-center"></span></p>
          </div>
        </div>

        {/* Metadatos del Grupo y Docente */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1.5 font-semibold text-[10px] px-1">
          <div>Docente: <span className="font-normal border-b border-black inline-block w-44"></span></div>
          <div>Asignatura: <span className="font-normal border-b border-black inline-block w-36"></span></div>
          <div>Taller / Tecnología: <span className="font-normal border-b border-black inline-block px-1.5 text-center">{taller}</span></div>
          <div>Grado: <span className="font-bold text-[11px] underline">{grado}</span></div>
          <div>Grupo: <span className="font-bold text-[11px] underline">"{grupo}"</span></div>
          <div>Turno: <span className="font-normal">{turno}</span></div>
        </div>

        {/* Tabla Principal Integrada */}
        <table className="w-full border-collapse eval-table text-[9px]">
          <thead>
            {/* Fila Superior (Agrupaciones) */}
            <tr className="bg-slate-200">
              <th rowSpan={2} className="w-6 font-bold text-center">N°</th>
              <th rowSpan={2} className="w-[195px] font-bold text-left px-2 uppercase tracking-wide">Nombre del Alumno(a)</th>
              <th colSpan={daysCols.length + 1} className="font-bold text-center uppercase tracking-widest border-b border-slate-400 py-0.5">Asistencias</th>
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
              
              <th className="w-[34px] text-center font-bold text-[8px]">Exam.</th>
              <th className="w-[34px] text-center font-bold text-[8px]" title="Participación">Partic.</th>
              <th className="w-[38px] text-center font-extrabold text-[9px] bg-slate-200" title="Promedio Trimestral">Prom.</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, index) => {
              const isBaja = !student.isEmpty && (student.status || '').toLowerCase() === 'baja';
              const isAlta = !student.isEmpty && !isBaja && student.tipoIngreso === 'Alta';
              const fullName = student.isEmpty ? '' : `${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''} ${student.nombres || ''}`.trim();

              return (
                <tr key={student.id} className={`h-[15.5px] ${isBaja ? 'bg-slate-200/70 text-slate-500' : 'even:bg-slate-50/40'}`}>
                  <td className="text-center font-bold text-slate-700">{index + 1}</td>
                  <td className="px-1.5 font-semibold uppercase truncate text-[8.2px] leading-tight" title={fullName}>
                    {!student.isEmpty && (
                      <div className="flex items-center justify-between gap-1">
                        <span className={`truncate ${isBaja ? 'line-through text-slate-500' : ''}`}>
                          {fullName}
                        </span>
                        {isAlta && (
                          <span className="shrink-0 px-1 py-0 text-[6.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-600 rounded leading-tight">
                            ALTA
                          </span>
                        )}
                        {isBaja && (
                          <span className="shrink-0 px-1 py-0 text-[6.5px] font-black bg-red-100 text-red-900 border border-red-600 rounded leading-tight">
                            BAJA
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  
                  {isBaja ? (
                    <>
                      <td colSpan={daysCols.length + 1 + taskCols.length + 3} className="text-center font-bold text-[7.5px] tracking-[0.25em] text-slate-500 bg-slate-100/80 uppercase">
                        — B A J A {student.fechaBaja ? `(${student.fechaBaja})` : ''} —
                      </td>
                      <td className="text-center font-bold text-[7.5px] text-red-800 uppercase px-1 truncate">
                        BAJA {student.fechaBaja ? student.fechaBaja : ''}
                      </td>
                    </>
                  ) : (
                    <>
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
                      <td className="text-center font-bold text-[7.5px] text-emerald-900 uppercase px-1 truncate">
                        {isAlta ? `ALTA${student.fechaAlta ? ' ' + student.fechaAlta : ''}` : ''}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Simbología */}
        <div className="mt-1 flex justify-between text-[7.5px] text-slate-600 font-medium px-1">
          <p><strong className="text-black">Simbología Asistencia:</strong> ( . ) Asistencia &nbsp;|&nbsp; ( F ) Falta &nbsp;|&nbsp; ( R ) Retardo &nbsp;|&nbsp; ( J ) Justificante &nbsp;|&nbsp; <strong className="text-black">[ALTA]</strong> Ingreso posterior al 30/Sept &nbsp;|&nbsp; <strong className="text-black">[BAJA]</strong> Baja durante el ciclo</p>
          <p><strong className="text-black">Simbología Evaluación:</strong> T.F. = Total Faltas &nbsp;|&nbsp; Exam. = Examen o Proyecto &nbsp;|&nbsp; Partic. = Participación</p>
        </div>

        {/* Cuadro Estadístico del Grupo (Justo antes de las firmas) */}
        <div className="mt-1.5 px-1">
          <table className="w-full border-collapse stats-summary-table text-[8.5px] text-center">
            <thead>
              <tr className="bg-slate-200 font-extrabold uppercase tracking-wider text-[8px]">
                <th colSpan={3} className="w-[22%]">Existencia (Activos)</th>
                <th colSpan={3} className="w-[24%]">Alumnos Regulares</th>
                <th colSpan={3} className="w-[24%]">Alumnos Irregulares</th>
                <th rowSpan={2} className="w-[15%]">Promedio de<br/>Aprovechamiento</th>
                <th rowSpan={2} className="w-[15%]">% de<br/>Aprobación</th>
              </tr>
              <tr className="bg-slate-100 font-bold text-[7.5px]">
                <th>Hombres</th>
                <th>Mujeres</th>
                <th className="bg-slate-200">Total</th>
                <th>Hombres</th>
                <th>Mujeres</th>
                <th className="bg-slate-200">Total</th>
                <th>Hombres</th>
                <th>Mujeres</th>
                <th className="bg-slate-200">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-[18px] font-bold text-[9.5px]">
                {/* Existencia llenada automáticamente */}
                <td>{existenciaH}</td>
                <td>{existenciaM}</td>
                <td className="bg-slate-100 font-black">{existenciaT}</td>
                {/* Regulares en blanco */}
                <td></td>
                <td></td>
                <td className="bg-slate-50"></td>
                {/* Irregulares en blanco */}
                <td></td>
                <td></td>
                <td className="bg-slate-50"></td>
                {/* Promedio y % de Aprobación en blanco */}
                <td></td>
                <td className="text-right pr-2 font-normal text-slate-400">%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Firmas de Autorización - Estilo SEP */}
        <div className="flex justify-around items-end mt-5 pt-1 px-10">
          <div className="text-center w-56 border-t border-black pt-1">
            <p className="font-bold text-[10px] uppercase">Firma del Docente</p>
          </div>
          <div className="text-center w-56 border-t border-black pt-1">
            {turno === 'Matutino' ? (
              <>
                <p className="font-bold text-[10px] uppercase">Profra. Lucila Rodriguez Martinez</p>
                <p className="text-[9px] text-slate-600 font-semibold uppercase">Vo. Bo. Coordinación Académica</p>
              </>
            ) : (
              <p className="font-bold text-[10px] uppercase">Vo. Bo. Coordinador Académico</p>
            )}
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
