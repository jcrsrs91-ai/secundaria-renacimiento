import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle } from 'lucide-react';
import { autoAcentuar } from '../utils/format';

export default function AcuseDocumentosModal({ student, onClose, onGenerate }) {
  const [motivo, setMotivo] = useState('Egreso');
  const [tutorSelect, setTutorSelect] = useState(student.tutorNombre || student.emergenciaNombre1 || 'Otro');
  const [tutorManual, setTutorManual] = useState('');
  
  const secretarios = [
    "Lic. Julio Cesar Rodriguez Salazar",
    "Lic. Erick Buenrostro Hernandez",
    "Lic. Ismael Mendoza Parra"
  ];

  const [quienEntregaSelect, setQuienEntregaSelect] = useState(secretarios[0]);
  const [quienEntregaManual, setQuienEntregaManual] = useState('');

  const [docs, setDocs] = useState(() => {
    // Solo cargamos la base (curp, acta, certprim) del historial recibido
    const sDocs = student.docs || {};
    return {
      curp: sDocs.curp || { checked: true, motivo: '' },
      acta: sDocs.acta || { checked: true, motivo: '' },
      certprim: sDocs.certprim || { checked: true, motivo: '' }
    };
  });

  const [extraDocs, setExtraDocs] = useState([]);
  const [extraDocSelect, setExtraDocSelect] = useState('');

  const docLabels = {
    curp: 'C.U.R.P.',
    acta: 'Acta de Nacimiento',
    certprim: 'Certificado de Primaria',
    certsec: 'Certificado Secundaria',
    bol3: 'Boleta 3er Grado Sec.',
    doc_traslado: 'Documento de Traslado / Baja',
    bol1: 'Boleta 1er Grado Sec.',
    bol2: 'Boleta 2do Grado Sec.',
    constancia: 'Constancia de Estudios'
  };

  const getDynamicDocs = () => {
    const list = ['curp', 'acta', 'certprim'];
    if (motivo === 'Egreso') {
      list.push('certsec', 'bol3');
    } else if (motivo === 'Baja del ciclo escolar' || motivo === 'Traslado a otra institución') {
      list.push('doc_traslado');
    }
    return [...list, ...extraDocs];
  };

  const handleExtraDocChange = (key, field, value) => {
    setDocs(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { checked: true, motivo: '' }),
        [field]: value
      }
    }));
  };

  const addExtraDoc = () => {
    if (extraDocSelect && !extraDocs.includes(extraDocSelect)) {
      setExtraDocs([...extraDocs, extraDocSelect]);
      setDocs(prev => ({
        ...prev,
        [extraDocSelect]: { checked: true, motivo: '' }
      }));
      setExtraDocSelect('');
    }
  };

  const handleDocChange = (key, field, value) => {
    setDocs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const finalTutor = tutorSelect === 'Otro' ? tutorManual : tutorSelect;
    const finalQuienEntrega = quienEntregaSelect === 'Otro' ? quienEntregaManual : quienEntregaSelect;

    // Solo enviamos los documentos que realmente estamos mostrando/devolviendo
    const activeDocsKeys = getDynamicDocs();
    const activeDocs = {};
    activeDocsKeys.forEach(key => {
      activeDocs[key] = docs[key] || { checked: true, motivo: '' };
    });

    onGenerate({
      student,
      motivo,
      tutor: finalTutor,
      quienEntrega: finalQuienEntrega,
      docs: activeDocs
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-800">Acuse de Devolución de Documentos</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="acuseForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Alumno Info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase">Datos del Alumno</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre Completo</label>
                  <div className="p-2 bg-white border border-slate-200 rounded text-sm text-slate-800 font-medium">
                    {autoAcentuar(student.apellidoPaterno)} {autoAcentuar(student.apellidoMaterno)} {autoAcentuar(student.nombres)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Grado</label>
                    <div className="p-2 bg-white border border-slate-200 rounded text-sm text-slate-800 text-center">{student.grado || '-'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Grupo</label>
                    <div className="p-2 bg-white border border-slate-200 rounded text-sm text-slate-800 text-center">{student.grupo || '-'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Turno</label>
                    <div className="p-2 bg-white border border-slate-200 rounded text-sm text-slate-800 text-center">{student.turno || '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Motivo */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Motivo de la entrega</label>
                <select 
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                >
                  <option value="Egreso">Egreso</option>
                  <option value="Baja del ciclo escolar">Baja del ciclo escolar</option>
                  <option value="Préstamo temporal">Préstamo temporal</option>
                  <option value="Corrección de datos">Corrección de datos</option>
                  <option value="Traslado a otra institución">Traslado a otra institución</option>
                  <option value="Cancelación de inscripción">Cancelación de inscripción</option>
                </select>
              </div>

              {/* Persona que Recibe */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Persona que Recibe (Tutor/Referencia)</label>
                <select 
                  value={tutorSelect}
                  onChange={(e) => setTutorSelect(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 uppercase"
                >
                  {student.tutorNombre && (
                    <option value={student.tutorNombre}>{autoAcentuar(student.tutorNombre)} (Tutor Principal)</option>
                  )}
                  {student.emergenciaNombre1 && (
                    <option value={student.emergenciaNombre1}>{autoAcentuar(student.emergenciaNombre1)} (Referencia)</option>
                  )}
                  {student.emergenciaNombre2 && (
                    <option value={student.emergenciaNombre2}>{autoAcentuar(student.emergenciaNombre2)} (Referencia 2)</option>
                  )}
                  <option value="Otro">OTRA PERSONA (Ingresar manual)</option>
                </select>
                {tutorSelect === 'Otro' && (
                  <input 
                    type="text"
                    required
                    value={tutorManual}
                    onChange={(e) => setTutorManual(e.target.value)}
                    placeholder="Nombre completo de quien recibe..."
                    className="mt-2 w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 uppercase"
                  />
                )}
              </div>
            </div>

            {/* Quien Entrega */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Persona que Entrega (Control Escolar)</label>
              <select 
                value={quienEntregaSelect}
                onChange={(e) => setQuienEntregaSelect(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                {secretarios.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
                <option value="Otro">Otra persona (Ingresar manual)</option>
              </select>
              {quienEntregaSelect === 'Otro' && (
                <input 
                  type="text"
                  required
                  value={quienEntregaManual}
                  onChange={(e) => setQuienEntregaManual(e.target.value)}
                  placeholder="Nombre completo de quien entrega..."
                  className="mt-2 w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 uppercase"
                />
              )}
            </div>

            {/* Documentos List */}
            <div>
              <h3 className="text-sm font-bold text-rose-800 mb-3 border-b-2 border-rose-200 pb-1">
                Documentos a entregar (Desmarque si NO se entrega y escriba el motivo)
              </h3>
              
              <datalist id="motivos-faltantes">
                <option value="Retraso en la emisión por escuela de procedencia" />
                <option value="Retención por adeudos en colegio particular" />
                <option value="Trámite foráneo en proceso" />
                <option value="Corrección de Acta en el Registro Civil" />
                <option value="Inconsistencias de CURP en RENAPO" />
                <option value="Falta de Apostille o Traducción" />
                <option value="Pérdida por desastres naturales o siniestros" />
                <option value="Conflictos de custodia" />
                <option value="Extravío por mudanza" />
              </datalist>

              <div className="space-y-3">
                {getDynamicDocs().map(key => {
                  const docState = docs[key] || { checked: true, motivo: '' };
                  return (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <label className="flex items-center gap-3 sm:w-2/5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={docState.checked}
                        onChange={(e) => handleExtraDocChange(key, 'checked', e.target.checked)}
                        className="w-5 h-5 text-rose-600 border-slate-300 rounded focus:ring-rose-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">{docLabels[key] || key}</span>
                    </label>
                    <div className="flex-1">
                      <input 
                        type="text"
                        list="motivos-faltantes"
                        disabled={docState.checked}
                        required={!docState.checked}
                        value={docState.checked ? '' : docState.motivo}
                        onChange={(e) => handleExtraDocChange(key, 'motivo', e.target.value)}
                        placeholder={docState.checked ? "Se entrega (Desmarque para escribir motivo)" : "Escriba o seleccione un motivo..."}
                        className={`w-full p-2 text-sm border rounded-md transition-colors uppercase ${docState.checked ? 'bg-slate-100 border-transparent text-slate-400 placeholder-slate-400 cursor-not-allowed' : 'bg-white border-rose-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'}`}
                      />
                    </div>
                  </div>
                )})}
              </div>

              {/* Agregar Documento Extra */}
              <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-3">
                <select 
                  value={extraDocSelect}
                  onChange={(e) => setExtraDocSelect(e.target.value)}
                  className="flex-1 p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">-- Añadir documento extra al expediente --</option>
                  {!getDynamicDocs().includes('bol1') && <option value="bol1">Boleta 1er Grado Sec.</option>}
                  {!getDynamicDocs().includes('bol2') && <option value="bol2">Boleta 2do Grado Sec.</option>}
                  {!getDynamicDocs().includes('bol3') && <option value="bol3">Boleta 3er Grado Sec.</option>}
                  {!getDynamicDocs().includes('constancia') && <option value="constancia">Constancia de Estudios</option>}
                </select>
                <button
                  type="button"
                  onClick={addExtraDoc}
                  disabled={!extraDocSelect}
                  className="px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded hover:bg-rose-700 disabled:opacity-50 transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="acuseForm"
            className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-rose-200"
          >
            <CheckCircle className="w-5 h-5" />
            Generar Acuse e Imprimir
          </button>
        </div>

      </div>
    </div>
  );
}
