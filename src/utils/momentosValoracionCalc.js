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
  const alumnosSinCalificacionPorTurno = { Matutino: 0, Vespertino: 0 };
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
        if (!hasAny) {
          alumnosSinCalificacion++;
          alumnosSinCalificacionPorTurno[turno]++;
        }
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
    alumnosSinCalificacionPorTurno,
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

const cloneMatRow = (src) => {
  const r = emptyMatRow();
  if (!src) return r;
  r.grupos = Number(src.grupos) || 0;
  r.inicial = { h: Number(src.inicial?.h) || 0, m: Number(src.inicial?.m) || 0, t: Number(src.inicial?.t) || 0 };
  r.altas = { h: Number(src.altas?.h) || 0, m: Number(src.altas?.m) || 0, t: Number(src.altas?.t) || 0 };
  r.bajas = { h: Number(src.bajas?.h) || 0, m: Number(src.bajas?.m) || 0, t: Number(src.bajas?.t) || 0 };
  finalizeMatRow(r);
  return r;
};

const cloneAprovTurno = (src) => ({
  materias: { ...(src?.materias || {}) },
  promGrado: { ...(src?.promGrado || {}) },
  promTurno: src?.promTurno ?? null
});

const cloneDesempenoRow = (src) => {
  const r = emptyDesempenoRow();
  if (!src) return r;
  r.matricula = Number(src.matricula) || 0;
  r.r5 = Number(src.r5) || 0;
  r.r6 = Number(src.r6) || 0;
  r.r7 = Number(src.r7) || 0;
  r.r8 = Number(src.r8) || 0;
  r.sinCalificar = Number(src.sinCalificar) || 0;
  finalizeDesempenoRow(r);
  return r;
};

const cloneAsistenciaRow = (src) => {
  const r = emptyAsistenciaRow();
  if (!src) return r;
  r.matricula = Number(src.matricula) || 0;
  r.f1_5 = Number(src.f1_5) || 0;
  r.f6_10 = Number(src.f6_10) || 0;
  r.fMas10 = Number(src.fMas10) || 0;
  r.sinFaltas = Number(src.sinFaltas) || 0;
  finalizeAsistenciaRow(r);
  return r;
};

/**
 * Extrae una instantánea serializable de las 4 hojas únicamente para un turno ('Matutino' o 'Vespertino').
 */
export const extraerSnapshotTurno = ({
  turno,
  matricula,
  aprovechamiento,
  desempeno,
  asistencia,
  frozenBy = 'Desconocido',
  fechaCorte = '',
  frozenAt = new Date().toISOString()
}) => {
  if (!TURNOS_SEG.includes(turno)) {
    throw new Error(`Turno inválido para snapshot: ${turno}`);
  }
  const matriculaFilas = {};
  const desempenoFilas = {};
  const asistenciaFilas = {};

  GRADOS_SEG.forEach((g) => {
    const key = `${g}-${turno}`;
    matriculaFilas[key] = cloneMatRow(matricula?.filas?.[key]);
    desempenoFilas[key] = cloneDesempenoRow(desempeno?.filas?.[key]);
    asistenciaFilas[key] = cloneAsistenciaRow(asistencia?.filas?.[key]);
  });

  return {
    turno,
    frozenAt,
    frozenBy,
    fechaCorte,
    matriculaFilas,
    aprovechamientoTurno: cloneAprovTurno(aprovechamiento?.turnos?.[turno]),
    alumnosSinCalificacion:
      aprovechamiento?.alumnosSinCalificacionPorTurno?.[turno] ?? 0,
    desempenoFilas,
    asistenciaFilas
  };
};

/**
 * Normaliza el estado de congelado por turno, migrando en memoria el formato global previo si existiera.
 */
