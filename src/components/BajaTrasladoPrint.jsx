import React, { useState, useEffect } from 'react';
import { useGlobalConfig } from '../hooks/useGlobalConfig';
import { roundToIntGrade, autoAcentuar } from '../utils/format';
import { TALLER_POR_GRUPO } from './ListaAsistenciaPrint';
import { parseFechaFlexible, obtenerFechaBajaTexto, formatearFechaCorta, isBeforeSept30 } from '../utils/dateRules';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const extraerFechaDeCurp = (curp) => {
  if (!curp || curp.length < 10) return null;
  const yy = curp.substring(4, 6);
  const mm = curp.substring(6, 8);
  const dd = curp.substring(8, 10);
  if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return null;
  const yearNum = parseInt(yy, 10);
  const fullYear = yearNum <= 30 ? 2000 + yearNum : 1900 + yearNum;
  return `${dd}/${mm}/${fullYear}`;
};

const formatearFechaNacimiento = (fechaNacimiento, curp) => {
  if (fechaNacimiento && typeof fechaNacimiento === 'string') {
    const trimmed = fechaNacimiento.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [yyyy, mm, dd] = trimmed.split('-');
      return `${dd}/${mm}/${yyyy}`;
    }
    if (trimmed) return trimmed;
  }
  return extraerFechaDeCurp(curp) || '___/___/_____';
};

const normalizarGrado = (grado) => {
  if (!grado) return '1er Grado';
  const g = String(grado).toLowerCase();
  if (g.includes('1') || g.includes('primer')) return '1er Grado';
  if (g.includes('2') || g.includes('segund')) return '2do Grado';
  if (g.includes('3') || g.includes('tercer')) return '3er Grado';
  return grado;
};

const formatearFechaExpedicionConstancia = (fechaTexto, studentFallback = null) => {
  const dateObj =
    parseFechaFlexible(fechaTexto) ||
    parseFechaFlexible(obtenerFechaBajaTexto(studentFallback)) ||
    new Date();
  const dia = dateObj.getDate();
  const mes = dateObj.toLocaleString('es-MX', { month: 'long' }).toUpperCase();
  const anio = dateObj.getFullYear();
  const textoDia = dia === 1 ? 'AL PRIMER DÍA' : `A LOS ${dia} DÍAS`;
  return `${textoDia} DEL MES DE ${mes} DEL AÑO ${anio}`;
};

