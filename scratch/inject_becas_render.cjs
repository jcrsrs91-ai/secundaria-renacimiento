const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const becasRender = `
        {/* Sección Becas */}
        {!loading && activeTab === 'becas' && !printMode && (
          <BecasReport activos={directorio} onClose={() => setActiveTab('activos')} />
        )}
`;

content = content.replace(
  "{/* IMPRESIÓN MODALES INDIVIDUALES */}",
  becasRender + "\n        {/* IMPRESIÓN MODALES INDIVIDUALES */}"
);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', content, 'utf8');
console.log('Injected BecasReport render');
