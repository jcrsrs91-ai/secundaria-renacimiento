import React, { useState, useEffect, useMemo } from 'react';
import { Save, Printer, CheckCircle, FileSpreadsheet, ClipboardList, Calculator, UserCheck, AlertCircle, Lock, Eye, Calendar, Download, Upload } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useGlobalConfig } from '../hooks/useGlobalConfig';
import { autoAcentuar, truncateTo1Dec, roundToIntGrade, roundToIntNumber } from '../utils/format';
import { materiasPorGrado } from '../utils/materias';
import { registrarMovimiento } from '../utils/bitacora';
import ListaAsistenciaPrint, { TALLER_POR_GRUPO, getStudentGender, sortAttendanceListStudents } from './ListaAsistenciaPrint';
import CuadroAsignaturaPrint from './CuadroAsignaturaPrint';
import { descargarListaAsistenciaEditableExcel, importarListaAsistenciaEditableExcel } from '../utils/exportListaExcel';

const TRIMESTRE_LABELS = {
  t1: 'I (Primero)',
  t2: 'II (Segundo)',
  t3: 'III (Tercero)'
};

const DAYS_COLS = Array.from({ length: 20 }, (_, i) => i + 1);
const TASK_COLS = Array.from({ length: 6 }, (_, i) => i + 1);

