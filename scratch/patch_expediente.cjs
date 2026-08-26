const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// 1. Add import
if (!file.includes('ExpedienteModal')) {
  file = file.replace(/import AcuseRecepcionPrint from '\.\.\/\.\.\/components\/AcuseRecepcionPrint';/, 
    "import AcuseRecepcionPrint from '../../components/AcuseRecepcionPrint';\nimport ExpedienteModal from '../../components/ExpedienteModal';\nimport { FolderOpen } from 'lucide-react';");
}

// 2. Add state for selectedExpediente
if (!file.includes('const [selectedExpediente, setSelectedExpediente]')) {
  file = file.replace(/const \[selectedStudent, setSelectedStudent\] = useState\(null\);/, 
    "const [selectedStudent, setSelectedStudent] = useState(null);\n  const [selectedExpediente, setSelectedExpediente] = useState(null);");
}

// 3. Add button in student row. We need to find where the action buttons are mapped.
// Let's look for `<button onClick={() => { setSelectedStudent(student); setModalType('hoja'); }}>` or similar.
const regexBtn = /<button[^>]*onClick=\{\(\) => \{\s*setSelectedStudent\(student\);\s*setModalType\('hoja'\);\s*\}\}[^>]*>[\s\S]*?<\/button>/;

const newBtn = `<button 
                            onClick={() => setSelectedExpediente(student)}
                            title="Ver Expediente Digital"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FolderOpen className="w-5 h-5" />
                          </button>
                          $&`;

if (file.match(regexBtn)) {
  file = file.replace(regexBtn, newBtn);
}

// 4. Render the modal at the end of the file.
const regexModal = /\{modalType === 'add' && \([\s\S]*?<\/AddStudentModal>\s*\)\}/;
const newModal = `$&
      
      {selectedExpediente && (
        <ExpedienteModal 
          student={selectedExpediente} 
          onClose={() => setSelectedExpediente(null)} 
        />
      )}`;

if (file.match(regexModal)) {
  file = file.replace(regexModal, newModal);
}

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Patched ControlEscolar');
