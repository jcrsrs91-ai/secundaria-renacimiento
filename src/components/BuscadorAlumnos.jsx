import React, { useState, useEffect } from 'react';
import { Search, User, FileText } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { searchIncludes } from '../utils/search';

export default function BuscadorAlumnos({ onStudentSelect, title = "Buscador de Alumnos", description = "Busca por nombre, CURP, matrícula o grado/grupo." }) {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qAll = query(collection(db, "students"));
    const unsubAll = onSnapshot(qAll, (snapshot) => {
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(allData);
      setLoading(false);
    });
    return unsubAll;
  }, []);

  const filteredStudents = students.filter(student => {
    if (!searchTerm) return false; // Show none if no search term, or maybe show first 10? Let's show none until they type, to keep it clean.
    const nombreCompleto = `${student.nombres || ''} ${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''}`;
    const gradoGrupo = `${student.grado || ''} ${student.grupo || ''}`;
    
    return searchIncludes(nombreCompleto, searchTerm) ||
           searchIncludes(student.curp || '', searchTerm) ||
           searchIncludes(student.matricula || '', searchTerm) ||
           searchIncludes(gradoGrupo, searchTerm);
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Buscar alumno..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-slate-50 focus:bg-white"
        />
        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
      </div>

      {searchTerm && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => (
              <div 
                key={student.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary-400 hover:shadow-sm transition-all bg-white"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-4 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight">
                      {student.apellidoPaterno} {student.apellidoMaterno} {student.nombres}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {student.grado} Grupo "{student.grupo}" • {student.matricula || 'Sin matrícula'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onStudentSelect(student)}
                  className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-sm font-bold transition-colors flex items-center shrink-0"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Expediente
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              No se encontraron alumnos con ese criterio.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