export const normalizarCongeladoTurnos = (momentData) => {
  if (momentData?.congeladoTurnos) {
    return {
      Matutino: momentData.congeladoTurnos.Matutino || null,
      Vespertino: momentData.congeladoTurnos.Vespertino || null
    };
  }

  if (momentData?.congelado) {
    const leg = momentData.congelado;
    const legacySinCalif = leg.aprovechamiento?.alumnosSinCalificacion ?? 0;
    const legacySinCalifPorTurno = leg.aprovechamiento?.alumnosSinCalificacionPorTurno || {
      Matutino: legacySinCalif,
      Vespertino: 0
    };
    const aprovWithTurno = {
      ...(leg.aprovechamiento || {}),
      alumnosSinCalificacionPorTurno: legacySinCalifPorTurno
    };
    return {
      Matutino: extraerSnapshotTurno({
        turno: 'Matutino',
        matricula: leg.matricula,
        aprovechamiento: aprovWithTurno,
        desempeno: leg.desempeno,
        asistencia: leg.asistencia,
        frozenBy: leg.frozenBy || 'Desconocido',
        fechaCorte: momentData?.meta?.fechaCorte || '',
        frozenAt: leg.frozenAt || new Date().toISOString()
      }),
      Vespertino: extraerSnapshotTurno({
        turno: 'Vespertino',
        matricula: leg.matricula,
        aprovechamiento: aprovWithTurno,
        desempeno: leg.desempeno,
        asistencia: leg.asistencia,
        frozenBy: leg.frozenBy || 'Desconocido',
        fechaCorte: momentData?.meta?.fechaCorte || '',
        frozenAt: leg.frozenAt || new Date().toISOString()
      })
    };
  }

  return { Matutino: null, Vespertino: null };
};

/**
 * Combina datos en vivo con los snapshots congelados independientes por turno
 * y recalcula TOTALES POR GRADO, TOTAL DE LA ESCUELA y PROM. GRAL DE ESCUELA.
 */
