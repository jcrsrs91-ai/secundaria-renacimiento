import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Save,
  Lock,
  Unlock,
  QrCode,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  X,
  RotateCcw,
  BarChart3
} from 'lucide-react';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useGlobalConfig } from '../hooks/useGlobalConfig';
import { useAuth } from '../context/AuthContext';
import { registrarMovimiento } from '../utils/bitacora';
import { parseFechaFlexible } from '../utils/dateRules';
import { truncateTo1Dec } from '../utils/format';
import {
  GRADOS_SEG,
  TURNOS_SEG,
  GRADO_LABELS,
  MOMENTOS_SEG,
  CAMPOS_FORMATIVOS_SEG,
  formatearFechaLargaSEG,
  calcularMatriculaMomento,
  calcularAprovechamientoMomento,
  calcularDesempenoMomento,
  calcularAsistenciaDesdeQR,
  construirTablaAsistencia
} from '../utils/momentosValoracionCalc';
import { exportarMomentosValoracionExcel } from '../utils/exportMomentosExcel';
import MomentosGraficasCTE from './MomentosGraficasCTE';

const buildDefaultMeta = (mId, config) => {
  const ciclo = config?.cicloEscolarActual || '2026-2027';
  const defFechas = (MOMENTOS_SEG[mId] || MOMENTOS_SEG[1]).getDefaultFechas(ciclo);
  return {
    cicloEscolar: ciclo,
    departamento: 'TÉCNICAS',
    escuelaNombre: 'TÉCNICA N° 68 "RENACIMIENTO"',
    cct: config?.cct || '12DST0077B',
    zonaEscolar: '24',
    localidad: 'ACAPULCO DE JUÁREZ',
    municipio: 'ACAPULCO DE JUÁREZ',
    region: 'ACAPULCO - COYUCA',
    director: config?.directorName || 'PROFR. JUAN CARLOS TABOADA BARAJAS',
    totalDocentes: 30,
    fechaInicio: defFechas.fechaInicio,
    fechaCorte: defFechas.fechaCorte,
    fechaEmision: new Date().toISOString().split('T')[0]
  };
};

const buildDefaultStore = (config) => ({
  m1: { meta: buildDefaultMeta(1, config), asistenciaManual: {}, autoSinFaltas: true, qrResumen: null, congelado: null },
  m2: { meta: buildDefaultMeta(2, config), asistenciaManual: {}, autoSinFaltas: true, qrResumen: null, congelado: null },
  m3: { meta: buildDefaultMeta(3, config), asistenciaManual: {}, autoSinFaltas: true, qrResumen: null, congelado: null }
});

const fmtPct = (v) => `${(Number(v) || 0).toFixed(1)}%`;
const fmtDec = (v) => (v === null || v === undefined || isNaN(v) ? '-' : truncateTo1Dec(v, '-'));

