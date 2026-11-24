import {
  truncateNumberTo1Dec,
  getCalificacionTrimestreEfectiva,
  getCalificacionFinal
} from './format.js';
import {
  parseFechaFlexible,
  esBajaOficial,
  obtenerFechaBajaDate,
  fechaRegistroDeAlumno
} from './dateRules.js';

export const GRADOS_SEG = ['1er Grado', '2do Grado', '3er Grado'];
export const TURNOS_SEG = ['Matutino', 'Vespertino'];
export const GRADO_LABELS = {
  '1er Grado': 'PRIMERO',
  '2do Grado': 'SEGUNDO',
  '3er Grado': 'TERCERO'
};

export const MOMENTOS_SEG = {
  1: {
    id: 1,
    key: 'm1',
    titulo: 'PRIMER MOMENTO DE VALORACIÓN',
    corto: '1er Momento',
    trimestres: ['t1'],
    notaAprovechamiento:
      'NOTA: Se considerarán las evaluaciones hasta el 1er. Periodo, los promedios se expresarán en número entero y decimal.',
    getDefaultFechas: (cicloEscolar = '2026-2027') => {
      const m = /(\d{4})\D+(\d{4})/.exec(String(cicloEscolar || ''));
      const y1 = m ? Number(m[1]) : new Date().getFullYear();
      return {
        fechaInicio: `${y1}-09-01`,
        fechaCorte: `${y1}-11-30`
      };
    }
  },
  2: {
    id: 2,
    key: 'm2',
    titulo: 'SEGUNDO MOMENTO DE VALORACIÓN',
    corto: '2do Momento',
    trimestres: ['t1', 't2'],
    notaAprovechamiento:
      'NOTA: Se considerarán las evaluaciones hasta el 2do. Periodo, los promedios se expresarán en número entero y decimal.',
    getDefaultFechas: (cicloEscolar = '2026-2027') => {
      const m = /(\d{4})\D+(\d{4})/.exec(String(cicloEscolar || ''));
      const y1 = m ? Number(m[1]) : new Date().getFullYear();
      const y2 = m ? Number(m[2]) : y1 + 1;
      return {
        fechaInicio: `${y1}-09-01`,
        fechaCorte: `${y2}-03-31`
      };
    }
  },
  3: {
    id: 3,
    key: 'm3',
    titulo: 'TERCER MOMENTO DE VALORACIÓN',
    corto: '3er Momento',
    trimestres: ['t1', 't2', 't3'],
    notaAprovechamiento:
      'NOTA: Se considerarán las evaluaciones hasta el 3er. Periodo, los promedios se expresarán en número entero y decimal.',
    getDefaultFechas: (cicloEscolar = '2026-2027') => {
      const m = /(\d{4})\D+(\d{4})/.exec(String(cicloEscolar || ''));
      const y1 = m ? Number(m[1]) : new Date().getFullYear();
      const y2 = m ? Number(m[2]) : y1 + 1;
      return {
        fechaInicio: `${y1}-09-01`,
        fechaCorte: `${y2}-07-15`
      };
    }
  }
};

