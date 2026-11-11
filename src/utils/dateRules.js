// Convierte cualquier formato de fecha (Date, Timestamp de Firestore, DD/MM/YYYY, YYYY-MM-DD o ISO) a Date local (mediodía)
export const parseFechaFlexible = (valor) => {
    if (!valor) return null;
    if (valor instanceof Date) {
        return isNaN(valor.getTime()) ? null : valor;
    }
    if (typeof valor?.toDate === 'function') {
        const d = valor.toDate();
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof valor?.seconds === 'number') {
        const d = new Date(valor.seconds * 1000);
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof valor === 'string') {
        const clean = valor.trim();
        if (!clean) return null;

        // Formato DD/MM/YYYY o DD-MM-YYYY
        const mMx = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(clean);
        if (mMx) {
            const dd = Number(mMx[1]);
            const mm = Number(mMx[2]) - 1;
            const yyyy = Number(mMx[3]);
            const d = new Date(yyyy, mm, dd, 12, 0, 0);
            return isNaN(d.getTime()) ? null : d;
        }

        // Formato YYYY-MM-DD
        const mIsoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean);
        if (mIsoDate) {
            const yyyy = Number(mIsoDate[1]);
            const mm = Number(mIsoDate[2]) - 1;
            const dd = Number(mIsoDate[3]);
            const d = new Date(yyyy, mm, dd, 12, 0, 0);
            return isNaN(d.getTime()) ? null : d;
        }

        const parsed = new Date(clean);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
};

// Fecha corta DD/MM/AAAA (la que se guarda en fechaBaja / fechaAlta y se imprime en formatos)
export const formatearFechaCorta = (fecha = new Date()) => {
    const d = parseFechaFlexible(fecha) || new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
};

// ---------------------------------------------------------------------------
// REGLA OFICIAL SEP / ESTADÍSTICA 911:
// Solo se toman como BAJAS OFICIALES las que ocurren DESPUÉS del 30 de septiembre
// (es decir, a partir del 1 de octubre en adelante).
// Si ocurre en agosto o del 1 al 30 de septiembre inclusive, es "No Inscrito".
// ---------------------------------------------------------------------------
export const isBeforeSept30 = (fechaInput = new Date()) => {
    const target = parseFechaFlexible(fechaInput) || new Date();
    const month = target.getMonth(); // 0 = Ene, 7 = Ago, 8 = Sep, 9 = Oct
    const date = target.getDate();

    // Agosto (7) o Septiembre (8) hasta el día 30 inclusive -> Antes o igual al corte del 30 de septiembre
    if (month === 7) return true;
    if (month === 8 && date <= 30) return true;

    return false;
};

// ---------------------------------------------------------------------------
// ALTAS: alumno que ingresa DESPUÉS del 30 de septiembre (del 1 de octubre a fin de junio).
// (Coherente con la regla de Bajas: hasta el 30 de septiembre = Ordinario / No Inscrito).
// ---------------------------------------------------------------------------
export const esPeriodoDeAlta = (fechaInput = new Date()) => {
    const target = parseFechaFlexible(fechaInput) || new Date();
    const month = target.getMonth(); // 0 = Ene ... 8 = Sep, 9 = Oct ... 11 = Dic
    return month >= 9 || month <= 5;
};

// Obtiene el objeto Date real en que el alumno fue dado de baja (priorizando fechaBaja y luego lastModifiedAt)
export const obtenerFechaBajaDate = (student) => {
    if (!student) return null;
    const fromFechaBaja = parseFechaFlexible(student.fechaBaja);
    if (fromFechaBaja) return fromFechaBaja;
    const fromLastModified = parseFechaFlexible(student.lastModifiedAt);
    if (fromLastModified) return fromLastModified;
    return null;
};

// Devuelve la fecha de baja en formato DD/MM/AAAA
export const obtenerFechaBajaTexto = (student) => {
    if (!student) return '';
    const d = obtenerFechaBajaDate(student);
    if (d) return formatearFechaCorta(d);
    if (typeof student.fechaBaja === 'string' && student.fechaBaja.trim()) {
        return student.fechaBaja.trim();
    }
    return '';
};

// Determina si un alumno cuenta como BAJA OFICIAL (dada de baja DESPUÉS del 30 de septiembre)
export const esBajaOficial = (student) => {
    if (!student) return false;
    const st = (student.status || '').toLowerCase();
    if (st !== 'baja') return false;
    if (student.motivoBaja === 'No Inscrito' || student.tipoBaja === 'No Inscrito') return false;

    const fechaBajaDate = obtenerFechaBajaDate(student);
    if (fechaBajaDate && isBeforeSept30(fechaBajaDate)) {
        return false;
    }
    return true;
};

// Fecha en que se registró el alumno en el sistema (Timestamp de Firestore) o null
export const fechaRegistroDeAlumno = (student) => {
    return parseFechaFlexible(student?.fechaRegistro);
};
