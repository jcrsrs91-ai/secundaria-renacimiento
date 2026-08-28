const fs = require('fs');

let file = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');

// Add useAuth import
if (!file.includes("import { useAuth }")) {
    file = file.replace("import { doc, updateDoc } from 'firebase/firestore';", "import { doc, updateDoc } from 'firebase/firestore';\nimport { useAuth } from '../context/AuthContext';");
}

// Add currentUser
if (!file.includes("const { currentUser }")) {
    file = file.replace("export default function HojaDeVida({ student, materiasPorGrado = {}, onClose, onSave }) {", "export default function HojaDeVida({ student, materiasPorGrado = {}, onClose, onSave }) {\n  const { currentUser } = useAuth();");
}

// Update updateDoc calls
file = file.replace(/await updateDoc\(docRef, \{ fotoUrl: base64String \}\);/g, "await updateDoc(docRef, { fotoUrl: base64String, lastModifiedBy: currentUser?.email || 'Desconocido', lastModifiedAt: new Date().toISOString() });");
file = file.replace(/await updateDoc\(docRef, \{ fotoUrl: dataUrl \}\);/g, "await updateDoc(docRef, { fotoUrl: dataUrl, lastModifiedBy: currentUser?.email || 'Desconocido', lastModifiedAt: new Date().toISOString() });");
file = file.replace(/await updateDoc\(docRef, data\);/g, "await updateDoc(docRef, { ...data, lastModifiedBy: currentUser?.email || 'Desconocido', lastModifiedAt: new Date().toISOString() });");

// Add audit UI
const searchStr = `<div className="flex items-center space-x-3">
            <h2 className="font-extrabold text-2xl text-slate-800">Hoja de Vida del Alumno</h2>
            <span className="bg-primary-100 text-primary-800 text-xs font-bold px-3 py-1 rounded-full">{student.matricula}</span>
            <span className={\`text-xs font-bold px-3 py-1 rounded-full \${
              student.status === 'Activo' ? 'bg-emerald-100 text-emerald-800' :
              student.status === 'Baja' ? 'bg-sky-100 text-sky-800' :
              student.status === 'Egresado' ? 'bg-blue-100 text-blue-800' :
              'bg-indigo-100 text-indigo-800'
            }\`}>{student.status || 'Activo'}</span>
          </div>`;

const auditUI = `<div className="flex flex-col">
            <div className="flex items-center space-x-3">
              <h2 className="font-extrabold text-2xl text-slate-800">Hoja de Vida del Alumno</h2>
              <span className="bg-primary-100 text-primary-800 text-xs font-bold px-3 py-1 rounded-full">{student.matricula}</span>
              <span className={\`text-xs font-bold px-3 py-1 rounded-full \${
                student.status === 'Activo' ? 'bg-emerald-100 text-emerald-800' :
                student.status === 'Baja' ? 'bg-sky-100 text-sky-800' :
                student.status === 'Egresado' ? 'bg-blue-100 text-blue-800' :
                'bg-indigo-100 text-indigo-800'
              }\`}>{student.status || 'Activo'}</span>
            </div>
            {student.lastModifiedBy && (
              <div className="text-[11px] text-slate-400 mt-1 font-medium flex items-center">
                <span className="mr-1">📝</span> Última modificación por: <span className="font-bold text-slate-500 mx-1">{student.lastModifiedBy}</span> el {new Date(student.lastModifiedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>`;

file = file.replace(searchStr, auditUI);

fs.writeFileSync('src/components/HojaDeVida.jsx', file);
console.log('Patched HojaDeVida.jsx securely');