export const combinarMomentoConCongeladosPorTurno = ({
  liveMatricula,
  liveAprovechamiento,
  liveDesempeno,
  liveAsistencia,
  congeladoTurnos = {}
}) => {
  // 1. MATRÍCULA
  const matFilas = {};
  TURNOS_SEG.forEach((t) => {
    const snap = congeladoTurnos?.[t];
    GRADOS_SEG.forEach((g) => {
      const key = `${g}-${t}`;
      const src = snap?.matriculaFilas?.[key] || liveMatricula?.filas?.[key];
      matFilas[key] = cloneMatRow(src);
    });
  });

  const matTotalesGrado = {};
  GRADOS_SEG.forEach((g) => {
    const row = emptyMatRow();
    TURNOS_SEG.forEach((t) => {
      const src = matFilas[`${g}-${t}`];
      row.grupos += src.grupos;
      row.inicial.h += src.inicial.h;
      row.inicial.m += src.inicial.m;
      row.altas.h += src.altas.h;
      row.altas.m += src.altas.m;
      row.bajas.h += src.bajas.h;
      row.bajas.m += src.bajas.m;
    });
    finalizeMatRow(row);
    matTotalesGrado[g] = row;
  });

  const matTotalEscuela = emptyMatRow();
  GRADOS_SEG.forEach((g) => {
    const src = matTotalesGrado[g];
    matTotalEscuela.grupos += src.grupos;
    matTotalEscuela.inicial.h += src.inicial.h;
    matTotalEscuela.inicial.m += src.inicial.m;
    matTotalEscuela.altas.h += src.altas.h;
    matTotalEscuela.altas.m += src.altas.m;
    matTotalEscuela.bajas.h += src.bajas.h;
    matTotalEscuela.bajas.m += src.bajas.m;
  });
  finalizeMatRow(matTotalEscuela);

  // 2. APROVECHAMIENTO
  const aprovTurnos = {};
  const sinCalifPorTurno = {};
  let alumnosSinCalificacion = 0;

  TURNOS_SEG.forEach((t) => {
    const snap = congeladoTurnos?.[t];
    aprovTurnos[t] = snap?.aprovechamientoTurno
      ? cloneAprovTurno(snap.aprovechamientoTurno)
      : cloneAprovTurno(liveAprovechamiento?.turnos?.[t]);
    const sc = snap
      ? (Number(snap.alumnosSinCalificacion) || 0)
      : (Number(liveAprovechamiento?.alumnosSinCalificacionPorTurno?.[t]) || 0);
    sinCalifPorTurno[t] = sc;
    alumnosSinCalificacion += sc;
  });

  const escuelaMaterias = {};
  GRADOS_SEG.forEach((grado) => {
    (MATERIAS_IDS_POR_GRADO[grado] || []).forEach((mat) => {
      escuelaMaterias[mat.id] = avgNonNull(
        TURNOS_SEG.map((t) => aprovTurnos[t].materias[mat.id])
      );
    });
  });

  const escuelaPromGrado = {};
  GRADOS_SEG.forEach((grado) => {
    escuelaPromGrado[grado] = avgNonNull(
      TURNOS_SEG.map((t) => aprovTurnos[t].promGrado[grado])
    );
  });

  const escuelaPromTurno = avgNonNull(
    TURNOS_SEG.map((t) => aprovTurnos[t].promTurno)
  );

  // 3. DESEMPEÑO ALCANZADO
  const desFilas = {};
  TURNOS_SEG.forEach((t) => {
    const snap = congeladoTurnos?.[t];
    GRADOS_SEG.forEach((g) => {
      const key = `${g}-${t}`;
      const src = snap?.desempenoFilas?.[key] || liveDesempeno?.filas?.[key];
      desFilas[key] = cloneDesempenoRow(src);
    });
  });

  const desTotalesGrado = {};
  GRADOS_SEG.forEach((g) => {
    const row = emptyDesempenoRow();
    TURNOS_SEG.forEach((t) => {
      const src = desFilas[`${g}-${t}`];
      row.matricula += src.matricula;
      row.r5 += src.r5;
      row.r6 += src.r6;
      row.r7 += src.r7;
      row.r8 += src.r8;
      row.sinCalificar += src.sinCalificar;
    });
    finalizeDesempenoRow(row);
    desTotalesGrado[g] = row;
  });

  const desTotalEscuela = emptyDesempenoRow();
  GRADOS_SEG.forEach((g) => {
    const src = desTotalesGrado[g];
    desTotalEscuela.matricula += src.matricula;
    desTotalEscuela.r5 += src.r5;
    desTotalEscuela.r6 += src.r6;
    desTotalEscuela.r7 += src.r7;
    desTotalEscuela.r8 += src.r8;
    desTotalEscuela.sinCalificar += src.sinCalificar;
  });
  finalizeDesempenoRow(desTotalEscuela);

  // 4. ASISTENCIA
  const asiFilas = {};
  TURNOS_SEG.forEach((t) => {
    const snap = congeladoTurnos?.[t];
    GRADOS_SEG.forEach((g) => {
      const key = `${g}-${t}`;
      const src = snap?.asistenciaFilas?.[key] || liveAsistencia?.filas?.[key];
      asiFilas[key] = cloneAsistenciaRow(src);
    });
  });

  const asiTotalesGrado = {};
  GRADOS_SEG.forEach((g) => {
    const row = emptyAsistenciaRow();
    TURNOS_SEG.forEach((t) => {
      const src = asiFilas[`${g}-${t}`];
      row.matricula += src.matricula;
      row.f1_5 += src.f1_5;
      row.f6_10 += src.f6_10;
      row.fMas10 += src.fMas10;
      row.sinFaltas += src.sinFaltas;
    });
    finalizeAsistenciaRow(row);
    asiTotalesGrado[g] = row;
  });

  const asiTotalEscuela = emptyAsistenciaRow();
  GRADOS_SEG.forEach((g) => {
    const src = asiTotalesGrado[g];
    asiTotalEscuela.matricula += src.matricula;
    asiTotalEscuela.f1_5 += src.f1_5;
    asiTotalEscuela.f6_10 += src.f6_10;
    asiTotalEscuela.fMas10 += src.fMas10;
    asiTotalEscuela.sinFaltas += src.sinFaltas;
  });
  finalizeAsistenciaRow(asiTotalEscuela);

  return {
    matricula: {
      filas: matFilas,
      totalesGrado: matTotalesGrado,
      totalEscuela: matTotalEscuela,
      existenciaAlumnos: liveMatricula?.existenciaAlumnos || {}
    },
    aprovechamiento: {
      turnos: aprovTurnos,
      escuela: {
        materias: escuelaMaterias,
        promGrado: escuelaPromGrado,
        promTurno: escuelaPromTurno
      },
      alumnosSinCalificacion,
      alumnosSinCalificacionPorTurno: sinCalifPorTurno,
      celdasFaltantes: liveAprovechamiento?.celdasFaltantes ?? 0
    },
    desempeno: {
      filas: desFilas,
      totalesGrado: desTotalesGrado,
      totalEscuela: desTotalEscuela
    },
    asistencia: {
      filas: asiFilas,
      totalesGrado: asiTotalesGrado,
      totalEscuela: asiTotalEscuela
    }
  };
};

/**
 * Filtra las 4 hojas de un Momento para mostrar y totalizar un único turno ('Matutino' o 'Vespertino')
 * o ambos ('Todos').
 */
