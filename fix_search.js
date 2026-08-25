const fs = require('fs');

const fixContraloria = () => {
    let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');
    
    // Add import if missing
    if (!code.includes("import { searchIncludes }")) {
        code = code.replace(/import \{ autoAcentuar \} from '\.\.\/\.\.\/utils\/format';/, "import { autoAcentuar } from '../../utils/format';\nimport { searchIncludes } from '../../utils/search';");
    }
    
    // Replace filteredPagos
    code = code.replace(
        /const normalizeStr = \(str\) => String\(str \|\| ""\)\.normalize\("NFD"\)\.replace\(\/\[\\u0300-\\u036f\]\/g, ""\)\.toLowerCase\(\);\s*const nombreBuscado = normalizeStr\(p\.alumno \|\| p\.nombre\);\s*const folioBuscado = normalizeStr\(p\.folio \|\| p\.id\);\s*const query = normalizeStr\(pagosSearch\);\s*const matchSearch = !pagosSearch \|\| nombreBuscado\.includes\(query\) \|\| folioBuscado\.includes\(query\);/g,
        "const matchSearch = !pagosSearch || searchIncludes(p.alumno || p.nombre || '', pagosSearch) || searchIncludes(p.folio || p.id || '', pagosSearch);"
    );

    // Replace filteredPagosGenerales
    code = code.replace(
        /const normalizeStr = \(str\) => String\(str \|\| ""\)\.normalize\("NFD"\)\.replace\(\/\[\\u0300-\\u036f\]\/g, ""\)\.toLowerCase\(\);\s*const nombreBuscado = normalizeStr\(p\.alumno \|\| p\.nombre\);\s*const folioBuscado = normalizeStr\(p\.folio \|\| p\.id\);\s*const query = normalizeStr\(pagosSearch\);\s*const matchesSearch = !pagosSearch \|\| nombreBuscado\.includes\(query\) \|\| folioBuscado\.includes\(query\);/g,
        "const matchesSearch = !pagosSearch || searchIncludes(p.alumno || p.nombre || '', pagosSearch) || searchIncludes(p.folio || p.id || '', pagosSearch);"
    );

    // Replace inventarioData
    code = code.replace(
        /const matchesSearch = !searchTerm \|\|\s*\(item\.codigo \|\| ''\)\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\|\s*\(item\.articulo \|\| ''\)\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\);/g,
        "const matchesSearch = !searchTerm || searchIncludes(item.codigo, searchTerm) || searchIncludes(item.articulo, searchTerm);"
    );

    // Replace filteredResguardos
    code = code.replace(
        /r\.resguardante\?\.toLowerCase\(\)\.includes\(resguardoSearch\.toLowerCase\(\)\) \|\|\s*r\.folio\?\.toLowerCase\(\)\.includes\(resguardoSearch\.toLowerCase\(\)\)/g,
        "searchIncludes(r.resguardante, resguardoSearch) || searchIncludes(r.folio, resguardoSearch)"
    );

    // There is also a student search in Modal
    code = code.replace(
        /const query = e\.target\.value\.toLowerCase\(\);\s*const matches = todosLosEstudiantes\.filter\(s => \(\\$\{s\.nombres\} \$\{s\.apellidoPaterno\} \$\{s\.apellidoMaterno\}\\)\.toLowerCase\(\)\.includes\(query\) \|\| s\.matricula\.toLowerCase\(\)\.includes\(query\)\);/g,
        "const query = e.target.value;\nconst matches = todosLosEstudiantes.filter(s => searchIncludes(${s.nombres}  , query) || searchIncludes(s.matricula, query));"
    );

    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
}

const fixInventario = () => {
    let code = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');
    
    // Add import if missing
    if (!code.includes("import { searchIncludes }")) {
        code = code.replace(/import \{ autoAcentuar \} from '\.\.\/\.\.\/utils\/format';/, "import { autoAcentuar } from '../../utils/format';\nimport { searchIncludes } from '../../utils/search';");
    }

    // Replace inventario filtering
    code = code.replace(
        /const matchesSearch = !searchTerm \|\|\s*\(item\.codigo \|\| ''\)\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\|\s*\(item\.articulo \|\| ''\)\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\);/g,
        "const matchesSearch = !searchTerm || searchIncludes(item.codigo, searchTerm) || searchIncludes(item.articulo, searchTerm);"
    );

    // Replace resguardos filtering
    code = code.replace(
        /r\.resguardante\?\.toLowerCase\(\)\.includes\(resguardoSearch\.toLowerCase\(\)\) \|\|\s*r\.folio\?\.toLowerCase\(\)\.includes\(resguardoSearch\.toLowerCase\(\)\)/g,
        "searchIncludes(r.resguardante, resguardoSearch) || searchIncludes(r.folio, resguardoSearch)"
    );

    fs.writeFileSync('src/pages/dashboard/Inventario.jsx', code);
}

fixContraloria();
fixInventario();
