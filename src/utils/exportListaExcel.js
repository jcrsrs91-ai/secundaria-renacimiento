import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  quitarAcentosNombre,
  roundToIntNumber,
  truncateTo1Dec,
  getCalificacionTrimestreEfectiva
} from './format';
import { TALLER_POR_GRUPO, getStudentGender, sortAttendanceListStudents } from '../components/ListaAsistenciaPrint';

// Convierte índice de columna base-1 (1 -> A, 26 -> Z, 27 -> AA)
const colIndexToLetter = (colIdx) => {
  let temp;
  let letter = '';
  let c = colIdx;
  while (c > 0) {
    temp = (c - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    c = (c - temp - 1) / 26;
  }
  return letter;
};

const escapeXml = (unsafe) => {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const normalizeNameForMatch = (str = '') =>
  String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s*\[(ALTA|BAJA)\]\s*/g, '')
    .replace(/[^A-ZÑ0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Genera y descarga un archivo Excel (.xlsx) nativo y 100% editable de la
 * Lista Oficial de Asistencia y Evaluación, calibrado específicamente para
 * IMPRESIÓN EN TAMAÑO CARTA HORIZONTAL (Letter Landscape 11" x 8.5") a página completa,
 * sin columna de Matrícula para aprovechar al máximo el espacio horizontal.
 */
export const descargarListaAsistenciaEditableExcel = async ({
  students = [],
  grado = '1er Grado',
  grupo = 'A',
  asignatura = '',
  docente = '',
  trimestreLabel = '',
  cicloEscolar = '2025 - 2026',
  coordinadorNombre = '',
  evalData = {},
  contenidosFecha = {}
}) => {
  const sortedStudents = sortAttendanceListStudents(students);
  const cleanGrupo = (grupo || 'A').trim().toUpperCase();
  const firstStudent = sortedStudents[0] || {};
  const turno = ['G', 'H', 'I', 'J', 'K', 'L'].includes(cleanGrupo)
    ? 'VESPERTINO'
    : (firstStudent.turno || 'MATUTINO').toUpperCase();
  const taller = (TALLER_POR_GRUPO[cleanGrupo] || firstStudent.taller || 'CLIMATIZACIÓN Y REFRIGERACIÓN').toUpperCase();

  // Calcular existencia activa (excluyendo bajas)
  let existenciaH = 0;
  let existenciaM = 0;
  sortedStudents.forEach(s => {
    if ((s.status || 'Activo') === 'Activo') {
      const gen = getStudentGender(s);
      if (gen === 'M') existenciaM++;
      else existenciaH++;
    }
  });
  const existenciaT = existenciaH + existenciaM;

  // Rellenar hasta al menos 27 filas para mantener la proporción exacta de hoja tamaño carta
  const totalRows = Math.max(27, sortedStudents.length);
  const rowsList = [...sortedStudents];
  while (rowsList.length < totalRows) {
    rowsList.push({
      id: `empty_${rowsList.length}`,
      isEmpty: true,
      apellidoPaterno: '',
      apellidoMaterno: '',
      nombres: ''
    });
  }

  // Construcción de filas XML de la hoja (37 columnas: A..AK — SIN MATRÍCULA para optimizar ancho en Carta)
  // A (1): N°
  // B (2): NOMBRE DEL ALUMNO(A)
  // C (3): H/M (Sexo)
  // D..W (4..23, 20 cols): Días 1..20
  // X (24): SUMA
  // Y (25): PROM.
  // Z (26): T.F. (Faltas)
  // AA..AF (27..32, 6 cols): Tareas T1..T6
  // AG (33): EXAM.
  // AH (34): PART.
  // AI (35): OTRO
  // AJ (36): CALIF. (Entero)
  // AK (37): OBSERVACIONES

  const TOTAL_COLS = 37;
  const sheetRowsXml = [];
  const mergeCells = [];

  const buildCell = (colIdx, rowIdx, { value = '', type = 's', style = 0, formula = null }) => {
    const ref = `${colIndexToLetter(colIdx)}${rowIdx}`;
    if (formula !== null) {
      const cachedVal = value !== '' && value !== null && value !== undefined ? `<v>${escapeXml(value)}</v>` : '';
      return `<c r="${ref}" s="${style}"><f>${escapeXml(formula)}</f>${cachedVal}</c>`;
    }
    if (value === '' || value === null || value === undefined) {
      return `<c r="${ref}" s="${style}"/>`;
    }
    if (type === 'n' && !isNaN(Number(value))) {
      return `<c r="${ref}" s="${style}" t="n"><v>${Number(value)}</v></c>`;
    }
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
  };

  // FILA 1: Encabezado Institucional Oficial
  {
    const cells = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      let val = '';
      let st = 1;
      if (c === 1) val = 'ESCUELA SECUNDARIA TÉCNICA N° 68 "RENACIMIENTO" — C.C.T. 12DST0077B';
      if (c === 14) {
        val = 'LISTA OFICIAL DE ASISTENCIA Y EVALUACIÓN';
        st = 2;
      }
      if (c === 29) val = `CICLO ESCOLAR: ${cicloEscolar}`;
      if (c >= 14 && c <= 28) st = 2;
      cells.push(buildCell(c, 1, { value: val, style: st }));
    }
    mergeCells.push('A1:M1', 'N1:AB1', 'AC1:AK1');
    sheetRowsXml.push(`<row r="1" ht="22" customHeight="1">${cells.join('')}</row>`);
  }

  // FILA 2: Docente, Asignatura y Taller
  {
    const cells = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      let val = '';
      if (c === 1) val = `DOCENTE: ${docente ? docente.toUpperCase() : '(ESCRIBA SU NOMBRE AQUÍ)'}`;
      if (c === 12) val = `ASIGNATURA / DISCIPLINA: ${asignatura ? asignatura.toUpperCase() : '(ESCRIBA SU MATERIA AQUÍ)'}`;
      if (c === 26) val = `TECNOLOGÍA / TALLER: ${taller}`;
      cells.push(buildCell(c, 2, { value: val, style: 3 }));
    }
    mergeCells.push('A2:K2', 'L2:Y2', 'Z2:AK2');
    sheetRowsXml.push(`<row r="2" ht="19" customHeight="1">${cells.join('')}</row>`);
  }

  // FILA 3: Grado, Grupo, Turno, Trimestre y Nota de Cálculo Automático
  {
    const cells = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      let val = '';
      let st = 3;
      if (c === 1) val = `GRADO: ${grado.toUpperCase()}   |   GRUPO: "${cleanGrupo}"   |   TURNO: ${turno}`;
      if (c === 12) val = `PERIODO DE EVALUACIÓN: ${trimestreLabel ? trimestreLabel.toUpperCase() : 'TRIMESTRE'}`;
      if (c >= 21) {
        st = 14;
        if (c === 21) {
          val = 'Celdas 1-20 suman y promedian automático (SUMA / PROM.) | CALIF. TRIM. redondea a entero';
        }
      }
      cells.push(buildCell(c, 3, { value: val, style: st }));
    }
    mergeCells.push('A3:K3', 'L3:T3', 'U3:AK3');
    sheetRowsXml.push(`<row r="3" ht="18" customHeight="1">${cells.join('')}</row>`);
  }

  // FILA 4: Agrupaciones de Encabezado de Tabla
  {
    const cells = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      let val = '';
      if (c === 1) val = 'N°';
      if (c === 2) val = 'NOMBRE DEL ALUMNO(A)';
      if (c === 3) val = 'SEXO';
      if (c === 4) val = 'ASISTENCIAS O CALIFICACIÓN DIARIA POR CLASE (CELDAS 1 A 20)';
      if (c === 24) val = 'CÁLCULO';
      if (c === 26) val = 'T.F.';
      if (c === 27) val = 'TAREAS / TRABAJOS';
      if (c === 33) val = 'EVALUACIÓN TRIMESTRAL';
      if (c === 37) val = 'OBSERVACIONES';
      cells.push(buildCell(c, 4, { value: val, style: 4 }));
    }
    mergeCells.push('D4:W4', 'X4:Y4', 'AA4:AF4', 'AG4:AJ4');
    sheetRowsXml.push(`<row r="4" ht="19" customHeight="1">${cells.join('')}</row>`);
  }

  // FILA 5: Fila Editable CONTENIDOS / FECHA DE CLASE
  {
    const cells = [];
    cells.push(buildCell(1, 5, { value: '', style: 5 }));
    cells.push(buildCell(2, 5, { value: 'CONTENIDOS / FECHA DE CLASE ->', style: 5 }));
    cells.push(buildCell(3, 5, { value: '', style: 5 }));
    for (let d = 1; d <= 20; d++) {
      const savedFecha = contenidosFecha?.[`d${d}`] || '';
      cells.push(buildCell(3 + d, 5, { value: savedFecha, style: 5 }));
    }
    cells.push(buildCell(24, 5, { value: 'Auto', style: 5 }));
    cells.push(buildCell(25, 5, { value: 'Exacto', style: 5 }));
    cells.push(buildCell(26, 5, { value: '', style: 5 }));
    for (let t = 1; t <= 6; t++) {
      const savedTema = contenidosFecha?.[`t${t}`] || '';
      cells.push(buildCell(26 + t, 5, { value: savedTema, style: 5 }));
    }
    cells.push(buildCell(33, 5, { value: '', style: 5 }));
    cells.push(buildCell(34, 5, { value: '', style: 5 }));
    cells.push(buildCell(35, 5, { value: '', style: 5 }));
    cells.push(buildCell(36, 5, { value: 'Entero', style: 5 }));
    cells.push(buildCell(37, 5, { value: '', style: 5 }));
    sheetRowsXml.push(`<row r="5" ht="28" customHeight="1">${cells.join('')}</row>`);
  }

  // FILA 6: Sub-encabezados de Columnas (1..20, SUMA, PROM, FALTAS, T1..T6, EXAM, PART, OTRO, CALIF)
  {
    const cells = [];
    cells.push(buildCell(1, 6, { value: 'N°', style: 4 }));
    cells.push(buildCell(2, 6, { value: 'APELLIDOS Y NOMBRES', style: 4 }));
    cells.push(buildCell(3, 6, { value: 'H/M', style: 4 }));
    for (let d = 1; d <= 20; d++) {
      cells.push(buildCell(3 + d, 6, { value: d, type: 'n', style: 4 }));
    }
    cells.push(buildCell(24, 6, { value: 'SUMA', style: 4 }));
    cells.push(buildCell(25, 6, { value: 'PROM.', style: 4 }));
    cells.push(buildCell(26, 6, { value: 'FALTAS', style: 4 }));
    for (let t = 1; t <= 6; t++) {
      cells.push(buildCell(26 + t, 6, { value: `T${t}`, style: 4 }));
    }
    cells.push(buildCell(33, 6, { value: 'EXAM.', style: 4 }));
    cells.push(buildCell(34, 6, { value: 'PART.', style: 4 }));
    cells.push(buildCell(35, 6, { value: 'OTRO', style: 4 }));
    cells.push(buildCell(36, 6, { value: 'CALIF.', style: 4 }));
    cells.push(buildCell(37, 6, { value: 'OBSERVACIONES', style: 4 }));
    sheetRowsXml.push(`<row r="6" ht="19" customHeight="1">${cells.join('')}</row>`);
  }

  // FILAS DE ALUMNOS (Desde fila 7 hasta 6 + rowsList.length)
  const startStudentRow = 7;
  const endStudentRow = startStudentRow + rowsList.length - 1;

  rowsList.forEach((st, idx) => {
    const r = startStudentRow + idx;
    const isBaja = !st.isEmpty && (st.status || '').toLowerCase() === 'baja';
    const isAlta = !st.isEmpty && !isBaja && st.tipoIngreso === 'Alta';
    const rawName = st.isEmpty
      ? ''
      : `${st.apellidoPaterno || ''} ${st.apellidoMaterno || ''} ${st.nombres || ''}`.replace(/\s+/g, ' ').trim();
    const fullName = rawName ? quitarAcentosNombre(rawName).toUpperCase() : '';
    const gen = st.isEmpty ? '' : getStudentGender(st);
    const stEval = (!st.isEmpty && evalData[st.id]) ? evalData[st.id] : {};

    const cells = [];
    // A (1): N°
    cells.push(buildCell(1, r, { value: idx + 1, type: 'n', style: isBaja ? 8 : 6 }));
    // B (2): Nombre del Alumno(a)
    const displayNombre = isBaja
      ? `${fullName} [BAJA]`
      : isAlta
        ? `${fullName} [ALTA]`
        : fullName;
    cells.push(buildCell(2, r, { value: displayNombre, style: isBaja ? 8 : 7 }));
    // C (3): Sexo (H/M)
    cells.push(buildCell(3, r, { value: isBaja ? '' : gen, style: isBaja ? 8 : 6 }));

    if (isBaja) {
      for (let c = 4; c <= 36; c++) {
        cells.push(buildCell(c, r, { value: c === 13 ? `— BAJA OFICIAL ${st.fechaBaja ? '(' + st.fechaBaja + ')' : ''} —` : '', style: 8 }));
      }
      cells.push(buildCell(37, r, { value: `BAJA ${st.fechaBaja || ''}`.trim(), style: 8 }));
    } else {
      // D..W (4..23): 20 celdas de días
      for (let d = 1; d <= 20; d++) {
        const rawDia = stEval.dias?.[`d${d}`] ?? '';
        const isNum = rawDia !== '' && !isNaN(Number(rawDia));
        cells.push(buildCell(3 + d, r, {
          value: rawDia,
          type: isNum ? 'n' : 's',
          style: 6
        }));
      }

      // X (24): SUMA DÍAS (Fórmula Excel: suma las calificaciones numéricas en D..W)
      const formulaSumaDias = `IF(COUNT(D${r}:W${r})>0,ROUND(SUM(D${r}:W${r}),2),"")`;
      cells.push(buildCell(24, r, { formula: formulaSumaDias, style: 9 }));

      // Y (25): PROM. CLASES (Fórmula Excel: divide la suma entre el total de días con clase)
      const formulaPromClases = `IF(COUNT(D${r}:W${r})>0,ROUND(SUM(D${r}:W${r})/IF(COUNTA($D$5:$W$5)>COUNT(D${r}:W${r}),COUNTA($D$5:$W$5),COUNT(D${r}:W${r})),2),"")`;
      cells.push(buildCell(25, r, { formula: formulaPromClases, style: 9 }));

      // Z (26): FALTAS
      const faltasVal = stEval.faltas ?? '';
      cells.push(buildCell(26, r, {
        value: faltasVal,
        type: faltasVal !== '' && !isNaN(Number(faltasVal)) ? 'n' : 's',
        style: 6
      }));

      // AA..AF (27..32): Tareas T1..T6
      for (let t = 1; t <= 6; t++) {
        const tVal = stEval[`t${t}`] ?? '';
        cells.push(buildCell(26 + t, r, {
          value: tVal,
          type: tVal !== '' && !isNaN(Number(tVal)) ? 'n' : 's',
          style: 6
        }));
      }

      // AG (33): Examen, AH (34): Participación, AI (35): Otro
      const examVal = stEval.examen ?? '';
      const partVal = stEval.participacion ?? '';
      const otroVal = stEval.extraEval ?? '';
      cells.push(buildCell(33, r, { value: examVal, type: examVal !== '' && !isNaN(Number(examVal)) ? 'n' : 's', style: 6 }));
      cells.push(buildCell(34, r, { value: partVal, type: partVal !== '' && !isNaN(Number(partVal)) ? 'n' : 's', style: 6 }));
      cells.push(buildCell(35, r, { value: otroVal, type: otroVal !== '' && !isNaN(Number(otroVal)) ? 'n' : 's', style: 6 }));

      // AJ (36): CALIF. TRIM. (NÚMERO ENTERO REDONDEADO)
      const califGuardada = roundToIntNumber(stEval.calificacion);
      const formulaCalifTrim = `IF(COUNT(AA${r}:AI${r})>0,ROUND(AVERAGE(AA${r}:AI${r}),0),IF(Y${r}<>"",ROUND(Y${r},0),""))`;
      if (califGuardada !== null) {
        cells.push(buildCell(36, r, { value: califGuardada, type: 'n', style: 10 }));
      } else {
        cells.push(buildCell(36, r, { formula: formulaCalifTrim, style: 10 }));
      }

      // AK (37): OBSERVACIONES
      const obsDefault = stEval.observaciones
        ? stEval.observaciones
        : isAlta
          ? `ALTA ${st.fechaAlta || ''}`.trim()
          : '';
      cells.push(buildCell(37, r, { value: obsDefault, style: 6 }));
    }

    sheetRowsXml.push(`<row r="${r}" ht="18.5" customHeight="1">${cells.join('')}</row>`);
  });

  // FILA COMPACTA DE SEPARACIÓN ANTES DE ESTADÍSTICA
  const spacerRow1 = endStudentRow + 1;
  sheetRowsXml.push(`<row r="${spacerRow1}" ht="6" customHeight="1"/>`);

  const statHeaderRow1 = endStudentRow + 2;
  const statHeaderRow2 = endStudentRow + 3;
  const statValuesRow = endStudentRow + 4;
  const spacerSignRow = endStudentRow + 5;
  const signRow = endStudentRow + 6;

  // CUADRO ESTADÍSTICO AUTOMÁTICO AL CALCE (37 columnas: A..AK)
  {
    const c1 = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      let val = '';
      if (c === 1) val = 'EXISTENCIA (ACTIVOS)';
      if (c === 7) val = 'ALUMNOS REGULARES (APROBADOS >= 6)';
      if (c === 15) val = 'ALUMNOS IRREGULARES (REPROBADOS < 6)';
      if (c === 23) val = 'PROMEDIO DE APROVECHAMIENTO';
      if (c === 30) val = '% DE APROBACIÓN';
      c1.push(buildCell(c, statHeaderRow1, { value: val, style: 11 }));
    }
    mergeCells.push(
      `A${statHeaderRow1}:F${statHeaderRow1}`,
      `G${statHeaderRow1}:N${statHeaderRow1}`,
      `O${statHeaderRow1}:V${statHeaderRow1}`,
      `W${statHeaderRow1}:AC${statHeaderRow1}`,
      `AD${statHeaderRow1}:AK${statHeaderRow1}`
    );
    sheetRowsXml.push(`<row r="${statHeaderRow1}" ht="16" customHeight="1">${c1.join('')}</row>`);

    const c2 = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      let val = '';
      if (c === 1) val = 'HOMBRES';
      if (c === 3) val = 'MUJERES';
      if (c === 5) val = 'TOTAL';
      if (c === 7) val = 'HOMBRES';
      if (c === 10) val = 'MUJERES';
      if (c === 13) val = 'TOTAL';
      if (c === 15) val = 'HOMBRES';
      if (c === 18) val = 'MUJERES';
      if (c === 21) val = 'TOTAL';
      if (c === 23) val = '1 DÉCIMA (SIN TRUNCAR)';
      if (c === 30) val = 'PORCENTAJE';
      c2.push(buildCell(c, statHeaderRow2, { value: val, style: 11 }));
    }
    mergeCells.push(
      `A${statHeaderRow2}:B${statHeaderRow2}`,
      `C${statHeaderRow2}:D${statHeaderRow2}`,
      `E${statHeaderRow2}:F${statHeaderRow2}`,
      `G${statHeaderRow2}:I${statHeaderRow2}`,
      `J${statHeaderRow2}:L${statHeaderRow2}`,
      `M${statHeaderRow2}:N${statHeaderRow2}`,
      `O${statHeaderRow2}:Q${statHeaderRow2}`,
      `R${statHeaderRow2}:T${statHeaderRow2}`,
      `U${statHeaderRow2}:V${statHeaderRow2}`,
      `W${statHeaderRow2}:AC${statHeaderRow2}`,
      `AD${statHeaderRow2}:AK${statHeaderRow2}`
    );
    sheetRowsXml.push(`<row r="${statHeaderRow2}" ht="15" customHeight="1">${c2.join('')}</row>`);

    const cRange = `$C$${startStudentRow}:$C$${endStudentRow}`;
    const ajRange = `$AJ$${startStudentRow}:$AJ$${endStudentRow}`;

    const cv = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      if (c === 1) {
        cv.push(buildCell(c, statValuesRow, { value: existenciaH, type: 'n', style: 12 }));
      } else if (c === 3) {
        cv.push(buildCell(c, statValuesRow, { value: existenciaM, type: 'n', style: 12 }));
      } else if (c === 5) {
        cv.push(buildCell(c, statValuesRow, { value: existenciaT, type: 'n', style: 12 }));
      } else if (c === 7) {
        cv.push(buildCell(c, statValuesRow, { formula: `COUNTIFS(${cRange},"H",${ajRange},">=6")`, style: 12 }));
      } else if (c === 10) {
        cv.push(buildCell(c, statValuesRow, { formula: `COUNTIFS(${cRange},"M",${ajRange},">=6")`, style: 12 }));
      } else if (c === 13) {
        cv.push(buildCell(c, statValuesRow, { formula: `G${statValuesRow}+J${statValuesRow}`, style: 12 }));
      } else if (c === 15) {
        cv.push(buildCell(c, statValuesRow, { formula: `COUNTIFS(${cRange},"H",${ajRange},"<6",${ajRange},">0")`, style: 12 }));
      } else if (c === 18) {
        cv.push(buildCell(c, statValuesRow, { formula: `COUNTIFS(${cRange},"M",${ajRange},"<6",${ajRange},">0")`, style: 12 }));
      } else if (c === 21) {
        cv.push(buildCell(c, statValuesRow, { formula: `O${statValuesRow}+R${statValuesRow}`, style: 12 }));
      } else if (c === 23) {
        cv.push(buildCell(c, statValuesRow, { formula: `IF(COUNT(${ajRange})>0,TRUNC(AVERAGE(${ajRange}),1),"")`, style: 12 }));
      } else if (c === 30) {
        cv.push(buildCell(c, statValuesRow, { formula: `IF(COUNT(${ajRange})>0,TRUNC((M${statValuesRow}/COUNT(${ajRange}))*100,1),"")`, style: 12 }));
      } else {
        cv.push(buildCell(c, statValuesRow, { value: '', style: 12 }));
      }
    }
    mergeCells.push(
      `A${statValuesRow}:B${statValuesRow}`,
      `C${statValuesRow}:D${statValuesRow}`,
      `E${statValuesRow}:F${statValuesRow}`,
      `G${statValuesRow}:I${statValuesRow}`,
      `J${statValuesRow}:L${statValuesRow}`,
      `M${statValuesRow}:N${statValuesRow}`,
      `O${statValuesRow}:Q${statValuesRow}`,
      `R${statValuesRow}:T${statValuesRow}`,
      `U${statValuesRow}:V${statValuesRow}`,
      `W${statValuesRow}:AC${statValuesRow}`,
      `AD${statValuesRow}:AK${statValuesRow}`
    );
    sheetRowsXml.push(`<row r="${statValuesRow}" ht="19" customHeight="1">${cv.join('')}</row>`);
  }

  // ESPACIO PARA FIRMAS Y FILA DE FIRMAS
  sheetRowsXml.push(`<row r="${spacerSignRow}" ht="22" customHeight="1"/>`);
  {
    const cs = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      let val = '';
      let st = 0;
      if (c >= 2 && c <= 11) {
        st = 13;
        if (c === 2) val = `FIRMA DEL DOCENTE: ${docente ? docente.toUpperCase() : '___________________________'}`;
      } else if (c >= 14 && c <= 25) {
        st = 13;
        if (c === 14) val = `VO. BO. COORDINACIÓN ACADÉMICA: ${coordinadorNombre ? coordinadorNombre.toUpperCase() : '___________________________'}`;
      } else if (c >= 28 && c <= 37) {
        st = 13;
        if (c === 28) val = 'DIRECTOR DEL PLANTEL: PROF. JUAN CARLOS TABOADA BARAJAS';
      }
      cs.push(buildCell(c, signRow, { value: val, style: st }));
    }
    mergeCells.push(
      `B${signRow}:K${signRow}`,
      `N${signRow}:Y${signRow}`,
      `AB${signRow}:AK${signRow}`
    );
    sheetRowsXml.push(`<row r="${signRow}" ht="18" customHeight="1">${cs.join('')}</row>`);
  }

  // Definición de anchos de columna (<cols>) calibrados a proporción Carta Horizontal (11" x 8.5")
  const colsXml = [
    `<col min="1" max="1" width="3.2" customWidth="1"/>`,    // A: N°
    `<col min="2" max="2" width="30.5" customWidth="1"/>`,   // B: Nombre del Alumno(a)
    `<col min="3" max="3" width="2.8" customWidth="1"/>`,    // C: Sexo (H/M)
    `<col min="4" max="23" width="3.15" customWidth="1"/>`,  // D..W: 20 Celdas de clase
    `<col min="24" max="24" width="4.8" customWidth="1"/>`,  // X: Suma Días
    `<col min="25" max="25" width="5.0" customWidth="1"/>`,  // Y: Prom Clases
    `<col min="26" max="26" width="3.5" customWidth="1"/>`,  // Z: Faltas
    `<col min="27" max="32" width="3.35" customWidth="1"/>`, // AA..AF: T1..T6
    `<col min="33" max="35" width="4.2" customWidth="1"/>`,  // AG..AI: Exam, Part, Otro
    `<col min="36" max="36" width="5.2" customWidth="1"/>`,  // AJ: Calif. Trim.
    `<col min="37" max="37" width="9.8" customWidth="1"/>`   // AK: Observaciones
  ].join('');

  const mergeCellsXml = `<mergeCells count="${mergeCells.length}">${mergeCells.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`;

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr>
    <pageSetUpPr fitToPage="1"/>
  </sheetPr>
  <dimension ref="A1:AK${signRow}"/>
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane xSplit="2" ySplit="6" topLeftCell="C7" activePane="bottomRight" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${colsXml}</cols>
  <sheetData>${sheetRowsXml.join('')}</sheetData>
  ${mergeCellsXml}
  <printOptions horizontalCentered="1" verticalCentered="1"/>
  <pageMargins left="0.18" right="0.18" top="0.18" bottom="0.18" header="0.08" footer="0.08"/>
  <pageSetup paperSize="1" orientation="landscape" scale="100" fitToWidth="1" fitToHeight="1"/>
