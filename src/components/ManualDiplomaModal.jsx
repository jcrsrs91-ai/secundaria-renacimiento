import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Award, Printer } from 'lucide-react';

export default function ManualDiplomaModal({ onClose, onGenerate }) {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    grado: '1er Grado',
    grupo: 'A',
    promedio: '10.0',
    lugar: 'PRIMER LUGAR',
    periodo: 'Promedio Anual',
    turno: 'Matutino'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert to the format expected by DiplomaPrint
    const printItem = {
      student: {
        nombres: formData.nombreCompleto.trim(),
        apellidoPaterno: '',
        apellidoMaterno: '',
        grado: formData.grado,
        grupo: formData.grupo
      },
      average: parseFloat(formData.promedio),
      place: formData.lugar === 'PRIMER LUGAR' ? 1 : formData.lugar === 'SEGUNDO LUGAR' ? 2 : formData.lugar === 'TERCER LUGAR' ? 3 : 0,
      placeText: formData.lugar,
      periodoName: formData.periodo
    };

    onGenerate([printItem], formData.turno);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Generar Diploma Manual</h2>
              <p className="text-sm text-slate-500 font-medium">Ingresa los datos para imprimir un diploma personalizado.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo del Alumno</label>
            <input 
              type="text" 
              required
              value={formData.nombreCompleto}
              onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value.toUpperCase()})}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 outline-none uppercase"
              placeholder="EJ: GERALDINE VALADEZ ELACIO"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Grado</label>
              <select 
                value={formData.grado}
                onChange={(e) => setFormData({...formData, grado: e.target.value})}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="1er Grado">1er Grado</option>
                <option value="2do Grado">2do Grado</option>
                <option value="3er Grado">3er Grado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Grupo</label>
              <input 
                type="text" 
                required
                maxLength={1}
                value={formData.grupo}
                onChange={(e) => setFormData({...formData, grupo: e.target.value.toUpperCase()})}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 outline-none text-center uppercase"
                placeholder="A"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Promedio</label>
              <input 
                type="number" 
                step="0.01"
                required
                max="10"
                min="6"
                value={formData.promedio}
                onChange={(e) => setFormData({...formData, promedio: e.target.value})}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-bold focus:ring-2 focus:ring-amber-500 outline-none text-center"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Lugar Obtenido</label>
              <select 
                value={formData.lugar}
                onChange={(e) => setFormData({...formData, lugar: e.target.value})}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="PRIMER LUGAR">1er Lugar</option>
                <option value="SEGUNDO LUGAR">2do Lugar</option>
                <option value="TERCER LUGAR">3er Lugar</option>
                <option value="MENCION HONORIFICA">Mención Honorífica</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Periodo a Evaluar</label>
              <select 
                value={formData.periodo}
                onChange={(e) => setFormData({...formData, periodo: e.target.value})}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="1er Trimestre">1er Trimestre</option>
                <option value="2do Trimestre">2do Trimestre</option>
                <option value="3er Trimestre">3er Trimestre</option>
                <option value="Promedio Anual">Promedio Anual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Turno (Firmas)</label>
              <select 
                value={formData.turno}
                onChange={(e) => setFormData({...formData, turno: e.target.value})}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center shadow-md transition"
            >
              <Printer className="w-5 h-5 mr-2" />
              Generar e Imprimir
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
