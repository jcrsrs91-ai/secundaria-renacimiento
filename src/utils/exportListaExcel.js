import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { autoAcentuar, roundToIntNumber } from './format';
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

/**
 * Genera y descarga un archivo Excel (.xlsx) nativo y 100% editable de la
 * Lista Oficial de Asistencia y Evaluación, con fórmulas automáticas integradas
 * (Suma de días, Promedio de clases sin truncar, Calificación Trimestral redondeada a entero,
 * y Cuadro Estadístico de Coordinación al calce).
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

  // Rellenar hasta al menos 27 filas para mantener el formato oficial
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

  // Construcción de filas XML de la hoja (38 columnas: A..AL)
  // A: N°
  // B: MATRÍCULA
  // C: NOMBRE DEL ALUMNO(A)
  // D: SEXO
  // E..X (20 cols): Días 1..20
  // Y: SUMA DÍAS
  // Z: PROM. CLASES
  // AA: T.F. (Faltas)
  // AB..AG (6 cols): Tareas T1..T6
  // AH: EXAM.
  // AI: PARTIC.
  // AJ: OTRO
  // AK: CALIF. TRIM. (Entero)
  // AL: OBSERVACIONES

  const TOTAL_COLS = 38;
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

  // Estilos en xl/styles.xml:
  // 0: Default
  // 1: Título Escuela (12pt Bold)
  // 2: Subtítulo Lista Oficial (11pt Bold, fondo gris claro, borde)
  // 3: Metadatos Etiqueta/Valor (9.5pt Bold, borde inferior)
  // 4: Encabezado Tabla Oscuro Centrado (8.5pt Bold Blanco, fondo #1E293B, borde fino)
  // 5: Encabezado Contenidos/Fecha Editable (7.5pt Bold, fondo #ECFDF5 verde muy suave, borde fino, wrapText)
  // 6: Celda Normal Centrada con Borde (8.5pt)
  // 7: Celda Nombre Alumno Izquierda con Borde (8.5pt Bold)
  // 8: Celda Baja Tachada Gris (8pt Italic Gris, fondo #E2E8F0)
  // 9: Celda Suma/Prom Clases (8.5pt Bold, fondo #ECFDF5)
  // 10: Celda Calif. Trim. Entera (10pt ExtraBold Centrada, fondo #EEF2FF)
  // 11: Encabezado Estadística Gris (8pt Bold Centrado, fondo #E2E8F0)
  // 12: Valor Estadística Negrita Centrado (9.5pt Bold, borde)
  // 13: Firma Centrada Borde Superior (8.5pt Bold)
  // 14: Nota Informativa (8pt Italic)

  // FILA 1: Título Principal
  {
    const cells = [];
    cells.push(buildCell(1, 1, { value: 'ESCUELA SECUNDARIA TÉCNICA N° 68 "RENACIMIENTO" — C.C.T. 12DST0077B', style: 1 }));
    cells.push(buildCell(16, 1, { value: 'LISTA DE ASISTENCIA Y EVALUACIÓN (FORMATO EDITABLE)', style: 2 }));
    cells.push(buildCell(31, 1, { value: `CICLO ESCOLAR: ${cicloEscolar}`, style: 1 }));
    mergeCells.push('A1:O1', 'P1:AD1', 'AE1:AL1');
    sheetRowsXml.push(`<row r="1" ht="20" customHeight="1">${cells.join('')}</row>`);
  }

  // FILA 2: Datos del Docente, Asignatura, Grado, Grupo y Turno
  {
    const cells = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      let val = '';
      if (c === 1) val = `DOCENTE: ${docente ? docente.toUpperCase() : '(ESCRIBA SU NOMBRE AQUÍ)'}`;
      if (c === 12) val = `DISCIPLINA / ASIGNATURA: ${asignatura ? asignatura.toUpperCase() : '(ESCRIBA SU MATERIA AQUÍ)'}`;
      if (c === 24) val = `TALLER: ${taller}`;
      if (c === 31) val = `GRADO: ${grado.toUpperCase()}`;
      if (c === 34) val = `GRUPO: "${cleanGrupo}"`;
      if (c === 36) val = `TURNO: ${turno} | TRIM: ${trimestreLabel || 'I'}`;
      cells.push(buildCell(c, 2, { value: val, style: 3 }));
    }
    mergeCells.push('A2:K2', 'L2:W2', 'X2:AD2', 'AE2:AG2', 'AH2:AI2', 'AJ2:AL2');
    sheetRowsXml.push(`<row r="2" ht="18" customHeight="1">${cells.join('')}</row>`);
  }

  // FILA 3: Instrucción rápida para el docente
  {
    const cells = [];
    cells.push(buildCell(1, 3, {
      value: '💡 INSTRUCCIONES: Puede anotar fechas/temas en la fila 5 y calificaciones diarias en las celdas 1 a 20 (se suman y promedian solas en SUMA DÍAS y PROM. CLASES), o calificar en Tareas/Examen, o escribir directo en CALIF. TRIM. (Número Entero).',
      style: 14
    }));
    mergeCells.push('A3:AL3');
    sheetRowsXml.push(`<row r="3" ht="15" customHeight="1">${cells.join('')}</row>`);
  }

  // FILA 4: Agrupaciones de Encabezado
  {
    const cells = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      let val = '';
      if (c === 1) val = 'N°';
      if (c === 2) val = 'MATRÍCULA';
      if (c === 3) val = 'NOMBRE DEL ALUMNO(A)';
      if (c === 4) val = 'SEXO';
      if (c === 5) val = 'ASISTENCIAS O CALIFICACIÓN DIARIA POR CLASE (CELDAS 1 A 20)';
      if (c === 25) val = 'CÁLCULO 20 DÍAS';
      if (c === 27) val = 'T.F.';
      if (c === 28) val = 'TAREAS / TRABAJOS';
      if (c === 34) val = 'EVALUACIÓN TRIMESTRAL';
      if (c === 38) val = 'OBSERVACIONES';
      cells.push(buildCell(c, 4, { value: val, style: 4 }));
    }
    mergeCells.push('E4:X4', 'Y4:Z4', 'AB4:AG4', 'AH4:AK4');
    sheetRowsXml.push(`<row r="4" ht="17" customHeight="1">${cells.join('')}</row>`);
  }

  // FILA 5: Fila Editable CONTENIDOS / FECHA DE CLASE
  {
    const cells = [];
    cells.push(buildCell(1, 5, { value: '', style: 5 }));
    cells.push(buildCell(2, 5, { value: '', style: 5 }));
    cells.push(buildCell(3, 5, { value: 'CONTENIDOS / FECHA DE CLASE ->', style: 5 }));
    cells.push(buildCell(4, 5, { value: '', style: 5 }));
    for (let d = 1; d <= 20; d++) {
      const savedFecha = contenidosFecha?.[`d${d}`] || '';
      cells.push(buildCell(4 + d, 5, { value: savedFecha, style: 5 }));
    }
    cells.push(buildCell(25, 5, { value: 'Auto', style: 5 }));
    cells.push(buildCell(26, 5, { value: 'Sin Truncar', style: 5 }));
    cells.push(buildCell(27, 5, { value: '', style: 5 }));
    for (let t = 1; t <= 6; t++) {
      const savedTema = contenidosFecha?.[`t${t}`] || '';
      cells.push(buildCell(27 + t, 5, { value: savedTema, style: 5 }));
    }
    cells.push(buildCell(34, 5, { value: '', style: 5 }));
    cells.push(buildCell(35, 5, { value: '', style: 5 }));
    cells.push(buildCell(36, 5, { value: '', style: 5 }));
    cells.push(buildCell(37, 5, { value: 'Entero', style: 5 }));
    cells.push(buildCell(38, 5, { value: '', style: 5 }));
    sheetRowsXml.push(`<row r="5" ht="26" customHeight="1">${cells.join('')}</row>`);
  }

  // FILA 6: Sub-encabezados de Columnas (1..20, SUMA, PROM, TF, T1..T6, EXAM, PARTIC, OTRO, CALIF TRIM)
  {
    const cells = [];
    cells.push(buildCell(1, 6, { value: 'N°', style: 4 }));
    cells.push(buildCell(2, 6, { value: 'MATRÍCULA', style: 4 }));
    cells.push(buildCell(3, 6, { value: 'APELLIDOS Y NOMBRES', style: 4 }));
    cells.push(buildCell(4, 6, { value: 'H/M', style: 4 }));
    for (let d = 1; d <= 20; d++) {
      cells.push(buildCell(4 + d, 6, { value: d, type: 'n', style: 4 }));
    }
    cells.push(buildCell(25, 6, { value: 'SUMA DÍAS', style: 4 }));
    cells.push(buildCell(26, 6, { value: 'PROM. CLASES', style: 4 }));
    cells.push(buildCell(27, 6, { value: 'FALTAS', style: 4 }));
    for (let t = 1; t <= 6; t++) {
      cells.push(buildCell(27 + t, 6, { value: `T${t}`, style: 4 }));
    }
    cells.push(buildCell(34, 6, { value: 'EXAM.', style: 4 }));
    cells.push(buildCell(35, 6, { value: 'PARTIC.', style: 4 }));
    cells.push(buildCell(36, 6, { value: 'OTRO', style: 4 }));
    cells.push(buildCell(37, 6, { value: 'CALIF. TRIM.', style: 4 }));
    cells.push(buildCell(38, 6, { value: 'OBSERVACIONES', style: 4 }));
    sheetRowsXml.push(`<row r="6" ht="18" customHeight="1">${cells.join('')}</row>`);
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
    const fullName = rawName ? autoAcentuar(rawName).toUpperCase() : '';
    const gen = st.isEmpty ? '' : getStudentGender(st);
    const stEval = (!st.isEmpty && evalData[st.id]) ? evalData[st.id] : {};

    const cells = [];
    // A: N°
    cells.push(buildCell(1, r, { value: idx + 1, type: 'n', style: isBaja ? 8 : 6 }));
    // B: Matrícula
    cells.push(buildCell(2, r, { value: st.isEmpty ? '' : (st.matricula || ''), style: isBaja ? 8 : 6 }));
    // C: Nombre
    const displayNombre = isBaja
      ? `${fullName} [BAJA]`
      : isAlta
        ? `${fullName} [ALTA]`
        : fullName;
    cells.push(buildCell(3, r, { value: displayNombre, style: isBaja ? 8 : 7 }));
    // D: Sexo
    cells.push(buildCell(4, r, { value: isBaja ? '' : gen, style: isBaja ? 8 : 6 }));

    if (isBaja) {
      for (let c = 5; c <= 37; c++) {
        cells.push(buildCell(c, r, { value: c === 14 ? `— BAJA OFICIAL ${st.fechaBaja ? '(' + st.fechaBaja + ')' : ''} —` : '', style: 8 }));
      }
      cells.push(buildCell(38, r, { value: `BAJA ${st.fechaBaja || ''}`.trim(), style: 8 }));
    } else {
      // E..X: 20 celdas de días
      for (let d = 1; d <= 20; d++) {
        const rawDia = stEval.dias?.[`d${d}`] ?? '';
        const isNum = rawDia !== '' && !isNaN(Number(rawDia));
        cells.push(buildCell(4 + d, r, {
          value: rawDia,
          type: isNum ? 'n' : 's',
          style: 6
        }));
      }

      // Y: SUMA DÍAS (Fórmula Excel: suma las calificaciones numéricas en E..X)
      const formulaSumaDias = `IF(COUNT(E${r}:X${r})>0,ROUND(SUM(E${r}:X${r}),2),"")`;
      cells.push(buildCell(25, r, { formula: formulaSumaDias, style: 9 }));

      // Z: PROM. CLASES (Fórmula Excel: divide la suma entre el total de días con clase)
      const formulaPromClases = `IF(COUNT(E${r}:X${r})>0,ROUND(SUM(E${r}:X${r})/IF(COUNTA($E$5:$X$5)>COUNT(E${r}:X${r}),COUNTA($E$5:$X$5),COUNT(E${r}:X${r})),2),"")`;
      cells.push(buildCell(26, r, { formula: formulaPromClases, style: 9 }));

      // AA: FALTAS
      const faltasVal = stEval.faltas ?? '';
      cells.push(buildCell(27, r, {
        value: faltasVal,
        type: faltasVal !== '' && !isNaN(Number(faltasVal)) ? 'n' : 's',
        style: 6
      }));

      // AB..AG: Tareas T1..T6
      for (let t = 1; t <= 6; t++) {
        const tVal = stEval[`t${t}`] ?? '';
        cells.push(buildCell(27 + t, r, {
          value: tVal,
          type: tVal !== '' && !isNaN(Number(tVal)) ? 'n' : 's',
          style: 6
        }));
      }

      // AH: Examen, AI: Participación, AJ: Otro
      const examVal = stEval.examen ?? '';
      const partVal = stEval.participacion ?? '';
      const otroVal = stEval.extraEval ?? '';
      cells.push(buildCell(34, r, { value: examVal, type: examVal !== '' && !isNaN(Number(examVal)) ? 'n' : 's', style: 6 }));
      cells.push(buildCell(35, r, { value: partVal, type: partVal !== '' && !isNaN(Number(partVal)) ? 'n' : 's', style: 6 }));
      cells.push(buildCell(36, r, { value: otroVal, type: otroVal !== '' && !isNaN(Number(otroVal)) ? 'n' : 's', style: 6 }));

      // AK: CALIF. TRIM. (NÚMERO ENTERO REDONDEADO)
      const califGuardada = roundToIntNumber(stEval.calificacion);
      const formulaCalifTrim = `IF(COUNT(AB${r}:AJ${r})>0,ROUND(AVERAGE(AB${r}:AJ${r}),0),IF(Z${r}<>"",ROUND(Z${r},0),""))`;
      if (califGuardada !== null) {
        cells.push(buildCell(37, r, { value: califGuardada, type: 'n', style: 10 }));
      } else {
        cells.push(buildCell(37, r, { formula: formulaCalifTrim, style: 10 }));
      }

      // AL: OBSERVACIONES
      const obsDefault = stEval.observaciones
        ? stEval.observaciones
        : isAlta
          ? `ALTA ${st.fechaAlta || ''}`.trim()
          : '';
      cells.push(buildCell(38, r, { value: obsDefault, style: 6 }));
    }

    sheetRowsXml.push(`<row r="${r}" ht="15.5" customHeight="1">${cells.join('')}</row>`);
  });

  // FILA EN BLANCO DE SEPARACIÓN
  const statHeaderRow1 = endStudentRow + 2;
  const statHeaderRow2 = endStudentRow + 3;
  const statValuesRow = endStudentRow + 4;
  const signRow = endStudentRow + 7;

  // CUADRO ESTADÍSTICO AUTOMÁTICO AL CALCE
  {
    const c1 = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      let val = '';
      if (c === 1) val = 'EXISTENCIA (ACTIVOS)';
      if (c === 7) val = 'ALUMNOS REGULARES (APROBADOS >= 6)';
      if (c === 15) val = 'ALUMNOS IRREGULARES (REPROBADOS < 6)';
      if (c === 23) val = 'PROMEDIO DE APROVECHAMIENTO';
      if (c === 31) val = '% DE APROBACIÓN';
      c1.push(buildCell(c, statHeaderRow1, { value: val, style: 11 }));
    }
    mergeCells.push(
      `A${statHeaderRow1}:F${statHeaderRow1}`,
      `G${statHeaderRow1}:N${statHeaderRow1}`,
      `O${statHeaderRow1}:V${statHeaderRow1}`,
      `W${statHeaderRow1}:AD${statHeaderRow1}`,
      `AE${statHeaderRow1}:AL${statHeaderRow1}`
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
      if (c === 23) val = '1 DÉCIMA';
      if (c === 31) val = 'PORCENTAJE';
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
      `W${statHeaderRow2}:AD${statHeaderRow2}`,
      `AE${statHeaderRow2}:AL${statHeaderRow2}`
    );
    sheetRowsXml.push(`<row r="${statHeaderRow2}" ht="15" customHeight="1">${c2.join('')}</row>`);

    const dRange = `$D$${startStudentRow}:$D$${endStudentRow}`;
    const akRange = `$AK$${startStudentRow}:$AK$${endStudentRow}`;

    const cv = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      if (c === 1) {
        cv.push(buildCell(c, statValuesRow, { value: existenciaH, type: 'n', style: 12 }));
      } else if (c === 3) {
        cv.push(buildCell(c, statValuesRow, { value: existenciaM, type: 'n', style: 12 }));
      } else if (c === 5) {
        cv.push(buildCell(c, statValuesRow, { value: existenciaT, type: 'n', style: 12 }));
      } else if (c === 7) {
        cv.push(buildCell(c, statValuesRow, { formula: `COUNTIFS(${dRange},"H",${akRange},">=6")`, style: 12 }));
      } else if (c === 10) {
        cv.push(buildCell(c, statValuesRow, { formula: `COUNTIFS(${dRange},"M",${akRange},">=6")`, style: 12 }));
      } else if (c === 13) {
        cv.push(buildCell(c, statValuesRow, { formula: `G${statValuesRow}+J${statValuesRow}`, style: 12 }));
      } else if (c === 15) {
        cv.push(buildCell(c, statValuesRow, { formula: `COUNTIFS(${dRange},"H",${akRange},"<6",${akRange},">0")`, style: 12 }));
      } else if (c === 18) {
        cv.push(buildCell(c, statValuesRow, { formula: `COUNTIFS(${dRange},"M",${akRange},"<6",${akRange},">0")`, style: 12 }));
      } else if (c === 21) {
        cv.push(buildCell(c, statValuesRow, { formula: `O${statValuesRow}+R${statValuesRow}`, style: 12 }));
      } else if (c === 23) {
        cv.push(buildCell(c, statValuesRow, { formula: `IF(COUNT(${akRange})>0,TRUNC(AVERAGE(${akRange}),1),"")`, style: 12 }));
      } else if (c === 31) {
        cv.push(buildCell(c, statValuesRow, { formula: `IF(COUNT(${akRange})>0,TRUNC((M${statValuesRow}/COUNT(${akRange}))*100,1),"")`, style: 12 }));
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
      `W${statValuesRow}:AD${statValuesRow}`,
      `AE${statValuesRow}:AL${statValuesRow}`
    );
    sheetRowsXml.push(`<row r="${statValuesRow}" ht="18" customHeight="1">${cv.join('')}</row>`);
  }

  // FILA DE FIRMAS
  {
    const cs = [];
    for (let c = 1; c <= TOTAL_COLS; c++) {
      let val = '';
      if (c === 2) val = `FIRMA DEL DOCENTE: ${docente ? docente.toUpperCase() : '___________________________'}`;
      if (c === 15) val = `VO. BO. COORDINACIÓN ACADÉMICA: ${coordinadorNombre ? coordinadorNombre.toUpperCase() : '___________________________'}`;
      if (c === 29) val = 'SELLO Y FECHA DE RECEPCIÓN EN CONTROL ESCOLAR';
      cs.push(buildCell(c, signRow, { value: val, style: 13 }));
    }
    mergeCells.push(
      `B${signRow}:L${signRow}`,
      `O${signRow}:Z${signRow}`,
      `AC${signRow}:AK${signRow}`
    );
    sheetRowsXml.push(`<row r="${signRow}" ht="20" customHeight="1">${cs.join('')}</row>`);
  }

  // Definición de anchos de columna (<cols>)
  const colsXml = [
    `<col min="1" max="1" width="4.5" customWidth="1"/>`,   // A: N°
    `<col min="2" max="2" width="13" customWidth="1"/>`,    // B: Matrícula
    `<col min="3" max="3" width="36" customWidth="1"/>`,    // C: Nombre del Alumno
    `<col min="4" max="4" width="4.5" customWidth="1"/>`,   // D: Sexo
    `<col min="5" max="24" width="4.8" customWidth="1"/>`,  // E..X: 20 Celdas de clase
    `<col min="25" max="25" width="7.5" customWidth="1"/>`, // Y: Suma Días
    `<col min="26" max="26" width="8.5" customWidth="1"/>`, // Z: Prom Clases
    `<col min="27" max="27" width="6.5" customWidth="1"/>`, // AA: Faltas
    `<col min="28" max="33" width="5.2" customWidth="1"/>`, // AB..AG: T1..T6
    `<col min="34" max="36" width="6.5" customWidth="1"/>`, // AH..AJ: Exam, Partic, Otro
    `<col min="37" max="37" width="9.5" customWidth="1"/>`, // AK: Calif. Trim.
    `<col min="38" max="38" width="18" customWidth="1"/>`   // AL: Observaciones
  ].join('');

  const mergeCellsXml = `<mergeCells count="${mergeCells.length}">${mergeCells.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`;

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr>
    <pageSetUpPr fitToPage="1"/>
  </sheetPr>
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane xSplit="3" ySplit="6" topLeftCell="D7" activePane="bottomRight" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${colsXml}</cols>
  <sheetData>${sheetRowsXml.join('')}</sheetData>
  ${mergeCellsXml}
  <pageMargins left="0.25" right="0.25" top="0.3" bottom="0.3" header="0.15" footer="0.15"/>
  <pageSetup paperSize="1" orientation="landscape" fitToWidth="1" fitToHeight="1"/>
</worksheet>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="8">
    <font><sz val="9"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Arial"/></font>
    <font><b/><sz val="9.5"/><color rgb="FF0F172A"/><name val="Arial"/></font>
    <font><b/><sz val="8"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
    <font><b/><sz val="7.5"/><color rgb="FF065F46"/><name val="Arial"/></font>
    <font><b/><sz val="8.5"/><color rgb="FF0F172A"/><name val="Arial"/></font>
    <font><i/><sz val="8"/><color rgb="FF64748B"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FF1E1B4B"/><name val="Arial"/></font>
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
      <left style="thin"><color rgb="FF334155"/></left>
      <right style="thin"><color rgb="FF334155"/></right>
      <top style="thin"><color rgb="FF334155"/></top>
      <bottom style="thin"><color rgb="FF334155"/></bottom>
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
    <xf numFmtId="0" fontId="6" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Lista_${cleanGrupo}" sheetId="1" r:id="rId1"/>
  </sheets>
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

  // Extraer nombre del docente si lo escribió en A2
  let docenteDetectado = '';
  const a2 = rowsMap[2]?.A || '';
  if (a2.toUpperCase().startsWith('DOCENTE:')) {
    const rawDoc = a2.substring(8).trim();
    if (rawDoc && !rawDoc.includes('ESCRIBA SU NOMBRE')) {
      docenteDetectado = rawDoc;
    }
  }

  // Extraer fila 5: CONTENIDOS / FECHA (columnas E..X para d1..d20 y AB..AG para t1..t6)
  const contenidosFecha = {};
  if (rowsMap[5]) {
    for (let d = 1; d <= 20; d++) {
      const colL = colIndexToLetter(4 + d);
      if (rowsMap[5][colL]) {
        contenidosFecha[`d${d}`] = rowsMap[5][colL];
      }
    }
    for (let t = 1; t <= 6; t++) {
      const colL = colIndexToLetter(27 + t);
      if (rowsMap[5][colL]) {
        contenidosFecha[`t${t}`] = rowsMap[5][colL];
      }
    }
  }

  // Emparejar filas de alumnos (desde la fila 7) por Matrícula (col B) o por Número de Lista (col A)
  const importedEval = {};
  let matchedCount = 0;

  Object.keys(rowsMap).forEach(rKey => {
    const rNum = parseInt(rKey, 10);
    if (rNum < 7) return;
    const rowCells = rowsMap[rNum];
    if (!rowCells) return;

    const matriculaCell = (rowCells.B || '').toUpperCase().trim();
    const numListaCell = parseInt(rowCells.A, 10);

    let student = null;
    if (matriculaCell) {
      student = alumnosGrupo.find(s => (s.matricula || '').toUpperCase().trim() === matriculaCell);
    }
    if (!student && !isNaN(numListaCell) && numListaCell >= 1 && numListaCell <= alumnosGrupo.length) {
      const candidate = alumnosGrupo[numListaCell - 1];
      const nombreEnExcel = (rowCells.C || '').toUpperCase().replace(/\s*\[(ALTA|BAJA)\]\s*/g, '').trim();
      if (candidate && nombreEnExcel) {
        const apPat = autoAcentuar(candidate.apellidoPaterno || '').toUpperCase().trim();
        if (!apPat || nombreEnExcel.includes(apPat)) {
          student = candidate;
        }
      }
    }

    if (!student || (student.status || '').toLowerCase() === 'baja') return;

    const dias = {};
    let sumaDias = 0;
    let countDias = 0;
    for (let d = 1; d <= 20; d++) {
      const colL = colIndexToLetter(4 + d);
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

    const faltas = rowCells.AA ?? '';
    const tareas = {};
    const evalNums = [];
    for (let t = 1; t <= 6; t++) {
      const colL = colIndexToLetter(27 + t);
      const valT = rowCells[colL] ?? '';
      tareas[`t${t}`] = valT;
      if (valT !== '' && !isNaN(parseFloat(valT))) evalNums.push(parseFloat(valT));
    }

    const examen = rowCells.AH ?? '';
    const participacion = rowCells.AI ?? '';
    const extraEval = rowCells.AJ ?? '';
    if (examen !== '' && !isNaN(parseFloat(examen))) evalNums.push(parseFloat(examen));
    if (participacion !== '' && !isNaN(parseFloat(participacion))) evalNums.push(parseFloat(participacion));
    if (extraEval !== '' && !isNaN(parseFloat(extraEval))) evalNums.push(parseFloat(extraEval));

    let califFinalStr = '';
    const rawAK = rowCells.AK ?? '';
    if (rawAK !== '' && !isNaN(parseFloat(rawAK))) {
      califFinalStr = String(Math.round(parseFloat(rawAK)));
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

    const observaciones = rowCells.AL ?? '';

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
