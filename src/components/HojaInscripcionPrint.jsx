import React from 'react';

export default function HojaInscripcionPrint({ data }) {
  const logoSEG = "https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Secretar%C3%ADa_de_Educaci%C3%B3n_Guerrero.png"; 

  const handlePrint = () => {
    window.print();
  };

  // Helper to determine if a document is present digitally (El usuario solicitÃ³ dejarlos en blanco para llenado manual)
  const hasDoc = (docKey) => {
    return 'â~?';
  };

  // Check if any digital document is missing to show the commitment legend
  // We check only the strictly required ones or all of them depending on policy.
  // User asked: "en caso de que no suban todos sus docuemtno en digital...".
  // Let's assume if they miss any of the documents, we show the legend.
  
  const isNuevoIngreso = data.grado === '1er Grado' || data.grado === '1ero' || data.tipoTramite === 'Nuevo Ingreso';
  const concepto = isNuevoIngreso 
    ? "AportaciÃ³n institucional para paquete de Credencial Escolar Oficial y Folders Administrativos."
    : "AportaciÃ³n institucional para revalidaciÃ³n de identificaciÃ³n oficial.";
  const descripcion = isNuevoIngreso
    ? "El presente recibo ampara el pago correspondiente a la emisiÃ³n de la Credencial Escolar Oficial del alumno, asÃ­ como el paquete de folders y papelerÃ­a requeridos para la integraciÃ³n, resguardo y manejo de su expediente acadÃ©mico en los departamentos de AdministraciÃ³n Escolar."
    : "El presente recibo ampara el pago correspondiente a la emisiÃ³n y/o revalidaciÃ³n de la Credencial Escolar Oficial del alumno, documento indispensable para el control de accesos, seguridad institucional y procesos de prefectura durante el ciclo escolar vigente.";

  const hasMissingDocs = !data.documentos?.acta || !data.documentos?.curp || !data.documentos?.certificado || !data.documentos?.ine || !data.documentos?.domicilio;

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

      <div className="print-wrapper">
      {/* Contenedor principal de la hoja */}
      <div className="print-container bg-white text-black mx-auto p-4 shadow-2xl print:shadow-none print:p-0" style={{ maxWidth: '21.59cm', height: '27.94cm', boxSizing: 'border-box', position: 'relative' }}>
        
        {/* Cabecera Oficial */}
        <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
          <div className="w-16">
            <img src={logoSEG} alt="SEG Logo" className="w-full grayscale" onError={(e) => e.target.style.display='none'} />
          </div>
          <div className="text-center flex-1 px-2">
            <h1 className="text-sm font-bold uppercase tracking-wide">SecretarÃ­a de EducaciÃ³n Guerrero</h1>
            <h2 className="text-xs font-bold uppercase">SubsecretarÃ­a de EducaciÃ³n BÃ¡sica</h2>
            <h3 className="text-xs font-semibold">Esc. Sec. TÃ©c. NÂ°68 "RENACIMIENTO"</h3>
            <p className="text-[10px] font-bold mt-0.5 text-slate-700">CICLO ESCOLAR: {data.cicloEscolar || '2024-2025'}</p>
            <p className="text-[10px] font-bold mt-1 bg-gray-200 inline-block px-2 py-0.5 rounded border border-gray-400 uppercase">
              FICHA INDIVIDUAL DE {data.tipoTramite || 'INSCRIPCIÃ"N'}
            </p>
          </div>
          <div className="w-16 flex flex-col items-center justify-center">
            {/* Espacio para Foto */}
            <div className="w-16 h-20 border-2 border-gray-400 flex items-center justify-center text-[8px] text-gray-500 text-center overflow-hidden">
              {data.fotoUrl ? (
                <img src={data.fotoUrl} alt="FotografÃ­a" className="w-full h-full object-cover grayscale" />
              ) : (
                "FOTO"
              )}
            </div>
          </div>
        </div>

        {/* SecciÃ³n 1: Datos AcadÃ©micos */}
        <div className="mb-2">
          <h4 className="font-bold text-[9px] uppercase bg-gray-800 text-white px-1.5 py-0.5 mb-0.5">1. Datos AcadÃ©micos</h4>
          <div className="grid grid-cols-5 gap-1 text-[9px] border border-gray-300 p-1 leading-tight">
            <div><span className="font-bold text-gray-600">Grado:</span> <br/><span className="font-semibold uppercase">{data.grado || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Grupo:</span> <br/><span className="font-semibold uppercase">{data.grupo || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Turno:</span> <br/><span className="font-semibold uppercase">{data.turno || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Taller:</span> <br/><span className="font-semibold uppercase">{data.taller || '-'}</span></div>
            <div><span className="font-bold text-gray-600">MatrÃ­cula:</span> <br/><span className="font-semibold uppercase">{data.matricula || 'N/A'}</span></div>
          </div>
        </div>

        {/* SecciÃ³n 2: Datos del Alumno */}
        <div className="mb-2">
          <h4 className="font-bold text-[9px] uppercase bg-gray-800 text-white px-1.5 py-0.5 mb-0.5">2. Datos Personales del Alumno</h4>
          <div className="grid grid-cols-4 gap-1 text-[9px] border border-gray-300 p-1 mb-1 leading-tight">
            <div className="col-span-2"><span className="font-bold text-gray-600">Apellidos:</span> <br/><span className="font-semibold uppercase">{data.apellidoPaterno} {data.apellidoMaterno}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600">Nombre(s):</span> <br/><span className="font-semibold uppercase">{data.nombres}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600">CURP:</span> <br/><span className="font-semibold uppercase tracking-widest">{data.curp}</span></div>
            <div><span className="font-bold text-gray-600">Fecha Nacimiento:</span> <br/><span className="font-semibold uppercase">{data.fechaNacimiento || '-'}</span></div>
            <div><span className="font-bold text-gray-600">GÃ©nero:</span> <br/><span className="font-semibold uppercase">{data.genero || '-'}</span></div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[9px] border border-gray-300 p-1 leading-tight">
            <div className="col-span-1"><span className="font-bold text-gray-600">Calle:</span> <br/><span className="font-semibold uppercase">{data.calleNumero || data.calle || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">NÃºmero:</span> <br/><span className="font-semibold uppercase">{data.numero || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">Colonia:</span> <br/><span className="font-semibold uppercase">{data.colonia || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">C.P.:</span> <br/><span className="font-semibold uppercase">{data.codigoPostal || data.cp || '-'}</span></div>
          </div>
        </div>

        {/* SecciÃ³n 3: Escuela de Procedencia */}
        <div className="mb-2">
          <h4 className="font-bold text-[9px] uppercase bg-gray-800 text-white px-1.5 py-0.5 mb-0.5">3. Antecedentes Escolares</h4>
          <div className="grid grid-cols-5 gap-1 text-[9px] border border-gray-300 p-1 leading-tight bg-gray-50">
            <div className="col-span-2"><span className="font-bold text-gray-600">Escuela de Procedencia:</span> <br/><span className="font-semibold uppercase">{data.escuelaProcedencia || '-'}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600">Domicilio de la Escuela:</span> <br/><span className="font-semibold uppercase">{data.domicilioEscuela || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">Promedio Obtenido:</span> <br/><span className="font-semibold uppercase">{data.promedioEscuela || '-'}</span></div>
          </div>
        </div>

        {/* SecciÃ³n 4: CÃ©dula de Salud */}
        <div className="mb-2">
          <h4 className="font-bold text-[9px] uppercase bg-gray-800 text-white px-1.5 py-0.5 mb-0.5">4. InformaciÃ³n MÃ©dica de Urgencia</h4>
          <div className="grid grid-cols-4 gap-1 text-[9px] border border-gray-300 p-1 leading-tight">
            <div><span className="font-bold text-gray-600">Tipo de Sangre:</span> <br/><span className="font-semibold uppercase">{data.tipoSangre || 'NO ESPECIFICADO'}</span></div>
            <div className="col-span-3"><span className="font-bold text-gray-600">Alergias conocidas:</span> <br/><span className="font-semibold uppercase">{data.alergias || 'NINGUNA'}</span></div>
            <div className="col-span-3"><span className="font-bold text-gray-600">Padecimientos o Enf. CrÃ³nicas:</span> <br/><span className="font-semibold uppercase">{data.padecimientos || 'NINGUNO'}</span></div>
            <div><span className="font-bold text-gray-600">Â¿Usa lentes?:</span> <br/><span className="font-semibold uppercase">{data.lentes || 'NO'}</span></div>
          </div>
        </div>

        {/* SecciÃ³n 5: Datos del Tutor y Referencias */}
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

        {/* SecciÃ³n 6: DocumentaciÃ³n Entregada */}
        <div className="mb-2">
          <h4 className="font-bold text-[9px] uppercase bg-gray-800 text-white px-1.5 py-0.5 mb-0.5">6. Acuse de DocumentaciÃ³n Recibida</h4>
          <div className="border border-gray-300 p-1.5 text-[8px] leading-tight">
            <p className="mb-1 text-gray-600 font-bold">Marque con una 'X' si el documento fue entregado fÃ­sicamente para cotejo o si fue detectado en sistema:</p>
            <div className="grid grid-cols-1 gap-1 mb-2 font-medium text-[8px]">
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('certificado')}</span> Certificado de educaciÃ³n primaria o constancia de terminaciÃ³n de estudios de 6to grado</div>
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('acta')}</span> Acta de nacimiento actualizada</div>
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('curp')}</span> CURP formato reciente y legible</div>
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('asignacion')}</span> Comprobante de asignaciÃ³n (folio o documento del portal de preinscripciÃ³n SEP, si aplica)</div>
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('ine')}</span> IdentificaciÃ³n oficial vigente (INE o Pasaporte)</div>
              <div><span className="text-lg leading-none align-middle mr-1">{hasDoc('domicilio')}</span> Comprobante de domicilio reciente (luz, agua o telÃ©fono no mayor a 3 meses)</div>
            </div>
            <div className="flex border-t border-gray-200 pt-1">
              <span className="font-bold text-gray-600 mr-2">Observaciones / Faltantes:</span> 
              <div className="flex-1 border-b border-dotted border-gray-400"></div>
            </div>
          </div>
        </div>

        {/* Leyenda de Carta Compromiso si faltan documentos */}
        {hasMissingDocs && (
          <div className="mb-2 mt-2 px-2 text-[8px] border border-gray-400 p-1.5 bg-gray-50 text-justify leading-tight">
            <span className="font-bold">CARTA COMPROMISO DE ENTREGA DE DOCUMENTACIÃ"N:</span> El que suscribe, en su carÃ¡cter de Padre, Madre o Tutor del alumno(a), al no contar con la totalidad de los requisitos en este momento, se compromete formalmente a entregar en la DirecciÃ³n de la escuela la documentaciÃ³n faltante o pendiente indicada en el presente acuse, a mÃ¡s tardar el Ãºltimo dÃ­a hÃ¡bil del mes de septiembre del ciclo escolar en curso.
          </div>
        )}

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
            <p className="text-[8px] text-gray-700 mt-0.5">Sello y Firma de AutorizaciÃ³n<br/>(Director del Plantel)</p>
          </div>
        </div>

        {/* Footer ABSOLUTO abajo */}
        <div className="absolute bottom-2 left-0 right-0 text-center text-[7px] text-gray-500 border-t border-gray-300 pt-1 mx-4">
          La informaciÃ³n aquÃ­ recabada serÃ¡ utilizada exclusivamente para fines escolares y estÃ¡ protegida por la Ley de ProtecciÃ³n de Datos Personales en PosesiÃ³n de Sujetos Obligados del Estado de Guerrero.
          <br/> Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}
        </div>

      </div>

      {/* SEGUNDA PÁGINA: ORDEN DE PAGO */}
      <div className="print-container bg-white text-black mx-auto p-8 shadow-2xl print:shadow-none print:p-0 mt-8 print:mt-0 flex flex-col" style={{ maxWidth: '21.59cm', height: '27.94cm', boxSizing: 'border-box', position: 'relative' }}>
        
        {/* Cabecera Oficial Pago */}
        <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
          <div className="w-20">
            <img src={logoSEG} alt="SEG Logo" className="w-full grayscale" onError={(e) => e.target.style.display='none'} />
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-lg font-bold uppercase tracking-wide">Secretaría de Educación Guerrero</h1>
            <h2 className="text-sm font-bold uppercase">Subsecretaría de Educación Básica</h2>
            <h3 className="text-sm font-semibold">Esc. Sec. Téc. N°68 "RENACIMIENTO"</h3>
            <p className="text-xs font-bold mt-2 bg-gray-200 inline-block px-3 py-1 rounded border border-gray-400 uppercase tracking-widest">
              ORDEN DE PAGO A CONTRALORÍA
            </p>
          </div>
          <div className="w-20 flex flex-col items-center justify-center">
             <div className="text-center border-2 border-gray-800 p-2 rounded-lg">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Ciclo Escolar</p>
                <p className="text-sm font-black">{data.cicloEscolar || '2024-2025'}</p>
             </div>
          </div>
        </div>

        {/* Datos del Alumno para Pago */}
        <div className="mb-8 border border-gray-400 p-6 rounded-lg bg-gray-50">
          <h4 className="font-black text-sm uppercase text-gray-800 mb-4 border-b border-gray-300 pb-2">Datos del Contribuyente (Alumno)</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-bold text-gray-600">Nombre Completo:</span> <br/><span className="font-black text-lg uppercase">{data.nombres} {data.apellidoPaterno} {data.apellidoMaterno}</span></div>
            <div><span className="font-bold text-gray-600">CURP:</span> <br/><span className="font-black text-lg uppercase tracking-widest">{data.curp}</span></div>
            <div><span className="font-bold text-gray-600">Grado y Grupo a Ingresar:</span> <br/><span className="font-bold uppercase text-base">{data.grado || '-'} "{data.grupo || '-'}"</span></div>
            <div><span className="font-bold text-gray-600">Tutor Responsable:</span> <br/><span className="font-bold uppercase text-base">{data.tutor || data.tutorNombre || '-'}</span></div>
          </div>
        </div>

        {/* Concepto de Cobro */}
        <div className="mb-8 border-2 border-gray-800 p-6 rounded-lg">
          <h4 className="font-black text-sm uppercase bg-gray-800 text-white inline-block px-3 py-1 rounded mb-4">Detalle del Trámite</h4>
          
          <div className="mb-4">
            <span className="font-bold text-gray-500 uppercase text-xs">Concepto de Cobro:</span>
            <p className="font-black text-xl text-gray-900 mt-1">{concepto}</p>
          </div>

          <div className="mb-4">
            <span className="font-bold text-gray-500 uppercase text-xs">Descripción y Fundamento Legal:</span>
            <p className="font-medium text-sm text-gray-700 mt-1 text-justify leading-relaxed">{descripcion}</p>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mb-12 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="font-bold text-sm text-yellow-800 uppercase mb-1">Instrucciones Importantes:</p>
          <p className="text-sm text-yellow-700">Estimado Padre, Madre o Tutor: Para continuar con el trámite, deberá presentar este documento impreso en la ventanilla del Departamento de Contraloría del plantel para realizar la aportación correspondiente. Una vez efectuado el pago, el sistema desbloqueará automáticamente la impresión de su credencial escolar.</p>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-12 text-center text-xs px-12 mb-12">
          <div>
            <div className="border-t border-black pt-2 w-full mx-auto font-bold uppercase truncate">
              {data.tutor || data.tutorNombre || 'Firma del Tutor'}
            </div>
            <p className="text-[10px] text-gray-700 mt-1">Firma de Conformidad (Padre/Tutor)</p>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2 w-full mx-auto font-bold uppercase text-gray-400">
              Sello de Contraloría
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Exclusivo para uso del plantel</p>
          </div>
        </div>
        
        {/* Footer ABSOLUTO abajo */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-[9px] text-gray-500 border-t border-gray-300 pt-2 mx-8">
          Escuela Secundaria Técnica N° 68 "Renacimiento" - Departamento de Contraloría
          <br/> Documento generado electrónicamente el {new Date().toLocaleDateString()}
        </div>
      </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-wrapper, .print-wrapper * { visibility: visible; }
          .print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-container {
            width: 100%;
            height: 27.94cm;
            margin: 0;
            padding: 0;
            box-shadow: none;
            page-break-after: always;
            position: relative;
          }
          @page { size: letter; margin: 0.5cm; }
        }
      `}} />
    </div>
  );
}
