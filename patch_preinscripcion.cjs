const fs = require('fs');

let file = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');

// 1. Add states
file = file.replace(
  'const [photoFile, setPhotoFile] = useState(null);',
  `const [photoFile, setPhotoFile] = useState(null);
  const [actaFile, setActaFile] = useState(null);
  const [curpFile, setCurpFile] = useState(null);
  const [certificadoFile, setCertificadoFile] = useState(null);
  const [conductaFile, setConductaFile] = useState(null);`
);

// 2. Update handleSubmit
file = file.replace(
  /let fotoUrl = studentData\?\.fotoUrl \|\| null;[\s\S]*?fotoUrl = await getDownloadURL\(photoRef\);\s*\}/,
  `let fotoUrl = studentData?.fotoUrl || null;

      if (photoFile) {
        const photoRef = ref(storage, \`student_photos/\${data.curp}_\${Date.now()}\`);
        await uploadBytes(photoRef, photoFile);
        fotoUrl = await getDownloadURL(photoRef);
      }

      let documentos = studentData?.documentos || {};
      
      const uploadDoc = async (fileObj, docName) => {
        if (fileObj) {
          const docRef = ref(storage, \`student_docs/\${data.curp}/\${docName}_\${Date.now()}.pdf\`);
          await uploadBytes(docRef, fileObj);
          const url = await getDownloadURL(docRef);
          documentos[docName] = true;
          return url;
        }
        return studentData?.[docName + 'Url'] || null;
      };

      const actaUrl = await uploadDoc(actaFile, 'acta');
      const curpUrl = await uploadDoc(curpFile, 'curp');
      const certificadoUrl = await uploadDoc(certificadoFile, 'certificado');
      const conductaUrl = await uploadDoc(conductaFile, 'conducta');`
);

// 3. Add to submissionData
file = file.replace(
  /const submissionData = \{[\s\S]*?fotoUrl,/,
  `const submissionData = {
        ...studentData,
        ...data,
        fotoUrl,
        actaUrl,
        curpUrl,
        certificadoUrl,
        conductaUrl,
        documentos,`
);

// 4. Add Ciclo Escolar UI
file = file.replace(
  /\{\/\* Fotografía \*\/\}/,
  `{/* Ciclo Escolar */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Ciclo Escolar</h3>
                  <p className="text-sm text-slate-500 mb-4">Selecciona el ciclo escolar para este trámite.</p>
                  <select name="cicloEscolar" className="block w-full rounded-md shadow-sm p-3 border border-slate-300 font-medium" required defaultValue={studentData?.cicloEscolar || "2026-2027"}>
                    <option value="">Seleccionar ciclo...</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                    <option value="2027-2028">2027-2028</option>
                    <option value="2028-2029">2028-2029</option>
                  </select>
                </div>

                {/* Fotografía */}`
);

// 5. Add escuela fields
file = file.replace(
  /\{activeTab === 'nuevo' && \([\s\S]*?<label className="block text-sm font-medium">Escuela de Procedencia<\/label>\s*<input type="text" name="escuelaProcedencia" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required \/>\s*<\/div>\s*\)\}/,
  `{activeTab === 'nuevo' && (
                      <>
                        <div className="md:col-span-4">
                          <label className="block text-sm font-medium">Escuela de Procedencia</label>
                          <input type="text" name="escuelaProcedencia" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.escuelaProcedencia} />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium">Domicilio de la Escuela</label>
                          <input type="text" name="domicilioEscuela" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.domicilioEscuela} />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium">Promedio Obtenido</label>
                          <input type="text" name="promedioEscuela" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.promedioEscuela} />
                        </div>
                      </>
                    )}`
);

// 6. Add PDF Document section before the submit button
file = file.replace(
  /<div className="pt-6 border-t border-slate-200 flex justify-between items-center">/,
  `{/* 5. Documentación Digital */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">5. Documentación Digital en PDF</h3>
                  <p className="text-sm text-slate-500 mb-4">Solo se aceptan archivos en formato PDF.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="bg-slate-50 p-4 border rounded-lg">
                      <label className="block text-sm font-bold mb-1">Acta de Nacimiento <span className="text-red-500">*</span></label>
                      <input type="file" accept="application/pdf" onChange={e => setActaFile(e.target.files[0])} className="w-full text-sm" required={!studentData?.actaUrl} />
                      {actaFile && <p className="text-xs text-emerald-600 mt-1">{actaFile.name}</p>}
                      {studentData?.actaUrl && !actaFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-lg">
                      <label className="block text-sm font-bold mb-1">CURP (Actualizada) <span className="text-red-500">*</span></label>
                      <input type="file" accept="application/pdf" onChange={e => setCurpFile(e.target.files[0])} className="w-full text-sm" required={!studentData?.curpUrl} />
                      {curpFile && <p className="text-xs text-emerald-600 mt-1">{curpFile.name}</p>}
                      {studentData?.curpUrl && !curpFile && <p className="text-xs text-blue-600 mt-1">Ya cargada previamente.</p>}
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-lg">
                      <label className="block text-sm font-bold mb-1">Certificado de Primaria <span className="text-slate-400 font-normal">(Opcional)</span></label>
                      <input type="file" accept="application/pdf" onChange={e => setCertificadoFile(e.target.files[0])} className="w-full text-sm" />
                      {certificadoFile && <p className="text-xs text-emerald-600 mt-1">{certificadoFile.name}</p>}
                      {studentData?.certificadoUrl && !certificadoFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-lg">
                      <label className="block text-sm font-bold mb-1">Carta de Conducta <span className="text-slate-400 font-normal">(Opcional)</span></label>
                      <input type="file" accept="application/pdf" onChange={e => setConductaFile(e.target.files[0])} className="w-full text-sm" />
                      {conductaFile && <p className="text-xs text-emerald-600 mt-1">{conductaFile.name}</p>}
                      {studentData?.conductaUrl && !conductaFile && <p className="text-xs text-blue-600 mt-1">Ya cargada previamente.</p>}
                    </div>

                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex justify-between items-center">`
);

// 7. Change button text
file = file.replace(
  /\{isSubmitting \? 'Guardando...' : 'Guardar y Generar Ficha'\}/,
  `{isSubmitting ? 'Guardando archivos...' : 'Guardar y Generar Ficha'}`
);

fs.writeFileSync('src/pages/public/PreInscripcion.jsx', file);
console.log('PreInscripcion updated.');
