const fs = require('fs');

let fileContent = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

// Replace import
fileContent = fileContent.replace(
  "import html2canvas from 'html2canvas';",
  "import { toJpeg } from 'html-to-image';"
);

// Replace handlePrint
const newHandlePrint = `
  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('hoja-inscripcion-pdf');
      if (!element) throw new Error('Element not found');
      
      const imgData = await toJpeg(element, { quality: 0.98, backgroundColor: '#ffffff', pixelRatio: 2 });
      
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      
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
console.log('Patched with html-to-image directly');