export const filtrarMomentoPorTurno = (
  { matricula, aprovechamiento, desempeno, asistencia } = {},
  turnoFiltro = 'Todos'
) => {
  if (turnoFiltro !== 'Matutino' && turnoFiltro !== 'Vespertino') {
    return {
      matricula,
      aprovechamiento,
      desempeno,
      asistencia,
      turnosVisibles: [...TURNOS_SEG],
      turnoActivo: 'Todos'
    };
  }

  // 1. MATRÍCULA (solo turno activo)
  const matFilas = {};
  const matTotalesGrado = {};
  const matTotalEscuela = emptyMatRow();
  GRADOS_SEG.forEach((g) => {
    const key = `${g}-${turnoFiltro}`;
    const cloned = cloneMatRow(matricula?.filas?.[key]);
    matFilas[key] = cloned;
    matTotalesGrado[g] = cloneMatRow(cloned);
    matTotalEscuela.grupos += cloned.grupos;
    matTotalEscuela.inicial.h += cloned.inicial.h;
    matTotalEscuela.inicial.m += cloned.inicial.m;
    matTotalEscuela.altas.h += cloned.altas.h;
    matTotalEscuela.altas.m += cloned.altas.m;
    matTotalEscuela.bajas.h += cloned.bajas.h;
    matTotalEscuela.bajas.m += cloned.bajas.m;
  });
  finalizeMatRow(matTotalEscuela);

  // 2. APROVECHAMIENTO (escuela igual al promedio exclusivo del turno seleccionado)
  const turnoAprov = cloneAprovTurno(aprovechamiento?.turnos?.[turnoFiltro]);
  const sinCalifTurno =
    aprovechamiento?.alumnosSinCalificacionPorTurno?.[turnoFiltro] ?? 0;

  // 3. DESEMPEÑO (solo turno activo)
  const desFilas = {};
  const desTotalesGrado = {};
  const desTotalEscuela = emptyDesempenoRow();
  GRADOS_SEG.forEach((g) => {
    const key = `${g}-${turnoFiltro}`;
    const cloned = cloneDesempenoRow(desempeno?.filas?.[key]);
    desFilas[key] = cloned;
    desTotalesGrado[g] = cloneDesempenoRow(cloned);
    desTotalEscuela.matricula += cloned.matricula;
    desTotalEscuela.r5 += cloned.r5;
    desTotalEscuela.r6 += cloned.r6;
    desTotalEscuela.r7 += cloned.r7;
    desTotalEscuela.r8 += cloned.r8;
    desTotalEscuela.sinCalificar += cloned.sinCalificar;
  });
  finalizeDesempenoRow(desTotalEscuela);

  // 4. ASISTENCIA (solo turno activo)
  const asiFilas = {};
  const asiTotalesGrado = {};
  const asiTotalEscuela = emptyAsistenciaRow();
  GRADOS_SEG.forEach((g) => {
    const key = `${g}-${turnoFiltro}`;
    const cloned = cloneAsistenciaRow(asistencia?.filas?.[key]);
    asiFilas[key] = cloned;
    asiTotalesGrado[g] = cloneAsistenciaRow(cloned);
    asiTotalEscuela.matricula += cloned.matricula;
    asiTotalEscuela.f1_5 += cloned.f1_5;
    asiTotalEscuela.f6_10 += cloned.f6_10;
    asiTotalEscuela.fMas10 += cloned.fMas10;
    asiTotalEscuela.sinFaltas += cloned.sinFaltas;
  });
  finalizeAsistenciaRow(asiTotalEscuela);

  return {
    matricula: {
      filas: matFilas,
      totalesGrado: matTotalesGrado,
      totalEscuela: matTotalEscuela,
      existenciaAlumnos: matricula?.existenciaAlumnos || {}
    },
    aprovechamiento: {
      turnos: {
        [turnoFiltro]: turnoAprov
      },
      escuela: cloneAprovTurno(turnoAprov),
      alumnosSinCalificacion: sinCalifTurno,
      alumnosSinCalificacionPorTurno: {
        [turnoFiltro]: sinCalifTurno
      },
      celdasFaltantes: aprovechamiento?.celdasFaltantes ?? 0
    },
    desempeno: {
      filas: desFilas,
      totalesGrado: desTotalesGrado,
      totalEscuela: desTotalEscuela
    },
    asistencia: {
      filas: asiFilas,
      totalesGrado: asiTotalesGrado,
      totalEscuela: asiTotalEscuela
    },
    turnosVisibles: [turnoFiltro],
    turnoActivo: turnoFiltro
  };
};
