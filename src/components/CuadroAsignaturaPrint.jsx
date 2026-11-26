import React, { useState, useEffect } from 'react';
import { useGlobalConfig } from '../hooks/useGlobalConfig';
import {
  quitarAcentosNombre,
  roundToIntGrade,
  roundToIntNumber,
  truncateTo1Dec,
  getCalificacionTrimestreEfectiva
} from '../utils/format';
import { TALLER_POR_GRUPO, getStudentGender, sortAttendanceListStudents } from './ListaAsistenciaPrint';
import { descargarCuadroMateriaExcel } from '../utils/exportListaExcel';

/**
 * Formato Oficial Integrado de Cuadro de Concentración por Materia (Individual o Lote de Grupo).
 * Contempla el ciclo completo SEP / SEG / PASEG sin necesidad de cambios futuros:
 *   1) Evaluación Ordinaria y Faltas por Trimestre (T1, T2, T3)
 *   2) Periodo de Recuperación por Trimestre (Rec. T1, T2, T3)
 *   3) Cierre Anual Ordinario (Total Faltas + Promedio)
 *   4) Exámenes Extraordinarios de Regularización al Final del Ciclo (E.E.R. 1°, 2°, 3° Oportunidad)
 *   5) Calificación Definitiva, Situación / Observaciones y Estadística Automática de Recuperación
 */
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
  paperSize = 'letter',
  materiasBatch = null, // Array opcional: [{ id, name, docente }] para imprimir todas las materias del grupo
  onClose = null
}) {
  const { config } = useGlobalConfig();
  const [selectedPaperSize, setSelectedPaperSize] = useState(paperSize);
  const [onlyRecoveryFilter, setOnlyRecoveryFilter] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  useEffect(() => {
    setSelectedPaperSize(paperSize);
  }, [paperSize]);

  if (!students || students.length === 0) return null;

  const baseSortedStudents = sortAttendanceListStudents(students);
  const cleanGrupo = (grupo || 'A').trim().toUpperCase();
  const firstActive = baseSortedStudents.find(s => !s.isEmpty) || baseSortedStudents[0] || {};
  const turno = ['G', 'H', 'I', 'J', 'K', 'L'].includes(cleanGrupo)
    ? 'Vespertino'
    : (firstActive.turno || 'Matutino');
  const taller = TALLER_POR_GRUPO[cleanGrupo] || firstActive.taller || 'Tecnología';
  const sizeValue = selectedPaperSize === 'legal' ? 'legal' : 'letter';

  // Lista de materias a renderizar: lote completo o una sola asignatura
  const itemsToRender =
    Array.isArray(materiasBatch) && materiasBatch.length > 0
      ? materiasBatch.map(m => ({
          materiaId: m.id,
          asignatura: m.id?.startsWith('tecnologia') ? `${m.name} (${taller})` : m.name,
          docente: m.docente || '',
          evalDataOverride: m.evalData || null
        }))
      : [
          {
            materiaId,
            asignatura,
            docente,
            evalDataOverride: evalData
          }
        ];

  const getTrimData = (student, mId, tKey, localEvalMap) => {
    if (student.isEmpty) {
      return { ord: '', rec: '', faltas: '', efectiva: null, fueRecuperado: false };
    }
    const useLocal = tKey === trimestre && localEvalMap && localEvalMap[student.id];
    const det = student.evaluacionDetalle?.[tKey]?.[mId] || {};

    const ordRaw = useLocal ? localEvalMap[student.id].calificacion : student.calificaciones?.[tKey]?.[mId];
    const recRaw = useLocal && localEvalMap[student.id].recuperacion !== undefined
      ? localEvalMap[student.id].recuperacion
      : (student.recuperacion?.[tKey]?.[mId] ?? det.recuperacion);
    const faltRaw = useLocal ? localEvalMap[student.id].faltas : det.faltas;

    const ordNum = roundToIntNumber(ordRaw);
    const recNum = roundToIntNumber(recRaw);
    const faltStr = faltRaw !== undefined && faltRaw !== null && String(faltRaw).trim() !== '' ? String(faltRaw).trim() : '';

    // Calcular calificación efectiva del trimestre respetando la regla PASEG
    let efectiva = ordNum;
    let fueRecuperado = false;
    if (recNum !== null && (ordNum === null || recNum > ordNum)) {
      efectiva = recNum;
      fueRecuperado = true;
    } else if (!useLocal) {
      const fromHelper = getCalificacionTrimestreEfectiva(student, mId, tKey);
      efectiva = fromHelper.efectiva;
      fueRecuperado = fromHelper.fueRecuperado;
    }

    return {
      ord: ordNum !== null ? String(ordNum) : '',
      rec: recNum !== null ? String(recNum) : '',
      ordNum,
      recNum,
      faltas: faltStr,
      efectiva,
      fueRecuperado
    };
  };

  const getEERData = (student, mId) => {
    if (student.isEmpty || !student.regularizacion?.[mId]) {
      return { eer1: '', eer2: '', eer3: '', eerFinal: null, hasAny: false };
    }
    const reg = student.regularizacion[mId];
    const periodoLower = String(reg.periodo || '').toLowerCase();
    const mainVal = roundToIntNumber(reg.calificacion);

    const n1 = roundToIntNumber(reg.eer1) ??
      (periodoLower.includes('agosto') || periodoLower.includes('1') || (!reg.eer2 && !reg.eer3 && !periodoLower.includes('sept') && !periodoLower.includes('nov'))
        ? mainVal
        : null);
    const n2 = roundToIntNumber(reg.eer2) ??
      (periodoLower.includes('sept') || periodoLower.includes('2') ? mainVal : null);
    const n3 = roundToIntNumber(reg.eer3) ??
      (periodoLower.includes('nov') || periodoLower.includes('3') ? mainVal : null);

    const eerFinal = [n3, n2, n1, mainVal].find(v => v !== null && v !== undefined) ?? null;

    return {
      eer1: n1 !== null ? String(n1) : '',
      eer2: n2 !== null ? String(n2) : '',
      eer3: n3 !== null ? String(n3) : '',
      eerFinal,
      hasAny: n1 !== null || n2 !== null || n3 !== null || mainVal !== null
    };
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const coordinadorNombre =
        turno === 'Matutino'
          ? (config?.coordinadorMatutino || 'Profra. Lucila Rodríguez Martínez')
          : (config?.coordinadorVespertino || 'Profr. José Barrera Vázquez');
      await descargarCuadroMateriaExcel({
        students: baseSortedStudents,
        grado,
        grupo,
        materiasList: itemsToRender.map(it => ({
          id: it.materiaId,
          name: it.asignatura,
          docente: it.docente || '',
          evalData: it.evalDataOverride || null
        })),
        trimestre,
        cicloEscolar: config?.cicloEscolarActual || '2026 - 2027',
        coordinadorNombre,
        directorNombre: config?.directorName || 'Prof. Juan Carlos Taboada Barajas',
        evalData: !materiasBatch ? evalData : null,
        onlyRecovery: onlyRecoveryFilter
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className={`print-cuadro-asignatura-only ${onClose ? 'is-modal-preview' : ''}`}>
      <style>{`
        @media print {
          @page { size: ${sizeValue} landscape; margin: 0.3cm 0.5cm; }
          html, body, #root { height: auto !important; min-height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          aside, header, nav, .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          .print-cuadro-asignatura-only {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          .cuadro-asignatura-page {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 0.1cm !important;
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .cuadro-asignatura-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
        @media screen {
          .print-cuadro-asignatura-only:not(.is-modal-preview) { display: none !important; }
          .print-cuadro-asignatura-only.is-modal-preview {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(15, 23, 42, 0.78);
            overflow-y: auto;
            padding: 1.25rem 1rem 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
          }
          .cuadro-asignatura-page {
            width: ${selectedPaperSize === 'legal' ? '34cm' : '26.8cm'};
            background: white;
            padding: 0.45cm 0.65cm;
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.45);
            border-radius: 0.35rem;
          }
        }
        .conc-table {
          table-layout: fixed;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .conc-table th, .conc-table td {
          border: 1.2px solid #1e293b;
          padding: 1px 2px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .stats-summary-table th, .stats-summary-table td {
          border: 1.2px solid #1e293b;
          padding: 2px 4px;
          box-sizing: border-box;
        }
      `}</style>

      {/* Barra de controles en pantalla cuando se abre desde Sabana General / Control Escolar */}
      {onClose && (
        <div className="no-print w-full max-w-[26.8cm] bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-indigo-300">
              Vista Previa — Cuadro de Concentración por Asignatura ({itemsToRender.length} {itemsToRender.length === 1 ? 'materia' : 'materias'})
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Formato integral SEP/PASEG: incluye <strong>Ordinario</strong>, <strong>Recuperación por Periodo</strong> y <strong>Extraordinarios (E.E.R.)</strong> en tamaño {selectedPaperSize === 'legal' ? 'Oficio Horizontal' : 'Carta Horizontal'}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setOnlyRecoveryFilter(prev => !prev)}
              className={`px-3 py-2 font-bold rounded-lg text-xs border transition ${
                onlyRecoveryFilter
                  ? 'bg-amber-500 border-amber-400 text-slate-950 shadow'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title="Alternar entre todos los alumnos o filtrar únicamente alumnos en recuperación trimestral o E.E.R."
            >
              {onlyRecoveryFilter ? '🔍 Solo Recuperación / E.E.R.' : '👥 Todos los Alumnos'}
            </button>
            <button
              type="button"
              disabled={isExportingExcel}
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow transition"
              title="Descargar archivo Excel (.xlsx) editable con fórmulas y estadística"
            >
              {isExportingExcel ? '⏳ Generando...' : '📊 Exportar Excel (.xlsx)'}
            </button>
            <select
              value={selectedPaperSize}
              onChange={(e) => setSelectedPaperSize(e.target.value)}
              className="px-2.5 py-2 bg-slate-800 border border-slate-700 text-white font-bold rounded-lg text-xs"
              title="Cambiar tamaño de hoja para impresión"
            >
              <option value="letter">Carta Horizontal</option>
              <option value="legal">Oficio Horizontal</option>
            </select>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow transition"
            >
              🖨️ Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg text-xs transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {itemsToRender.map((itemCfg, pageIdx) => {
        const mId = itemCfg.materiaId;
        const asigName = itemCfg.asignatura || '';
        const localEval = itemCfg.evalDataOverride || {};

        // Detectar docente automáticamente si no fue pasado en batch
        let docenteFinal = itemCfg.docente || '';
        if (!docenteFinal) {
          for (const st of baseSortedStudents) {
            if (st.isEmpty) continue;
            const dName = st.evaluacionDetalle?.[trimestre]?.[mId]?.docente || st.evaluacionDetalle?.t1?.[mId]?.docente || st.evaluacionDetalle?.t2?.[mId]?.docente || st.evaluacionDetalle?.t3?.[mId]?.docente;
            if (dName) {
              docenteFinal = dName;
              break;
            }
          }
        }

        // Preservar número de lista oficial antes de aplicar filtro de Recuperación / E.E.R.
        const indexedBaseStudents = baseSortedStudents.map((s, idx) => ({
          ...s,
          numeroLista: idx + 1
        }));

        // Clonar y rellenar filas hasta 27 mínimos (solo en vista completa), o filtrar solo recuperación/E.E.R.
        let sortedStudents;
        if (onlyRecoveryFilter) {
          sortedStudents = indexedBaseStudents.filter(s => {
            if ((s.status || '').toLowerCase() === 'baja') return false;
            const td1 = getTrimData(s, mId, 't1', localEval);
            const td2 = getTrimData(s, mId, 't2', localEval);
            const td3 = getTrimData(s, mId, 't3', localEval);
            const eer = getEERData(s, mId);
            const valsTrim = [td1.efectiva, td2.efectiva, td3.efectiva].filter(v => v !== null);
            const promAnualNum =
              valsTrim.length > 0 ? Math.round(valsTrim.reduce((a, b) => a + b, 0) / valsTrim.length) : null;
            const califEst = eer.eerFinal !== null ? eer.eerFinal : promAnualNum;

            return (
              (td1.ordNum !== null && td1.ordNum < 6) ||
              (td2.ordNum !== null && td2.ordNum < 6) ||
              (td3.ordNum !== null && td3.ordNum < 6) ||
              td1.recNum !== null ||
              td2.recNum !== null ||
              td3.recNum !== null ||
              eer.hasAny ||
              (califEst !== null && califEst < 6)
            );
          });
        } else {
          sortedStudents = [...indexedBaseStudents];
          const targetRows = 27;
          if (sortedStudents.length < targetRows) {
            const padCount = targetRows - sortedStudents.length;
            for (let i = 0; i < padCount; i++) {
              sortedStudents.push({
                id: `empty_${pageIdx}_${i}`,
                isEmpty: true,
                numeroLista: sortedStudents.length + 1,
                apellidoPaterno: '',
                apellidoMaterno: '',
                nombres: ''
              });
            }
          }
        }

        // Calcular estadística automática del grupo completo en esta materia
        let existenciaH = 0;
        let existenciaM = 0;
        let regH = 0;
        let regM = 0;
        let irregH = 0;
        let irregM = 0;
        let recuperadosTrimCount = 0;
        let acreditadosEERCount = 0;
        let evaluadosCount = 0;
        let sumEvaluados = 0;

        indexedBaseStudents.forEach(s => {
          if (s.isEmpty || (s.status || '').toLowerCase() === 'baja') return;
          const gen = getStudentGender(s);
          if (gen === 'M') existenciaM++;
          else existenciaH++;

          const td1 = getTrimData(s, mId, 't1', localEval);
          const td2 = getTrimData(s, mId, 't2', localEval);
          const td3 = getTrimData(s, mId, 't3', localEval);
          const eer = getEERData(s, mId);

          if (td1.fueRecuperado || td2.fueRecuperado || td3.fueRecuperado) {
            recuperadosTrimCount++;
          }
          if (eer.eerFinal !== null && eer.eerFinal >= 6) {
            acreditadosEERCount++;
          }

          // Evaluado para estadística: usar calificación definitiva E.E.R. si existe, si no promedio acumulado (o corte del trimestre activo)
          const valsTrim = [td1.efectiva, td2.efectiva, td3.efectiva].filter(v => v !== null);
          const promAnualNum = valsTrim.length > 0 ? Math.round(valsTrim.reduce((a, b) => a + b, 0) / valsTrim.length) : null;
          const califEst = eer.eerFinal !== null ? eer.eerFinal : promAnualNum;

          if (califEst !== null) {
            evaluadosCount++;
            sumEvaluados += califEst;
            if (califEst >= 6) {
              if (gen === 'M') regM++;
              else regH++;
            } else {
              if (gen === 'M') irregM++;
              else irregH++;
            }
          }
        });

        const existenciaT = existenciaH + existenciaM;
        const regT = regH + regM;
        const irregT = irregH + irregM;
        const promAprovechamiento = evaluadosCount > 0 ? truncateTo1Dec(sumEvaluados / evaluadosCount, '') : '';
        const pctAprobacion = evaluadosCount > 0 ? `${truncateTo1Dec((regT / evaluadosCount) * 100, '')} %` : '';

        // Usar stats heredados solo cuando se pasó una única materia sin batch y el usuario está viendo stats en vivo del trimestre
        const useExternalStats = !materiasBatch && stats && stats.existenciaT > 0 && evaluadosCount === stats.totalEvaluados;

        const rowHeightStyle = sortedStudents.length > 29 ? '15.2px' : '17.4px';

        return (
          <div key={mId || pageIdx} className="cuadro-asignatura-page bg-white text-black w-full" style={{ fontSize: '9px' }}>
            {/* Encabezado Oficial */}
            <div className="flex justify-between items-end border-b-[2px] border-black pb-1 mb-1">
              <div className="flex flex-col">
                <h1 className="font-extrabold text-[12.5px] uppercase tracking-wide leading-tight">
                  Esc. Sec. Técnica N° 68 "Renacimiento"
                </h1>
                <p className="font-bold text-[9.5px] uppercase text-slate-700 leading-tight">
                  C.C.T: {config?.cct || '12DST0077B'} &bull; Acapulco de Juárez, Gro. &bull; Cuadro Concentrado Anual / Recuperación / E.E.R.
                </p>
              </div>
              <div className="text-center">
                <h2 className="font-black text-[12px] uppercase tracking-wider bg-slate-200 px-3 py-0.5 border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  {onlyRecoveryFilter
                    ? 'Relación de Alumnos en Recuperación / E.E.R. por Disciplina'
                    : 'Cuadro de Concentración y Recuperación por Disciplina'}
                </h2>
              </div>
              <div className="text-right leading-tight">
                <p className="font-bold text-[9.5px]">
                  Ciclo Escolar: <span className="underline decoration-slate-400">{config?.cicloEscolarActual || '2026 - 2027'}</span>
                </p>
                <p className="font-bold text-[9.5px] mt-0.5">
                  Corte / Trimestre:{' '}
                  <span className="inline-block border-b border-black min-w-[5.5rem] px-1 text-center font-black uppercase">
                    {trimestreLabel}
                  </span>
                </p>
              </div>
            </div>

            {/* Metadatos del Grupo y Docente */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mb-1 font-semibold text-[9.5px] px-0.5">
              <div>
                Docente:{' '}
                <span className="font-bold border-b border-black inline-block min-w-[12.5rem] px-1 uppercase text-[9px]">
                  {docenteFinal}
                </span>
              </div>
              <div>
                Disciplina:{' '}
                <span className="font-bold border-b border-black inline-block min-w-[11rem] px-1 uppercase text-[9px]">
                  {asigName}
                </span>
              </div>
              <div>
                Taller:{' '}
                <span className="font-bold border-b border-black inline-block px-1.5 text-center uppercase text-[9px]">
                  {taller}
                </span>
              </div>
              <div>
                Grado: <span className="font-bold text-[10.5px] underline">{grado}</span>
              </div>
              <div>
                Grupo: <span className="font-bold text-[10.5px] underline">"{cleanGrupo}"</span>
              </div>
              <div>
                Turno: <span className="font-bold uppercase text-[9.5px]">{turno}</span>
              </div>
            </div>

            {/* Tabla Principal de Concentración (SIN MATRÍCULA, con Ordinario + Recuperación por Periodo + E.E.R.) */}
            <table className="w-full border-collapse conc-table text-[8.8px]">
              <colgroup>
                <col style={{ width: '2.5%' }} />
                <col style={{ width: '25.5%' }} />
                <col style={{ width: '2.5%' }} />
                {/* Trimestre I */}
                <col style={{ width: '3.3%' }} />
                <col style={{ width: '3.3%' }} />
                <col style={{ width: '3.1%' }} />
                {/* Trimestre II */}
                <col style={{ width: '3.3%' }} />
                <col style={{ width: '3.3%' }} />
                <col style={{ width: '3.1%' }} />
                {/* Trimestre III */}
                <col style={{ width: '3.3%' }} />
                <col style={{ width: '3.3%' }} />
                <col style={{ width: '3.1%' }} />
                {/* Cierre Anual */}
                <col style={{ width: '3.4%' }} />
                <col style={{ width: '4.2%' }} />
                {/* Exámenes Extraordinarios E.E.R. */}
                <col style={{ width: '3.3%' }} />
                <col style={{ width: '3.3%' }} />
                <col style={{ width: '3.3%' }} />
                {/* Calif. Definitiva */}
                <col style={{ width: '4.9%' }} />
                {/* Situación / Observaciones */}
                <col style={{ width: '18.0%' }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-200 h-[17px]">
                  <th rowSpan={2} className="font-bold text-center text-[8.5px]">N°</th>
                  <th rowSpan={2} className="font-bold text-left px-1.5 uppercase tracking-wide text-[9px]">
                    Nombre del Alumno(a)
                  </th>
                  <th rowSpan={2} className="font-bold text-center text-[8px] uppercase">S</th>
                  <th colSpan={3} className={`font-extrabold text-center uppercase text-[8px] ${trimestre === 't1' ? 'bg-slate-300' : ''}`}>
                    Trimestre I
                  </th>
                  <th colSpan={3} className={`font-extrabold text-center uppercase text-[8px] ${trimestre === 't2' ? 'bg-slate-300' : ''}`}>
                    Trimestre II
                  </th>
                  <th colSpan={3} className={`font-extrabold text-center uppercase text-[8px] ${trimestre === 't3' ? 'bg-slate-300' : ''}`}>
                    Trimestre III
                  </th>
                  <th colSpan={2} className="font-extrabold text-center uppercase text-[8px] bg-slate-300">
                    Cierre Anual
                  </th>
                  <th colSpan={3} className="font-extrabold text-center uppercase text-[7.8px] bg-amber-100 text-amber-950">
                    Extraord. (E.E.R.)
                  </th>
                  <th rowSpan={2} className="font-black text-center uppercase text-[7.8px] bg-slate-300 leading-tight">
                    Calif.<br/>Def.
                  </th>
                  <th rowSpan={2} className="font-bold text-center uppercase text-[8px] leading-tight">
                    Situación / Observaciones
                  </th>
                </tr>
                <tr className="bg-slate-100 h-[14px]">
                  <th className="text-center font-bold text-[7.3px]" title="Calificación Ordinaria Trimestre I">Ord.</th>
                  <th className="text-center font-bold text-[7.3px] text-indigo-800 bg-indigo-50/70" title="Periodo de Recuperación Trimestre I">Rec.</th>
                  <th className="text-center font-bold text-[7.2px] text-slate-600" title="Faltas Trimestre I">Falt.</th>

                  <th className="text-center font-bold text-[7.3px]" title="Calificación Ordinaria Trimestre II">Ord.</th>
                  <th className="text-center font-bold text-[7.3px] text-indigo-800 bg-indigo-50/70" title="Periodo de Recuperación Trimestre II">Rec.</th>
                  <th className="text-center font-bold text-[7.2px] text-slate-600" title="Faltas Trimestre II">Falt.</th>

                  <th className="text-center font-bold text-[7.3px]" title="Calificación Ordinaria Trimestre III">Ord.</th>
                  <th className="text-center font-bold text-[7.3px] text-indigo-800 bg-indigo-50/70" title="Periodo de Recuperación Trimestre III">Rec.</th>
                  <th className="text-center font-bold text-[7.2px] text-slate-600" title="Faltas Trimestre III">Falt.</th>

                  <th className="text-center font-bold text-[7.3px]" title="Total de Faltas Anuales">T.F.</th>
                  <th className="text-center font-extrabold text-[7.3px] bg-slate-200" title="Promedio Ordinario / Recuperación">Prom.</th>

                  <th className="text-center font-bold text-[7.2px] bg-amber-50" title="1a Oportunidad E.E.R.">1° Op.</th>
                  <th className="text-center font-bold text-[7.2px] bg-amber-50" title="2a Oportunidad E.E.R.">2° Op.</th>
                  <th className="text-center font-bold text-[7.2px] bg-amber-50" title="3a Oportunidad E.E.R.">3° Op.</th>
                </tr>
              </thead>
              <tbody>
                {onlyRecoveryFilter && sortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="text-center font-bold py-5 text-slate-600 uppercase text-[9.5px] bg-slate-50">
                      Sin alumnos reprobados, en recuperación trimestral ni en E.E.R. registrados en esta asignatura.
                    </td>
                  </tr>
                ) : (
                  sortedStudents.map((student, index) => {
                  const isBaja = !student.isEmpty && (student.status || '').toLowerCase() === 'baja';
                  const isAlta = !student.isEmpty && !isBaja && student.tipoIngreso === 'Alta';
                  const rawName = student.isEmpty
                    ? ''
                    : `${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''} ${student.nombres || ''}`
                        .replace(/\s+/g, ' ')
                        .trim();
                  const fullName = rawName ? quitarAcentosNombre(rawName).toUpperCase() : '';
                  const gen = student.isEmpty ? '' : getStudentGender(student);

                  const t1 = getTrimData(student, mId, 't1', localEval);
                  const t2 = getTrimData(student, mId, 't2', localEval);
                  const t3 = getTrimData(student, mId, 't3', localEval);
                  const eer = getEERData(student, mId);

                  // Total de faltas acumuladas
                  const faltNums = [t1.faltas, t2.faltas, t3.faltas]
                    .map(v => parseInt(v, 10))
                    .filter(n => !isNaN(n));
                  const totalFaltas = faltNums.length > 0 ? String(faltNums.reduce((a, b) => a + b, 0)) : '';

                  // Promedio Ordinario / Recuperación Trimestral
                  const valsEfectivos = [t1.efectiva, t2.efectiva, t3.efectiva].filter(v => v !== null);
                  const promAnualNum =
                    valsEfectivos.length > 0
                      ? Math.round(valsEfectivos.reduce((a, b) => a + b, 0) / valsEfectivos.length)
                      : null;
                  const promAnualStr = promAnualNum !== null ? String(promAnualNum) : '';

                  // Calificación Definitiva Final
                  const califDefNum = eer.eerFinal !== null ? eer.eerFinal : promAnualNum;
                  const califDefStr =
                    califDefNum !== null
                      ? `${califDefNum}${eer.eerFinal !== null ? '*' : ''}`
                      : '';

                  // Situación / Observaciones automáticas + nota docente
                  const stEval = !student.isEmpty && localEval[student.id] ? localEval[student.id] : {};
                  const obsDocente = (stEval.observaciones || student.evaluacionDetalle?.[trimestre]?.[mId]?.observaciones || '').trim();
                  const tuvoRecTrim = t1.fueRecuperado || t2.fueRecuperado || t3.fueRecuperado;

                  let sitBadge = '';
                  let sitColorClass = 'text-slate-600';
                  if (!student.isEmpty && !isBaja) {
                    if (eer.eerFinal !== null) {
                      if (eer.eerFinal >= 6) {
                        sitBadge = 'ACRED. E.E.R.';
                        sitColorClass = 'text-amber-900 bg-amber-50 font-black';
                      } else {
                        sitBadge = 'NO ACRED. EER';
                        sitColorClass = 'text-red-800 bg-red-50 font-black';
                      }
                    } else if (califDefNum !== null) {
                      if (califDefNum >= 6) {
                        sitBadge = tuvoRecTrim ? 'RECUPERADO' : 'REGULAR';
                        sitColorClass = tuvoRecTrim ? 'text-indigo-900 bg-indigo-50/70 font-black' : 'text-emerald-900 font-extrabold';
                      } else {
                        sitBadge = valsEfectivos.length === 3 ? 'A E.E.R.' : 'IRREGULAR';
                        sitColorClass = 'text-red-700 bg-red-50 font-black';
                      }
                    }
                  }

                  const obsTextoFinal = [
                    sitBadge,
                    isAlta ? `ALTA ${student.fechaAlta || ''}`.trim() : '',
                    obsDocente
                  ]
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <tr
                      key={student.id}
                      style={{ height: rowHeightStyle }}
                      className={isBaja ? 'bg-slate-200/70 text-slate-500' : 'even:bg-slate-50/40'}
                    >
                      <td className="text-center font-bold text-slate-800 text-[8.8px] leading-none">
                        {student.numeroLista || index + 1}
                      </td>
                      <td
                        className="px-1.5 font-bold uppercase text-[8.8px] tracking-tight leading-none whitespace-nowrap overflow-hidden max-w-0"
                        title={fullName}
                      >
                        {!student.isEmpty && (
                          <div className="flex items-center justify-between gap-1 w-full max-w-full overflow-hidden">
                            <span className={`truncate block min-w-0 flex-1 ${isBaja ? 'line-through text-slate-500' : ''}`}>
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
                      <td className="text-center font-bold text-[8px] leading-none">{gen}</td>

                      {isBaja ? (
                        <>
                          <td
                            colSpan={15}
                            className="text-center font-bold text-[7.8px] tracking-[0.25em] text-slate-500 bg-slate-100/80 uppercase leading-none"
                          >
                            — B A J A {student.fechaBaja ? `(${student.fechaBaja})` : ''} —
                          </td>
                          <td className="text-center font-bold text-[7.2px] text-red-800 uppercase px-1 truncate leading-none">
                            BAJA {student.fechaBaja || ''}
                          </td>
                        </>
                      ) : (
                        <>
                          {/* T1: Ord, Rec, Falt */}
                          <td className={`text-center font-bold text-[8.8px] leading-none ${t1.ordNum !== null && t1.ordNum < 6 ? 'text-red-700 underline' : ''} ${trimestre === 't1' ? 'bg-slate-100 font-black' : ''}`}>
                            {t1.ord}
                          </td>
                          <td className="text-center font-bold text-[8.5px] text-indigo-800 bg-indigo-50/40 leading-none">
                            {t1.rec}
                          </td>
                          <td className="text-center text-[8px] text-slate-600 leading-none">{t1.faltas}</td>

                          {/* T2: Ord, Rec, Falt */}
                          <td className={`text-center font-bold text-[8.8px] leading-none ${t2.ordNum !== null && t2.ordNum < 6 ? 'text-red-700 underline' : ''} ${trimestre === 't2' ? 'bg-slate-100 font-black' : ''}`}>
                            {t2.ord}
                          </td>
                          <td className="text-center font-bold text-[8.5px] text-indigo-800 bg-indigo-50/40 leading-none">
                            {t2.rec}
                          </td>
                          <td className="text-center text-[8px] text-slate-600 leading-none">{t2.faltas}</td>

                          {/* T3: Ord, Rec, Falt */}
                          <td className={`text-center font-bold text-[8.8px] leading-none ${t3.ordNum !== null && t3.ordNum < 6 ? 'text-red-700 underline' : ''} ${trimestre === 't3' ? 'bg-slate-100 font-black' : ''}`}>
                            {t3.ord}
                          </td>
                          <td className="text-center font-bold text-[8.5px] text-indigo-800 bg-indigo-50/40 leading-none">
                            {t3.rec}
                          </td>
                          <td className="text-center text-[8px] text-slate-600 leading-none">{t3.faltas}</td>

                          {/* Cierre Anual: T.F. y Promedio */}
                          <td className="text-center text-[8px] font-semibold text-slate-700 leading-none">{totalFaltas}</td>
                          <td className={`text-center font-black text-[9px] bg-slate-100 leading-none ${promAnualNum !== null && promAnualNum < 6 ? 'text-red-700' : 'text-slate-900'}`}>
                            {promAnualStr}
                          </td>

                          {/* E.E.R. 1°, 2°, 3° Oportunidad */}
                          <td className={`text-center font-bold text-[8.5px] bg-amber-50/40 leading-none ${eer.eer1 && parseFloat(eer.eer1) < 6 ? 'text-red-700' : 'text-slate-900'}`}>
                            {eer.eer1}
                          </td>
                          <td className={`text-center font-bold text-[8.5px] bg-amber-50/40 leading-none ${eer.eer2 && parseFloat(eer.eer2) < 6 ? 'text-red-700' : 'text-slate-900'}`}>
                            {eer.eer2}
                          </td>
                          <td className={`text-center font-bold text-[8.5px] bg-amber-50/40 leading-none ${eer.eer3 && parseFloat(eer.eer3) < 6 ? 'text-red-700' : 'text-slate-900'}`}>
                            {eer.eer3}
                          </td>

                          {/* Calificación Definitiva Final */}
                          <td className={`text-center font-black text-[9.2px] bg-slate-200/70 leading-none ${califDefNum !== null && califDefNum < 6 ? 'text-red-700' : 'text-slate-950'}`}>
                            {califDefStr}
                          </td>

                          {/* Situación / Observaciones */}
                          <td className={`text-left text-[7.3px] uppercase px-1.5 truncate leading-none ${sitColorClass}`} title={obsTextoFinal}>
                            {obsTextoFinal}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>

            {/* Cuadro Estadístico Automático (Incluye Recuperación y E.E.R.) */}
            <div className="mt-1">
              <table className="w-full border-collapse stats-summary-table text-[8px] text-center">
                <thead>
                  <tr className="bg-slate-200 font-extrabold uppercase tracking-wider text-[7.5px] leading-tight">
                    <th colSpan={3} className="w-[20%]">Existencia (Activos)</th>
                    <th colSpan={3} className="w-[21%]">Regulares / Aprobados (&ge; 6)</th>
                    <th colSpan={3} className="w-[21%]">Irregulares / Reprobados (&lt; 6)</th>
                    <th colSpan={2} className="w-[16%] bg-indigo-100 text-indigo-950">Recuperación / E.E.R.</th>
                    <th rowSpan={2} className="w-[11%]">Promedio de<br/>Aprovechamiento</th>
                    <th rowSpan={2} className="w-[11%]">% de<br/>Aprobación</th>
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
                    <th className="bg-indigo-50 text-indigo-900">Rec. Trim.</th>
                    <th className="bg-amber-50 text-amber-900">Acred. EER</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-[17px] font-bold text-[9px] leading-none">
                    <td>{existenciaH}</td>
                    <td>{existenciaM}</td>
                    <td className="bg-slate-100 font-black">{existenciaT}</td>
                    <td>{useExternalStats ? stats.regularesH : (evaluadosCount > 0 ? regH : '')}</td>
                    <td>{useExternalStats ? stats.regularesM : (evaluadosCount > 0 ? regM : '')}</td>
                    <td className="bg-slate-100 font-black text-emerald-900">
                      {useExternalStats ? stats.regularesT : (evaluadosCount > 0 ? regT : '')}
                    </td>
                    <td>{useExternalStats ? stats.irregularesH : (evaluadosCount > 0 ? irregH : '')}</td>
                    <td>{useExternalStats ? stats.irregularesM : (evaluadosCount > 0 ? irregM : '')}</td>
                    <td className="bg-slate-100 font-black text-red-800">
                      {useExternalStats ? stats.irregularesT : (evaluadosCount > 0 ? irregT : '')}
                    </td>
                    <td className="bg-indigo-50/50 font-black text-indigo-900">{recuperadosTrimCount > 0 ? recuperadosTrimCount : (evaluadosCount > 0 ? 0 : '')}</td>
                    <td className="bg-amber-50/50 font-black text-amber-900">{acreditadosEERCount > 0 ? acreditadosEERCount : (evaluadosCount > 0 ? 0 : '')}</td>
                    <td className="font-black text-[9.5px]">
                      {useExternalStats ? stats.promedioAprovechamiento : promAprovechamiento}
                    </td>
                    <td className="font-black text-[9.5px]">
                      {useExternalStats
                        ? (stats.porcentajeAprobacion !== '' ? `${stats.porcentajeAprobacion} %` : '%')
                        : (pctAprobacion || '%')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Nota aclaratoria al pie */}
            <div className="flex justify-between items-center text-[7px] text-slate-600 mt-0.5 px-0.5">
              <span>
                <strong>Simbología:</strong> <strong>Ord.</strong> = Calificación Ordinaria | <strong>Rec.</strong> = Periodo de Recuperación Trimestral | <strong>Falt. / T.F.</strong> = Faltas | <strong>E.E.R.</strong> = Exámenes Extraordinarios de Regularización (* = Regularizado en E.E.R.)
              </span>
            </div>

            {/* Firmas de Autorización - Estilo SEP */}
            <div className="flex justify-around items-end mt-3.5 pt-1 px-10">
              <div className="text-center w-56 border-t border-black pt-0.5">
                {docenteFinal ? (
                  <>
                    <p className="font-bold text-[9px] uppercase leading-tight">{docenteFinal}</p>
                    <p className="text-[8px] text-slate-600 font-semibold uppercase leading-tight">Firma del Docente</p>
                  </>
                ) : (
                  <p className="font-bold text-[9px] uppercase leading-tight">Firma del Docente</p>
                )}
              </div>
              <div className="text-center w-56 border-t border-black pt-0.5">
                {turno === 'Matutino' ? (
                  <>
                    <p className="font-bold text-[9px] uppercase leading-tight">
                      {config?.coordinadorMatutino || 'Profra. Lucila Rodríguez Martínez'}
                    </p>
                    <p className="text-[8px] text-slate-600 font-semibold uppercase leading-tight">
                      Vo. Bo. Coordinación Académica
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-[9px] uppercase leading-tight">
                      {config?.coordinadorVespertino || 'Profr. José Barrera Vázquez'}
                    </p>
                    <p className="text-[8px] text-slate-600 font-semibold uppercase leading-tight">
                      Vo. Bo. Coordinación Académica
                    </p>
                  </>
                )}
              </div>
              <div className="text-center w-56 border-t border-black pt-0.5">
                <p className="font-bold text-[9px] uppercase leading-tight">
                  {config?.directorName || 'Prof. Juan Carlos Taboada Barajas'}
                </p>
                <p className="text-[8px] text-slate-600 font-semibold uppercase leading-tight">Director del Plantel</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
