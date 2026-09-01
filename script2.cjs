const fs = require('fs');
let code = fs.readFileSync('src/components/MatriculaGruposPrint.jsx', 'utf8');
code = code.replace(
  '<div className=" flex justify-center mb-8 gap-4 print:hidden no-print\>\n <button onClick={() => window.print()}',
 '<div className=\flex justify-center items-center mb-8 gap-4 print:hidden no-print\>\n <select \n value={selectedGrado} \n onChange={(e) => setSelectedGrado(e.target.value)}\n className=\p-2.5 rounded-lg border border-slate-300 font-medium bg-white text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500\\n >\n <option value=\Todos\>Todos los Grados</option>\n <option value=\1er Grado\>1er Grado</option>\n <option value=\2do Grado\>2do Grado</option>\n <option value=\3er Grado\>3er Grado</option>\n </select>\n <button onClick={() => window.print()}'
);
fs.writeFileSync('src/components/MatriculaGruposPrint.jsx', code);