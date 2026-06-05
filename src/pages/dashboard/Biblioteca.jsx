import { BookOpen, Search, BookmarkPlus } from 'lucide-react';

export default function Biblioteca() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Biblioteca Escolar</h2>
          <p className="text-slate-500 text-sm">Control de acervo bibliográfico y sistema de préstamos.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          <BookmarkPlus className="w-4 h-4 mr-2" /> Registrar Préstamo
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <input type="text" placeholder="Buscar libro por título, autor o ISBN..." className="flex-1 px-4 py-2 border border-slate-300 rounded-lg" />
          <button className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium flex items-center">
            <Search className="w-4 h-4 mr-2" /> Buscar en Catálogo
          </button>
        </div>
        
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Usa la barra de búsqueda para localizar un libro o registrar un nuevo préstamo escaneando la matrícula del alumno.</p>
        </div>
      </div>
    </div>
  );
}
