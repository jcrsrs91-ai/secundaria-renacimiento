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

const obtenerNumeroGrado = (grado) => {
  const g = String(grado || '').toLowerCase();
  if (g.includes('1') || g.includes('primer')) return '1°';
  if (g.includes('2') || g.includes('segund')) return '2°';
  if (g.includes('3') || g.includes('tercer')) return '3°';
  return grado || '1°';
};

const normalizarGradoKey = (grado) => {
  const g = String(grado || '').toLowerCase();
  if (g.includes('1') || g.includes('primer')) return '1er Grado';
  if (g.includes('2') || g.includes('segund')) return '2do Grado';
  if (g.includes('3') || g.includes('tercer')) return '3er Grado';
  return '1er Grado';
};

const formatearNombreAsignaturaTabla = (nombre = '') => {
  return String(nombre)
    .toUpperCase()
    .replace(/\s+(I|II|III)$/, '')
    .replace('CIENCIAS I (BIOLOGÍA)', 'CIENCIAS I (BIOLOGÍA)')
    .replace('CIENCIAS II (FÍSICA)', 'CIENCIAS II (FÍSICA)')
    .replace('CIENCIAS III (QUÍMICA)', 'CIENCIAS III (QUÍMICA)');
};

const formatearFechaCompletaEs = (fechaIsoOTexto, studentFallback = null) => {
  const dateObj =
    parseFechaFlexible(fechaIsoOTexto) ||
    parseFechaFlexible(obtenerFechaBajaTexto(studentFallback)) ||
    new Date();
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const diaSemana = diasSemana[dateObj.getDay()];
  const diaMes = dateObj.getDate();
  const mes = meses[dateObj.getMonth()];
  const anio = dateObj.getFullYear();
  return `el día ${diaSemana}, ${diaMes} de ${mes} de ${anio}`;
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

  const gradoKey = normalizarGradoKey(student.grado);
  const numeroGrado = obtenerNumeroGrado(student.grado);
  const grupoLimpio = (student.grupo || 'A').toString().trim().toUpperCase();
  const turnoInferido = ['G', 'H', 'I', 'J', 'K', 'L'].includes(grupoLimpio) ? 'Vespertino' : (student.turno || 'Matutino');
  const tallerNombre = (
    student.taller ||
    TALLER_POR_GRUPO[grupoLimpio] ||
    'Tecnología'
  ).toUpperCase();

  const materias = materiasPorGrado[gradoKey] || materiasPorGrado[student.grado] || [];
  const fechaNacFormateada = formatearFechaNacimiento(student.fechaNacimiento, student.curp);
  const cicloActual = config?.cicloEscolarActual || student.cicloEscolar || '2026 - 2027';
  const directorNombre = (config?.directorName || 'PROFR. JUAN CARLOS TABOADA BARAJAS').toUpperCase();
  const cct = config?.cct || '12DST0077B';
  const leyendaAnio = config?.leyendaOficial || '“2026, Año de Margarita Maza”.';

  // Motivo de la baja (limpiando valores internos como 'Baja Oficial' o 'No Inscrito')
  const rawMotivo = (motivoPersonalizado || student.motivoBaja || '').trim();
  const motivoLimpio =
    !rawMotivo || rawMotivo.toLowerCase() === 'baja oficial' || rawMotivo.toLowerCase() === 'no inscrito'
      ? 'cambio de domicilio'
      : rawMotivo.toLowerCase();

  const nombreCompleto = `${autoAcentuar(student.apellidoPaterno || '')} ${autoAcentuar(student.apellidoMaterno || '')} ${autoAcentuar(student.nombres || '')}`
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  // Preparar calificaciones por trimestre y detectar qué columnas están totalmente vacías para trazar la línea diagonal roja oficial SEP
  const filasMaterias = materias.map(mat => {
    const t1 = roundToIntGrade(student.calificaciones?.['t1']?.[mat.id], '');
    const t2 = roundToIntGrade(student.calificaciones?.['t2']?.[mat.id], '');
    const t3 = roundToIntGrade(student.calificaciones?.['t3']?.[mat.id], '');
    return {
      id: mat.id,
      nombre: formatearNombreAsignaturaTabla(mat.name),
      t1,
      t2,
      t3
    };
  });

  const colT1Vacia = filasMaterias.every(f => f.t1 === '');
  const colT2Vacia = filasMaterias.every(f => f.t2 === '');
  const colT3Vacia = filasMaterias.every(f => f.t3 === '');

  const rowHeightPx = filasMaterias.length >= 10 ? 23 : 25;

  return (
    <div className="print-baja-traslado-only">
      <style>{`
        .baja-traslado-page {
          width: 21.59cm;
          height: 27.6cm;
          min-height: 27.6cm;
          max-height: 27.6cm;
          padding: 0.85cm 1.35cm 0.75cm 1.35cm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: white;
          color: #111827;
          position: relative;
          overflow: hidden;
        }
        @media print {
          @page { size: letter portrait; margin: 0mm; }
          html, body, #root {
            height: auto !important;
            overflow: visible !important;
            min-height: auto !important;
            display: block !important;
            background: white !important;
            margin: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside, header, nav, .no-print { display: none !important; }
          .print-baja-traslado-only { display: block !important; }
          .baja-traslado-page {
            width: 21.59cm !important;
            height: 27.6cm !important;
            min-height: 27.6cm !important;
            max-height: 27.6cm !important;
            margin: 0 auto !important;
            padding: 0.85cm 1.35cm 0.75cm 1.35cm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
          }
        }
        @media screen {
          .print-baja-traslado-only {
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
          .baja-traslado-page {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
            border-radius: 0.35rem;
          }
        }
      `}</style>

      {/* Barra de controles en pantalla (no se imprime) */}
      <div className="no-print w-full max-w-[21.59cm] mb-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-rose-300">
              Vista Previa — Constancia Oficial de Baja por Traslado
            </h4>
            <p className="text-xs text-slate-300">
              La fecha de expedición corresponde exactamente a la <strong>fecha en que se dio de baja al alumno</strong> ({fechaBajaActiva}).
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
              🖨️ Imprimir Formato
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

      <div className="baja-traslado-page font-sans">
        {/* Marca de agua institucional sutil */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]"
          style={{ zIndex: 0 }}
        >
          <img src="/logo-escuela.png" alt="" className="w-[62%] h-[62%] object-contain" />
        </div>

        {/* BLOQUE SUPERIOR: ENCABEZADO OFICIAL SEG + BARRA GUINDA + CUADRO DE CORRESPONDENCIA */}
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <img src="/logo-sep.png" alt="Gobierno de Guerrero / SEG" className="h-16 w-36 object-contain shrink-0" />

            <div className="flex-1 text-center leading-tight px-1">
              <h1 className="font-serif font-black text-[13.5pt] text-slate-900 tracking-tight">
                Secretaría de Educación Guerrero
              </h1>
              <h2 className="font-sans font-extrabold text-[8.5pt] text-slate-800 uppercase tracking-wide mt-0.5">
                SUBSECRETARÍA DE EDUCACIÓN BÁSICA
              </h2>
              <h3 className="font-sans font-extrabold text-[8pt] text-slate-800 uppercase">
                DIRECCIÓN GENERAL DE EDUCACIÓN SECUNDARIA
              </h3>
              <h4 className="font-sans font-extrabold text-[8pt] text-slate-800 uppercase">
                DEPARTAMENTO DE ESCUELAS SECUNDARIAS TÉCNICAS
              </h4>
              <p className="font-serif font-bold text-[8.5pt] text-slate-800 mt-0.5">
                Supervisión Escolar No. 24, Acapulco-Xaltianguis
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <img src="/logo-escuela.png" alt="EST 68" className="h-16 w-16 object-contain" />
            </div>
          </div>

          {/* Barra Guinda Institucional */}
          <div
            className="w-full py-1 text-center text-white font-extrabold text-[11pt] uppercase tracking-[0.15em] rounded-[2px] shadow-xs"
            style={{ backgroundColor: '#8b0d37' }}
          >
            BAJA POR TRASLADO
          </div>

          {/* Cuadro de Datos de Correspondencia (Alineado a la derecha como el formato oficial) */}
          <div className="flex justify-end mt-1.5">
            <div className="text-[8.5pt] leading-snug text-slate-900 w-[54%]">
              <div className="grid grid-cols-[105px_1fr]">
                <span className="font-bold uppercase">DEPENDENCIA:</span>
                <span className="font-semibold uppercase">ESC. SEC. TÉC. N° 68 “RENACIMIENTO”</span>
              </div>
              <div className="grid grid-cols-[105px_1fr]">
                <span className="font-bold uppercase">SECCIÓN:</span>
                <span className="uppercase">CORRESPONDENCIA</span>
              </div>
              <div className="grid grid-cols-[105px_1fr]">
                <span className="font-bold uppercase">MESA:</span>
                <span className="uppercase">DIRECCIÓN</span>
              </div>
              <div className="grid grid-cols-[105px_1fr]">
                <span className="font-bold uppercase">EXPEDIENTE:</span>
                <span className="uppercase">CONTROL ESCOLAR</span>
              </div>
            </div>
          </div>

          {/* Leyenda oficial del año */}
          <p className="text-center font-serif font-bold text-[10.5pt] text-slate-900 mt-1.5">
            {leyendaAnio}
          </p>

          <p className="font-sans font-extrabold text-[10pt] uppercase text-slate-900 mt-1">
            A QUIEN CORRESPONDA:
          </p>
        </div>

        {/* BLOQUE CENTRAL: TEXTO + SE HACE CONSTAR + DATOS DEL ALUMNO + TABLA CON DIAGONALES */}
        <div className="relative z-10 flex-1 flex flex-col justify-between py-1">
          <p className="text-[10pt] leading-relaxed text-justify text-slate-900">
            El que suscribe <strong>{directorNombre}</strong>, Director de la Escuela Secundaria Técnica N° 68{' '}
            <strong>“RENACIMIENTO”</strong>, C.C.T. <strong>{cct}</strong>, Turno <strong>{turnoInferido}</strong>, ubicada en
            Calle Alta Quebradora y And. 24 de Febrero S/N, Cd. Renacimiento, Acapulco de Juárez, Gro.
          </p>

          {/* Título central "Se Hace Constar" / "Hace Constar" */}
          <div className="text-center my-1">
            <span
              className="font-serif italic font-black text-[20pt] tracking-wider text-slate-900 inline-block px-6 border-b border-slate-300 leading-none pb-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Se Hace Constar
            </span>
          </div>

          <p className="text-[10pt] leading-relaxed text-justify text-slate-900">
            Que el (la) alumno(a): <strong className="underline decoration-slate-400 underline-offset-2">{nombreCompleto}</strong> con
            CURP: <strong>{(student.curp || '__________________').toUpperCase()}</strong>, fecha de nacimiento{' '}
            <strong className="text-[10.5pt]">{fechaNacFormateada}</strong>
            {student.matricula ? (
              <> y matrícula <strong>{student.matricula}</strong>,</>
            ) : (
              ','
            )}{' '}
            causa <strong>baja por traslado</strong> en el <strong>“{numeroGrado}”</strong> grado, Grupo{' '}
            <strong>“{grupoLimpio}”</strong> en el ciclo escolar <strong>{cicloActual}</strong>, en la disciplina tecnológica
            (taller) de <strong>“{tallerNombre}”</strong>, por motivo de <strong>{motivoLimpio}</strong>, con las siguientes
            calificaciones parciales registradas a la fecha de su baja:
          </p>

          {/* TABLA DE ASIGNATURAS Y CALIFICACIÓN CUANTITATIVA CON LÍNEAS DIAGONALES DE CANCELACIÓN SEP */}
          <div className="my-1.5 px-2">
            <div className="relative">
              <table className="w-full border-collapse border border-slate-900 text-[9pt]">
                <thead>
                  <tr className="bg-slate-100">
                    <th
                      rowSpan={2}
                      className="border border-slate-900 py-1 px-3 text-center font-extrabold uppercase tracking-wide w-[55%]"
                    >
                      Asignaturas ({gradoKey})
                    </th>
                    <th
                      colSpan={3}
                      className="border border-slate-900 py-0.5 px-2 text-center font-extrabold uppercase tracking-wide"
                    >
                      Calificación Cuantitativa (Periodos Trimestrales)
                    </th>
                  </tr>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-900 py-0.5 text-center font-black w-[15%]">1°</th>
                    <th className="border border-slate-900 py-0.5 text-center font-black w-[15%]">2°</th>
                    <th className="border border-slate-900 py-0.5 text-center font-black w-[15%]">3°</th>
                  </tr>
                </thead>
                <tbody>
                  {filasMaterias.map((fila) => (
                    <tr key={fila.id} style={{ height: `${rowHeightPx}px` }}>
                      <td className="border border-slate-900 px-2.5 font-extrabold uppercase text-[8.5pt] tracking-tight text-slate-900">
                        {fila.nombre}
                      </td>
                      <td className="border border-slate-900 text-center font-bold text-[9.5pt] text-slate-900 relative">
                        {fila.t1}
                      </td>
                      <td className="border border-slate-900 text-center font-bold text-[9.5pt] text-slate-900 relative">
                        {fila.t2}
                      </td>
                      <td className="border border-slate-900 text-center font-bold text-[9.5pt] text-slate-900 relative">
                        {fila.t3}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Superposición SVG exacta para trazar la línea diagonal roja oficial de cancelación en trimestres vacíos */}
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

          {/* LEYENDA NORMATIVA AUTORIZADA POR LA SEP (NORMAS DE CONTROL ESCOLAR) */}
          <div className="bg-slate-50 border-l-4 border-[#8b0d37] px-3 py-1.5 text-[8pt] leading-snug text-justify text-slate-700">
            <strong>FUNDAMENTO NORMATIVO SEP:</strong> Documento expedido de conformidad con las{' '}
            <em>
              Normas Específicas de Control Escolar relativas a la Inscripción, Reinscripción, Acreditación, Promoción,
              Regularización y Certificación en la Educación Básica
            </em>{' '}
            vigentes emitidas por la Secretaría de Educación Pública (SEP). Se hace constar que el(la) alumno(a) no presenta adeudo
            de documentación ni de bienes escolares en este plantel, quedando liberado su registro en el sistema oficial (PASEG /
            SIGED) para su inscripción por traslado en la escuela receptora.
          </div>

          <p className="text-[9.5pt] leading-snug text-justify text-slate-900 mt-1">
            A petición del (la) interesado(a), y para los usos y fines legales a que haya lugar, se extiende la presente en la Ciudad
            y Puerto de Acapulco de Juárez, Guerrero, <strong>{formatearFechaCompletaEs(fechaBajaActiva, student)}</strong>.
          </p>
        </div>

        {/* BLOQUE INFERIOR: ATENTAMENTE, FIRMA DEL DIRECTOR Y GRECA INSTITUCIONAL */}
        <div className="relative z-10 pt-1 text-center">
          <p className="font-bold text-[10pt] text-slate-900">Atentamente</p>

          <div className="h-12 relative flex items-center justify-center">
            {/* Sello simulado discreto para guía */}
            <div className="absolute right-14 -top-2 w-24 h-24 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center opacity-35">
              <span className="text-[7pt] font-bold uppercase text-slate-400 leading-tight text-center">
                Sello<br />Oficial
              </span>
            </div>
          </div>

          <div className="border-t-[1.5px] border-slate-900 w-72 mx-auto pt-1">
            <p className="font-extrabold text-[9.5pt] uppercase text-slate-900 leading-tight">{directorNombre}</p>
            <p className="font-extrabold text-[8.5pt] uppercase text-slate-800">DIRECTOR DEL PLANTEL</p>
          </div>

          {/* Greca Institucional Inferior estilo Guerrero */}
          <div className="mt-2 pt-1 border-t-2 border-[#8b0d37] flex items-center justify-between text-[7.5pt] text-slate-500 font-semibold uppercase tracking-widest">
            <span>ESC. SEC. TÉC. N° 68 “RENACIMIENTO” · C.C.T. {cct}</span>
            <span className="text-[#8b0d37] font-black">❖❖❖❖❖❖❖❖❖❖❖❖❖❖❖❖❖❖</span>
            <span>CONTROL ESCOLAR · CICLO {cicloActual}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
