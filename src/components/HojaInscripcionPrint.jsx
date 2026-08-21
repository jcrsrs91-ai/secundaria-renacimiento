import React from 'react';
import { useGlobalConfig } from '../hooks/useGlobalConfig';

export default function HojaInscripcionPrint({ data }) {
  const { config } = useGlobalConfig();
  const logoSEG = "https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Secretar%C3%ADa_de_Educaci%C3%B3n_Guerrero.png"; 

  const handlePrint = () => {
    window.print();
  };

  // Helper to determine if a document is present digitally (El usuario solicitó dejarlos en blanco para llenado manual)
  const hasDoc = (docKey) => {
    return '    ';
  };

  // Check if any digital document is missing to show the commitment legend
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
        <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
          <div className="w-20">
            <img src={logoSEG} alt="SEG Logo" className="w-full grayscale" onError={(e) => e.target.style.display='none'} />
          </div>
          <div className="text-center flex-1 px-2">
            <h1 className="text-base font-bold uppercase tracking-wide">Secretaría de Educación Guerrero</h1>
            <h2 className="text-sm font-bold uppercase">Subsecretaría de Educación Básica</h2>
            <h3 className="text-sm font-semibold">Esc. Sec. Téc. N°68 "RENACIMIENTO"</h3>
            <p className="text-xs font-bold mt-1 text-slate-700">CICLO ESCOLAR: {data.cicloEscolar || config?.cicloEscolarActual || '2025-2026'}</p>
            <p className="text-xs font-bold mt-1 bg-gray-200 inline-block px-3 py-0.5 rounded border border-gray-400 uppercase">
              FICHA INDIVIDUAL DE {data.tipoTramite || 'INSCRIPCIÓN'}
            </p>
          </div>
          <div className="w-20 flex flex-col items-center justify-center">
            {/* Espacio para Foto */}
            <div className="w-20 h-24 border-2 border-gray-400 flex items-center justify-center text-[10px] text-gray-500 text-center overflow-hidden">
              {data.fotoUrl ? (
                <img src={data.fotoUrl} alt="Fotografía" className="w-full h-full object-cover grayscale" />
              ) : (
                "FOTO"
              )}
            </div>
          </div>
        </div>

        {/* Sección 1: Datos Académicos */}
        <div className="mb-3">
          <h4 className="font-bold text-xs uppercase bg-gray-800 text-white px-2 py-0.5 mb-1">1. Datos Académicos</h4>
          <div className="grid grid-cols-6 gap-2 text-[10px] border border-gray-300 p-2 leading-tight">
            <div><span className="font-bold text-gray-600">Grado:</span> <br/><span className="font-bold text-sm uppercase">{data.grado || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Grupo:</span> <br/><span className="font-bold text-sm uppercase">{data.grupo || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Turno:</span> <br/><span className="font-bold text-sm uppercase">{data.turno || '-'}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600">Taller:</span> <br/><span className="font-semibold uppercase text-xs">{data.taller || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Matrícula:</span> <br/><span className="font-semibold uppercase text-xs">{data.matricula || 'N/A'}</span></div>
          </div>
        </div>

        {/* Sección 2: Datos del Alumno */}
        <div className="mb-3">
          <h4 className="font-bold text-xs uppercase bg-gray-800 text-white px-2 py-0.5 mb-1">2. Datos Personales del Alumno</h4>
          <div className="grid grid-cols-4 gap-2 text-[10px] border border-gray-300 p-2 mb-1 leading-tight">
            <div className="col-span-2"><span className="font-bold text-gray-600">Apellidos:</span> <br/><span className="font-semibold uppercase text-xs">{data.apellidoPaterno} {data.apellidoMaterno}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600">Nombre(s):</span> <br/><span className="font-semibold uppercase text-xs">{data.nombres}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600">CURP:</span> <br/><span className="font-semibold uppercase tracking-widest text-xs">{data.curp}</span></div>
            <div><span className="font-bold text-gray-600">Fecha Nacimiento:</span> <br/><span className="font-semibold uppercase text-xs">{data.fechaNacimiento || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Género:</span> <br/><span className="font-semibold uppercase text-xs">{data.genero || '-'}</span></div>
          </div>
          <div className="grid grid-cols-5 gap-2 text-[10px] border border-gray-300 p-2 leading-tight">
            <div className="col-span-2"><span className="font-bold text-gray-600">Calle:</span> <br/><span className="font-semibold uppercase text-xs">{data.calleNumero || data.calle || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">Número:</span> <br/><span className="font-semibold uppercase text-xs">{data.numero || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">Colonia:</span> <br/><span className="font-semibold uppercase text-xs">{data.colonia || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">C.P.:</span> <br/><span className="font-semibold uppercase text-xs">{data.codigoPostal || data.cp || '-'}</span></div>
          </div>
        </div>

        {/* Sección 3: Escuela de Procedencia y Becas */}
        <div className="mb-3">
          <h4 className="font-bold text-xs uppercase bg-gray-800 text-white px-2 py-0.5 mb-1">3. Antecedentes Escolares y Becas</h4>
          <div className="grid grid-cols-6 gap-2 text-[10px] border border-gray-300 p-2 leading-tight bg-gray-50">
            <div className="col-span-2"><span className="font-bold text-gray-600">Escuela de Procedencia:</span> <br/><span className="font-semibold uppercase text-xs">{data.escuelaProcedencia || '-'}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600">Domicilio de la Escuela:</span> <br/><span className="font-semibold uppercase text-xs">{data.domicilioEscuela || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">Promedio Obtenido:</span> <br/><span className="font-semibold uppercase text-xs">{data.promedioEscuela || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600">¿Cuenta con Beca?:</span> <br/><span className="font-semibold uppercase text-xs">{data.tieneBeca || data.beca ? 'SÍ' : 'NO'}</span></div>
          </div>
        </div>

        {/* Sección 4: Cédula de Salud */}
        <div className="mb-3">
          <h4 className="font-bold text-xs uppercase bg-gray-800 text-white px-2 py-0.5 mb-1">4. Información Médica de Urgencia</h4>
          <div className="grid grid-cols-4 gap-2 text-[10px] border border-gray-300 p-2 leading-tight">
            <div><span className="font-bold text-gray-600">Tipo de Sangre:</span> <br/><span className="font-semibold uppercase text-xs">{data.tipoSangre || 'NO ESPECIFICADO'}</span></div>
            <div className="col-span-3"><span className="font-bold text-gray-600">Alergias conocidas:</span> <br/><span className="font-semibold uppercase text-xs">{data.alergias || 'NINGUNA'}</span></div>
            <div className="col-span-3"><span className="font-bold text-gray-600">Padecimientos o Enf. Crónicas:</span> <br/><span className="font-semibold uppercase text-xs">{data.padecimientos || 'NINGUNO'}</span></div>
            <div><span className="font-bold text-gray-600">¿Usa lentes?:</span> <br/><span className="font-semibold uppercase text-xs">{data.lentes || 'NO'}</span></div>
          </div>
        </div>

        {/* Sección 5: Datos del Tutor y Referencias */}
        <div className="mb-3">
          <h4 className="font-bold text-xs uppercase bg-gray-800 text-white px-2 py-0.5 mb-1">5. Tutor y Contactos de Emergencia</h4>
          <div className="grid grid-cols-3 gap-2 text-[10px] border border-gray-300 p-2 mb-1 leading-tight">
            <div className="col-span-2"><span className="font-bold text-gray-600">Tutor Principal:</span> <br/><span className="font-semibold uppercase text-xs">{data.tutor || data.tutorNombre || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Celular / WhatsApp:</span> <br/><span className="font-semibold uppercase text-xs">{data.celularTutor || data.telefono || '-'}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] border border-gray-300 p-2 bg-gray-50 leading-tight">
            <div><span className="font-bold text-gray-600">Referencia 1:</span> <br/><span className="font-semibold uppercase text-xs">{data.referencia1 || data.emergenciaNombre1 || '-'}</span> <br/> <span className="text-gray-600">Tel:</span> <span className="font-semibold text-xs">{data.celularRef1 || data.emergenciaTel1 || '-'}</span></div>
            <div><span className="font-bold text-gray-600">Referencia 2:</span> <br/><span className="font-semibold uppercase text-xs">{data.referencia2 || data.emergenciaNombre2 || '-'}</span> <br/> <span className="text-gray-600">Tel:</span> <span className="font-semibold text-xs">{data.celularRef2 || data.emergenciaTel2 || '-'}</span></div>
          </div>
        </div>

        {/* Sección 6: Documentación Entregada */}
        <div className="mb-3">
          <h4 className="font-bold text-xs uppercase bg-gray-800 text-white px-2 py-0.5 mb-1">6. Acuse de Documentación Recibida</h4>
          <div className="border border-gray-300 p-2 text-[10px] leading-tight">
            <p className="mb-2 text-gray-600 font-bold">Marque con una 'X' si el documento fue entregado físicamente para cotejo o si fue detectado en sistema:</p>
            <div className="grid grid-cols-1 gap-1 mb-3 font-medium text-[10px]">
              <div><span className="border border-black px-2 py-0.5 mr-2">{hasDoc('certificado')}</span> Certificado de educación primaria o constancia de terminación de estudios de 6to grado</div>
              <div><span className="border border-black px-2 py-0.5 mr-2">{hasDoc('acta')}</span> Acta de nacimiento actualizada</div>
              <div><span className="border border-black px-2 py-0.5 mr-2">{hasDoc('curp')}</span> CURP formato reciente y legible</div>
              <div><span className="border border-black px-2 py-0.5 mr-2">{hasDoc('asignacion')}</span> Comprobante de asignación (folio o documento del portal de preinscripción SEP, si aplica)</div>
              <div><span className="border border-black px-2 py-0.5 mr-2">{hasDoc('ine')}</span> Identificación oficial vigente (INE o Pasaporte)</div>
              <div><span className="border border-black px-2 py-0.5 mr-2">{hasDoc('domicilio')}</span> Comprobante de domicilio reciente (luz, agua o teléfono no mayor a 3 meses)</div>
            </div>
            <div className="flex border-t border-gray-200 pt-2">
              <span className="font-bold text-gray-600 mr-2 text-[10px]">Observaciones / Faltantes:</span> 
              <div className="flex-1 border-b border-dotted border-gray-400"></div>
            </div>
          </div>
        </div>

        {/* Leyenda de Carta Compromiso si faltan documentos */}
        {hasMissingDocs && (
          <div className="mb-3 mt-3 px-3 text-[10px] border border-gray-400 p-2 bg-gray-50 text-justify leading-tight">
            <span className="font-bold">CARTA COMPROMISO DE ENTREGA DE DOCUMENTACIÓN:</span> El que suscribe, en su carácter de Padre, Madre o Tutor del alumno(a), al no contar con la totalidad de los requisitos en este momento, se compromete formalmente a entregar en la Dirección de la escuela la documentación faltante o pendiente indicada en el presente acuse, a más tardar el último día hábil del mes de septiembre del ciclo escolar en curso.
          </div>
        )}

        {/* Firmas */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-center text-[10px] px-6">
          <div>
            <div className="border-t-2 border-black pt-1 w-full mx-auto font-bold uppercase truncate">
              {data.tutor || data.tutorNombre || 'Firma del Tutor'}
            </div>
            <p className="text-[9px] text-gray-700 mt-1">Padre, Madre o Tutor Legal</p>
          </div>
          <div>
            <div className="border-t-2 border-black pt-1 w-full mx-auto font-bold uppercase truncate">
              {data.nombres} {data.apellidoPaterno} {data.apellidoMaterno}
            </div>
            <p className="text-[9px] text-gray-700 mt-1">Firma del Alumno(a)</p>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-black w-48 mx-auto pt-1 font-bold text-[11px] text-black">
              Profr. Juan Carlos Taboada Barajas
            </div>
            <p className="text-[9px] text-gray-700 mt-1">Sello y Firma de Autorización<br/>(Director del Plantel)</p>
          </div>
        </div>

        {/* Footer ABSOLUTO abajo */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-[9px] text-gray-500 border-t border-gray-300 pt-2 mx-6">
          La información aquí recabada será utilizada exclusivamente para fines escolares y está protegida por la Ley de Protección de Datos Personales en Posesión de Sujetos Obligados del Estado de Guerrero.
          <br/> Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}
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
