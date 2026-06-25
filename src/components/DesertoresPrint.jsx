import React from 'react';
import { UserMinus, Printer, X } from 'lucide-react';

export default function DesertoresPrint({ bajas = [], onClose }) {
  // Función para calcular edad
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edad--;
    }
    return edad;
  };

  // Función para separar YYYY-MM-DD
  const separarFecha = (fechaNacimiento) => {
    if (!fechaNacimiento) return { ano: '', mes: '', dia: '' };
    const partes = fechaNacimiento.split('-');
    if (partes.length === 3) {
      return { ano: partes[0], mes: partes[1], dia: partes[2] };
    }
    return { ano: '', mes: '', dia: '' };
  };

  // Ordenar alfabéticamente
  const bajasOrdenadas = [...bajas].sort((a, b) => {
    const nameA = `${a.apellidoPaterno} ${a.apellidoMaterno} ${a.nombres}`.trim().toLowerCase();
    const nameB = `${b.apellidoPaterno} ${b.apellidoMaterno} ${b.nombres}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Si hay menos de 10 desertores, rellenar con filas vacías para que el formato se vea bien
  const minRows = 10;
  const filas = [...bajasOrdenadas];
  while (filas.length < minRows) {
    filas.push(null);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex justify-center overflow-y-auto print:bg-white print:block print:inset-auto print:overflow-visible custom-scrollbar">
      <style>
        {`
          @media print {
            @page { size: landscape; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
          }
          .print-desertores-only > :not(#printable-desertores) {
            display: none !important;
          }
        `}
      </style>

      {/* Controles NO imprimibles */}
      <div className="absolute top-4 right-4 flex gap-2 no-print fixed z-[60]">
        <button 
          onClick={() => {
            document.body.classList.add('print-desertores-only');
            window.print();
            setTimeout(() => document.body.classList.remove('print-desertores-only'), 100);
          }} 
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition"
        >
          <Printer className="w-5 h-5 mr-2" /> Imprimir
        </button>
        <button onClick={onClose} className="p-2 bg-white text-slate-500 rounded-lg shadow-lg hover:bg-slate-100 hover:text-slate-800 transition">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div id="printable-desertores" className="bg-white my-8 w-full max-w-[297mm] mx-auto shadow-sm border border-slate-200 rounded-xl print:my-0 print:shadow-none print:border-none print:rounded-none print:max-w-none text-xs">
        
        {/* Tabla de Desertores */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center mb-4 border-b-2 border-rose-200 pb-2">
            <div className="bg-rose-500 text-white w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-sm print:shadow-none">
              <UserMinus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
              Relación de Alumnos Desertores (E6)
            </h3>
          </div>
          
          <div className="rounded-xl border border-slate-200 overflow-hidden print:border-slate-400 print:rounded-none">
            <table className="w-full border-collapse text-[10px] text-center">
              <thead>
                <tr className="bg-slate-100 text-slate-600 print:bg-slate-200 print:text-black">
                  <th rowSpan="2" className="border-r border-b border-slate-200 print:border-slate-400 p-2 w-8 font-bold">N/P</th>
                  <th rowSpan="2" className="border-r border-b border-slate-200 print:border-slate-400 p-2 font-bold">NOMBRE COMPLETO</th>
                  <th colSpan="2" className="border-r border-b border-slate-200 print:border-slate-400 p-1 font-bold">SEXO</th>
                  <th rowSpan="2" className="border-r border-b border-slate-200 print:border-slate-400 p-2 w-12 font-bold">EDAD</th>
                  <th colSpan="3" className="border-r border-b border-slate-200 print:border-slate-400 p-1 font-bold">FECHA NACIMIENTO</th>
                  <th rowSpan="2" className="border-r border-b border-slate-200 print:border-slate-400 p-2 w-16 font-bold">GRADO/GRUPO</th>
                  <th rowSpan="2" className="border-r border-b border-slate-200 print:border-slate-400 p-2 font-bold">DOMICILIO</th>
                  <th rowSpan="2" className="border-b border-slate-200 print:border-slate-400 p-2 w-48 font-bold">CAUSA DE DESERCIÓN*</th>
                </tr>
                <tr className="bg-slate-50 text-slate-500 print:bg-slate-100 print:text-black">
                  <th className="border-r border-b border-slate-200 print:border-slate-400 p-1 w-8 font-semibold">H</th>
                  <th className="border-r border-b border-slate-200 print:border-slate-400 p-1 w-8 font-semibold">M</th>
                  <th className="border-r border-b border-slate-200 print:border-slate-400 p-1 w-10 font-semibold">AÑO</th>
                  <th className="border-r border-b border-slate-200 print:border-slate-400 p-1 w-8 font-semibold">MES</th>
                  <th className="border-r border-b border-slate-200 print:border-slate-400 p-1 w-8 font-semibold">DÍA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {filas.map((s, idx) => {
                  const nombreCompleto = s ? `${s.apellidoPaterno} ${s.apellidoMaterno} ${s.nombres}`.toUpperCase() : '';
                  const h = (s && s.genero === 'Hombre') ? '1' : '';
                  const m = (s && s.genero === 'Mujer') ? '1' : '';
                  const edad = s ? calcularEdad(s.fechaNacimiento) : '';
                  const fecha = s ? separarFecha(s.fechaNacimiento) : {ano:'', mes:'', dia:''};
                  const gradoGrupo = s ? `${s.grado[0]} "${s.grupo}"` : '';
                  const domicilio = s ? `${s.calle || ''} ${s.numero || ''} ${s.colonia || ''}`.trim().toUpperCase() : '';
                  const motivo = s ? (s.motivoBaja || '').toUpperCase() : '';
                  
                  const rowClass = s ? "hover:bg-slate-50 transition-colors" : "bg-slate-50/30 print:bg-transparent";

                  return (
                    <tr key={idx} className={`h-8 ${rowClass}`}>
                      <td className="border-r border-slate-200 print:border-slate-400 p-1 text-slate-500">{s ? idx + 1 : ''}</td>
                      <td className="border-r border-slate-200 print:border-slate-400 p-1 text-left px-3 font-bold text-slate-700 print:text-black">{nombreCompleto}</td>
                      <td className="border-r border-slate-200 print:border-slate-400 p-1 font-semibold text-slate-600">{h}</td>
                      <td className="border-r border-slate-200 print:border-slate-400 p-1 font-semibold text-slate-600">{m}</td>
                      <td className="border-r border-slate-200 print:border-slate-400 p-1 text-slate-600">{edad}</td>
                      <td className="border-r border-slate-200 print:border-slate-400 p-1 text-slate-500">{fecha.ano}</td>
                      <td className="border-r border-slate-200 print:border-slate-400 p-1 text-slate-500">{fecha.mes}</td>
                      <td className="border-r border-slate-200 print:border-slate-400 p-1 text-slate-500">{fecha.dia}</td>
                      <td className="border-r border-slate-200 print:border-slate-400 p-1 font-bold text-slate-700 print:text-black">{gradoGrupo}</td>
                      <td className="border-r border-slate-200 print:border-slate-400 p-1 text-left px-2 truncate max-w-[200px] text-slate-600" title={domicilio}>{domicilio}</td>
                      <td className="p-1 text-left px-2 truncate max-w-[150px] font-medium text-rose-600 print:text-black" title={motivo}>{motivo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] font-medium mt-2 text-slate-500 text-left flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-2 inline-block"></span>
            NOTA: Esta relación deberá anexarse al concentrado de alumnos desertores en la Etapa de Zona Escolar.
          </p>
        </div>

        {/* Firmas */}
        <div className="px-8 pt-8 pb-12 text-center text-xs font-bold w-full max-w-sm mx-auto">
          <div className="border-b-2 border-slate-300 print:border-black w-full mb-2"></div>
          <div className="text-slate-800 font-bold mb-1">NOMBRE DEL DIRECTOR(A)</div>
          <div className="text-slate-400 font-medium">FIRMA Y SELLO</div>
        </div>
      </div>
    </div>
  );
}
