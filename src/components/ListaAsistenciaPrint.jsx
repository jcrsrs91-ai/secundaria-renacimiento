import React from 'react';
import { sortStudents } from '../utils/sortUtils';
import { useGlobalConfig } from '../hooks/useGlobalConfig';
import { autoAcentuar } from '../utils/format';

const TALLER_POR_GRUPO = {
  A: 'Climatización y refrigeración',
  B: 'Administración contable',
  C: 'Diseño y circuitos eléctricos',
  D: 'Administración contable',
  E: 'Diseño y mecánica automotriz',
  F: 'Ofimática',
  G: 'Climatización y refrigeración',
  H: 'Administración contable',
  I: 'Diseño y circuitos eléctricos',
  J: 'Administración contable',
  K: 'Diseño y mecánica automotriz',
  L: 'Ofimática'
};

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

  const cleanGrupo = (grupo || 'A').trim().toUpperCase();
  const firstStudent = sortedStudents.find(s => !s.isEmpty) || sortedStudents[0];
  const turno = ['G', 'H', 'I', 'J', 'K', 'L'].includes(cleanGrupo) ? 'Vespertino' : (firstStudent.turno || 'Matutino');
  const taller = TALLER_POR_GRUPO[cleanGrupo] || firstStudent.taller || 'Climatización y refrigeración';

  // Días hábiles (20 columnas)
  const daysCols = Array.from({ length: 20 }, (_, i) => i + 1);
  // Trabajos / Tareas (6 columnas)
  const taskCols = Array.from({ length: 6 }, (_, i) => i + 1);

  const sizeValue = paperSize === 'legal' ? 'legal' : 'letter';

  return (
    <div className="print-lista-asistencia-only">
      <style>{`
        @media print {
          @page { size: ${sizeValue} landscape; margin: 0.35cm 0.4cm; }
          html, body, #root { height: auto !important; min-height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          aside, header, nav, .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .print-lista-asistencia-only {
            display: block !important;
            width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
        @media screen {
          .print-lista-asistencia-only { display: none !important; }
        }
        
        .eval-table th, .eval-table td {
          border: 1.2px solid #1e293b;
          padding: 1px 2px;
        }
        .stats-summary-table th, .stats-summary-table td {
          border: 1.2px solid #1e293b;
          padding: 1.5px 5px;
        }
      `}</style>

      <div className="bg-white text-black w-full" style={{ fontSize: '8.5px' }}>
        {/* Encabezado Oficial SEP / NEM */}
        <div className="flex justify-between items-end border-b-[2px] border-black pb-1 mb-1">
          <div className="flex flex-col">
            <h1 className="font-extrabold text-[12px] uppercase tracking-wide leading-tight">Esc. Sec. Técnica N° 68 "Renacimiento"</h1>
            <p className="font-bold text-[9.5px] uppercase text-slate-700 leading-tight">C.C.T: 12DST0077B &bull; Acapulco de Juárez, Gro.</p>
          </div>
          <div className="text-center">
            <h2 className="font-black text-[12px] uppercase tracking-widest bg-slate-200 px-3 py-0.5 border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">Lista de Asistencia y Evaluación</h2>
          </div>
          <div className="text-right leading-tight">
            <p className="font-bold text-[9.5px]">Ciclo Escolar: <span className="underline decoration-slate-400">{config?.cicloEscolarActual || '2025 - 2026'}</span></p>
            <p className="font-bold text-[9.5px] mt-0.5">Trimestre a Evaluar: <span className="inline-block border-b border-black w-24 text-center"></span></p>
          </div>
        </div>

        {/* Metadatos del Grupo y Docente */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mb-1 font-semibold text-[9.5px] px-0.5">
          <div>Docente: <span className="font-normal border-b border-black inline-block w-44"></span></div>
          <div>Asignatura: <span className="font-normal border-b border-black inline-block w-36"></span></div>
          <div>Taller / Tecnología: <span className="font-bold border-b border-black inline-block px-1.5 text-center uppercase text-[9px]">{taller}</span></div>
          <div>Grado: <span className="font-bold text-[10.5px] underline">{grado}</span></div>
          <div>Grupo: <span className="font-bold text-[10.5px] underline">"{cleanGrupo}"</span></div>
          <div>Turno: <span className="font-bold uppercase text-[9.5px]">{turno}</span></div>
        </div>

        {/* Tabla Principal Integrada */}
        <table className="w-full border-collapse eval-table text-[8.5px]">
          <thead>
            {/* Fila Superior (Agrupaciones) */}
            <tr className="bg-slate-200">
              <th rowSpan={2} className="w-5 font-bold text-center">N°</th>
              <th rowSpan={2} className="w-[235px] font-bold text-left px-1.5 uppercase tracking-wide">Nombre del Alumno(a)</th>
              <th colSpan={daysCols.length + 1} className="font-bold text-center uppercase tracking-widest border-b border-slate-400 py-0.5">Asistencias</th>
              <th colSpan={taskCols.length} className="font-bold text-center uppercase tracking-widest border-b border-slate-400">Tareas / Trabajos</th>
              <th colSpan={3} className="font-bold text-center uppercase tracking-widest border-b border-slate-400">Evaluación</th>
              <th rowSpan={2} className="w-[82px] font-bold text-center uppercase tracking-wider">Observaciones</th>
            </tr>
            {/* Fila Inferior (Sub-columnas) */}
            <tr className="bg-slate-100">
              {daysCols.map(col => (
                <th key={`d-${col}`} className="w-[16px] text-center font-bold text-[7.5px] text-slate-600">{col}</th>
              ))}
              <th className="w-[22px] text-center font-extrabold text-[8px] bg-slate-200" title="Total de Faltas">T.F.</th>
              
              {taskCols.map(col => (
                <th key={`t-${col}`} className="w-[22px] text-center font-bold text-[7.5px] text-slate-600">T{col}</th>
              ))}
              
              <th className="w-[30px] text-center font-bold text-[7.5px]">Exam.</th>
              <th className="w-[30px] text-center font-bold text-[7.5px]" title="Participación">Partic.</th>
              <th className="w-[32px] text-center font-extrabold text-[8px] bg-slate-200" title="Promedio Trimestral">Prom.</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, index) => {
              const isBaja = !student.isEmpty && (student.status || '').toLowerCase() === 'baja';
              const isAlta = !student.isEmpty && !isBaja && student.tipoIngreso === 'Alta';
              const rawName = student.isEmpty ? '' : `${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''} ${student.nombres || ''}`.replace(/\s+/g, ' ').trim();
              const fullName = rawName ? autoAcentuar(rawName).toUpperCase() : '';

              return (
                <tr key={student.id} className={`h-[14.5px] ${isBaja ? 'bg-slate-200/70 text-slate-500' : 'even:bg-slate-50/40'}`}>
                  <td className="text-center font-bold text-slate-700 leading-none">{index + 1}</td>
                  <td className="px-1.5 font-semibold uppercase text-[8px] leading-none whitespace-nowrap overflow-hidden" title={fullName}>
                    {!student.isEmpty && (
                      <div className="flex items-center justify-between gap-1">
                        <span className={`truncate ${isBaja ? 'line-through text-slate-500' : ''}`}>
                          {fullName}
                        </span>
                        {isAlta && (
                          <span className="shrink-0 px-1 py-0 text-[6px] font-black bg-emerald-100 text-emerald-900 border border-emerald-600 rounded leading-tight">
                            ALTA
                          </span>
                        )}
                        {isBaja && (
                          <span className="shrink-0 px-1 py-0 text-[6px] font-black bg-red-100 text-red-900 border border-red-600 rounded leading-tight">
                            BAJA
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  
                  {isBaja ? (
                    <>
                      <td colSpan={daysCols.length + 1 + taskCols.length + 3} className="text-center font-bold text-[7px] tracking-[0.25em] text-slate-500 bg-slate-100/80 uppercase leading-none">
                        — B A J A {student.fechaBaja ? `(${student.fechaBaja})` : ''} —
                      </td>
                      <td className="text-center font-bold text-[7px] text-red-800 uppercase px-1 truncate leading-none">
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
                      <td className="text-center font-bold text-[7px] text-emerald-900 uppercase px-1 truncate leading-none">
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
        <div className="mt-0.5 flex justify-between text-[7px] text-slate-600 font-medium px-0.5">
          <p><strong className="text-black">Simbología Asistencia:</strong> ( . ) Asistencia &nbsp;|&nbsp; ( F ) Falta &nbsp;|&nbsp; ( R ) Retardo &nbsp;|&nbsp; ( J ) Justificante &nbsp;|&nbsp; <strong className="text-black">[ALTA]</strong> Ingreso posterior al 30/Sept &nbsp;|&nbsp; <strong className="text-black">[BAJA]</strong> Baja durante el ciclo</p>
          <p><strong className="text-black">Simbología Evaluación:</strong> T.F. = Total Faltas &nbsp;|&nbsp; Exam. = Examen o Proyecto &nbsp;|&nbsp; Partic. = Participación</p>
        </div>

        {/* Cuadro Estadístico del Grupo (Justo antes de las firmas) */}
        <div className="mt-1">
          <table className="w-full border-collapse stats-summary-table text-[8px] text-center">
            <thead>
              <tr className="bg-slate-200 font-extrabold uppercase tracking-wider text-[7.5px] leading-tight">
                <th colSpan={3} className="w-[22%]">Existencia (Activos)</th>
                <th colSpan={3} className="w-[24%]">Alumnos Regulares</th>
                <th colSpan={3} className="w-[24%]">Alumnos Irregulares</th>
                <th rowSpan={2} className="w-[15%]">Promedio de<br/>Aprovechamiento</th>
                <th rowSpan={2} className="w-[15%]">% de<br/>Aprobación</th>
              </tr>
              <tr className="bg-slate-100 font-bold text-[7px] leading-tight">
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
              <tr className="h-[16px] font-bold text-[9px] leading-none">
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
        <div className="flex justify-around items-end mt-4 pt-1 px-10">
          <div className="text-center w-56 border-t border-black pt-0.5">
            <p className="font-bold text-[9.5px] uppercase leading-tight">Firma del Docente</p>
          </div>
          <div className="text-center w-56 border-t border-black pt-0.5">
            {turno === 'Matutino' ? (
              <>
                <p className="font-bold text-[9.5px] uppercase leading-tight">Profra. Lucila Rodriguez Martinez</p>
                <p className="text-[8.5px] text-slate-600 font-semibold uppercase leading-tight">Vo. Bo. Coordinación Académica</p>
              </>
            ) : (
              <p className="font-bold text-[9.5px] uppercase leading-tight">Vo. Bo. Coordinador Académico</p>
            )}
          </div>
          <div className="text-center w-56 border-t border-black pt-0.5">
            <p className="font-bold text-[9.5px] uppercase leading-tight">Prof. Juan Carlos Taboada Barajas</p>
            <p className="text-[8.5px] text-slate-600 font-semibold uppercase leading-tight">Director del Plantel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