export const CAMPOS_FORMATIVOS_SEG = {
  '1er Grado': [
    {
      campo: 'LENGUAJES',
      materias: [
        { id: 'espanol1', label: 'ESPAÑOL' },
        { id: 'ingles1', label: 'INGLÉS' },
        { id: 'artes1', label: 'ARTES' }
      ]
    },
    {
      campo: 'SABERES Y PENSAMIENTO CIENTÍFICO',
      materias: [
        { id: 'matematicas1', label: 'MATEMÁTICAS' },
        { id: 'biologia', label: 'BIOLOGÍA' }
      ]
    },
    {
      campo: 'ÉTICA NATURALEZA Y SOCIEDAD',
      materias: [
        { id: 'geografia', label: 'GEOGRAFÍA' },
        { id: 'historia1', label: 'HISTORIA' },
        { id: 'fce1', label: 'FORMACIÓN CÍVICA Y ÉTICA' }
      ]
    },
    {
      campo: 'DE LO HUMANO Y LO COMUNITARIO',
      materias: [
        { id: 'tecnologia1', label: 'TECNOLOGÍA' },
        { id: 'educfisica1', label: 'EDUCACIÓN FÍSICA' }
      ]
    }
  ],
  '2do Grado': [
    {
      campo: 'LENGUAJES',
      materias: [
        { id: 'espanol2', label: 'ESPAÑOL' },
        { id: 'ingles2', label: 'INGLÉS' },
        { id: 'artes2', label: 'ARTES' }
      ]
    },
    {
      campo: 'SABERES Y PENSAMIENTO CIENTÍFICO',
      materias: [
        { id: 'matematicas2', label: 'MATEMÁTICAS' },
        { id: 'fisica', label: 'FÍSICA' }
      ]
    },
    {
      campo: 'ÉTICA NATURALEZA Y SOCIEDAD',
      materias: [
        { id: 'historia2', label: 'HISTORIA' },
        { id: 'fce2', label: 'FORMACIÓN CÍVICA Y ÉTICA' }
      ]
    },
    {
      campo: 'DE LO HUMANO Y LO COMUNITARIO',
      materias: [
        { id: 'tecnologia2', label: 'TECNOLOGÍA' },
        { id: 'educfisica2', label: 'EDUCACIÓN FÍSICA' }
      ]
    }
  ],
  '3er Grado': [
    {
      campo: 'LENGUAJES',
      materias: [
        { id: 'espanol3', label: 'ESPAÑOL' },
        { id: 'ingles3', label: 'INGLÉS' },
        { id: 'artes3', label: 'ARTES' }
      ]
    },
    {
      campo: 'SABERES Y PENSAMIENTO CIENTÍFICO',
      materias: [
        { id: 'matematicas3', label: 'MATEMÁTICAS' },
        { id: 'quimica', label: 'QUÍMICA' }
      ]
    },
    {
      campo: 'ÉTICA NATURALEZA Y SOCIEDAD',
      materias: [
        { id: 'historia3', label: 'HISTORIA' },
        { id: 'fce3', label: 'FORMACIÓN CÍVICA Y ÉTICA' }
      ]
    },
    {
      campo: 'DE LO HUMANO Y LO COMUNITARIO',
      materias: [
        { id: 'tecnologia3', label: 'TECNOLOGÍA' },
        { id: 'educfisica3', label: 'EDUCACIÓN FÍSICA' }
      ]
    }
  ]
};

const MATERIAS_IDS_POR_GRADO = Object.fromEntries(
  GRADOS_SEG.map((g) => [g, CAMPOS_FORMATIVOS_SEG[g].flatMap((c) => c.materias)])
);

export const normalizarGradoSEG = (grado) => {
  const g = String(grado || '').toLowerCase();
  if (g.includes('1') || g.includes('primer')) return '1er Grado';
  if (g.includes('2') || g.includes('segund')) return '2do Grado';
  if (g.includes('3') || g.includes('tercer')) return '3er Grado';
  return null;
};

export const normalizarTurnoSEG = (turno) => {
  const t = String(turno || '').toLowerCase();
  return t.includes('vesp') ? 'Vespertino' : 'Matutino';
};

export const normalizarGeneroSEG = (student) => {
  const raw = String(student?.genero || student?.sexo || '').trim().toUpperCase();
  if (raw.startsWith('F') || (raw.startsWith('M') && !raw.startsWith('MASC'))) return 'm';
  if (raw.startsWith('H') || raw.startsWith('MASC')) return 'h';
  const curp = String(student?.curp || '').trim().toUpperCase();
  if (curp.length >= 11) {
    const ch = curp.charAt(10);
    if (ch === 'M') return 'm';
    if (ch === 'H') return 'h';
  }
  return 'h';
};

const toEndOfDay = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return null;
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
};

const toStartOfDay = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return null;
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
};

export const formatearFechaLargaSEG = (fechaStr) => {
  const d = parseFechaFlexible(fechaStr);
  if (!d) return '';
  const dia = d.getDate();
  const mes = d.toLocaleString('es-MX', { month: 'long' });
  const anio = d.getFullYear();
  return `${dia} de ${mes} ${anio}`;
};

/**
 * Obtiene la calificación de una materia hasta el Momento seleccionado (1, 2 o 3),
 * promediando trimestres cursados dentro del momento y redondeando a entero oficial.
 */
