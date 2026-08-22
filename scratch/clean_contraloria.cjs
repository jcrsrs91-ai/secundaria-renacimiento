const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// Remove the two tabs from the navigation
c = c.replace(/<button\s+onClick=\{\(\) => setActiveTab\('inventario'\)\}[\s\S]*?<\/button>/, '');
c = c.replace(/<button\s+onClick=\{\(\) => setActiveTab\('resguardos'\)\}[\s\S]*?<\/button>/, '');

// The tabs are in two places (maybe)? I'll just use regex globally
c = c.replace(/<button\s+onClick=\{\(\) => setActiveTab\('inventario'\)\}[\s\S]*?<\/button>/g, '');
c = c.replace(/<button\s+onClick=\{\(\) => setActiveTab\('resguardos'\)\}[\s\S]*?<\/button>/g, '');

// Remove the {activeTab === 'inventario' && ...} block completely
// Using a regex for {activeTab === 'inventario' is tricky because it has nested divs.
// I will just use string index of {activeTab === 'inventario' and find the closing bracket.
const idxInv = c.indexOf("{activeTab === 'inventario' && (");
if (idxInv !== -1) {
  // Find where it ends: it's followed by {activeTab === 'resguardos'
  const idxResg = c.indexOf("{activeTab === 'resguardos' && (");
  if (idxResg !== -1) {
    // Delete between them
    c = c.slice(0, idxInv) + c.slice(idxResg);
  }
}

const idxResg2 = c.indexOf("{activeTab === 'resguardos' && (");
if (idxResg2 !== -1) {
  // Find where it ends: it's followed by {/* Modals */} or similar, or just remove up to {showArticuloModal
  const idxModals = c.indexOf("{/* Modals */}");
  if (idxModals !== -1) {
    c = c.slice(0, idxResg2) + c.slice(idxModals);
  }
}

// Remove showArticuloModal, showResguardoModal, ScannerInventarioModal, printData for CartaResguardo
c = c.replace(/\{showArticuloModal && \([\s\S]*?Guardar Artículo<\/button>\s*<\/div>\s*<\/form>\s*<\/div>\s*<\/div>\s*\)\}/, '');
c = c.replace(/\{showResguardoModal && \([\s\S]*?Crear Resguardo<\/button>\s*<\/div>\s*<\/form>\s*<\/div>\s*<\/div>\s*\)\}/, '');
c = c.replace(/\{showScannerModal && \([\s\S]*?ScannerInventarioModal[\s\S]*?\)\}/, '');

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log("Contraloria cleaned");
