const fs = require('fs');
const file = 'src/pages/dashboard/Inventario.jsx';
let txt = fs.readFileSync(file, 'utf8');

// Fix Modal width
txt = txt.replace(
    "(modalOpen === 'editItem' || modalOpen === 'editResguardo') ? 'max-w-lg' : 'max-w-4xl'",
    "modalOpen === 'editItem' ? 'max-w-lg' : 'max-w-4xl'"
);

// Fix Print Button
const searchStr = '<button \n                          onClick={() => {\n                            setEditingResguardo(r);\n                            setModalOpen(\'editResguardo\');\n                          }}\n                          className="text-primary-600 hover:text-primary-800 font-medium text-xs"\n                        >\n                          Ver / Editar\n                        </button>';

// Let's use a regex to match the button without caring about newlines/spaces exactly
const regex = /<button[^>]+onClick={\(\) => {\s*setEditingResguardo\(r\);\s*setModalOpen\('editResguardo'\);\s*}}[^>]+>[\s\S]*?Ver \/ Editar[\s\S]*?<\/button>/g;

if (regex.test(txt)) {
    txt = txt.replace(regex, (match) => {
        return match + '\n                        <button onClick={() => { setPrintData(r); setPrintMode("resguardo"); }} className="ml-4 text-indigo-600 hover:text-indigo-800 font-medium text-xs">Imprimir PDF</button>';
    });
    console.log('Successfully replaced print button!');
} else {
    console.log('REGEX FAILED TO MATCH');
}

// Make sure inputs inside the edit modal wrap on mobile
// In editResguardo form, there are two divs with "flex gap-2 mb-2" and "flex gap-2"
// I will change them to flex-wrap
const flexWrapRegex = /<div className="flex gap-2 mb-2">/g;
txt = txt.replace(flexWrapRegex, '<div className="flex flex-col sm:flex-row gap-2 mb-2">');

const flexWrapRegex2 = /<div className="flex gap-2">/g;
txt = txt.replace(flexWrapRegex2, '<div className="flex flex-col sm:flex-row gap-2">');

fs.writeFileSync(file, txt, 'utf8');