export const getCalificacionMateriaHastaMomento = (student, materiaId, momentoId = 1) => {
  if (!student || !materiaId) return null;
  const momentoCfg = MOMENTOS_SEG[momentoId] || MOMENTOS_SEG[1];

  if (Number(momentoId) === 3 && student.regularizacion?.[materiaId]) {
    const finalObj = getCalificacionFinal(student, materiaId);
    if (finalObj?.isRegularizacion && finalObj.valor !== null && !isNaN(finalObj.valor)) {
      return finalObj.valor;
    }
  }

  let sum = 0;
  let count = 0;
  momentoCfg.trimestres.forEach((tKey) => {
    const { efectiva } = getCalificacionTrimestreEfectiva(student, materiaId, tKey);
    if (efectiva !== null && !isNaN(efectiva)) {
      sum += efectiva;
      count++;
    }
  });

  if (count === 0) return null;
  return Math.round(sum / count);
};

const emptyMatRow = () => ({
  grupos: 0,
  inicial: { h: 0, m: 0, t: 0 },
  altas: { h: 0, m: 0, t: 0 },
  bajas: { h: 0, m: 0, t: 0 },
  existencia: { h: 0, m: 0, t: 0 },
  pctBajas: 0
});

const finalizeMatRow = (row, gruposSet) => {
  if (gruposSet) row.grupos = gruposSet.size;
  row.inicial.t = row.inicial.h + row.inicial.m;
  row.altas.t = row.altas.h + row.altas.m;
  row.bajas.t = row.bajas.h + row.bajas.m;
  row.existencia.h = Math.max(0, row.inicial.h + row.altas.h - row.bajas.h);
  row.existencia.m = Math.max(0, row.inicial.m + row.altas.m - row.bajas.m);
  row.existencia.t = row.existencia.h + row.existencia.m;
  const base = row.inicial.t + row.altas.t;
  row.pctBajas = base > 0 ? (row.bajas.t / base) * 100 : 0;
};

/**
 * Hoja 1: MATRÍCULA GENERAL filtrada estrictamente al corte de cada Momento.
 */
export const calcularMatriculaMomento = (alumnos = [], fechaCorteStr = '') => {
  const fechaCorte = toEndOfDay(parseFechaFlexible(fechaCorteStr));
  const filas = {};
  const gruposSets = {};
  const existenciaAlumnos = {};

  GRADOS_SEG.forEach((g) => {
    TURNOS_SEG.forEach((t) => {
      const key = `${g}-${t}`;
      filas[key] = emptyMatRow();
      gruposSets[key] = new Set();
      existenciaAlumnos[key] = [];
    });
  });

  (alumnos || []).forEach((a) => {
    if (!a) return;
    const st = String(a.status || 'Activo').trim().toLowerCase();
    if (st === 'pendiente' || st === 'egresado' || st === 'no inscrito') return;
    if (a.motivoBaja === 'No Inscrito' || a.tipoBaja === 'No Inscrito') return;
    if (st === 'baja' && !esBajaOficial(a)) return;
    if (st !== 'activo' && st !== 'baja') return;

    const grado = normalizarGradoSEG(a.grado);
    if (!grado) return;
    const turno = normalizarTurnoSEG(a.turno);
    const key = `${grado}-${turno}`;
    const gen = normalizarGeneroSEG(a);
    const grupo = String(a.grupo || '').trim().toUpperCase();

    const esAlta = String(a.tipoIngreso || '').trim().toLowerCase() === 'alta';
    if (esAlta) {
      const fAlta = parseFechaFlexible(a.fechaAlta) || fechaRegistroDeAlumno(a);
      if (fechaCorte && fAlta && fAlta > fechaCorte) {
        return; // Alta ocurrida después del corte de este momento
      }
      filas[key].altas[gen]++;
    } else {
      filas[key].inicial[gen]++;
    }

    const fBaja = st === 'baja' ? obtenerFechaBajaDate(a) : null;
    const esBajaEnMomento = st === 'baja' && (!fechaCorte || !fBaja || fBaja <= fechaCorte);

    if (esBajaEnMomento) {
      filas[key].bajas[gen]++;
    } else {
      existenciaAlumnos[key].push(a);
    }

    if (grupo) {
      gruposSets[key].add(grupo);
    }
  });

  GRADOS_SEG.forEach((g) => {
    TURNOS_SEG.forEach((t) => {
      const key = `${g}-${t}`;
      finalizeMatRow(filas[key], gruposSets[key]);
    });
  });

  const totalesGrado = {};
  GRADOS_SEG.forEach((g) => {
    const row = emptyMatRow();
    TURNOS_SEG.forEach((t) => {
      const src = filas[`${g}-${t}`];
      row.grupos += src.grupos;
      row.inicial.h += src.inicial.h;
      row.inicial.m += src.inicial.m;
      row.altas.h += src.altas.h;
      row.altas.m += src.altas.m;
      row.bajas.h += src.bajas.h;
      row.bajas.m += src.bajas.m;
    });
    finalizeMatRow(row);
    totalesGrado[g] = row;
  });

  const totalEscuela = emptyMatRow();
  GRADOS_SEG.forEach((g) => {
    const src = totalesGrado[g];
    totalEscuela.grupos += src.grupos;
    totalEscuela.inicial.h += src.inicial.h;
    totalEscuela.inicial.m += src.inicial.m;
    totalEscuela.altas.h += src.altas.h;
    totalEscuela.altas.m += src.altas.m;
    totalEscuela.bajas.h += src.bajas.h;
    totalEscuela.bajas.m += src.bajas.m;
  });
  finalizeMatRow(totalEscuela);

  return {
    filas,
    totalesGrado,
    totalEscuela,
    existenciaAlumnos
  };
};

