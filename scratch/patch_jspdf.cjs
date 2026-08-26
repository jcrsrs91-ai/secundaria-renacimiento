const fs = require('fs');

let fileContent = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

// Replace import
fileContent = fileContent.replace(
  "import html2pdf from 'html2pdf.js';",
  "import { jsPDF } from 'jspdf';\nimport html2canvas from 'html2canvas';"
);

// Replace handlePrint
const newHandlePrint = `
  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('hoja-inscripcion-pdf');
      if (!element) throw new Error('Element not found');
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(\`Ficha_Inscripcion_\${data.curp || 'Nuevo'}.pdf\`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF. Se abrirá la opción de imprimir normal. ' + error.message);
      window.print(); // Fallback
    } finally {
      setIsGenerating(false);
    }
  };
`;

fileContent = fileContent.replace(
  /const handlePrint = async \(\) => \{[\s\S]*?\} finally \{\s*setIsGenerating\(false\);\s*\}\s*\};/,
  newHandlePrint
);

fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', fileContent);
console.log('Patched with jsPDF directly');
