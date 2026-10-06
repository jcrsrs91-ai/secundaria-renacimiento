const fs = require('fs');
let content = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const section4Block = `
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
`;

const insertPoint = /\s*\{\/\* V\. ALUMNADO Y GRUPOS/;

if (content.match(insertPoint)) {
  content = content.replace(insertPoint, `\n${section4Block}\n        {/* V. ALUMNADO Y GRUPOS`);
  fs.writeFileSync('src/components/Formato911.jsx', content, 'utf8');
  console.log('Section IV injected.');
} else {
  console.log('Could not find insert point.');
}