</worksheet>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="8">
    <font><sz val="9.5"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Arial"/></font>
    <font><b/><sz val="9.5"/><color rgb="FF0F172A"/><name val="Arial"/></font>
    <font><b/><sz val="8.5"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
    <font><b/><sz val="8"/><color rgb="FF065F46"/><name val="Arial"/></font>
    <font><b/><sz val="9.5"/><color rgb="FF0F172A"/><name val="Arial"/></font>
    <font><i/><sz val="8.5"/><color rgb="FF475569"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><color rgb="FF1E1B4B"/><name val="Arial"/></font>
  </fonts>
  <fills count="8">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E293B"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFECFDF5"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEEF2FF"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill>
  </fills>
  <borders count="4">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FF1E293B"/></left>
      <right style="thin"><color rgb="FF1E293B"/></right>
      <top style="thin"><color rgb="FF1E293B"/></top>
      <bottom style="thin"><color rgb="FF1E293B"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left/><right/><top/>
      <bottom style="medium"><color rgb="FF0F172A"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left/><right/>
      <top style="thin"><color rgb="FF0F172A"/></top>
      <bottom/><diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="15">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="6" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="7" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="7" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="0" borderId="3" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="6" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

  const sheetTitle = `Lista_${cleanGrupo}`;
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${sheetTitle}" sheetId="1" r:id="rId1"/>
  </sheets>
  <definedNames>
    <definedName name="_xlnm.Print_Area" localSheetId="0">'${sheetTitle}'!$A$1:$AK$${signRow}</definedName>
  </definedNames>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.folder('_rels').file('.rels', rootRelsXml);
  const xl = zip.folder('xl');
  xl.file('workbook.xml', workbookXml);
  xl.file('styles.xml', stylesXml);
  xl.folder('_rels').file('workbook.xml.rels', workbookRelsXml);
  xl.folder('worksheets').file('sheet1.xml', sheetXml);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const cleanAsig = asignatura
    ? `_${asignatura.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_').replace(/_+/g, '_')}`
    : '';
  const fileName = `Lista_Asistencia_y_Evaluacion_${grado.replace(/\s+/g, '')}_${cleanGrupo}${cleanAsig}.xlsx`;
  saveAs(blob, fileName);
};

