const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// 1. Add useMemo if missing
if (!code.includes('useMemo')) {
  code = code.replace("import { useState, useEffect }", "import { useState, useEffect, useMemo }");
}

// 2. Find where inventario is defined and add uniqueUbicaciones after it
const invDecl = "const [inventario, setInventario] = useState([";
if (code.includes(invDecl)) {
  const nextLineIdx = code.indexOf('\n', code.indexOf(invDecl) + invDecl.length);
  // Wait, inventario has a long initialization array. We should just put uniqueUbicaciones after the whole thing.
  // Better yet, put it right before `const handleGenerate = (e) => {`
  const handleGen = "const handleGenerate = (e) => {";
  const uniqueUbicacionesCode = `
  const uniqueUbicaciones = useMemo(() => {
    const ubs = new Set();
    inventario.forEach(item => {
      if (item.ubicacion && typeof item.ubicacion === 'string' && item.ubicacion.trim()) {
        ubs.add(item.ubicacion.trim());
      }
    });
    resguardos.forEach(res => {
      res.articulos?.forEach(art => {
         if (art.ubicacion && typeof art.ubicacion === 'string' && art.ubicacion.trim()) {
            ubs.add(art.ubicacion.trim());
         }
      });
    });
    return Array.from(ubs).sort();
  }, [inventario, resguardos]);

`;
  if (!code.includes('uniqueUbicaciones = useMemo')) {
      code = code.replace(handleGen, uniqueUbicacionesCode + handleGen);
  }
}

// 3. Find the modal rendering block and add the <datalist> before the `</div>` that ends the page.
// Wait, we can just put the <datalist> inside the main return statement of the component.
const topLevelDiv = `<div className="p-8 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50/50">`;
const datalistHTML = `
      <datalist id="ubicaciones-list">
        {uniqueUbicaciones.map((ub, i) => (
          <option key={i} value={ub} />
        ))}
      </datalist>
`;
if (!code.includes('<datalist id="ubicaciones-list">')) {
  code = code.replace(topLevelDiv, topLevelDiv + datalistHTML);
}

// 4. Update the input fields for Ubicación to use the datalist
// First, in editItem: 
code = code.replace(/<input type="text" value={editingItem\.ubicacion \|\| ''} onChange=\{e => setEditingItem\(\{\.\.\.editingItem, ubicacion: e\.target\.value\}\)\} className="w-full p-2 border rounded text-sm" \/>/g, 
  '<input type="text" list="ubicaciones-list" value={editingItem.ubicacion || \'\'} onChange={e => setEditingItem({...editingItem, ubicacion: e.target.value})} className="w-full p-2 border rounded text-sm" />');

// Second, in formData (baja):
code = code.replace(/<input type="text" placeholder="Ubicación" className="w-full rounded-md border-slate-300 text-sm" value=\{art\.ubicacion \|\| ''\} onChange=\{\(e\) => \{\s*const newArts = \[\.\.\.formData\.articulos\];\s*newArts\[idx\]\.ubicacion = e\.target\.value;\s*setFormData\(\{\.\.\.formData, articulos: newArts\}\);\s*\}\} \/>/g,
  '<input type="text" list="ubicaciones-list" placeholder="Ubicación" className="w-full rounded-md border-slate-300 text-sm" value={art.ubicacion || \'\'} onChange={(e) => { const newArts = [...formData.articulos]; newArts[idx].ubicacion = e.target.value; setFormData({...formData, articulos: newArts}); }} />');


// 5. Update the "Catálogo de Bienes" table to show Marca, Modelo, Serie, Observaciones
const oldCatalogoRow = `<td className="px-6 py-4 text-sm text-slate-600">{item.articulo}</td>`;
const newCatalogoRow = `<td className="px-6 py-4 text-sm text-slate-600">
                        <div className="font-semibold text-slate-800">{item.articulo}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {[item.marca, item.modelo, item.serie && \`S/N: \${item.serie}\`].filter(Boolean).join(' • ')}
                        </div>
                        {item.observaciones && <div className="text-[10px] italic text-slate-400 mt-0.5 text-justify leading-tight">{item.observaciones}</div>}
                      </td>`;

code = code.replace(oldCatalogoRow, newCatalogoRow);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
console.log('Update complete!');
