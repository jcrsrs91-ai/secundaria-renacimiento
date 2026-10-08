const fs = require('fs');

// PreInscripcion.jsx
let p = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');
if (!p.includes('name="repetidor"')) {
  p = p.replace(
    /<div>\s*<label className="block text-sm font-medium">Turno<\/label>/,
    `<div>
                            <label className="block text-sm font-medium">Â¿Es alumno repetidor de este grado?</label>
                            <select name="repetidor" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.repetidor || 'NO'}>
                              <option value="NO">NO</option>
                              <option value="SÃ">SÃ</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Turno</label>`
  );
  fs.writeFileSync('src/pages/public/PreInscripcion.jsx', p, 'utf8');
}

// HojaDeVida.jsx
let h = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');
if (!h.includes('name="repetidor"')) {
  h = h.replace(
    /<div>\s*<label className="block text-sm font-medium text-slate-700">Turno<\/label>/,
    `<div>
              <label className="block text-sm font-medium text-slate-700">Â¿Repetidor?</label>
              {isEditing ? (
                <select name="repetidor" defaultValue={student.repetidor || 'NO'} className="mt-1 block w-full rounded-md border-slate-300 p-2 border">
                  <option value="NO">NO</option>
                  <option value="SÃ">SÃ</option>
                </select>
              ) : (
                <p className="mt-1 text-slate-900">{student.repetidor || 'NO'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Turno</label>`
  );
  fs.writeFileSync('src/components/HojaDeVida.jsx', h, 'utf8');
}
console.log('Injected repetidor successfully.');
