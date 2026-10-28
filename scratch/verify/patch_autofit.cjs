const fs = require('fs');
const p = 'src/components/ConstanciaPrint.jsx';
const raw = fs.readFileSync(p, 'utf8');
const crlf = raw.includes('\r\n');
let s = raw.replace(/\r\n/g, '\n');

function rep(oldStr, newStr, label) {
  const n = s.split(oldStr).length - 1;
  if (n !== 1) { console.error(`[${label}] coincidencias: ${n} (se esperaba 1)`); process.exit(1); }
  s = s.replace(oldStr, () => newStr);
  console.log('OK  ', label);
}

// A) imports
rep(
  "import React from 'react';",
  "import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';\nimport { flushSync } from 'react-dom';",
  'imports'
);

// B) helper de ajuste (antes de formatearTextoTramite)
rep(
  "export const formatearTextoTramite = (tramite) => {",
  `// ---------------------------------------------------------------------------
// AJUSTE AUTOMATICO A 1 HOJA CARTA
// Las constancias estan en MAYUSCULAS (letras mas anchas). Si por el largo del nombre,
// del tramite o de la tabla el contenido no cabe en una hoja, se reduce la letra de
// 0.25pt en 0.25pt hasta que quepa. Si ya cabe, NO se cambia nada (margenes, espacios y
// estructura siempre se conservan).
// ---------------------------------------------------------------------------
const MAX_ALTO_PX = 1040;      // alto maximo de la hoja (incluye el padding de 1cm arriba y abajo)
const MIN_FUENTE_PT = 8.5;     // la letra nunca baja de este tamano
const PASO_FUENTE_PT = 0.25;

const ajustarFuente = (page, content, basePt) => {
  const previo = content.style.fontSize;
  let size = basePt;
  while (size > MIN_FUENTE_PT) {
    content.style.fontSize = \`\${size}pt\`;
    if (page.getBoundingClientRect().height <= MAX_ALTO_PX) break;
    size = Math.round((size - PASO_FUENTE_PT) * 100) / 100;
  }
  content.style.fontSize = previo;
  return Math.max(size, MIN_FUENTE_PT);
};

export const formatearTextoTramite = (tramite) => {`,
  'helper ajuste'
);

// C) hooks (antes del return null)
rep(
  `  const { config } = useGlobalConfig();
  if (!student) return null;

  const tramiteToUse = (tramite || student?.tramite || '').trim();
`,
  `  const { config } = useGlobalConfig();
  const tramiteToUse = (tramite || student?.tramite || '').trim();

  // Tamano base de letra de cada formato (el mismo de siempre)
  const basePt = type === 'calificaciones' ? 10
    : (type === 'acreditacion_extraordinario' && Array.isArray(extraordinarioSelected) && extraordinarioSelected.length > 2) ? 10.5
    : type === 'simple' ? 11.5 : 11;

  const pageRef = useRef(null);
  const contentRef = useRef(null);
  const [fontPt, setFontPt] = useState(null);

  const remedir = useCallback(() => {
    const page = pageRef.current;
    const content = contentRef.current;
    if (!page || !content) return;
    const nuevo = ajustarFuente(page, content, basePt);
    setFontPt(nuevo < basePt ? nuevo : null);
  }, [basePt]);

  useLayoutEffect(() => {
    remedir();
  }, [remedir, student, type, tramiteToUse, extraordinarioSelected, config?.cicloEscolarActual, config?.leyendaOficial]);

  useEffect(() => {
    let vivo = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (vivo) remedir(); });
    const alImprimir = () => flushSync(() => remedir());
    window.addEventListener('beforeprint', alImprimir);
    return () => { vivo = false; window.removeEventListener('beforeprint', alImprimir); };
  }, [remedir]);

  if (!student) return null;
`,
  'hooks'
);

// D) CSS: fuera de pantalla pero medible; en impresion vuelve a flujo normal
rep(
  `          .print-constancia-only { display: block !important; }
          `,
  `          .print-constancia-only { display: block !important; position: static !important; left: auto !important; width: auto !important; visibility: visible !important; pointer-events: auto !important; }
          `,
  'css print'
);
rep(
  `        @media screen {
          .print-constancia-only { display: none !important; }
        }`,
  `        @media screen {
          /* Fuera de pantalla e invisible, pero con layout real para poder medir si cabe en 1 hoja */
          .print-constancia-only { display: block !important; position: fixed !important; left: -10000px !important; top: 0 !important; width: 8.5in !important; visibility: hidden !important; pointer-events: none !important; }
          .print-constancia-only .page-container { width: 8.5in !important; min-height: 0 !important; height: auto !important; margin: 0 !important; padding: 1cm !important; box-shadow: none !important; }
        }`,
  'css screen'
);

// E) ref en page-container
rep(
  '<div className="page-container relative block">',
  '<div ref={pageRef} className="page-container relative block">',
  'ref page'
);

// F) ref y tamano de letra en el contenedor de texto
rep(
  "style={{ fontSize: type === 'calificaciones' ? '10pt' : (type === 'acreditacion_extraordinario' && Array.isArray(extraordinarioSelected) && extraordinarioSelected.length > 2) ? '10.5pt' : type === 'simple' ? '11.5pt' : '11pt' }}>",
  "ref={contentRef} style={{ fontSize: fontPt ? `${fontPt}pt` : `${basePt}pt` }}>",
  'ref content + font'
);

fs.writeFileSync(p, crlf ? s.replace(/\n/g, '\r\n') : s, 'utf8');
console.log('Archivo guardado.');
