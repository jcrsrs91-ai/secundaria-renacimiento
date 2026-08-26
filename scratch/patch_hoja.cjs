const fs = require('fs');

let fileContent = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

// Add import
fileContent = "import { useState } from 'react';\nimport html2pdf from 'html2pdf.js';\n" + fileContent;

// Add useState
fileContent = fileContent.replace(
  'const { config } = useGlobalConfig();',
  'const { config } = useGlobalConfig();\n  const [isGenerating, setIsGenerating] = useState(false);'
);

// Add ID to print wrapper
fileContent = fileContent.replace(
  '<div className="print-wrapper">',
  '<div className="print-wrapper" id="hoja-inscripcion-pdf">'
);

// Update handlePrint
const newHandlePrint = `
  const handlePrint = async () => {
    // Attempt to generate PDF for mobile compatibility
    setIsGenerating(true);
    try {
      const element = document.getElementById('hoja-inscripcion-pdf');
      const opt = {
        margin:       0.2, // Small margin to prevent clipping
        filename:     \`Ficha_Inscripcion_\${data.curp || 'Nuevo'}.pdf\`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      // We still call window.print() as a fallback/desktop preference, 
      // but let's actually just generate the PDF and download it.
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      window.print(); // Fallback
    } finally {
      setIsGenerating(false);
    }
  };
`;

fileContent = fileContent.replace(
  /const handlePrint = \(\) => \{\s*window\.print\(\);\s*\};/,
  newHandlePrint
);

// Update Button
fileContent = fileContent.replace(
  'Imprimir / Guardar como PDF',
  '{isGenerating ? "Generando PDF..." : "Descargar en PDF para Imprimir"}'
);

fileContent = fileContent.replace(
  '<button',
  '<button disabled={isGenerating}'
);

fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', fileContent);
console.log('Patched HojaInscripcionPrint.jsx');
