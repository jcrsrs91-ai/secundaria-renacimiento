const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const regexReturn = /return \(\s*<>\s*<div className=\{`space-y-6 \$\{printMode \? "hidden" : ""\} print:\$\{receiptPago \? "hidden" : "block"\}`\}>/;

const replaceReturn = `return (
    <>
    <div className={\`space-y-6 \${printMode ? "hidden" : ""} print:\${receiptPago ? "hidden" : "block"}\`}>
      {(!cajaTurno && (activeTab === 'pagos' || activeTab === 'gastos' || activeTab === 'corte')) ? (
         <CajaLockScreen userEmail={currentUser?.email} onCajaAbierta={(id, turno, fondo) => setCajaTurno({id, turno, fondoInicial: fondo})} />
      ) : (
        <>`;
        
if (!c.includes('onCajaAbierta=')) {
    c = c.replace(regexReturn, replaceReturn);
    c = c.replace(/<\/div>\s*<\/>\s*\);\s*\}\s*$/, '</div>\n    </>\n    )}\n    </div>\n    </>\n  );\n}');
    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
    console.log("Fixed main return");
} else {
    console.log("Already wrapped return");
}