export default function EvaluacionDocenteWidget({ students = [] }) {
  const { userName, currentUser, userRole } = useAuth();
  const { config } = useGlobalConfig();

  const [grado, setGrado] = useState('1er Grado');
  const [grupo, setGrupo] = useState('A');
  const [trimestre, setTrimestre] = useState('t1');
  const [materiaId, setMateriaId] = useState('espanol1');
  const [docenteNombre, setDocenteNombre] = useState(userName || '');
  const [modoCaptura, setModoCaptura] = useState('rapido'); // 'rapido' | 'detallado' | 'lista_oficial'
  const [modoDivisorDias, setModoDivisorDias] = useState('clases_grupo'); // 'clases_grupo' | 'celdas_alumno'
  const [paperSize, setPaperSize] = useState('letter');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [printOption, setPrintOption] = useState(null); // 'opcion1_lista' | 'opcion2_cuadro'
  const [highlightEmpty, setHighlightEmpty] = useState(false);

  // Encabezados de CONTENIDOS / FECHA para las 20 columnas de días y las 6 tareas
  const [contenidosFecha, setContenidosFecha] = useState({});

  const isLockedForTeachers = Boolean(config?.trimestresBloqueadosDocentes?.[trimestre]);
  // Los secretarios y superadmin SIEMPRE pueden editar aunque el trimestre esté cerrado para docentes
  const isReadOnlyForCurrentUser = userRole === 'docente' && isLockedForTeachers;

  const materias = useMemo(() => materiasPorGrado[grado] || [], [grado]);

  // Asegurar que materiaId pertenezca al grado seleccionado
  useEffect(() => {
    if (materias.length > 0 && !materias.some(m => m.id === materiaId)) {
      setMateriaId(materias[0].id);
    }
  }, [grado, materias, materiaId]);

  const asignaturaActual = useMemo(() => {
    const found = materias.find(m => m.id === materiaId);
    if (!found) return '';
    if (found.id.startsWith('tecnologia')) {
      const taller = TALLER_POR_GRUPO[grupo];
      return taller ? `${found.name} (${taller})` : found.name;
    }
    return found.name;
  }, [materias, materiaId, grupo]);

  // Filtrar alumnos del grupo (Activos y Bajas oficiales posteriores al 30 de sept, excluyendo No Inscritos)
  const alumnosGrupo = useMemo(() => {
    const filtered = students.filter(s => {
      if (s.grado !== grado || s.grupo !== grupo) return false;
      const stStatus = (s.status || 'Activo').toLowerCase();
      if (stStatus === 'activo') return true;
      if (stStatus === 'baja' && s.motivoBaja !== 'No Inscrito' && s.tipoBaja !== 'No Inscrito') return true;
      return false;
    });
    return sortAttendanceListStudents(filtered);
  }, [students, grado, grupo]);

  // Estado local de evaluación por alumno
  // evalData[studentId] = { dias: { d1..d20 }, faltas, t1..t6, examen, participacion, extraEval, calificacion, observaciones }
  const [evalData, setEvalData] = useState({});

  // Cargar datos de los alumnos y metadatos del docente para esa materia/grupo/trimestre
  useEffect(() => {
    const initial = {};
    alumnosGrupo.forEach(al => {
      const savedCalif = al.calificaciones?.[trimestre]?.[materiaId] ?? '';
      const det = al.evaluacionDetalle?.[trimestre]?.[materiaId] || {};
      const savedDias = det.dias || {};
      const diasObj = {};
      DAYS_COLS.forEach(col => {
        diasObj[`d${col}`] = savedDias[`d${col}`] ?? '';
      });

      initial[al.id] = {
        dias: diasObj,
        faltas: det.faltas ?? '',
        t1: det.t1 ?? '',
        t2: det.t2 ?? '',
        t3: det.t3 ?? '',
        t4: det.t4 ?? '',
        t5: det.t5 ?? '',
        t6: det.t6 ?? '',
        examen: det.examen ?? '',
        participacion: det.participacion ?? '',
        extraEval: det.extraEval ?? '',
        calificacion: savedCalif !== '' ? savedCalif : (det.calificacion ?? ''),
        observaciones: det.observaciones ?? ''
      };
    });
    setEvalData(initial);
    setHasUnsavedChanges(false);

    // Cargar nombre del docente y contenidos/fechas guardados en capturas_docentes
    const fetchSavedDocente = async () => {
      try {
        const capId = `${grado.replace(/\s+/g, '')}_${grupo}_${materiaId}_${trimestre}`;
        const snap = await getDoc(doc(db, 'capturas_docentes', capId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.docente && (userRole !== 'docente' || !userName)) {
            setDocenteNombre(data.docente);
          } else if (userName) {
            setDocenteNombre(userName);
          }
          setContenidosFecha(data.contenidosFecha || {});
        } else {
          if (userName) setDocenteNombre(userName);
          setContenidosFecha({});
        }
      } catch (err) {
        console.error('Error loading docente metadata:', err);
      }
    };
    fetchSavedDocente();
  }, [alumnosGrupo, grado, grupo, materiaId, trimestre, userName, userRole]);

  const handleFieldChange = (studentId, field, value) => {
    if (isReadOnlyForCurrentUser) return;
    setEvalData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleDiaChange = (studentId, dayKey, value) => {
    if (isReadOnlyForCurrentUser) return;
    setEvalData(prev => {
      const studentRow = prev[studentId] || {};
      return {
        ...prev,
        [studentId]: {
          ...studentRow,
          dias: {
            ...(studentRow.dias || {}),
            [dayKey]: value
          }
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleContenidoFechaChange = (colKey, value) => {
    if (isReadOnlyForCurrentUser) return;
    setContenidosFecha(prev => ({
      ...prev,
      [colKey]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Navegación con Enter / Flecha Abajo entre alumnos dentro de la Lista Oficial (salta automáticamente filas de Baja)
  const handleGridKeyDown = (e, rowIdx, colKey) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      for (let r = rowIdx + 1; r < alumnosGrupo.length; r++) {
        const next = document.querySelector(`input[data-docente-cell="${r}-${colKey}"]`);
        if (next) {
          next.focus();
          next.select();
          break;
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      for (let r = rowIdx - 1; r >= 0; r--) {
        const prev = document.querySelector(`input[data-docente-cell="${r}-${colKey}"]`);
        if (prev) {
          prev.focus();
          prev.select();
          break;
        }
      }
    }
  };

  // Detectar cuántas celdas/columnas de los 20 días tuvieron clase (tienen fecha/contenido arriba o al menos 1 alumno con calificación numérica)
  const resumenDiasClase = useMemo(() => {
    const columnasConClase = [];
    DAYS_COLS.forEach(col => {
      const dKey = `d${col}`;
      const tieneEncabezado = (contenidosFecha[dKey] || '').trim() !== '';
      const tieneCalifNumerica = alumnosGrupo.some(al => {
        if ((al.status || '').toLowerCase() === 'baja') return false;
        const val = parseFloat(evalData[al.id]?.dias?.[dKey]);
        return !isNaN(val);
      });
      if (tieneEncabezado || tieneCalifNumerica) {
        columnasConClase.push(dKey);
      }
    });
    return {
      totalClasesGrupo: columnasConClase.length,
      columnasConClase
    };
  }, [contenidosFecha, alumnosGrupo, evalData]);

  // Calcular Suma y Promedio Exacto (sin truncar) de las 20 celdas de días para un alumno
  const getCalculoDiasAlumno = (studentId) => {
    const dias = evalData[studentId]?.dias || {};
    let suma = 0;
    let celdasCalificadasAlumno = 0;

    DAYS_COLS.forEach(col => {
      const raw = (dias[`d${col}`] ?? '').toString().trim();
      if (raw !== '') {
        const num = parseFloat(raw);
        if (!isNaN(num)) {
          suma += num;
          celdasCalificadasAlumno++;
        }
      }
    });

    const divisor = modoDivisorDias === 'clases_grupo'
      ? resumenDiasClase.totalClasesGrupo
      : celdasCalificadasAlumno;

    if (divisor === 0 || (celdasCalificadasAlumno === 0 && suma === 0)) {
      return { suma: null, promedioExacto: null, celdasCalificadasAlumno, divisor };
    }

    const promExacto = suma / divisor;
    // Mostrar hasta 2 decimales exactos sin truncar (o entero si es exacto)
    const promFormateado = Number.isInteger(promExacto)
      ? promExacto.toFixed(1)
      : Number(promExacto.toFixed(2)).toString();

    return {
      suma: Number(suma.toFixed(2)),
      promedioExacto: promExacto,
      promedioStr: promFormateado,
      celdasCalificadasAlumno,
      divisor
    };
  };

  // Pasar el promedio de los 20 días de clase a la columna Calif. Trim. (redondeado a entero oficial o exacto para referencia interna)
  const aplicarPromedioDiasACalificacion = (redondearAEntero = true) => {
    if (isReadOnlyForCurrentUser) return;
    let count = 0;
    const next = { ...evalData };
    alumnosGrupo.forEach(al => {
      if ((al.status || '').toLowerCase() === 'baja') return;
      const calc = getCalculoDiasAlumno(al.id);
      if (calc.promedioExacto !== null && !isNaN(calc.promedioExacto)) {
        const valFinal = redondearAEntero
          ? Math.round(calc.promedioExacto)
          : calc.promedioStr;
        next[al.id] = {
          ...(next[al.id] || {}),
          calificacion: String(valFinal)
        };
        count++;
      }
    });

    if (count > 0) {
      setEvalData(next);
      setHasUnsavedChanges(true);
      toast.success(
        redondearAEntero
          ? `Se pasó el promedio de las ${resumenDiasClase.totalClasesGrupo} celdas de clase (redondeado a entero oficial) a ${count} alumnos.`
          : `Se pasó el promedio exacto de las ${resumenDiasClase.totalClasesGrupo} celdas de clase a ${count} alumnos.`
      );
    } else {
      toast.error('Aún no hay calificaciones numéricas capturadas en las celdas 1 a 20.');
    }
  };

  // Calcular promedio automático desde Tareas (T1..T6), Examen, Participación y Columna Extra para un alumno (redondeado a entero)
  const autocalcularFila = (studentId) => {
    if (isReadOnlyForCurrentUser) return;
    const row = evalData[studentId] || {};
    const vals = ['t1', 't2', 't3', 't4', 't5', 't6', 'examen', 'participacion', 'extraEval']
      .map(k => parseFloat(row[k]))
      .filter(n => !isNaN(n));
    if (vals.length === 0) return;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    handleFieldChange(studentId, 'calificacion', String(Math.round(avg)));
  };

  const autocalcularTodos = () => {
    if (isReadOnlyForCurrentUser) return;
    let updatedCount = 0;
    const next = { ...evalData };
    alumnosGrupo.forEach(al => {
      const isBaja = (al.status || '').toLowerCase() === 'baja';
      if (isBaja) return;
      const row = next[al.id] || {};
      const vals = ['t1', 't2', 't3', 't4', 't5', 't6', 'examen', 'participacion', 'extraEval']
        .map(k => parseFloat(row[k]))
        .filter(n => !isNaN(n));
      if (vals.length > 0) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        next[al.id] = {
          ...row,
          calificacion: String(Math.round(avg))
        };
        updatedCount++;
      }
    });
    if (updatedCount > 0) {
      setEvalData(next);
      setHasUnsavedChanges(true);
      toast.success(`Se calculó la calificación entera redondeada de ${updatedCount} alumnos a partir de sus actividades.`);
    } else {
      toast.error('Ingresa primero valores en Tareas, Examen o Participación.');
    }
  };

  // Cálculo automático en tiempo real de todos los requisitos estadísticos de Coordinación
  const stats = useMemo(() => {
    let existenciaH = 0;
    let existenciaM = 0;
    let regularesH = 0;
    let regularesM = 0;
    let irregularesH = 0;
    let irregularesM = 0;
    let sumaCalif = 0;
    let totalEvaluados = 0;

    alumnosGrupo.forEach(al => {
      const isBaja = (al.status || '').toLowerCase() === 'baja';
      if (isBaja) return; // Las bajas no cuentan en la existencia activa

      const gen = getStudentGender(al);
      if (gen === 'M') existenciaM++;
      else existenciaH++;

      const rawCalif = evalData[al.id]?.calificacion;
      const numCalif = parseFloat(rawCalif);
      if (!isNaN(numCalif) && numCalif > 0) {
        totalEvaluados++;
        sumaCalif += numCalif;
        if (numCalif >= 6.0) {
          if (gen === 'M') regularesM++;
          else regularesH++;
        } else {
          if (gen === 'M') irregularesM++;
          else irregularesH++;
        }
      }
    });

    const existenciaT = existenciaH + existenciaM;
    const regularesT = regularesH + regularesM;
    const irregularesT = irregularesH + irregularesM;

    const promedioAprovechamiento = totalEvaluados > 0
      ? truncateTo1Dec(sumaCalif / totalEvaluados)
      : '';

    const baseAprobacion = totalEvaluados > 0 ? totalEvaluados : existenciaT;
    const porcentajeAprobacion = (totalEvaluados > 0 && baseAprobacion > 0)
      ? truncateTo1Dec((regularesT / baseAprobacion) * 100)
      : '';

    return {
      existenciaH,
      existenciaM,
      existenciaT,
      regularesH: totalEvaluados > 0 ? regularesH : '',
      regularesM: totalEvaluados > 0 ? regularesM : '',
      regularesT: totalEvaluados > 0 ? regularesT : '',
      irregularesH: totalEvaluados > 0 ? irregularesH : '',
      irregularesM: totalEvaluados > 0 ? irregularesM : '',
      irregularesT: totalEvaluados > 0 ? irregularesT : '',
      promedioAprovechamiento,
      porcentajeAprobacion,
      totalEvaluados,
      faltantes: Math.max(0, existenciaT - totalEvaluados)
    };
  }, [alumnosGrupo, evalData]);

  // Guardar calificaciones, celdas diarias y encabezados de fecha/contenido en Firestore
  const handleSaveGrades = async (silent = false) => {
    if (isReadOnlyForCurrentUser) {
      toast.error('La captura para este trimestre ha sido bloqueada por Control Escolar.');
      return false;
    }
    if (alumnosGrupo.length === 0) return false;

    // Validar rango oficial SEP/PASEG (5.0 a 10.0) en la columna Calif. Trim. antes de guardar
    for (const al of alumnosGrupo) {
      const isBaja = (al.status || '').toLowerCase() === 'baja';
      if (isBaja) continue;
      const rawCalif = (evalData[al.id]?.calificacion ?? '').toString().trim();
      if (rawCalif !== '') {
        const num = parseFloat(rawCalif);
        if (isNaN(num) || num < 5 || num > 10) {
          toast.error(`La calificación trimestral final de ${al.apellidoPaterno || ''} ${al.nombres || ''} (${rawCalif}) debe estar entre 5 y 10.`);
          return false;
        }
      }
    }

    setIsSaving(true);
    try {
      const promises = alumnosGrupo.map(al => {
        const isBaja = (al.status || '').toLowerCase() === 'baja';
        if (isBaja) return Promise.resolve();

        const row = evalData[al.id] || {};
        const docRef = doc(db, 'students', al.id);
        const califEnteraOficial = roundToIntGrade(row.calificacion, '');
        return updateDoc(docRef, {
          [`calificaciones.${trimestre}.${materiaId}`]: califEnteraOficial,
          [`evaluacionDetalle.${trimestre}.${materiaId}`]: {
            dias: row.dias || {},
            faltas: row.faltas ?? '',
            t1: row.t1 ?? '',
            t2: row.t2 ?? '',
            t3: row.t3 ?? '',
            t4: row.t4 ?? '',
            t5: row.t5 ?? '',
            t6: row.t6 ?? '',
            examen: row.examen ?? '',
            participacion: row.participacion ?? '',
            extraEval: row.extraEval ?? '',
            calificacion: califEnteraOficial !== '' ? califEnteraOficial : (row.calificacion ?? ''),
            observaciones: row.observaciones ?? '',
            docente: docenteNombre.trim(),
            updatedAt: new Date().toISOString()
          }
        });
      });

      // Guardar metadatos de entrega y encabezados de CONTENIDOS / FECHA para la lista
      const capId = `${grado.replace(/\s+/g, '')}_${grupo}_${materiaId}_${trimestre}`;
      promises.push(
        setDoc(doc(db, 'capturas_docentes', capId), {
          grado,
          grupo,
          materiaId,
          asignatura: asignaturaActual,
          trimestre,
          docente: docenteNombre.trim(),
          emailDocente: currentUser?.email || '',
          contenidosFecha: contenidosFecha || {},
          existenciaT: stats.existenciaT,
          totalEvaluados: stats.totalEvaluados,
          regularesT: stats.regularesT === '' ? 0 : stats.regularesT,
          irregularesT: stats.irregularesT === '' ? 0 : stats.irregularesT,
          promedioAprovechamiento: stats.promedioAprovechamiento,
          porcentajeAprobacion: stats.porcentajeAprobacion,
          updatedAt: serverTimestamp()
        }, { merge: true })
      );

      await Promise.all(promises);
      await registrarMovimiento(
        currentUser?.email,
        userRole === 'docente' ? 'Portal Docente' : 'Control Escolar (Calificaciones)',
        'Captura por Disciplina',
        `Guardó calificaciones de ${asignaturaActual} (${grado} "${grupo}" - Trimestre ${TRIMESTRE_LABELS[trimestre] || trimestre}) | Docente: ${docenteNombre.trim() || 'S/N'} | Evaluados: ${stats.totalEvaluados}/${stats.existenciaT} | Prom: ${stats.promedioAprovechamiento || '-'}`
      );
      setHasUnsavedChanges(false);
      if (!silent) {
        toast.success('¡Lista, calificaciones diarias y estadística guardadas en el sistema!');
      }
      setIsSaving(false);
      return true;
    } catch (error) {
      console.error('Error al guardar evaluación docente:', error);
      toast.error('Hubo un error al guardar las calificaciones.');
      setIsSaving(false);
      return false;
    }
  };

  const handlePrint = async (option) => {
    if (alumnosGrupo.length === 0) {
      toast.error('No hay alumnos en este grupo.');
      return;
    }
    if (hasUnsavedChanges && !isReadOnlyForCurrentUser) {
      await handleSaveGrades(true);
      toast.success('Datos guardados automáticamente antes de imprimir.');
    }
    setPrintOption(option);
    setTimeout(() => {
      window.print();
    }, 350);
  };

  // Descargar la Lista Oficial de Asistencia y Evaluación en formato Excel (.xlsx) editable con fórmulas
  const handleDownloadExcelEditable = async () => {
    if (alumnosGrupo.length === 0) {
      toast.error('No hay alumnos en este grupo para descargar la lista.');
      return;
    }
    const esVespertino = ['G', 'H', 'I', 'J', 'K', 'L'].includes(grupo);
    await descargarListaAsistenciaEditableExcel({
      students: alumnosGrupo,
      grado,
      grupo,
      asignatura: asignaturaActual,
      docente: docenteNombre,
      trimestreLabel: TRIMESTRE_LABELS[trimestre] || 'I',
      cicloEscolar: config?.cicloEscolarActual || '2025 - 2026',
      coordinadorNombre: esVespertino
        ? (config?.coordinadorVespertino || 'Profr. José Barrera Vázquez')
        : (config?.coordinadorMatutino || 'Profra. Lucila Rodríguez Martínez'),
      evalData,
      contenidosFecha
    });
    toast.success('¡Lista Editable en Excel (.xlsx) descargada! El docente puede llenarla en su computadora.');
  };

  // Subir/Importar la Lista Editable en Excel (.xlsx) entregada por el docente
  const handleImportExcelEditable = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isReadOnlyForCurrentUser) {
      toast.error('La captura para este trimestre está bloqueada.');
      e.target.value = '';
      return;
    }
    try {
      const result = await importarListaAsistenciaEditableExcel(file, alumnosGrupo);
      if (result.matchedCount > 0) {
        if (result.docenteDetectado && !docenteNombre) {
          setDocenteNombre(autoAcentuar(result.docenteDetectado));
        }
        if (Object.keys(result.contenidosFecha || {}).length > 0) {
          setContenidosFecha(prev => ({ ...prev, ...result.contenidosFecha }));
        }
        setEvalData(prev => {
          const next = { ...prev };
          Object.keys(result.importedEval).forEach(stId => {
            next[stId] = {
              ...(next[stId] || {}),
              ...result.importedEval[stId]
            };
          });
          return next;
        });
        setHasUnsavedChanges(true);
        toast.success(`¡Se cargaron las calificaciones y asistencias de ${result.matchedCount} alumnos desde el Excel! Da clic en "Guardar Calificaciones en Sistema".`);
      } else {
        toast.error('No se encontraron coincidencias de alumnos en el archivo Excel seleccionado.');
      }
    } catch (err) {
      console.error('Error al importar lista Excel:', err);
      toast.error('No se pudo leer el archivo Excel (.xlsx). Verifica que sea el formato descargado del sistema.');
    }
    e.target.value = '';
  };

  const turnoActual = ['G', 'H', 'I', 'J', 'K', 'L'].includes(grupo) ? 'Vespertino' : 'Matutino';

  return (
    <div className="space-y-6">
      {/* Banner de Candado si el trimestre está cerrado */}
      {isLockedForTeachers && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 no-print ${
          isReadOnlyForCurrentUser
            ? 'bg-red-50 border-red-200 text-red-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <Lock className="w-5 h-5 shrink-0" />
            {isReadOnlyForCurrentUser ? (
              <span>
                El periodo de captura para el <strong>Trimestre {TRIMESTRE_LABELS[trimestre]}</strong> ha sido cerrado por Control Escolar. Puedes consultar e imprimir tus listas y cuadros, pero si requieres una corrección acude con el Secretario de tu grado.
              </span>
            ) : (
              <span>
                El <strong>Trimestre {TRIMESTRE_LABELS[trimestre]}</strong> está bloqueado para Docentes, pero como personal de <strong>Control Escolar</strong> tienes acceso total para capturar o corregir aquí.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Controles Superiores de Selección */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Grado</label>
            <select
              value={grado}
              onChange={e => setGrado(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 bg-slate-50"
            >
              <option value="1er Grado">1er Grado</option>
              <option value="2do Grado">2do Grado</option>
              <option value="3er Grado">3er Grado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Grupo ({turnoActual})
            </label>
            <select
              value={grupo}
              onChange={e => setGrupo(e.target.value)}
              translate="no"
              className="notranslate w-full p-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 bg-slate-50"
            >
              <optgroup label="Turno Matutino (A - F)">
                <option value="A">Grupo "A" (Matutino)</option>
                <option value="B">Grupo "B" (Matutino)</option>
                <option value="C">Grupo "C" (Matutino)</option>
                <option value="D">Grupo "D" (Matutino)</option>
                <option value="E">Grupo "E" (Matutino)</option>
                <option value="F">Grupo "F" (Matutino)</option>
              </optgroup>
              <optgroup label="Turno Vespertino (G - L)">
                <option value="G">Grupo "G" (Vespertino)</option>
                <option value="H">Grupo "H" (Vespertino)</option>
                <option value="I">Grupo "I" (Vespertino)</option>
                <option value="J">Grupo "J" (Vespertino)</option>
                <option value="K">Grupo "K" (Vespertino)</option>
                <option value="L">Grupo "L" (Vespertino)</option>
              </optgroup>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Disciplina / Materia</label>
            <select
              value={materiaId}
              onChange={e => setMateriaId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-indigo-800 bg-indigo-50/60"
            >
              {materias.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id.startsWith('tecnologia') ? `${m.name} — ${TALLER_POR_GRUPO[grupo]}` : m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Trimestre a Evaluar</label>
            <select
              value={trimestre}
              onChange={e => setTrimestre(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-primary-700 bg-primary-50"
            >
              <option value="t1">Trimestre I (1°) {config?.trimestresBloqueadosDocentes?.t1 ? '🔒' : ''}</option>
              <option value="t2">Trimestre II (2°) {config?.trimestresBloqueadosDocentes?.t2 ? '🔒' : ''}</option>
              <option value="t3">Trimestre III (3°) {config?.trimestresBloqueadosDocentes?.t3 ? '🔒' : ''}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-slate-100 items-end">
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Nombre del Docente (Aparecerá en el encabezado y firma)
            </label>
            <input
              type="text"
              disabled={isReadOnlyForCurrentUser}
              value={docenteNombre}
              onChange={e => {
                setDocenteNombre(autoAcentuar(e.target.value));
                setHasUnsavedChanges(true);
              }}
              placeholder="Ej. Profr. Roberto Hernández Gómez"
              className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
            />
          </div>

          <div className="lg:col-span-6">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Modalidad de Captura</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setModoCaptura('rapido')}
                className={`py-2 px-2 rounded-md text-xs font-bold transition ${
                  modoCaptura === 'rapido' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Rápida (Calif. y Faltas)
              </button>
              <button
                type="button"
                onClick={() => setModoCaptura('detallado')}
                className={`py-2 px-2 rounded-md text-xs font-bold transition ${
                  modoCaptura === 'detallado' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Completa (+Tareas/Exam)
              </button>
              <button
                type="button"
                onClick={() => setModoCaptura('lista_oficial')}
                className={`py-2 px-2 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 ${
                  modoCaptura === 'lista_oficial' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                Lista Oficial (20 Celdas + Fechas)
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tamaño de Hoja</label>
            <select
              value={paperSize}
              onChange={e => setPaperSize(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg font-bold text-teal-800 bg-teal-50 text-sm"
            >
              <option value="letter">Tamaño Carta (1 Hoja)</option>
              <option value="legal">Tamaño Oficio (Legal)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Panel Especial de Control para la Modalidad "Lista Oficial (20 Celdas + Fechas)" */}
      {modoCaptura === 'lista_oficial' && (
        <div className="bg-emerald-950 text-white p-4 rounded-xl border border-emerald-700 shadow-md space-y-3 no-print">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Lista Oficial Interactiva — Registro por Día de Clase y Fecha (Sin Truncar)
              </h4>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Escribe arriba de cada columna (`1` al `20`) <strong>qué calificaste ese día y la fecha</strong>, y debajo la calificación de cada alumno. La tabla suma todas sus calificaciones diarias y las divide entre los días que hubo clase sin afectar nada más.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-900/90 border border-emerald-600 text-xs font-bold text-emerald-200">
                Celdas / Días con clase detectados: <strong className="text-white text-sm">{resumenDiasClase.totalClasesGrupo}</strong> de 20
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-emerald-200">Método de división del promedio diario:</span>
              <select
                value={modoDivisorDias}
                onChange={e => setModoDivisorDias(e.target.value)}
                className="p-1.5 rounded bg-emerald-900 border border-emerald-600 text-white font-bold text-xs"
              >
                <option value="clases_grupo">
                  Dividir suma entre el TOTAL de días que hubo clase ({resumenDiasClase.totalClasesGrupo} celdas activas)
                </option>
                <option value="celdas_alumno">
                  Dividir suma solo entre las celdas calificadas de cada alumno
                </option>
              </select>
            </div>

            {!isReadOnlyForCurrentUser && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => aplicarPromedioDiasACalificacion(true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg transition shadow-sm flex items-center gap-1.5"
                  title="Copia el promedio de los días de clase redondeado a número entero oficial a la columna Calif. Trim."
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Pasar a Calif. Trim. (Redondeado a Entero Oficial)
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPromedioDiasACalificacion(false)}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600 font-bold rounded-lg transition flex items-center gap-1.5"
                  title="Copia el promedio exacto de los días de clase con decimales para uso interno en la lista del docente"
                >
                  Pasar Prom. de Días (Exacto en Lista)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tarjeta de Estadística Automática en Vivo (Requisitos de Coordinación) */}
      <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-sm overflow-hidden no-print">
        <div className="bg-indigo-900 text-white px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-300" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider">
              Requisitos Estadísticos para Coordinación (Calculados en Automático)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {stats.faltantes > 0 ? (
              <button
                type="button"
                onClick={() => setHighlightEmpty(!highlightEmpty)}
                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition ${
                  highlightEmpty
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-amber-500/20 text-amber-200 border border-amber-400/40 hover:bg-amber-500/30'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                {highlightEmpty ? 'Ocultar resalte' : `Resaltar ${stats.faltantes} sin calificar`}
              </button>
            ) : (
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold">
                ✅ 100% Evaluados
              </span>
            )}
            <span className="text-xs font-semibold text-indigo-200">
              Alumnos Evaluados: <strong className="text-white">{stats.totalEvaluados}</strong> de <strong className="text-white">{stats.existenciaT}</strong> activos
            </span>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full border-collapse text-center text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-200 font-extrabold uppercase text-slate-800">
                <th colSpan={3} className="border border-slate-300 py-1.5 px-2">Existencia (Activos)</th>
                <th colSpan={3} className="border border-slate-300 py-1.5 px-2 bg-emerald-100 text-emerald-950">Alumnos Regulares (Aprobados &ge; 6)</th>
                <th colSpan={3} className="border border-slate-300 py-1.5 px-2 bg-red-100 text-red-950">Alumnos Irregulares (Reprobados &lt; 6)</th>
                <th rowSpan={2} className="border border-slate-300 py-1.5 px-3 bg-indigo-50 text-indigo-950">Promedio de<br/>Aprovechamiento</th>
                <th rowSpan={2} className="border border-slate-300 py-1.5 px-3 bg-indigo-50 text-indigo-950">% de<br/>Aprobación</th>
              </tr>
              <tr className="bg-slate-100 font-bold text-[11px] text-slate-600">
                <th className="border border-slate-300 py-1">Hombres</th>
                <th className="border border-slate-300 py-1">Mujeres</th>
                <th className="border border-slate-300 py-1 bg-slate-200 text-slate-900">Total</th>
                <th className="border border-slate-300 py-1">Hombres</th>
                <th className="border border-slate-300 py-1">Mujeres</th>
                <th className="border border-slate-300 py-1 bg-emerald-200/70 text-emerald-950">Total</th>
                <th className="border border-slate-300 py-1">Hombres</th>
                <th className="border border-slate-300 py-1">Mujeres</th>
                <th className="border border-slate-300 py-1 bg-red-200/70 text-red-950">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-sm bg-white">
                <td className="border border-slate-300 py-2">{stats.existenciaH}</td>
                <td className="border border-slate-300 py-2">{stats.existenciaM}</td>
                <td className="border border-slate-300 py-2 bg-slate-100 font-black text-base">{stats.existenciaT}</td>

                <td className="border border-slate-300 py-2 text-emerald-800">{stats.regularesH !== '' ? stats.regularesH : '-'}</td>
                <td className="border border-slate-300 py-2 text-emerald-800">{stats.regularesM !== '' ? stats.regularesM : '-'}</td>
                <td className="border border-slate-300 py-2 bg-emerald-50 font-black text-emerald-900 text-base">{stats.regularesT !== '' ? stats.regularesT : '-'}</td>

                <td className="border border-slate-300 py-2 text-red-700">{stats.irregularesH !== '' ? stats.irregularesH : '-'}</td>
                <td className="border border-slate-300 py-2 text-red-700">{stats.irregularesM !== '' ? stats.irregularesM : '-'}</td>
                <td className="border border-slate-300 py-2 bg-red-50 font-black text-red-800 text-base">{stats.irregularesT !== '' ? stats.irregularesT : '-'}</td>

                <td className="border border-slate-300 py-2 bg-indigo-50/40 font-black text-indigo-900 text-base">
                  {stats.promedioAprovechamiento !== '' ? stats.promedioAprovechamiento : '-'}
                </td>
                <td className="border border-slate-300 py-2 bg-indigo-50/40 font-black text-indigo-900 text-base">
                  {stats.porcentajeAprobacion !== '' ? `${stats.porcentajeAprobacion} %` : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de Botones de Guardado y las 2 Opciones de Impresión */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSaveGrades(false)}
            disabled={isSaving || isReadOnlyForCurrentUser}
            className="flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReadOnlyForCurrentUser ? <Lock className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isReadOnlyForCurrentUser ? 'Captura Cerrada' : isSaving ? 'Guardando...' : 'Guardar Calificaciones en Sistema'}
          </button>
          {hasUnsavedChanges ? (
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Hay cambios sin guardar
            </span>
          ) : (
            <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Sincronizado con Control Escolar
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {(modoCaptura === 'detallado' || modoCaptura === 'lista_oficial') && !isReadOnlyForCurrentUser && (
            <button
              type="button"
              onClick={autocalcularTodos}
              className="flex items-center px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-semibold text-xs transition"
            >
              <Calculator className="w-4 h-4 mr-1.5" /> Promediar T1..T6 / Examen
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadExcelEditable}
            className="flex items-center px-3.5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-sm"
            title="Descarga esta Lista de Asistencia y Evaluación en archivo Excel (.xlsx) editable con fórmulas para profesores que prefieran trabajar fuera de la plataforma"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Descargar Lista Editable (.xlsx)
          </button>

          {!isReadOnlyForCurrentUser && (
            <label
              className="cursor-pointer flex items-center px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-extrabold text-xs sm:text-sm transition shadow-sm"
              title="Si el profesor llenó su Lista Editable en Excel (.xlsx) y te la entregó, súbela aquí para cargar sus calificaciones automáticamente"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              Subir Lista Excel (.xlsx)
              <input type="file" accept=".xlsx" className="hidden" onChange={handleImportExcelEditable} />
            </label>
          )}

          <button
            type="button"
            onClick={() => handlePrint('opcion1_lista')}
            className="flex items-center px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-sm"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Opción 1: Imprimir Lista de Evaluación Llena
          </button>

          <button
            type="button"
            onClick={() => handlePrint('opcion2_cuadro')}
            className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Opción 2: Imprimir Cuadro de Concentración
          </button>
        </div>
      </div>

      {/* Tabla de Captura de Alumnos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm border-collapse">
            <thead className="bg-slate-800 text-white">
              {/* Fila extra superior de CONTENIDOS / FECHA cuando está activa la modalidad Lista Oficial */}
              {modoCaptura === 'lista_oficial' && (
                <tr className="bg-emerald-950 border-b border-emerald-800">
                  <th colSpan={3} className="px-3 py-2 text-right text-[11px] font-black uppercase text-emerald-300 sticky left-0 z-20 bg-emerald-950 border-r border-emerald-800">
                    CONTENIDOS / FECHA DE CLASE &rarr;
                  </th>
                  {DAYS_COLS.map(col => {
                    const dKey = `d${col}`;
                    return (
                      <th key={`header-fecha-${col}`} className="p-1 border-r border-emerald-800/60 min-w-[56px]">
                        <input
                          type="text"
                          disabled={isReadOnlyForCurrentUser}
                          value={contenidosFecha[dKey] ?? ''}
                          onChange={e => handleContenidoFechaChange(dKey, e.target.value)}
                          placeholder={`Día ${col}`}
                          title={`Anote la fecha o actividad evaluada en la columna ${col} (ej. 12/Oct Mapa)`}
                          className="w-full px-1 py-1 text-[10px] text-center font-bold bg-emerald-900/70 text-white placeholder-emerald-400/50 border border-emerald-700 rounded focus:bg-white focus:text-slate-900 focus:outline-none"
                        />
                      </th>
                    );
                  })}
                  <th colSpan={2} className="px-2 py-1 text-center text-[10px] font-extrabold text-emerald-200 bg-emerald-900/50 border-r border-emerald-800">
                    Cálculo de los 20 Días
                  </th>
                  <th className="bg-slate-800"></th>
                  {TASK_COLS.map(col => {
                    const tKey = `t${col}`;
                    return (
                      <th key={`header-tfecha-${col}`} className="p-1 border-r border-slate-700 min-w-[52px]">
                        <input
                          type="text"
                          disabled={isReadOnlyForCurrentUser}
                          value={contenidosFecha[tKey] ?? ''}
                          onChange={e => handleContenidoFechaChange(tKey, e.target.value)}
                          placeholder={`Tema T${col}`}
                          className="w-full px-1 py-1 text-[10px] text-center font-bold bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded focus:bg-white focus:text-slate-900 focus:outline-none"
                        />
                      </th>
                    );
                  })}
                  <th colSpan={5} className="bg-slate-800"></th>
                </tr>
              )}

              <tr>
                <th className="px-2 py-3 text-center text-xs font-bold uppercase w-10 sticky left-0 z-10 bg-slate-900 border-r border-slate-700">N°</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase min-w-[230px] sticky left-10 z-10 bg-slate-900 border-r border-slate-700">Nombre del Alumno(a)</th>
                <th className="px-2 py-3 text-center text-xs font-bold uppercase w-10 border-r border-slate-700">Sexo</th>

                {modoCaptura === 'lista_oficial' && (
                  <>
                    {DAYS_COLS.map(col => {
                      const activa = resumenDiasClase.columnasConClase.includes(`d${col}`);
                      return (
                        <th
                          key={`th-d-${col}`}
                          className={`px-1 py-2 text-center text-[11px] font-extrabold uppercase w-14 border-r border-slate-700 ${
                            activa ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {col}
                        </th>
                      );
                    })}
                    <th className="px-2 py-2 text-center text-[10px] font-black uppercase w-16 bg-emerald-900 text-emerald-200 border-r border-emerald-700" title="Suma total de las calificaciones anotadas en las celdas 1 a 20">
                      Suma<br/>Días
                    </th>
                    <th className="px-2 py-2 text-center text-[10px] font-black uppercase w-20 bg-emerald-950 text-emerald-300 border-r border-emerald-700" title="Promedio exacto sin truncar: Suma dividida entre el total de celdas que hubo clase">
                      Prom.<br/>Clases
                    </th>
                  </>
                )}

                <th className="px-2 py-3 text-center text-xs font-bold uppercase w-20 bg-slate-700 border-r border-slate-600" title="Total de Faltas en el Trimestre">
                  Faltas (T.F.)
                </th>
                {(modoCaptura === 'detallado' || modoCaptura === 'lista_oficial') && (
                  <>
                    {TASK_COLS.map(t => (
                      <th key={`th-t-${t}`} className="px-1.5 py-3 text-center text-[11px] font-bold uppercase w-14 text-slate-300 border-r border-slate-700">
                        T{t}
                      </th>
                    ))}
                    <th className="px-1.5 py-3 text-center text-[11px] font-bold uppercase w-16 text-amber-200 border-r border-slate-700">Exam.</th>
                    <th className="px-1.5 py-3 text-center text-[11px] font-bold uppercase w-16 text-amber-200 border-r border-slate-700">Partic.</th>
                    <th className="px-1.5 py-3 text-center text-[11px] font-bold uppercase w-16 text-amber-200 border-r border-slate-700" title="Columna adicional de evaluación">Otro</th>
                  </>
                )}
                <th className="px-3 py-3 text-center text-xs font-black uppercase w-28 bg-indigo-950 text-indigo-200 border-r border-slate-700">
                  Calif. Trim.
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase w-24 border-r border-slate-700">Situación</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase min-w-[160px]">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {alumnosGrupo.map((al, idx) => {
                const isBaja = (al.status || '').toLowerCase() === 'baja';
                const isAlta = !isBaja && al.tipoIngreso === 'Alta';
                const gen = getStudentGender(al);
                const row = evalData[al.id] || {};
                const califStr = (row.calificacion ?? '').toString().trim();
                const isEmptyGrade = !isBaja && califStr === '';
                const califNum = parseFloat(califStr);
                const isReprobado = !isNaN(califNum) && califNum < 6;
                const isAprobado = !isNaN(califNum) && califNum >= 6;
                const calcDias = modoCaptura === 'lista_oficial' ? getCalculoDiasAlumno(al.id) : null;

                return (
                  <tr
                    key={al.id}
                    className={
                      isBaja
                        ? 'bg-slate-100 text-slate-400'
                        : highlightEmpty && isEmptyGrade
                          ? 'bg-amber-100/80 hover:bg-amber-100'
                          : isReprobado
                            ? 'bg-red-50/40 hover:bg-red-50/70'
                            : idx % 2 === 0
                              ? 'bg-white hover:bg-slate-50'
                              : 'bg-slate-50/60 hover:bg-slate-100/60'
                    }
                  >
                    <td className="px-2 py-2.5 text-center font-bold text-slate-500 sticky left-0 z-10 bg-inherit border-r border-slate-200">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-bold uppercase text-slate-800 sticky left-10 z-10 bg-inherit border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className={isBaja ? 'line-through text-slate-400' : ''}>
                          {al.apellidoPaterno} {al.apellidoMaterno} {al.nombres}
                        </span>
                        {isAlta && (
                          <span className="px-1.5 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-400 rounded">
                            ALTA
                          </span>
                        )}
                        {isBaja && (
                          <span className="px-1.5 py-0.5 text-[10px] font-black bg-red-100 text-red-800 border border-red-400 rounded">
                            BAJA {al.fechaBaja ? `(${al.fechaBaja})` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center font-bold text-xs text-slate-500 border-r border-slate-200">{gen}</td>

                    {isBaja ? (
                      <td
                        colSpan={
                          modoCaptura === 'lista_oficial'
                            ? 35
                            : modoCaptura === 'detallado'
                              ? 13
                              : 4
                        }
                        className="px-4 py-2.5 text-center font-bold text-xs tracking-widest text-slate-400 uppercase bg-slate-100"
                      >
                        — B A J A &nbsp; O F I C I A L — (No se evalúa ni cuenta en existencia activa)
                      </td>
                    ) : (
                      <>
                        {/* 20 Celdas de Asistencia o Calificación Diaria cuando está en modo Lista Oficial */}
                        {modoCaptura === 'lista_oficial' && (
                          <>
                            {DAYS_COLS.map(col => {
                              const dKey = `d${col}`;
                              const valDia = row.dias?.[dKey] ?? '';
                              const activa = resumenDiasClase.columnasConClase.includes(dKey);
                              return (
                                <td key={`td-d-${al.id}-${col}`} className={`p-1 text-center border-r border-slate-200 ${activa ? 'bg-emerald-50/30' : ''}`}>
                                  <input
                                    type="text"
                                    disabled={isReadOnlyForCurrentUser}
                                    data-docente-cell={`${idx}-${dKey}`}
                                    value={valDia}
                                    onKeyDown={e => handleGridKeyDown(e, idx, dKey)}
                                    onChange={e => handleDiaChange(al.id, dKey, e.target.value)}
                                    className="w-12 p-1 text-center border border-slate-300 rounded text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-slate-100"
                                  />
                                </td>
                              );
                            })}
                            <td className="px-2 py-2 text-center font-bold text-xs bg-emerald-50/70 text-emerald-900 border-r border-emerald-200">
                              {calcDias?.suma !== null ? calcDias.suma : '-'}
                            </td>
                            <td className="px-2 py-2 text-center font-black text-sm bg-emerald-100/80 text-emerald-950 border-r border-emerald-300" title={calcDias?.suma !== null ? `${calcDias.suma} ÷ ${calcDias.divisor} clases` : ''}>
                              {calcDias?.promedioStr || '-'}
                            </td>
                          </>
                        )}

                        {/* Faltas T.F. */}
                        <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-200">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            disabled={isReadOnlyForCurrentUser}
                            data-docente-cell={`${idx}-faltas`}
                            value={row.faltas ?? ''}
                            onKeyDown={e => handleGridKeyDown(e, idx, 'faltas')}
                            onChange={e => handleFieldChange(al.id, 'faltas', e.target.value)}
                            placeholder="0"
                            className="w-16 p-1.5 text-center border border-slate-300 rounded-md font-semibold text-slate-700 focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
                          />
                        </td>

                        {/* Sub-columnas de Tareas, Examen, Participación y Columna Extra */}
                        {(modoCaptura === 'detallado' || modoCaptura === 'lista_oficial') && (
                          <>
                            {TASK_COLS.map(t => (
                              <td key={`td-t-${al.id}-${t}`} className="px-1 py-2 text-center border-r border-slate-200">
                                <input
                                  type="text"
                                  disabled={isReadOnlyForCurrentUser}
                                  data-docente-cell={`${idx}-t${t}`}
                                  value={row[`t${t}`] ?? ''}
                                  onKeyDown={e => handleGridKeyDown(e, idx, `t${t}`)}
                                  onChange={e => handleFieldChange(al.id, `t${t}`, e.target.value)}
                                  className="w-12 p-1 text-center border border-slate-200 rounded text-xs font-medium disabled:bg-slate-100"
                                />
                              </td>
                            ))}
                            <td className="px-1 py-2 text-center bg-amber-50/30 border-r border-slate-200">
                              <input
                                type="text"
                                disabled={isReadOnlyForCurrentUser}
                                data-docente-cell={`${idx}-examen`}
                                value={row.examen ?? ''}
                                onKeyDown={e => handleGridKeyDown(e, idx, 'examen')}
                                onChange={e => handleFieldChange(al.id, 'examen', e.target.value)}
                                className="w-14 p-1 text-center border border-amber-300 rounded text-xs font-semibold disabled:bg-slate-100"
                              />
                            </td>
                            <td className="px-1 py-2 text-center bg-amber-50/30 border-r border-slate-200">
                              <input
                                type="text"
                                disabled={isReadOnlyForCurrentUser}
                                data-docente-cell={`${idx}-participacion`}
                                value={row.participacion ?? ''}
                                onKeyDown={e => handleGridKeyDown(e, idx, 'participacion')}
                                onChange={e => handleFieldChange(al.id, 'participacion', e.target.value)}
                                className="w-14 p-1 text-center border border-amber-300 rounded text-xs font-semibold disabled:bg-slate-100"
                              />
                            </td>
                            <td className="px-1 py-2 text-center bg-amber-50/30 border-r border-slate-200">
                              <input
                                type="text"
                                disabled={isReadOnlyForCurrentUser}
                                data-docente-cell={`${idx}-extraEval`}
                                value={row.extraEval ?? ''}
                                onKeyDown={e => handleGridKeyDown(e, idx, 'extraEval')}
                                onChange={e => handleFieldChange(al.id, 'extraEval', e.target.value)}
                                onBlur={() => {
                                  if (!row.calificacion && modoCaptura === 'detallado') autocalcularFila(al.id);
                                }}
                                className="w-14 p-1 text-center border border-amber-300 rounded text-xs font-semibold disabled:bg-slate-100"
                              />
                            </td>
                          </>
                        )}

                        {/* Calificación del Trimestre */}
                        <td className="px-2 py-2 text-center bg-indigo-50/40 border-r border-slate-200">
                          <input
                            type="number"
                            step="0.01"
                            min="5"
                            max="10"
                            disabled={isReadOnlyForCurrentUser}
                            data-docente-cell={`${idx}-calificacion`}
                            value={row.calificacion ?? ''}
                            onKeyDown={e => handleGridKeyDown(e, idx, 'calificacion')}
                            onChange={e => handleFieldChange(al.id, 'calificacion', e.target.value)}
                            placeholder="-"
                            className={`w-20 p-1.5 text-center border-2 rounded-lg font-black text-base focus:outline-none focus:ring-2 disabled:bg-slate-100 ${
                              highlightEmpty && isEmptyGrade
                                ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400'
                                : isReprobado
                                  ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-500'
                                  : isAprobado
                                    ? 'border-indigo-300 bg-white text-slate-900 focus:ring-indigo-500'
                                    : 'border-slate-300 bg-white text-slate-700 focus:ring-primary-500'
                            }`}
                          />
                        </td>

                        {/* Situación en la Materia */}
                        <td className="px-2 py-2 text-center border-r border-slate-200">
                          {isAprobado && (
                            <span className="px-2 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              REGULAR
                            </span>
                          )}
                          {isReprobado && (
                            <span className="px-2 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-red-800 border border-red-300">
                              IRREGULAR
                            </span>
                          )}
                          {!isAprobado && !isReprobado && (
                            <span className={`text-xs ${highlightEmpty ? 'font-bold text-amber-800' : 'text-slate-400'}`}>
                              Sin capturar
                            </span>
                          )}
                        </td>

                        {/* Observaciones */}
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            disabled={isReadOnlyForCurrentUser}
                            value={row.observaciones ?? ''}
                            onChange={e => handleFieldChange(al.id, 'observaciones', autoAcentuar(e.target.value))}
                            placeholder={isAlta ? `ALTA ${al.fechaAlta || ''}` : 'Opcional...'}
                            className="w-full p-1.5 border border-slate-200 rounded-md text-xs text-slate-700 disabled:bg-slate-100"
                          />
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renderizado de Impresión: Opción 1 (Lista de Evaluación Llena) u Opción 2 (Cuadro de Concentración por Asignatura) */}
      {printOption === 'opcion1_lista' && (
        <ListaAsistenciaPrint
          students={alumnosGrupo}
          grado={grado}
          grupo={grupo}
          paperSize={paperSize}
          isFilled={true}
          docente={docenteNombre}
          asignatura={asignaturaActual}
          trimestreLabel={TRIMESTRE_LABELS[trimestre] || 'I'}
          evalData={evalData}
          contenidosFecha={contenidosFecha}
          stats={stats}
        />
      )}

      {printOption === 'opcion2_cuadro' && (
        <CuadroAsignaturaPrint
          students={alumnosGrupo}
          grado={grado}
          grupo={grupo}
          materiaId={materiaId}
          asignatura={asignaturaActual}
          docente={docenteNombre}
          trimestre={trimestre}
          trimestreLabel={TRIMESTRE_LABELS[trimestre] || 'I'}
          evalData={evalData}
          stats={stats}
          paperSize={paperSize}
        />
      )}
    </div>
  );
}