/**
 * Lee un archivo Excel (.xlsx) de Lista de Asistencia y Evaluación entregado por el docente
 * y extrae automáticamente las fechas/contenidos, las 20 celdas diarias, faltas, tareas,
 * examen, participación, calificación trimestral (redondeada a entero) y observaciones.
 * Soporta tanto el nuevo formato de 37 columnas (sin Matrícula) como el anterior de 38 columnas.
 */
export const importarListaAsistenciaEditableExcel = async (file, alumnosGrupo = []) => {
  const zip = await JSZip.loadAsync(file);

  // Cargar sharedStrings.xml si el archivo fue guardado por Microsoft Excel / Google Sheets
  const sharedStrings = [];
  const sharedStringsFile = zip.file('xl/sharedStrings.xml');
  if (sharedStringsFile) {
    const ssXml = await sharedStringsFile.async('string');
    const parser = new DOMParser();
    const ssDoc = parser.parseFromString(ssXml, 'application/xml');
    const siNodes = ssDoc.getElementsByTagName('si');
    for (let i = 0; i < siNodes.length; i++) {
      const tNodes = siNodes[i].getElementsByTagName('t');
      let text = '';
      for (let j = 0; j < tNodes.length; j++) {
        text += tNodes[j].textContent || '';
      }
      sharedStrings.push(text);
    }
  }

  const sheetFile = zip.file('xl/worksheets/sheet1.xml');
  if (!sheetFile) {
    throw new Error('El archivo Excel no contiene una hoja válida.');
  }

  const sheetXml = await sheetFile.async('string');
  const parser = new DOMParser();
  const doc = parser.parseFromString(sheetXml, 'application/xml');
  const rowNodes = doc.getElementsByTagName('row');

  // Mapa de filas -> { colLetter: valor }
  const rowsMap = {};
  for (let i = 0; i < rowNodes.length; i++) {
    const rowEl = rowNodes[i];
    const rAttr = parseInt(rowEl.getAttribute('r'), 10);
    if (isNaN(rAttr)) continue;
    rowsMap[rAttr] = {};

    const cNodes = rowEl.getElementsByTagName('c');
    for (let j = 0; j < cNodes.length; j++) {
      const cEl = cNodes[j];
      const ref = cEl.getAttribute('r') || '';
      const colMatch = ref.match(/^([A-Z]+)/);
      if (!colMatch) continue;
      const colLetter = colMatch[1];
      const tAttr = cEl.getAttribute('t');

      let val = '';
      if (tAttr === 'inlineStr') {
        const tNode = cEl.getElementsByTagName('t')[0];
        val = tNode ? (tNode.textContent || '') : '';
      } else if (tAttr === 's') {
        const vNode = cEl.getElementsByTagName('v')[0];
        const idx = vNode ? parseInt(vNode.textContent, 10) : -1;
        val = idx >= 0 && sharedStrings[idx] !== undefined ? sharedStrings[idx] : '';
      } else {
        const vNode = cEl.getElementsByTagName('v')[0];
        val = vNode ? (vNode.textContent || '') : '';
      }
      rowsMap[rAttr][colLetter] = val.trim();
    }
  }

  // Detectar si el archivo tiene columna MATRÍCULA en B (formato anterior de 38 cols) o no (nuevo formato de 37 cols)
  const hasMatriculaCol =
    (rowsMap[4]?.B || '').toUpperCase().includes('MATR') ||
    (rowsMap[6]?.B || '').toUpperCase().includes('MATR');

  const dayOffset = hasMatriculaCol ? 4 : 3;      // D..W (offset 3) o E..X (offset 4)
  const tareaOffset = hasMatriculaCol ? 27 : 26;  // AA..AF (offset 26) o AB..AG (offset 27)
  const nameCol = hasMatriculaCol ? 'C' : 'B';
  const faltasCol = hasMatriculaCol ? 'AA' : 'Z';
  const examCol = hasMatriculaCol ? 'AH' : 'AG';
  const partCol = hasMatriculaCol ? 'AI' : 'AH';
  const otroCol = hasMatriculaCol ? 'AJ' : 'AI';
  const califCol = hasMatriculaCol ? 'AK' : 'AJ';
  const obsCol = hasMatriculaCol ? 'AL' : 'AK';

  // Extraer nombre del docente si lo escribió en A2
  let docenteDetectado = '';
  const a2 = rowsMap[2]?.A || '';
  if (a2.toUpperCase().startsWith('DOCENTE:')) {
    const rawDoc = a2.substring(8).trim();
    if (rawDoc && !rawDoc.includes('ESCRIBA SU NOMBRE')) {
      docenteDetectado = rawDoc;
    }
  }

  // Extraer fila 5: CONTENIDOS / FECHA
  const contenidosFecha = {};
  if (rowsMap[5]) {
    for (let d = 1; d <= 20; d++) {
      const colL = colIndexToLetter(dayOffset + d);
      if (rowsMap[5][colL]) {
        contenidosFecha[`d${d}`] = rowsMap[5][colL];
      }
    }
    for (let t = 1; t <= 6; t++) {
      const colL = colIndexToLetter(tareaOffset + t);
      if (rowsMap[5][colL]) {
        contenidosFecha[`t${t}`] = rowsMap[5][colL];
      }
    }
  }

  // Pre-normalizar nombres de alumnos del grupo para emparejamiento exacto y seguro
  const alumnosConNombreNorm = alumnosGrupo.map(s => ({
    student: s,
    fullNorm: normalizeNameForMatch(`${s.apellidoPaterno || ''} ${s.apellidoMaterno || ''} ${s.nombres || ''}`),
    apPatNorm: normalizeNameForMatch(s.apellidoPaterno || '')
  }));

  // Emparejar filas de alumnos (desde la fila 7)
  const importedEval = {};
  let matchedCount = 0;

  Object.keys(rowsMap).forEach(rKey => {
    const rNum = parseInt(rKey, 10);
    if (rNum < 7) return;
    const rowCells = rowsMap[rNum];
    if (!rowCells) return;

    const numListaCell = parseInt(rowCells.A, 10);
    const nombreExcelNorm = normalizeNameForMatch(rowCells[nameCol] || '');
    if (!nombreExcelNorm && isNaN(numListaCell)) return;

    let student = null;

    // 1. Si es formato antiguo con matrícula en col B, intentar por matrícula
    if (hasMatriculaCol && rowCells.B) {
      const matCell = rowCells.B.toUpperCase().trim();
      student = alumnosGrupo.find(s => (s.matricula || '').toUpperCase().trim() === matCell) || null;
    }

    // 2. Emparejar por nombre completo normalizado
    if (!student && nombreExcelNorm) {
      const exactMatch = alumnosConNombreNorm.find(item => item.fullNorm === nombreExcelNorm);
      if (exactMatch) {
        student = exactMatch.student;
      }
    }

    // 3. Emparejar por Número de Lista + coincidencia de apellido paterno
    if (!student && !isNaN(numListaCell) && numListaCell >= 1 && numListaCell <= alumnosConNombreNorm.length) {
      const candidateItem = alumnosConNombreNorm[numListaCell - 1];
      if (candidateItem && nombreExcelNorm) {
        if (!candidateItem.apPatNorm || nombreExcelNorm.includes(candidateItem.apPatNorm)) {
          student = candidateItem.student;
        }
      }
    }

    if (!student || (student.status || '').toLowerCase() === 'baja') return;

    const dias = {};
    let sumaDias = 0;
    let countDias = 0;
    for (let d = 1; d <= 20; d++) {
      const colL = colIndexToLetter(dayOffset + d);
      const valD = rowCells[colL] ?? '';
      if (valD !== '') {
        dias[`d${d}`] = valD;
        const numD = parseFloat(valD);
        if (!isNaN(numD)) {
          sumaDias += numD;
          countDias++;
        }
      }
    }

    const faltas = rowCells[faltasCol] ?? '';
    const tareas = {};
    const evalNums = [];
    for (let t = 1; t <= 6; t++) {
      const colL = colIndexToLetter(tareaOffset + t);
      const valT = rowCells[colL] ?? '';
      tareas[`t${t}`] = valT;
      if (valT !== '' && !isNaN(parseFloat(valT))) evalNums.push(parseFloat(valT));
    }

    const examen = rowCells[examCol] ?? '';
    const participacion = rowCells[partCol] ?? '';
    const extraEval = rowCells[otroCol] ?? '';
    if (examen !== '' && !isNaN(parseFloat(examen))) evalNums.push(parseFloat(examen));
    if (participacion !== '' && !isNaN(parseFloat(participacion))) evalNums.push(parseFloat(participacion));
    if (extraEval !== '' && !isNaN(parseFloat(extraEval))) evalNums.push(parseFloat(extraEval));

    let califFinalStr = '';
    const rawCalif = rowCells[califCol] ?? '';
    if (rawCalif !== '' && !isNaN(parseFloat(rawCalif))) {
      califFinalStr = String(Math.round(parseFloat(rawCalif)));
    } else if (evalNums.length > 0) {
      const avg = evalNums.reduce((a, b) => a + b, 0) / evalNums.length;
      califFinalStr = String(Math.round(avg));
    } else if (countDias > 0) {
      const totalCeldasClase = Math.max(
        Object.keys(contenidosFecha).filter(k => k.startsWith('d') && contenidosFecha[k]).length,
        countDias
      );
      califFinalStr = String(Math.round(sumaDias / totalCeldasClase));
    }

    const observaciones = rowCells[obsCol] ?? '';

    importedEval[student.id] = {
      dias,
      faltas,
      ...tareas,
      examen,
      participacion,
      extraEval,
      calificacion: califFinalStr,
      observaciones
    };
    matchedCount++;
  });

  return {
    matchedCount,
    docenteDetectado,
    contenidosFecha,
    importedEval
  };
};

