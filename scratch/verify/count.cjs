// Cuenta páginas y mide dónde queda la firma ("DIRECTOR DEL PLANTEL") respecto al borde inferior (en puntos).
// Página carta = 792pt de alto. El marco decorativo queda a 0.8cm (~23pt) del borde; el padding es 1cm (~28pt).
// Mientras más pequeño sea el número, más abajo está la firma (más cerca de desbordar la hoja).
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const dir = path.resolve('scratch/verify/out');
  const tag = process.argv[2] || 'base';
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(tag + '_') && f.endsWith('.pdf')).sort();
  for (const f of files) {
    const data = new Uint8Array(fs.readFileSync(path.join(dir, f)));
    const doc = await pdfjs.getDocument({ data, useSystemFonts: true, verbosity: 0 }).promise;
    let firmaPag = '-';
    let firmaY = '-';
    let hojasConTexto = 0;
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      const items = tc.items.filter((x) => x.str && x.str.trim());
      const real = items.filter((x) => !/INSTITUCI|^SEP$|Sello de la/i.test(x.str));
      if (real.length) hojasConTexto++;
      const firma = items.find((x) => /DIRECTOR DEL PLANTEL/i.test(x.str));
      if (firma) { firmaPag = i; firmaY = firma.transform[5].toFixed(0); }
    }
    console.log(
      f.replace(tag + '_', '').replace('.pdf', '').padEnd(28),
      'hojas con contenido =', hojasConTexto,
      '| firma en hoja', firmaPag, 'a', firmaY, 'pt del borde inferior'
    );
  }
})();
