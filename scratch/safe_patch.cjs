const fs = require('fs');

let file = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');

// The block starts with <div className="flex items-center space-x-3">
// And ends right after student.status || 'Activo'}</span></div>
const startIdx = file.indexOf('<div className="flex items-center space-x-3">');
const endIdx = file.indexOf('</div>', startIdx + 100);

if (startIdx > -1 && endIdx > -1) {
    const originalBlock = file.substring(startIdx, endIdx + 6);
    
    // Check if it already has auditUI
    if (!file.includes('student.lastModifiedBy')) {
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
        
        file = file.substring(0, startIdx) + auditUI + file.substring(endIdx + 6);
        fs.writeFileSync('src/components/HojaDeVida.jsx', file);
        console.log("Successfully replaced block!");
    } else {
        console.log("Already has audit block");
    }
} else {
    console.log("Could not find block");
}
