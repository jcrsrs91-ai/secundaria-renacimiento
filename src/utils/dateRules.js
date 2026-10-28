export const isBeforeSept30 = () => {
    const today = new Date();
    const month = today.getMonth(); // 0 = Jan, 7 = Aug, 8 = Sept
    const date = today.getDate();
    
    // El inicio de ciclo normalmente es en agosto.
    // Si estamos en agosto (7) o septiembre (8) antes del 30, es antes del corte.
    if (month === 7) return true;
    if (month === 8 && date < 30) return true;
    
    return false;
};

// ---------------------------------------------------------------------------
// ALTAS: alumno que ingresa DESPUES del 30 de septiembre.
// Periodo de alta: del 30/sep hasta fin de junio. Julio, agosto y septiembre (<30) son
// preinscripcion / inicio de ciclo, por eso ahi el ingreso se considera Ordinario.
// (Coherente con la regla de Bajas: antes del 30/sep = "No Inscrito").
// ---------------------------------------------------------------------------
export const esPeriodoDeAlta = (fecha = new Date()) => {
    const month = fecha.getMonth(); // 0 = Ene ... 8 = Sep ... 11 = Dic
    const date = fecha.getDate();
    if (month === 8) return date >= 30;
    return month >= 9 || month <= 5;
};

// Fecha corta DD/MM/AAAA (la que se imprime junto a "ALTA" en las listas)
export const formatearFechaCorta = (fecha = new Date()) => {
    const dd = String(fecha.getDate()).padStart(2, '0');
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${fecha.getFullYear()}`;
};

// Fecha en que se registro el alumno en el sistema (Timestamp de Firestore) o null
export const fechaRegistroDeAlumno = (student) => {
    const ts = student?.fechaRegistro;
    if (!ts) return null;
    if (typeof ts.toDate === 'function') return ts.toDate();
    if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000);
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
};
