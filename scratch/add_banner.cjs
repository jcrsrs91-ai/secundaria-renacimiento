const fs = require('fs');
let c = fs.readFileSync('src/pages/public/Landing.jsx', 'utf8');

const banner = `      {noticias.length > 0 && (
        <div className="bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white shadow-sm flex items-center justify-center gap-2">
          <span className="bg-indigo-800 text-xs px-2 py-0.5 rounded font-bold uppercase shrink-0">Último Aviso</span>
          <span className="truncate max-w-[250px] sm:max-w-xl">{noticias[0].title}</span>
          <a href="#avisos" onClick={(e) => { e.preventDefault(); document.getElementById('seccion-avisos')?.scrollIntoView({ behavior: 'smooth' }); }} className="underline font-bold hover:text-indigo-200 ml-2 shrink-0">Ver detalles</a>
        </div>
      )}
`;

c = c.replace('<nav className="fixed w-full z-50 top-0 left-0 border-b border-white/10 bg-slate-900/40 backdrop-blur-md">', '<nav className="fixed w-full z-50 top-0 left-0 border-b border-white/10 bg-slate-900/40 backdrop-blur-md flex flex-col">\n' + banner);

// The comment actually has a weird character "SECCI"N" from earlier because of PowerShell encoding.
c = c.replace(/\{\/\* SECCI.{1,3}N DE NOTICIAS Y AVISOS \*\/\}/, '<div id="seccion-avisos"></div>\n      {/* SECCIÓN DE NOTICIAS Y AVISOS */}');

fs.writeFileSync('src/pages/public/Landing.jsx', c);
