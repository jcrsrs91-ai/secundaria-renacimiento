import JSZip from 'jszip';
import fileSaver from 'file-saver';

const saveAs = fileSaver?.saveAs || fileSaver;
import {
  GRADOS_SEG,
  TURNOS_SEG,
  GRADO_LABELS,
  MOMENTOS_SEG,
  CAMPOS_FORMATIVOS_SEG,
  formatearFechaLargaSEG
} from './momentosValoracionCalc.js';

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

const buildCell = (colIdx, rowIdx, { value = '', type = 's', formula = null, style = 0 } = {}) => {
  const ref = `${colIndexToLetter(colIdx)}${rowIdx}`;
  if (formula !== null && formula !== undefined) {
    if (value !== null && value !== undefined && value !== '' && !isNaN(Number(value))) {
      return `<c r="${ref}" s="${style}"><f>${escapeXml(formula)}</f><v>${Number(value)}</v></c>`;
    }
    return `<c r="${ref}" s="${style}" t="str"><f>${escapeXml(formula)}</f><v></v></c>`;
  }
  if (value === '' || value === null || value === undefined) {
    return `<c r="${ref}" s="${style}"/>`;
  }
  if (type === 'n' && !isNaN(Number(value))) {
    return `<c r="${ref}" s="${style}" t="n"><v>${Number(value)}</v></c>`;
  }
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
};

const makeRow = (rowIdx, height, cellsXml) =>
  `<row r="${rowIdx}" ht="${height}" customHeight="1">${cellsXml.join('')}</row>`;

const buildMomentosStylesXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="3">
    <numFmt numFmtId="164" formatCode="0"/>
    <numFmt numFmtId="165" formatCode="0.0"/>
    <numFmt numFmtId="166" formatCode="0.0%"/>
  </numFmts>
  <fonts count="9">
    <font><sz val="10"/><name val="Arial"/><color rgb="FF0F172A"/></font>
    <font><b/><sz val="10"/><name val="Arial"/><color rgb="FF0F172A"/></font>
    <font><b/><sz val="11"/><name val="Arial"/><color rgb="FF0F172A"/></font>
    <font><b/><sz val="13"/><name val="Arial"/><color rgb="FF0F172A"/></font>
    <font><b/><sz val="9"/><name val="Arial"/><color rgb="FF1E293B"/></font>
    <font><b/><sz val="10"/><name val="Arial"/><color rgb="FF1E3A8A"/></font>
    <font><b/><sz val="10"/><name val="Arial"/><color rgb="FF991B1B"/></font>
    <font><b/><sz val="10"/><name val="Arial"/><color rgb="FF065F46"/></font>
    <font><i/><sz val="9"/><name val="Arial"/><color rgb="FF475569"/></font>
  </fonts>
  <fills count="9">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDBEAFE"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFCBD5E1"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFCE7F3"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDCFCE7"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/></patternFill></fill>
  </fills>
  <borders count="4">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FF475569"/></left>
      <right style="thin"><color rgb="FF475569"/></right>
      <top style="thin"><color rgb="FF475569"/></top>
      <bottom style="thin"><color rgb="FF475569"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FF0F172A"/></left>
      <right style="thin"><color rgb="FF0F172A"/></right>
      <top style="medium"><color rgb="FF0F172A"/></top>
      <bottom style="medium"><color rgb="FF0F172A"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left/>
      <right/>
      <top style="thin"><color rgb="FF0F172A"/></top>
      <bottom/>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="24">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="164" fontId="1" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="164" fontId="5" fillId="4" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="165" fontId="1" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="165" fontId="5" fillId="4" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="166" fontId="1" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="166" fontId="5" fillId="4" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="164" fontId="6" fillId="6" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="164" fontId="7" fillId="7" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="8" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="3" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" textRotation="90" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const wrapWorksheetXml = ({ lastCol, lastRow, colsXml, rowsXml, mergeCells, isSelected = false }) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:${lastCol}${lastRow}"/>
  <sheetViews><sheetView ${isSelected ? 'tabSelected="1" ' : ''}workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml.join('')}</sheetData>
  <mergeCells count="${mergeCells.length}">${mergeCells.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>
  <printOptions horizontalCentered="1" verticalCentered="1"/>
  <pageMargins left="0.2" right="0.2" top="0.25" bottom="0.25" header="0.1" footer="0.1"/>
  <pageSetup paperSize="1" orientation="landscape" fitToWidth="1" fitToHeight="1"/>
</worksheet>`;

const buildInstitucionalHeaderRows = (
  totalCols,
  momentoCfg,
  meta,
  mergeCells,
  turnoVista = 'Todos'
) => {
  const rows = [];
  const lastColLetter = colIndexToLetter(totalCols);
  const esUnSoloTurno = TURNOS_SEG.includes(turnoVista);
  const titulos = [
    'SECRETARÍA DE EDUCACIÓN',
    'SUBSECRETARÍA DE EDUCACIÓN BÁSICA',
    'DIRECCIÓN GENERAL DE EDUCACIÓN SECUNDARIA',
    `DEPARTAMENTO DE SECUNDARIAS: ${meta.departamento || 'TÉCNICAS'}`,
    `${momentoCfg.titulo}${esUnSoloTurno ? ` — TURNO ${turnoVista.toUpperCase()}` : ''}. CICLO ESCOLAR ${meta.cicloEscolar}`
  ];

  titulos.forEach((texto, idx) => {
    const r = idx + 1;
    const style = r === 5 ? 1 : 2;
    const cells = [];
    for (let c = 1; c <= totalCols; c++) {
      cells.push(buildCell(c, r, { value: c === 1 ? texto : '', style }));
    }
    mergeCells.push(`A${r}:${lastColLetter}${r}`);
    rows.push(makeRow(r, r === 5 ? 24 : 18, cells));
  });

  // Filas 6, 7, 8 adaptables al ancho de la hoja
  const cMid = Math.max(4, Math.floor(totalCols * 0.45));
  const cRight = Math.max(cMid + 2, Math.floor(totalCols * 0.72));

  // Fila 6: Escuela | CCT | Zona
  {
    const cells = Array.from({ length: totalCols }, (_, i) => {
      const c = i + 1;
      if (c === 1) return buildCell(c, 6, { value: `ESCUELA SECUNDARIA: ${meta.escuelaNombre}`, style: 3 });
      if (c === cMid + 1) return buildCell(c, 6, { value: `C.C.T.: ${meta.cct}`, style: 3 });
      if (c === cRight + 1) return buildCell(c, 6, { value: `ZONA ESCOLAR: ${meta.zonaEscolar}`, style: 3 });
      return buildCell(c, 6, { value: '', style: 3 });
    });
    mergeCells.push(
      `A6:${colIndexToLetter(cMid)}6`,
      `${colIndexToLetter(cMid + 1)}6:${colIndexToLetter(cRight)}6`,
      `${colIndexToLetter(cRight + 1)}6:${lastColLetter}6`
    );
    rows.push(makeRow(6, 19, cells));
  }

  // Fila 7: Localidad | Municipio | Región
  {
    const cells = Array.from({ length: totalCols }, (_, i) => {
      const c = i + 1;
      if (c === 1) return buildCell(c, 7, { value: `LOCALIDAD: ${meta.localidad}`, style: 3 });
      if (c === cMid + 1) return buildCell(c, 7, { value: `MPIO.: ${meta.municipio}`, style: 3 });
      if (c === cRight + 1) return buildCell(c, 7, { value: `REGIÓN: ${meta.region}`, style: 3 });
      return buildCell(c, 7, { value: '', style: 3 });
    });
    mergeCells.push(
      `A7:${colIndexToLetter(cMid)}7`,
      `${colIndexToLetter(cMid + 1)}7:${colIndexToLetter(cRight)}7`,
      `${colIndexToLetter(cRight + 1)}7:${lastColLetter}7`
    );
    rows.push(makeRow(7, 19, cells));
  }

  // Fila 8: Director | Total de docentes
  {
    const docLabel = esUnSoloTurno
      ? `TOTAL DE DOCENTES (${turnoVista.toUpperCase()}): ${meta.totalDocentes}`
      : `TOTAL DE DOCENTES: ${meta.totalDocentes}`;
    const cells = Array.from({ length: totalCols }, (_, i) => {
      const c = i + 1;
      if (c === 1) return buildCell(c, 8, { value: `NOMBRE DEL DIRECTOR (A): ${meta.director}`, style: 3 });
      if (c === cRight + 1) return buildCell(c, 8, { value: docLabel, style: 3 });
      return buildCell(c, 8, { value: '', style: 3 });
    });
    mergeCells.push(
      `A8:${colIndexToLetter(cRight)}8`,
      `${colIndexToLetter(cRight + 1)}8:${lastColLetter}8`
    );
    rows.push(makeRow(8, 19, cells));
  }

  return rows;
};

const buildMatriculaSheetXml = ({ momentoCfg, meta, matricula, turnoVista = 'Todos' }) => {
  const TOTAL_COLS = 16;
  const mergeCells = [];
  const turnosAExportar = TURNOS_SEG.includes(turnoVista) ? [turnoVista] : TURNOS_SEG;
  const esUnSoloTurno = turnosAExportar.length === 1;
  const rows = buildInstitucionalHeaderRows(TOTAL_COLS, momentoCfg, meta, mergeCells, turnoVista);
  const corteTexto = formatearFechaLargaSEG(meta.fechaCorte) || meta.fechaCorte;

  // Fila 9: MATRÍCULA GENERAL
  {
    const cells = Array.from({ length: TOTAL_COLS }, (_, i) =>
      buildCell(i + 1, 9, { value: i === 0 ? 'MATRÍCULA GENERAL' : '', style: 1 })
    );
    mergeCells.push('A9:P9');
    rows.push(makeRow(9, 24, cells));
  }

  // Fila 10 y 11: Encabezados de tabla
  {
    const h10 = [
      buildCell(1, 10, { value: 'GRADO', style: 5 }),
      buildCell(2, 10, { value: 'TURNO', style: 5 }),
      buildCell(3, 10, { value: 'N° DE GRUPOS', style: 5 }),
      buildCell(4, 10, { value: 'INSCRIPCIÓN INICIAL (al 30 de septiembre)', style: 5 }),
      buildCell(5, 10, { value: '', style: 5 }),
      buildCell(6, 10, { value: '', style: 5 }),
      buildCell(7, 10, { value: `ALTAS (al ${corteTexto})`, style: 5 }),
      buildCell(8, 10, { value: '', style: 5 }),
      buildCell(9, 10, { value: '', style: 5 }),
      buildCell(10, 10, { value: `BAJAS (al ${corteTexto})`, style: 5 }),
      buildCell(11, 10, { value: '', style: 5 }),
      buildCell(12, 10, { value: '', style: 5 }),
      buildCell(13, 10, { value: 'EXISTENCIA (Insc. Inicial + altas - bajas)', style: 5 }),
      buildCell(14, 10, { value: '', style: 5 }),
      buildCell(15, 10, { value: '', style: 5 }),
      buildCell(16, 10, { value: '% Bajas / (Inicial + Altas)', style: 5 })
    ];
    const h11 = [
      buildCell(1, 11, { value: '', style: 5 }),
      buildCell(2, 11, { value: '', style: 5 }),
      buildCell(3, 11, { value: '', style: 5 }),
      buildCell(4, 11, { value: 'H', style: 5 }),
      buildCell(5, 11, { value: 'M', style: 5 }),
      buildCell(6, 11, { value: 'TOTAL', style: 5 }),
      buildCell(7, 11, { value: 'H', style: 5 }),
      buildCell(8, 11, { value: 'M', style: 5 }),
      buildCell(9, 11, { value: 'TOTAL', style: 5 }),
      buildCell(10, 11, { value: 'H', style: 5 }),
      buildCell(11, 11, { value: 'M', style: 5 }),
      buildCell(12, 11, { value: 'TOTAL', style: 5 }),
      buildCell(13, 11, { value: 'H', style: 5 }),
      buildCell(14, 11, { value: 'M', style: 5 }),
      buildCell(15, 11, { value: 'TOTAL', style: 5 }),
      buildCell(16, 11, { value: 'TOTAL', style: 5 })
    ];
    mergeCells.push('A10:A11', 'B10:B11', 'C10:C11', 'D10:F10', 'G10:I10', 'J10:L10', 'M10:O10');
    rows.push(makeRow(10, 32, h10));
    rows.push(makeRow(11, 22, h11));
  }

  const pushMatriculaRow = (r, labelA, labelB, d, kind = 'data', formulaSources = null) => {
    const isTotal = kind === 'grado';
    const isGlobal = kind === 'global';
    const stText = isGlobal ? 20 : isTotal ? 19 : 7;
    const stTurn = isGlobal ? 20 : isTotal ? 19 : 6;
    const stNum = isGlobal ? 10 : isTotal ? 9 : 8;
    const stBaja = isGlobal ? 10 : isTotal ? 9 : 17;
    const stExis = isGlobal ? 10 : isTotal ? 9 : 18;
    const stPct = isGlobal ? 16 : isTotal ? 15 : 14;

    const sumColFormula = (colLetter) => {
      if (!formulaSources) return null;
      if (formulaSources.range) return `SUM(${colLetter}${formulaSources.range[0]}:${colLetter}${formulaSources.range[1]})`;
      if (formulaSources.rows) return formulaSources.rows.map((rr) => `${colLetter}${rr}`).join('+');
      return null;
    };

    const pctVal = (d.inicial.t + d.altas.t) > 0 ? d.bajas.t / (d.inicial.t + d.altas.t) : 0;

    const cells = [
      buildCell(1, r, { value: labelA, style: stText }),
      buildCell(2, r, { value: labelB, style: stTurn }),
      buildCell(3, r, { value: d.grupos, type: 'n', formula: sumColFormula('C'), style: stNum }),
      buildCell(4, r, { value: d.inicial.h, type: 'n', formula: sumColFormula('D'), style: stNum }),
      buildCell(5, r, { value: d.inicial.m, type: 'n', formula: sumColFormula('E'), style: stNum }),
      buildCell(6, r, { value: d.inicial.t, type: 'n', formula: `SUM(D${r}:E${r})`, style: stNum }),
      buildCell(7, r, { value: d.altas.h, type: 'n', formula: sumColFormula('G'), style: stNum }),
      buildCell(8, r, { value: d.altas.m, type: 'n', formula: sumColFormula('H'), style: stNum }),
      buildCell(9, r, { value: d.altas.t, type: 'n', formula: `SUM(G${r}:H${r})`, style: stNum }),
      buildCell(10, r, { value: d.bajas.h, type: 'n', formula: sumColFormula('J'), style: stBaja }),
      buildCell(11, r, { value: d.bajas.m, type: 'n', formula: sumColFormula('K'), style: stBaja }),
      buildCell(12, r, { value: d.bajas.t, type: 'n', formula: `SUM(J${r}:K${r})`, style: stBaja }),
      buildCell(13, r, { value: d.existencia.h, type: 'n', formula: `D${r}+G${r}-J${r}`, style: stExis }),
      buildCell(14, r, { value: d.existencia.m, type: 'n', formula: `E${r}+H${r}-K${r}`, style: stExis }),
      buildCell(15, r, { value: d.existencia.t, type: 'n', formula: `SUM(M${r}:N${r})`, style: stExis }),
      buildCell(16, r, { value: pctVal, type: 'n', formula: `IF((F${r}+I${r})=0,0,L${r}/(F${r}+I${r}))`, style: stPct })
    ];
    rows.push(makeRow(r, isGlobal ? 26 : 23, cells));
  };

  let rowCursor = 12;
  turnosAExportar.forEach((turno) => {
    GRADOS_SEG.forEach((grado) => {
      const d = matricula.filas[`${grado}-${turno}`];
      pushMatriculaRow(rowCursor, GRADO_LABELS[grado], turno.toUpperCase(), d, 'data');
      rowCursor++;
    });
  });

  if (!esUnSoloTurno) {
    pushMatriculaRow(18, 'TOTALES POR GRADO', 'PRIMERO', matricula.totalesGrado['1er Grado'], 'grado', { rows: [12, 15] });
    pushMatriculaRow(19, '', 'SEGUNDO', matricula.totalesGrado['2do Grado'], 'grado', { rows: [13, 16] });
    pushMatriculaRow(20, '', 'TERCERO', matricula.totalesGrado['3er Grado'], 'grado', { rows: [14, 17] });
    mergeCells.push('A18:A20');
    rowCursor = 21;
  }

  const totalRowNum = rowCursor;
  const totalLabel = esUnSoloTurno
    ? `TOTAL TURNO ${turnoVista.toUpperCase()}`
    : 'TOTAL DE LA ESCUELA';
  const totalFormulaSrc = esUnSoloTurno ? { range: [12, 14] } : { range: [18, 20] };
  pushMatriculaRow(totalRowNum, totalLabel, '', matricula.totalEscuela, 'global', totalFormulaSrc);
  mergeCells.push(`A${totalRowNum}:B${totalRowNum}`);

  const spacerRow = totalRowNum + 1;
  const sigRow = totalRowNum + 2;
  rows.push(makeRow(spacerRow, 18, []));
  const fCells = Array.from({ length: TOTAL_COLS }, (_, i) => {
    const c = i + 1;
    if (c === 1) return buildCell(c, sigRow, { value: `FECHA: ${formatearFechaLargaSEG(meta.fechaEmision) || ''}`, style: 3 });
    if (c >= 11 && c <= 15) return buildCell(c, sigRow, { value: c === 11 ? 'FIRMA Y SELLO' : '', style: 22 });
    return buildCell(c, sigRow, { value: '', style: 0 });
  });
  mergeCells.push(`A${sigRow}:F${sigRow}`, `K${sigRow}:O${sigRow}`);
  rows.push(makeRow(sigRow, 28, fCells));

  const colsXml = [
    '<col min="1" max="1" width="18" customWidth="1"/>',
    '<col min="2" max="2" width="14" customWidth="1"/>',
    '<col min="3" max="3" width="12" customWidth="1"/>',
    '<col min="4" max="15" width="7.8" customWidth="1"/>',
    '<col min="16" max="16" width="13" customWidth="1"/>'
  ].join('');

  return wrapWorksheetXml({
    lastCol: 'P',
    lastRow: sigRow,
    colsXml,
    rowsXml: rows,
    mergeCells,
    isSelected: true
  });
};

const buildAprovechamientoSheetXml = ({ momentoCfg, meta, aprovechamiento, turnoVista = 'Todos' }) => {
  const TOTAL_COLS = 33; // A..AG
  const mergeCells = [];
  const turnosAExportar = TURNOS_SEG.includes(turnoVista) ? [turnoVista] : TURNOS_SEG;
  const esUnSoloTurno = turnosAExportar.length === 1;
  const rows = buildInstitucionalHeaderRows(TOTAL_COLS, momentoCfg, meta, mergeCells, turnoVista);

  // Fila 9 & 10
  rows.push(makeRow(9, 24, Array.from({ length: TOTAL_COLS }, (_, i) => buildCell(i + 1, 9, { value: i === 0 ? 'APROVECHAMIENTO (PROMEDIOS)' : '', style: 1 }))));
  mergeCells.push('A9:AG9');

  rows.push(makeRow(10, 22, Array.from({ length: TOTAL_COLS }, (_, i) => buildCell(i + 1, 10, { value: i === 0 ? 'CAMPOS FORMATIVOS' : '', style: 5 }))));
  mergeCells.push('A10:AG10');

  // Fila 11: Grados y promedios por grado
  {
    const c11 = Array.from({ length: TOTAL_COLS }, (_, i) => {
      const c = i + 1;
      if (c === 1) return buildCell(c, 11, { value: 'TURNO', style: 5 });
      if (c === 2) return buildCell(c, 11, { value: 'PRIMER GRADO', style: 5 });
      if (c === 12) return buildCell(c, 11, { value: 'PROM. GRAL. DE 1°', style: 5 });
      if (c === 13) return buildCell(c, 11, { value: 'SEGUNDO GRADO', style: 5 });
      if (c === 22) return buildCell(c, 11, { value: 'PROM. GRAL. DE 2°', style: 5 });
      if (c === 23) return buildCell(c, 11, { value: 'TERCER GRADO', style: 5 });
      if (c === 32) return buildCell(c, 11, { value: 'PROM. GRAL. DE 3°', style: 5 });
      if (c === 33) return buildCell(c, 11, { value: esUnSoloTurno ? 'PROM. GRAL DEL TURNO' : 'PROM. GRAL DE LA ESCUELA', style: 5 });
      return buildCell(c, 11, { value: '', style: 5 });
    });
    mergeCells.push('A11:A13', 'B11:K11', 'L11:L13', 'M11:U11', 'V11:V13', 'W11:AE11', 'AF11:AF13', 'AG11:AG13');
    rows.push(makeRow(11, 26, c11));
  }

  // Fila 12: Campos Formativos por Grado & Fila 13: Disciplinas
  {
    const c12 = Array.from({ length: TOTAL_COLS }, (_, i) => buildCell(i + 1, 12, { value: '', style: 5 }));
    const c13 = Array.from({ length: TOTAL_COLS }, (_, i) => buildCell(i + 1, 13, { value: '', style: 5 }));

    const gradoStarts = { '1er Grado': 2, '2do Grado': 13, '3er Grado': 23 };
    GRADOS_SEG.forEach((grado) => {
      let cursor = gradoStarts[grado];
      CAMPOS_FORMATIVOS_SEG[grado].forEach((cf) => {
        const startC = cursor;
        cf.materias.forEach((mat) => {
          c13[cursor - 1] = buildCell(cursor, 13, { value: mat.label, style: 23 });
          cursor++;
        });
        const endC = cursor - 1;
        c12[startC - 1] = buildCell(startC, 12, { value: cf.campo, style: 5 });
        if (endC > startC) {
          mergeCells.push(`${colIndexToLetter(startC)}12:${colIndexToLetter(endC)}12`);
        }
      });
    });

    rows.push(makeRow(12, 32, c12));
    rows.push(makeRow(13, 82, c13));
  }

  const materiaList1 = CAMPOS_FORMATIVOS_SEG['1er Grado'].flatMap((c) => c.materias);
  const materiaList2 = CAMPOS_FORMATIVOS_SEG['2do Grado'].flatMap((c) => c.materias);
  const materiaList3 = CAMPOS_FORMATIVOS_SEG['3er Grado'].flatMap((c) => c.materias);

  turnosAExportar.forEach((turno, idx) => {
    const r = 14 + idx;
    const tData = aprovechamiento.turnos[turno];
    const cs = [buildCell(1, r, { value: turno.toUpperCase(), style: 7 })];

    materiaList1.forEach((m, mi) => {
      const val = tData.materias[m.id];
      cs.push(buildCell(2 + mi, r, { value: val !== null ? val : '', type: val !== null ? 'n' : 's', style: 11 }));
    });
    const pg1 = tData.promGrado['1er Grado'];
    cs.push(buildCell(12, r, { value: pg1 !== null ? pg1 : '', type: 'n', formula: `IFERROR(AVERAGE(B${r}:K${r}),"")`, style: 12 }));

    materiaList2.forEach((m, mi) => {
      const val = tData.materias[m.id];
      cs.push(buildCell(13 + mi, r, { value: val !== null ? val : '', type: val !== null ? 'n' : 's', style: 11 }));
    });
    const pg2 = tData.promGrado['2do Grado'];
    cs.push(buildCell(22, r, { value: pg2 !== null ? pg2 : '', type: 'n', formula: `IFERROR(AVERAGE(M${r}:U${r}),"")`, style: 12 }));

    materiaList3.forEach((m, mi) => {
      const val = tData.materias[m.id];
      cs.push(buildCell(23 + mi, r, { value: val !== null ? val : '', type: val !== null ? 'n' : 's', style: 11 }));
    });
    const pg3 = tData.promGrado['3er Grado'];
    cs.push(buildCell(32, r, { value: pg3 !== null ? pg3 : '', type: 'n', formula: `IFERROR(AVERAGE(W${r}:AE${r}),"")`, style: 12 }));

    const pgTurno = tData.promTurno;
    cs.push(buildCell(33, r, { value: pgTurno !== null ? pgTurno : '', type: 'n', formula: `IFERROR(AVERAGE(L${r},V${r},AF${r}),"")`, style: 12 }));

    rows.push(makeRow(r, 28, cs));
  });

  const lastShiftRow = 14 + turnosAExportar.length - 1;
  const totalRowNum = lastShiftRow + 1;

  // Fila de promedio general (Escuela o Turno)
  {
    const eData = aprovechamiento.escuela;
    const totalLabel = esUnSoloTurno
      ? `PROM. GRAL TURNO ${turnoVista.toUpperCase()}`
      : 'PROM. GRAL DE ESCUELA';
    const cs = [buildCell(1, totalRowNum, { value: totalLabel, style: 20 })];
    const cachedByCol = {};
    materiaList1.forEach((m, i) => { cachedByCol[2 + i] = eData.materias[m.id]; });
    cachedByCol[12] = eData.promGrado['1er Grado'];
    materiaList2.forEach((m, i) => { cachedByCol[13 + i] = eData.materias[m.id]; });
    cachedByCol[22] = eData.promGrado['2do Grado'];
    materiaList3.forEach((m, i) => { cachedByCol[23 + i] = eData.materias[m.id]; });
    cachedByCol[32] = eData.promGrado['3er Grado'];
    cachedByCol[33] = eData.promTurno;

    for (let c = 2; c <= TOTAL_COLS; c++) {
      const colL = colIndexToLetter(c);
      const val = cachedByCol[c];
      cs.push(
        buildCell(c, totalRowNum, {
          value: val !== null && val !== undefined ? val : '',
          type: 'n',
          formula: `IFERROR(AVERAGE(${colL}14:${colL}${lastShiftRow}),"")`,
          style: 13
        })
      );
    }
    rows.push(makeRow(totalRowNum, 30, cs));
  }

  // Nota y pie de firma
  const sp1 = totalRowNum + 1;
  const noteRow = totalRowNum + 2;
  const sp2 = totalRowNum + 3;
  const sigRow = totalRowNum + 4;
  rows.push(makeRow(sp1, 16, []));
  rows.push(
    makeRow(
      noteRow,
      22,
      Array.from({ length: TOTAL_COLS }, (_, i) =>
        buildCell(i + 1, noteRow, { value: i === 0 ? momentoCfg.notaAprovechamiento : '', style: 21 })
      )
    )
  );
  mergeCells.push(`A${noteRow}:AG${noteRow}`);
  rows.push(makeRow(sp2, 18, []));

  const fCells = Array.from({ length: TOTAL_COLS }, (_, i) => {
    const c = i + 1;
    if (c === 1) return buildCell(c, sigRow, { value: `FECHA: ${formatearFechaLargaSEG(meta.fechaEmision) || ''}`, style: 3 });
    if (c >= 13 && c <= 22) return buildCell(c, sigRow, { value: c === 13 ? 'FIRMA Y SELLO' : '', style: 22 });
    return buildCell(c, sigRow, { value: '', style: 0 });
  });
  mergeCells.push(`A${sigRow}:J${sigRow}`, `M${sigRow}:V${sigRow}`);
  rows.push(makeRow(sigRow, 28, fCells));

  const colsXml = [
    '<col min="1" max="1" width="22" customWidth="1"/>',
    '<col min="2" max="11" width="5.6" customWidth="1"/>',
    '<col min="12" max="12" width="7.8" customWidth="1"/>',
    '<col min="13" max="21" width="5.6" customWidth="1"/>',
    '<col min="22" max="22" width="7.8" customWidth="1"/>',
    '<col min="23" max="31" width="5.6" customWidth="1"/>',
    '<col min="32" max="33" width="8.6" customWidth="1"/>'
  ].join('');

  return wrapWorksheetXml({
    lastCol: 'AG',
    lastRow: sigRow,
    colsXml,
    rowsXml: rows,
    mergeCells
  });
};

const buildIndicatorMatrixSheetXml = ({
  momentoCfg,
  meta,
  tituloHoja,
  tituloGrupoIndicadores,
  columnasHeaders,
  totalLabel,
  dataSource,
  extractCounts,
  turnoVista = 'Todos'
}) => {
  const TOTAL_COLS = 13; // A..M
  const mergeCells = [];
  const turnosAExportar = TURNOS_SEG.includes(turnoVista) ? [turnoVista] : TURNOS_SEG;
  const esUnSoloTurno = turnosAExportar.length === 1;
  const rows = buildInstitucionalHeaderRows(TOTAL_COLS, momentoCfg, meta, mergeCells, turnoVista);

  // Fila 9
  rows.push(
    makeRow(
      9,
      24,
      Array.from({ length: TOTAL_COLS }, (_, i) =>
        buildCell(i + 1, 9, { value: i === 0 ? tituloHoja : '', style: 1 })
      )
    )
  );
  mergeCells.push('A9:M9');

  // Fila 10 y 11
  {
    const h10 = [
      buildCell(1, 10, { value: 'GRADO', style: 5 }),
      buildCell(2, 10, { value: 'TURNO', style: 5 }),
      buildCell(3, 10, { value: 'MATRÍCULA', style: 5 }),
      buildCell(4, 10, { value: tituloGrupoIndicadores, style: 5 }),
      ...Array.from({ length: 9 }, (_, i) => buildCell(5 + i, 10, { value: '', style: 5 }))
    ];
    const h11 = [
      buildCell(1, 11, { value: '', style: 5 }),
      buildCell(2, 11, { value: '', style: 5 }),
      buildCell(3, 11, { value: '', style: 5 }),
      buildCell(4, 11, { value: columnasHeaders[0], style: 5 }),
      buildCell(5, 11, { value: '%', style: 5 }),
      buildCell(6, 11, { value: columnasHeaders[1], style: 5 }),
      buildCell(7, 11, { value: '%', style: 5 }),
      buildCell(8, 11, { value: columnasHeaders[2], style: 5 }),
      buildCell(9, 11, { value: '%', style: 5 }),
      buildCell(10, 11, { value: columnasHeaders[3], style: 5 }),
      buildCell(11, 11, { value: '%', style: 5 }),
      buildCell(12, 11, { value: totalLabel, style: 5 }),
      buildCell(13, 11, { value: '%', style: 5 })
    ];
    mergeCells.push('A10:A11', 'B10:B11', 'C10:C11', 'D10:M10');
    rows.push(makeRow(10, 24, h10));
    rows.push(makeRow(11, 40, h11));
  }

  const pushMatrixRow = (r, labelA, labelB, rawObj, kind = 'data', formulaSources = null) => {
    const isGrado = kind === 'grado';
    const isGlobal = kind === 'global';
    const stText = isGlobal ? 20 : isGrado ? 19 : 7;
    const stTurn = isGlobal ? 20 : isGrado ? 19 : 6;
    const stNum = isGlobal ? 10 : isGrado ? 9 : 8;
    const stPct = isGlobal ? 16 : isGrado ? 15 : 14;
    const stCheck = isGlobal ? 10 : isGrado ? 9 : 18;

    const sumFormula = (colL) => {
      if (!formulaSources) return null;
      if (formulaSources.range) return `SUM(${colL}${formulaSources.range[0]}:${colL}${formulaSources.range[1]})`;
      if (formulaSources.rows) return formulaSources.rows.map((rr) => `${colL}${rr}`).join('+');
      return null;
    };

    const { m, c1, c2, c3, c4, tot } = extractCounts(rawObj);
    const pct = (v) => (m > 0 ? v / m : 0);

    const cells = [
      buildCell(1, r, { value: labelA, style: stText }),
      buildCell(2, r, { value: labelB, style: stTurn }),
      buildCell(3, r, { value: m, type: 'n', formula: sumFormula('C'), style: stNum }),
      buildCell(4, r, { value: c1, type: 'n', formula: sumFormula('D'), style: stNum }),
      buildCell(5, r, { value: pct(c1), type: 'n', formula: `IF(C${r}=0,0,D${r}/C${r})`, style: stPct }),
      buildCell(6, r, { value: c2, type: 'n', formula: sumFormula('F'), style: stNum }),
      buildCell(7, r, { value: pct(c2), type: 'n', formula: `IF(C${r}=0,0,F${r}/C${r})`, style: stPct }),
      buildCell(8, r, { value: c3, type: 'n', formula: sumFormula('H'), style: stNum }),
      buildCell(9, r, { value: pct(c3), type: 'n', formula: `IF(C${r}=0,0,H${r}/C${r})`, style: stPct }),
      buildCell(10, r, { value: c4, type: 'n', formula: sumFormula('J'), style: stNum }),
      buildCell(11, r, { value: pct(c4), type: 'n', formula: `IF(C${r}=0,0,J${r}/C${r})`, style: stPct }),
      buildCell(12, r, { value: tot, type: 'n', formula: `D${r}+F${r}+H${r}+J${r}`, style: stCheck }),
      buildCell(13, r, { value: pct(tot), type: 'n', formula: `IF(C${r}=0,0,L${r}/C${r})`, style: stPct })
    ];
    rows.push(makeRow(r, isGlobal ? 26 : 23, cells));
  };

  let rowCursor = 12;
  turnosAExportar.forEach((turno) => {
    GRADOS_SEG.forEach((grado) => {
      pushMatrixRow(rowCursor, GRADO_LABELS[grado], turno.toUpperCase(), dataSource.filas[`${grado}-${turno}`], 'data');
      rowCursor++;
    });
  });

  if (!esUnSoloTurno) {
    pushMatrixRow(18, 'TOTALES POR GRADO', 'PRIMERO', dataSource.totalesGrado['1er Grado'], 'grado', { rows: [12, 15] });
    pushMatrixRow(19, '', 'SEGUNDO', dataSource.totalesGrado['2do Grado'], 'grado', { rows: [13, 16] });
    pushMatrixRow(20, '', 'TERCERO', dataSource.totalesGrado['3er Grado'], 'grado', { rows: [14, 17] });
    mergeCells.push('A18:A20');
    rowCursor = 21;
  }

  const totalRowNum = rowCursor;
  const totalTitle = esUnSoloTurno
    ? `TOTAL TURNO ${turnoVista.toUpperCase()}`
    : 'TOTAL DE LA ESCUELA';
  const totalSrc = esUnSoloTurno ? { range: [12, 14] } : { range: [18, 20] };
  pushMatrixRow(totalRowNum, totalTitle, '', dataSource.totalEscuela, 'global', totalSrc);
  mergeCells.push(`A${totalRowNum}:B${totalRowNum}`);

  const spacerRow = totalRowNum + 1;
  const sigRow = totalRowNum + 2;
  rows.push(makeRow(spacerRow, 18, []));
  const fCells = Array.from({ length: TOTAL_COLS }, (_, i) => {
    const c = i + 1;
    if (c === 1) return buildCell(c, sigRow, { value: `FECHA: ${formatearFechaLargaSEG(meta.fechaEmision) || ''}`, style: 3 });
    if (c >= 8 && c <= 12) return buildCell(c, sigRow, { value: c === 8 ? 'FIRMA Y SELLO' : '', style: 22 });
    return buildCell(c, sigRow, { value: '', style: 0 });
  });
  mergeCells.push(`A${sigRow}:E${sigRow}`, `H${sigRow}:L${sigRow}`);
  rows.push(makeRow(sigRow, 28, fCells));

  const colsXml = [
    '<col min="1" max="1" width="19" customWidth="1"/>',
    '<col min="2" max="2" width="15" customWidth="1"/>',
    '<col min="3" max="3" width="12" customWidth="1"/>',
    '<col min="4" max="13" width="10.8" customWidth="1"/>'
  ].join('');

  return wrapWorksheetXml({
    lastCol: 'M',
    lastRow: sigRow,
    colsXml,
    rowsXml: rows,
    mergeCells
  });
};

export const generarWorkbookMomentosBuffer = async ({
  momentoId = 1,
  meta = {},
  matricula,
  aprovechamiento,
  desempeno,
  asistencia,
  turnoVista = 'Todos'
}) => {
  const momentoCfg = MOMENTOS_SEG[momentoId] || MOMENTOS_SEG[1];
  const sheets = [
    {
      idx: 1,
      name: 'MATRICULA GENERAL',
      xml: buildMatriculaSheetXml({ momentoCfg, meta, matricula, turnoVista })
    },
    {
      idx: 2,
      name: 'APROVECHAMIENTO',
      xml: buildAprovechamientoSheetXml({ momentoCfg, meta, aprovechamiento, turnoVista })
    },
    {
      idx: 3,
      name: 'DESEMPENO ALCANZADO',
      xml: buildIndicatorMatrixSheetXml({
        momentoCfg,
        meta,
        tituloHoja: 'DESEMPEÑO ALCANZADO',
        tituloGrupoIndicadores: 'INDICADOR DE LOGRO',
        columnasHeaders: [
          'Promedio 5.0 a 5.9',
          'Promedio 6.0 a 6.9',
          'Promedio 7.0 a 7.9',
          'Promedio 8.0 a 10'
        ],
        totalLabel: 'COMPROBACIÓN',
        dataSource: desempeno,
        extractCounts: (o) => ({
          m: o.matricula || 0,
          c1: o.r5 || 0,
          c2: o.r6 || 0,
          c3: o.r7 || 0,
          c4: o.r8 || 0,
          tot: o.comprobacion || 0
        }),
        turnoVista
      })
    },
    {
      idx: 4,
      name: 'ASISTENCIA',
      xml: buildIndicatorMatrixSheetXml({
        momentoCfg,
        meta,
        tituloHoja: 'ASISTENCIA',
        tituloGrupoIndicadores: 'ASISTENCIA (INASISTENCIAS EN EL PERIODO)',
        columnasHeaders: [
          'Faltaron 1 a 5 días',
          'Faltaron 6 a 10 días',
          'Faltaron más de 10 días',
          'No han faltado'
        ],
        totalLabel: 'TOTAL',
        dataSource: asistencia,
        extractCounts: (o) => ({
          m: o.matricula || 0,
          c1: o.f1_5 || 0,
          c2: o.f6_10 || 0,
          c3: o.fMas10 || 0,
          c4: o.sinFaltas || 0,
          tot: o.total || 0
        }),
        turnoVista
      })
    }
  ];

  const zip = new JSZip();

  const sheetOverrides = sheets
    .map(
      (s) =>
        `<Override PartName="/xl/worksheets/sheet${s.idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('\n  ');

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-officedocument.relationships+xml"/>
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

  const sheetRels = sheets
    .map(
      (s) =>
        `<Relationship Id="rId${s.idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${s.idx}.xml"/>`
    )
    .join('\n  ');

  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  const workbookSheets = sheets
    .map((s) => `<sheet name="${escapeXml(s.name)}" sheetId="${s.idx}" r:id="rId${s.idx}"/>`)
    .join('\n    ');

  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${workbookSheets}
  </sheets>
  <calcPr calcId="171027" fullCalcOnLoad="1"/>
</workbook>`
  );

  zip.file('xl/styles.xml', buildMomentosStylesXml());
  sheets.forEach((s) => {
    zip.file(`xl/worksheets/sheet${s.idx}.xml`, s.xml);
  });

  return zip.generateAsync({ type: 'uint8array' });
};

export const exportarMomentosValoracionExcel = async (params) => {
  const bytes = await generarWorkbookMomentosBuffer(params);
  const momentoCfg = MOMENTOS_SEG[params.momentoId] || MOMENTOS_SEG[1];
  const cicloClean = String(params.meta?.cicloEscolar || '2026-2027').replace(/[^0-9-]/g, '');
  const turnoSuf = TURNOS_SEG.includes(params.turnoVista) ? `_${params.turnoVista}` : '';
  const filename = `${momentoCfg.corto.replace(/\s+/g, '_')}_Valoracion_EST68${turnoSuf}_${cicloClean}.xlsx`;
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, filename);
  return filename;
};
