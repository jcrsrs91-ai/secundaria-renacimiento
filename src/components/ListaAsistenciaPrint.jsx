import React from 'react';
import { sortStudents } from '../utils/sortUtils';
import { useGlobalConfig } from '../hooks/useGlobalConfig';
import { autoAcentuar } from '../utils/format';

export const TALLER_POR_GRUPO = {
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

export const getStudentGender = (s) => {
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

export default function ListaAsistenciaPrint({
  students,
  grado,
  grupo,
  paperSize,
  isFilled = false,
  docente = '',
  asignatura = '',
  trimestreLabel = '',
  evalData = {},
  stats = null
}) {
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

  // Asegurar siempre hasta 27 filas para que las celdas sean más altas y todo se vea más grande en 1 hoja Carta
  const targetRows = 27;
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
          @page { size: ${sizeValue} landscape; margin: 0.32cm 0.6cm; }
          html, body, #root { height: auto !important; min-height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          aside, header, nav, .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .print-lista-asistencia-only {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 0.15cm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
        @media screen {
          .print-lista-asistencia-only { display: none !important; }
        }
        
        .eval-table {
          table-layout: fixed;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .eval-table th, .eval-table td {
          border: 1.3px solid #1e293b;
          padding: 1px 1.5px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .stats-summary-table th, .stats-summary-table td {
          border: 1.3px solid #1e293b;
          padding: 2px 5px;
          box-sizing: border-box;
        }
      `}</style>

      <div className="bg-white text-black w-full" style={{ fontSize: '9.5px' }}>
        {/* Encabezado Oficial SEP / NEM */}
        <div className="flex justify-between items-end border-b-[2px] border-black pb-1 mb-1">
          <div className="flex flex-col">
            <h1 className="font-extrabold text-[13px] uppercase tracking-wide leading-tight">Esc. Sec. Técnica N° 68 "Renacimiento"</h1>
            <p className="font-bold text-[10px] uppercase text-slate-700 leading-tight">C.C.T: 12DST0077B &bull; Acapulco de Juárez, Gro.</p>
          </div>
          <div className="text-center">
            <h2 className="font-black text-[13px] uppercase tracking-widest bg-slate-200 px-3.5 py-0.5 border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              Lista de Asistencia y Evaluación
            </h2>
          </div>
          <div className="text-right leading-tight">
            <p className="font-bold text-[10px]">Ciclo Escolar: <span className="underline decoration-slate-400">{config?.cicloEscolarActual || '2025 - 2026'}</span></p>
            <p className="font-bold text-[10px] mt-0.5">
              Trimestre a Evaluar:{' '}
              <span className="inline-block border-b border-black min-w-[6rem] px-1 text-center font-black uppercase">
                {isFilled && trimestreLabel ? trimestreLabel : ''}
              </span>
            </p>
          </div>
        </div>

        {/* Metadatos del Grupo y Docente */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mb-1 font-semibold text-[10px] px-0.5">
          <div>
            Docente:{' '}
            <span className="font-bold border-b border-black inline-block min-w-[12rem] px-1 uppercase text-[9.5px]">
              {isFilled && docente ? docente : ''}
            </span>
          </div>
          <div>
            Disciplina:{' '}
            <span className="font-bold border-b border-black inline-block min-w-[10rem] px-1 uppercase text-[9.5px]">
              {isFilled && asignatura ? asignatura : ''}
            </span>
          </div>
          <div>Taller / Tecnología: <span className="font-bold border-b border-black inline-block px-1.5 text-center uppercase text-[9.5px]">{taller}</span></div>
          <div>Grado: <span className="font-bold text-[11px] underline">{grado}</span></div>
          <div>Grupo: <span className="font-bold text-[11px] underline">"{cleanGrupo}"</span></div>
          <div>Turno: <span className="font-bold uppercase text-[10px]">{turno}</span></div>
        </div>

        {/* Tabla Principal Integrada con table-layout: fixed en porcentajes exactos (100%) para respetar márgenes de impresora */}
        <table className="w-full border-collapse eval-table text-[9.5px]">
          <colgroup>
            <col style={{ width: '2.1%' }} />
            <col style={{ width: '23.5%' }} />
            {daysCols.map(col => (
              <col key={`col-d-${col}`} style={{ width: '2.10%' }} />
            ))}
            <col style={{ width: '2.3%' }} />
            {taskCols.map(col => (
              <col key={`col-t-${col}`} style={{ width: '2.15%' }} />
            ))}
            <col style={{ width: '2.8%' }} />
            <col style={{ width: '2.8%' }} />
            <col style={{ width: '2.8%' }} />
            <col style={{ width: '3.0%' }} />
            <col style={{ width: '5.8%' }} />
          </colgroup>
          <thead>
            {/* Fila 1: Agrupaciones Principales */}
            <tr className="bg-slate-200 h-[16px]">
              <th rowSpan={3} className="font-bold text-center text-[9.5px]">N°</th>
              <th rowSpan={3} className="font-bold text-left px-1.5 uppercase tracking-wide text-[9.5px]">
                <div className="flex flex-col justify-between h-full">
                  <span>Nombre del Alumno(a)</span>
                  <span className="text-[7.5px] font-semibold text-slate-600 text-right pr-0.5">CONTENIDOS / FECHA &rarr;</span>
                </div>
              </th>
              <th colSpan={daysCols.length + 1} className="font-extrabold text-center uppercase tracking-widest border-b border-slate-400 text-[9.5px]">Asistencias</th>
              <th colSpan={taskCols.length} className="font-extrabold text-center uppercase tracking-widest border-b border-slate-400 text-[9.5px]">Tareas / Trabajos</th>
              <th colSpan={4} className="font-extrabold text-center uppercase tracking-widest border-b border-slate-400 text-[9.5px]">Evaluación</th>
              <th rowSpan={3} className="font-bold text-center uppercase tracking-tight text-[8px]">Observaciones</th>
            </tr>

            {/* Fila 2: Espacio en blanco para Contenidos / Tema visto ese día (Entre Asistencias y el Número) */}
            <tr className="bg-white h-[33px]">
              {daysCols.map(col => (
                <th key={`cont-d-${col}`} className="p-0 align-bottom"></th>
              ))}
              <th className="bg-slate-100 p-0"></th>

              {taskCols.map(col => (
                <th key={`cont-t-${col}`} className="p-0 align-bottom"></th>
              ))}

              <th className="bg-slate-50 p-0"></th>
              <th className="bg-slate-50 p-0"></th>
              <th className="bg-slate-50 p-0"></th>
              <th className="bg-slate-100 p-0"></th>
            </tr>

            {/* Fila 3: Numeración de Días y Sub-columnas */}
            <tr className="bg-slate-100 h-[15px]">
              {daysCols.map(col => (
                <th key={`d-${col}`} className="text-center font-bold text-[8.5px] text-slate-700 leading-none">{col}</th>
              ))}
              <th className="text-center font-extrabold text-[8.5px] bg-slate-200 leading-none" title="Total de Faltas">T.F.</th>
              
              {taskCols.map(col => (
                <th key={`t-${col}`} className="text-center font-bold text-[8.5px] text-slate-700 leading-none">T{col}</th>
              ))}
              
              <th className="text-center font-bold text-[8px] leading-none">Exam.</th>
              <th className="text-center font-bold text-[8px] leading-none" title="Participación">Partic.</th>
              <th className="text-center font-bold text-[8px] leading-none" title="Criterio adicional del docente"></th>
              <th className="text-center font-extrabold text-[8.5px] bg-slate-200 leading-none" title="Promedio Trimestral">Prom.</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, index) => {
              const isBaja = !student.isEmpty && (student.status || '').toLowerCase() === 'baja';
              const isAlta = !student.isEmpty && !isBaja && student.tipoIngreso === 'Alta';
              const rawName = student.isEmpty ? '' : `${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''} ${student.nombres || ''}`.replace(/\s+/g, ' ').trim();
              const fullName = rawName ? autoAcentuar(rawName).toUpperCase() : '';
              const effectiveLen = fullName.length + (isAlta || isBaja ? 6 : 0);
              const nameSizeClass = effectiveLen > 34
                ? 'text-[8.1px] tracking-tighter'
                : effectiveLen > 29
                  ? 'text-[8.8px] tracking-tight'
                  : 'text-[9.5px] tracking-tight';

              const stEval = (!student.isEmpty && isFilled && evalData[student.id]) ? evalData[student.id] : {};
              const califNum = parseFloat(stEval.calificacion);
              const isReprobado = !isNaN(califNum) && califNum < 6;

              return (
                <tr key={student.id} className={`h-[17.8px] ${isBaja ? 'bg-slate-200/70 text-slate-500' : 'even:bg-slate-50/40'}`}>
                  <td className="text-center font-bold text-slate-800 text-[9.5px] leading-none">{index + 1}</td>
                  <td className={`px-1 font-bold uppercase ${nameSizeClass} leading-none whitespace-nowrap overflow-hidden max-w-0`} title={fullName}>
                    {!student.isEmpty && (
                      <div className="flex items-center justify-between gap-0.5 w-full max-w-full overflow-hidden">
                        <span className={`truncate block min-w-0 flex-1 ${isBaja ? 'line-through text-slate-500' : ''}`}>
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
                      <td colSpan={daysCols.length + 1 + taskCols.length + 4} className="text-center font-bold text-[8px] tracking-[0.25em] text-slate-500 bg-slate-100/80 uppercase leading-none">
                        — B A J A {student.fechaBaja ? `(${student.fechaBaja})` : ''} —
                      </td>
                      <td className="text-center font-bold text-[7px] text-red-800 uppercase px-0.5 truncate leading-none">
                        BAJA {student.fechaBaja ? student.fechaBaja : ''}
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Columnas de Asistencia */}
                      {daysCols.map(col => (
                        <td key={`cell-d-${student.id}-${col}`}></td>
                      ))}
                      {/* Total de faltas */}
                      <td className="bg-slate-100/50 text-center font-bold text-[9px] leading-none">
                        {isFilled && stEval.faltas !== undefined && stEval.faltas !== '' ? stEval.faltas : ''}
                      </td>
                      
                      {/* Tareas */}
                      {taskCols.map(col => (
                        <td key={`cell-t-${student.id}-${col}`} className="text-center text-[8.5px] leading-none">
                          {isFilled && stEval[`t${col}`] !== undefined ? stEval[`t${col}`] : ''}
                        </td>
                      ))}
                      
                      {/* Evaluación: Examen, Participación, Columna Extra y Promedio Trimestral */}
                      <td className="text-center text-[8.5px] leading-none">
                        {isFilled && stEval.examen !== undefined ? stEval.examen : ''}
                      </td>
                      <td className="text-center text-[8.5px] leading-none">
                        {isFilled && stEval.participacion !== undefined ? stEval.participacion : ''}
                      </td>
                      <td className="text-center text-[8.5px] leading-none">
                        {isFilled && stEval.extraEval !== undefined ? stEval.extraEval : ''}
                      </td>
                      <td className={`bg-slate-100/80 text-center font-black text-[9.8px] leading-none ${isReprobado ? 'text-red-700 underline' : 'text-slate-900'}`}>
                        {isFilled && stEval.calificacion !== undefined && stEval.calificacion !== '' ? stEval.calificacion : ''}
                      </td>
                      
                      {/* Observaciones */}
                      <td className="text-center font-bold text-[7px] text-slate-800 uppercase px-0.5 truncate leading-none">
                        {isFilled && stEval.observaciones
                          ? stEval.observaciones
                          : isAlta
                            ? `ALTA${student.fechaAlta ? ' ' + student.fechaAlta : ''}`
                            : ''}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Simbología */}
        <div className="mt-0.5 flex justify-between text-[7.5px] text-slate-600 font-medium px-0.5">
          <p><strong className="text-black">Simbología Asistencia:</strong> ( . ) Asistencia &nbsp;|&nbsp; ( F ) Falta &nbsp;|&nbsp; ( R ) Retardo &nbsp;|&nbsp; ( J ) Justificante &nbsp;|&nbsp; <strong className="text-black">[ALTA]</strong> Ingreso posterior al 30/Sept &nbsp;|&nbsp; <strong className="text-black">[BAJA]</strong> Baja durante el ciclo</p>
          <p><strong className="text-black">Simbología Evaluación:</strong> T.F. = Total Faltas &nbsp;|&nbsp; Exam. = Examen o Proyecto &nbsp;|&nbsp; Partic. = Participación</p>
        </div>

        {/* Cuadro Estadístico del Grupo (Justo antes de las firmas) */}
        <div className="mt-1">
          <table className="w-full border-collapse stats-summary-table text-[8.5px] text-center">
            <thead>
              <tr className="bg-slate-200 font-extrabold uppercase tracking-wider text-[8px] leading-tight">
                <th colSpan={3} className="w-[22%]">Existencia (Activos)</th>
                <th colSpan={3} className="w-[24%]">Alumnos Regulares</th>
                <th colSpan={3} className="w-[24%]">Alumnos Irregulares</th>
                <th rowSpan={2} className="w-[15%]">Promedio de<br/>Aprovechamiento</th>
                <th rowSpan={2} className="w-[15%]">% de<br/>Aprobación</th>
              </tr>
              <tr className="bg-slate-100 font-bold text-[7.5px] leading-tight">
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
              <tr className="h-[17px] font-bold text-[9.5px] leading-none">
                {/* Existencia llenada automáticamente */}
                <td>{existenciaH}</td>
                <td>{existenciaM}</td>
                <td className="bg-slate-100 font-black">{existenciaT}</td>
                {/* Regulares: llenos si isFilled, en blanco si es lista vacía */}
                <td>{isFilled && stats ? stats.regularesH : ''}</td>
                <td>{isFilled && stats ? stats.regularesM : ''}</td>
                <td className="bg-slate-50 font-black">{isFilled && stats ? stats.regularesT : ''}</td>
                {/* Irregulares: llenos si isFilled, en blanco si es lista vacía */}
                <td>{isFilled && stats ? stats.irregularesH : ''}</td>
                <td>{isFilled && stats ? stats.irregularesM : ''}</td>
                <td className="bg-slate-50 font-black">{isFilled && stats ? stats.irregularesT : ''}</td>
                {/* Promedio y % de Aprobación */}
                <td className="font-black">{isFilled && stats ? stats.promedioAprovechamiento : ''}</td>
                <td className={isFilled && stats ? 'text-center font-black' : 'text-right pr-2 font-normal text-slate-400'}>
                  {isFilled && stats ? `${stats.porcentajeAprobacion} %` : '%'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Firmas de Autorización - Estilo SEP */}
        <div className="flex justify-around items-end mt-3.5 pt-1 px-10">
          <div className="text-center w-56 border-t border-black pt-0.5">
            {isFilled && docente ? (
              <>
                <p className="font-bold text-[9.5px] uppercase leading-tight">{docente}</p>
                <p className="text-[8.5px] text-slate-600 font-semibold uppercase leading-tight">Firma del Docente</p>
              </>
            ) : (
              <p className="font-bold text-[9.5px] uppercase leading-tight">Firma del Docente</p>
            )}
          </div>
          <div className="text-center w-56 border-t border-black pt-0.5">
            {turno === 'Matutino' ? (
              <>
                <p className="font-bold text-[9.5px] uppercase leading-tight">{config?.coordinadorMatutino || 'Profra. Lucila Rodríguez Martínez'}</p>
                <p className="text-[8.5px] text-slate-600 font-semibold uppercase leading-tight">Vo. Bo. Coordinación Académica</p>
              </>
            ) : (
              <>
                <p className="font-bold text-[9.5px] uppercase leading-tight">{config?.coordinadorVespertino || 'Profr. José Barrera Vázquez'}</p>
                <p className="text-[8.5px] text-slate-600 font-semibold uppercase leading-tight">Vo. Bo. Coordinación Académica</p>
              </>
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
