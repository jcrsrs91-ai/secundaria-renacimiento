const fs = require('fs');
let content = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

// 1. Change `updatedAt: new Date()` to `updatedAt: new Date().toISOString()` to prevent Firestore serialization errors
content = content.replace(
  /updatedAt: new Date\(\)/,
  `updatedAt: new Date().toISOString()`
);

// 2. Add an explicit alert() just in case the toast isn't visible, and a console log
content = content.replace(
  /toast\.success\('Datos del Formato 911 guardados correctamente\.'\);/,
  `toast.success('Datos guardados correctamente.');\n        alert('¡Los datos manuales de la 911 se han guardado con éxito en la nube!');`
);

content = content.replace(
  /toast\.error\('Error al guardar los datos\.'\);/,
  `toast.error('Error al guardar los datos.');\n        alert('Hubo un error al guardar. Revisa tu conexión a internet.');`
);

// 3. Fix the re-render overwrite bug! 
// When the component re-renders, it wipes contentEditable. We need a way to only render the '0' once, or use a trick.
// Instead of `{row.sub ? '0' : ''}` or `0`, we can inject the initial load data into React state so it's controlled!
// But wait, the easiest fix to prevent React from wiping contentEditable is to wrap the return in `useMemo` so it doesn't re-render unless shiftFilter changes!

// Let's wrap the JSX output in useMemo so it doesn't arbitrarily re-render when `rawActivos` updates.
content = content.replace(
  /return \(\s*<div className="bg-slate-50 min-h-screen p-4 sm:p-8 font-sans">/,
  `return useMemo(() => (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-8 font-sans">`
);

// Close the useMemo at the end of the file
content = content.replace(
  /<\/div>\s*\);\s*\}/,
  `</div>\n  ), [shiftFilter]);\n}`
);

fs.writeFileSync('src/components/Formato911.jsx', content, 'utf8');
console.log('Fixed save feedback and re-render wipe bug.');
