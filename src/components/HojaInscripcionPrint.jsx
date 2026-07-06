import React from 'react';

export default function HojaInscripcionPrint({ data }) {
  const logoSEG = "https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Secretar%C3%ADa_de_Educaci%C3%B3n_Guerrero.png"; 

  const handlePrint = () => {
    window.print();
  };

  // Helper to determine if a document is present digitally
  const hasDoc = (docKey) => {
    return data.documentos && data.documentos[docKey] ? '☑' : '☐';
  };

  return (
    <div>
      <div className="flex justify-center mb-6 print:hidden">
        <button 
          onClick={handlePrint}
          className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Imprimir / Guardar como PDF
        </button>
      </div>

      {/* Contenedor principal de la hoja tamaño carta */}
      <div className="print-container bg-white text-black mx-auto p-4 shadow-2xl print:shadow-none print:p-0" style={{ maxWidth: '21.59cm', height: '27.94cm', boxSizing: 'border-box', position: 'relative' }}>
        
        {/* Cabecera Oficial */}
        <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
          <div className="w-16">
            <img src={logoSEG} alt="SEG Logo" className="w-full grayscale" onError={(e) => e.target.style.display='none'} />
          </div>
          <div className="text-center flex-1 px-2">
            <h1 className="text-sm font-bold uppercase tracking-wide">Secretaría de Educación Guerrero</h1>
            <h2 className="text-xs font-bold uppercase">Subsecretaría de Educación Básica</h2>
            <h3 className="text-xs font-semibold">Esc. Sec. Téc. N°68 "RENACIMIENTO"</h3>
            <p className="text-[10px] font-bold mt-0.5 text-slate-700">CICLO ESCOLAR: {data.cicloEscolar || '2024-2025'}</p>
            <p className="text-[10px] font-bold mt-1 bg-gray-200 inline-block px-2 py-0.5 rounded border border-gray-400 uppercase">
              FICHA INDIVIDUAL DE {data.tipoTramite || 'INSCRIPCIÓN'}
            </p>
          </div>
          <div className="w-16 flex flex-col items-center justify-center">
            {/* Espacio para Foto */}
            <div className="w-16 h-20 border-2 border-gray-400 flex items-center justify-center text-[8px] text-gray-500 text-center overflow-hidden">
              {data.fotoUrl ? (
                <img src={data.fotoUrl} alt="Fotografía" className="w-full h-full object-cover grayscale" />
              ) : (
                "FOTO"
              )}
            </div>
          </div>
        </div>

        {/* Sección 1: Datos Académicos */}
        <div className="mb-2">
          <h4 className="font-bold text-[9px] uppercase bg-gray-800 text-white px-1.5 py-0.5 mb-0.5">1. Datos Académicos</h4>
          <div className="grid grid-cols-5 gap-1 text-[9px] border border-gray-300 p-1 leading-tight">
            <div><span className="font-bold text-gray-600">Grado:</span> <br/><span className="font-semibold uppercase">{data.grado || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Grupo:</span> <br/><span className="font-semibold uppercase">{data.grupo || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Turno:</span> <br/><span className="font-semibold uppercase">{data.turno || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Taller:</span> <br/><span className="font-semibold uppercase">{data.taller || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Matrícula:</span> <br/><span className="font-semibold uppercase">{data.matricula || 'N/A'}</span></div>
          </div>
        </div>

        {/* Sección 2: Datos del Alumno */}
        <div className="mb-2">
          <h4 className="font-bold text-[9px] uppercase bg-gray-800 text-white px-1.5 py-0.5 mb-0.5">2. Datos Personales del Alumno</h4>
          <div className="grid grid-cols-4 gap-1 text-[9px] border border-gray-300 p-1 mb-1 leading-tight">
            <div className="col-span-2"><span className="font-bold text-gray-600">Apellidos:</span> <br/><span className="font-semibold uppercase">{data.apellidoPaterno} {data.apellidoMaterno}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600">Nombre(s):</span> <br/><span className="font-semibold uppercase">{data.nombres}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600">CURP:</span> <br/><span className="font-semibold uppercase tracking-widest">{data.curp}</span></div>
            <div><span className="font-bold text-gray-600">Fecha Nacimiento:</span> <br/><span className="font-semibold uppercase">{data.fechaNacimiento || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Género:</span> <br/><span className="font-semibold uppercase">{data.genero || '-'}</span></div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[9px] border border-gray-300 p-1 leading-tight">
            <div className="col-span-1"><span className="font-bold text-gray-600">Calle:</span> <br/><span className="font-semibold uppercase">{data.calleNumero || data.calle || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">Número:</span> <br/><span className="font-semibold uppercase">{data.numero || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">Colonia:</span> <br/><span className="font-semibold uppercase">{data.colonia || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">C.P.:</span> <br/><span className="font-semibold uppercase">{data.codigoPostal || data.cp || '-'}</span></div>
          </div>
        </div>

        {/* Sección 3: Escuela de Procedencia */}
        <div className="mb-2">
          <h4 className="font-bold text-[9px] uppercase bg-gray-800 text-white px-1.5 py-0.5 mb-0.5">3. Antecedentes Escolares</h4>
          <div className="grid grid-cols-5 gap-1 text-[9px] border border-gray-300 p-1 leading-tight bg-gray-50">
            <div className="col-span-2"><span className="font-bold text-gray-600">Escuela de Procedencia:</span> <br/><span className="font-semibold uppercase">{data.escuelaProcedencia || '-'}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600">Domicilio de la Escuela:</span> <br/><span className="font-semibold uppercase">{data.domicilioEscuela || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">Promedio Obtenido:</span> <br/><span className="font-semibold uppercase">{data.promedioEscuela || '-'}</span></div>
          </div>
        </div>

        {/* Sección 4: Cédula de Salud */}
        <div className="mb-2">
          <h4 className="font-bold text-[9px] uppercase bg-gray-800 text-white px-1.5 py-0.5 mb-0.5">4. Información Médica de Urgencia</h4>
          <div className="grid grid-cols-4 gap-1 text-[9px] border border-gray-300 p-1 leading-tight">
            <div><span className="font-bold text-gray-600">Tipo de Sangre:</span> <br/><span className="font-semibold uppercase">{data.tipoSangre || 'NO ESPECIFICADO'}</span></div>
            <div className="col-span-3"><span className="font-bold text-gray-600">Alergias conocidas:</span> <br/><span className="font-semibold uppercase">{data.alergias || 'NINGUNA'}</span></div>
            <div className="col-span-3"><span className="font-bold text-gray-600">Padecimientos o Enf. Crónicas:</span> <br/><span className="font-semibold uppercase">{data.padecimientos || 'NINGUNO'}</span></div>
            <div><span className="font-bold text-gray-600">¿Usa lentes?:</span> <br/><span className="font-semibold uppercase">{data.lentes || 'NO'}</span></div>
          </div>
        </div>

        {/* Sección 5: Datos del Tutor y Referencias */}
        <div className="mb-2">
          <h4 className="font-bold text-[9px] uppercase bg-gray-800 text-white px-1.5 py-0.5 mb-0.5">5. Tutor y Contactos de Emergencia</h4>
          <div className="grid grid-cols-3 gap-1 text-[9px] border border-gray-300 p-1 mb-1 leading-tight">
            <div className="col-span-2"><span className="font-bold text-gray-600">Tutor Principal:</span> <br/><span className="font-semibold uppercase">{data.tutor || data.tutorNombre || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Celular / WhatsApp:</span> <br/><span className="font-semibold uppercase">{data.celularTutor || data.telefono || '-'}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[9px] border border-gray-300 p-1 bg-gray-50 leading-tight">
            <div><span className="font-bold text-gray-600">Referencia 1:</span> <br/><span className="font-semibold uppercase">{data.referencia1 || data.emergenciaNombre1 || '-'}</span> <br/> <span className="text-gray-600">Tel:</span> <span className="font-semibold">{data.celularRef1 || data.emergenciaTel1 || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Referencia 2:</span> <br/><span className="font-semibold uppercase">{data.referencia2 || data.emergenciaNombre2 || '-'}</span> <br/> <span className="text-gray-600">Tel:</span> <span className="font-semibold">{data.celularRef2 || data.emergenciaTel2 || '-'}</span></div>
          </div>
        </div>

        {/* Sección 6: Documentación Entregada */}
        <div className="mb-2">
          <h4 className="font-bold text-[9px] uppercase bg-gray-800 text-white px-1.5 py-0.5 mb-0.5">6. Acuse de Documentación Recibida</h4>
          <div className="border border-gray-300 p-1.5 text-[8px] leading-tight">
            <p className="mb-1 text-gray-600 font-bold">Marque con una 'X' si el documento fue entregado físicamente para cotejo o si fue detectado en sistema:</p>
            <div className="grid grid-cols-4 gap-2 mb-2 font-medium">
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('acta')}</span> Acta de Nacimiento</div>
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('curp')}</span> CURP</div>
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('certificado')}</span> Certificado de Primaria</div>
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('conducta')}</span> Carta de Conducta</div>
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('ine')}</span> INE del Tutor</div>
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('medico')}</span> Certificado Médico</div>
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('fotos')}</span> 6 Fotografías T. Infantil</div>
            </div>
            <div className="flex border-t border-gray-200 pt-1">
              <span className="font-bold text-gray-600 mr-2">Observaciones / Faltantes:</span> 
              <div className="flex-1 border-b border-dotted border-gray-400"></div>
            </div>
          </div>
        </div>

        {/* Firmas */}
        <div className="mt-8 grid grid-cols-3 gap-6 text-center text-[9px] px-4">
          <div>
            <div className="border-t border-black pt-1 w-full mx-auto font-bold uppercase truncate">
              {data.tutor || data.tutorNombre || 'Firma del Tutor'}
            </div>
            <p className="text-[8px] text-gray-700 mt-0.5">Padre, Madre o Tutor Legal</p>
          </div>
          <div>
            <div className="border-t border-black pt-1 w-full mx-auto font-bold uppercase truncate">
              {data.nombres} {data.apellidoPaterno} {data.apellidoMaterno}
            </div>
            <p className="text-[8px] text-gray-700 mt-0.5">Firma del Alumno(a)</p>
          </div>
          <div className="text-center pt-2">
            <div className="border-t border-black w-40 mx-auto pt-1 font-bold text-[10px] text-black">
              Profr. Juan Carlos Taboada Barajas
            </div>
            <p className="text-[8px] text-gray-700 mt-0.5">Sello y Firma de Autorización<br/>(Director del Plantel)</p>
          </div>
        </div>

        {/* Footer ABSOLUTO abajo */}
        <div className="absolute bottom-2 left-0 right-0 text-center text-[7px] text-gray-500 border-t border-gray-300 pt-1 mx-4">
          La información aquí recabada será utilizada exclusivamente para fines escolares y está protegida por la Ley de Protección de Datos Personales en Posesión de Sujetos Obligados del Estado de Guerrero.
          <br/> Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          @page { size: letter; margin: 0.5cm; }
        }
      `}} />
    </div>
  );
}
