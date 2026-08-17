const fs = require('fs');

let c = fs.readFileSync('src/pages/public/Landing.jsx', 'utf8');

// 1. Remove the old bottom section
const seccionIndex = c.indexOf('<div id="seccion-avisos"></div>');
const footerIndex = c.indexOf('{/* Footer */}');
if (seccionIndex !== -1 && footerIndex !== -1) {
  c = c.substring(0, seccionIndex) + c.substring(footerIndex);
}

// 2. We need to replace the Hero Section div.
const heroStartStr = '{/* Hero Section */}';
const heroStart = c.indexOf(heroStartStr);

// Find where the Action Cards end
const cardsEndMatch = c.indexOf('</div>\n        </div>\n      </div>\n\n      \n      {/* Footer */}');
// Wait, since we removed the section between, the old hero end looks like this:
//              </Link>
//            </div>
//          </div>
//        </div>
//
//        {/* Footer */}

// It's safer to use regex to find the hero section bounds or just replace the inner content of the Hero section.
// Let's replace the inner structure.
const oldStructureStr = `<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
              <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-200 uppercase tracking-wider shadow-sm">Ciclo Escolar 2026-2027</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1] drop-shadow-lg">
              Por la superación <br className="hidden sm:block"/> de <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-600">México.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-200 mb-10 font-medium leading-relaxed drop-shadow-md">
              Descubre una comunidad educativa comprometida con la excelencia, la innovación y el desarrollo integral de cada estudiante.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">`;

const newStructureStr = `<div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col xl:flex-row gap-12 items-center xl:items-start">
          
          {/* Left Column: Text and Cards */}
          <div className="flex-1 text-center xl:text-left w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
              <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-200 uppercase tracking-wider shadow-sm">Ciclo Escolar 2026-2027</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1] drop-shadow-lg">
              Por la superación <br className="hidden sm:block"/> de <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-600">México.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-200 mb-10 font-medium leading-relaxed drop-shadow-md max-w-2xl mx-auto xl:mx-0">
              Descubre una comunidad educativa comprometida con la excelencia, la innovación y el desarrollo integral de cada estudiante.
            </p>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-12 max-w-3xl mx-auto xl:mx-0">`;

c = c.replace(oldStructureStr, newStructureStr);

// Now we need to insert the Right Column right after the Action Cards close.
const cardsEndStr = `</Link>
          </div>`;

const rightColumnStr = `</Link>
            </div>
          </div>

          {/* Right Column: Avisos Panel */}
          <div className="w-full xl:w-[450px] shrink-0 mt-12 xl:mt-0">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl h-[600px] flex flex-col overflow-hidden shadow-2xl">
              <div className="bg-sky-600/90 px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5" /> Muro de Avisos
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loadingNews ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                  </div>
                ) : noticias.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-slate-300 text-sm text-center px-4">
                    No hay avisos recientes por el momento.
                  </div>
                ) : (
                  noticias.map((aviso) => (
                    <div key={aviso.id} className="bg-white/10 border border-white/10 rounded-2xl p-5 hover:bg-white/15 transition-colors group">
                      <div className="flex items-start justify-between mb-3 border-b border-white/10 pb-3">
                        <span className={\`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider \${aviso.type === 'warning' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'}\`}>
                          {aviso.type === 'warning' ? 'Importante' : 'Informativo'}
                        </span>
                        {aviso.createdAt && (
                          <div className="flex items-center text-[10px] text-slate-400 font-medium">
                            {new Date(aviso.createdAt?.seconds * 1000).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mb-2 leading-tight">{aviso.title}</h3>
                      <p className="text-slate-300 text-xs mb-4 line-clamp-3 leading-relaxed whitespace-pre-wrap">{aviso.content}</p>
                      <Link to="/avisos" className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center w-max">
                        Leer completo <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-white/10 bg-slate-900/50 shrink-0 text-center">
                <Link to="/avisos" className="text-sm font-bold text-white hover:text-sky-400 transition-colors inline-flex items-center">
                  Ver historial de comunicados <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>`;

c = c.replace(cardsEndStr, rightColumnStr);

// To avoid the side panel fetching ONLY 3 items if they want to scroll, maybe we fetch 10 items instead of 3?
c = c.replace(/limit\(3\)/g, 'limit(10)');

// We also need to add custom scrollbar styles to index.css if they are not there, but let's just let it be standard for now.

fs.writeFileSync('src/pages/public/Landing.jsx', c);
