const fs = require('fs');
const path = require('path');

const originPath = path.join(__dirname, 'src/components/MatriculaPrint.jsx');
const destPath = path.join(__dirname, 'src/components/MatriculaGruposPrint.jsx');

let code = fs.readFileSync(originPath, 'utf8');

// Replace function name
code = code.replace(/export default function MatriculaPrint/g, 'export default function MatriculaGruposPrint');

// Replace Title
code = code.replace(/ESTADÍSTICA DE MATRÍCULA GENERAL/g, 'ESTADÍSTICA DE MATRÍCULA POR GRUPOS');

// Replace logic
const newLogic = \  const matriculaData = useMemo(() => {
    const grados = ['1er Grado', '2do Grado', '3er Grado'];
    const turnos = ['Matutino', 'Vespertino'];
    
    // Objeto inicial
    const data = {
      global: { grupos: new Set(), inicial: { h:0, m:0, t:0 }, altas: { h:0, m:0, t:0 }, bajas: { h:0, m:0, t:0 }, existencia: { h:0, m:0, t:0 } }
    };

    grados.forEach(grado => {
      data[grado] = { grupos: new Set(), inicial: { h:0, m:0, t:0 }, altas: { h:0, m:0, t:0 }, bajas: { h:0, m:0, t:0 }, existencia: { h:0, m:0, t:0 } };
      turnos.forEach(turno => {
        data[\\-\\] = { grupos: new Set(), inicial: { h:0, m:0, t:0 }, altas: { h:0, m:0, t:0 }, bajas: { h:0, m:0, t:0 }, existencia: { h:0, m:0, t:0 } };
      });
    });

    alumnos.forEach(a => {
      const grado = a.grado || '1er Grado';
      const turno = a.turno || 'Matutino';
      const grupo = a.grupo || 'A';
      const status = (a.status || 'Activo').toLowerCase();
      // Normalizar genero a H o M
      const genRaw = (a.genero || a.sexo || 'H').toUpperCase();
      const genero = genRaw.startsWith('M') && genRaw !== 'MASCULINO' ? 'M' : 
                     genRaw.startsWith('F') ? 'M' : 'H';

      const key = \\-\\;
      const groupKey = \\-\-\\;
      
      if (!data[key]) return;
      if (!data[groupKey]) {
         data[groupKey] = { inicial: { h:0, m:0, t:0 }, altas: { h:0, m:0, t:0 }, bajas: { h:0, m:0, t:0 }, existencia: { h:0, m:0, t:0 } };
      }

      // Registrar grupo
      if (status === 'activo' || status === 'egresado') {
        data[key].grupos.add(grupo);
        data[grado].grupos.add(\\-\\);
        data.global.grupos.add(\\-\-\\);
      }

      const isAlta = a.tipoIngreso === 'Alta';
      const isBaja = status === 'baja';
      const isActivo = status === 'activo' || status === 'egresado'; // Consideramos egresados como activos que terminaron

      const updateStats = (target) => {
         if (isAlta) {
           target.altas[genero.toLowerCase()]++;
           target.altas.t++;
         }
         if (isBaja) {
           target.bajas[genero.toLowerCase()]++;
           target.bajas.t++;
         } else if (isActivo) {
           target.existencia[genero.toLowerCase()]++;
           target.existencia.t++;
         }
      };

      updateStats(data[groupKey]);
      updateStats(data[key]);
      updateStats(data[grado]);
      updateStats(data.global);
    });

    // Calcular Inicial
    Object.keys(data).forEach(k => {
      ['h', 'm', 't'].forEach(g => {
        data[k].inicial[g] = data[k].existencia[g] + data[k].bajas[g] - data[k].altas[g];
      });
    });

    return data;
  }, [alumnos]);\;

code = code.replace(/  const matriculaData = useMemo\(\(\) => \{[\s\S]*?return data;\n  \}, \[alumnos\]\);/, newLogic);

