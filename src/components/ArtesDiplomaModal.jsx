import React, { useState, useMemo } from 'react';
import { X, Search, Palette } from 'lucide-react';

export default function ArtesDiplomaModal({ onClose, onGenerate, activos }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [manualTurno, setManualTurno] = useState('Matutino');

  // Filtrar y ordenar estudiantes
  const filteredStudents = useMemo(() => {
    if (!activos) return [];
    
    let result = activos;
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = activos.filter(student => {
        const fullname = `${student.nombres} ${student.apellidoPaterno} ${student.apellidoMaterno}`.toLowerCase();
        return fullname.includes(lowerSearch);
      });
    }

    // Retornar copia ordenada para no mutar el array original
    return [...result].sort((a, b) => {
      // 1. Ordenar por Grado (1er Grado, 2do Grado, 3er Grado)
      const gradoA = a.grado || '';
      const gradoB = b.grado || '';
      if (gradoA !== gradoB) return gradoA.localeCompare(gradoB);

      // 2. Ordenar por Grupo (A, B, C...)
      const grupoA = a.grupo || '';
      const grupoB = b.grupo || '';
      if (grupoA !== grupoB) return grupoA.localeCompare(grupoB);

      // 3. Ordenar alfabéticamente por Apellidos y Nombres
      const nameA = `${a.apellidoPaterno} ${a.apellidoMaterno} ${a.nombres}`.toLowerCase();
      const nameB = `${b.apellidoPaterno} ${b.apellidoMaterno} ${b.nombres}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [activos, searchTerm]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert("Por favor selecciona un alumno.");
      return;
    }
    const student = activos.find(s => s.id === selectedStudentId);
    
    onGenerate({
      id: 'artes-' + Date.now(),
      student: {
        nombres: student.nombres,
        apellidoPaterno: student.apellidoPaterno,
        apellidoMaterno: student.apellidoMaterno,
        grado: student.grado || '3er Grado',
        grupo: student.grupo || 'A'
      }
    }, manualTurno);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <Palette className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Diploma de Artes</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-4">
              
              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 mb-6">
                <p className="text-sm text-slate-600 italic">
                  Este diploma reconoce la participación destacada en el <strong>Taller de Danza Xochipilli</strong>. 
                  Busca y selecciona al alumno en la base de datos:
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Buscar Alumno</label>
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="Escribe el nombre..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Seleccionar Alumno</label>
                <select 
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                  size="5"
                >
                  {filteredStudents.map(student => (
                    <option 
                      key={student.id} 
                      value={student.id} 
                      onClick={() => setSelectedStudentId(student.id)}
                      onDoubleClick={() => {
                        setSelectedStudentId(student.id);
                        onGenerate({
                          id: 'artes-' + Date.now(),
                          student: {
                            nombres: student.nombres,
                            apellidoPaterno: student.apellidoPaterno,
                            apellidoMaterno: student.apellidoMaterno,
                            grado: student.grado || '3er Grado',
                            grupo: student.grupo || 'A'
                          }
                        }, manualTurno);
                      }}
                      className="p-2 border-b border-slate-100 hover:bg-rose-50 cursor-pointer"
                    >
                      {student.nombres} {student.apellidoPaterno} {student.apellidoMaterno} - {student.grado} "{student.grupo}"
                    </option>
                  ))}
                  {filteredStudents.length === 0 && (
                    <option disabled className="p-2 text-slate-400">No hay alumnos que coincidan...</option>
                  )}
                </select>
                <p className="text-xs text-slate-500 mt-2 font-medium">Tip: Doble clic en el nombre para generar rápidamente.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Turno (Para firmas)</label>
                <select 
                  value={manualTurno}
                  onChange={(e) => setManualTurno(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                </select>
              </div>

            </div>
          </div>

          <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedStudentId}
              className="px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 shadow-md shadow-rose-200 transition-all flex items-center gap-2"
            >
              Generar Diploma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
