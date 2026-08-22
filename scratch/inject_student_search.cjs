const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// 1. Add materiasPorGrado and allStudentsRaw state
if (!c.includes('allStudentsRaw')) {
  const stateSearch = `const [pagoFormData, setPagoFormData] = useState({`;
  const stateInject = `
  const [allStudentsRaw, setAllStudentsRaw] = useState([]);
  
  const materiasPorGrado = {
    '1er Grado': [
      { id: 'espanol1', name: 'Español I' },
      { id: 'ingles1', name: 'Inglés I' },
      { id: 'artes1', name: 'Artes I' },
      { id: 'matematicas1', name: 'Matemáticas I' },
      { id: 'biologia', name: 'Ciencias I (Biología)' },
      { id: 'geografia', name: 'Geografía' },
      { id: 'historia1', name: 'Historia I' },
      { id: 'fce1', name: 'Formación Cívica y Ética I' },
      { id: 'tecnologia1', name: 'Tecnología I' },
      { id: 'educfisica1', name: 'Educación Física I' }
    ],
    '2do Grado': [
      { id: 'espanol2', name: 'Español II' },
      { id: 'ingles2', name: 'Inglés II' },
      { id: 'artes2', name: 'Artes II' },
      { id: 'matematicas2', name: 'Matemáticas II' },
      { id: 'fisica', name: 'Ciencias II (Física)' },
      { id: 'historia2', name: 'Historia II' },
      { id: 'fce2', name: 'Formación Cívica y Ética II' },
      { id: 'tecnologia2', name: 'Tecnología II' },
      { id: 'educfisica2', name: 'Educación Física II' }
    ],
    '3er Grado': [
      { id: 'espanol3', name: 'Español III' },
      { id: 'ingles3', name: 'Inglés III' },
      { id: 'artes3', name: 'Artes III' },
      { id: 'matematicas3', name: 'Matemáticas III' },
      { id: 'quimica', name: 'Ciencias III (Química)' },
      { id: 'historia3', name: 'Historia III' },
      { id: 'fce3', name: 'Formación Cívica y Ética III' },
      { id: 'tecnologia3', name: 'Tecnología III' },
      { id: 'educfisica3', name: 'Educación Física III' }
    ]
  };

  const getFailedSubjects = (student) => {
    if (!student) return [];
    
    // Si es irregular o egresado irregular, su grado real para materias podría ser el anterior
    // Pero en ControlEscolar asumen student.grado. Limpiaremos "(Irregular)" si lo tiene
    let gradeKey = student.grado;
    if (gradeKey?.includes('1er Grado')) gradeKey = '1er Grado';
    else if (gradeKey?.includes('2do Grado')) gradeKey = '2do Grado';
    else if (gradeKey?.includes('3er Grado')) gradeKey = '3er Grado';

    if (!materiasPorGrado[gradeKey]) return [];
    
    const materias = materiasPorGrado[gradeKey];
    const failed = [];

    for (let mat of materias) {
      const t1 = parseFloat(student.calificaciones?.['t1']?.[mat.id]);
      const t2 = parseFloat(student.calificaciones?.['t2']?.[mat.id]);
      const t3 = parseFloat(student.calificaciones?.['t3']?.[mat.id]);
      
      const extraScore = student.regularizacion?.[mat.id]?.calificacion;
      if (extraScore !== undefined && parseFloat(extraScore) >= 6) {
          continue; 
      }

      let sum = 0; let count = 0;
      if (!isNaN(t1)) { sum += t1; count++; }
      if (!isNaN(t2)) { sum += t2; count++; }
      if (!isNaN(t3)) { sum += t3; count++; }
      if (count > 0) {
        const finalMat = Math.floor((sum / count + 0.00001) * 10) / 10;
        if (finalMat < 6) {
          failed.push(mat);
        }
      }
    }
    return failed;
  };

  ${stateSearch}`;
  c = c.replace(stateSearch, stateInject);
}

