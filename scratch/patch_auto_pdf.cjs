const fs = require('fs');

let fileContent = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

// Add useEffect import
fileContent = fileContent.replace(
  "import { useState } from 'react';",
  "import { useState, useEffect } from 'react';"
);

// Add useEffect hook right after handlePrint definition
const useEffectHook = `
  useEffect(() => {
    // Generate PDF automatically on load, but only once
    const timer = setTimeout(() => {
      handlePrint();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
`;

fileContent = fileContent.replace(
  /const hasDoc = \(docKey\) => \{/,
  `${useEffectHook}\n  const hasDoc = (docKey) => {`
);

fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', fileContent);
console.log('Patched HojaInscripcionPrint with auto-download useEffect');
