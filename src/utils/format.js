export const truncateTo1Dec = (val, fallback = '-') => {
  if (val === null || val === undefined || isNaN(val) || val === '') return fallback;
  const v = parseFloat(val);
  if (isNaN(v)) return fallback;
  return (Math.floor((v + 0.00001) * 10) / 10).toFixed(1);
};

export const truncateTo2Dec = (val, fallback = '-') => {
  if (val === null || val === undefined || isNaN(val) || val === '') return fallback;
  const v = parseFloat(val);
  if (isNaN(v)) return fallback;
  return (Math.floor((v + 0.00001) * 100) / 100).toFixed(2);
};

export const getCalificacionFinal = (student, materiaId) => {
  if (student.regularizacion && student.regularizacion[materiaId]) {
    return {
      valor: parseFloat(student.regularizacion[materiaId].calificacion),
      isRegularizacion: true,
      fecha: student.regularizacion[materiaId].fecha
    };
  }

  const t1 = parseFloat(student.calificaciones?.['t1']?.[materiaId]);
  const t2 = parseFloat(student.calificaciones?.['t2']?.[materiaId]);
  const t3 = parseFloat(student.calificaciones?.['t3']?.[materiaId]);
  let sum = 0, c = 0;
  if (!isNaN(t1)) { sum += t1; c++; }
  if (!isNaN(t2)) { sum += t2; c++; }
  if (!isNaN(t3)) { sum += t3; c++; }
  
  if (c > 0) {
    const finalMat = Math.floor((sum / c + 0.00001) * 10) / 10;
    return {
      valor: finalMat,
      isRegularizacion: false,
      fecha: null,
      isReprobada: finalMat < 6
    };
  }
  return null;
};

export const autoAcentuar = (text) => {
  if (!text) return '';
  const dictionary = {
    // Apellidos
    'GARCIA': 'GARCÍA', 'RODRIGUEZ': 'RODRÍGUEZ', 'MARTINEZ': 'MARTÍNEZ',
    'HERNANDEZ': 'HERNÁNDEZ', 'LOPEZ': 'LÓPEZ', 'GONZALEZ': 'GONZÁLEZ',
    'PEREZ': 'PÉREZ', 'SANCHEZ': 'SÁNCHEZ', 'RAMIREZ': 'RAMÍREZ',
    'GOMEZ': 'GÓMEZ', 'DIAZ': 'DÍAZ', 'FERNANDEZ': 'FERNÁNDEZ',
    'GUTIERREZ': 'GUTIÉRREZ', 'CHAVEZ': 'CHÁVEZ', 'DOMINGUEZ': 'DOMÍNGUEZ',
    'VAZQUEZ': 'VÁZQUEZ', 'ALVAREZ': 'ÁLVAREZ', 'SUAREZ': 'SUÁREZ',
    'MARQUEZ': 'MÁRQUEZ', 'JIMENEZ': 'JIMÉNEZ', 'MENDEZ': 'MÉNDEZ',
    'NUÑEZ': 'NÚÑEZ', 'NUNEZ': 'NÚÑEZ',
    
    // Nombres
    'CESAR': 'CÉSAR', 'ANGEL': 'ÁNGEL', 'MARIA': 'MARÍA',
    'JOSE': 'JOSÉ', 'JESUS': 'JESÚS', 'VICTOR': 'VÍCTOR',
    'HECTOR': 'HÉCTOR', 'OSCAR': 'ÓSCAR', 'RAMON': 'RAMÓN',
    'MARTIN': 'MARTÍN', 'ANDRES': 'ANDRÉS', 'TOMAS': 'TOMÁS',
    'VERONICA': 'VERÓNICA', 'MONICA': 'MÓNICA', 'ANGELICA': 'ANGÉLICA',
    'RAUL': 'RAÚL', 'JOAQUIN': 'JOAQUÍN', 'RUBEN': 'RUBÉN',
    'HECTOR': 'HÉCTOR',

    // Materias
    'MATEMATICAS': 'MATEMÁTICAS', 'FISICA': 'FÍSICA', 'QUIMICA': 'QUÍMICA',
    'BIOLOGIA': 'BIOLOGÍA', 'GEOGRAFIA': 'GEOGRAFÍA', 'INGLES': 'INGLÉS',
    'ESPANOL': 'ESPAÑOL', 'FORMACION': 'FORMACIÓN', 'CIVICA': 'CÍVICA',
    'ETICA': 'ÉTICA', 'EDUCACION': 'EDUCACIÓN', 'TECNOLOGIA': 'TECNOLOGÍA',
    'TECNOLOGIAS': 'TECNOLOGÍAS', 'TUTORIA': 'TUTORÍA'
  };

  let processed = text.toString();
  
  // Reemplazar palabra por palabra manteniendo mayúsculas si es necesario, 
  // pero dado que el input podría venir en cualquier case, lo mejor es
  // hacer un regex y reemplazar respetando el diccionario.
  
  Object.keys(dictionary).forEach(key => {
    // Regex para coincidencia de palabra completa, case insensitive
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    processed = processed.replace(regex, (match) => {
      // Si la original era toda mayúscula, devolver la versión acentuada en mayúscula
      if (match === match.toUpperCase()) {
        return dictionary[key];
      }
      // Si la original era Capitalizada
      if (match[0] === match[0].toUpperCase() && match.slice(1) === match.slice(1).toLowerCase()) {
        const acent = dictionary[key];
        return acent.charAt(0).toUpperCase() + acent.slice(1).toLowerCase();
      }
      // Si era minúscula
      return dictionary[key].toLowerCase();
    });
  });

  return processed;
};
