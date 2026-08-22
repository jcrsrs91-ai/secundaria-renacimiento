const fs = require('fs');
let c = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');

c = c.replace(
  "import { useState } from 'react';",
  "import { useState, useEffect } from 'react';"
);

c = c.replace(
  "const [tieneBeca, setTieneBeca] = useState(false);",
  `const [tieneBeca, setTieneBeca] = useState(false);
  useEffect(() => {
    if (studentData && studentData.tieneBeca === 'Sí') {
      setTieneBeca(true);
    } else {
      setTieneBeca(false);
    }
  }, [studentData]);`
);

let insertionPoint = `<label className="block text-sm font-medium text-slate-700">Código Postal</label>
                          <input type="text" name="cp" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.cp} />
                        </div>`;

let fieldsToInsert = `                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700">¿Cuenta con alguna beca?</label>
                          <select name="tieneBeca" className="mt-1 block w-full rounded-md shadow-sm p-2 border" value={tieneBeca ? 'Sí' : 'No'} onChange={(e) => setTieneBeca(e.target.value === 'Sí')}>
                            <option value="No">No</option>
                            <option value="Sí">Sí</option>
                          </select>
                        </div>
                        {tieneBeca && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Nombre de la Beca o Dependencia</label>
                            <input type="text" name="nombreBeca" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.nombreBeca} placeholder="Ej. Benito Juárez" />
                          </div>
                        )}`;

c = c.replace(insertionPoint, fieldsToInsert);
fs.writeFileSync('src/pages/public/PreInscripcion.jsx', c);
console.log("Injected Beca fields.");