export default function BajaTrasladoPrint({
  student,
  materiasPorGrado = {},
  motivoPersonalizado = '',
  fechaExpedicion = '',
  onClose = null
}) {
  const { config } = useGlobalConfig();
  const fechaInicialBaja = fechaExpedicion || obtenerFechaBajaTexto(student) || formatearFechaCorta(new Date());
  const [fechaBajaActiva, setFechaBajaActiva] = useState(fechaInicialBaja);

  useEffect(() => {
    setFechaBajaActiva(fechaExpedicion || obtenerFechaBajaTexto(student) || formatearFechaCorta(new Date()));
  }, [student, fechaExpedicion]);

  if (!student) return null;

  const guardarFechaBajaEnExpediente = async (nuevaFecha) => {
    setFechaBajaActiva(nuevaFecha);
    if (student?.id && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(nuevaFecha.trim())) {
      try {
        await updateDoc(doc(db, 'students', student.id), {
          fechaBaja: nuevaFecha.trim()
        });
        toast.success(`Fecha de baja/expedición actualizada (${nuevaFecha.trim()})`);
      } catch (e) {
        console.error('Error al actualizar fechaBaja:', e);
      }
    }
  };

  const gradoLimpio = normalizarGrado(student.grado);
  const grupoLimpio = (student.grupo || 'A').toString().trim().toUpperCase();
  const turnoInferido = ['G', 'H', 'I', 'J', 'K', 'L'].includes(grupoLimpio)
    ? 'Vespertino'
    : (student.turno || 'Matutino');
  const tallerNombre = (
    student.taller ||
    TALLER_POR_GRUPO[grupoLimpio] ||
    'Tecnología'
  ).toUpperCase();

  const materias = materiasPorGrado[gradoLimpio] || materiasPorGrado[student.grado] || [];
  const fechaNacFormateada = formatearFechaNacimiento(student.fechaNacimiento, student.curp);
  const cicloActual = config?.cicloEscolarActual || student.cicloEscolar || '2025-2026';
  const directorNombre = config?.directorName || 'Profr. Juan Carlos Taboada Barajas';
  const cct = config?.cct || '12DST0077B';
  const celularEscuela = config?.telefonoEscuela || '744 441 5678';

  const rawMotivo = (motivoPersonalizado || student.motivoBaja || '').trim();
  const motivoLimpio =
    !rawMotivo || rawMotivo.toLowerCase() === 'baja oficial' || rawMotivo.toLowerCase() === 'no inscrito'
      ? 'CAMBIO DE DOMICILIO'
      : rawMotivo.toUpperCase();

  const nombreCompleto = `${autoAcentuar(student.apellidoPaterno || '')} ${autoAcentuar(student.apellidoMaterno || '')} ${autoAcentuar(student.nombres || '')}`
    .replace(/\s+/g, ' ')
    .trim();

  const filasMaterias = materias.map(mat => {
    const t1 = roundToIntGrade(student.calificaciones?.['t1']?.[mat.id], '');
    const t2 = roundToIntGrade(student.calificaciones?.['t2']?.[mat.id], '');
    const t3 = roundToIntGrade(student.calificaciones?.['t3']?.[mat.id], '');
    return {
      id: mat.id,
      nombre: autoAcentuar(mat.name),
      t1,
      t2,
      t3
    };
  });

  const colT1Vacia = filasMaterias.every(f => f.t1 === '');
  const colT2Vacia = filasMaterias.every(f => f.t2 === '');
  const colT3Vacia = filasMaterias.every(f => f.t3 === '');
  const rowHeightPx = filasMaterias.length >= 10 ? 21 : 23;

  return (
    <div className="print-constancia-baja-only">
      <style>{`
        .constancia-page-letter {
          width: 21.59cm;
          height: 27.6cm;
          min-height: 27.6cm;
          max-height: 27.6cm;
          padding: 1cm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          background: white;
        }
        @media print {
          @page { size: letter portrait; margin: 0mm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          aside, header, nav, .no-print { display: none !important; }
          body { background: white; margin: 0; }
          .print-constancia-baja-only { display: block !important; }
          .constancia-page-letter {
            width: 21.59cm !important;
            height: 27.6cm !important;
            min-height: 27.6cm !important;
            max-height: 27.6cm !important;
            margin: 0 auto !important;
            padding: 1cm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
          }
          .watermark::before {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            height: 80%;
            background-image: url('/logo-escuela.png');
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            opacity: 0.05;
            z-index: -1;
          }
        }
        @media screen {
          .print-constancia-baja-only {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(15, 23, 42, 0.75);
            overflow-y: auto;
            padding: 1.5rem 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .constancia-page-letter {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
          }
        }
      `}</style>

      {/* Barra de controles en pantalla (no se imprime) */}
      <div className="no-print w-full max-w-[21.59cm] mb-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-rose-300">
              Vista Previa — Constancia de Baja por Traslado
            </h4>
            <p className="text-xs text-slate-300">
              Mismo diseño institucional de las Constancias de Estudios • Fecha de expedición fija a la <strong>fecha de baja</strong> ({fechaBajaActiva}).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
              <span className="text-[11px] font-bold text-rose-200 uppercase">Fecha de Baja / Expedición:</span>
              <input
                type="text"
                value={fechaBajaActiva}
                onChange={(e) => setFechaBajaActiva(e.target.value)}
                onBlur={(e) => guardarFechaBajaEnExpediente(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-24 bg-slate-900 text-white border border-slate-600 rounded px-2 py-0.5 text-xs font-extrabold text-center"
                title="Fecha en que se dio de baja al alumno (se usa como fecha de expedición)"
              />
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow transition"
            >
              🖨️ Imprimir Constancia
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg text-xs transition"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
        {isBeforeSept30(fechaBajaActiva) && (
          <div className="bg-amber-500/20 border border-amber-400 text-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
            ⚠️ Nota Normativa SEP: Recuerda que solo se toman como Bajas Oficiales las ocurridas <strong>después del 30 de septiembre</strong> (a partir del 1 de octubre). Antes o el 30 de septiembre se clasifican como &ldquo;No Inscrito&rdquo;.
          </div>
        )}
      </div>

      {/* HOJA CARTA CON EL MISMO DISEÑO EXACTO DE CONSTANCIAPRINT.JSX */}
      <div className="page-container constancia-page-letter relative">
        <div className="page-border"></div>

        <div
          className="bg-white text-slate-800 font-serif text-justify relative z-10 watermark uppercase h-full flex-1 flex flex-col justify-between px-10 py-3 leading-snug"
          style={{ fontSize: '9.5pt' }}
        >
          {/* BLOQUE SUPERIOR: ENCABEZADO OFICIAL Y ASUNTO (IDÉNTICO A CONSTANCIAS) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <img src="/logo-sep.png" alt="Logo SEP / Guerrero" className="w-24 h-20 object-contain shrink-0" />
              <div className="flex-1 text-center px-4">
                <h1 className="font-black text-[14pt] tracking-widest text-slate-900 uppercase font-sans">SISTEMA EDUCATIVO NACIONAL</h1>
                <h2 className="font-bold text-[11pt] text-slate-700 mt-1 uppercase font-sans">SUBSECRETARÍA DE EDUCACIÓN BÁSICA</h2>
                <h3 className="font-semibold text-[10pt] text-slate-600 uppercase mt-1 font-serif">ESCUELA SECUNDARIA TÉCNICA N° 68 &ldquo;RENACIMIENTO&rdquo;</h3>
                <p className="text-[9pt] font-medium text-slate-500 mt-0.5 font-sans uppercase">
                  C.C.T. {cct} &nbsp;&nbsp;|&nbsp;&nbsp; CEL. {celularEscuela}
                </p>
              </div>
              <img src="/logo-escuela.png" alt="EST 68" className="w-24 h-20 object-contain shrink-0" />
            </div>
            <hr className="border-t-[1.5px] border-gray-800 mb-2" />

            <div className="text-right font-bold uppercase text-[11pt] mb-1">
              <p>ASUNTO: CONSTANCIA DE BAJA POR TRASLADO</p>

              {/* LEYENDA OFICIAL DEL AÑO */}
              <p className="mt-1 text-center font-bold text-[9pt] uppercase tracking-widest text-slate-500">
                {(config?.leyendaOficial || '"2026, Año de Margarita Maza"').toUpperCase()}
              </p>

              <p className="mt-1.5 text-left">
                A QUIEN CORRESPONDA:
              </p>
            </div>
          </div>

          {/* BLOQUE CENTRAL: CUERPO DE LA CONSTANCIA CON MISMO ESTILO TIPOGRAFICO */}
          <div className="flex-1 flex flex-col justify-between py-1">
            <p className="indent-12">
              El que suscribe, <strong>{directorNombre}</strong>, Director de la Escuela Secundaria Técnica N° 68 &ldquo;Renacimiento&rdquo;, con domicilio en Calle Alta Quebradora y Andador 24 de Febrero S/N, Cd. Renacimiento, C.P. 39715, Acapulco de Juárez, Guerrero, Tel. {celularEscuela}, por medio de la presente:
            </p>

            <div className="text-center font-black text-lg tracking-[0.25em] uppercase">
              SE HACE CONSTAR
            </div>

            <p className="indent-12">
              Que el (la) alumno(a) <strong>{nombreCompleto}</strong>, con fecha de nacimiento <strong>{fechaNacFormateada}</strong>, Clave Única de Registro de Población (CURP) <strong>{student.curp || '__________________'}</strong> y matrícula escolar <strong>{student.matricula || '______'}</strong>, causa <strong>BAJA POR TRASLADO</strong> en el <strong>{gradoLimpio}</strong>, Grupo <strong>&ldquo;{grupoLimpio}&rdquo;</strong>, en el turno <strong>{turnoInferido}</strong>, en la disciplina tecnológica (taller) de <strong>&ldquo;{tallerNombre}&rdquo;</strong>, durante el ciclo escolar vigente <strong>{cicloActual}</strong>, por motivo de <strong>{motivoLimpio}</strong>.
            </p>

            {/* TABLA DE CALIFICACIONES PARCIALES CON ESTILO DE CONSTANCIA Y LÍNEAS DIAGONALES ROJAS SEP */}
            <div className="w-full">
              <p className="mb-1 indent-12">
                A continuación se detallan las calificaciones parciales registradas hasta la fecha de su baja (cancelando con línea diagonal los periodos pendientes de cursar):
              </p>
              <div className="relative">
                <table className="w-full text-[8pt] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-2 py-0.5 text-left font-bold w-[55%]">Asignatura ({gradoLimpio})</th>
                      <th className="border border-slate-300 px-1 py-0.5 text-center font-bold w-[15%]">1° Trim.</th>
                      <th className="border border-slate-300 px-1 py-0.5 text-center font-bold w-[15%]">2° Trim.</th>
                      <th className="border border-slate-300 px-1 py-0.5 text-center font-bold w-[15%]">3° Trim.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasMaterias.map((fila) => (
                      <tr key={fila.id} style={{ height: `${rowHeightPx}px` }}>
                        <td className="border border-slate-300 px-2 py-[1px] font-medium leading-tight">{fila.nombre}</td>
                        <td className="border border-slate-300 px-1 py-[1px] text-center font-bold leading-tight">{fila.t1}</td>
                        <td className="border border-slate-300 px-1 py-[1px] text-center font-bold leading-tight">{fila.t2}</td>
                        <td className="border border-slate-300 px-1 py-[1px] text-center font-bold leading-tight">{fila.t3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Superposición SVG para trazar la línea diagonal roja oficial SEP en trimestres vacíos */}
                <svg
                  className="pointer-events-none absolute left-[55%] bottom-0 w-[45%]"
                  style={{ height: `${filasMaterias.length * rowHeightPx}px` }}
                  viewBox="0 0 300 300"
                  preserveAspectRatio="none"
                >
                  {colT1Vacia && (
                    <line x1="2" y1="2" x2="98" y2="298" stroke="#dc2626" strokeWidth="2.2" />
                  )}
                  {colT2Vacia && (
                    <line x1="102" y1="2" x2="198" y2="298" stroke="#dc2626" strokeWidth="2.2" />
                  )}
                  {colT3Vacia && (
                    <line x1="202" y1="2" x2="298" y2="298" stroke="#dc2626" strokeWidth="2.2" />
                  )}
                </svg>
              </div>
            </div>

            {/* FUNDAMENTO NORMATIVO SEP INTEGRADO EN EL ESTILO DE LA CONSTANCIA */}
            <p className="indent-12 text-[8.5pt] leading-snug">
              De conformidad con las <strong>Normas Específicas de Control Escolar relativas a la Inscripción, Reinscripción, Acreditación, Promoción, Regularización y Certificación en la Educación Básica</strong> emitidas por la Secretaría de Educación Pública (SEP), se hace constar que el (la) alumno(a) no presenta adeudo de documentación ni de bienes escolares en este plantel, quedando liberado su registro para su inscripción por traslado en la escuela receptora.
            </p>

            <p className="indent-12">
              A petición de la parte interesada y para <strong>LOS FINES LEGALES QUE A LA MISMA CONVENGAN</strong>, se expide la presente constancia en la ciudad y puerto de Acapulco de Juárez, Guerrero, <strong>{formatearFechaExpedicionConstancia(fechaBajaActiva, student)}</strong>.
            </p>
          </div>

          {/* BLOQUE INFERIOR: FIRMA DEL DIRECTOR Y SELLO (IDÉNTICO A CONSTANCIAS) */}
          <div className="text-center relative pt-1 pb-1">
            <p className="font-bold tracking-widest text-[11pt]">A T E N T A M E N T E</p>
            <div className="h-10"></div>
            <div className="border-b border-black w-80 mx-auto mb-2"></div>
            <p className="font-bold text-[12pt] mt-2 uppercase">{directorNombre}</p>
            <p className="font-sans text-[10pt] mt-1 text-slate-600 font-bold">DIRECTOR DEL PLANTEL</p>

            {/* SELLO OFICIAL SIMULADO (Alineado junto a la firma) */}
            <div className="absolute top-6 left-10 w-32 h-32 border-4 border-slate-300 rounded-full flex flex-col items-center justify-center opacity-10 -rotate-12">
              <p className="text-[8px] font-bold uppercase tracking-widest mb-1">SEP</p>
              <div className="w-20 h-px bg-slate-300 mb-1"></div>
              <p className="text-[10px] font-black uppercase text-center leading-tight">Sello de la<br />Institución</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
