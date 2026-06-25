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

      <div id="printable-desertores" className="bg-white my-8 w-full max-w-[297mm] mx-auto shadow-2xl print:my-0 print:shadow-none print:max-w-none text-xs">
        {/* Encabezado */}
        <div className="pt-8 px-8 pb-4 text-center font-bold relative">
          <div className="absolute top-8 left-8">
            <img src="/logo-escuela.png" alt="Escudo" className="h-16 w-auto object-contain" />
          </div>
          <p className="text-sm">SECRETARÍA DE EDUCACIÓN GUERRERO</p>
          <p className="text-sm">DIRECCIÓN GENERAL DE EDUCACIÓN SECUNDARIA</p>
          <p className="text-sm uppercase">SEGUNDO MOMENTO DE VALORACIÓN DE LOS COLECTIVOS ESCOLARES.</p>
          <p className="text-sm">CICLO ESCOLAR 2025-2026</p>
          
          <div className="mt-2 text-center text-red-600 font-black tracking-widest text-lg">
            ~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~.~
          </div>
        </div>

        {/* Datos de Escuela */}
        <div className="px-8 pb-4">
          <table className="w-full text-xs font-bold border-collapse">
            <tbody>
              <tr>
                <td className="w-1/4 text-right pr-2 py-1">ESCUELA SECUNDARIA:</td>
                <td className="w-1/4 border-b border-black text-center py-1">RENACIMIENTO</td>
                <td className="w-1/4 text-right pr-2 py-1">C.C.T. :</td>
                <td className="w-1/4 border-b border-black text-center py-1">12EES0000X</td>
                <td className="text-right pr-2 py-1">ZONA ESCOLAR:</td>
                <td className="border-b border-black text-center w-16 py-1">00</td>
              </tr>
              <tr>
                <td className="text-right pr-2 py-1">LOCALIDAD:</td>
                <td className="border-b border-black text-center py-1">ACAPULCO</td>
                <td className="text-right pr-2 py-1">MUNICIPIO:</td>
                <td className="border-b border-black text-center py-1">ACAPULCO DE JUÁREZ</td>
                <td className="text-right pr-2 py-1">REGIÓN:</td>
                <td className="border-b border-black text-center py-1">ACAPULCO</td>
              </tr>
              <tr>
                <td className="text-right pr-2 py-1">NOMBRE DEL DIRECTOR(A):</td>
                <td className="border-b border-black text-center py-1">PROF. JAVIER GOMEZ</td>
                <td className="text-right pr-2 py-1">TEL DE LA ESC:</td>
                <td className="border-b border-black text-center py-1">7440000000</td>
                <td colSpan="2"></td>
              </tr>
              <tr>
                <td className="text-right pr-2 py-1">TEL DEL DIRECTOR:</td>
                <td className="border-b border-black text-center py-1">7441111111</td>
                <td className="text-right pr-2 py-1">CORREO ELECTRÓNICO:</td>
                <td colSpan="3" className="border-b border-black text-center py-1">secundaria@renacimiento.edu.mx</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabla de Desertores */}
        <div className="px-8 pb-4">
          <div className="text-center font-black text-sm uppercase mb-1 flex items-center justify-center bg-amber-200/50 py-1 border border-black border-b-0">
            RELACIÓN DE ALUMNOS DESERTORES
          </div>
          <table className="w-full border-collapse text-[10px] text-center border border-black">
            <thead>
              <tr className="bg-amber-100/50">
                <th rowSpan="2" className="border border-black p-1 w-8">N/P</th>
                <th rowSpan="2" className="border border-black p-1">NOMBRE</th>
                <th colSpan="2" className="border border-black p-1">SEXO</th>
                <th rowSpan="2" className="border border-black p-1 w-12">EDAD</th>
                <th colSpan="3" className="border border-black p-1">FECHA DE<br/>NACIMIENTO</th>
                <th rowSpan="2" className="border border-black p-1 w-16">GRADO<br/>Y GRUPO</th>
                <th rowSpan="2" className="border border-black p-1">DOMICILIO</th>
                <th rowSpan="2" className="border border-black p-1 w-48">CAUSA DE DESERCIÓN*</th>
              </tr>
              <tr className="bg-amber-100/50">
                <th className="border border-black p-1 w-6">H</th>
                <th className="border border-black p-1 w-6">M</th>
                <th className="border border-black p-1 w-10">AÑO</th>
                <th className="border border-black p-1 w-8">MES</th>
                <th className="border border-black p-1 w-8">DÍA</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((s, idx) => {
                const nombreCompleto = s ? `${s.apellidoPaterno} ${s.apellidoMaterno} ${s.nombres}`.toUpperCase() : '';
                const h = (s && s.genero === 'Hombre') ? '1' : '';
                const m = (s && s.genero === 'Mujer') ? '1' : '';
                const edad = s ? calcularEdad(s.fechaNacimiento) : '';
                const fecha = s ? separarFecha(s.fechaNacimiento) : {ano:'', mes:'', dia:''};
                const gradoGrupo = s ? `${s.grado[0]} "${s.grupo}"` : '';
                const domicilio = s ? `${s.calle || ''} ${s.numero || ''} ${s.colonia || ''}`.trim().toUpperCase() : '';
                const motivo = s ? (s.motivoBaja || '').toUpperCase() : '';

                return (
                  <tr key={idx} className="h-6">
                    <td className="border border-black p-1">{s ? idx + 1 : ''}</td>
                    <td className="border border-black p-1 text-left font-bold">{nombreCompleto}</td>
                    <td className="border border-black p-1">{h}</td>
                    <td className="border border-black p-1">{m}</td>
                    <td className="border border-black p-1">{edad}</td>
                    <td className="border border-black p-1">{fecha.ano}</td>
                    <td className="border border-black p-1">{fecha.mes}</td>
                    <td className="border border-black p-1">{fecha.dia}</td>
                    <td className="border border-black p-1 font-bold">{gradoGrupo}</td>
                    <td className="border border-black p-1 text-left px-2 truncate max-w-[200px]" title={domicilio}>{domicilio}</td>
                    <td className="border border-black p-1 text-left px-2 truncate max-w-[150px]" title={motivo}>{motivo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[10px] font-bold mt-1 text-left">
            NOTA: Esta relación deberá anexarse al concentrado de alumnos desertores en la Etapa de Zona Escolar.
          </p>
        </div>

        {/* Firmas */}
        <div className="px-8 pt-8 pb-16 text-center text-xs font-bold w-full max-w-sm mx-auto">
          <div className="border-b border-black w-full mb-1">NOMBRE DEL DIRECTOR</div>
          <div className="text-slate-500 font-normal">FIRMA Y SELLO</div>
        </div>
      </div>
    </div>
  );
}
