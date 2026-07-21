import React, { useState } from 'react';
import { X, FileText, CheckCircle } from 'lucide-react';
import { autoAcentuar } from '../utils/format';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function AcuseRecepcionModal({ student, onClose, onGenerate }) {
  const [tutorSelect, setTutorSelect] = useState(student.tutorNombre || student.emergenciaNombre1 || 'Otro');
  const [tutorManual, setTutorManual] = useState('');
  
  const secretarios = [
    "Lic. Julio Cesar Rodriguez Salazar",
    "Lic. Erick Buenrostro Hernandez",
    "Lic. Ismael Mendoza Parra"
  ];
  const [quienRecibeSelect, setQuienRecibeSelect] = useState(secretarios[0]);
  const [quienRecibeManual, setQuienRecibeManual] = useState('');

  // Initial state reads from student.docs if it exists, otherwise defaults to all checked.
  const [docs, setDocs] = useState(student.docs || {
    curp: { checked: true, motivo: '' },
    acta: { checked: true, motivo: '' },
    certprim: { checked: true, motivo: '' },
    bol1: { checked: true, motivo: '' },
    bol2: { checked: true, motivo: '' },
    bol3: { checked: true, motivo: '' },
    certsec: { checked: true, motivo: '' }
  });

  const handleDocChange = (key, field, value) => {
    setDocs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const finalTutor = tutorSelect === 'Otro' ? tutorManual : tutorSelect;
    const finalQuienRecibe = quienRecibeSelect === 'Otro' ? quienRecibeManual : quienRecibeSelect;

    try {
      // Update student record in Firebase with the received documents state
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, { docs });
      toast.success("Estado de documentos guardado");

      // We update the local object so it prints correctly right away
      const updatedStudent = { ...student, docs };

      onGenerate({
        student: updatedStudent,
        tutor: finalTutor,
        quienRecibe: finalQuienRecibe,
        docs
      });
    } catch (error) {
      console.error("Error al actualizar documentos:", error);
      toast.error("Hubo un error al guardar los documentos");
    }
  };

  const docLabels = {
    curp: 'C.U.R.P.',
    acta: 'Acta de Nacimiento',
    certprim: 'Certificado de Primaria',
    bol1: 'Boleta 1er Grado Sec.',
    bol2: 'Boleta 2do Grado Sec.',
    bol3: 'Boleta 3er Grado Sec.',
    certsec: 'Certificado Secundaria'
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-sky-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-800">Acuse de Recepción de Documentos (Ingreso)</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="acuseRecForm" onSubmit={handleSubmit} className="space-y-6">
            
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
              {/* Persona que Entrega */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Persona que Entrega (Tutor/Referencia)</label>
                <select 
                  value={tutorSelect}
                  onChange={(e) => setTutorSelect(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 uppercase"
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
                    placeholder="Nombre completo de quien entrega..."
                    className="mt-2 w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 uppercase"
                  />
                )}
              </div>

              {/* Persona que Recibe */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Persona que Recibe (Control Escolar)</label>
                <select 
                  value={quienRecibeSelect}
                  onChange={(e) => setQuienRecibeSelect(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  {secretarios.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                  <option value="Otro">Otra persona (Ingresar manual)</option>
                </select>
                {quienRecibeSelect === 'Otro' && (
                  <input 
                    type="text"
                    required
                    value={quienRecibeManual}
                    onChange={(e) => setQuienRecibeManual(e.target.value)}
                    placeholder="Nombre completo de quien recibe..."
                    className="mt-2 w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 uppercase"
                  />
                )}
              </div>
            </div>

            {/* Documentos List */}
            <div>
              <h3 className="text-sm font-bold text-sky-800 mb-3 border-b-2 border-sky-200 pb-1">
                Documentos recibidos (Desmarque si NO lo entregaron y elija el motivo)
              </h3>
              
              <datalist id="motivos-faltantes-rec">
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
                {Object.keys(docs).map(key => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <label className="flex items-center gap-3 sm:w-2/5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={docs[key].checked}
                        onChange={(e) => handleDocChange(key, 'checked', e.target.checked)}
                        className="w-5 h-5 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">{docLabels[key]}</span>
                    </label>
                    <div className="flex-1">
                      <input 
                        type="text"
                        list="motivos-faltantes-rec"
                        disabled={docs[key].checked}
                        required={!docs[key].checked}
                        value={docs[key].checked ? '' : docs[key].motivo}
                        onChange={(e) => handleDocChange(key, 'motivo', e.target.value)}
                        placeholder={docs[key].checked ? "Entregado (Desmarque para escribir motivo)" : "Escriba o seleccione un motivo..."}
                        className={`w-full p-2 text-sm border rounded-md transition-colors uppercase ${docs[key].checked ? 'bg-slate-100 border-transparent text-slate-400 placeholder-slate-400 cursor-not-allowed' : 'bg-white border-sky-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500'}`}
                      />
                    </div>
                  </div>
                ))}
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
            form="acuseRecForm"
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-sky-200"
          >
            <CheckCircle className="w-5 h-5" />
            Guardar en Sistema e Imprimir
          </button>
        </div>

      </div>
    </div>
  );
}