const avgNonNull = (arr) => {
  const valid = arr.filter((v) => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((acc, n) => acc + n, 0) / valid.length;
};

/**
 * Hoja 2: APROVECHAMIENTO (PROMEDIOS) con coincidencia exacta contra fórmulas AVERAGE de Excel.
 */
export const calcularAprovechamientoMomento = (existenciaAlumnos = {}, momentoId = 1) => {
  const turnos = {};
  let alumnosSinCalificacion = 0;
  let celdasFaltantes = 0;

  TURNOS_SEG.forEach((turno) => {
    const materias = {};
    const promGrado = {};

    GRADOS_SEG.forEach((grado) => {
      const key = `${grado}-${turno}`;
      const students = existenciaAlumnos[key] || [];
      const matList = MATERIAS_IDS_POR_GRADO[grado] || [];
      const matValsForGrado = [];

      matList.forEach((mat) => {
        let sum = 0;
        let count = 0;
        students.forEach((s) => {
          const val = getCalificacionMateriaHastaMomento(s, mat.id, momentoId);
          if (val !== null) {
            sum += val;
            count++;
          } else {
            celdasFaltantes++;
          }
        });
        const avgMat = count > 0 ? truncateNumberTo1Dec(sum / count) : null;
        materias[mat.id] = avgMat;
        if (avgMat !== null) matValsForGrado.push(avgMat);
      });

      students.forEach((s) => {
        const hasAny = matList.some(
          (mat) => getCalificacionMateriaHastaMomento(s, mat.id, momentoId) !== null
        );
        if (!hasAny) alumnosSinCalificacion++;
      });

      promGrado[grado] = avgNonNull(matValsForGrado);
    });

    const promTurno = avgNonNull(GRADOS_SEG.map((g) => promGrado[g]));
    turnos[turno] = {
      materias,
      promGrado,
      promTurno
    };
  });

  // Fila PROM. GRAL DE ESCUELA = AVERAGE vertical de Matutino y Vespertino por cada columna
  const escuelaMaterias = {};
  GRADOS_SEG.forEach((grado) => {
    (MATERIAS_IDS_POR_GRADO[grado] || []).forEach((mat) => {
      escuelaMaterias[mat.id] = avgNonNull(
        TURNOS_SEG.map((t) => turnos[t].materias[mat.id])
      );
    });
  });

  const escuelaPromGrado = {};
  GRADOS_SEG.forEach((grado) => {
    escuelaPromGrado[grado] = avgNonNull(
      TURNOS_SEG.map((t) => turnos[t].promGrado[grado])
    );
  });

  const escuelaPromGeneral = avgNonNull(
    TURNOS_SEG.map((t) => turnos[t].promTurno)
  );

  return {
    turnos,
    escuela: {
      materias: escuelaMaterias,
      promGrado: escuelaPromGrado,
      promTurno: escuelaPromGeneral
    },
    alumnosSinCalificacion,
    celdasFaltantes
  };
};

const finalizeDesempenoRow = (row) => {
  const m = row.matricula;
  row.comprobacion = row.r5 + row.r6 + row.r7 + row.r8;
  row.pct5 = m > 0 ? (row.r5 / m) * 100 : 0;
  row.pct6 = m > 0 ? (row.r6 / m) * 100 : 0;
  row.pct7 = m > 0 ? (row.r7 / m) * 100 : 0;
  row.pct8 = m > 0 ? (row.r8 / m) * 100 : 0;
  row.pctComprobacion = m > 0 ? (row.comprobacion / m) * 100 : 0;
};

const emptyDesempenoRow = () => ({
  matricula: 0,
  r5: 0,
  r6: 0,
  r7: 0,
  r8: 0,
  comprobacion: 0,
  sinCalificar: 0,
  pct5: 0,
  pct6: 0,
  pct7: 0,
  pct8: 0,
  pctComprobacion: 0
});

/**
 * Hoja 3: DESEMPEÑO ALCANZADO usando los mismos alumnos en Existencia de Hoja 1.
 */
export const calcularDesempenoMomento = (existenciaAlumnos = {}, momentoId = 1) => {
  const filas = {};

  GRADOS_SEG.forEach((grado) => {
    const matList = MATERIAS_IDS_POR_GRADO[grado] || [];
    TURNOS_SEG.forEach((turno) => {
      const key = `${grado}-${turno}`;
      const students = existenciaAlumnos[key] || [];
      const row = emptyDesempenoRow();
      row.matricula = students.length;

      students.forEach((s) => {
        let sum = 0;
        let count = 0;
        matList.forEach((mat) => {
          const val = getCalificacionMateriaHastaMomento(s, mat.id, momentoId);
          if (val !== null) {
            sum += val;
            count++;
          }
        });
        if (count === 0) {
          row.sinCalificar++;
          return;
        }
        const prom = truncateNumberTo1Dec(sum / count);
        if (prom >= 8.0) row.r8++;
        else if (prom >= 7.0) row.r7++;
        else if (prom >= 6.0) row.r6++;
        else row.r5++;
      });

      finalizeDesempenoRow(row);
      filas[key] = row;
    });
  });

  const totalesGrado = {};
  GRADOS_SEG.forEach((g) => {
    const row = emptyDesempenoRow();
    TURNOS_SEG.forEach((t) => {
      const src = filas[`${g}-${t}`];
      row.matricula += src.matricula;
      row.r5 += src.r5;
      row.r6 += src.r6;
      row.r7 += src.r7;
      row.r8 += src.r8;
      row.sinCalificar += src.sinCalificar;
    });
    finalizeDesempenoRow(row);
    totalesGrado[g] = row;
  });

  const totalEscuela = emptyDesempenoRow();
  GRADOS_SEG.forEach((g) => {
    const src = totalesGrado[g];
    totalEscuela.matricula += src.matricula;
    totalEscuela.r5 += src.r5;
    totalEscuela.r6 += src.r6;
    totalEscuela.r7 += src.r7;
    totalEscuela.r8 += src.r8;
    totalEscuela.sinCalificar += src.sinCalificar;
  });
  finalizeDesempenoRow(totalEscuela);

  return { filas, totalesGrado, totalEscuela };
};

const toLocalDayKey = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Sugerencia de Hoja 4 (ASISTENCIA) a partir de los escaneos QR registrados en Firestore.
 */
export const calcularAsistenciaDesdeQR = (
  existenciaAlumnos = {},
  registrosAsistencia = [],
  fechaInicioStr = '',
  fechaFinStr = ''
) => {
  const fInicio = toStartOfDay(parseFechaFlexible(fechaInicioStr));
  const fFin = toEndOfDay(parseFechaFlexible(fechaFinStr));

  const diasTurno = {
    Matutino: new Set(),
    Vespertino: new Set()
  };
  const asistenciasPorMatricula = {};
  let totalEntradas = 0;

  (registrosAsistencia || []).forEach((reg) => {
    if (!reg || String(reg.tipo || '').toUpperCase() !== 'ENTRADA') return;
    const dt = parseFechaFlexible(reg.timestamp || reg.fecha);
    if (!dt) return;
    if (fInicio && dt < fInicio) return;
    if (fFin && dt > fFin) return;

    const turno = normalizarTurnoSEG(reg.turno);
    const dayKey = toLocalDayKey(dt);
    const mat = String(reg.matricula || '').trim().toUpperCase();
    if (!mat) return;

    diasTurno[turno].add(dayKey);
    if (!asistenciasPorMatricula[mat]) asistenciasPorMatricula[mat] = new Set();
    asistenciasPorMatricula[mat].add(dayKey);
    totalEntradas++;
  });

  const rawByKey = {};
  GRADOS_SEG.forEach((g) => {
    TURNOS_SEG.forEach((t) => {
      const key = `${g}-${t}`;
      const diasSet = diasTurno[t];
      const totalDias = diasSet.size;
      const out = { f1_5: 0, f6_10: 0, fMas10: 0, sinFaltas: 0 };

      if (totalDias === 0) {
        rawByKey[key] = out;
        return;
      }

      const students = existenciaAlumnos[key] || [];
      students.forEach((s) => {
        const mat = String(s.matricula || '').trim().toUpperCase();
        const matDates = asistenciasPorMatricula[mat];
        let asistidos = 0;
        if (matDates) {
          matDates.forEach((dk) => {
            if (diasSet.has(dk)) asistidos++;
          });
        }
        const faltas = Math.max(0, totalDias - asistidos);
        if (faltas === 0) out.sinFaltas++;
        else if (faltas <= 5) out.f1_5++;
        else if (faltas <= 10) out.f6_10++;
        else out.fMas10++;
      });

      rawByKey[key] = out;
    });
  });

  return {
    rawByKey,
    diasEscaneados: {
      Matutino: diasTurno.Matutino.size,
      Vespertino: diasTurno.Vespertino.size
    },
    totalEntradas
  };
};

const emptyAsistenciaRow = () => ({
  matricula: 0,
  f1_5: 0,
  f6_10: 0,
  fMas10: 0,
  sinFaltas: 0,
  total: 0,
  cuadra: true,
  pct1_5: 0,
  pct6_10: 0,
  pctMas10: 0,
  pctSinFaltas: 0,
  pctTotal: 0
});

const finalizeAsistenciaRow = (row) => {
  const m = row.matricula;
  row.total = row.f1_5 + row.f6_10 + row.fMas10 + row.sinFaltas;
  row.cuadra = row.total === m;
  row.pct1_5 = m > 0 ? (row.f1_5 / m) * 100 : 0;
  row.pct6_10 = m > 0 ? (row.f6_10 / m) * 100 : 0;
  row.pctMas10 = m > 0 ? (row.fMas10 / m) * 100 : 0;
  row.pctSinFaltas = m > 0 ? (row.sinFaltas / m) * 100 : 0;
  row.pctTotal = m > 0 ? (row.total / m) * 100 : 0;
};

const toIntNonNeg = (val) => {
  const n = parseInt(val, 10);
  return isNaN(n) || n < 0 ? 0 : n;
};

/**
 * Hoja 4: ASISTENCIA combinando matrícula exacta de Hoja 1 con valores manuales o calculados desde QR.
 */
export const construirTablaAsistencia = (
  matriculaRes,
  rawAsistenciaMap = {},
  autoSinFaltas = true
) => {
  const filas = {};

  GRADOS_SEG.forEach((g) => {
    TURNOS_SEG.forEach((t) => {
      const key = `${g}-${t}`;
      const mat = matriculaRes?.filas?.[key]?.existencia?.t || 0;
      const raw = rawAsistenciaMap[key] || {};
      const row = emptyAsistenciaRow();
      row.matricula = mat;
      row.f1_5 = toIntNonNeg(raw.f1_5);
      row.f6_10 = toIntNonNeg(raw.f6_10);
      row.fMas10 = toIntNonNeg(raw.fMas10);
      row.sinFaltas = autoSinFaltas
        ? Math.max(0, mat - (row.f1_5 + row.f6_10 + row.fMas10))
        : toIntNonNeg(raw.sinFaltas);
      finalizeAsistenciaRow(row);
      filas[key] = row;
    });
  });

  const totalesGrado = {};
  GRADOS_SEG.forEach((g) => {
    const row = emptyAsistenciaRow();
    TURNOS_SEG.forEach((t) => {
      const src = filas[`${g}-${t}`];
      row.matricula += src.matricula;
      row.f1_5 += src.f1_5;
      row.f6_10 += src.f6_10;
      row.fMas10 += src.fMas10;
      row.sinFaltas += src.sinFaltas;
    });
    finalizeAsistenciaRow(row);
    totalesGrado[g] = row;
  });

  const totalEscuela = emptyAsistenciaRow();
  GRADOS_SEG.forEach((g) => {
    const src = totalesGrado[g];
    totalEscuela.matricula += src.matricula;
    totalEscuela.f1_5 += src.f1_5;
    totalEscuela.f6_10 += src.f6_10;
    totalEscuela.fMas10 += src.fMas10;
    totalEscuela.sinFaltas += src.sinFaltas;
  });
  finalizeAsistenciaRow(totalEscuela);

  return { filas, totalesGrado, totalEscuela };
};
