import React from 'react';
import { useGlobalConfig } from '../hooks/useGlobalConfig';
import { autoAcentuar, truncateTo1Dec } from '../utils/format';
import { TALLER_POR_GRUPO, getStudentGender, sortAttendanceListStudents } from './ListaAsistenciaPrint';

export default function CuadroAsignaturaPrint({
  students = [],
  grado = '1er Grado',
  grupo = 'A',
  materiaId = '',
  asignatura = '',
  docente = '',
  trimestre = 't1',
  trimestreLabel = 'I (Primero)',
  evalData = {},
  stats = null,
  paperSize = 'letter'
}) {
  const { config } = useGlobalConfig();
  if (!students || students.length === 0) return null;

  let sortedStudents = sortAttendanceListStudents(students);

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
  const sizeValue = paperSize === 'legal' ? 'legal' : 'letter';

  const getTrimestreVal = (student, tKey, field = 'calificacion') => {
    if (student.isEmpty) return '';
    if (tKey === trimestre && evalData[student.id]) {
      if (field === 'calificacion') return evalData[student.id].calificacion ?? '';
      if (field === 'faltas') return evalData[student.id].faltas ?? '';
    }
    if (field === 'calificacion') {
      return student.calificaciones?.[tKey]?.[materiaId] ?? '';
    }
    if (field === 'faltas') {
      return student.evaluacionDetalle?.[tKey]?.[materiaId]?.faltas ?? '';
    }
    return '';
  };

  return (
    <div className="print-cuadro-asignatura-only">
      <style>{`
        @media print {
          @page { size: ${sizeValue} landscape; margin: 0.32cm 0.6cm; }
          html, body, #root { height: auto !important; min-height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          aside, header, nav, .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .print-cuadro-asignatura-only {
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
          .print-cuadro-asignatura-only { display: none !important; }
        }
        .conc-table {
          table-layout: fixed;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .conc-table th, .conc-table td {
          border: 1.3px solid #1e293b;
          padding: 1px 2px;
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
        {/* Encabezado Oficial */}
        <div className="flex justify-between items-end border-b-[2px] border-black pb-1 mb-1">
          <div className="flex flex-col">
            <h1 className="font-extrabold text-[13px] uppercase tracking-wide leading-tight">Esc. Sec. Técnica N° 68 "Renacimiento"</h1>
            <p className="font-bold text-[10px] uppercase text-slate-700 leading-tight">C.C.T: 12DST0077B &bull; Acapulco de Juárez, Gro.</p>
          </div>
          <div className="text-center">
            <h2 className="font-black text-[13px] uppercase tracking-widest bg-slate-200 px-3.5 py-0.5 border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              Cuadro de Concentración y Evaluación por Disciplina
            </h2>
          </div>
          <div className="text-right leading-tight">
            <p className="font-bold text-[10px]">Ciclo Escolar: <span className="underline decoration-slate-400">{config?.cicloEscolarActual || '2025 - 2026'}</span></p>
            <p className="font-bold text-[10px] mt-0.5">
              Trimestre Evaluado:{' '}
              <span className="inline-block border-b border-black min-w-[6rem] px-1 text-center font-black uppercase">
                {trimestreLabel}
              </span>
            </p>
          </div>
        </div>

        {/* Metadatos del Grupo y Docente */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mb-1 font-semibold text-[10px] px-0.5">
          <div>
            Docente:{' '}
            <span className="font-bold border-b border-black inline-block min-w-[13rem] px-1 uppercase text-[9.5px]">
              {docente}
            </span>
          </div>
          <div>
            Disciplina:{' '}
            <span className="font-bold border-b border-black inline-block min-w-[11rem] px-1 uppercase text-[9.5px]">
              {asignatura}
            </span>
          </div>
          <div>Taller / Tecnología: <span className="font-bold border-b border-black inline-block px-1.5 text-center uppercase text-[9.5px]">{taller}</span></div>
          <div>Grado: <span className="font-bold text-[11px] underline">{grado}</span></div>
          <div>Grupo: <span className="font-bold text-[11px] underline">"{cleanGrupo}"</span></div>
          <div>Turno: <span className="font-bold uppercase text-[10px]">{turno}</span></div>
        </div>

        {/* Tabla de Concentración de la Asignatura */}
        <table className="w-full border-collapse conc-table text-[9.5px]">
          <colgroup>
            <col style={{ width: '2.5%' }} />
            <col style={{ width: '8.5%' }} />
            <col style={{ width: '28.0%' }} />
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '4.5%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '4.5%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '4.5%' }} />
            <col style={{ width: '7.5%' }} />
            <col style={{ width: '8.5%' }} />
            <col style={{ width: '11.5%' }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-200 h-[18px]">
              <th rowSpan={2} className="font-bold text-center text-[9.5px]">N°</th>
              <th rowSpan={2} className="font-bold text-center text-[9px] uppercase">Matrícula</th>
              <th rowSpan={2} className="font-bold text-left px-1.5 uppercase tracking-wide text-[9.5px]">Nombre del Alumno(a)</th>
              <th rowSpan={2} className="font-bold text-center text-[8.5px] uppercase">Sexo</th>
              <th colSpan={2} className={`font-extrabold text-center uppercase text-[9px] ${trimestre === 't1' ? 'bg-slate-300' : ''}`}>Trimestre I</th>
              <th colSpan={2} className={`font-extrabold text-center uppercase text-[9px] ${trimestre === 't2' ? 'bg-slate-300' : ''}`}>Trimestre II</th>
              <th colSpan={2} className={`font-extrabold text-center uppercase text-[9px] ${trimestre === 't3' ? 'bg-slate-300' : ''}`}>Trimestre III</th>
              <th rowSpan={2} className="font-extrabold text-center uppercase text-[8.5px] bg-slate-300 leading-tight">Promedio<br/>Acumulado</th>
              <th rowSpan={2} className="font-extrabold text-center uppercase text-[8.5px] leading-tight">Situación<br/>en Materia</th>
              <th rowSpan={2} className="font-bold text-center uppercase text-[8.5px]">Observaciones</th>
            </tr>
            <tr className="bg-slate-100 h-[15px]">
              <th className="text-center font-bold text-[8px]">Calif.</th>
              <th className="text-center font-bold text-[8px] text-slate-600">Faltas</th>
              <th className="text-center font-bold text-[8px]">Calif.</th>
              <th className="text-center font-bold text-[8px] text-slate-600">Faltas</th>
              <th className="text-center font-bold text-[8px]">Calif.</th>
              <th className="text-center font-bold text-[8px] text-slate-600">Faltas</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, index) => {
              const isBaja = !student.isEmpty && (student.status || '').toLowerCase() === 'baja';
              const isAlta = !student.isEmpty && !isBaja && student.tipoIngreso === 'Alta';
              const rawName = student.isEmpty ? '' : `${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''} ${student.nombres || ''}`.replace(/\s+/g, ' ').trim();
              const fullName = rawName ? autoAcentuar(rawName).toUpperCase() : '';
              const gen = student.isEmpty ? '' : getStudentGender(student);

              const c1 = getTrimestreVal(student, 't1', 'calificacion');
              const f1 = getTrimestreVal(student, 't1', 'faltas');
              const c2 = getTrimestreVal(student, 't2', 'calificacion');
              const f2 = getTrimestreVal(student, 't2', 'faltas');
              const c3 = getTrimestreVal(student, 't3', 'calificacion');
              const f3 = getTrimestreVal(student, 't3', 'faltas');

              let sum = 0;
              let cnt = 0;
              [c1, c2, c3].forEach(v => {
                const n = parseFloat(v);
                if (!isNaN(n)) {
                  sum += n;
                  cnt++;
                }
              });
              const promAcum = cnt > 0 ? truncateTo1Dec(sum / cnt) : '';

              const currentCalif = parseFloat(getTrimestreVal(student, trimestre, 'calificacion'));
              const isRegular = !isNaN(currentCalif) && currentCalif >= 6;
              const isIrregular = !isNaN(currentCalif) && currentCalif < 6;
              const stEval = (!student.isEmpty && evalData[student.id]) ? evalData[student.id] : {};

              return (
                <tr key={student.id} className={`h-[18.4px] ${isBaja ? 'bg-slate-200/70 text-slate-500' : 'even:bg-slate-50/40'}`}>
                  <td className="text-center font-bold text-slate-800 text-[9.5px] leading-none">{index + 1}</td>
                  <td className="text-center font-semibold text-slate-700 text-[8.5px] leading-none">{student.isEmpty ? '' : (student.matricula || '')}</td>
                  <td className="px-1.5 font-bold uppercase text-[9.5px] tracking-tight leading-none whitespace-nowrap overflow-hidden max-w-0" title={fullName}>
                    {!student.isEmpty && (
                      <div className="flex items-center justify-between gap-1 w-full max-w-full overflow-hidden">
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
                  <td className="text-center font-bold text-[8.5px] leading-none">{gen}</td>

                  {isBaja ? (
                    <>
                      <td colSpan={8} className="text-center font-bold text-[8px] tracking-[0.25em] text-slate-500 bg-slate-100/80 uppercase leading-none">
                        — B A J A {student.fechaBaja ? `(${student.fechaBaja})` : ''} —
                      </td>
                      <td className="text-center font-bold text-[7.5px] text-red-800 uppercase px-0.5 truncate leading-none">
                        BAJA {student.fechaBaja ? student.fechaBaja : ''}
                      </td>
                    </>
                  ) : (
                    <>
                      {/* T1 */}
                      <td className={`text-center font-bold text-[9.5px] leading-none ${parseFloat(c1) < 6 ? 'text-red-700 underline' : ''} ${trimestre === 't1' ? 'bg-slate-100 font-black' : ''}`}>{c1}</td>
                      <td className="text-center text-[8.5px] text-slate-600 leading-none">{f1}</td>
                      {/* T2 */}
                      <td className={`text-center font-bold text-[9.5px] leading-none ${parseFloat(c2) < 6 ? 'text-red-700 underline' : ''} ${trimestre === 't2' ? 'bg-slate-100 font-black' : ''}`}>{c2}</td>
                      <td className="text-center text-[8.5px] text-slate-600 leading-none">{f2}</td>
                      {/* T3 */}
                      <td className={`text-center font-bold text-[9.5px] leading-none ${parseFloat(c3) < 6 ? 'text-red-700 underline' : ''} ${trimestre === 't3' ? 'bg-slate-100 font-black' : ''}`}>{c3}</td>
                      <td className="text-center text-[8.5px] text-slate-600 leading-none">{f3}</td>

                      {/* Promedio acumulado */}
                      <td className={`text-center font-black text-[9.5px] bg-slate-100 leading-none ${parseFloat(promAcum) < 6 ? 'text-red-700' : 'text-slate-900'}`}>
                        {promAcum}
                      </td>

                      {/* Situación Regular / Irregular */}
                      <td className={`text-center font-extrabold text-[8px] leading-none ${
                        isIrregular ? 'text-red-700 bg-red-50' : isRegular ? 'text-emerald-800' : 'text-slate-400'
                      }`}>
                        {isRegular ? 'REGULAR' : isIrregular ? 'IRREGULAR' : ''}
                      </td>

                      {/* Observaciones */}
                      <td className="text-center font-semibold text-[7.5px] text-slate-700 uppercase px-1 truncate leading-none">
                        {stEval.observaciones
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

        {/* Cuadro Estadístico del Grupo (Lleno en automático) */}
        <div className="mt-1.5">
          <table className="w-full border-collapse stats-summary-table text-[8.5px] text-center">
            <thead>
              <tr className="bg-slate-200 font-extrabold uppercase tracking-wider text-[8px] leading-tight">
                <th colSpan={3} className="w-[22%]">Existencia (Activos)</th>
                <th colSpan={3} className="w-[24%]">Alumnos Regulares (Aprobados &ge; 6)</th>
                <th colSpan={3} className="w-[24%]">Alumnos Irregulares (Reprobados &lt; 6)</th>
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
              <tr className="h-[18px] font-bold text-[9.5px] leading-none">
                <td>{existenciaH}</td>
                <td>{existenciaM}</td>
                <td className="bg-slate-100 font-black">{existenciaT}</td>
                <td>{stats ? stats.regularesH : ''}</td>
                <td>{stats ? stats.regularesM : ''}</td>
                <td className="bg-slate-100 font-black text-emerald-900">{stats ? stats.regularesT : ''}</td>
                <td>{stats ? stats.irregularesH : ''}</td>
                <td>{stats ? stats.irregularesM : ''}</td>
                <td className="bg-slate-100 font-black text-red-800">{stats ? stats.irregularesT : ''}</td>
                <td className="font-black text-[10px]">{stats ? stats.promedioAprovechamiento : ''}</td>
                <td className="font-black text-[10px]">{stats && stats.porcentajeAprobacion !== '' ? `${stats.porcentajeAprobacion} %` : '%'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Firmas de Autorización - Estilo SEP */}
        <div className="flex justify-around items-end mt-4 pt-1 px-10">
          <div className="text-center w-56 border-t border-black pt-0.5">
            {docente ? (
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
