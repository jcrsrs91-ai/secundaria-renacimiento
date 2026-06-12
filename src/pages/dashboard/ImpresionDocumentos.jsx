import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Printer, Save, CheckCircle, Users } from 'lucide-react';

const numeroALetras = (numStr) => {
  if (!numStr) return "";
  const num = parseFloat(numStr);
  if (isNaN(num)) return "";
  if (num === 10) return "DIEZ PUNTO CERO";
  
  const enteros = ["CERO", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE", "DIEZ"];
  const decimales = ["CERO", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 10);
  
  if (intPart < 0 || intPart > 10) return "";
  
  return `${enteros[intPart]} PUNTO ${decimales[decPart]}`;
};

const extraerFechaDeCurp = (curp) => {
  if (!curp || curp.length < 10) return null;
  const yy = curp.substring(4, 6);
  const mm = curp.substring(6, 8);
  const dd = curp.substring(8, 10);
  if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return null;
  const yearNum = parseInt(yy, 10);
  const fullYear = yearNum <= 30 ? 2000 + yearNum : 1900 + yearNum;
  return `${dd}/${mm}/${fullYear}`;
};

const ImpresionDocumentos = () => {
  const [students, setStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Datos globales de la escuela y fecha
  const [globalData, setGlobalData] = useState({
    fecha: '15 de julio de 2026',
    nombre_director: 'PROFR. JUAN CARLOS TABOADA BARAJAS',
    cct: '12DST0077B',
    zona: '24',
    direccion: 'Calle alta quebradora y and. 24 febrero s/n cd. renacimiento c.p.39715 Tel. 7444415678'
  });

  // Cargar estudiantes de 3er grado desde Firebase
  useEffect(() => {
    const q = query(
      collection(db, "students"), 
      where("grado", "==", "3er Grado"),
      where("status", "==", "Activo")
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        // Usamos el valor de BD, si no existe ponemos valores por defecto
        promedio_certificado: d.data().promedio_certificado || '',
        conducta: d.data().conducta || 'EXCELENTE'
      }));
      
      // Orden alfabético por apellidos
      docs.sort((a, b) => {
        const nameA = `${a.apellidoPaterno} ${a.apellidoMaterno} ${a.nombres}`.toLowerCase();
        const nameB = `${b.apellidoPaterno} ${b.apellidoMaterno} ${b.nombres}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      setStudents(docs);
      setLoading(false);
    });
    
    return () => unsub();
  }, []);

  const filteredStudents = students.filter(s => s.grupo === selectedGroup);

  const handleStudentChange = (id, field, value) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleGlobalChange = (e) => {
    setGlobalData({ ...globalData, [e.target.name]: e.target.value });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const student of filteredStudents) {
        const docRef = doc(db, "students", student.id);
        await updateDoc(docRef, {
          promedio_certificado: student.promedio_certificado,
          conducta: student.conducta
        });
      }
      alert(`¡Datos del Grupo "${selectedGroup}" guardados con éxito en la base de datos!`);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar los datos.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (filteredStudents.length === 0) {
      alert("No hay alumnos en este grupo para imprimir.");
      return;
    }
    window.print();
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 -m-8 print:m-0 print:bg-white print:py-0">
      
      {/* PANEL DE CONTROL Y CAPTURA (Solo visible en pantalla) */}
      <div className="max-w-6xl mx-auto mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200 no-print">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-600" />
              Egresados de Tercer Grado
            </h2>
            <p className="text-slate-500 text-sm mt-1">Captura de promedios finales y generación masiva de documentos oficiales.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveAll} disabled={saving || filteredStudents.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Grupo'}
            </button>
            <button onClick={handlePrint} disabled={filteredStudents.length === 0} className="bg-primary-700 hover:bg-primary-800 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50">
              <Printer className="w-4 h-4" />
              Imprimir Lote ({filteredStudents.length * 2} hojas)
            </button>
          </div>
        </div>

        {/* Filtros y Configuración Global */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Seleccionar Grupo</label>
            <select 
              value={selectedGroup} 
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full border-slate-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 font-bold"
            >
              {['A', 'B', 'C', 'D', 'E', 'F'].map(g => (
                <option key={g} value={g}>Tercer Grado "{g}"</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Fecha de Expedición</label>
            <input type="text" name="fecha" value={globalData.fecha} onChange={handleGlobalChange} className="w-full border-slate-300 rounded-md shadow-sm text-sm" />
          </div>
          <div className="md:col-span-2 text-xs text-slate-500 flex items-center bg-blue-50 p-3 rounded-md text-blue-800 border border-blue-100">
            <strong>Nota:</strong> Solo escribe el número en el promedio (ej. 9.8). El sistema generará automáticamente la letra (NUEVE PUNTO OCHO) al imprimir.
          </div>
        </div>

        {/* Tabla de Captura */}
        {loading ? (
          <p className="text-center text-slate-500 py-8 animate-pulse">Cargando base de datos...</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Alumno</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase w-32">Promedio No.</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase w-48">Promedio Letra (Auto)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase w-40">Conducta</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">No hay alumnos en este grupo.</td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 text-sm text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-2">
                        <div className="text-sm font-bold text-slate-800">{student.apellidoPaterno} {student.apellidoMaterno} {student.nombres}</div>
                        <div className="text-xs text-slate-400">{student.curp}</div>
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          min="6" max="10" step="0.1"
                          value={student.promedio_certificado}
                          onChange={(e) => handleStudentChange(student.id, 'promedio_certificado', e.target.value)}
                          className="w-full text-center font-bold border-slate-300 rounded shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-4 py-2 text-center text-xs font-medium text-slate-500 bg-slate-50">
                        {numeroALetras(student.promedio_certificado)}
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={student.conducta}
                          onChange={(e) => handleStudentChange(student.id, 'conducta', e.target.value)}
                          className="w-full text-sm border-slate-300 rounded shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                          <option value="EXCELENTE">Excelente</option>
                          <option value="BUENA">Buena</option>
                          <option value="REGULAR">Regular</option>
                          <option value="MALA">Mala</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ÁREA DE IMPRESIÓN (Visible condicionalmente) */}
      <div className="print-area">
        {filteredStudents.map((student, index) => {
          const nombreCompleto = `${student.nombres} ${student.apellidoPaterno} ${student.apellidoMaterno}`.toUpperCase();
          const promedioLetra = numeroALetras(student.promedio_certificado);
          
          // Ocultar todas las páginas excepto la primera en vista previa de pantalla (para no saturar la vista)
          // Al imprimir (print:block) se mostrarán todas y los page-breaks harán su trabajo.
          const screenVisibility = index === 0 ? "block" : "hidden print:block";

          return (
            <React.Fragment key={student.id}>
              {/* ==========================================
                  DOCUMENTO 1: CONSTANCIA DE PROMEDIO
                  ========================================== */}
              <div className={`page-container relative print-page-break ${screenVisibility}`}>
                <div className="page-border"></div>
                
                <div className="relative z-10 block font-sans text-gray-800">
                  {/* Encabezado con Logos Reales */}
                  <div className="flex items-center justify-between mb-4">
                    <img src="/logo-sep.png" alt="Logo SEP / Guerrero" className="h-16 w-auto object-contain" />
                    
                    <div className="flex-1 text-center px-4">
                      <h1 className="font-black text-[14pt] tracking-widest text-slate-900 uppercase font-sans">
                        Sistema Educativo Nacional
                      </h1>
                      <h2 className="font-bold text-[11pt] text-slate-700 mt-1 uppercase font-sans">
                        Subsecretaría de Educación Básica
                      </h2>
                      <h3 className="font-semibold text-[10pt] text-slate-600 uppercase mt-1 font-serif">
                        Escuela Secundaria Técnica N° 68 "Renacimiento"
                      </h3>
                      <p className="text-[9pt] font-medium text-slate-500 mt-0.5 font-sans">
                        C.C.T. {globalData.cct}
                      </p>
                      <p className="text-[7pt] font-medium text-slate-500 mt-1 font-sans uppercase">
                        {globalData.direccion}
                      </p>
                    </div>
                    
                    <img src="/logo-escuela.png" alt="Logo Escuela" className="h-20 w-auto object-contain" />
                  </div>

                  <hr className="border-t-[1.5px] border-gray-800 mb-6" />

                  <div className="text-right font-serif text-[14px] mb-6 space-y-1">
                    <p><span className="font-bold">Asunto:</span> Constancia de Promedio</p>
                    <p>Ciudad Renacimiento, Acapulco de Juárez, Gro; a {globalData.fecha}.</p>
                  </div>

                  <div className="mb-4 font-serif font-bold text-gray-900 tracking-wider text-[14px]">
                    <p>A QUIEN CORRESPONDA:</p>
                  </div>

                  <div className="text-justify font-serif text-[15px] leading-relaxed text-gray-800 space-y-5 px-2 block">
                    <p>
                      El (La) que suscribe, Director(a) de la Escuela Secundaria Técnica N° 68 "Renacimiento", con Clave de Centro de Trabajo (C.C.T.) <strong>{globalData.cct}</strong>, perteneciente a la zona escolar <strong>{globalData.zona}</strong>, hace constar que el (la) alumno(a):
                    </p>

                    <div className="text-center my-6">
                      <h2 className="font-serif text-2xl font-bold uppercase tracking-wider text-gray-900">
                        {nombreCompleto}
                      </h2>
                    </div>

                    <p>
                      Con Clave Única de Registro de Población (CURP): <strong>{student.curp || '__________________'}</strong> y fecha de nacimiento <strong>{student.fechaNacimiento || extraerFechaDeCurp(student.curp) || '___/___/_____'}</strong>, cursó y concluyó satisfactoriamente el <strong>Tercer</strong> grado de educación secundaria, grupo <strong>"{student.grupo}"</strong>, durante el Ciclo Escolar 2025-2026.
                    </p>

                    <p>
                      De acuerdo con el registro que obra en los archivos de Control Escolar de esta institución, el (la) estudiante obtuvo un <strong>PROMEDIO FINAL DE CERTIFICADO</strong> de:
                    </p>

                    <div className="flex justify-center my-4">
                      <div className="border-2 border-gray-800 px-16 py-4 bg-gray-50 text-center">
                        <p className="font-serif text-4xl font-bold text-gray-900">{student.promedio_certificado || '-.-'}</p>
                        <p className="font-serif text-[14px] font-bold text-gray-600 uppercase tracking-widest mt-2">
                          ({promedioLetra || 'SIN PROMEDIO CAPTURADO'})
                        </p>
                      </div>
                    </div>

                    <p>
                      A petición de la parte interesada y para los fines legales o escolares que a la misma convengan, se extiende la presente constancia en Ciudad Renacimiento, Acapulco de Juárez, Guerrero, a los {globalData.fecha}.
                    </p>
                  </div>

                  <footer className="mt-6 pt-4 relative block">
                    <div className="text-center">
                      <p className="font-serif text-[14px] tracking-widest mb-6 font-bold">ATENTAMENTE</p>
                      <div className="border-t border-gray-800 w-80 mx-auto pt-2">
                        <p className="font-serif font-bold text-[16px] text-gray-900 mt-2">{globalData.nombre_director}</p>
                        <p className="font-serif text-[12px] text-gray-700 uppercase tracking-wider mt-1">Director del Plantel</p>
                      </div>
                    </div>
                    <div className="absolute right-8 bottom-6 w-32 h-32 border-[1.5px] border-dashed border-gray-300 rounded-full flex items-center justify-center opacity-60">
                      <span className="text-[12px] text-gray-400 font-serif text-center uppercase tracking-widest">Sello<br />Oficial</span>
                    </div>
                  </footer>
                </div>
              </div>

              {/* ==========================================
                  DOCUMENTO 2: CARTA DE BUENA CONDUCTA
                  ========================================== */}
              <div className={`page-container relative print-page-break ${screenVisibility}`}>
                <div className="page-border"></div>
                
                <div className="relative z-10 block font-sans text-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <img src="/logo-sep.png" alt="Logo SEP / Guerrero" className="h-16 w-auto object-contain" />
                    <div className="flex-1 text-center px-4">
                      <h1 className="font-black text-[14pt] tracking-widest text-slate-900 uppercase font-sans">
                        Sistema Educativo Nacional
                      </h1>
                      <h2 className="font-bold text-[11pt] text-slate-700 mt-1 uppercase font-sans">
                        Subsecretaría de Educación Básica
                      </h2>
                      <h3 className="font-semibold text-[10pt] text-slate-600 uppercase mt-1 font-serif">
                        Escuela Secundaria Técnica N° 68 "Renacimiento"
                      </h3>
                      <p className="text-[9pt] font-medium text-slate-500 mt-0.5 font-sans">
                        C.C.T. {globalData.cct}
                      </p>
                      <p className="text-[7pt] font-medium text-slate-500 mt-1 font-sans uppercase">
                        {globalData.direccion}
                      </p>
                    </div>
                    <img src="/logo-escuela.png" alt="Logo Escuela" className="h-20 w-auto object-contain" />
                  </div>

                  <hr className="border-t-[1.5px] border-gray-800 mb-6" />

                  <div className="text-right font-serif text-[14px] mb-6 space-y-1 mt-2">
                    <p><span className="font-bold">Asunto:</span> Carta de Buena Conducta</p>
                    <p>Ciudad Renacimiento, Acapulco de Juárez, Gro; a {globalData.fecha}.</p>
                  </div>

                  <div className="mb-4 font-serif font-bold text-gray-900 tracking-wider text-[14px]">
                    <p>A QUIEN CORRESPONDA:</p>
                  </div>

                  <div className="text-justify font-serif text-[15px] leading-relaxed text-gray-800 space-y-6 mt-4 px-2 block">
                    <p>
                      La Dirección de la Escuela Secundaria Técnica N° 68 "Renacimiento", a través de quien suscribe, expide la presente Carta de Buena Conducta a favor del (la) alumno(a):
                    </p>

                    <div className="text-center my-6">
                      <h2 className="font-serif text-2xl font-bold uppercase tracking-wider text-gray-900">
                        {nombreCompleto}
                      </h2>
                    </div>

                    <p>
                      Con Clave Única de Registro de Población (CURP) <strong>{student.curp || '__________________'}</strong> y fecha de nacimiento <strong>{student.fechaNacimiento || extraerFechaDeCurp(student.curp) || '___/___/_____'}</strong>, quien cursó y concluyó sus estudios de educación secundaria en esta institución durante el Ciclo Escolar 2025-2026, en el <strong>Tercer</strong> grado, grupo <strong>"{student.grupo}"</strong>.
                    </p>

                    <p>
                      Durante su permanencia en este plantel educativo, el (la) alumno(a) demostró en todo momento un comportamiento respetuoso hacia las autoridades escolares, personal docente, administrativo y sus compañeros. Asimismo, acató los lineamientos establecidos en el Reglamento Escolar de nuestra institución, mostrando responsabilidad, disciplina y una <strong>{student.conducta} CONDUCTA</strong>.
                    </p>

                    <p>
                      Se extiende el presente documento a solicitud de la parte interesada, para los fines que a su derecho convengan, en Ciudad Renacimiento, Acapulco de Juárez, Guerrero, a los {globalData.fecha}.
                    </p>
                  </div>

                  <footer className="mt-12 pt-8 relative block">
                    <div className="text-center">
                      <p className="font-serif text-[14px] tracking-widest mb-6 font-bold">ATENTAMENTE</p>
                      <div className="border-t border-gray-800 w-80 mx-auto pt-2">
                        <p className="font-serif font-bold text-[16px] text-gray-900 mt-2">{globalData.nombre_director}</p>
                        <p className="font-serif text-[12px] text-gray-700 uppercase tracking-wider mt-1">Director del Plantel</p>
                      </div>
                    </div>
                    <div className="absolute right-8 bottom-6 w-32 h-32 border-[1.5px] border-dashed border-gray-300 rounded-full flex items-center justify-center opacity-60">
                      <span className="text-[12px] text-gray-400 font-serif text-center uppercase tracking-widest">Sello<br />Oficial</span>
                    </div>
                  </footer>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ImpresionDocumentos;
