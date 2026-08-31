import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Registra un movimiento en la bitácora del sistema
 * @param {string} usuario - Correo o nombre del usuario que realiza la acción
 * @param {string} modulo - Nombre del módulo donde ocurre la acción (ej. 'Control Escolar')
 * @param {string} accion - Tipo de acción (ej. 'Alta', 'Baja', 'Calificación', 'Edición')
 * @param {string} detalle - Descripción detallada de lo que se hizo
 */
export const registrarMovimiento = async (usuario, modulo, accion, detalle) => {
  try {
    const bitacoraRef = collection(db, 'bitacora_movimientos');
    await addDoc(bitacoraRef, {
      usuario: usuario || 'Desconocido',
      modulo,
      accion,
      detalle,
      fecha: serverTimestamp(),
      timestampISO: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al registrar en bitácora:", error);
  }
};