// 2. Populate allStudentsRaw in onSnapshot
const snapshotSearch = `const items = [];
      snapshot.forEach(docSnap => {`;
const snapshotInject = `const items = [];
      const rawItems = [];
      snapshot.forEach(docSnap => {
        rawItems.push({ id: docSnap.id, ...docSnap.data() });`;

if (!c.includes('const rawItems = [];') && c.includes(snapshotSearch)) {
  c = c.replace(snapshotSearch, snapshotInject);
  
  const endSnapshotSearch = `setPagosRecientes(items.reverse());`;
  const endSnapshotInject = `setPagosRecientes(items.reverse());\n      setAllStudentsRaw(rawItems);`;
  c = c.replace(endSnapshotSearch, endSnapshotInject);
}

// 3. Update Modal JSX 
// Replace:
// <div>
//   <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Persona / Alumno</label>
//   <input type="text" required value={pagoFormData.nombre} onChange={e => setPagoFormData({...pagoFormData, nombre: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Ej. Juan Pérez López" />
// </div>

const originalInput = `<div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Persona / Alumno</label>
                <input type="text" required value={pagoFormData.nombre} onChange={e => setPagoFormData({...pagoFormData, nombre: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Ej. Juan PǸrez Lpez" />
              </div>`;

// Note: text encoding from file might have weird chars, we will use a regex to match it
const regexInput = /<div>\s*<label[^>]*>Nombre de la Persona \/ Alumno<\/label>\s*<input[^>]*value=\{pagoFormData\.nombre\}[^>]*>\s*<\/div>/;

const replacementInput = `<div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Buscar Alumno Registrado</label>
                <input 
                  type="text" 
                  required 
                  list="students-list"
                  value={pagoFormData.nombre} 
                  onChange={e => {
                    setPagoFormData({...pagoFormData, nombre: e.target.value});
                  }} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                  placeholder="Empieza a escribir el nombre..." 
                  autoComplete="off"
                />
                <datalist id="students-list">
                  {allStudentsRaw
                    .filter(s => pagoFormData.tipo === 'administrativo' ? s.status === 'Activo' || s.status === 'Egresado' : true)
                    .map(s => {
                       const fullName = \`\${s.apellidoPaterno || ''} \${s.apellidoMaterno || ''} \${s.nombres || ''}\`.trim();
                       return <option key={s.id} value={fullName} />;
                    })}
                </datalist>
                
                {/* Lógica de Materias Reprobadas (solo para Extraordinarios) */}
                {pagoFormData.tipo === 'extraordinario' && pagoFormData.nombre && (
                  (() => {
                    const selectedStudentObj = allStudentsRaw.find(s => \`\${s.apellidoPaterno || ''} \${s.apellidoMaterno || ''} \${s.nombres || ''}\`.trim() === pagoFormData.nombre);
                    if (!selectedStudentObj) return null;
                    const failed = getFailedSubjects(selectedStudentObj);
                    if (failed.length === 0) return <p className="text-sm text-emerald-600 mt-2 font-medium">Este alumno no tiene materias reprobadas detectadas.</p>;
                    
                    return (
                      <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3">
                         <p className="text-sm font-bold text-rose-800 mb-2">Materias reprobadas detectadas:</p>
                         <div className="flex flex-wrap gap-2">
                           {failed.map(mat => (
                             <button 
                               type="button" 
                               key={mat.id}
                               onClick={() => {
                                 const base = pagoFormData.concepto === 'Examen Extraordinario de ' ? 'Examen Extraordinario de ' : pagoFormData.concepto + ', ';
                                 setPagoFormData({...pagoFormData, concepto: base + mat.name});
                               }}
                               className="px-2 py-1 bg-white border border-rose-300 rounded shadow-sm text-xs text-rose-700 font-bold hover:bg-rose-100 transition"
                             >
                               + {mat.name}
                             </button>
                           ))}
                         </div>
                      </div>
                    );
                  })()
                )}
              </div>`;

c = c.replace(regexInput, replacementInput);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log('Injected student search correctly!');
