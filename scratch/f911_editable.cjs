const fs = require('fs');
let content = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

// 1. Add Firebase imports
if (!content.includes('import { doc,')) {
  content = content.replace(
    /import \{ useState, useMemo \} from 'react';/,
    `import { useState, useMemo, useEffect, useRef } from 'react';\nimport { doc, getDoc, setDoc } from 'firebase/firestore';\nimport { db } from '../firebase/config';\nimport toast from 'react-hot-toast';`
  );
} else {
  if (!content.includes('useRef')) {
    content = content.replace(/import \{ useState, useMemo \}/, 'import { useState, useMemo, useEffect, useRef }');
  }
}

// 2. Make all zero cells editable
content = content.replace(
  /className="([^"]+)"(>0<\/td>)/g,
  `className="$1 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning$2`
);

// There is one edge case: <td className="border border-slate-300 p-2">{row.sub ? '0' : ''}</td>
content = content.replace(
  /className="border border-slate-300 p-2">(.*?\{row\.sub \? '0' : ''\}.*?)<\/td>/g,
  `className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable={row.sub} suppressContentEditableWarning>$1</td>`
);


// 3. Add Save/Load logic to component
const logic = `
  const [shiftFilter, setShiftFilter] = useState('Ambos');
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Load saved data
    const loadData = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'configuracion', 'formato911_historico'));
        if (docSnap.exists() && containerRef.current) {
          const { tablesData } = docSnap.data();
          const tables = containerRef.current.querySelectorAll('table');
          tablesData.forEach((tableData, tIdx) => {
            const table = tables[tIdx];
            if (table) {
              const trs = table.querySelectorAll('tbody tr');
              tableData.forEach((rowData, rIdx) => {
                const tr = trs[rIdx];
                if (tr) {
                  const tds = tr.querySelectorAll('td');
                  let dataCellIndex = 0;
                  // Only restore values to the data cells
                  tds.forEach((td) => {
                    if (td.classList.contains('data-cell') || td.hasAttribute('contenteditable')) {
                      if (rowData[dataCellIndex] !== undefined) {
                        td.innerText = rowData[dataCellIndex];
                      }
                      dataCellIndex++;
                    }
                  });
                }
              });
            }
          });
        }
      } catch (err) {
        console.error("Error loading 911 data", err);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    if (!containerRef.current) return;
    setIsSaving(true);
    try {
      const tables = containerRef.current.querySelectorAll('table');
      const data = Array.from(tables).map(table => {
        return Array.from(table.querySelectorAll('tbody tr')).map(tr => {
          return Array.from(tr.querySelectorAll('td'))
            .filter(td => td.classList.contains('data-cell') || td.hasAttribute('contenteditable'))
            .map(td => td.innerText.trim());
        });
      });
      await setDoc(doc(db, 'configuracion', 'formato911_historico'), { tablesData: data, updatedAt: new Date() });
      toast.success('Datos del Formato 911 guardados correctamente.');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar los datos.');
    } finally {
      setIsSaving(false);
    }
  };
`;

content = content.replace(/const \[shiftFilter, setShiftFilter\] = useState\('Ambos'\);/, logic);

// Add Save Button and ref
content = content.replace(
  /<div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-6">/,
  `<div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 f911-container" ref={containerRef}>`
);

content = content.replace(
  /<button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">\s*<Download className="w-4 h-4" \/> Imprimir Formatos\s*<\/button>/,
  `<button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50">
            {isSaving ? 'Guardando...' : 'Guardar Datos'}
          </button>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Imprimir Formatos
          </button>`
);

fs.writeFileSync('src/components/Formato911.jsx', content, 'utf8');
console.log('Editable grid injected!');