// Replace renderRow to accept 'isGroup'
const newRenderRow = \  const renderRow = (label, key, isTotal = false, isGlobal = false, isGroup = false) => {
    const d = matriculaData[key];
    if (!d) return null;
    const baseClasses = isGlobal 
      ? 'bg-indigo-100 font-black text-indigo-900 border-t-2 border-indigo-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-black' 
      : isTotal 
        ? 'bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300 print:bg-slate-200 print:text-black print:border-black' 
        : isGroup
        ? 'hover:bg-slate-50 transition-colors text-slate-600 text-sm print:text-black'
        : 'bg-indigo-50 font-semibold text-slate-700 border-t border-slate-200 print:bg-slate-100 print:text-black';

    return (
      <tr className={baseClasses} key={key}>
        <td colSpan={isTotal || isGlobal ? 2 : 1} className={\px-3 py-2 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1 \\}>{label}</td>
        {(!isTotal && !isGlobal) && <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{isGroup ? '-' : (d.grupos.size || '-')}</td>}
        
        {/* Inicial */}
        <td className="px-2 py-2 text-center bg-blue-50/30 print:bg-transparent border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.inicial.h || '-'}</td>
        <td className="px-2 py-2 text-center bg-pink-50/30 print:bg-transparent border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.inicial.m || '-'}</td>
        <td className="px-2 py-2 text-center font-bold bg-slate-50 border-r border-slate-300 print:bg-transparent print:border-slate-400 print:px-1 print:py-1">{d.inicial.t || '-'}</td>
        
        {/* Altas */}
        <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.altas.h || '-'}</td>
        <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.altas.m || '-'}</td>
        <td className="px-2 py-2 text-center font-bold bg-slate-50 border-r border-slate-300 print:bg-transparent print:border-slate-400 print:px-1 print:py-1">{d.altas.t || '-'}</td>
        
        {/* Bajas */}
        <td className="px-2 py-2 text-center text-red-600 print:text-black border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.bajas.h || '-'}</td>
        <td className="px-2 py-2 text-center text-red-600 print:text-black border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.bajas.m || '-'}</td>
        <td className="px-2 py-2 text-center font-bold text-red-700 bg-red-50 print:bg-transparent print:text-black border-r border-slate-300 print:border-slate-400 print:px-1 print:py-1">{d.bajas.t || '-'}</td>
        
        {/* Existencia */}
        <td className="px-2 py-2 text-center text-emerald-600 print:text-black border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.existencia.h || '-'}</td>
        <td className="px-2 py-2 text-center text-emerald-600 print:text-black border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.existencia.m || '-'}</td>
        <td className="px-2 py-2 text-center font-bold text-emerald-700 bg-emerald-50 print:bg-transparent print:text-black border-r border-slate-300 print:border-slate-400 print:px-1 print:py-1">{d.existencia.t || '-'}</td>
        
        {/* Deserción */}
        <td className="px-2 py-2 text-center font-bold text-orange-600 print:text-black print:px-1 print:py-1">{calcDesercion(d.bajas.t, d.inicial.t, d.altas.t)}</td>
      </tr>
    );
  };
\;

code = code.replace(/  const renderRow = \([\s\S]*?\);[\s\n]*\};/, newRenderRow);

// Add render groups helper function
const helperGroups = \  const renderTurnoWithGroups = (grado, turno) => {
    const key = \\-\\;
    const d = matriculaData[key];
    if (!d || d.existencia.t === 0 && d.bajas.t === 0 && d.altas.t === 0) return null;
    
    const rows = [];
    const grupos = Array.from(d.grupos).sort();
    
    grupos.forEach(grupo => {
       const groupKey = \\-\-\\;
       if (matriculaData[groupKey]) {
          rows.push(renderRow(\Grupo \\, groupKey, false, false, true));
       }
    });
    
    rows.push(renderRow(\Total \\, key, false, false, false));
    return rows;
  };\;

code = code.replace(/(  return \()/ , helperGroups + "\n");

// Replace the table body block for PRIMER GRADO
const newPrimer = \              {/* PRIMER GRADO */}
              <tr>
                <td rowSpan={matriculaData['1er Grado-Matutino']?.grupos.size + matriculaData['1er Grado-Vespertino']?.grupos.size + 3} className="px-3 py-2 text-center font-bold text-slate-800 border-r border-slate-200 bg-slate-50 print:border-slate-400 print:bg-slate-100 align-middle">1ER GRADO</td>
              </tr>
              {renderTurnoWithGroups('1er Grado', 'Matutino')}
              {renderTurnoWithGroups('1er Grado', 'Vespertino')}
              {renderRow('TOTALES 1ER GRADO', '1er Grado', true)}\;
code = code.replace(/\{\/\* PRIMER GRADO \*\/\}[\s\S]*?\{renderRow\('TOTALES 1ER GRADO', '1er Grado', true\)\}/, newPrimer);

// Replace the table body block for SEGUNDO GRADO
const newSegundo = \              {/* SEGUNDO GRADO */}
              <tr>
                <td rowSpan={matriculaData['2do Grado-Matutino']?.grupos.size + matriculaData['2do Grado-Vespertino']?.grupos.size + 3} className="px-3 py-2 text-center font-bold text-slate-800 border-r border-slate-200 border-t border-slate-300 bg-slate-50 print:border-slate-400 print:bg-slate-100 align-middle">2DO GRADO</td>
              </tr>
              {renderTurnoWithGroups('2do Grado', 'Matutino')}
              {renderTurnoWithGroups('2do Grado', 'Vespertino')}
              {renderRow('TOTALES 2DO GRADO', '2do Grado', true)}\;
code = code.replace(/\{\/\* SEGUNDO GRADO \*\/\}[\s\S]*?\{renderRow\('TOTALES 2DO GRADO', '2do Grado', true\)\}/, newSegundo);

// Replace the table body block for TERCER GRADO
const newTercer = \              {/* TERCER GRADO */}
              <tr>
                <td rowSpan={matriculaData['3er Grado-Matutino']?.grupos.size + matriculaData['3er Grado-Vespertino']?.grupos.size + 3} className="px-3 py-2 text-center font-bold text-slate-800 border-r border-slate-200 border-t border-slate-300 bg-slate-50 print:border-slate-400 print:bg-slate-100 align-middle">3ER GRADO</td>
              </tr>
              {renderTurnoWithGroups('3er Grado', 'Matutino')}
              {renderTurnoWithGroups('3er Grado', 'Vespertino')}
              {renderRow('TOTALES 3ER GRADO', '3er Grado', true)}\;
code = code.replace(/\{\/\* TERCER GRADO \*\/\}[\s\S]*?\{renderRow\('TOTALES 3ER GRADO', '3er Grado', true\)\}/, newTercer);

fs.writeFileSync(destPath, code, 'utf8');
console.log("Successfully generated MatriculaGruposPrint.jsx");
