import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Save,
  Lock,
  Unlock,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  X,
  RotateCcw,
  BarChart3,
  Sun,
  Moon
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
  construirTablaAsistencia,
  extraerSnapshotTurno,
  normalizarCongeladoTurnos,
  combinarMomentoConCongeladosPorTurno
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
  m1: {
    meta: buildDefaultMeta(1, config),
    asistenciaManual: {},
    autoSinFaltas: true,
    qrResumen: null,
    congeladoTurnos: { Matutino: null, Vespertino: null },
    congelado: null
  },
  m2: {
    meta: buildDefaultMeta(2, config),
    asistenciaManual: {},
    autoSinFaltas: true,
    qrResumen: null,
    congeladoTurnos: { Matutino: null, Vespertino: null },
    congelado: null
  },
  m3: {
    meta: buildDefaultMeta(3, config),
    asistenciaManual: {},
    autoSinFaltas: true,
    qrResumen: null,
    congeladoTurnos: { Matutino: null, Vespertino: null },
    congelado: null
  }
});

const mergeAsistenciaPorTurno = (localManual = {}, cloudManual = {}, congeladoTurnos = {}, forceKeepCloudForTurno = {}) => {
  const merged = { ...(cloudManual || {}), ...(localManual || {}) };
  TURNOS_SEG.forEach((t) => {
    if (forceKeepCloudForTurno[t] || congeladoTurnos[t]) {
      GRADOS_SEG.forEach((g) => {
        const key = `${g}-${t}`;
        if (cloudManual && cloudManual[key] !== undefined) {
          merged[key] = cloudManual[key];
        }
      });
    }
  });
  return merged;
};

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

  const cicloConfig = config?.cicloEscolarActual;
  const cctConfig = config?.cct;
  const directorConfig = config?.directorName;

  const cicloKey = useMemo(() => {
    const clean = String(cicloConfig || '2026-2027').replace(/[^0-9-]/g, '');
    return clean || '2026-2027';
  }, [cicloConfig]);

  const docId = `momentos_valoracion_${cicloKey}`;
  const momentoCfg = MOMENTOS_SEG[momentoId] || MOMENTOS_SEG[1];
  const mKey = momentoCfg.key;

  // Cargar datos históricos/guardados desde Firestore (1 única lectura al abrir)
  useEffect(() => {
    let active = true;
    const cfgValues = {
      cicloEscolarActual: cicloConfig,
      cct: cctConfig,
      directorName: directorConfig
    };
    const cargarMomentos = async () => {
      setLoadingCloud(true);
      const base = buildDefaultStore(cfgValues);
      try {
        const snap = await getDoc(doc(db, 'configuracion', docId));
        if (active && snap.exists()) {
          const data = snap.data() || {};
          ['m1', 'm2', 'm3'].forEach((k, idx) => {
            if (data[k]) {
              base[k] = {
                meta: { ...buildDefaultMeta(idx + 1, cfgValues), ...(data[k].meta || {}) },
                asistenciaManual: data[k].asistenciaManual || {},
                autoSinFaltas: data[k].autoSinFaltas !== false,
                qrResumen: data[k].qrResumen || null,
                congeladoTurnos: normalizarCongeladoTurnos(data[k]),
                congelado: null
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
  }, [docId, cicloConfig, cctConfig, directorConfig]);

  useEffect(() => {
    const onBeforePrint = () => setPrintScope((prev) => prev || 'active');
    const onAfterPrint = () => setPrintScope(null);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  const currentMoment = store[mKey] || buildDefaultStore(config)[mKey];
  const meta = currentMoment.meta;
  const congeladoTurnos = useMemo(
    () => normalizarCongeladoTurnos(currentMoment),
    [currentMoment]
  );
  const isMatutinoFrozen = Boolean(congeladoTurnos.Matutino);
  const isVespertinoFrozen = Boolean(congeladoTurnos.Vespertino);
  const isAllFrozen = isMatutinoFrozen && isVespertinoFrozen;
  const isTurnoFrozen = (turno) => (turno === 'Matutino' ? isMatutinoFrozen : isVespertinoFrozen);

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

  // Datos activos en pantalla / exportación / gráficas combinando por turno (congelado vs en vivo)
  const {
    matricula: matriculaData,
    aprovechamiento: aprovechamientoData,
    desempeno: desempenoData,
    asistencia: asistenciaData
  } = useMemo(
    () =>
      combinarMomentoConCongeladosPorTurno({
        liveMatricula,
        liveAprovechamiento,
        liveDesempeno,
        liveAsistencia,
        congeladoTurnos
      }),
    [liveMatricula, liveAprovechamiento, liveDesempeno, liveAsistencia, congeladoTurnos]
  );

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

  const persistMomentPayload = async (momentKeyToSave, momentState, accionBitacora, detalleBitacora, successMsg) => {
    setSavingCloud(true);
    try {
      await setDoc(
        doc(db, 'configuracion', docId),
        {
          [momentKeyToSave]: momentState,
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

  const readCloudMomentState = async () => {
    try {
      const snap = await getDoc(doc(db, 'configuracion', docId));
      return snap.exists() ? (snap.data()?.[mKey] || null) : null;
    } catch {
      return null;
    }
  };

  const handleSaveFreezeTurno = async (turno) => {
    setSavingCloud(true);
    try {
      const otherTurno = turno === 'Matutino' ? 'Vespertino' : 'Matutino';
      const cloudMoment = await readCloudMomentState();
      const cloudTurnos = normalizarCongeladoTurnos(cloudMoment);

      const snapshotTurno = extraerSnapshotTurno({
        turno,
        matricula: liveMatricula,
        aprovechamiento: liveAprovechamiento,
        desempeno: liveDesempeno,
        asistencia: liveAsistencia,
        frozenBy: currentUser?.email || 'Desconocido',
        fechaCorte: meta.fechaCorte
      });

      const nextCongeladoTurnos = {
        Matutino: turno === 'Matutino' ? snapshotTurno : (cloudTurnos.Matutino || congeladoTurnos.Matutino || null),
        Vespertino: turno === 'Vespertino' ? snapshotTurno : (cloudTurnos.Vespertino || congeladoTurnos.Vespertino || null)
      };

      const nextAsistenciaManual = mergeAsistenciaPorTurno(
        currentMoment.asistenciaManual,
        cloudMoment?.asistenciaManual,
        { [otherTurno]: nextCongeladoTurnos[otherTurno] },
        { [otherTurno]: true }
      );

      const nextMomentState = {
        ...currentMoment,
        asistenciaManual: nextAsistenciaManual,
        congeladoTurnos: nextCongeladoTurnos,
        congelado: null
      };

      setStore((prev) => ({ ...prev, [mKey]: nextMomentState }));

      await persistMomentPayload(
        mKey,
        nextMomentState,
        `Congelar ${momentoCfg.corto} (${turno})`,
        `Guardó y congeló el Turno ${turno} en las 4 hojas del ${momentoCfg.corto} (${meta.cicloEscolar}) con corte al ${meta.fechaCorte}.`,
        `🔒 Turno ${turno} guardado y congelado correctamente en el ${momentoCfg.corto}.`
      );
    } finally {
      setSavingCloud(false);
    }
  };

  const handleUnfreezeTurno = async (turno) => {
    if (
      !window.confirm(
        `¿Deseas desbloquear únicamente el Turno ${turno} del ${momentoCfg.corto} para recalcular sus datos en vivo?\n\n(El otro turno conservará su estado actual y la asistencia manual capturada permanecerá intacta).`
      )
    ) {
      return;
    }

    setSavingCloud(true);
    try {
      const otherTurno = turno === 'Matutino' ? 'Vespertino' : 'Matutino';
      const cloudMoment = await readCloudMomentState();
      const cloudTurnos = normalizarCongeladoTurnos(cloudMoment);

      const nextCongeladoTurnos = {
        Matutino: turno === 'Matutino' ? null : (cloudTurnos.Matutino || congeladoTurnos.Matutino || null),
        Vespertino: turno === 'Vespertino' ? null : (cloudTurnos.Vespertino || congeladoTurnos.Vespertino || null)
      };

      const nextAsistenciaManual = mergeAsistenciaPorTurno(
        currentMoment.asistenciaManual,
        cloudMoment?.asistenciaManual,
        nextCongeladoTurnos,
        { [otherTurno]: Boolean(nextCongeladoTurnos[otherTurno]) }
      );

      const nextMomentState = {
        ...currentMoment,
        asistenciaManual: nextAsistenciaManual,
        congeladoTurnos: nextCongeladoTurnos,
        congelado: null
      };

      setStore((prev) => ({ ...prev, [mKey]: nextMomentState }));

      await persistMomentPayload(
        mKey,
        nextMomentState,
        `Descongelar ${momentoCfg.corto} (${turno})`,
        `Regresó el Turno ${turno} del ${momentoCfg.corto} (${meta.cicloEscolar}) a cálculo en vivo.`,
        `🔓 Turno ${turno} regresado a cálculo en vivo.`
      );
    } finally {
      setSavingCloud(false);
    }
  };

  const handleSaveAsistenciaAndMeta = async () => {
    setSavingCloud(true);
    try {
      const cloudMoment = await readCloudMomentState();
      const cloudTurnos = normalizarCongeladoTurnos(cloudMoment);

      const mergedCongeladoTurnos = {
        Matutino: cloudTurnos.Matutino || congeladoTurnos.Matutino || null,
        Vespertino: cloudTurnos.Vespertino || congeladoTurnos.Vespertino || null
      };

      const nextAsistenciaManual = mergeAsistenciaPorTurno(
        currentMoment.asistenciaManual,
        cloudMoment?.asistenciaManual,
        mergedCongeladoTurnos
      );

      const nextMomentState = {
        ...currentMoment,
        asistenciaManual: nextAsistenciaManual,
        congeladoTurnos: mergedCongeladoTurnos,
        congelado: null
      };

      setStore((prev) => ({ ...prev, [mKey]: nextMomentState }));

      await persistMomentPayload(
        mKey,
        nextMomentState,
        null,
        null,
        `💾 Datos de encabezado y asistencia del ${momentoCfg.corto} guardados.`
      );
    } finally {
      setSavingCloud(false);
    }
  };

  const handleAsistenciaCellChange = (key, field, rawVal) => {
    const [, turno] = String(key).split('-');
    if (isTurnoFrozen(turno)) return;
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
    if (isAllFrozen) {
      toast.error('Ambos turnos están congelados. Descongela al menos un turno para recalcular desde QR.');
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

      updateMomentField((cur) => {
        const nextManual = { ...(cur.asistenciaManual || {}) };
        TURNOS_SEG.forEach((t) => {
          if (isTurnoFrozen(t)) return;
          GRADOS_SEG.forEach((g) => {
            const key = `${g}-${t}`;
            if (resQR.rawByKey[key]) {
              nextManual[key] = resQR.rawByKey[key];
            }
          });
        });

        const prevDias = cur.qrResumen?.diasEscaneados || {};
        return {
          ...cur,
          asistenciaManual: nextManual,
          qrResumen: {
            diasEscaneados: {
              Matutino: isMatutinoFrozen ? (prevDias.Matutino || 0) : resQR.diasEscaneados.Matutino,
              Vespertino: isVespertinoFrozen ? (prevDias.Vespertino || 0) : resQR.diasEscaneados.Vespertino
            },
            totalEntradas: resQR.totalEntradas,
            calculatedAt: new Date().toISOString()
          }
        };
      });

      if (resQR.totalEntradas === 0) {
        toast('No se encontraron escaneos QR en ese rango de fechas; puedes capturar las cifras manualmente.', { icon: 'ℹ️' });
      } else if (isMatutinoFrozen || isVespertinoFrozen) {
        const turnoVivo = isMatutinoFrozen ? 'Vespertino' : 'Matutino';
        const turnoLock = isMatutinoFrozen ? 'Matutino' : 'Vespertino';
        toast.success(
          `QR aplicado únicamente al Turno ${turnoVivo} (${resQR.diasEscaneados[turnoVivo]} días). Turno ${turnoLock} se conservó congelado.`
        );
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
    if (isAllFrozen) return;
    updateMomentField((cur) => {
      const nextManual = { ...(cur.asistenciaManual || {}) };
      TURNOS_SEG.forEach((t) => {
        if (isTurnoFrozen(t)) return;
        GRADOS_SEG.forEach((g) => {
          delete nextManual[`${g}-${t}`];
        });
      });
      return {
        ...cur,
        asistenciaManual: nextManual,
        qrResumen: !isMatutinoFrozen && !isVespertinoFrozen ? null : cur.qrResumen
      };
    });
    if (isMatutinoFrozen || isVespertinoFrozen) {
      const turnoVivo = isMatutinoFrozen ? 'Vespertino' : 'Matutino';
      toast(`Conteos del Turno ${turnoVivo} reiniciados a 0 (el turno congelado permaneció intacto).`);
    } else {
      toast('Conteos de inasistencia reiniciados a 0.');
    }
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
    }, 320);
  };

  const renderOfficialSheetHeader = (sheetTitle) => (
    <div className="mb-3 print:mb-2 text-slate-900">
      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 print:pb-2 mb-2 print:mb-2">
        <img src="/logo-sep.png" alt="SEP" className="h-12 w-auto object-contain print:h-14" />
        <div className="text-center flex-1 px-2 leading-tight">
          <p className="text-[11px] print:text-[12px] font-bold uppercase tracking-wide">SECRETARÍA DE EDUCACIÓN</p>
          <p className="text-[10px] print:text-[11px] font-bold uppercase">SUBSECRETARÍA DE EDUCACIÓN BÁSICA</p>
          <p className="text-[10px] print:text-[11px] font-bold uppercase">DIRECCIÓN GENERAL DE EDUCACIÓN SECUNDARIA</p>
          <p className="text-[10px] print:text-[11px] font-semibold uppercase text-slate-700">
            DEPARTAMENTO DE SECUNDARIAS: <span className="font-bold text-slate-900">{meta.departamento || 'TÉCNICAS'}</span>
          </p>
          <h3 className="text-xs sm:text-sm print:text-[15px] font-black uppercase mt-1 tracking-wide text-slate-900">
            {momentoCfg.titulo}. CICLO ESCOLAR {meta.cicloEscolar}
          </h3>
        </div>
        <img src="/logo-escuela.png" alt="Escuela" className="h-12 w-auto object-contain print:h-14" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-x-4 gap-y-1 text-[10px] print:text-[11px] bg-slate-50 print:bg-white border border-slate-300 rounded-md px-3 py-1.5 print:px-3.5 print:py-2 uppercase">
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
        <div className="sm:col-span-2 print:col-span-2">
          <span className="font-bold">NOMBRE DEL DIRECTOR (A):</span> {meta.director}
        </div>
        <div>
          <span className="font-bold">TOTAL DE DOCENTES:</span> {meta.totalDocentes}
        </div>
      </div>

      <h4 className="text-center font-black text-xs sm:text-sm print:text-[14px] uppercase tracking-wider mt-2.5 print:mt-2 py-1 print:py-1.5 bg-slate-800 text-white print:bg-slate-200 print:text-black rounded-t border border-slate-800">
        {sheetTitle}
      </h4>
    </div>
  );

  const renderOfficialFooter = (notaExtra = null) => (
    <div className="mt-4 print:mt-2 text-slate-800">
      {notaExtra && (
        <p className="text-[10px] print:text-[11px] italic text-slate-600 mb-4 print:mb-3">{notaExtra}</p>
      )}
      <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-end print:items-end gap-6 pt-4 print:pt-4 text-[11px] print:text-[12px] font-bold uppercase">
        <div>
          FECHA: <span className="underline decoration-dotted">{formatearFechaLargaSEG(meta.fechaEmision) || '________________________'}</span>
        </div>
        <div className="text-center w-64 print:w-72 mx-auto sm:mx-0 print:mx-0">
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
        className={`momento-cte-print-page mt-6 pt-5 border-t-2 border-dashed border-slate-200 break-inside-avoid ${
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
          printMode={Boolean(printScope)}
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
    <div className="space-y-4 print:space-y-0">
      <style>{`
        @page { size: letter landscape; margin: 0.45cm; }
        @media print {
          @page { size: letter landscape; margin: 0.45cm; }
          html, body, #root, #root > div, #root main {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            max-width: none !important;
            width: 100% !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .momento-sheet-page {
            width: 100% !important;
            height: 19.5cm !important;
            max-height: 19.5cm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            padding: 0.1cm 0.05cm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .momento-cte-print-page {
            width: 100% !important;
            height: 19.5cm !important;
            max-height: 19.5cm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            padding: 0.1cm 0.05cm !important;
            margin: 0 !important;
            border-top: 0 !important;
            overflow: hidden !important;
            page-break-before: always !important;
            break-before: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .momento-cte-print-page svg.recharts-surface {
            max-width: 100% !important;
            height: auto !important;
          }
          .momento-table-std {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 12.5px !important;
            line-height: 1.25 !important;
          }
          .momento-table-std thead th {
            padding: 6px 4px !important;
            font-size: 11px !important;
          }
          .momento-table-std tbody td {
            padding: 8.5px 4px !important;
            font-size: 12.5px !important;
          }
          .momento-table-aprov {
            min-width: 0 !important;
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          .momento-table-aprov col.aprov-col-turno { width: 10.5% !important; }
          .momento-table-aprov col.aprov-col-mat { width: 2.55% !important; }
          .momento-table-aprov col.aprov-col-pgrado { width: 4.3% !important; }
          .momento-table-aprov col.aprov-col-pesc { width: 5.2% !important; }
          .momento-table-aprov .aprov-campo-th {
            font-size: 8.5px !important;
            line-height: 1.15 !important;
            padding: 4px 2px !important;
            word-break: break-word !important;
          }
          .momento-table-aprov .aprov-vert-th {
            height: 138px !important;
            vertical-align: bottom !important;
            padding: 4px 1px !important;
          }
          .momento-table-aprov .aprov-vert-label {
            display: inline-block !important;
            writing-mode: vertical-rl !important;
            transform: rotate(180deg) !important;
            white-space: normal !important;
            text-align: left !important;
            font-size: 9.5px !important;
            font-weight: 800 !important;
            line-height: 1.05 !important;
            max-height: 130px !important;
          }
          .momento-table-aprov tbody td {
            font-size: 11.5px !important;
            font-weight: 700 !important;
            padding: 15px 1px !important;
          }
        }
      `}</style>

      {/* PANEL SUPERIOR DE CONTROL (NO SE IMPRIME) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-4 no-print print:hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-white">
                Momentos de Valoración (SEG)
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                  isMatutinoFrozen
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                }`}
              >
                <Sun className="w-3 h-3" />
                Matutino: {isMatutinoFrozen ? '🔒 Congelado' : 'En vivo'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                  isVespertinoFrozen
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                }`}
              >
                <Moon className="w-3 h-3" />
                Vespertino: {isVespertinoFrozen ? '🔒 Congelado' : 'En vivo'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Ciclo {meta.cicloEscolar} · Corte al <strong className="text-white">{corteLabel}</strong>
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
            const tObj = normalizarCongeladoTurnos(mObj);
            const mLocked = Boolean(tObj.Matutino);
            const vLocked = Boolean(tObj.Vespertino);
            const bothLocked = mLocked && vLocked;
            const partialLocked = (mLocked || vLocked) && !bothLocked;
            const active = momentoId === mNum;
            const badgeText = bothLocked
              ? '🔒 M y V'
              : mLocked
                ? '🔒 Mat · ⚡ Vesp'
                : vLocked
                  ? '⚡ Mat · 🔒 Vesp'
                  : 'En vivo';

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
                    bothLocked
                      ? 'bg-amber-500/20 text-amber-600 border border-amber-400/40'
                      : partialLocked
                        ? 'bg-sky-500/20 text-sky-500 border border-sky-400/40'
                        : active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {badgeText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Barra de Guardado y Congelado Independiente por Turno */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
          {TURNOS_SEG.map((turno) => {
            const snap = congeladoTurnos[turno];
            const locked = Boolean(snap);
            const isMat = turno === 'Matutino';
            return (
              <div
                key={turno}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border ${
                  locked
                    ? 'bg-amber-500/10 border-amber-400/35'
                    : isMat
                      ? 'bg-slate-800/90 border-slate-700'
                      : 'bg-indigo-950/50 border-indigo-800/60'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isMat ? (
                      <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-300 shrink-0" />
                    )}
                    <span className="text-xs font-black uppercase tracking-wide text-white">
                      Turno {turno}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        locked
                          ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      }`}
                    >
                      {locked ? '🔒 Congelado' : '⚡ En vivo'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                    {locked && snap?.frozenAt
                      ? `Guardado el ${new Date(snap.frozenAt).toLocaleDateString('es-MX')} · ${snap.frozenBy || ''}`
                      : 'Datos en vivo · Asistencia editable por el turno'}
                  </p>
                </div>

                {locked ? (
                  <button
                    type="button"
                    onClick={() => handleUnfreezeTurno(turno)}
                    disabled={savingCloud}
                    className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition shrink-0 disabled:opacity-50"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Descongelar {turno}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveFreezeTurno(turno)}
                    disabled={savingCloud || loadingCloud}
                    className={`px-3 py-2 rounded-lg text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition shrink-0 disabled:opacity-50 ${
                      isMat
                        ? 'bg-rose-600 hover:bg-rose-500'
                        : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" /> Guardar y Congelar {turno}
                  </button>
                )}
              </div>
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
                disabled={isAllFrozen}
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
                disabled={isAllFrozen}
                value={meta.totalDocentes}
                onChange={(e) => updateMetaField('totalDocentes', parseInt(e.target.value || '0', 10) || 0)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-white font-semibold disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Inicio Periodo (QR)</label>
              <input
                type="date"
                disabled={isAllFrozen}
                value={meta.fechaInicio}
                onChange={(e) => updateMetaField('fechaInicio', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-white font-semibold scheme-dark disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Fecha Corte (Altas/Bajas/QR)</label>
              <input
                type="date"
                disabled={isAllFrozen}
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
      <section className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-0 print:p-0 print:m-0 print:rounded-none print:bg-transparent ${isSheetVisible('matricula')} ${sheetBreakClass(false)}`}>
        <div className="momento-sheet-page">
          {renderOfficialSheetHeader('MATRÍCULA GENERAL')}
          <div className="overflow-x-auto print:overflow-visible print:my-auto">
            <table className="min-w-full border-collapse border border-slate-400 text-xs momento-table-std">
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
                        <td className="border border-slate-400 px-2 py-1.5 text-left">
                          {turno.toUpperCase()}
                          {isTurnoFrozen(turno) && (
                            <span className="ml-1 text-[9px] text-amber-700 font-bold print:hidden" title="Turno congelado">
                              🔒
                            </span>
                          )}
                        </td>
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
        </div>
        {renderCTECharts('matricula')}
      </section>

      {/* =================================================================
          HOJA 2: APROVECHAMIENTO (PROMEDIOS)
         ================================================================= */}
      <section className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-0 print:p-0 print:m-0 print:rounded-none print:bg-transparent ${isSheetVisible('aprovechamiento')} ${sheetBreakClass(false)}`}>
        {aprovechamientoData.alumnosSinCalificacion > 0 && (
          <div className="mb-3 bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 no-print print:hidden">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Atención: Hay <strong>{aprovechamientoData.alumnosSinCalificacion}</strong> alumno(s) en existencia sin ninguna calificación capturada en los trimestres de este Momento.
            </span>
          </div>
        )}
        <div className="momento-sheet-page">
          {renderOfficialSheetHeader('APROVECHAMIENTO (PROMEDIOS) — CAMPOS FORMATIVOS')}
          <div className="overflow-x-auto print:overflow-visible print:my-auto">
            <table className="min-w-full border-collapse border border-slate-400 text-[10px] momento-table-aprov">
              <colgroup>
                <col className="aprov-col-turno" />
                {GRADOS_SEG.map((g) => (
                  <React.Fragment key={`col-${g}`}>
                    {CAMPOS_FORMATIVOS_SEG[g]
                      .flatMap((cf) => cf.materias)
                      .map((mat) => (
                        <col key={`col-${mat.id}`} className="aprov-col-mat" />
                      ))}
                    <col className="aprov-col-pgrado" />
                  </React.Fragment>
                ))}
                <col className="aprov-col-pesc" />
              </colgroup>
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-black text-center print:text-[10px]">
                  <th rowSpan="3" className="border border-slate-400 px-2 py-1">TURNO</th>
                  <th colSpan="10" className="border border-slate-400 px-1 py-1">PRIMER GRADO</th>
                  <th rowSpan="3" className="border border-slate-400 px-1 py-1 bg-indigo-100 print:text-[9.5px]">PROM.<br />1°</th>
                  <th colSpan="9" className="border border-slate-400 px-1 py-1">SEGUNDO GRADO</th>
                  <th rowSpan="3" className="border border-slate-400 px-1 py-1 bg-indigo-100 print:text-[9.5px]">PROM.<br />2°</th>
                  <th colSpan="9" className="border border-slate-400 px-1 py-1">TERCER GRADO</th>
                  <th rowSpan="3" className="border border-slate-400 px-1 py-1 bg-indigo-100 print:text-[9.5px]">PROM.<br />3°</th>
                  <th rowSpan="3" className="border border-slate-400 px-1.5 py-1 bg-slate-800 text-white print:bg-slate-300 print:text-black print:text-[9px]">PROM. GRAL<br />ESCUELA</th>
                </tr>
                <tr className="bg-slate-100 text-slate-800 font-bold text-center text-[9px]">
                  {GRADOS_SEG.map((g) =>
                    CAMPOS_FORMATIVOS_SEG[g].map((cf) => (
                      <th key={`${g}-${cf.campo}`} colSpan={cf.materias.length} className="border border-slate-400 px-1 py-1 aprov-campo-th">
                        {cf.campo}
                      </th>
                    ))
                  )}
                </tr>
                <tr className="bg-slate-50 text-slate-700 font-bold text-center text-[9px]">
                  {GRADOS_SEG.map((g) =>
                    CAMPOS_FORMATIVOS_SEG[g]
                      .flatMap((cf) => cf.materias)
                      .map((mat) => (
                        <th key={mat.id} className="border border-slate-400 px-1 py-1.5 leading-tight aprov-vert-th">
                          <span className="aprov-vert-label">{mat.label}</span>
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
                      <td className="border border-slate-400 px-2 py-2 text-left font-bold">
                        {turno.toUpperCase()}
                        {isTurnoFrozen(turno) && (
                          <span className="ml-1 text-[9px] text-amber-700 font-bold print:hidden" title="Turno congelado">
                            🔒
                          </span>
                        )}
                      </td>
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
        </div>
        {renderCTECharts('aprovechamiento')}
      </section>

      {/* =================================================================
          HOJA 3: DESEMPEÑO ALCANZADO
         ================================================================= */}
      <section className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-0 print:p-0 print:m-0 print:rounded-none print:bg-transparent ${isSheetVisible('desempeno')} ${sheetBreakClass(false)}`}>
        {desempenoData.totalEscuela.sinCalificar > 0 && (
          <div className="mb-3 bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 no-print print:hidden">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{desempenoData.totalEscuela.sinCalificar}</strong> alumno(s) en existencia todavía no tienen ninguna calificación en este Momento; se excluyen temporalmente del rango 5.0 para no inflar reprobación falsa.
            </span>
          </div>
        )}
        <div className="momento-sheet-page">
          {renderOfficialSheetHeader('DESEMPEÑO ALCANZADO')}
          <div className="overflow-x-auto print:overflow-visible print:my-auto">
            <table className="min-w-full border-collapse border border-slate-400 text-xs momento-table-std">
              <thead>
                <tr className="bg-slate-100 font-bold text-center">
                  <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">GRADO</th>
                  <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">TURNO</th>
                  <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">MATRÍCULA</th>
                  <th colSpan="10" className="border border-slate-400 px-2 py-1">INDICADOR DE LOGRO</th>
                </tr>
                <tr className="bg-slate-50 font-bold text-center text-[11px]">
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
                        <td className="border border-slate-400 px-2 py-1.5 text-left">
                          {turno.toUpperCase()}
                          {isTurnoFrozen(turno) && (
                            <span className="ml-1 text-[9px] text-amber-700 font-bold print:hidden" title="Turno congelado">
                              🔒
                            </span>
                          )}
                        </td>
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
        </div>
        {renderCTECharts('desempeno')}
      </section>

      {/* =================================================================
          HOJA 4: ASISTENCIA (HÍBRIDA QR + MANUAL)
         ================================================================= */}
      <section className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-0 print:p-0 print:m-0 print:rounded-none print:bg-transparent ${isSheetVisible('asistencia')} ${sheetBreakClass(true)}`}>
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
            {(isMatutinoFrozen || isVespertinoFrozen) && !isAllFrozen && (
              <p className="text-[11px] font-bold text-amber-700">
                🔒 Turno {isMatutinoFrozen ? 'Matutino' : 'Vespertino'} ya está congelado; solo Turno{' '}
                {isMatutinoFrozen ? 'Vespertino' : 'Matutino'} se puede editar o recalcular desde QR.
              </p>
            )}
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
                disabled={isAllFrozen}
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
              disabled={loadingQR || isAllFrozen}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50"
            >
              <QrCode className="w-3.5 h-3.5" />
              {loadingQR ? 'Consultando QR...' : 'Calcular desde Escáner QR'}
            </button>
            <button
              type="button"
              onClick={handleClearAsistencia}
              disabled={isAllFrozen}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1 transition disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar a 0
            </button>
            <button
              type="button"
              onClick={handleSaveAsistenciaAndMeta}
              disabled={savingCloud || isAllFrozen}
              className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Guardar Asistencia
            </button>
          </div>
        </div>

        <div className="momento-sheet-page">
          {renderOfficialSheetHeader('ASISTENCIA')}
          <div className="overflow-x-auto print:overflow-visible print:my-auto">
            <table className="min-w-full border-collapse border border-slate-400 text-xs momento-table-std">
              <thead>
                <tr className="bg-slate-100 font-bold text-center">
                  <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">GRADO</th>
                  <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">TURNO</th>
                  <th rowSpan="2" className="border border-slate-400 px-2 py-1.5">MATRÍCULA</th>
                  <th colSpan="10" className="border border-slate-400 px-2 py-1">ASISTENCIA (INASISTENCIAS EN EL PERIODO)</th>
                </tr>
                <tr className="bg-slate-50 font-bold text-center text-[11px]">
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
                    const rowLocked = isTurnoFrozen(turno);
                    return (
                      <tr key={rowKey} className="text-center hover:bg-slate-50">
                        <td className="border border-slate-400 px-2 py-1.5 text-left font-bold">{GRADO_LABELS[grado]}</td>
                        <td className="border border-slate-400 px-2 py-1.5 text-left">
                          {turno.toUpperCase()}
                          {rowLocked && (
                            <span className="ml-1 text-[9px] text-amber-700 font-bold print:hidden" title="Turno congelado">
                              🔒
                            </span>
                          )}
                        </td>
                        <td className="border border-slate-400 px-2 py-1.5 font-bold">{r.matricula}</td>

                        <td className="border border-slate-400 px-1 py-1">
                          <input
                            type="number"
                            min="0"
                            disabled={rowLocked}
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
                            disabled={rowLocked}
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
                            disabled={rowLocked}
                            value={r.fMas10}
                            onChange={(e) => handleAsistenciaCellChange(rowKey, 'fMas10', e.target.value)}
                            className="w-16 text-center px-1 py-0.5 border border-slate-300 rounded font-bold bg-white print:hidden disabled:bg-slate-100"
                          />
                          <span className="hidden print:inline">{r.fMas10}</span>
                        </td>
                        <td className="border border-slate-400 px-1.5 py-1.5 text-slate-600">{fmtPct(r.pctMas10)}</td>

                        <td className="border border-slate-400 px-1 py-1">
                          {currentMoment.autoSinFaltas || rowLocked ? (
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
        </div>
        {renderCTECharts('asistencia')}
      </section>
    </div>
  );
}
