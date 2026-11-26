import JSZip from 'jszip';
import Papa from 'papaparse';

const decodeXmlEntities = (str = '') =>
  String(str)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');

const colLettersToIndex = (letters = '') => {
  let col = 0;
  const upper = String(letters).toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    col = col * 26 + (upper.charCodeAt(i) - 64);
  }
  return col - 1;
};

/**
 * Decodifica un buffer CSV/TSV soportando UTF-16LE (BOM o sin BOM, generado por Excel/exportCsv),
 * UTF-16BE, UTF-8 y Windows-1252/ANSI, limpiando BOM, caracteres nulos y línea `sep=`.
 */
export const decodeSpreadsheetTextBuffer = (arrayBuffer) => {
  const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer || 0);
  if (bytes.length === 0) return '';

  let encoding = null;
  let offset = 0;

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    encoding = 'utf-16le';
    offset = 2;
  } else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    encoding = 'utf-16be';
    offset = 2;
  } else if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    encoding = 'utf-8';
    offset = 3;
  } else {
    const sampleLen = Math.min(bytes.length, 64);
    let oddNulls = 0;
    let evenNonNulls = 0;
    for (let i = 0; i + 1 < sampleLen; i += 2) {
      if (bytes[i] !== 0) evenNonNulls++;
      if (bytes[i + 1] === 0) oddNulls++;
    }
    if (sampleLen >= 4 && oddNulls >= 2 && oddNulls === evenNonNulls) {
      encoding = 'utf-16le';
    }
  }

  const slice = offset > 0 ? bytes.subarray(offset) : bytes;
  let text;
  if (encoding) {
    text = new TextDecoder(encoding).decode(slice);
  } else {
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(slice);
    } catch {
      text = new TextDecoder('windows-1252').decode(slice);
    }
  }

  return text
    .replace(/^\uFEFF/, '')
    .split('\u0000')
    .join('')
    .replace(/^sep=[^\r\n]*\r?\n/i, '');
};

