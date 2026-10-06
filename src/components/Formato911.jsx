import React from 'react';
import { useState, useMemo } from 'react';
import { FileText, Download, Filter } from 'lucide-react';

export default function Formato911({ rawActivos }) {
  const [shiftFilter, setShiftFilter] = useState('Ambos');

  const activos = useMemo(() => {
    if (!rawActivos) return [];
    if (shiftFilter === 'Ambos') return rawActivos;
    return rawActivos.filter(a => a.turno === shiftFilter);
  }, [rawActivos, shiftFilter]);
  // En la Fase 2, aquí irán todas las lógicas matemáticas para procesar "activos"
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            Estadística 911 (Secundaria 911.5)
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Formatos oficiales para captura. Selecciona el turno a consultar.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4 items-center">
          <div className="flex items-center bg-white rounded-lg border border-slate-300 p-1 shadow-sm">
             <Filter className="w-4 h-4 text-slate-400 mx-2" />
             <span className="text-xs font-medium text-slate-500 pr-2 border-r border-slate-200">Turno de Reporte:</span>
             <select 
               className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none cursor-pointer pl-2 pr-4 py-1"
               value={shiftFilter}
               onChange={e => setShiftFilter(e.target.value)}
             >
                <option value="Ambos">Global (Ambos Turnos)</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
             </select>
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Imprimir Formatos
          </button>
        </div>
      </div>

      <div className="space-y-12">
        
        {/* I. EXISTENCIA Y PROMOVIDOS */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 bg-slate-100 p-2 rounded">I. EXISTENCIA Y PROMOVIDOS</h3>
          
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">1. Existentes al final del ciclo (por grado, sexo, y condiciones)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Grado</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Grupos</th>
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                    <th className="border border-slate-300 p-2">Afrodescendientes</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Con trastorno</th>
                    <th className="border border-slate-300 p-2">Aptitudes Sobresal.</th>
                    <th className="border border-slate-300 p-2">Otras condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">2. Promovidos (por grado, sexo, y condiciones)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Grado</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                    <th className="border border-slate-300 p-2">Afrodescendientes</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Con trastorno</th>
                    <th className="border border-slate-300 p-2">Aptitudes Sobresal.</th>
                    <th className="border border-slate-300 p-2">Otras condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* II. ALUMNADO QUE PROVIENE DE OTRA ESCUELA */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 bg-slate-100 p-2 rounded">II. ALUMNADO QUE PROVIENE DE OTRA ESCUELA</h3>
          
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">1. Procedencia por grado y sexo</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[700px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2" rowSpan="2">Grado / Tipo</th>
                    <th className="border border-slate-300 p-2" colSpan="2">Misma entidad</th>
                    <th className="border border-slate-300 p-2" colSpan="2">Otra entidad</th>
                    <th className="border border-slate-300 p-2" colSpan="2">Otro país</th>
                    <th className="border border-slate-300 p-2 bg-slate-100" colSpan="2">Total</th>
                  </tr>
                  <tr>
                    <th className="border border-slate-300 p-1">Hombres</th>
                    <th className="border border-slate-300 p-1">Mujeres</th>
                    <th className="border border-slate-300 p-1">Hombres</th>
                    <th className="border border-slate-300 p-1">Mujeres</th>
                    <th className="border border-slate-300 p-1">Hombres</th>
                    <th className="border border-slate-300 p-1">Mujeres</th>
                    <th className="border border-slate-300 p-1 bg-slate-100">Hombres</th>
                    <th className="border border-slate-300 p-1 bg-slate-100">Mujeres</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left">1o. Nvo. Ingreso</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">0</td><td className="border border-slate-300 p-2 bg-slate-100">0</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left">1o. Repetidor</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">0</td><td className="border border-slate-300 p-2 bg-slate-100">0</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left">2o.</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">0</td><td className="border border-slate-300 p-2 bg-slate-100">0</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left">3o.</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">0</td><td className="border border-slate-300 p-2 bg-slate-100">0</td>
                  </tr>
                  <tr className="font-bold bg-slate-50">
                    <td className="border border-slate-300 p-2 text-left">Total</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td><td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">0</td><td className="border border-slate-300 p-2 bg-slate-100">0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

          <div className="mt-8 mb-6">
            <p className="text-sm font-semibold mb-2">2. De las alumnas y alumnos provenientes de escuelas de otro país reportados en la pregunta anterior, desglóselos según el país o lugar y sexo.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-2xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">País o lugar</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {['Estados Unidos', 'Canadá', 'Centroamérica y el Caribe', 'Sudamérica', 'África', 'Asia', 'Europa', 'Oceanía', 'Total'].map((lugar, i) => (
                    <tr key={i} className={lugar === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{lugar}</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        {/* III. BECAS */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 bg-slate-100 p-2 rounded">III. BECAS</h3>
          
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">1. Alumnado con y sin beca</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-4xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Estatus</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                  </tr>
                </thead>
                <tbody>
                  {['Con Beca', 'Sin Beca', 'Total'].map((g, i) => (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{g}</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 mb-6">
            <p className="text-sm font-semibold mb-2">2. Escriba por sexo, el número de alumnas y alumnos con beca reportados en la pregunta anterior, y desglóselos según el origen de la beca.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-4xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">Origen de la beca</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Becas federales', isHeader: true },
                    { label: 'Beca Rita Cetina' },
                    { label: 'Otra* (*Especifique: _________)' },
                    { label: 'Total becas federales', isSubtotal: true },
                    { label: 'Otras becas', isHeader: true },
                    { label: 'Beca estatal' },
                    { label: 'Beca de fundaciones y asociaciones civiles' },
                    { label: 'Beca de la propia escuela' },
                    { label: 'Beca particular' },
                    { label: 'Beca municipal' },
                    { label: 'Otras* (*Especifique: _________)' },
                    { label: 'Total de becas', isSubtotal: true }
                  ].map((beca, i) => (
                    <tr key={i} className={beca.isSubtotal ? 'font-bold bg-slate-50' : beca.isHeader ? 'font-bold bg-slate-100' : ''}>
                      <td className={`border border-slate-300 p-2 text-left ${beca.isHeader ? 'uppercase text-slate-700' : beca.isSubtotal ? '' : 'pl-6'}`}>{beca.label}</td>
                      <td className="border border-slate-300 p-2">{beca.isHeader ? '' : '0'}</td>
                      <td className="border border-slate-300 p-2">{beca.isHeader ? '' : '0'}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">{beca.isHeader ? '' : '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* IV. ABANDONO ESCOLAR Y SUS CAUSAS */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 bg-slate-100 p-2 rounded">IV. ABANDONO ESCOLAR Y SUS CAUSAS</h3>
          
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">1. Escriba por sexo el número de alumnos que no concluyeron el ciclo escolar en esta escuela.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-lg">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">2. Escriba por sexo, el número de alumnos reportados en la pregunta anterior, según el motivo principal por el que no concluyeron el ciclo escolar. (Registre a cada alumno en un solo motivo).</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-4xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">Motivo por el que no concluyó el ciclo escolar</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Acoso escolar (Bullying)',
                    'Baja administrativa (disciplina)',
                    'Baja temporal',
                    'Cambio de escuela',
                    'Cambio de residencia',
                    'Consumo y/o abuso de sustancias',
                    'Desinterés/falta de motivación',
                    'Desplazamiento forzado o crisis humanitaria',
                    'Desvinculación de la familia con la escuela',
                    'Distancia o dificultad para llegar a la escuela',
                    'Embarazo o unión conyugal temprana',
                    'Enfermedad o incapacidad sin apoyo suficiente',
                    'Falta de recursos para transporte, uniforme, materiales o alimentación',
                    'Falta de tiempo para brindar atención diferenciada',
                    'Malas condiciones de las instalaciones escolares',
                    'Migración del alumno o de la familia',
                    'Necesidad de trabajar para apoyar la economía familiar',
                    'Problemas con el bienestar emocional o autoestima',
                    'Problemas familiares/violencia intrafamiliar',
                    'Rezago en los aprendizajes',
                    'Violencia/inseguridad del entorno',
                    'Se desconoce el motivo',
                    'Otros* (* Especifique: ___________________)'
                  ].map((motivo, i) => (
                    <tr key={i}>
                      <td className="border border-slate-300 p-2 text-left">{motivo}</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2">0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* V. ALUMNADO Y GRUPOS (Edades) */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 bg-slate-100 p-2 rounded">V. ALUMNADO Y GRUPOS POR EDAD</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border border-slate-300 p-2">Grado / Sexo</th>
                  <th className="border border-slate-300 p-2">Menos 12</th>
                  <th className="border border-slate-300 p-2">12 años</th>
                  <th className="border border-slate-300 p-2">13 años</th>
                  <th className="border border-slate-300 p-2">14 años</th>
                  <th className="border border-slate-300 p-2">15 años</th>
                  <th className="border border-slate-300 p-2">16 años</th>
                  <th className="border border-slate-300 p-2">17 años</th>
                  <th className="border border-slate-300 p-2">18 o más</th>
                  <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  <th className="border border-slate-300 p-2">Grupos</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "1° Hombres Nvo.", g: '1' }, { label: "1° Hombres Rep.", g: '1' },
                  { label: "1° Mujeres Nvo.", g: '1' }, { label: "1° Mujeres Rep.", g: '1' },
                  { label: "Subtotal 1°", g: '1', sub: true },
                  { label: "2° Hombres Nvo.", g: '2' }, { label: "2° Hombres Rep.", g: '2' },
                  { label: "2° Mujeres Nvo.", g: '2' }, { label: "2° Mujeres Rep.", g: '2' },
                  { label: "Subtotal 2°", g: '2', sub: true },
                  { label: "3° Hombres Nvo.", g: '3' }, { label: "3° Hombres Rep.", g: '3' },
                  { label: "3° Mujeres Nvo.", g: '3' }, { label: "3° Mujeres Rep.", g: '3' },
                  { label: "Subtotal 3°", g: '3', sub: true },
                ].map((row, i) => (
                  <tr key={i} className={row.sub ? 'font-bold bg-slate-50' : ''}>
                    <td className="border border-slate-300 p-2 text-left">{row.label}</td>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2">0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">0</td>
                    <td className="border border-slate-300 p-2">{row.sub ? '0' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
