import React, { useState, useMemo, useEffect } from 'react';
import { Download, Upload, Save, CheckCircle, AlertTriangle, Grid, GraduationCap, Lock, Unlock, Eye, EyeOff, Filter, Sparkles } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { truncateTo1Dec, getCalificacionFinal, autoAcentuar } from '../utils/format';
import { downloadExcelFriendlyCsv } from '../utils/exportCsv';
import { registrarMovimiento } from '../utils/bitacora';
import { useAuth } from '../context/AuthContext';
import { useGlobalConfig } from '../hooks/useGlobalConfig';
import EvaluacionDocenteWidget from './EvaluacionDocenteWidget';
import { sortAttendanceListStudents } from './ListaAsistenciaPrint';

const TRIMESTRE_NAMES = {
  t1: 'Trimestre 1',
  t2: 'Trimestre 2',
  t3: 'Trimestre 3'
};

export default function Calificaciones({ activos, materiasPorGrado, onPrintBoleta, onPrintConcentradoFinal, onPrintConcentradoParcial }) {
  const { currentUser } = useAuth();
  const { config, updateConfig } = useGlobalConfig();
  const [subMode, setSubMode] = useState('sabana'); // 'sabana' | 'asignatura'
  const [grado, setGrado] = useState('1er Grado');
  const [grupo, setGrupo] = useState('A');
  const [trimestre, setTrimestre] = useState('t1');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showConcentradoMenu, setShowConcentradoMenu] = useState(false);
  const [highlightEmptyCells, setHighlightEmptyCells] = useState(false);
  const [filterOnlyIncomplete, setFilterOnlyIncomplete] = useState(false);

  // Filtrar alumnos activos por grado y grupo usando el mismo orden oficial de Lista de Asistencia (Altas al final)
  const alumnos = useMemo(() => {
    const filtrados = activos.filter(a => a.grado === grado && a.grupo === grupo && (a.status || 'Activo') === 'Activo');
    return sortAttendanceListStudents(filtrados);
  }, [activos, grado, grupo]);

  const materias = materiasPorGrado[grado] || [];

  // Estado local para editar calificaciones antes de guardar
  const [localGrades, setLocalGrades] = useState({});

  useEffect(() => {
    const grades = {};
    alumnos.forEach(al => {
      grades[al.id] = {};
      materias.forEach(mat => {
        const calif = al.calificaciones?.[trimestre]?.[mat.id] ?? '';
        grades[al.id][mat.id] = calif;
      });
    });
    setLocalGrades(grades);
  }, [alumnos, materias, trimestre]);

  const handleGradeChange = (studentId, materiaId, value) => {
    setLocalGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [materiaId]: value
      }
    }));
  };

  // Navegación rápida tipo Excel con Enter y Flechas en la Sábana General de Secretarios
  const handleCellKeyDown = (e, rowIdx, colIdx) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.querySelector(`input[data-sabana-cell="${rowIdx + 1}-${colIdx}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.querySelector(`input[data-sabana-cell="${rowIdx - 1}-${colIdx}"]`);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  // Promedio del trimestre seleccionado (Método PASEG: truncado a 1 decimal sin redondeo)
  const calcularPromedioTrimestre = (studentId) => {
    const grades = localGrades[studentId];
    if (!grades) return '-';
    let sum = 0;
    let count = 0;
    materias.forEach(mat => {
      const val = parseFloat(grades[mat.id]);
      if (!isNaN(val)) {
        sum += val;
        count++;
      }
    });
    return count === 0 ? '-' : truncateTo1Dec(sum / count);
  };

  // Promedio General Acumulado PASEG (T1, T2, T3 en tiempo real combinando la edición actual)
  const calcularPromedioGeneralPASEGEnVivo = (al) => {
    let sum = 0;
    let count = 0;
    materias.forEach(mat => {
      if (al.regularizacion && al.regularizacion[mat.id]) {
        const regVal = parseFloat(al.regularizacion[mat.id].calificacion);
        if (!isNaN(regVal)) {
          sum += Math.floor((regVal + 0.00001) * 10) / 10;
          count++;
          return;
        }
      }
      const t1 = parseFloat(trimestre === 't1' ? localGrades[al.id]?.[mat.id] : al.calificaciones?.['t1']?.[mat.id]);
      const t2 = parseFloat(trimestre === 't2' ? localGrades[al.id]?.[mat.id] : al.calificaciones?.['t2']?.[mat.id]);
      const t3 = parseFloat(trimestre === 't3' ? localGrades[al.id]?.[mat.id] : al.calificaciones?.['t3']?.[mat.id]);
      let sMat = 0, cMat = 0;
      if (!isNaN(t1)) { sMat += t1; cMat++; }
      if (!isNaN(t2)) { sMat += t2; cMat++; }
      if (!isNaN(t3)) { sMat += t3; cMat++; }
      if (cMat > 0) {
        const finalMatTrunc = Math.floor((sMat / cMat + 0.00001) * 10) / 10;
        sum += finalMatTrunc;
        count++;
      }
    });
    return count === 0 ? '-' : truncateTo1Dec(sum / count);
  };

  // Auditoría de Celdas Vacías y Alumnos Incompletos en el Grupo Actual
  const auditoriaGrupo = useMemo(() => {
    let alumnosIncompletos = 0;
    let celdasVacias = 0;
    const incompletosMap = {};

    alumnos.forEach(al => {
      let faltanAlumno = 0;
      materias.forEach(mat => {
        const val = (localGrades[al.id]?.[mat.id] ?? '').toString().trim();
        if (val === '') {
          faltanAlumno++;
          celdasVacias++;
        }
      });
      if (faltanAlumno > 0) {
        alumnosIncompletos++;
        incompletosMap[al.id] = faltanAlumno;
      }
    });

    return {
      alumnosIncompletos,
      celdasVacias,
      incompletosMap,
      grupoCompleto: alumnos.length > 0 && celdasVacias === 0
    };
  }, [alumnos, materias, localGrades]);

  // Lista mostrada en la tabla (con su número de lista original intacto)
  const alumnosMostrados = useMemo(() => {
    const conNumero = alumnos.map((al, idx) => ({ ...al, numeroListaOficial: idx + 1 }));
    if (!filterOnlyIncomplete) return conNumero;
    return conNumero.filter(al => auditoriaGrupo.incompletosMap[al.id] > 0);
  }, [alumnos, filterOnlyIncomplete, auditoriaGrupo]);

  // Semáforo de avance de captura por asignatura en el grupo actual
  const semaforoMaterias = useMemo(() => {
    return materias.map(mat => {
      let capturados = 0;
      let docente = '';
      alumnos.forEach(al => {
        const val = localGrades[al.id]?.[mat.id];
        if (val !== undefined && val !== '') {
          capturados++;
        }
        const detDoc = al.evaluacionDetalle?.[trimestre]?.[mat.id]?.docente;
        if (detDoc && !docente) docente = detDoc;
      });
      const completo = alumnos.length > 0 && capturados === alumnos.length;
      const parcial = capturados > 0 && capturados < alumnos.length;
      return {
        ...mat,
        capturados,
        total: alumnos.length,
        completo,
        parcial,
        docente
      };
    });
  }, [materias, alumnos, localGrades, trimestre]);

  // Controles de Candado Docente y Visibilidad a Padres
  const isDocenteLocked = Boolean(config?.trimestresBloqueadosDocentes?.[trimestre]);
  const isPublishedToParents = config?.trimestresPublicadosPadres?.[trimestre] !== false;

  const handleToggleDocenteLock = async () => {
    const nextMap = {
      ...(config?.trimestresBloqueadosDocentes || { t1: false, t2: false, t3: false }),
      [trimestre]: !isDocenteLocked
    };
    const ok = await updateConfig({ trimestresBloqueadosDocentes: nextMap });
    if (ok) {
      await registrarMovimiento(
        currentUser?.email,
        'Control Escolar (Calificaciones)',
        nextMap[trimestre] ? 'Cierre de Trimestre Docente' : 'Apertura de Trimestre Docente',
        `${nextMap[trimestre] ? 'Bloqueó' : 'Abrió'} la captura docente para ${TRIMESTRE_NAMES[trimestre]}`
      );
      toast.success(
        nextMap[trimestre]
          ? `🔒 ${TRIMESTRE_NAMES[trimestre]} cerrado para Docentes. (Ustedes en Control Escolar siguen pudiendo capturar libremente).`
          : `🔓 ${TRIMESTRE_NAMES[trimestre]} abierto nuevamente para captura de Docentes.`
      );
    }
  };

  const handleToggleParentVisibility = async () => {
    const nextMap = {
      ...(config?.trimestresPublicadosPadres || { t1: true, t2: true, t3: true }),
      [trimestre]: !isPublishedToParents
    };
    const ok = await updateConfig({ trimestresPublicadosPadres: nextMap });
    if (ok) {
      await registrarMovimiento(
        currentUser?.email,
        'Control Escolar (Calificaciones)',
        nextMap[trimestre] ? 'Publicar Boleta a Padres' : 'Ocultar Trimestre a Padres',
        `${nextMap[trimestre] ? 'Publicó' : 'Puso en modo captura (oculto)'} las calificaciones de ${TRIMESTRE_NAMES[trimestre]} en el Portal Familiar`
      );
      toast.success(
        nextMap[trimestre]
          ? `👁️ Calificaciones del ${TRIMESTRE_NAMES[trimestre]} ahora visibles para los Padres en el Portal Familiar.`
          : `🙈 ${TRIMESTRE_NAMES[trimestre]} oculto temporalmente a los Padres (aparecerá "En captura").`
      );
    }
  };

  const handleSaveAll = async () => {
    // Validar que todas las calificaciones capturadas estén en escala oficial PASEG (5 a 10)
    for (const al of alumnos) {
      const grades = localGrades[al.id] || {};
      for (const mat of materias) {
        const raw = (grades[mat.id] ?? '').toString().trim();
        if (raw !== '') {
          const num = parseFloat(raw);
          if (isNaN(num) || num < 5 || num > 10) {
            alert(`Atención: La calificación "${raw}" en ${mat.name} para ${al.apellidoPaterno} ${al.nombres} no es válida.\n\nEn PASEG la escala oficial es de 5 a 10.`);
            return;
          }
        }
      }
    }

    setIsSaving(true);
    try {
      const promises = alumnos.map(al => {
        const docRef = doc(db, 'students', al.id);
        const gradesToSave = localGrades[al.id];
        const currentCalif = al.calificaciones || {};
        const newTrimestreData = { ...currentCalif[trimestre], ...gradesToSave };
        
        return updateDoc(docRef, {
          [`calificaciones.${trimestre}`]: newTrimestreData
        });
      });
      await Promise.all(promises);
      await registrarMovimiento(
        currentUser?.email,
        'Control Escolar (Calificaciones)',
        'Captura Sábana General',
        `Guardó la sábana general de calificaciones de ${grado} "${grupo}" (${trimestre.toUpperCase()}) para ${alumnos.length} alumnos.`
      );
      setSuccessMsg('Calificaciones guardadas exitosamente.');
      toast.success('Sábana general guardada correctamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error(error);
      alert('Error al guardar calificaciones.');
    }
    setIsSaving(false);
  };

  const handleDownloadTemplate = () => {
    if (alumnos.length === 0) {
      alert("No hay alumnos en este grupo para generar plantilla.");
      return;
    }
    const headers = ['No_Lista', 'Matricula', 'Nombre Completo', ...materias.map(m => m.name)];
    const data = alumnos.map((al, idx) => {
      const row = [
        idx + 1,
        al.matricula,
        `${al.apellidoPaterno} ${al.apellidoMaterno} ${al.nombres}`
      ];
      materias.forEach(mat => {
        row.push(localGrades[al.id]?.[mat.id] || '');
      });
      return row;
    });

    const csvContent = Papa.unparse({ fields: headers, data }, { delimiter: "\t" }).toUpperCase();
    downloadExcelFriendlyCsv(`Plantilla_Calificaciones_${grado}_${grupo}_${trimestre}.csv`, csvContent);
  };

  const getPromedioFinal = (student, materiaId) => {
    const finalObj = getCalificacionFinal(student, materiaId);
    return finalObj ? truncateTo1Dec(finalObj.valor, '') : '';
  };

  const handleExportarExcelFinales = () => {
    if (alumnos.length === 0) return;
    const headers = ['N°', 'Matrícula', 'Nombre del Alumno', ...materias.map(m => m.name), 'Promedio General PASEG', 'Materias Reprobadas'];
    const data = alumnos.map((al, idx) => {
      const row = [idx + 1, al.matricula, `${al.apellidoPaterno} ${al.apellidoMaterno} ${al.nombres}`];
      let sum = 0, count = 0, reprobadas = 0;
      materias.forEach(mat => {
        const pf = getPromedioFinal(al, mat.id);
        row.push(pf);
        if (pf !== '') {
          sum += parseFloat(pf);
          count++;
          if (parseFloat(pf) < 6.0) reprobadas++;
        }
      });
      row.push(count > 0 ? truncateTo1Dec(sum / count, '') : '');
      row.push(reprobadas);
      return row;
    });
    const csvContent = Papa.unparse({ fields: headers, data }, { delimiter: "\t" }).toUpperCase();
    downloadExcelFriendlyCsv(`Concentrado_Finales_${grado}_${grupo}.csv`, csvContent);
  };

  const handleExportarExcelParciales = () => {
    if (alumnos.length === 0) return;
    const headers = ['N°', 'Matrícula', 'Nombre del Alumno'];
    materias.forEach(mat => {
      headers.push(`${mat.name} T1`, `${mat.name} T2`, `${mat.name} T3`, `${mat.name} Final`);
    });
    headers.push('Promedio General PASEG');

    const data = alumnos.map((al, idx) => {
      const row = [idx + 1, al.matricula, `${al.apellidoPaterno} ${al.apellidoMaterno} ${al.nombres}`];
      let sum = 0, count = 0;
      materias.forEach(mat => {
        const t1 = al.calificaciones?.['t1']?.[mat.id] || '';
        const t2 = al.calificaciones?.['t2']?.[mat.id] || '';
        const t3 = al.calificaciones?.['t3']?.[mat.id] || '';
        const pf = getPromedioFinal(al, mat.id);
        row.push(t1, t2, t3, pf);
        if (pf !== '') {
          sum += parseFloat(pf);
          count++;
        }
      });
      row.push(count > 0 ? truncateTo1Dec(sum / count, '') : '');
      return row;
    });
    const csvContent = Papa.unparse({ fields: headers, data }, { delimiter: "\t" }).toUpperCase();
    downloadExcelFriendlyCsv(`Concentrado_Parciales_${grado}_${grupo}.csv`, csvContent);
  };

  const handleUploadCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      let content = event.target.result;
      if (content.startsWith("sep=,\n") || content.startsWith("sep=,\r\n")) {
         content = content.substring(content.indexOf('\n') + 1);
      } else if (content.startsWith("\uFEFFsep=,\n") || content.startsWith("\uFEFFsep=,\r\n")) {
         content = "\uFEFF" + content.substring(content.indexOf('\n') + 1);
      }

      Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toUpperCase(),
      complete: (results) => {
        const newLocalGrades = { ...localGrades };
        let matchCount = 0;

        results.data.forEach(row => {
          const matricula = row['MATRICULA'] || row['MATRÍCULA'];
          const student = alumnos.find(a => (a.matricula || '').toUpperCase() === (matricula || '').toUpperCase());
          if (student) {
            matchCount++;
            materias.forEach(mat => {
              const subjectKey = mat.name.toUpperCase();
              if (row[subjectKey] !== undefined) {
                newLocalGrades[student.id][mat.id] = row[subjectKey];
              }
            });
          }
        });

        if (matchCount > 0) {
          setLocalGrades(newLocalGrades);
          alert(`Se cargaron calificaciones para ${matchCount} alumnos. ¡No olvides darle al botón Guardar!`);
        } else {
          alert("No se encontraron coincidencias de matrícula en este grupo.");
        }
      },
      error: (err) => {
        alert("Error al leer el archivo CSV.");
        console.error(err);
      }
    });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Selector de Vista: Sábana General (Secretarios) vs Por Asignatura (Docentes / Cuadros Coordinación) */}
      <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 inline-flex flex-wrap gap-1.5 no-print">
        <button
          type="button"
          onClick={() => setSubMode('sabana')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition ${
            subMode === 'sabana'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Grid className="w-4 h-4 mr-2 text-primary-600" />
          Sábana General del Grupo (Secretarios - Todas las Materias)
        </button>
        <button
          type="button"
          onClick={() => setSubMode('asignatura')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition ${
            subMode === 'asignatura'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          Captura y Cuadros por Asignatura (Docentes / Coordinación)
        </button>
      </div>

      {/* Barra de Blindaje y Control del Trimestre (Para Secretarios / Control Escolar) */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
              Panel de Control de Calificaciones — {TRIMESTRE_NAMES[trimestre]}
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Como Secretario(a) siempre puedes capturar aquí. Usa estos interruptores para bloquear a docentes o publicar boletas a los padres:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Candado de Captura Docente */}
          <button
            type="button"
            onClick={handleToggleDocenteLock}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border transition shadow-sm ${
              isDocenteLocked
                ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                : 'bg-slate-800 text-emerald-300 border-emerald-500/40 hover:bg-slate-700'
            }`}
            title="Al cerrar el candado, los docentes ya no pueden modificar este trimestre, pero Control Escolar sí puede seguir editando."
          >
            {isDocenteLocked ? (
              <>
                <Lock className="w-4 h-4" />
                Docentes: Bloqueado ({trimestre.toUpperCase()})
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Docentes: Captura Abierta ({trimestre.toUpperCase()})
              </>
            )}
          </button>

          {/* Visibilidad en Portal de Padres */}
          <button
            type="button"
            onClick={handleToggleParentVisibility}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border transition shadow-sm ${
              isPublishedToParents
                ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                : 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700'
            }`}
            title="Controla si los padres de familia ya pueden ver las calificaciones de este trimestre en su celular."
          >
            {isPublishedToParents ? (
              <>
                <Eye className="w-4 h-4" />
                Portal Padres: Publicado ({trimestre.toUpperCase()})
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Portal Padres: Oculto / En Captura ({trimestre.toUpperCase()})
              </>
            )}
          </button>
        </div>
      </div>

      {subMode === 'asignatura' ? (
        <EvaluacionDocenteWidget students={activos} />
      ) : (
        <>
          {/* Controles de Filtro Sábana General */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Grado</label>
              <select value={grado} onChange={e => setGrado(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 bg-slate-50">
                <option value="1er Grado">1er Grado</option>
                <option value="2do Grado">2do Grado</option>
                <option value="3er Grado">3er Grado</option>
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Grupo</label>
              <select value={grupo} onChange={e => setGrupo(e.target.value)} translate="no" className="notranslate w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 bg-slate-50">
                <optgroup label="Turno Matutino (A - F)">
                  <option value="A">A (Matutino)</option>
                  <option value="B">B (Matutino)</option>
                  <option value="C">C (Matutino)</option>
                  <option value="D">D (Matutino)</option>
                  <option value="E">E (Matutino)</option>
                  <option value="F">F (Matutino)</option>
                </optgroup>
                <optgroup label="Turno Vespertino (G - L)">
                  <option value="G">G (Vespertino)</option>
                  <option value="H">H (Vespertino)</option>
                  <option value="I">I (Vespertino)</option>
                  <option value="J">J (Vespertino)</option>
                  <option value="K">K (Vespertino)</option>
                  <option value="L">L (Vespertino)</option>
                </optgroup>
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Trimestre</label>
              <select value={trimestre} onChange={e => setTrimestre(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-primary-700 bg-primary-50">
                <option value="t1">Trimestre 1 {config?.trimestresBloqueadosDocentes?.t1 ? '🔒' : ''}</option>
                <option value="t2">Trimestre 2 {config?.trimestresBloqueadosDocentes?.t2 ? '🔒' : ''}</option>
                <option value="t3">Trimestre 3 {config?.trimestresBloqueadosDocentes?.t3 ? '🔒' : ''}</option>
              </select>
            </div>
            <div className="flex-1 flex justify-end gap-2">
              <button onClick={handleDownloadTemplate} className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-sm">
                <Download className="w-4 h-4 mr-2 text-slate-500" /> Plantilla
              </button>
              <label className="cursor-pointer flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition font-medium text-sm">
                <Upload className="w-4 h-4 mr-2" /> Subir CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleUploadCSV} />
              </label>
            </div>
          </div>

          {/* Semáforo de Entrega de Maestros y Detector de Celdas Vacías */}
          {alumnos.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Semáforo de Avance y Detector de Celdas Vacías ({grado} "{grupo}" - {trimestre.toUpperCase()})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Tip de captura rápida: presiona <strong>Enter</strong> o <strong>Flecha Abajo</strong> en cualquier casilla para bajar al siguiente alumno.
                  </p>
                </div>

                {/* Botones del Detector de Celdas Vacías */}
                <div className="flex flex-wrap items-center gap-2">
                  {auditoriaGrupo.grupoCompleto ? (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Grupo 100% capturado (0 celdas vacías)
                    </span>
                  ) : (
                    <>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                        ⚠️ {auditoriaGrupo.alumnosIncompletos} alumnos con pendientes ({auditoriaGrupo.celdasVacias} celdas vacías)
                      </span>
                      <button
                        type="button"
                        onClick={() => setHighlightEmptyCells(!highlightEmptyCells)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                          highlightEmptyCells
                            ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {highlightEmptyCells ? 'Quitar resalte amarillo' : 'Resaltar celdas vacías'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterOnlyIncomplete(!filterOnlyIncomplete)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                          filterOnlyIncomplete
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Filter className="w-3.5 h-3.5" />
                        {filterOnlyIncomplete ? 'Ver todos los alumnos' : 'Ver solo incompletos'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {semaforoMaterias.map(sm => (
                  <div
                    key={sm.id}
                    className={`p-2 rounded-lg border text-xs flex flex-col justify-between ${
                      sm.completo
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : sm.parcial
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="font-bold truncate" title={sm.name}>{sm.name}</div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="font-extrabold">
                        {sm.capturados}/{sm.total} {sm.completo ? '✅' : sm.parcial ? '⏳' : ''}
                      </span>
                      {sm.docente && (
                        <span className="truncate max-w-[110px] text-[10px] opacity-80" title={sm.docente}>
                          {sm.docente}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-200 flex items-center font-medium">
              <CheckCircle className="w-5 h-5 mr-2" /> {successMsg}
            </div>
          )}

          {alumnos.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 flex flex-col items-center">
              <AlertTriangle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-lg font-medium">No hay alumnos registrados en este grado y grupo.</p>
              <p className="text-sm mt-1">Intenta seleccionar otro filtro o inscribe alumnos primero.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-2 py-3 text-center text-xs font-bold text-slate-300 uppercase w-10 sticky left-0 z-10 bg-slate-900 border-r border-slate-700">N°</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-200 uppercase tracking-wider sticky left-10 z-10 bg-slate-900 border-r border-slate-700">Alumno (Orden de Lista)</th>
                      {materias.map(mat => (
                        <th key={mat.id} className="px-2 py-3 text-center text-[10px] font-bold text-slate-300 uppercase w-16 whitespace-normal leading-tight" title={mat.name}>
                          {mat.name.replace('Formación Cívica y Ética', 'F.C.E.').replace('Ciencias', 'Cien.')}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-[10px] font-black text-sky-300 uppercase tracking-wider bg-slate-900 border-l border-slate-700 leading-tight" title="Promedio del trimestre seleccionado (truncado a 1 décima PASEG)">
                        PROM.<br/>{trimestre.toUpperCase()}
                      </th>
                      <th className="px-3 py-3 text-center text-[10px] font-black text-amber-300 uppercase tracking-wider bg-slate-900 border-l border-slate-700 leading-tight" title="Promedio General Acumulado PASEG (T1-T3)">
                        PROM.<br/>GRAL
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider bg-slate-900 border-l border-slate-700 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {alumnosMostrados.map((al, rowIdx) => {
                      const promTrimStr = calcularPromedioTrimestre(al.id);
                      const promTrim = parseFloat(promTrimStr);
                      const isReprobadoTrim = !isNaN(promTrim) && promTrim < 6.0;

                      const promGralStr = calcularPromedioGeneralPASEGEnVivo(al);
                      const promGral = parseFloat(promGralStr);
                      const isReprobadoGral = !isNaN(promGral) && promGral < 6.0;
                      const faltantesAlumno = auditoriaGrupo.incompletosMap[al.id] || 0;

                      return (
                        <tr key={al.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-2 py-3 text-center text-xs font-bold text-slate-500 sticky left-0 z-10 bg-inherit border-r border-slate-200">
                            {al.numeroListaOficial}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-800 sticky left-10 z-10 bg-inherit border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            {autoAcentuar(`${al.apellidoPaterno || ''} ${al.apellidoMaterno || ''}`.trim())} <span className="font-medium">{autoAcentuar(al.nombres || '')}</span>
                            {al.tipoIngreso === 'Alta' && (
                              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black bg-emerald-100 text-emerald-800 rounded border border-emerald-300">ALTA</span>
                            )}
                            {highlightEmptyCells && faltantesAlumno > 0 && (
                              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black bg-amber-200 text-amber-950 rounded border border-amber-400">
                                Faltan {faltantesAlumno}
                              </span>
                            )}
                          </td>
                          {materias.map((mat, colIdx) => {
                            const val = localGrades[al.id]?.[mat.id] ?? '';
                            const isEmpty = val.toString().trim() === '';
                            const numVal = parseFloat(val);
                            const isOutOfRange = !isEmpty && (isNaN(numVal) || numVal < 5 || numVal > 10);
                            const isFailing = !isEmpty && !isOutOfRange && numVal < 6.0;
                            return (
                              <td key={mat.id} className="px-1 py-2 text-center">
                                <input 
                                  type="number" 
                                  min="5" max="10" step="0.1"
                                  data-sabana-cell={`${rowIdx}-${colIdx}`}
                                  value={val}
                                  onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                                  onChange={(e) => handleGradeChange(al.id, mat.id, e.target.value)}
                                  placeholder={highlightEmptyCells && isEmpty ? '!' : ''}
                                  className={`w-14 text-center p-1.5 border rounded font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-colors
                                    ${isOutOfRange
                                      ? 'bg-red-100 border-red-500 text-red-900 ring-2 ring-red-400'
                                      : highlightEmptyCells && isEmpty
                                        ? 'bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-300'
                                        : isFailing
                                          ? 'bg-red-50 border-red-300 text-red-700'
                                          : 'bg-white border-slate-300 text-slate-700'}
                                  `}
                                />
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center bg-inherit border-l border-slate-200">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-black ${promTrimStr === '-' ? 'text-slate-400' : isReprobadoTrim ? 'bg-red-100 text-red-700' : 'bg-sky-50 text-sky-800 border border-sky-200'}`}>
                              {promTrimStr}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center bg-inherit border-l border-slate-200">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-sm font-black ${promGralStr === '-' ? 'text-slate-400' : isReprobadoGral ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                              {promGralStr}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center bg-inherit border-l border-slate-200">
                            <button onClick={() => onPrintBoleta && onPrintBoleta(al)} className="text-slate-500 hover:text-slate-800 transition" title="Imprimir Boleta Individual">
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Action Bar */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 relative">
                  <span className="text-sm font-medium text-slate-500">{alumnos.length} alumnos activos listados (Método PASEG: truncado a 1 décima)</span>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowConcentradoMenu(!showConcentradoMenu)}
                      className="flex items-center px-4 py-2 border-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-bold transition text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      Generar Cuadro de Concentración General
                    </button>
                    
                    {showConcentradoMenu && (
                      <div className="absolute bottom-full mb-2 left-0 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 overflow-hidden">
                        <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">Tipo de Cuadro General</div>
                        
                        <div className="mb-2">
                          <div className="px-3 py-1 text-xs font-bold text-indigo-600">Con Promedios Finales</div>
                          <button onClick={() => { onPrintConcentradoFinal && onPrintConcentradoFinal(alumnos, grado, grupo); setShowConcentradoMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center">
                            <svg className="w-4 h-4 mr-2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Imprimir PDF
                          </button>
                          <button onClick={() => { handleExportarExcelFinales(); setShowConcentradoMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center">
                            <svg className="w-4 h-4 mr-2 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg> Exportar Excel
                          </button>
                        </div>

                        <div>
                          <div className="px-3 py-1 text-xs font-bold text-indigo-600">Con Calificaciones Parciales</div>
                          <button onClick={() => { onPrintConcentradoParcial && onPrintConcentradoParcial(alumnos, grado, grupo); setShowConcentradoMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center">
                            <svg className="w-4 h-4 mr-2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Imprimir PDF
                          </button>
                          <button onClick={() => { handleExportarExcelParciales(); setShowConcentradoMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center">
                            <svg className="w-4 h-4 mr-2 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg> Exportar Excel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onPrintBoleta && onPrintBoleta(alumnos)}
                    className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition shadow-sm text-sm"
                  >
                     Imprimir Grupo (Boletas)
                  </button>
                  <button 
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="flex items-center px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
                  >
                    <Save className="w-5 h-5 mr-2" /> {isSaving ? 'Guardando...' : 'Guardar Calificaciones'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