// Genera styles.xml específico para Cuadros de Concentración por Asignatura (19 estilos indexados 0..18)
const buildCuadroMateriaStylesXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="0.0"/>
  </numFmts>
  <fonts count="8">
    <font><sz val="9.5"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="9.5"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="8.5"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="9"/><color rgb="FF312E81"/><name val="Calibri"/></font>
    <font><b/><sz val="9"/><color rgb="FF78350F"/><name val="Calibri"/></font>
    <font><b/><sz val="9"/><color rgb="FFB91C1C"/><name val="Calibri"/></font>
    <font><sz val="8"/><color rgb="FF475569"/><name val="Calibri"/></font>
  </fonts>
  <fills count="8">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E293B"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEEF2FF"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFBEB"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF2F2"/></patternFill></fill>
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FF94A3B8"/></left>
      <right style="thin"><color rgb="FF94A3B8"/></right>
      <top style="thin"><color rgb="FF94A3B8"/></top>
      <bottom style="thin"><color rgb="FF94A3B8"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left/><right/>
      <top style="thin"><color rgb="FF0F172A"/></top>
      <bottom/><diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="19">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="5" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="6" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="6" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="6" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const sanitizeExcelSheetName = (rawName, usedNamesSet) => {
  let clean = String(rawName || 'Asignatura')
    .replace(/[\\/?*[\]:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) clean = 'Asignatura';
  let candidate = clean.slice(0, 31);
  let suffix = 2;
  while (usedNamesSet.has(candidate.toLowerCase())) {
    const suffixStr = ` (${suffix})`;
    candidate = `${clean.slice(0, 31 - suffixStr.length)}${suffixStr}`;
    suffix++;
  }
  usedNamesSet.add(candidate.toLowerCase());
  return candidate;
};

/**
 * Exporta a archivo Excel (.xlsx) nativo con JSZip uno o múltiples Cuadros de Concentración por Asignatura
 * (1 hoja por disciplina), incluyendo Ordinario T1-T3, Recuperación Trimestral, Faltas, Cierre Anual, E.E.R. 1°-3° y Estadística.
 */
export const descargarCuadroMateriaExcel = async ({
  students = [],
  grado = '1er Grado',
  grupo = 'A',
  materiasList = [],
  trimestre = 't1',
  cicloEscolar = '2026 - 2027',
  coordinadorNombre = '',
  directorNombre = 'Prof. Juan Carlos Taboada Barajas',
  evalData = null,
  onlyRecovery = false
}) => {
  if (!students || students.length === 0 || !materiasList || materiasList.length === 0) return;

  const cleanGrupo = String(grupo).replace(/["']/g, '').trim().toUpperCase();
  const baseSorted = sortAttendanceListStudents(students, grado, grupo);
  const firstActive = baseSorted.find(s => (s.status || '').toLowerCase() !== 'baja') || baseSorted[0] || {};
  const turno = ['G', 'H', 'I', 'J', 'K', 'L'].includes(cleanGrupo)
    ? 'Vespertino'
    : (firstActive.turno || 'Matutino');
  const taller = TALLER_POR_GRUPO[cleanGrupo] || firstActive.taller || 'Tecnología';
  const coordFinal =
    coordinadorNombre ||
    (turno === 'Matutino' ? 'Profra. Lucila Rodríguez Martínez' : 'Profr. José Barrera Vázquez');

  const trimLabels = { t1: 'I (Primero)', t2: 'II (Segundo)', t3: 'III (Tercero)' };
  const TOTAL_COLS = 19; // A..S

  const buildCell = (colIdx, rowIdx, { value = '', type = 's', style = 0, formula = null }) => {
    const ref = `${colIndexToLetter(colIdx)}${rowIdx}`;
    if (formula !== null) {
      const cachedVal = value !== '' && value !== null && value !== undefined ? `<v>${escapeXml(value)}</v>` : '';
      return `<c r="${ref}" s="${style}"><f>${escapeXml(formula)}</f>${cachedVal}</c>`;
    }
    if (value === '' || value === null || value === undefined) {
      return `<c r="${ref}" s="${style}"/>`;
    }
    if (type === 'n' && !isNaN(Number(value))) {
      return `<c r="${ref}" s="${style}" t="n"><v>${Number(value)}</v></c>`;
    }
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
  };

  const getTrimDataForExcel = (student, mId, tKey, localEvalMap) => {
    if (student.isEmpty) {
      return { ordNum: null, recNum: null, faltNum: null, efectiva: null, fueRecuperado: false };
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
    const faltParsed = parseInt(faltRaw, 10);
    const faltNum = !isNaN(faltParsed) && faltParsed >= 0 ? faltParsed : null;

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

    return { ordNum, recNum, faltNum, efectiva, fueRecuperado };
  };

  const getEERDataForExcel = (student, mId) => {
    if (student.isEmpty || !student.regularizacion?.[mId]) {
      return { n1: null, n2: null, n3: null, eerFinal: null, hasAny: false };
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

    return { n1, n2, n3, eerFinal, hasAny: n1 !== null || n2 !== null || n3 !== null || mainVal !== null };
  };

  const usedSheetNames = new Set();
  const sheetsData = [];

  materiasList.forEach((mItem, sheetIdx) => {
    const mId = mItem.id;
    const asigTitle = mId?.startsWith('tecnologia') && !String(mItem.name || '').includes(taller)
      ? `${mItem.name} (${taller})`
      : (mItem.name || mId || 'Asignatura');
    const localEval = mItem.evalData || (!Array.isArray(materiasList) || materiasList.length === 1 ? evalData : null) || {};

    let docenteFinal = mItem.docente || '';
    if (!docenteFinal) {
      for (const st of baseSorted) {
        const dName =
          st.evaluacionDetalle?.[trimestre]?.[mId]?.docente ||
          st.evaluacionDetalle?.t1?.[mId]?.docente ||
          st.evaluacionDetalle?.t2?.[mId]?.docente ||
          st.evaluacionDetalle?.t3?.[mId]?.docente;
        if (dName) {
          docenteFinal = dName;
          break;
        }
      }
    }

    // Asignar número oficial de lista antes de filtrar
    const indexedStudents = baseSorted.map((s, idx) => ({ ...s, numeroLista: idx + 1 }));

    // Estadística del grupo completo en esta materia
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

    indexedStudents.forEach(s => {
      if ((s.status || '').toLowerCase() === 'baja') return;
      const gen = getStudentGender(s);
      if (gen === 'M') existenciaM++;
      else existenciaH++;

      const td1 = getTrimDataForExcel(s, mId, 't1', localEval);
      const td2 = getTrimDataForExcel(s, mId, 't2', localEval);
      const td3 = getTrimDataForExcel(s, mId, 't3', localEval);
      const eer = getEERDataForExcel(s, mId);

      if (td1.fueRecuperado || td2.fueRecuperado || td3.fueRecuperado) recuperadosTrimCount++;
      if (eer.eerFinal !== null && eer.eerFinal >= 6) acreditadosEERCount++;

      const valsTrim = [td1.efectiva, td2.efectiva, td3.efectiva].filter(v => v !== null);
      const promNum = valsTrim.length > 0 ? Math.round(valsTrim.reduce((a, b) => a + b, 0) / valsTrim.length) : null;
      const califEst = eer.eerFinal !== null ? eer.eerFinal : promNum;

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
    const promAprov = evaluadosCount > 0 ? truncateTo1Dec(sumEvaluados / evaluadosCount, '') : '';
    const pctAprob = evaluadosCount > 0 ? `${truncateTo1Dec((regT / evaluadosCount) * 100, '')} %` : '';

    // Filtrado si onlyRecovery === true
    let rowsToRender = indexedStudents;
    if (onlyRecovery) {
      rowsToRender = indexedStudents.filter(s => {
        if ((s.status || '').toLowerCase() === 'baja') return false;
        const td1 = getTrimDataForExcel(s, mId, 't1', localEval);
        const td2 = getTrimDataForExcel(s, mId, 't2', localEval);
        const td3 = getTrimDataForExcel(s, mId, 't3', localEval);
        const eer = getEERDataForExcel(s, mId);
        const vals = [td1.efectiva, td2.efectiva, td3.efectiva].filter(v => v !== null);
        const promNum = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
        const califDef = eer.eerFinal !== null ? eer.eerFinal : promNum;

        return (
          (td1.ordNum !== null && td1.ordNum < 6) ||
          (td2.ordNum !== null && td2.ordNum < 6) ||
          (td3.ordNum !== null && td3.ordNum < 6) ||
          td1.recNum !== null ||
          td2.recNum !== null ||
          td3.recNum !== null ||
          eer.hasAny ||
          (califDef !== null && califDef < 6)
        );
      });
    } else if (rowsToRender.length < 27) {
      const padded = [...rowsToRender];
      for (let i = padded.length; i < 27; i++) {
        padded.push({ id: `empty_${i}`, isEmpty: true, numeroLista: i + 1 });
      }
      rowsToRender = padded;
    }

    const sheetRowsXml = [];
    const mergeCells = [];

    // Fila 1: Institucional
    {
      const c1 = [];
      for (let c = 1; c <= TOTAL_COLS; c++) {
        let val = '';
        let st = 1;
        if (c === 1) val = 'ESCUELA SECUNDARIA TÉCNICA N° 68 "RENACIMIENTO" — C.C.T. 12DST0077B';
        if (c === 7) val = 'CUADRO DE CONCENTRACIÓN Y RECUPERACIÓN POR DISCIPLINA';
        if (c >= 15) {
          st = 2;
          if (c === 15) val = `CICLO: ${cicloEscolar} | CORTE: ${trimLabels[trimestre] || trimestre.toUpperCase()}`;
        }
        c1.push(buildCell(c, 1, { value: val, style: st }));
      }
      mergeCells.push('A1:F1', 'G1:N1', 'O1:S1');
      sheetRowsXml.push(`<row r="1" ht="22" customHeight="1">${c1.join('')}</row>`);
    }

    // Fila 2: Docente, Asignatura, Grado/Grupo/Taller
    {
      const c2 = [];
      for (let c = 1; c <= TOTAL_COLS; c++) {
        let val = '';
        if (c === 1) val = `DOCENTE: ${docenteFinal ? docenteFinal.toUpperCase() : '(SIN ASIGNAR)'}`;
        if (c === 8) val = `DISCIPLINA: ${asigTitle.toUpperCase()}`;
        if (c === 15) val = `GRADO: ${grado.toUpperCase()}  |  GRUPO: "${cleanGrupo}"  |  TALLER: ${taller.toUpperCase()}`;
        c2.push(buildCell(c, 2, { value: val, style: 3 }));
      }
      mergeCells.push('A2:G2', 'H2:N2', 'O2:S2');
      sheetRowsXml.push(`<row r="2" ht="19" customHeight="1">${c2.join('')}</row>`);
    }

    // Fila 3: Turno y modalidad (Todos vs Solo Recuperación)
    {
      const c3 = [];
      for (let c = 1; c <= TOTAL_COLS; c++) {
        let val = '';
        let st = 3;
        if (c === 1) val = `TURNO: ${turno.toUpperCase()}  |  ESCALA OFICIAL SEP (5 A 10)`;
        if (c >= 11) {
          st = onlyRecovery ? 6 : 5;
          if (c === 11) {
            val = onlyRecovery
              ? 'FILTRO ACTIVO: SOLO ALUMNOS EN RECUPERACIÓN TRIMESTRAL O E.E.R.'
              : 'INCLUYE ORDINARIO (Ord.), RECUPERACIÓN POR PERIODO (Rec.) Y EXTRAORDINARIOS (E.E.R.)';
          }
        }
        c3.push(buildCell(c, 3, { value: val, style: st }));
      }
      mergeCells.push('A3:J3', 'K3:S3');
      sheetRowsXml.push(`<row r="3" ht="17" customHeight="1">${c3.join('')}</row>`);
    }

    // Fila 4: Encabezado agrupado de tabla
    {
      const c4 = [];
      for (let c = 1; c <= TOTAL_COLS; c++) {
        let val = '';
        let st = 4;
        if (c === 1) val = 'N°';
        if (c === 2) val = 'NOMBRE DEL ALUMNO(A)';
        if (c === 3) val = 'S';
        if (c === 4) val = 'TRIMESTRE I';
        if (c === 7) val = 'TRIMESTRE II';
        if (c === 10) val = 'TRIMESTRE III';
        if (c === 13) val = 'CIERRE ANUAL';
        if (c >= 15 && c <= 17) {
          st = 6;
          if (c === 15) val = 'EXTRAORD. (E.E.R.)';
        }
        if (c === 18) val = 'CALIF. DEF.';
        if (c === 19) val = 'SITUACIÓN / OBSERVACIONES';
        c4.push(buildCell(c, 4, { value: val, style: st }));
      }
      mergeCells.push(
        'A4:A5',
        'B4:B5',
        'C4:C5',
        'D4:F4',
        'G4:I4',
        'J4:L4',
        'M4:N4',
        'O4:Q4',
        'R4:R5',
        'S4:S5'
      );
      sheetRowsXml.push(`<row r="4" ht="19" customHeight="1">${c4.join('')}</row>`);
    }

    // Fila 5: Subencabezados de tabla
    {
      const subHeaders = {
        4: { v: 'Ord.', s: 4 }, 5: { v: 'Rec.', s: 5 }, 6: { v: 'Falt.', s: 4 },
        7: { v: 'Ord.', s: 4 }, 8: { v: 'Rec.', s: 5 }, 9: { v: 'Falt.', s: 4 },
        10: { v: 'Ord.', s: 4 }, 11: { v: 'Rec.', s: 5 }, 12: { v: 'Falt.', s: 4 },
        13: { v: 'T.F.', s: 4 }, 14: { v: 'Prom.', s: 4 },
        15: { v: '1° Op.', s: 6 }, 16: { v: '2° Op.', s: 6 }, 17: { v: '3° Op.', s: 6 }
      };
      const c5 = [];
      for (let c = 1; c <= TOTAL_COLS; c++) {
        const sub = subHeaders[c];
        c5.push(buildCell(c, 5, { value: sub ? sub.v : '', style: sub ? sub.s : 4 }));
      }
      sheetRowsXml.push(`<row r="5" ht="17" customHeight="1">${c5.join('')}</row>`);
    }

    // Filas de alumnos a partir de la fila 6
    let curRow = 6;
    if (rowsToRender.length === 0) {
      const ce = [];
      for (let c = 1; c <= TOTAL_COLS; c++) {
        ce.push(
          buildCell(c, curRow, {
            value: c === 1 ? 'SIN ALUMNOS REPROBADOS, EN RECUPERACIÓN NI EN E.E.R. EN ESTA ASIGNATURA.' : '',
            style: 16
          })
        );
      }
      mergeCells.push(`A${curRow}:S${curRow}`);
      sheetRowsXml.push(`<row r="${curRow}" ht="22" customHeight="1">${ce.join('')}</row>`);
      curRow++;
    } else {
      rowsToRender.forEach((student) => {
        const r = curRow;
        const isEmpty = Boolean(student.isEmpty);
        const isBaja = !isEmpty && (student.status || '').toLowerCase() === 'baja';
        const isAlta = !isEmpty && !isBaja && student.tipoIngreso === 'Alta';
        const rawName = isEmpty
          ? ''
          : `${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''} ${student.nombres || ''}`.replace(/\s+/g, ' ').trim();
        const fullName = rawName ? quitarAcentosNombre(rawName).toUpperCase() : '';
        const gen = isEmpty ? '' : getStudentGender(student);

        const rowCells = [];
        rowCells.push(buildCell(1, r, { value: student.numeroLista, type: 'n', style: 7 }));
        rowCells.push(buildCell(2, r, { value: fullName, style: isBaja ? 13 : 8 }));
        rowCells.push(buildCell(3, r, { value: gen, style: isBaja ? 13 : 7 }));

        if (isBaja) {
          for (let c = 4; c <= 18; c++) {
            rowCells.push(
              buildCell(c, r, {
                value: c === 4 ? `— B A J A ${student.fechaBaja ? `(${student.fechaBaja})` : ''} —` : '',
                style: 13
              })
            );
          }
          mergeCells.push(`D${r}:R${r}`);
          rowCells.push(buildCell(19, r, { value: `BAJA ${student.fechaBaja || ''}`.trim(), style: 15 }));
        } else if (isEmpty) {
          for (let c = 4; c <= 19; c++) {
            const stEmpty = [5, 8, 11].includes(c) ? 9 : [15, 16, 17].includes(c) ? 10 : c === 18 || c === 14 ? 11 : 7;
            rowCells.push(buildCell(c, r, { value: '', style: stEmpty }));
          }
        } else {
          const t1 = getTrimDataForExcel(student, mId, 't1', localEval);
          const t2 = getTrimDataForExcel(student, mId, 't2', localEval);
          const t3 = getTrimDataForExcel(student, mId, 't3', localEval);
          const eer = getEERDataForExcel(student, mId);

          const faltVals = [t1.faltNum, t2.faltNum, t3.faltNum].filter(v => v !== null);
          const totalFaltas = faltVals.length > 0 ? faltVals.reduce((a, b) => a + b, 0) : '';

          const valsEfectivos = [t1.efectiva, t2.efectiva, t3.efectiva].filter(v => v !== null);
          const promAnualNum =
            valsEfectivos.length > 0
              ? Math.round(valsEfectivos.reduce((a, b) => a + b, 0) / valsEfectivos.length)
              : '';

          const califDefNum = eer.eerFinal !== null ? eer.eerFinal : promAnualNum;

          // T1
          rowCells.push(buildCell(4, r, { value: t1.ordNum ?? '', type: 'n', style: t1.ordNum !== null && t1.ordNum < 6 ? 12 : 7 }));
          rowCells.push(buildCell(5, r, { value: t1.recNum ?? '', type: 'n', style: 9 }));
          rowCells.push(buildCell(6, r, { value: t1.faltNum ?? '', type: 'n', style: 7 }));
          // T2
          rowCells.push(buildCell(7, r, { value: t2.ordNum ?? '', type: 'n', style: t2.ordNum !== null && t2.ordNum < 6 ? 12 : 7 }));
          rowCells.push(buildCell(8, r, { value: t2.recNum ?? '', type: 'n', style: 9 }));
          rowCells.push(buildCell(9, r, { value: t2.faltNum ?? '', type: 'n', style: 7 }));
          // T3
          rowCells.push(buildCell(10, r, { value: t3.ordNum ?? '', type: 'n', style: t3.ordNum !== null && t3.ordNum < 6 ? 12 : 7 }));
          rowCells.push(buildCell(11, r, { value: t3.recNum ?? '', type: 'n', style: 9 }));
          rowCells.push(buildCell(12, r, { value: t3.faltNum ?? '', type: 'n', style: 7 }));

          // M: T.F.
          rowCells.push(
            buildCell(13, r, {
              value: totalFaltas,
              formula: `IF(COUNT(F${r},I${r},L${r})>0,SUM(F${r},I${r},L${r}),"")`,
              style: 7
            })
          );
          // N: Prom. Anual PASEG (MAX(Ord, Rec) por trimestre -> redondeado)
          const sumRecOrdExpr = `(IF(COUNT(D${r},E${r})>0,MAX(D${r},E${r}),0)+IF(COUNT(G${r},H${r})>0,MAX(G${r},H${r}),0)+IF(COUNT(J${r},K${r})>0,MAX(J${r},K${r}),0))`;
          const cntRecOrdExpr = `(IF(COUNT(D${r},E${r})>0,1,0)+IF(COUNT(G${r},H${r})>0,1,0)+IF(COUNT(J${r},K${r})>0,1,0))`;
          rowCells.push(
            buildCell(14, r, {
              value: promAnualNum,
              formula: `IF(${cntRecOrdExpr}>0,ROUND(${sumRecOrdExpr}/${cntRecOrdExpr},0),"")`,
              style: promAnualNum !== '' && promAnualNum < 6 ? 12 : 11
            })
          );

          // O, P, Q: E.E.R. 1°, 2°, 3°
          rowCells.push(buildCell(15, r, { value: eer.n1 ?? '', type: 'n', style: eer.n1 !== null && eer.n1 < 6 ? 12 : 10 }));
          rowCells.push(buildCell(16, r, { value: eer.n2 ?? '', type: 'n', style: eer.n2 !== null && eer.n2 < 6 ? 12 : 10 }));
          rowCells.push(buildCell(17, r, { value: eer.n3 ?? '', type: 'n', style: eer.n3 !== null && eer.n3 < 6 ? 12 : 10 }));

          // R: Calificación Definitiva
          rowCells.push(
            buildCell(18, r, {
              value: califDefNum,
              formula: `IF(ISNUMBER(Q${r}),Q${r},IF(ISNUMBER(P${r}),P${r},IF(ISNUMBER(O${r}),O${r},N${r})))`,
              style: califDefNum !== '' && califDefNum < 6 ? 12 : 11
            })
          );

          // S: Situación / Observaciones
          const stEval = localEval[student.id] || {};
          const obsDocente = (stEval.observaciones || student.evaluacionDetalle?.[trimestre]?.[mId]?.observaciones || '').trim();
          const tuvoRecTrim = t1.fueRecuperado || t2.fueRecuperado || t3.fueRecuperado;
          let sitBadge = '';
          let sitRed = false;
          if (eer.eerFinal !== null) {
            if (eer.eerFinal >= 6) sitBadge = 'ACRED. E.E.R.';
            else {
              sitBadge = 'NO ACRED. EER';
              sitRed = true;
            }
          } else if (califDefNum !== '') {
            if (califDefNum >= 6) sitBadge = tuvoRecTrim ? 'RECUPERADO' : 'REGULAR';
            else {
              sitBadge = valsEfectivos.length === 3 ? 'A E.E.R.' : 'IRREGULAR';
              sitRed = true;
            }
          }
          const obsTexto = [sitBadge, isAlta ? `ALTA ${student.fechaAlta || ''}`.trim() : '', obsDocente]
            .filter(Boolean)
            .join(' · ');
          rowCells.push(buildCell(19, r, { value: obsTexto, style: sitRed ? 15 : 14 }));
        }

        sheetRowsXml.push(`<row r="${r}" ht="17.5" customHeight="1">${rowCells.join('')}</row>`);
        curRow++;
      });
    }

    // Espacio + Tabla de Estadística del Grupo
    sheetRowsXml.push(`<row r="${curRow}" ht="8" customHeight="1"/>`);
    curRow++;

    const statHdr1 = curRow;
    const statHdr2 = curRow + 1;
    const statValRow = curRow + 2;
    const noteRow = curRow + 3;
    const spacerSignRow = curRow + 4;
    const signRow = curRow + 5;

    // Stat Header 1
    {
      const sh1 = [];
      for (let c = 1; c <= TOTAL_COLS; c++) {
        let val = '';
        let st = 4;
        if (c === 1) val = 'EXISTENCIA (ACTIVOS)';
        if (c === 4) val = 'REGULARES (>= 6)';
        if (c === 7) val = 'IRREGULARES (< 6)';
        if (c === 10 || c === 11) {
          st = 5;
          if (c === 10) val = 'REC. TRIM.';
        }
        if (c === 12 || c === 13) {
          st = 6;
          if (c === 12) val = 'ACRED. EER';
        }
        if (c === 14) val = 'PROMEDIO DE APROVECHAMIENTO';
        if (c === 17) val = '% DE APROBACIÓN';
        sh1.push(buildCell(c, statHdr1, { value: val, style: st }));
      }
      mergeCells.push(
        `A${statHdr1}:C${statHdr1}`,
        `D${statHdr1}:F${statHdr1}`,
        `G${statHdr1}:I${statHdr1}`,
        `J${statHdr1}:K${statHdr1}`,
        `L${statHdr1}:M${statHdr1}`,
        `N${statHdr1}:P${statHdr2}`,
        `Q${statHdr1}:S${statHdr2}`
      );
      sheetRowsXml.push(`<row r="${statHdr1}" ht="17" customHeight="1">${sh1.join('')}</row>`);
    }

    // Stat Header 2
    {
      const labels2 = {
        1: 'H', 2: 'M', 3: 'Total',
        4: 'H', 5: 'M', 6: 'Total',
        7: 'H', 8: 'M', 9: 'Total',
        10: 'Alumnos', 12: 'Alumnos'
      };
      const sh2 = [];
      for (let c = 1; c <= TOTAL_COLS; c++) {
        const st = c === 10 || c === 11 ? 5 : c === 12 || c === 13 ? 6 : 16;
        sh2.push(buildCell(c, statHdr2, { value: labels2[c] || '', style: st }));
      }
      mergeCells.push(`J${statHdr2}:K${statHdr2}`, `L${statHdr2}:M${statHdr2}`);
      sheetRowsXml.push(`<row r="${statHdr2}" ht="15" customHeight="1">${sh2.join('')}</row>`);
    }

    // Stat Values
    {
      const vals = {
        1: existenciaH,
        2: existenciaM,
        3: existenciaT,
        4: evaluadosCount > 0 ? regH : '',
        5: evaluadosCount > 0 ? regM : '',
        6: evaluadosCount > 0 ? regT : '',
        7: evaluadosCount > 0 ? irregH : '',
        8: evaluadosCount > 0 ? irregM : '',
        9: evaluadosCount > 0 ? irregT : '',
        10: evaluadosCount > 0 ? recuperadosTrimCount : '',
        12: evaluadosCount > 0 ? acreditadosEERCount : '',
        14: promAprov,
        17: pctAprob
      };
      const sv = [];
      for (let c = 1; c <= TOTAL_COLS; c++) {
        const v = vals[c] !== undefined ? vals[c] : '';
        const isNum = typeof v === 'number';
        sv.push(buildCell(c, statValRow, { value: v, type: isNum ? 'n' : 's', style: 16 }));
      }
      mergeCells.push(
        `J${statValRow}:K${statValRow}`,
        `L${statValRow}:M${statValRow}`,
        `N${statValRow}:P${statValRow}`,
        `Q${statValRow}:S${statValRow}`
      );
      sheetRowsXml.push(`<row r="${statValRow}" ht="18" customHeight="1">${sv.join('')}</row>`);
    }

    // Simbología al pie
    {
      const cn = [];
      for (let c = 1; c <= TOTAL_COLS; c++) {
        cn.push(
          buildCell(c, noteRow, {
            value:
              c === 1
                ? 'Simbología: Ord. = Ordinario | Rec. = Recuperación Trimestral | Falt. / T.F. = Faltas | E.E.R. = Exámenes Extraordinarios de Regularización | Calif. Def. = Definitiva SEP'
                : '',
            style: 17
          })
        );
      }
      mergeCells.push(`A${noteRow}:S${noteRow}`);
      sheetRowsXml.push(`<row r="${noteRow}" ht="14" customHeight="1">${cn.join('')}</row>`);
    }

    // Espacio para firmas y Fila de Firmas
    sheetRowsXml.push(`<row r="${spacerSignRow}" ht="22" customHeight="1"/>`);
    {
      const cs = [];
      for (let c = 1; c <= TOTAL_COLS; c++) {
        let val = '';
        let st = 0;
        if (c >= 2 && c <= 7) {
          st = 18;
          if (c === 2) val = `DOCENTE: ${docenteFinal ? docenteFinal.toUpperCase() : '_______________________'}`;
        } else if (c >= 9 && c <= 14) {
          st = 18;
          if (c === 9) val = `VO. BO. COORD. ACAD.: ${coordFinal.toUpperCase()}`;
        } else if (c >= 16 && c <= 19) {
          st = 18;
          if (c === 16) val = `DIRECTOR: ${directorNombre.toUpperCase()}`;
        }
        cs.push(buildCell(c, signRow, { value: val, style: st }));
      }
      mergeCells.push(`B${signRow}:G${signRow}`, `I${signRow}:N${signRow}`, `P${signRow}:S${signRow}`);
      sheetRowsXml.push(`<row r="${signRow}" ht="18" customHeight="1">${cs.join('')}</row>`);
    }

    const colsXml = [
      `<col min="1" max="1" width="4.2" customWidth="1"/>`,
      `<col min="2" max="2" width="33.0" customWidth="1"/>`,
      `<col min="3" max="3" width="3.5" customWidth="1"/>`,
      `<col min="4" max="12" width="5.4" customWidth="1"/>`,
      `<col min="13" max="13" width="5.4" customWidth="1"/>`,
      `<col min="14" max="14" width="6.5" customWidth="1"/>`,
      `<col min="15" max="17" width="5.8" customWidth="1"/>`,
      `<col min="18" max="18" width="7.5" customWidth="1"/>`,
      `<col min="19" max="19" width="26.0" customWidth="1"/>`
    ].join('');

    const mergeCellsXml = `<mergeCells count="${mergeCells.length}">${mergeCells.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`;

    const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr>
    <pageSetUpPr fitToPage="1"/>
  </sheetPr>
  <dimension ref="A1:S${signRow}"/>
  <sheetViews>
    <sheetView ${sheetIdx === 0 ? 'tabSelected="1" ' : ''}workbookViewId="0">
      <pane xSplit="2" ySplit="5" topLeftCell="C6" activePane="bottomRight" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="17.5"/>
  <cols>${colsXml}</cols>
  <sheetData>${sheetRowsXml.join('')}</sheetData>
  ${mergeCellsXml}
  <printOptions horizontalCentered="1" verticalCentered="0"/>
  <pageMargins left="0.2" right="0.2" top="0.25" bottom="0.25" header="0.1" footer="0.1"/>
  <pageSetup paperSize="1" orientation="landscape" fitToWidth="1" fitToHeight="1"/>
</worksheet>`;

    const sheetName = sanitizeExcelSheetName(mItem.name || asigTitle, usedSheetNames);
    sheetsData.push({ idx: sheetIdx + 1, name: sheetName, xml: worksheetXml });
  });

  const zip = new JSZip();

  const sheetOverrides = sheetsData
    .map(
      sh =>
        `<Override PartName="/xl/worksheets/sheet${sh.idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('\n  ');

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheetOverrides}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  const sheetRels = sheetsData
    .map(
      sh =>
        `<Relationship Id="rId${sh.idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sh.idx}.xml"/>`
    )
    .join('\n  ');

  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
  <Relationship Id="rId${sheetsData.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  const workbookSheetsXml = sheetsData
    .map(sh => `<sheet name="${escapeXml(sh.name)}" sheetId="${sh.idx}" r:id="rId${sh.idx}"/>`)
    .join('\n    ');

  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${workbookSheetsXml}
  </sheets>
  <calcPr calcId="171027" fullCalcOnLoad="1"/>
</workbook>`
  );

  zip.file('xl/styles.xml', buildCuadroMateriaStylesXml());

  sheetsData.forEach(sh => {
    zip.file(`xl/worksheets/sheet${sh.idx}.xml`, sh.xml);
  });

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const cleanGrado = String(grado).replace(/[^a-zA-Z0-9]/g, '');
  const cleanMat =
    materiasList.length === 1
      ? `_${String(materiasList[0].name || 'Materia').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/g, '_').slice(0, 24)}`
      : `_TodasMaterias`;
  const recTag = onlyRecovery ? '_SoloRecuperacion' : '';
  const filename = `Cuadro_Concentracion_${cleanGrado}_${cleanGrupo}${cleanMat}${recTag}.xlsx`;

  saveAs(blob, filename);
};
