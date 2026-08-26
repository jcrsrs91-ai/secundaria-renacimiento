const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// 1. Add imports
file = file.replace(/import AcuseRecepcionPrint from '\.\.\/\.\.\/components\/AcuseRecepcionPrint';/, 
  "import AcuseRecepcionPrint from '../../components/AcuseRecepcionPrint';\nimport ExpedienteModal from '../../components/ExpedienteModal';\nimport { FolderOpen } from 'lucide-react';");

// 2. Add state
file = file.replace(/const \[selectedStudent, setSelectedStudent\] = useState\(null\);/, 
  "const [selectedStudent, setSelectedStudent] = useState(null);\n  const [selectedExpediente, setSelectedExpediente] = useState(null);");

// 3. Add buttons next to Revisar Expediente and Expediente
file = file.replace(/(<button onClick=\{\(\) => openModal\('hoja', ([^)]+)\)\}[\s\S]*?Expediente[\s\S]*?<\/button>)/g, 
  "$1\n                        <button onClick={() => setSelectedExpediente($2)} className=\"text-purple-600 hover:text-purple-800 font-medium text-sm inline-flex items-center ml-4\">\n                          <FolderOpen className=\"w-4 h-4 mr-1\" /> Docs Digitales\n                        </button>");

// 4. Add modal at the end
const target = "{printMode === 'concentrado-parcial' && <CuadroParcialPrint alumnos={printData.alumnos} materias={materiasPorGrado[printData.grado]} grado={printData.grado} grupo={printData.grupo} />}";

if (file.includes(target)) {
  file = file.replace(target, target + "\n\n      {selectedExpediente && (\n        <ExpedienteModal \n          student={selectedExpediente} \n          onClose={() => setSelectedExpediente(null)} \n        />\n      )}");
}

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Patched fresh');