export default function MomentosValoracion({ alumnos = [], onClose }) {
  const { config } = useGlobalConfig();
  const { currentUser } = useAuth();

  const [momentoId, setMomentoId] = useState(1);
  const [activeSheet, setActiveSheet] = useState('matricula'); // 'matricula' | 'aprovechamiento' | 'desempeno' | 'asistencia'
  const [store, setStore] = useState(() => buildDefaultStore(config));
  const [loadingCloud, setLoadingCloud] = useState(true);
  const [savingCloud, setSavingCloud] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showMetaPanel, setShowMetaPanel] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [includeChartsInPrint, setIncludeChartsInPrint] = useState(true);
  const [printScope, setPrintScope] = useState(null); // null | 'active' | 'all'

  const cicloKey = useMemo(() => {
    const clean = String(config?.cicloEscolarActual || '2026-2027').replace(/[^0-9-]/g, '');
    return clean || '2026-2027';
  }, [config?.cicloEscolarActual]);

  const docId = `momentos_valoracion_${cicloKey}`;
  const momentoCfg = MOMENTOS_SEG[momentoId] || MOMENTOS_SEG[1];
  const mKey = momentoCfg.key;

  // Cargar datos históricos/guardados desde Firestore (1 única lectura al abrir)
  useEffect(() => {
    let active = true;
    const cargarMomentos = async () => {
      setLoadingCloud(true);
      const base = buildDefaultStore(config);
      try {
        const snap = await getDoc(doc(db, 'configuracion', docId));
        if (active && snap.exists()) {
          const data = snap.data() || {};
          ['m1', 'm2', 'm3'].forEach((k, idx) => {
            if (data[k]) {
              base[k] = {
                meta: { ...buildDefaultMeta(idx + 1, config), ...(data[k].meta || {}) },
                asistenciaManual: data[k].asistenciaManual || {},
                autoSinFaltas: data[k].autoSinFaltas !== false,
                qrResumen: data[k].qrResumen || null,
                congelado: data[k].congelado || null
              };
            }
          });
        }
      } catch (err) {
        console.error('Error cargando Momentos de Valoración:', err);
      } finally {
        if (active) {
          setStore(base);
          setLoadingCloud(false);
        }
      }
    };
    cargarMomentos();
    return () => {
      active = false;
    };
  }, [docId, config?.cicloEscolarActual]);

  useEffect(() => {
    const onAfterPrint = () => setPrintScope(null);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  const currentMoment = store[mKey] || buildDefaultStore(config)[mKey];
  const meta = currentMoment.meta;
  const isFrozen = Boolean(currentMoment.congelado);

  // Cálculos en vivo a partir de alumnos reales + fecha de corte
  const liveMatricula = useMemo(
    () => calcularMatriculaMomento(alumnos, meta.fechaCorte),
    [alumnos, meta.fechaCorte]
  );

  const liveAprovechamiento = useMemo(
    () => calcularAprovechamientoMomento(liveMatricula.existenciaAlumnos, momentoId),
    [liveMatricula.existenciaAlumnos, momentoId]
  );

  const liveDesempeno = useMemo(
    () => calcularDesempenoMomento(liveMatricula.existenciaAlumnos, momentoId),
    [liveMatricula.existenciaAlumnos, momentoId]
  );

  const liveAsistencia = useMemo(
    () => construirTablaAsistencia(liveMatricula, currentMoment.asistenciaManual, currentMoment.autoSinFaltas),
    [liveMatricula, currentMoment.asistenciaManual, currentMoment.autoSinFaltas]
  );

  // Datos activos en pantalla / exportación (Congelado si ya se cerró el momento, o En Vivo)
  const matriculaData = isFrozen ? currentMoment.congelado.matricula : liveMatricula;
  const aprovechamientoData = isFrozen ? currentMoment.congelado.aprovechamiento : liveAprovechamiento;
  const desempenoData = isFrozen ? currentMoment.congelado.desempeno : liveDesempeno;
  const asistenciaData = isFrozen ? currentMoment.congelado.asistencia : liveAsistencia;

  const updateMomentField = (updater) => {
    setStore((prev) => ({
      ...prev,
      [mKey]: typeof updater === 'function' ? updater(prev[mKey]) : { ...prev[mKey], ...updater }
    }));
  };

  const updateMetaField = (field, value) => {
    updateMomentField((cur) => ({
      ...cur,
      meta: { ...cur.meta, [field]: value }
    }));
  };

  const persistStore = async (nextStore, accionBitacora, detalleBitacora, successMsg) => {
    setSavingCloud(true);
    try {
      await setDoc(
        doc(db, 'configuracion', docId),
        {
          ...nextStore,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.email || 'Desconocido'
        },
        { merge: true }
      );
      if (accionBitacora) {
        await registrarMovimiento(
          currentUser?.email,
          'Control Escolar (Momentos SEG)',
          accionBitacora,
          detalleBitacora
        );
      }
      if (successMsg) toast.success(successMsg);
      return true;
    } catch (err) {
      console.error('Error guardando Momentos de Valoración:', err);
      toast.error('No se pudo guardar en Firestore.');
      return false;
    } finally {
      setSavingCloud(false);
    }
  };

  const handleSaveFreezeMoment = async () => {
    const matriculaSerializable = {
      filas: liveMatricula.filas,
      totalesGrado: liveMatricula.totalesGrado,
      totalEscuela: liveMatricula.totalEscuela
    };
    const nextMomentState = {
      ...currentMoment,
      congelado: {
        frozenAt: new Date().toISOString(),
        frozenBy: currentUser?.email || 'Desconocido',
        matricula: matriculaSerializable,
        aprovechamiento: liveAprovechamiento,
        desempeno: liveDesempeno,
        asistencia: liveAsistencia
      }
    };
    const nextStore = { ...store, [mKey]: nextMomentState };
    setStore(nextStore);
    await persistStore(
      nextStore,
      `Congelar ${momentoCfg.corto}`,
      `Guardó y congeló las 4 hojas del ${momentoCfg.corto} (${meta.cicloEscolar}) con corte al ${meta.fechaCorte}.`,
      `🔒 ${momentoCfg.corto} guardado y congelado correctamente.`
    );
  };

  const handleUnfreezeMoment = async () => {
    if (!window.confirm(`¿Deseas desbloquear el ${momentoCfg.corto} para recalcular sus datos en vivo desde los expedientes actuales?\n\n(La asistencia manual capturada se conservará intacta).`)) {
      return;
    }
    const nextMomentState = { ...currentMoment, congelado: null };
    const nextStore = { ...store, [mKey]: nextMomentState };
    setStore(nextStore);
    await persistStore(
      nextStore,
      `Descongelar ${momentoCfg.corto}`,
      `Regresó el ${momentoCfg.corto} (${meta.cicloEscolar}) a cálculo en vivo.`,
      `🔓 ${momentoCfg.corto} regresado a modo en vivo.`
    );
  };

  const handleSaveAsistenciaAndMeta = async () => {
    await persistStore(
      store,
      null,
      null,
      `💾 Datos de encabezado y asistencia del ${momentoCfg.corto} guardados.`
    );
  };

  const handleAsistenciaCellChange = (key, field, rawVal) => {
    const num = Math.max(0, parseInt(rawVal || '0', 10) || 0);
    updateMomentField((cur) => ({
      ...cur,
      asistenciaManual: {
        ...cur.asistenciaManual,
        [key]: {
          ...(cur.asistenciaManual?.[key] || {}),
          [field]: num
        }
      }
    }));
  };

  const handleCalcularAsistenciaQR = async () => {
    if (isFrozen) {
      toast.error('Descongela el momento primero para recalcular desde QR.');
      return;
    }
    const fInicioObj = parseFechaFlexible(meta.fechaInicio);
    const fCorteObj = parseFechaFlexible(meta.fechaCorte);
    if (!fInicioObj || !fCorteObj) {
      toast.error('Define primero fechas válidas de Inicio y Corte en "Datos / Fechas".');
      return;
    }
    const inicioTs = Timestamp.fromDate(new Date(fInicioObj.getFullYear(), fInicioObj.getMonth(), fInicioObj.getDate(), 0, 0, 0));
    const finTs = Timestamp.fromDate(new Date(fCorteObj.getFullYear(), fCorteObj.getMonth(), fCorteObj.getDate(), 23, 59, 59));

    setLoadingQR(true);
    try {
      const qAsis = query(
        collection(db, 'asistencias'),
        where('timestamp', '>=', inicioTs),
        where('timestamp', '<=', finTs)
      );
      const snap = await getDocs(qAsis);
      const registros = snap.docs.map((d) => d.data());
      const resQR = calcularAsistenciaDesdeQR(
        liveMatricula.existenciaAlumnos,
        registros,
        meta.fechaInicio,
        meta.fechaCorte
      );

      updateMomentField((cur) => ({
        ...cur,
        asistenciaManual: resQR.rawByKey,
        qrResumen: {
          diasEscaneados: resQR.diasEscaneados,
          totalEntradas: resQR.totalEntradas,
          calculatedAt: new Date().toISOString()
        }
      }));

      if (resQR.totalEntradas === 0) {
        toast('No se encontraron escaneos QR en ese rango de fechas; puedes capturar las cifras manualmente.', { icon: 'ℹ️' });
      } else {
        toast.success(
          `QR aplicado (${resQR.totalEntradas} entradas): Matutino ${resQR.diasEscaneados.Matutino} días · Vespertino ${resQR.diasEscaneados.Vespertino} días.`
        );
      }
    } catch (err) {
      console.error('Error consultando QR:', err);
      toast.error('No se pudieron leer los registros del escáner QR.');
    } finally {
      setLoadingQR(false);
    }
  };

  const handleClearAsistencia = () => {
    if (isFrozen) return;
    updateMomentField((cur) => ({
      ...cur,
      asistenciaManual: {},
      qrResumen: null
    }));
    toast('Conteos de inasistencia reiniciados a 0.');
  };

  const handleDownloadExcel = async () => {
    setExportingExcel(true);
    try {
      const filename = await exportarMomentosValoracionExcel({
        momentoId,
        meta,
        matricula: matriculaData,
        aprovechamiento: aprovechamientoData,
        desempeno: desempenoData,
        asistencia: asistenciaData
      });
      toast.success(`Excel generado: ${filename}`);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      toast.error('No se pudo generar el archivo Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const triggerPrint = (scope) => {
    setPrintScope(scope);
    setTimeout(() => {
      window.print();
    }, 180);
  };

  const renderOfficialSheetHeader = (sheetTitle) => (
    <div className="mb-3 print:mb-2 text-slate-900">
      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-2">
        <img src="/logo-sep.png" alt="SEP" className="h-12 w-auto object-contain print:h-9" />
        <div className="text-center flex-1 px-2 leading-tight">
          <p className="text-[11px] font-bold uppercase tracking-wide">SECRETARÍA DE EDUCACIÓN</p>
          <p className="text-[10px] font-bold uppercase">SUBSECRETARÍA DE EDUCACIÓN BÁSICA</p>
          <p className="text-[10px] font-bold uppercase">DIRECCIÓN GENERAL DE EDUCACIÓN SECUNDARIA</p>
          <p className="text-[10px] font-semibold uppercase text-slate-700">
            DEPARTAMENTO DE SECUNDARIAS: <span className="font-bold text-slate-900">{meta.departamento || 'TÉCNICAS'}</span>
          </p>
          <h3 className="text-xs sm:text-sm font-black uppercase mt-1 tracking-wide text-slate-900">
            {momentoCfg.titulo}. CICLO ESCOLAR {meta.cicloEscolar}
          </h3>
        </div>
        <img src="/logo-escuela.png" alt="Escuela" className="h-12 w-auto object-contain print:h-9" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-[10px] bg-slate-50 print:bg-white border border-slate-300 rounded-md px-3 py-1.5 uppercase">
        <div>
          <span className="font-bold">ESCUELA SECUNDARIA:</span> {meta.escuelaNombre}
        </div>
        <div>
          <span className="font-bold">C.C.T.:</span> {meta.cct}
        </div>
        <div>
          <span className="font-bold">ZONA ESCOLAR:</span> {meta.zonaEscolar}
        </div>
        <div>
          <span className="font-bold">LOCALIDAD:</span> {meta.localidad}
        </div>
        <div>
          <span className="font-bold">MPIO.:</span> {meta.municipio}
        </div>
        <div>
          <span className="font-bold">REGIÓN:</span> {meta.region}
        </div>
        <div className="sm:col-span-2">
          <span className="font-bold">NOMBRE DEL DIRECTOR (A):</span> {meta.director}
        </div>
        <div>
          <span className="font-bold">TOTAL DE DOCENTES:</span> {meta.totalDocentes}
        </div>
      </div>

      <h4 className="text-center font-black text-xs sm:text-sm uppercase tracking-wider mt-2.5 py-1 bg-slate-800 text-white print:bg-slate-200 print:text-black rounded-t border border-slate-800">
        {sheetTitle}
      </h4>
    </div>
  );

  const renderOfficialFooter = (notaExtra = null) => (
    <div className="mt-4 print:mt-3 text-slate-800">
      {notaExtra && (
        <p className="text-[10px] italic text-slate-600 mb-4 print:mb-3">{notaExtra}</p>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 text-[11px] font-bold uppercase">
        <div>
          FECHA: <span className="underline decoration-dotted">{formatearFechaLargaSEG(meta.fechaEmision) || '________________________'}</span>
        </div>
        <div className="text-center w-64 mx-auto sm:mx-0">
          <div className="border-t border-slate-800 pt-1">FIRMA Y SELLO</div>
        </div>
      </div>
    </div>
  );

  const renderCTECharts = (sheetKey) => {
    if (!showCharts) return null;
    if (activeSheet !== sheetKey && printScope !== 'all') return null;
    return (
      <div
        className={`mt-6 pt-5 border-t-2 border-dashed border-slate-200 break-inside-avoid ${
          includeChartsInPrint ? '' : 'print:hidden'
        }`}
      >
        <MomentosGraficasCTE
          sheet={sheetKey}
          matricula={matriculaData}
          aprovechamiento={aprovechamientoData}
          desempeno={desempenoData}
          asistencia={asistenciaData}
          momentoTitulo={momentoCfg.corto}
          cicloEscolar={meta.cicloEscolar}
        />
      </div>
    );
  };

  const corteLabel = formatearFechaLargaSEG(meta.fechaCorte) || meta.fechaCorte;

  const isSheetVisible = (sheetKey) => {
    if (activeSheet === sheetKey || printScope === 'all') return 'block';
    return 'hidden print:hidden';
  };

  const sheetBreakClass = (isLast = false) =>
    printScope === 'all' && !isLast ? 'print:break-after-page' : '';

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          @page { size: letter landscape; margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
        }
      `}</style>

      {/* PANEL SUPERIOR DE CONTROL (NO SE IMPRIME) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-4 no-print print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-white">
                Momentos de Valoración (SEG)
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                  isFrozen
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                }`}
              >
                {isFrozen ? (
                  <>
                    <Lock className="w-3 h-3" /> Momento Congelado
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" /> Cálculo en Vivo
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Ciclo {meta.cicloEscolar} · Corte al <strong className="text-white">{corteLabel}</strong>
              {isFrozen && currentMoment.congelado?.frozenAt && (
                <span className="ml-2 text-amber-300">
                  (Guardado el {new Date(currentMoment.congelado.frozenAt).toLocaleDateString('es-MX')})
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMetaPanel((v) => !v)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" /> Datos / Fechas
            </button>
            <button
              type="button"
              onClick={() => setShowCharts((v) => !v)}
              className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition ${
                showCharts
                  ? 'bg-indigo-500/25 text-indigo-200 border-indigo-400/50 hover:bg-indigo-500/35'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Mostrar u ocultar las gráficas ejecutivas para Consejo Técnico Escolar"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-300" />
              {showCharts ? 'Gráficas CTE: Visibles' : 'Gráficas CTE: Ocultas'}
            </button>
            {showCharts && (
              <label className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeChartsInPrint}
                  onChange={(e) => setIncludeChartsInPrint(e.target.checked)}
                  className="rounded border-slate-500 text-indigo-500"
                />
                Imprimir gráficas
              </label>
            )}
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={exportingExcel || loadingCloud}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {exportingExcel ? 'Generando...' : 'Descargar Excel (.xlsx — 4 Hojas)'}
            </button>
            <button
              type="button"
              onClick={() => triggerPrint('active')}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Hoja
            </button>
            <button
              type="button"
              onClick={() => triggerPrint('all')}
              className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir 4 Hojas
            </button>
            {isFrozen ? (
              <button
                type="button"
                onClick={handleUnfreezeMoment}
                disabled={savingCloud}
                className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition"
              >
                <Unlock className="w-3.5 h-3.5" /> Volver a Vivo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveFreezeMoment}
                disabled={savingCloud || loadingCloud}
                className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition"
              >
                <Save className="w-3.5 h-3.5" /> Guardar / Congelar Momento
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Selector de Momentos (1°, 2°, 3°) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800">
          {[1, 2, 3].map((mNum) => {
            const cfg = MOMENTOS_SEG[mNum];
            const mObj = store[cfg.key];
            const frozen = Boolean(mObj?.congelado);
            const active = momentoId === mNum;
            return (
              <button
                key={mNum}
                type="button"
                onClick={() => setMomentoId(mNum)}
                className={`px-3.5 py-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  active
                    ? 'bg-white text-slate-900 border-white shadow-md'
                    : 'bg-slate-800/70 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div>
                  <p className="text-xs font-black uppercase">{cfg.corto}</p>
                  <p className={`text-[10px] ${active ? 'text-slate-500' : 'text-slate-400'}`}>
                    Corte: {formatearFechaLargaSEG(mObj?.meta?.fechaCorte) || mObj?.meta?.fechaCorte}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    frozen
                      ? 'bg-amber-500/20 text-amber-600 border border-amber-400/40'
                      : active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {frozen ? '🔒 Congelado' : 'En vivo'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Panel Editable de Encabezado y Fechas */}
        {showMetaPanel && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Departamento Sec.</label>
              <input
                type="text"
                disabled={isFrozen}
                value={meta.departamento}
                onChange={(e) => updateMetaField('departamento', e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-white font-semibold disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Total Docentes</label>
              <input
                type="number"
                min="1"
                disabled={isFrozen}
                value={meta.totalDocentes}
                onChange={(e) => updateMetaField('totalDocentes', parseInt(e.target.value || '0', 10) || 0)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-white font-semibold disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Inicio Periodo (QR)</label>
              <input
                type="date"
                disabled={isFrozen}
                value={meta.fechaInicio}
                onChange={(e) => updateMetaField('fechaInicio', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-white font-semibold scheme-dark disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Fecha Corte (Altas/Bajas/QR)</label>
              <input
                type="date"
                disabled={isFrozen}
                value={meta.fechaCorte}
                onChange={(e) => updateMetaField('fechaCorte', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-white font-semibold scheme-dark disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Fecha Firma / Emisión</label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={meta.fechaEmision}
                  onChange={(e) => updateMetaField('fechaEmision', e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded bg-slate-900 border border-slate-600 text-white font-semibold scheme-dark"
                />
                <button
                  type="button"
                  onClick={handleSaveAsistenciaAndMeta}
                  disabled={savingCloud}
                  className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold shrink-0"
                  title="Guardar fechas y encabezado"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUB-PESTAÑAS DE LAS 4 HOJAS OFICIALES */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs no-print print:hidden">
        {[
          { id: 'matricula', label: '1. Matrícula General' },
          { id: 'aprovechamiento', label: '2. Aprovechamiento (Promedios)' },
          { id: 'desempeno', label: '3. Desempeño Alcanzado' },
          { id: 'asistencia', label: '4. Asistencia (QR / Manual)' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSheet(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
              activeSheet === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =================================================================
          HOJA 1: MATRÍCULA GENERAL
         ================================================================= */}
      <section className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-0 print:p-0 ${isSheetVisible('matricula')} ${sheetBreakClass(false)}`}>
        {renderOfficialSheetHeader('MATRÍCULA GENERAL')}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-slate-400 text-xs print:text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold text-center">
                <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">GRADO</th>
                <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">TURNO</th>
                <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">N° GRUPOS</th>
                <th colSpan="3" className="border border-slate-400 px-2 py-1">INSCRIPCIÓN INICIAL (al 30 sep)</th>
                <th colSpan="3" className="border border-slate-400 px-2 py-1">ALTAS (al {corteLabel})</th>
                <th colSpan="3" className="border border-slate-400 px-2 py-1">BAJAS (al {corteLabel})</th>
                <th colSpan="3" className="border border-slate-400 px-2 py-1 bg-emerald-50">EXISTENCIA</th>
                <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">% BAJAS<br /><span className="text-[9px] font-normal">Bajas / (Inic.+Altas)</span></th>
              </tr>
              <tr className="bg-slate-50 text-slate-700 font-bold text-center">
                <th className="border border-slate-400 px-1.5 py-1">H</th>
                <th className="border border-slate-400 px-1.5 py-1">M</th>
                <th className="border border-slate-400 px-1.5 py-1">TOTAL</th>
                <th className="border border-slate-400 px-1.5 py-1">H</th>
                <th className="border border-slate-400 px-1.5 py-1">M</th>
                <th className="border border-slate-400 px-1.5 py-1">TOTAL</th>
                <th className="border border-slate-400 px-1.5 py-1">H</th>
                <th className="border border-slate-400 px-1.5 py-1">M</th>
                <th className="border border-slate-400 px-1.5 py-1">TOTAL</th>
                <th className="border border-slate-400 px-1.5 py-1 bg-emerald-50">H</th>
                <th className="border border-slate-400 px-1.5 py-1 bg-emerald-50">M</th>
                <th className="border border-slate-400 px-1.5 py-1 bg-emerald-100">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {TURNOS_SEG.map((turno) =>
                GRADOS_SEG.map((grado) => {
                  const d = matriculaData.filas[`${grado}-${turno}`];
                  return (
                    <tr key={`${grado}-${turno}`} className="hover:bg-slate-50 text-center">
                      <td className="border border-slate-400 px-2 py-1.5 text-left font-bold">{GRADO_LABELS[grado]}</td>
                      <td className="border border-slate-400 px-2 py-1.5 text-left">{turno.toUpperCase()}</td>
                      <td className="border border-slate-400 px-2 py-1.5 font-semibold">{d.grupos}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5">{d.inicial.h}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5">{d.inicial.m}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 font-bold bg-slate-50">{d.inicial.t}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5">{d.altas.h}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5">{d.altas.m}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 font-bold bg-slate-50">{d.altas.t}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-rose-700">{d.bajas.h}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-rose-700">{d.bajas.m}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 font-bold text-rose-800 bg-rose-50/60">{d.bajas.t}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-emerald-700">{d.existencia.h}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-emerald-700">{d.existencia.m}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 font-black text-emerald-900 bg-emerald-50">{d.existencia.t}</td>
                      <td className="border border-slate-400 px-2 py-1.5 font-bold">{fmtPct(d.pctBajas)}</td>
                    </tr>
                  );
                })
              )}
              {GRADOS_SEG.map((grado, idx) => {
                const d = matriculaData.totalesGrado[grado];
                return (
                  <tr key={`tot-${grado}`} className="bg-blue-50/70 font-bold text-center">
                    {idx === 0 && (
                      <td rowSpan="3" className="border border-slate-400 px-2 py-1.5 text-left font-black bg-blue-100/70">
                        TOTALES POR GRADO
                      </td>
                    )}
                    <td className="border border-slate-400 px-2 py-1.5 text-left">{GRADO_LABELS[grado]}</td>
                    <td className="border border-slate-400 px-2 py-1.5">{d.grupos}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.inicial.h}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.inicial.m}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.inicial.t}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.altas.h}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.altas.m}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.altas.t}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.bajas.h}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.bajas.m}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.bajas.t}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.existencia.h}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.existencia.m}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{d.existencia.t}</td>
                    <td className="border border-slate-400 px-2 py-1.5">{fmtPct(d.pctBajas)}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-200 font-black text-slate-900 text-center border-t-2 border-slate-800">
                <td colSpan="2" className="border border-slate-500 px-2 py-2 text-left">TOTAL DE LA ESCUELA</td>
                <td className="border border-slate-500 px-2 py-2">{matriculaData.totalEscuela.grupos}</td>
                <td className="border border-slate-500 px-1.5 py-2">{matriculaData.totalEscuela.inicial.h}</td>
                <td className="border border-slate-500 px-1.5 py-2">{matriculaData.totalEscuela.inicial.m}</td>
                <td className="border border-slate-500 px-1.5 py-2">{matriculaData.totalEscuela.inicial.t}</td>
                <td className="border border-slate-500 px-1.5 py-2">{matriculaData.totalEscuela.altas.h}</td>
                <td className="border border-slate-500 px-1.5 py-2">{matriculaData.totalEscuela.altas.m}</td>
                <td className="border border-slate-500 px-1.5 py-2">{matriculaData.totalEscuela.altas.t}</td>
                <td className="border border-slate-500 px-1.5 py-2 text-rose-800">{matriculaData.totalEscuela.bajas.h}</td>
                <td className="border border-slate-500 px-1.5 py-2 text-rose-800">{matriculaData.totalEscuela.bajas.m}</td>
                <td className="border border-slate-500 px-1.5 py-2 text-rose-900">{matriculaData.totalEscuela.bajas.t}</td>
                <td className="border border-slate-500 px-1.5 py-2 text-emerald-900">{matriculaData.totalEscuela.existencia.h}</td>
                <td className="border border-slate-500 px-1.5 py-2 text-emerald-900">{matriculaData.totalEscuela.existencia.m}</td>
                <td className="border border-slate-500 px-1.5 py-2 text-emerald-950">{matriculaData.totalEscuela.existencia.t}</td>
                <td className="border border-slate-500 px-2 py-2">{fmtPct(matriculaData.totalEscuela.pctBajas)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {renderOfficialFooter()}
        {renderCTECharts('matricula')}
      </section>

      {/* =================================================================
          HOJA 2: APROVECHAMIENTO (PROMEDIOS)
         ================================================================= */}
      <section className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-0 print:p-0 ${isSheetVisible('aprovechamiento')} ${sheetBreakClass(false)}`}>
        {aprovechamientoData.alumnosSinCalificacion > 0 && (
          <div className="mb-3 bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 no-print print:hidden">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Atención: Hay <strong>{aprovechamientoData.alumnosSinCalificacion}</strong> alumno(s) en existencia sin ninguna calificación capturada en los trimestres de este Momento.
            </span>
          </div>
        )}
        {renderOfficialSheetHeader('APROVECHAMIENTO (PROMEDIOS) — CAMPOS FORMATIVOS')}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-slate-400 text-[10px] print:text-[8px]">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-black text-center">
                <th rowSpan="3" className="border border-slate-400 px-2 py-1">TURNO</th>
                <th colSpan="10" className="border border-slate-400 px-1 py-1">PRIMER GRADO</th>
                <th rowSpan="3" className="border border-slate-400 px-1 py-1 bg-indigo-100">PROM.<br />1°</th>
                <th colSpan="9" className="border border-slate-400 px-1 py-1">SEGUNDO GRADO</th>
                <th rowSpan="3" className="border border-slate-400 px-1 py-1 bg-indigo-100">PROM.<br />2°</th>
                <th colSpan="9" className="border border-slate-400 px-1 py-1">TERCER GRADO</th>
                <th rowSpan="3" className="border border-slate-400 px-1 py-1 bg-indigo-100">PROM.<br />3°</th>
                <th rowSpan="3" className="border border-slate-400 px-1.5 py-1 bg-slate-800 text-white print:bg-slate-300 print:text-black">PROM. GRAL<br />ESCUELA</th>
              </tr>
              <tr className="bg-slate-100 text-slate-800 font-bold text-center text-[9px] print:text-[7px]">
                {GRADOS_SEG.map((g) =>
                  CAMPOS_FORMATIVOS_SEG[g].map((cf) => (
                    <th key={`${g}-${cf.campo}`} colSpan={cf.materias.length} className="border border-slate-400 px-1 py-1">
                      {cf.campo}
                    </th>
                  ))
                )}
              </tr>
              <tr className="bg-slate-50 text-slate-700 font-bold text-center text-[9px] print:text-[6.5px]">
                {GRADOS_SEG.map((g) =>
                  CAMPOS_FORMATIVOS_SEG[g]
                    .flatMap((cf) => cf.materias)
                    .map((mat) => (
                      <th key={mat.id} className="border border-slate-400 px-1 py-1.5 leading-tight">
                        {mat.label}
                      </th>
                    ))
                )}
              </tr>
            </thead>
            <tbody>
              {TURNOS_SEG.map((turno) => {
                const tData = aprovechamientoData.turnos[turno];
                return (
                  <tr key={turno} className="text-center hover:bg-slate-50">
                    <td className="border border-slate-400 px-2 py-2 text-left font-bold">{turno.toUpperCase()}</td>
                    {GRADOS_SEG.map((g) => {
                      const mats = CAMPOS_FORMATIVOS_SEG[g].flatMap((cf) => cf.materias);
                      return (
                        <React.Fragment key={`${turno}-${g}`}>
                          {mats.map((m) => (
                            <td key={m.id} className="border border-slate-400 px-1 py-2">
                              {fmtDec(tData.materias[m.id])}
                            </td>
                          ))}
                          <td className="border border-slate-400 px-1 py-2 font-black bg-indigo-50">
                            {fmtDec(tData.promGrado[g])}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="border border-slate-400 px-1.5 py-2 font-black bg-indigo-100">
                      {fmtDec(tData.promTurno)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-200 font-black text-center border-t-2 border-slate-800">
                <td className="border border-slate-500 px-2 py-2 text-left">PROM. GRAL DE ESCUELA</td>
                {GRADOS_SEG.map((g) => {
                  const mats = CAMPOS_FORMATIVOS_SEG[g].flatMap((cf) => cf.materias);
                  return (
                    <React.Fragment key={`esc-${g}`}>
                      {mats.map((m) => (
                        <td key={m.id} className="border border-slate-500 px-1 py-2">
                          {fmtDec(aprovechamientoData.escuela.materias[m.id])}
                        </td>
                      ))}
                      <td className="border border-slate-500 px-1 py-2 bg-indigo-100">
                        {fmtDec(aprovechamientoData.escuela.promGrado[g])}
                      </td>
                    </React.Fragment>
                  );
                })}
                <td className="border border-slate-500 px-1.5 py-2 bg-indigo-200">
                  {fmtDec(aprovechamientoData.escuela.promTurno)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {renderOfficialFooter(momentoCfg.notaAprovechamiento)}
        {renderCTECharts('aprovechamiento')}
      </section>

      {/* =================================================================
          HOJA 3: DESEMPEÑO ALCANZADO
         ================================================================= */}
      <section className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-0 print:p-0 ${isSheetVisible('desempeno')} ${sheetBreakClass(false)}`}>
        {desempenoData.totalEscuela.sinCalificar > 0 && (
          <div className="mb-3 bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 no-print print:hidden">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{desempenoData.totalEscuela.sinCalificar}</strong> alumno(s) en existencia todavía no tienen ninguna calificación en este Momento; se excluyen temporalmente del rango 5.0 para no inflar reprobación falsa.
            </span>
          </div>
        )}
        {renderOfficialSheetHeader('DESEMPEÑO ALCANZADO')}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-slate-400 text-xs print:text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold text-center">
                <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">GRADO</th>
                <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">TURNO</th>
                <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">MATRÍCULA</th>
                <th colSpan="10" className="border border-slate-400 px-2 py-1">INDICADOR DE LOGRO</th>
              </tr>
              <tr className="bg-slate-50 font-bold text-center text-[11px] print:text-[9px]">
                <th className="border border-slate-400 px-2 py-1">Promedio 5.0 a 5.9</th>
                <th className="border border-slate-400 px-1.5 py-1">%</th>
                <th className="border border-slate-400 px-2 py-1">Promedio 6.0 a 6.9</th>
                <th className="border border-slate-400 px-1.5 py-1">%</th>
                <th className="border border-slate-400 px-2 py-1">Promedio 7.0 a 7.9</th>
                <th className="border border-slate-400 px-1.5 py-1">%</th>
                <th className="border border-slate-400 px-2 py-1">Promedio 8.0 a 10</th>
                <th className="border border-slate-400 px-1.5 py-1">%</th>
                <th className="border border-slate-400 px-2 py-1 bg-emerald-50">COMPROBACIÓN</th>
                <th className="border border-slate-400 px-1.5 py-1 bg-emerald-50">%</th>
              </tr>
            </thead>
            <tbody>
              {TURNOS_SEG.map((turno) =>
                GRADOS_SEG.map((grado) => {
                  const r = desempenoData.filas[`${grado}-${turno}`];
                  return (
                    <tr key={`${grado}-${turno}`} className="text-center hover:bg-slate-50">
                      <td className="border border-slate-400 px-2 py-1.5 text-left font-bold">{GRADO_LABELS[grado]}</td>
                      <td className="border border-slate-400 px-2 py-1.5 text-left">{turno.toUpperCase()}</td>
                      <td className="border border-slate-400 px-2 py-1.5 font-bold">{r.matricula}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-rose-700 font-semibold">{r.r5}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-slate-600">{fmtPct(r.pct5)}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5">{r.r6}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-slate-600">{fmtPct(r.pct6)}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5">{r.r7}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-slate-600">{fmtPct(r.pct7)}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-emerald-700 font-semibold">{r.r8}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-slate-600">{fmtPct(r.pct8)}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 font-bold bg-emerald-50">{r.comprobacion}</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 font-bold bg-emerald-50">{fmtPct(r.pctComprobacion)}</td>
                    </tr>
                  );
                })
              )}
              {GRADOS_SEG.map((grado, idx) => {
                const r = desempenoData.totalesGrado[grado];
                return (
                  <tr key={`des-${grado}`} className="bg-blue-50/70 font-bold text-center">
                    {idx === 0 && (
                      <td rowSpan="3" className="border border-slate-400 px-2 py-1.5 text-left font-black bg-blue-100/70">
                        TOTALES POR GRADO
                      </td>
                    )}
                    <td className="border border-slate-400 px-2 py-1.5 text-left">{GRADO_LABELS[grado]}</td>
                    <td className="border border-slate-400 px-2 py-1.5">{r.matricula}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{r.r5}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{fmtPct(r.pct5)}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{r.r6}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{fmtPct(r.pct6)}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{r.r7}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{fmtPct(r.pct7)}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{r.r8}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{fmtPct(r.pct8)}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{r.comprobacion}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{fmtPct(r.pctComprobacion)}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-200 font-black text-center border-t-2 border-slate-800">
                <td colSpan="2" className="border border-slate-500 px-2 py-2 text-left">TOTAL DE LA ESCUELA</td>
                <td className="border border-slate-500 px-2 py-2">{desempenoData.totalEscuela.matricula}</td>
                <td className="border border-slate-500 px-1.5 py-2">{desempenoData.totalEscuela.r5}</td>
                <td className="border border-slate-500 px-1.5 py-2">{fmtPct(desempenoData.totalEscuela.pct5)}</td>
                <td className="border border-slate-500 px-1.5 py-2">{desempenoData.totalEscuela.r6}</td>
                <td className="border border-slate-500 px-1.5 py-2">{fmtPct(desempenoData.totalEscuela.pct6)}</td>
                <td className="border border-slate-500 px-1.5 py-2">{desempenoData.totalEscuela.r7}</td>
                <td className="border border-slate-500 px-1.5 py-2">{fmtPct(desempenoData.totalEscuela.pct7)}</td>
                <td className="border border-slate-500 px-1.5 py-2">{desempenoData.totalEscuela.r8}</td>
                <td className="border border-slate-500 px-1.5 py-2">{fmtPct(desempenoData.totalEscuela.pct8)}</td>
                <td className="border border-slate-500 px-1.5 py-2">{desempenoData.totalEscuela.comprobacion}</td>
                <td className="border border-slate-500 px-1.5 py-2">{fmtPct(desempenoData.totalEscuela.pctComprobacion)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {renderOfficialFooter()}
        {renderCTECharts('desempeno')}
      </section>

      {/* =================================================================
          HOJA 4: ASISTENCIA (HÍBRIDA QR + MANUAL)
         ================================================================= */}
      <section className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-0 print:p-0 ${isSheetVisible('asistencia')} ${sheetBreakClass(true)}`}>
        {/* Controles Híbridos QR + Manual (No se imprimen) */}
        <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 no-print print:hidden">
          <div className="space-y-1">
            <p className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-600" />
              Modo Híbrido: Escáner QR + Edición Manual
            </p>
            <p className="text-[11px] text-slate-600">
              Calcula automáticamente desde los escaneos QR del periodo ({meta.fechaInicio} a {meta.fechaCorte}) o edita cualquier casilla si falló el lector.
            </p>
            {currentMoment.qrResumen && (
              <p className="text-[11px] font-semibold text-emerald-700">
                Último cálculo QR: {currentMoment.qrResumen.totalEntradas} entradas · Matutino {currentMoment.qrResumen.diasEscaneados?.Matutino || 0} días / Vespertino {currentMoment.qrResumen.diasEscaneados?.Vespertino || 0} días.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 cursor-pointer">
              <input
                type="checkbox"
                disabled={isFrozen}
                checked={currentMoment.autoSinFaltas}
                onChange={(e) =>
                  updateMomentField((cur) => ({ ...cur, autoSinFaltas: e.target.checked }))
                }
                className="rounded border-slate-300 text-primary-600"
              />
              Auto &ldquo;No han faltado&rdquo;
            </label>
            <button
              type="button"
              onClick={handleCalcularAsistenciaQR}
              disabled={loadingQR || isFrozen}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50"
            >
              <QrCode className="w-3.5 h-3.5" />
              {loadingQR ? 'Consultando QR...' : 'Calcular desde Escáner QR'}
            </button>
            <button
              type="button"
              onClick={handleClearAsistencia}
              disabled={isFrozen}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1 transition disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar a 0
            </button>
            <button
              type="button"
              onClick={handleSaveAsistenciaAndMeta}
              disabled={savingCloud || isFrozen}
              className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Guardar Asistencia
            </button>
          </div>
        </div>

        {renderOfficialSheetHeader('ASISTENCIA')}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-slate-400 text-xs print:text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold text-center">
                <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">GRADO</th>
                <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">TURNO</th>
                <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">MATRÍCULA</th>
                <th colSpan="10" className="border border-slate-400 px-2 py-1">ASISTENCIA (INASISTENCIAS EN EL PERIODO)</th>
              </tr>
              <tr className="bg-slate-50 font-bold text-center text-[11px] print:text-[9px]">
                <th className="border border-slate-400 px-2 py-1">Faltaron 1 a 5 días</th>
                <th className="border border-slate-400 px-1.5 py-1">%</th>
                <th className="border border-slate-400 px-2 py-1">Faltaron 6 a 10 días</th>
                <th className="border border-slate-400 px-1.5 py-1">%</th>
                <th className="border border-slate-400 px-2 py-1">Faltaron más de 10 días</th>
                <th className="border border-slate-400 px-1.5 py-1">%</th>
                <th className="border border-slate-400 px-2 py-1">No han faltado</th>
                <th className="border border-slate-400 px-1.5 py-1">%</th>
                <th className="border border-slate-400 px-2 py-1 bg-emerald-50">TOTAL</th>
                <th className="border border-slate-400 px-1.5 py-1 bg-emerald-50">%</th>
              </tr>
            </thead>
            <tbody>
              {TURNOS_SEG.map((turno) =>
                GRADOS_SEG.map((grado) => {
                  const rowKey = `${grado}-${turno}`;
                  const r = asistenciaData.filas[rowKey];
                  return (
                    <tr key={rowKey} className="text-center hover:bg-slate-50">
                      <td className="border border-slate-400 px-2 py-1.5 text-left font-bold">{GRADO_LABELS[grado]}</td>
                      <td className="border border-slate-400 px-2 py-1.5 text-left">{turno.toUpperCase()}</td>
                      <td className="border border-slate-400 px-2 py-1.5 font-bold">{r.matricula}</td>

                      <td className="border border-slate-400 px-1 py-1">
                        <input
                          type="number"
                          min="0"
                          disabled={isFrozen}
                          value={r.f1_5}
                          onChange={(e) => handleAsistenciaCellChange(rowKey, 'f1_5', e.target.value)}
                          className="w-16 text-center px-1 py-0.5 border border-slate-300 rounded font-bold bg-white print:hidden disabled:bg-slate-100"
                        />
                        <span className="hidden print:inline">{r.f1_5}</span>
                      </td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-slate-600">{fmtPct(r.pct1_5)}</td>

                      <td className="border border-slate-400 px-1 py-1">
                        <input
                          type="number"
                          min="0"
                          disabled={isFrozen}
                          value={r.f6_10}
                          onChange={(e) => handleAsistenciaCellChange(rowKey, 'f6_10', e.target.value)}
                          className="w-16 text-center px-1 py-0.5 border border-slate-300 rounded font-bold bg-white print:hidden disabled:bg-slate-100"
                        />
                        <span className="hidden print:inline">{r.f6_10}</span>
                      </td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-slate-600">{fmtPct(r.pct6_10)}</td>

                      <td className="border border-slate-400 px-1 py-1">
                        <input
                          type="number"
                          min="0"
                          disabled={isFrozen}
                          value={r.fMas10}
                          onChange={(e) => handleAsistenciaCellChange(rowKey, 'fMas10', e.target.value)}
                          className="w-16 text-center px-1 py-0.5 border border-slate-300 rounded font-bold bg-white print:hidden disabled:bg-slate-100"
                        />
                        <span className="hidden print:inline">{r.fMas10}</span>
                      </td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-slate-600">{fmtPct(r.pctMas10)}</td>

                      <td className="border border-slate-400 px-1 py-1">
                        {currentMoment.autoSinFaltas || isFrozen ? (
                          <span className="font-bold text-emerald-700">{r.sinFaltas}</span>
                        ) : (
                          <>
                            <input
                              type="number"
                              min="0"
                              value={r.sinFaltas}
                              onChange={(e) => handleAsistenciaCellChange(rowKey, 'sinFaltas', e.target.value)}
                              className="w-16 text-center px-1 py-0.5 border border-slate-300 rounded font-bold bg-white print:hidden"
                            />
                            <span className="hidden print:inline">{r.sinFaltas}</span>
                          </>
                        )}
                      </td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-slate-600">{fmtPct(r.pctSinFaltas)}</td>

                      <td className={`border border-slate-400 px-1.5 py-1.5 font-bold ${r.cuadra ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-100 text-rose-800'}`}>
                        {r.total}
                      </td>
                      <td className={`border border-slate-400 px-1.5 py-1.5 font-bold ${r.cuadra ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-100 text-rose-800'}`}>
                        <span className="inline-flex items-center gap-1">
                          {fmtPct(r.pctTotal)}
                          {r.matricula > 0 && (
                            <span className="print:hidden">
                              {r.cuadra ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                              )}
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
              {GRADOS_SEG.map((grado, idx) => {
                const r = asistenciaData.totalesGrado[grado];
                return (
                  <tr key={`asi-${grado}`} className="bg-blue-50/70 font-bold text-center">
                    {idx === 0 && (
                      <td rowSpan="3" className="border border-slate-400 px-2 py-1.5 text-left font-black bg-blue-100/70">
                        TOTALES POR GRADO
                      </td>
                    )}
                    <td className="border border-slate-400 px-2 py-1.5 text-left">{GRADO_LABELS[grado]}</td>
                    <td className="border border-slate-400 px-2 py-1.5">{r.matricula}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{r.f1_5}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{fmtPct(r.pct1_5)}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{r.f6_10}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{fmtPct(r.pct6_10)}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{r.fMas10}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{fmtPct(r.pctMas10)}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{r.sinFaltas}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{fmtPct(r.pctSinFaltas)}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{r.total}</td>
                    <td className="border border-slate-400 px-1.5 py-1.5">{fmtPct(r.pctTotal)}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-200 font-black text-center border-t-2 border-slate-800">
                <td colSpan="2" className="border border-slate-500 px-2 py-2 text-left">TOTAL DE LA ESCUELA</td>
                <td className="border border-slate-500 px-2 py-2">{asistenciaData.totalEscuela.matricula}</td>
                <td className="border border-slate-500 px-1.5 py-2">{asistenciaData.totalEscuela.f1_5}</td>
                <td className="border border-slate-500 px-1.5 py-2">{fmtPct(asistenciaData.totalEscuela.pct1_5)}</td>
                <td className="border border-slate-500 px-1.5 py-2">{asistenciaData.totalEscuela.f6_10}</td>
                <td className="border border-slate-500 px-1.5 py-2">{fmtPct(asistenciaData.totalEscuela.pct6_10)}</td>
                <td className="border border-slate-500 px-1.5 py-2">{asistenciaData.totalEscuela.fMas10}</td>
                <td className="border border-slate-500 px-1.5 py-2">{fmtPct(asistenciaData.totalEscuela.pctMas10)}</td>
                <td className="border border-slate-500 px-1.5 py-2">{asistenciaData.totalEscuela.sinFaltas}</td>
                <td className="border border-slate-500 px-1.5 py-2">{fmtPct(asistenciaData.totalEscuela.pctSinFaltas)}</td>
                <td className="border border-slate-500 px-1.5 py-2">{asistenciaData.totalEscuela.total}</td>
                <td className="border border-slate-500 px-1.5 py-2">{fmtPct(asistenciaData.totalEscuela.pctTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {renderOfficialFooter()}
        {renderCTECharts('asistencia')}
      </section>
    </div>
  );
}
