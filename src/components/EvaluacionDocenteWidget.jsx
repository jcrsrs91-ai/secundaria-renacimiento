import React, { useState, useEffect, useMemo } from 'react';
import { Save, Printer, CheckCircle, FileSpreadsheet, ClipboardList, Calculator, UserCheck, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { autoAcentuar, truncateTo1Dec } from '../utils/format';
import { materiasPorGrado } from '../utils/materias';
import ListaAsistenciaPrint, { TALLER_POR_GRUPO, getStudentGender, sortAttendanceListStudents } from './ListaAsistenciaPrint';
import CuadroAsignaturaPrint from './CuadroAsignaturaPrint';

const TRIMESTRE_LABELS = {
  t1: 'I (Primero)',
  t2: 'II (Segundo)',
  t3: 'III (Tercero)'
};

export default function EvaluacionDocenteWidget({ students = [] }) {
  const { userName, currentUser, userRole } = useAuth();

  const [grado, setGrado] = useState('1er Grado');
  const [grupo, setGrupo] = useState('A');
  const [trimestre, setTrimestre] = useState('t1');
  const [materiaId, setMateriaId] = useState('espanol1');
  const [docenteNombre, setDocenteNombre] = useState(userName || '');
  const [modoCaptura, setModoCaptura] = useState('rapido'); // 'rapido' | 'detallado'
  const [paperSize, setPaperSize] = useState('letter');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [printOption, setPrintOption] = useState(null); // 'opcion1_lista' | 'opcion2_cuadro'

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
  // evalData[studentId] = { faltas, t1..t6, examen, participacion, calificacion, observaciones }
  const [evalData, setEvalData] = useState({});

  // Cargar datos de los alumnos y metadatos del docente para esa materia/grupo/trimestre
  useEffect(() => {
    const initial = {};
    alumnosGrupo.forEach(al => {
      const savedCalif = al.calificaciones?.[trimestre]?.[materiaId] ?? '';
      const det = al.evaluacionDetalle?.[trimestre]?.[materiaId] || {};
      initial[al.id] = {
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

    // Cargar nombre del docente guardado en capturas_docentes si no es un docente con nombre fijo
    const fetchSavedDocente = async () => {
      try {
        const capId = `${grado.replace(/\s+/g, '')}_${grupo}_${materiaId}_${trimestre}`;
        const snap = await getDoc(doc(db, 'capturas_docentes', capId));
        if (snap.exists() && snap.data().docente) {
          if (userRole !== 'docente' || !userName) {
            setDocenteNombre(snap.data().docente);
          }
        } else if (userName) {
          setDocenteNombre(userName);
        }
      } catch (err) {
        console.error('Error loading docente metadata:', err);
      }
    };
    fetchSavedDocente();
  }, [alumnosGrupo, grado, grupo, materiaId, trimestre, userName, userRole]);

  const handleFieldChange = (studentId, field, value) => {
    setEvalData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Calcular promedio automático desde Tareas (T1..T6), Examen, Participación y Columna Extra para un alumno
  const autocalcularFila = (studentId) => {
    const row = evalData[studentId] || {};
    const vals = ['t1', 't2', 't3', 't4', 't5', 't6', 'examen', 'participacion', 'extraEval']
      .map(k => parseFloat(row[k]))
      .filter(n => !isNaN(n));
    if (vals.length === 0) return;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const rounded = Math.round(avg * 10) / 10;
    handleFieldChange(studentId, 'calificacion', String(rounded));
  };

  const autocalcularTodos = () => {
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
          calificacion: String(truncateTo1Dec(avg))
        };
        updatedCount++;
      }
    });
    if (updatedCount > 0) {
      setEvalData(next);
      setHasUnsavedChanges(true);
      toast.success(`Se calculó la calificación de ${updatedCount} alumnos a partir de sus actividades.`);
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

    // % de Aprobación sobre los alumnos evaluados (o existencia activa si todos están evaluados)
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
      totalEvaluados
    };
  }, [alumnosGrupo, evalData]);

  // Guardar calificaciones y detalles en Firestore
  const handleSaveGrades = async (silent = false) => {
    if (alumnosGrupo.length === 0) return false;
    setIsSaving(true);
    try {
      const promises = alumnosGrupo.map(al => {
        const isBaja = (al.status || '').toLowerCase() === 'baja';
        if (isBaja) return Promise.resolve();

        const row = evalData[al.id] || {};
        const docRef = doc(db, 'students', al.id);
        return updateDoc(docRef, {
          [`calificaciones.${trimestre}.${materiaId}`]: row.calificacion ?? '',
          [`evaluacionDetalle.${trimestre}.${materiaId}`]: {
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
            calificacion: row.calificacion ?? '',
            observaciones: row.observaciones ?? '',
            docente: docenteNombre.trim(),
            updatedAt: new Date().toISOString()
          }
        });
      });

      // Guardar metadatos de entrega para el Semáforo de Secretarios y Coordinación
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
      setHasUnsavedChanges(false);
      if (!silent) {
        toast.success('¡Calificaciones y estadística guardadas en el sistema!');
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
    if (hasUnsavedChanges) {
      await handleSaveGrades(true);
      toast.success('Calificaciones guardadas automáticamente antes de imprimir.');
    }
    setPrintOption(option);
    setTimeout(() => {
      window.print();
    }, 350);
  };

  const turnoActual = ['G', 'H', 'I', 'J', 'K', 'L'].includes(grupo) ? 'Vespertino' : 'Matutino';

  return (
    <div className="space-y-6">
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
              <option value="t1">Trimestre I (1°)</option>
              <option value="t2">Trimestre II (2°)</option>
              <option value="t3">Trimestre III (3°)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-slate-100 items-end">
          <div className="md:col-span-5">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Nombre del Docente (Aparecerá en el encabezado y firma)
            </label>
            <input
              type="text"
              value={docenteNombre}
              onChange={e => {
                setDocenteNombre(autoAcentuar(e.target.value));
                setHasUnsavedChanges(true);
              }}
              placeholder="Ej. Profr. Roberto Hernández Gómez"
              className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Modalidad de Captura</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setModoCaptura('rapido')}
                className={`py-1.5 px-2 rounded-md text-xs font-bold transition ${
                  modoCaptura === 'rapido' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Rápida (Calif. y Faltas)
              </button>
              <button
                type="button"
                onClick={() => setModoCaptura('detallado')}
                className={`py-1.5 px-2 rounded-md text-xs font-bold transition ${
                  modoCaptura === 'detallado' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Completa (+Tareas/Exam)
              </button>
            </div>
          </div>

          <div className="md:col-span-3">
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

      {/* Tarjeta de Estadística Automática en Vivo (Requisitos de Coordinación) */}
      <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-sm overflow-hidden no-print">
        <div className="bg-indigo-900 text-white px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-300" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider">
              Requisitos Estadísticos para Coordinación (Calculados en Automático)
            </h3>
          </div>
          <span className="text-xs font-semibold text-indigo-200">
            Alumnos Evaluados: <strong className="text-white">{stats.totalEvaluados}</strong> de <strong className="text-white">{stats.existenciaT}</strong> activos
          </span>
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
            disabled={isSaving}
            className="flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Calificaciones en Sistema'}
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
          {modoCaptura === 'detallado' && (
            <button
              type="button"
              onClick={autocalcularTodos}
              className="flex items-center px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-semibold text-xs transition"
            >
              <Calculator className="w-4 h-4 mr-1.5" /> Promediar Tareas/Examen
            </button>
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
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase w-10">N°</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Nombre del Alumno(a)</th>
                <th className="px-2 py-3 text-center text-xs font-bold uppercase w-12">Sexo</th>
                <th className="px-2 py-3 text-center text-xs font-bold uppercase w-20 bg-slate-700" title="Total de Faltas en el Trimestre">
                  Faltas (T.F.)
                </th>
                {modoCaptura === 'detallado' && (
                  <>
                    {[1, 2, 3, 4, 5, 6].map(t => (
                      <th key={`th-t-${t}`} className="px-1.5 py-3 text-center text-[11px] font-bold uppercase w-14 text-slate-300">
                        T{t}
                      </th>
                    ))}
                    <th className="px-1.5 py-3 text-center text-[11px] font-bold uppercase w-16 text-amber-200">Exam.</th>
                    <th className="px-1.5 py-3 text-center text-[11px] font-bold uppercase w-16 text-amber-200">Partic.</th>
                    <th className="px-1.5 py-3 text-center text-[11px] font-bold uppercase w-16 text-amber-200" title="Columna adicional de evaluación">Otro</th>
                  </>
                )}
                <th className="px-3 py-3 text-center text-xs font-black uppercase w-28 bg-indigo-950 text-indigo-200">
                  Calif. Trim.
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase w-24">Situación</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase w-44">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {alumnosGrupo.map((al, idx) => {
                const isBaja = (al.status || '').toLowerCase() === 'baja';
                const isAlta = !isBaja && al.tipoIngreso === 'Alta';
                const gen = getStudentGender(al);
                const row = evalData[al.id] || {};
                const califNum = parseFloat(row.calificacion);
                const isReprobado = !isNaN(califNum) && califNum < 6;
                const isAprobado = !isNaN(califNum) && califNum >= 6;

                return (
                  <tr
                    key={al.id}
                    className={
                      isBaja
                        ? 'bg-slate-100 text-slate-400'
                        : isReprobado
                          ? 'bg-red-50/40 hover:bg-red-50/70'
                          : 'hover:bg-slate-50'
                    }
                  >
                    <td className="px-3 py-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-bold uppercase text-slate-800">
                      <div className="flex items-center gap-2">
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
                    <td className="px-2 py-2.5 text-center font-bold text-xs text-slate-500">{gen}</td>

                    {isBaja ? (
                      <td
                        colSpan={modoCaptura === 'detallado' ? 13 : 4}
                        className="px-4 py-2.5 text-center font-bold text-xs tracking-widest text-slate-400 uppercase bg-slate-100"
                      >
                        — B A J A &nbsp; O F I C I A L — (No se evalúa ni cuenta en existencia activa)
                      </td>
                    ) : (
                      <>
                        {/* Faltas T.F. */}
                        <td className="px-2 py-2 text-center bg-slate-50">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={row.faltas ?? ''}
                            onChange={e => handleFieldChange(al.id, 'faltas', e.target.value)}
                            placeholder="0"
                            className="w-16 p-1.5 text-center border border-slate-300 rounded-md font-semibold text-slate-700 focus:ring-2 focus:ring-primary-500"
                          />
                        </td>

                        {/* Sub-columnas de Tareas, Examen, Participación y Columna Extra en Modo Detallado */}
                        {modoCaptura === 'detallado' && (
                          <>
                            {[1, 2, 3, 4, 5, 6].map(t => (
                              <td key={`td-t-${al.id}-${t}`} className="px-1 py-2 text-center">
                                <input
                                  type="text"
                                  value={row[`t${t}`] ?? ''}
                                  onChange={e => handleFieldChange(al.id, `t${t}`, e.target.value)}
                                  className="w-12 p-1 text-center border border-slate-200 rounded text-xs font-medium"
                                />
                              </td>
                            ))}
                            <td className="px-1 py-2 text-center bg-amber-50/30">
                              <input
                                type="text"
                                value={row.examen ?? ''}
                                onChange={e => handleFieldChange(al.id, 'examen', e.target.value)}
                                className="w-14 p-1 text-center border border-amber-300 rounded text-xs font-semibold"
                              />
                            </td>
                            <td className="px-1 py-2 text-center bg-amber-50/30">
                              <input
                                type="text"
                                value={row.participacion ?? ''}
                                onChange={e => handleFieldChange(al.id, 'participacion', e.target.value)}
                                className="w-14 p-1 text-center border border-amber-300 rounded text-xs font-semibold"
                              />
                            </td>
                            <td className="px-1 py-2 text-center bg-amber-50/30">
                              <input
                                type="text"
                                value={row.extraEval ?? ''}
                                onChange={e => handleFieldChange(al.id, 'extraEval', e.target.value)}
                                onBlur={() => {
                                  if (!row.calificacion) autocalcularFila(al.id);
                                }}
                                className="w-14 p-1 text-center border border-amber-300 rounded text-xs font-semibold"
                              />
                            </td>
                          </>
                        )}

                        {/* Calificación del Trimestre */}
                        <td className="px-2 py-2 text-center bg-indigo-50/40">
                          <input
                            type="number"
                            step="0.1"
                            min="5"
                            max="10"
                            value={row.calificacion ?? ''}
                            onChange={e => handleFieldChange(al.id, 'calificacion', e.target.value)}
                            placeholder="-"
                            className={`w-20 p-1.5 text-center border-2 rounded-lg font-black text-base focus:outline-none focus:ring-2 ${
                              isReprobado
                                ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-500'
                                : isAprobado
                                  ? 'border-indigo-300 bg-white text-slate-900 focus:ring-indigo-500'
                                  : 'border-slate-300 bg-white text-slate-700 focus:ring-primary-500'
                            }`}
                          />
                        </td>

                        {/* Situación en la Materia */}
                        <td className="px-2 py-2 text-center">
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
                            <span className="text-xs text-slate-400">Sin capturar</span>
                          )}
                        </td>

                        {/* Observaciones */}
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={row.observaciones ?? ''}
                            onChange={e => handleFieldChange(al.id, 'observaciones', autoAcentuar(e.target.value))}
                            placeholder={isAlta ? `ALTA ${al.fechaAlta || ''}` : 'Opcional...'}
                            className="w-full p-1.5 border border-slate-200 rounded-md text-xs text-slate-700"
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
