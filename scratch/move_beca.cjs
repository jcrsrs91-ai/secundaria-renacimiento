const fs = require('fs');
let c = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');

// Also, the previous script injected the React version of the Beca. Let's remove it if it exists!
let myInjectedReactBeca = `                        <div>
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

c = c.replace(myInjectedReactBeca, "");


let becaRegex = /[ \t]*<div>[\s\S]*?Cuenta con alguna beca[\s\S]*?<\/div>\s*<div id="nombreBecaContainer"[\s\S]*?<\/div>/;
let match = c.match(becaRegex);

if (match) {
    c = c.replace(becaRegex, '');
    let insertPoint = 'defaultValue={studentData?.cp} />\n                        </div>';
    if (!c.includes(insertPoint)) {
        insertPoint = 'defaultValue={studentData?.cp} />\r\n                        </div>';
    }
    
    c = c.replace(insertPoint, insertPoint + '\n' + match[0]);
    fs.writeFileSync('src/pages/public/PreInscripcion.jsx', c);
    console.log('Moved beca fields');
} else {
    console.log('Beca fields not found in original spot');
}
