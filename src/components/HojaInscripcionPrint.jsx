import React from 'react';
import { useGlobalConfig } from '../hooks/useGlobalConfig';

export default function HojaInscripcionPrint({ data }) {
  const { config } = useGlobalConfig();
  const logoSEG = "https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Secretar%C3%ADa_de_Educaci%C3%B3n_Guerrero.png"; 

  const handlePrint = () => {
    window.print();
  };

  const hasDoc = (docKey) => {
    return '    ';
  };

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
      <div className="print-container bg-white text-black mx-auto p-4 shadow-2xl print:shadow-none print:p-0 flex flex-col" style={{ maxWidth: '21.59cm', minHeight: '26cm', boxSizing: 'border-box' }}>
        
        {/* Cabecera Oficial */}
        <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-1">
          <div className="w-16">
            <img src={logoSEG} alt="SEG Logo" className="w-full grayscale" onError={(e) => e.target.style.display='none'} />
          </div>
          <div className="text-center flex-1 px-2">
            <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide leading-tight">Secretaría de Educación Guerrero</h1>
            <h2 className="text-sm sm:text-base font-bold uppercase leading-tight">Subsecretaría de Educación Básica</h2>
            <h3 className="text-sm sm:text-base font-semibold leading-tight">Esc. Sec. Téc. N°68 "RENACIMIENTO"</h3>
            <p className="text-xs sm:text-sm font-bold mt-1 text-slate-700">CICLO ESCOLAR: {data.cicloEscolar || config?.cicloEscolarActual || '2025-2026'}</p>
            <p className="text-xs sm:text-sm font-bold mt-0.5 bg-gray-200 inline-block px-3 py-0.5 rounded border border-gray-400 uppercase">
              FICHA INDIVIDUAL DE {data.tipoTramite || 'INSCRIPCIÓN'}
            </p>
          </div>
          <div className="w-16 flex flex-col items-center justify-center">
            {/* Espacio para Foto */}
            <div className="w-16 h-20 border-2 border-gray-400 flex items-center justify-center text-xs text-gray-500 text-center overflow-hidden">
              {data.fotoUrl ? (
                <img src={data.fotoUrl} alt="Fotografía" className="w-full h-full object-cover grayscale" />
              ) : (
                "FOTO"
              )}
            </div>
          </div>
        </div>

        {/* Sección 1: Datos Académicos */}
        <div className="mb-1">
          <h4 className="font-bold text-sm uppercase bg-gray-800 text-white px-2 py-0.5 mb-0">1. Datos Académicos</h4>
          <div className="grid grid-cols-6 gap-x-2 gap-y-0.5 text-xs border border-gray-300 px-2 py-1 leading-tight">
            <div><span className="font-bold text-gray-600 text-[11px]">Grado:</span> <br/><span className="font-bold text-sm uppercase">{data.grado || '-'}</span></div>
            <div><span className="font-bold text-gray-600 text-[11px]">Grupo:</span> <br/><span className="font-bold text-sm uppercase">{data.grupo || '-'}</span></div>
            <div><span className="font-bold text-gray-600 text-[11px]">Turno:</span> <br/><span className="font-bold text-sm uppercase">{data.turno || '-'}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600 text-[11px]">Taller:</span> <br/><span className="font-semibold uppercase text-sm">{data.taller || '-'}</span></div>
            <div><span className="font-bold text-gray-600 text-[11px]">Matrícula:</span> <br/><span className="font-semibold uppercase text-sm">{data.matricula || 'N/A'}</span></div>
          </div>
        </div>

        {/* Sección 2: Datos del Alumno */}
        <div className="mb-1">
          <h4 className="font-bold text-sm uppercase bg-gray-800 text-white px-2 py-0.5 mb-0">2. Datos Personales del Alumno</h4>
          <div className="grid grid-cols-4 gap-x-2 gap-y-0.5 text-xs border border-gray-300 px-2 py-1 border-b-0 leading-tight">
            <div className="col-span-2"><span className="font-bold text-gray-600 text-[11px]">Apellidos:</span> <br/><span className="font-semibold uppercase text-sm">{data.apellidoPaterno} {data.apellidoMaterno}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600 text-[11px]">Nombre(s):</span> <br/><span className="font-semibold uppercase text-sm">{data.nombres}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600 text-[11px]">CURP:</span> <br/><span className="font-semibold uppercase tracking-widest text-sm">{data.curp}</span></div>
            <div><span className="font-bold text-gray-600 text-[11px]">Fecha Nacimiento:</span> <br/><span className="font-semibold uppercase text-sm">{data.fechaNacimiento || '-'}</span></div>
            <div><span className="font-bold text-gray-600 text-[11px]">Género:</span> <br/><span className="font-semibold uppercase text-sm">{data.genero || '-'}</span></div>
          </div>
          <div className="grid grid-cols-5 gap-x-2 gap-y-0.5 text-xs border border-gray-300 px-2 py-1 leading-tight">
            <div className="col-span-2"><span className="font-bold text-gray-600 text-[11px]">Calle:</span> <br/><span className="font-semibold uppercase text-sm">{data.calleNumero || data.calle || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600 text-[11px]">Número:</span> <br/><span className="font-semibold uppercase text-sm">{data.numero || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600 text-[11px]">Colonia:</span> <br/><span className="font-semibold uppercase text-sm">{data.colonia || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600 text-[11px]">C.P.:</span> <br/><span className="font-semibold uppercase text-sm">{data.codigoPostal || data.cp || '-'}</span></div>
          </div>
        </div>

        {/* Sección 3: Escuela de Procedencia y Becas */}
        <div className="mb-1">
          <h4 className="font-bold text-sm uppercase bg-gray-800 text-white px-2 py-0.5 mb-0">3. Antecedentes Escolares y Becas</h4>
          <div className="grid grid-cols-6 gap-x-2 gap-y-0.5 text-xs border border-gray-300 px-2 py-1 leading-tight bg-gray-50">
            <div className="col-span-2"><span className="font-bold text-gray-600 text-[11px]">Escuela de Procedencia:</span> <br/><span className="font-semibold uppercase text-sm">{data.escuelaProcedencia || '-'}</span></div>
            <div className="col-span-2"><span className="font-bold text-gray-600 text-[11px]">Domicilio de la Escuela:</span> <br/><span className="font-semibold uppercase text-sm">{data.domicilioEscuela || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600 text-[11px]">Promedio Obtenido:</span> <br/><span className="font-semibold uppercase text-sm">{data.promedioEscuela || '-'}</span></div>
            <div className="col-span-1"><span className="font-bold text-gray-600 text-[11px]">¿Beca?:</span> <br/><span className="font-semibold uppercase text-sm">{(data.tieneBeca === 'SÍ' || data.tieneBeca === true || data.beca) ? (data.nombreBeca || 'SÍ') : 'NO'}</span></div>
          </div>
        </div>

        {/* Sección 4: Cédula de Salud */}
        <div className="mb-1">
          <h4 className="font-bold text-sm uppercase bg-gray-800 text-white px-2 py-0.5 mb-0">4. Información Médica de Urgencia</h4>
          <div className="grid grid-cols-4 gap-x-2 gap-y-0.5 text-xs border border-gray-300 px-2 py-1 leading-tight">
            <div><span className="font-bold text-gray-600 text-[11px]">Tipo de Sangre:</span> <br/><span className="font-semibold uppercase text-sm">{data.tipoSangre || 'NO ESPECIFICADO'}</span></div>
            <div className="col-span-3"><span className="font-bold text-gray-600 text-[11px]">Alergias conocidas:</span> <br/><span className="font-semibold uppercase text-sm">{data.alergias || 'NINGUNA'}</span></div>
            <div className="col-span-3"><span className="font-bold text-gray-600 text-[11px]">Padecimientos o Enf. Crónicas:</span> <br/><span className="font-semibold uppercase text-sm">{data.padecimientos || 'NINGUNO'}</span></div>
            <div><span className="font-bold text-gray-600 text-[11px]">¿Usa lentes?:</span> <br/><span className="font-semibold uppercase text-sm">{data.lentes || 'NO'}</span></div>
          </div>
        </div>

        {/* Sección 5: Datos del Tutor y Referencias */}
        <div className="mb-1">
          <h4 className="font-bold text-sm uppercase bg-gray-800 text-white px-2 py-0.5 mb-0">5. Tutor y Contactos de Emergencia</h4>
          <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-xs border border-gray-300 px-2 py-1 border-b-0 leading-tight">
            <div className="col-span-2"><span className="font-bold text-gray-600 text-[11px]">Tutor Principal:</span> <br/><span className="font-semibold uppercase text-sm">{data.tutor || data.tutorNombre || '-'}</span></div>
            <div><span className="font-bold text-gray-600 text-[11px]">Celular / WhatsApp:</span> <br/><span className="font-semibold uppercase text-sm">{data.celularTutor || data.telefono || '-'}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs border border-gray-300 px-2 py-1 bg-gray-50 leading-tight">
            <div><span className="font-bold text-gray-600 text-[11px]">Referencia 1:</span> <br/><span className="font-semibold uppercase text-sm">{data.referencia1 || data.emergenciaNombre1 || '-'}</span> <br/> <span className="text-gray-600 text-[11px]">Tel:</span> <span className="font-semibold text-sm">{data.celularRef1 || data.emergenciaTel1 || '-'}</span></div>
            <div><span className="font-bold text-gray-600 text-[11px]">Referencia 2:</span> <br/><span className="font-semibold uppercase text-sm">{data.referencia2 || data.emergenciaNombre2 || '-'}</span> <br/> <span className="text-gray-600 text-[11px]">Tel:</span> <span className="font-semibold text-sm">{data.celularRef2 || data.emergenciaTel2 || '-'}</span></div>
          </div>
        </div>

        {/* Sección 6: Documentación Entregada */}
        <div className="mb-1">
          <h4 className="font-bold text-sm uppercase bg-gray-800 text-white px-2 py-0.5 mb-0">6. Acuse de Documentación Recibida</h4>
          <div className="border border-gray-300 px-2 py-1 text-xs leading-tight">
            <p className="mb-1 text-gray-600 font-bold text-[11px]">Marque con una 'X' si el documento fue entregado físicamente para cotejo o si fue detectado en sistema:</p>
            <div className="grid grid-cols-1 gap-0.5 mb-1 font-medium text-[11px]">
              <div><span className="border border-black px-2 mr-2">{hasDoc('certificado')}</span> Certificado de educación primaria o constancia de terminación</div>
              <div><span className="border border-black px-2 mr-2">{hasDoc('acta')}</span> Acta de nacimiento actualizada</div>
              <div><span className="border border-black px-2 mr-2">{hasDoc('curp')}</span> CURP formato reciente y legible</div>
              <div><span className="border border-black px-2 mr-2">{hasDoc('asignacion')}</span> Comprobante de asignación (portal de preinscripción SEP, si aplica)</div>
              <div><span className="border border-black px-2 mr-2">{hasDoc('ine')}</span> Identificación oficial vigente (INE o Pasaporte)</div>
              <div><span className="border border-black px-2 mr-2">{hasDoc('domicilio')}</span> Comprobante de domicilio reciente (luz, agua o teléfono no mayor a 3 meses)</div>
            </div>
            <div className="flex border-t border-gray-200 pt-1 mt-1">
              <span className="font-bold text-gray-600 mr-2 text-[11px]">Observaciones / Faltantes:</span> 
              <div className="flex-1 border-b border-dotted border-gray-400"></div>
            </div>
          </div>
        </div>

        {/* Leyenda de Carta Compromiso si faltan documentos */}
        {hasMissingDocs && (
          <div className="mb-1 mt-1 px-3 text-[10px] border border-gray-400 p-1.5 bg-gray-50 text-justify leading-tight">
            <span className="font-bold">CARTA COMPROMISO DE ENTREGA DE DOCUMENTACIÓN:</span> El que suscribe, en su carácter de Padre, Madre o Tutor del alumno(a), al no contar con la totalidad de los requisitos en este momento, se compromete formalmente a entregar en la Dirección de la escuela la documentación faltante o pendiente indicada en el presente acuse, a más tardar el último día hábil del mes de septiembre del ciclo escolar en curso.
          </div>
        )}

        {/* Footer Flexible que empuja el contenido hacia abajo */}
        <div className="mt-auto">
          {/* Firmas */}
          <div className="mt-2 grid grid-cols-3 gap-6 text-center text-xs px-6">
            <div>
              <div className="border-t-2 border-black pt-1 w-full mx-auto font-bold uppercase truncate">
                {data.tutor || data.tutorNombre || 'Firma del Tutor'}
              </div>
              <p className="text-[10px] text-gray-700 leading-tight">Padre, Madre o Tutor Legal</p>
            </div>
            <div>
              <div className="border-t-2 border-black pt-1 w-full mx-auto font-bold uppercase truncate">
                {data.nombres} {data.apellidoPaterno} {data.apellidoMaterno}
              </div>
              <p className="text-[10px] text-gray-700 leading-tight">Firma del Alumno(a)</p>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-black w-48 mx-auto pt-1 font-bold text-xs text-black">
                Profr. Juan Carlos Taboada Barajas
              </div>
              <p className="text-[10px] text-gray-700 leading-tight">Sello y Firma de Autorización<br/>(Director del Plantel)</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-500 border-t border-gray-300 pt-1 mt-2 mx-6">
            La información aquí recabada será utilizada exclusivamente para fines escolares y está protegida por la Ley de Protección de Datos Personales en Posesión de Sujetos Obligados del Estado de Guerrero.
            <br/> Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}
          </div>
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
            height: auto;
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