export const normalizeHeaderKey = (str = '') =>
  String(str || '')
    .replace(/^\uFEFF/, '')
    .replace(/\uFFFD/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const stripSpanishAccentedLetters = (str = '') =>
  String(str || '')
    .replace(/^\uFEFF/, '')
    .normalize('NFC')
    .toUpperCase()
    .replace(/[ÁÉÍÓÚÜÑ\uFFFD]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const resolveSubjectHeader = (rawHeaders = [], materia) => {
  if (!materia) return null;
  const targetName = normalizeHeaderKey(materia.name || '');
  const targetId = normalizeHeaderKey(materia.id || '');
  const targetSkeleton = stripSpanishAccentedLetters(materia.name || '');

  for (const h of rawHeaders) {
    const hn = normalizeHeaderKey(h);
    if (hn && (hn === targetName || (targetId && hn === targetId))) {
      return h;
    }
  }

  if (targetSkeleton) {
    const skeletonMatches = rawHeaders.filter(
      (h) => stripSpanishAccentedLetters(h) === targetSkeleton
    );
    if (skeletonMatches.length === 1) {
      return skeletonMatches[0];
    }
  }

  return null;
};

export const normalizeStudentNameKey = (str = '') =>
  String(str || '')
    .replace(/\((BAJA|ALTA)\)/gi, '')
    .replace(/\[(BAJA|ALTA)\]/gi, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const parseGradeValuePASEG = (rawVal) => {
  const cleaned = String(rawVal ?? '').trim();
  const upper = cleaned.toUpperCase();
  if (!cleaned || upper === 'BAJA' || upper === '-' || upper === '--' || upper === 'N/A' || upper === 'NA' || upper === 'S/C' || upper === 'SC') {
    return { kind: 'empty' };
  }
  const normalizedNum = cleaned.replace(',', '.');
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(normalizedNum)) {
    return { kind: 'invalid', raw: cleaned };
  }
  const num = Number(normalizedNum);
  if (!Number.isFinite(num) || num < 5 || num > 10) {
    return { kind: 'invalid', raw: cleaned };
  }
  return { kind: 'valid', value: String(Math.round(num)) };
};

const extractSharedStringsFromXml = (ssXml = '') => {
  const strings = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let siMatch;
  while ((siMatch = siRegex.exec(ssXml)) !== null) {
    const siBody = siMatch[1].replace(/<rPh\b[^>]*>[\s\S]*?<\/rPh>/g, '');
    const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let text = '';
    let tMatch;
    while ((tMatch = tRegex.exec(siBody)) !== null) {
      text += decodeXmlEntities(tMatch[1]);
    }
    strings.push(text);
  }
  return strings;
};

export const parseXlsxSabanaRows = async (arrayBuffer, materias = []) => {
  const zip = await JSZip.loadAsync(arrayBuffer);

  let sharedStrings = [];
  const ssFile = zip.file('xl/sharedStrings.xml');
  if (ssFile) {
    sharedStrings = extractSharedStringsFromXml(await ssFile.async('string'));
  }

  let sheetFile = zip.file('xl/worksheets/sheet1.xml');
  if (!sheetFile) {
    const firstSheetName = Object.keys(zip.files)
      .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k))
      .sort()[0];
    if (firstSheetName) sheetFile = zip.file(firstSheetName);
  }
  if (!sheetFile) {
    throw new Error('El archivo Excel no contiene una hoja de cálculo válida.');
  }

  const sheetXml = await sheetFile.async('string');
  const rawRows = [];
  const rowRegex = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const cells = [];
    const cellRegex = /<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch;
    let fallbackCol = 0;

    while ((cellMatch = cellRegex.exec(rowMatch[2])) !== null) {
      const attrs = cellMatch[1] || '';
      const inner = cellMatch[2] || '';
      const refMatch = attrs.match(/\br=["']([A-Z]+)\d+["']/i);
      const colIdx = refMatch ? colLettersToIndex(refMatch[1]) : fallbackCol;
      fallbackCol = colIdx + 1;

      const tMatch = attrs.match(/\bt=["']([^"']+)["']/i);
      const tAttr = tMatch ? tMatch[1] : '';

      let val;
      if (tAttr === 'inlineStr') {
        const tTexts = [...inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) =>
          decodeXmlEntities(m[1])
        );
        val = tTexts.join('');
      } else if (tAttr === 's') {
        const vMatch = inner.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
        const idx = vMatch ? parseInt(vMatch[1], 10) : -1;
        val = idx >= 0 && sharedStrings[idx] !== undefined ? sharedStrings[idx] : '';
      } else {
        const vMatch = inner.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
        val = vMatch ? decodeXmlEntities(vMatch[1]) : '';
      }
      cells[colIdx] = String(val).trim();
    }

    if (cells.some((c) => c !== undefined && c !== '')) {
      rawRows.push(cells);
    }
  }

  if (rawRows.length === 0) {
    return { headers: [], rows: [] };
  }

  let headerIdx = rawRows.findIndex((row) => {
    const cells = row.map((c) => String(c || ''));
    const hasMat = cells.some((c) => normalizeHeaderKey(c).startsWith('MATRICUL'));
    if (hasMat) return true;
    const subjHits = materias.filter((m) => resolveSubjectHeader(cells, m) !== null).length;
    const hasNombre = cells.some((c) => normalizeHeaderKey(c).includes('NOMBRE'));
    return subjHits >= 2 || (hasNombre && subjHits >= 1);
  });
  if (headerIdx === -1) headerIdx = 0;

  const headerCells = rawRows[headerIdx].map((h, i) => {
    const clean = String(h || '').trim();
    return clean || `__COL_${i}`;
  });

  const rows = [];
  for (let r = headerIdx + 1; r < rawRows.length; r++) {
    const rowArr = rawRows[r];
    const obj = {};
    let hasAnyValue = false;
    headerCells.forEach((hdr, cIdx) => {
      const val = String(rowArr[cIdx] ?? '').trim();
      if (val !== '') hasAnyValue = true;
      obj[hdr] = val;
    });
    if (hasAnyValue) rows.push(obj);
  }

  return { headers: headerCells, rows };
};

const findHeaderByPredicate = (rawHeaders, predicate) =>
  rawHeaders.find((h) => predicate(normalizeHeaderKey(h), stripSpanishAccentedLetters(h))) || null;

/**
 * Parsea una plantilla de calificaciones (CSV UTF-16LE / ANSI / UTF-8 o XLSX) para la Sábana General.
 */
