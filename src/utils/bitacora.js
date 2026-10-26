import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

/**
 * Registra un movimiento en la bitácora del sistema
 * @param {string} usuario - Correo o nombre del usuario que realiza la acción
 * @param {string} modulo - Nombre del módulo donde ocurre la acción (ej. 'Control Escolar')
 * @param {string} accion - Tipo de acción (ej. 'Alta', 'Baja', 'Calificación', 'Edición de Expediente')
 * @param {string} detalle - Descripción detallada de lo que se hizo
 * @param {object} meta - Metadatos opcionales (ej. cambios estructurados, alumnoId, etc.)
 */
export const registrarMovimiento = async (usuario, modulo, accion, detalle, meta = {}) => {
  try {
    const emailFinal = usuario || auth.currentUser?.email || 'Desconocido';
    const bitacoraRef = collection(db, 'bitacora_movimientos');
    await addDoc(bitacoraRef, {
      usuario: emailFinal,
      modulo: modulo || 'Control Escolar',
      accion: accion || 'Movimiento',
      detalle: detalle || '',
      ...meta,
      fecha: serverTimestamp(),
      timestampISO: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al registrar en bitácora:", error);
  }
};

const ETIQUETAS_CAMPOS = {
  matricula: 'Matrícula',
  cicloEscolar: 'Ciclo Escolar',
  grado: 'Grado',
  grupo: 'Grupo',
  turno: 'Turno',
  taller: 'Taller',
  repetidor: 'Repetidor',
  status: 'Estatus',
  tipoIngreso: 'Tipo de Ingreso',
  escuelaProcedencia: 'Escuela Procedencia',
  promedioEscuela: 'Promedio Procedencia',
  domicilioEscuela: 'Domicilio Esc. Procedencia',
  tieneBeca: '¿Tiene Beca?',
  nombreBeca: 'Programa de Beca',
  nombres: 'Nombre(s)',
  apellidoPaterno: 'Apellido Paterno',
  apellidoMaterno: 'Apellido Materno',
  curp: 'CURP',
  genero: 'Género',
  fechaNacimiento: 'Fecha Nacimiento',
  nacionalidad: 'Nacionalidad',
  lenguaIndigena: 'Lengua Indígena',
  nombreLenguaIndigena: 'Cuál Lengua',
  hablaEspanol: 'Habla Español',
  calle: 'Calle',
  numero: 'Número',
  colonia: 'Colonia',
  cp: 'C.P.',
  tipoSangre: 'Tipo de Sangre',
  lentes: 'Usa Lentes',
  discapacidad: 'Discapacidad/Condición',
  usaer: 'USAER',
  alergias: 'Alergias',
  padecimientos: 'Padecimientos',
  tutorNombre: 'Tutor Principal',
  tutorParentesco: 'Parentesco Tutor',
  telefono: 'Teléfono Tutor',
  correo: 'Correo Tutor',
  emergenciaNombre1: 'Contacto Emergencia 1',
  emergenciaParentesco1: 'Parentesco Emergencia 1',
  emergenciaTel1: 'Tel. Emergencia 1',
  emergenciaNombre2: 'Contacto Emergencia 2',
  emergenciaParentesco2: 'Parentesco Emergencia 2',
  emergenciaTel2: 'Tel. Emergencia 2'
};

/**
 * Compara los datos originales del alumno contra los nuevos datos guardados en HojaDeVida
 * y devuelve la acción adecuada, un resumen legible y el arreglo de cambios "Antes -> Después".
 */
export const detectarCambiosExpediente = (original = {}, nuevo = {}) => {
  const cambios = [];

  const norm = (val) => {
    if (val === undefined || val === null) return '';
    return String(val).trim();
  };

  Object.keys(ETIQUETAS_CAMPOS).forEach((key) => {
    // Evitar falsos positivos cuando un campo no existía antes y viene con su valor por defecto
    let valAntes = norm(original[key]);
    let valDespues = norm(nuevo[key]);

    if (key === 'tieneBeca') {
      const hadBeca = (
        valAntes.toUpperCase().startsWith('S') ||
        (norm(original.nombreBeca) !== '' && !['NO', 'NINGUNA', 'N/A'].includes(norm(original.nombreBeca).toUpperCase()))
      );
      valAntes = hadBeca ? 'SÍ' : 'NO';
    }
    if (key === 'repetidor' && !valAntes) valAntes = 'NO';
    if (key === 'status' && !valAntes) valAntes = 'Activo';
    if (key === 'tipoIngreso' && !valAntes) valAntes = 'Nuevo Ingreso';
    if (key === 'nacionalidad' && !valAntes) valAntes = 'MEXICANA';
    if (key === 'lenguaIndigena' && !valAntes) valAntes = 'NO';
    if (key === 'hablaEspanol' && !valAntes) valAntes = 'SÍ';
    if (key === 'lentes' && !valAntes) valAntes = 'NO';
    if (key === 'discapacidad' && !valAntes) valAntes = 'Ninguna';
    if (key === 'usaer' && !valAntes) valAntes = 'NO';
    if (key === 'alergias' && !valAntes) valAntes = 'Ninguna';
    if (key === 'padecimientos' && !valAntes) valAntes = 'Ninguno';
    if (key === 'cicloEscolar' && !valAntes) valAntes = '2026-2027';

    if (valAntes.toUpperCase() !== valDespues.toUpperCase()) {
      cambios.push({
        campo: ETIQUETAS_CAMPOS[key],
        antes: valAntes || '(vacío)',
        despues: valDespues || '(vacío)'
      });
    }
  });

  // Revisar cambios en documentos entregados
  const docsAntes = original.documentos || {};
  const docsDespues = nuevo.documentos || {};
  const docLabels = {
    acta: 'Acta Nac.',
    curp: 'CURP',
    certificado: 'Certificado',
    asignacion: 'Asignación',
    ine: 'INE Tutor',
    domicilio: 'Comp. Domicilio'
  };
  Object.keys(docLabels).forEach((dk) => {
    const b = !!docsAntes[dk];
    const a = !!docsDespues[dk];
    if (b !== a) {
      cambios.push({
        campo: `Doc. ${docLabels[dk]}`,
        antes: b ? 'Entregado' : 'Pendiente',
        despues: a ? 'Entregado' : 'Pendiente'
      });
    }
  });

  // Revisar cambios en extraordinarios o historial (kárdex)
  if (JSON.stringify(original.extraordinarios || []) !== JSON.stringify(nuevo.extraordinarios || [])) {
    cambios.push({
      campo: 'Exámenes Extraordinarios',
      antes: `${(original.extraordinarios || []).length} reg.`,
      despues: `${(nuevo.extraordinarios || []).length} reg.`
    });
  }
  if (JSON.stringify(original.historial || {}) !== JSON.stringify(nuevo.historial || {})) {
    cambios.push({
      campo: 'Historial Kárdex',
      antes: 'Anterior',
      despues: 'Actualizado'
    });
  }

  const nombreAlumno = `${nuevo.apellidoPaterno || original.apellidoPaterno || ''} ${nuevo.apellidoMaterno || original.apellidoMaterno || ''} ${nuevo.nombres || original.nombres || ''}`.trim().toUpperCase();
  const gradoStr = nuevo.grado || original.grado || '';
  const grupoStr = nuevo.grupo || original.grupo || '';
  const ubicacion = `${gradoStr ? gradoStr.charAt(0) + '°' : ''} "${grupoStr}"`.trim();

  // Determinar tipo de acción principal para colorear el badge en Bitácora
  let accion = 'Edición de Expediente';
  const cambioEstatus = cambios.find(c => c.campo === 'Estatus');
  const cambioBeca = cambios.find(c => c.campo === '¿Tiene Beca?' || c.campo === 'Programa de Beca');
  const cambioGrupo = cambios.find(c => c.campo === 'Grupo' || c.campo === 'Grado' || c.campo === 'Turno');

  if (cambioEstatus && (cambioEstatus.despues === 'Baja' || cambioEstatus.despues === 'No Inscrito')) {
    accion = `Baja de Alumno (${cambioEstatus.despues})`;
  } else if (cambioEstatus && cambioEstatus.despues === 'Activo') {
    accion = 'Reactivación de Alumno';
  } else if (cambioBeca && cambios.length <= 2) {
    accion = 'Actualización de Beca';
  } else if (cambioGrupo && cambios.length <= 3) {
    accion = 'Cambio de Grupo / Turno';
  }

  const resumenCambios = cambios.length > 0
    ? cambios.map(c => `${c.campo}: [${c.antes} ➔ ${c.despues}]`).join(' | ')
    : 'Guardó el expediente sin cambios en los campos';

  const detalle = `Alumno: ${nombreAlumno} (${ubicacion}) — ${resumenCambios}`;

  return {
    accion,
    detalle,
    cambios,
    alumnoNombre: nombreAlumno,
    ubicacion
  };
};
