import { useState, useEffect } from 'react';

const images = Array.from({ length: 9 }, (_, i) => `/carousel/foto${i + 1}.jpeg`);

export default function InscripcionBanner() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 4000); // Cambia cada 4 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white border-l-8 border-blue-800 rounded-lg shadow-xl overflow-hidden mb-8 transform transition-all hover:scale-[1.01]">
      
      {/* Carrusel de Imágenes con Encabezado Superpuesto */}
      <div className="relative w-full h-48 sm:h-64 overflow-hidden bg-slate-900">
        {images.map((img, idx) => (
          <img 
            key={idx} 
            src={img} 
            alt={`Escuela Técnica N°68 - Foto ${idx + 1}`} 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              idx === currentIdx ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`} 
          />
        ))}
        {/* Capa de gradiente oscuro para que el texto resalte siempre */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/30 to-transparent"></div>
        
        {/* Textos del Encabezado */}
        <div className="absolute bottom-4 left-6 right-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase drop-shadow-md">
            Requisitos de Inscripción
          </h2>
          <p className="text-sm sm:text-base text-blue-100 font-medium mt-1 drop-shadow-md">
            Nuevo Ingreso - 1er Año | Escuela Secundaria Técnica N°68 "Renacimiento"
          </p>
        </div>

        {/* Etiqueta Importante */}
        <span className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg border border-red-500/50">
          Importante
        </span>

        {/* Indicadores del carrusel (puntitos) */}
        <div className="absolute bottom-4 right-6 flex space-x-2">
          {images.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIdx ? 'bg-white w-4' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* Contenido del Banner */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        
        {/* Sección Alumno */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-2">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
            Documentación del Alumno
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start"><span className="text-green-500 mr-2 shrink-0">✔</span> <span>Tener menos de 15 años (al 31/Dic/2026)</span></li>
            <li className="flex items-start"><span className="text-green-500 mr-2 shrink-0">✔</span> <span>Certificado de Educación Primaria</span></li>
            <li className="flex items-start"><span className="text-green-500 mr-2 shrink-0">✔</span> <span>Acta de Nacimiento actualizada</span></li>
            <li className="flex items-start"><span className="text-green-500 mr-2 shrink-0">✔</span> <span>CURP (formato reciente)</span></li>
            <li className="flex items-start"><span className="text-green-500 mr-2 shrink-0">✔</span> <span>Comprobante de asignación (Portal SEG)</span></li>
          </ul>
        </div>

        {/* Sección Tutor */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-2">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Documentación del Tutor
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start"><span className="text-green-500 mr-2 shrink-0">✔</span> <span>Identificación Oficial Vigente (INE)</span></li>
            <li className="flex items-start"><span className="text-green-500 mr-2 shrink-0">✔</span> <span>Comprobante de Domicilio (no mayor a 3 meses)</span></li>
          </ul>
        </div>
        
      </div>
    </div>
  );
}