export const parseCalificacionesPlantilla = async ({
  arrayBuffer,
  fileName = '',
  alumnosActivosGrupo = [],
  materias = []
}) => {
  const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer || 0);
  const isZipBytes = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  const isXlsxExt = /\.xlsx?$/i.test(fileName);

  let rawHeaders;
  let rows;

  if (isZipBytes || isXlsxExt) {
    const parsedXlsx = await parseXlsxSabanaRows(bytes, materias);
    rawHeaders = parsedXlsx.headers;
    rows = parsedXlsx.rows;
  } else {
    const text = decodeSpreadsheetTextBuffer(bytes);
    const parsedCsv = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      delimitersToGuess: ['\t', ',', ';', '|']
    });
    rawHeaders = parsedCsv.meta?.fields || Object.keys(parsedCsv.data?.[0] || {});
    rows = parsedCsv.data || [];
  }

  const matriculaCol = findHeaderByPredicate(
    rawHeaders,
    (hn, sk) => hn === 'MATRICULA' || hn.startsWith('MATRICUL') || sk === 'MATRCULA' || sk.startsWith('MATRCUL')
  );
  const nombreCol = findHeaderByPredicate(
    rawHeaders,
    (hn) => hn === 'NOMBRE COMPLETO' || hn === 'NOMBRE DEL ALUMNO' || hn === 'ALUMNO' || hn === 'NOMBRE'
  );

  const subjectHeaderMap = {};
  const matchedSubjects = [];
  const missingSubjects = [];

  materias.forEach((mat) => {
    const col = resolveSubjectHeader(rawHeaders, mat);
    if (col) {
      subjectHeaderMap[mat.id] = col;
      matchedSubjects.push(mat);
    } else {
      missingSubjects.push(mat);
    }
  });

  const byMatricula = new Map();
  const byNameApellidos = new Map();
  const byNameNombres = new Map();

  alumnosActivosGrupo.forEach((al) => {
    const matKey = String(al.matricula || '').trim().toUpperCase();
    if (matKey) byMatricula.set(matKey, al);

    const apKey = normalizeStudentNameKey(`${al.apellidoPaterno || ''} ${al.apellidoMaterno || ''} ${al.nombres || ''}`);
    const nomKey = normalizeStudentNameKey(`${al.nombres || ''} ${al.apellidoPaterno || ''} ${al.apellidoMaterno || ''}`);
    if (apKey) byNameApellidos.set(apKey, al);
    if (nomKey) byNameNombres.set(nomKey, al);
  });

  const gradesByStudent = {};
  const matchedStudentIds = new Set();
  const studentsWithGradesIds = new Set();
  const invalidCells = [];
  let gradesLoadedCount = 0;

  rows.forEach((row) => {
    let student = null;

    if (matriculaCol) {
      const matCell = String(row[matriculaCol] ?? '').trim().toUpperCase();
      if (matCell) {
        student = byMatricula.get(matCell) || null;
      }
    }

    if (!student && nombreCol) {
      const nameCell = normalizeStudentNameKey(row[nombreCol] ?? '');
      if (nameCell) {
        student = byNameApellidos.get(nameCell) || byNameNombres.get(nameCell) || null;
      }
    }

    if (!student) return;
    matchedStudentIds.add(student.id);

    const studentLabel = `${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''} ${student.nombres || ''}`.trim();

    matchedSubjects.forEach((mat) => {
      const col = subjectHeaderMap[mat.id];
      const parsedGrade = parseGradeValuePASEG(row[col]);
      if (parsedGrade.kind === 'valid') {
        if (!gradesByStudent[student.id]) gradesByStudent[student.id] = {};
        gradesByStudent[student.id][mat.id] = parsedGrade.value;
        studentsWithGradesIds.add(student.id);
        gradesLoadedCount++;
      } else if (parsedGrade.kind === 'invalid') {
        invalidCells.push({
          studentId: student.id,
          studentName: studentLabel,
          materiaId: mat.id,
          materiaName: mat.name,
          raw: parsedGrade.raw
        });
      }
    });
  });

  return {
    gradesByStudent,
    matchedStudentsCount: matchedStudentIds.size,
    studentsWithGradesCount: studentsWithGradesIds.size,
    gradesLoadedCount,
    matchedSubjects,
    missingSubjects,
    invalidCells
  };
};
