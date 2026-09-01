const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

if (!code.includes('MessageCircle')) {
    code = code.replace(
        `import { QrCode, FileText, Upload, Download, Star, List, Save, X, User, Search, Printer, Trash2, UserPlus, Award, UserMinus, AlertTriangle, GraduationCap, Settings } from 'lucide-react';`,
        `import { QrCode, FileText, Upload, Download, Star, List, Save, X, User, Search, Printer, Trash2, UserPlus, Award, UserMinus, AlertTriangle, GraduationCap, Settings, MessageCircle } from 'lucide-react';`
    );
}

const copyFunc = `
    const handleCopyWhatsApp = () => {
      if (filteredDirectorio.length === 0) {
        alert("No hay alumnos en la lista filtrada para exportar teléfonos.");
        return;
      }
      const numbers = filteredDirectorio
        .map(a => a.telefono || a.celularTutor || a.madreTelefono || a.padreTelefono)
        .filter(num => num && typeof num === 'string' && num.trim() !== '')
        .map(num => num.replace(/\\D/g, '')) // Extraer solo números
        .filter(num => num.length >= 10);
      
      if (numbers.length === 0) {
        alert("No se encontraron números de teléfono válidos (mínimo 10 dígitos) en la lista filtrada.");
        return;
      }
      
      // Eliminar duplicados
      const uniqueNumbers = [...new Set(numbers)];
      const whatsappString = uniqueNumbers.join(', ');
      
      const el = document.createElement('textarea');
      el.value = whatsappString;
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
        alert(\`¡Teléfonos copiados al portapapeles!\\nSe copiaron \${uniqueNumbers.length} números de teléfono válidos listos para pegar en WhatsApp.\`);
      } catch (err) {
        alert("Hubo un error al copiar. Aquí están los números:\\n\\n" + whatsappString);
      }
      document.body.removeChild(el);
    };

    const handleExportCSV = () => {`;

if (!code.includes('handleCopyWhatsApp')) {
    code = code.replace(`    const handleExportCSV = () => {`, copyFunc);
}

const buttonsStr = `<button onClick={() => openModal('addStudent')} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
              <UserPlus className="w-4 h-4 mr-2" /> Agregar Alumno
            </button>
            <button onClick={handleCopyWhatsApp} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm">
              <MessageCircle className="w-4 h-4 mr-2" /> Números WhatsApp
            </button>
            <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">`;

if (!code.includes('handleCopyWhatsApp}')) {
    code = code.replace(
        `<button onClick={() => openModal('addStudent')} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
              <UserPlus className="w-4 h-4 mr-2" /> Agregar Alumno
            </button>
            <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">`,
        buttonsStr
    );
}

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', code);
console.log("Done");
