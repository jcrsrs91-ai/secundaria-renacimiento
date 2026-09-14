import React, { useState, useEffect } from 'react';
import { Printer, X, ShieldAlert } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function DirectorioEmergenciaPrint({ onClose }) {
  const [students, setStudents] = useState([]);
  const [grado, setGrado] = useState('1er Grado');
  const [grupo, setGrupo] = useState('A');

  useEffect(() => {
    const qAll = query(collection(db, "students"));
    const unsubAll = onSnapshot(qAll, (snapshot) => {
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(allData);
    });
    return unsubAll;
  }, []);

  const grados = ['1er Grado', '2do Grado', '3er Grado'];
  const grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  const filterStudents = () => {
    return students
      .filter(s => s.grado === grado && s.grupo === grupo && (s.status === 'Activo' || !s.status))
      .sort((a, b) => {
        const nameA = `${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''} ${a.nombres || ''}`.trim();
        const nameB = `${b.apellidoPaterno || ''} ${b.apellidoMaterno || ''} ${b.nombres || ''}`.trim();
        return nameA.localeCompare(nameB);
      });
  };

  const filtered = filterStudents();

  // Función para manejar la impresión e inyectar estilos específicos de hoja en horizontal
  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = `@page { size: landscape; margin: 10mm; }`;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Controles (Ocultos en impresión) */}
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl mx-auto mb-6 print:hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Directorio de Emergencias</h2>
              <p className="text-sm text-slate-500 font-medium">Imprime el directorio con contactos y tipo de sangre.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 bg-slate-50 flex flex-wrap gap-4 items-end rounded-b-2xl">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Grado</label>
            <select 
              value={grado} 
              onChange={e => setGrado(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 bg-white min-w-[150px] shadow-sm"
            >
              {grados.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Grupo</label>
            <select 
              value={grupo} 
              onChange={e => setGrupo(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 bg-white min-w-[100px] shadow-sm"
            >
              {grupos.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button 
            onClick={handlePrint}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center ml-auto"
          >
            <Printer className="w-5 h-5 mr-2" />
            Imprimir Directorio
          </button>
        </div>
      </div>

      {/* Documento a imprimir */}
      <div className="max-w-none mx-auto bg-white print:shadow-none shadow-2xl print:w-full w-[297mm] min-h-[210mm] p-[10mm]">
        <div className="text-center mb-6">
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest">
            Directorio Escolar de Emergencias
          </h1>
          <h2 className="text-lg font-bold text-slate-600 mt-1">
            {grado} Grupo "{grupo}"
          </h2>
        </div>

        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="border border-slate-800 p-1.5 bg-slate-100 text-left font-bold w-32">ALUMNO</th>
              <th className="border border-slate-800 p-1.5 bg-slate-100 text-left font-bold w-48">DOMICILIO</th>
              <th className="border border-slate-800 p-1.5 bg-slate-100 text-left font-bold w-32">TUTOR Y TELÉFONO</th>
              <th className="border border-slate-800 p-1.5 bg-slate-100 text-left font-bold w-32">CONTACTO 1</th>
              <th className="border border-slate-800 p-1.5 bg-slate-100 text-left font-bold w-32">CONTACTO 2</th>
              <th className="border border-slate-800 p-1.5 bg-slate-100 text-center font-bold w-20">SANGRE Y ALERGIAS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((student, idx) => (
                <tr key={student.id} className="break-inside-avoid">
                  <td className="border border-slate-800 p-1.5 font-bold uppercase">
                    {student.apellidoPaterno} {student.apellidoMaterno} {student.nombres}
                  </td>
                  <td className="border border-slate-800 p-1.5 text-[10px] leading-tight">
                    {student.calle} {student.numero ? `#${student.numero}` : ''}, Col. {student.colonia}, C.P. {student.cp}
                  </td>
                  <td className="border border-slate-800 p-1.5 text-[10px] leading-tight">
                    <span className="font-bold">{student.tutorNombre || 'Sin registro'}</span><br/>
                    Tel: {student.telefono || 'N/A'}
                  </td>
                  <td className="border border-slate-800 p-1.5 text-[10px] leading-tight">
                    <span className="font-bold">{student.emergenciaNombre1 || '-'}</span><br/>
                    Tel: {student.emergenciaTel1 || '-'} ({student.emergenciaParentesco1 || '-'})
                  </td>
                  <td className="border border-slate-800 p-1.5 text-[10px] leading-tight">
                    <span className="font-bold">{student.emergenciaNombre2 || '-'}</span><br/>
                    Tel: {student.emergenciaTel2 || '-'} ({student.emergenciaParentesco2 || '-'})
                  </td>
                  <td className="border border-slate-800 p-1.5 text-[10px] text-center">
                    <span className="font-bold text-red-600 block mb-1 border-b border-slate-200 pb-0.5">{student.tipoSangre || 'N/A'}</span>
                    <span className="text-slate-600 leading-tight block">{student.alergias || 'Ninguna'}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="border border-slate-800 p-4 text-center font-bold text-slate-400">
                  No hay alumnos activos registrados en este grupo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
