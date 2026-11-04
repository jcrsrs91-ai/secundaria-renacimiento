export const truncateNumberTo1Dec = (val) => {
  if (val === null || val === undefined || isNaN(val) || val === '') return null;
  const v = parseFloat(val);
  if (isNaN(v)) return null;
  return Math.floor((v + 0.00001) * 10) / 10;
};

export const truncateTo1Dec = (val, fallback = '-') => {
  const num = truncateNumberTo1Dec(val);
  if (num === null) return fallback;
  return num.toFixed(1);
};

export const truncateTo2Dec = (val, fallback = '-') => {
  if (val === null || val === undefined || isNaN(val) || val === '') return fallback;
  const v = parseFloat(val);
  if (isNaN(v)) return fallback;
  return (Math.floor((v + 0.00001) * 100) / 100).toFixed(2);
};

export const getCalificacionFinal = (student, materiaId) => {
  if (!student) return null;
  if (student.regularizacion && student.regularizacion[materiaId]) {
    // Attempt to still provide t1, t2, t3 if they exist, for the kardex display
    const t1 = parseFloat(student.calificaciones?.['t1']?.[materiaId]);
    const t2 = parseFloat(student.calificaciones?.['t2']?.[materiaId]);
    const t3 = parseFloat(student.calificaciones?.['t3']?.[materiaId]);
    const regVal = truncateNumberTo1Dec(student.regularizacion[materiaId].calificacion);
    if (regVal !== null) {
      return {
        valor: regVal,
        isRegularizacion: true,
        fecha: student.regularizacion[materiaId].fecha,
        isReprobada: regVal < 6,
        t1: isNaN(t1) ? '-' : t1,
        t2: isNaN(t2) ? '-' : t2,
        t3: isNaN(t3) ? '-' : t3
      };
    }
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
      isReprobada: finalMat < 6,
      t1: isNaN(t1) ? '-' : t1,
      t2: isNaN(t2) ? '-' : t2,
      t3: isNaN(t3) ? '-' : t3
    };
  }
  return null;
};

/**
 * Calcula el promedio de un trimestre específico (t1, t2 o t3) según método PASEG:
 * Suma las calificaciones capturadas en ese trimestre y trunca a 1 decimal sin redondear.
 */
export const getPromedioTrimestrePASEG = (student, materias = [], trimestreKey = 't1') => {
  if (!student || !Array.isArray(materias)) return null;
  let sum = 0;
  let count = 0;
  materias.forEach(mat => {
    const matId = typeof mat === 'string' ? mat : mat.id;
    const raw = parseFloat(student.calificaciones?.[trimestreKey]?.[matId]);
    if (!isNaN(raw)) {
      sum += raw;
      count++;
    }
  });
  if (count === 0) return null;
  return Math.floor((sum / count + 0.00001) * 10) / 10;
};

/**
 * Calcula el Promedio General Final del alumno según método PASEG:
 * Promedia los promedios finales ya truncados a 1 decimal de cada asignatura
 * y trunca el resultado final a 1 decimal sin redondear.
 */
export const getPromedioGeneralPASEG = (student, materias = []) => {
  if (!student || !Array.isArray(materias)) return null;
  let sum = 0;
  let count = 0;
  materias.forEach(mat => {
    const matId = typeof mat === 'string' ? mat : mat.id;
    const finalObj = getCalificacionFinal(student, matId);
    if (finalObj && finalObj.valor !== null && !isNaN(finalObj.valor)) {
      sum += finalObj.valor;
      count++;
    }
  });
  if (count === 0) return null;
  return Math.floor((sum / count + 0.00001) * 10) / 10;
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
    'NUÑEZ': 'NÚÑEZ', 'NUNEZ': 'NÚÑEZ', 'BARRAGAN': 'BARRAGÁN',
    'GUZMAN': 'GUZMÁN', 'CORTES': 'CORTÉS', 'RIOS': 'RÍOS', 'LEON': 'LEÓN',
    'GIRON': 'GIRÓN', 'GALVAN': 'GALVÁN', 'VALDES': 'VALDÉS',
    'SALOMON': 'SALOMÓN', 'RINCON': 'RINCÓN', 'ROMAN': 'ROMÁN',
    'RENDON': 'RENDÓN', 'MILLAN': 'MILLÁN', 'PADRON': 'PADRÓN',
    'MEJIA': 'MEJÍA', 'MACIAS': 'MACÍAS', 'MUNGUIA': 'MUNGUÍA',
    'BAEZ': 'BÁEZ', 'JUAREZ': 'JUÁREZ', 'PELAEZ': 'PELÁEZ', 'SAENZ': 'SÁENZ',
    'RENTERIA': 'RENTERÍA', 'DAVILA': 'DÁVILA', 'CORDOVA': 'CÓRDOVA',
    'AVILA': 'ÁVILA', 'BARCENAS': 'BÁRCENAS', 'VELEZ': 'VÉLEZ',
    'TELLEZ': 'TÉLLEZ', 'YAÑEZ': 'YÁÑEZ', 'YANEZ': 'YÁÑEZ', 
    'BOHORQUEZ': 'BOHÓRQUEZ', 'MUÑIZ': 'MÚÑIZ', 'PAEZ': 'PÁEZ',
    'IÑIGUEZ': 'ÍÑIGUEZ', 'INIGUEZ': 'ÍÑIGUEZ', 'ORDOÑEZ': 'ORDÓÑEZ',
    'CASTAÑON': 'CASTAÑÓN', 'SANTILLAN': 'SANTILLÁN', 'FELIX': 'FÉLIX',
    'GALVEZ': 'GÁLVEZ', 'ANGELES': 'ÁNGELES', 'OLIVAREZ': 'OLIVÁREZ',
    'CHACON': 'CHACÓN', 'CORDON': 'CORDÓN', 'CERON': 'CERÓN',
    'MORAN': 'MORÁN', 'PIÑON': 'PIÑÓN', 'COVIAN': 'COVIÁN',
    'TERAN': 'TERÁN', 'GAYTAN': 'GAYTÁN', 'ALEMAN': 'ALEMÁN',
    'ALMAZAN': 'ALMAZÁN', 'ANTON': 'ANTÓN', 'BAZAN': 'BAZÁN',
    'BOTELLO': 'BOTELLO', 'CALDERON': 'CALDERÓN', 'CANTU': 'CANTÚ',
    'CARRION': 'CARRIÓN', 'CASTAÑEDA': 'CASTAÑEDA', 'CASTANEDA': 'CASTAÑEDA',
    'CEPEDA': 'CEPEDA', 'CERVANTES': 'CERVANTES', 'COLON': 'COLÓN',
    'CORONEL': 'CORONEL', 'CORTAZAR': 'CORTÁZAR', 'CUELLAR': 'CUÉLLAR',
    'DURAN': 'DURÁN', 'ESCANDELL': 'ESCANDELL', 'ESTRADA': 'ESTRADA',
    'FALCON': 'FALCÓN', 'FIGUEROA': 'FIGUEROA', 'GAITAN': 'GAITÁN',
    'GARRIDO': 'GARRIDO', 'GARZA': 'GARZA', 'GASTON': 'GASTÓN',
    'GODINEZ': 'GODÍNEZ', 'GUILLEN': 'GUILLÉN', 'IBARRA': 'IBARRA',
    'LARA': 'LARA', 'LOBATO': 'LOBATO', 'LUGO': 'LUGO',
    'LUNA': 'LUNA', 'MADRIGAL': 'MADRIGAL', 'MALDONADO': 'MALDONADO',
    'MARIN': 'MARÍN', 'MEDINA': 'MEDINA', 'MELENDEZ': 'MELÉNDEZ',
    'MENDOZA': 'MENDOZA', 'MESA': 'MESA', 'MIRANDA': 'MIRANDA',
    'MOLINA': 'MOLINA', 'MONCAYO': 'MONCAYO', 'MONDRAGON': 'MONDRAGÓN',
    'MONTES': 'MONTES', 'MONTOYA': 'MONTOYA', 'MORALES': 'MORALES',
    'MORENO': 'MORENO', 'MOYA': 'MOYA', 'MUÑOZ': 'MUÑOZ',
    'NAVARRO': 'NAVARRO', 'NIEVES': 'NIEVES', 'NOVOA': 'NOVOA',
    'OCHOA': 'OCHOA', 'OLIVARES': 'OLIVARES', 'OLMOS': 'OLMOS',
    'OROZCO': 'OROZCO', 'ORTEGA': 'ORTEGA', 'OSORIO': 'OSORIO',
    'PACHECO': 'PACHECO', 'PADILLA': 'PADILLA', 'PALACIOS': 'PALACIOS',
    'PARDO': 'PARDO', 'PAREDES': 'PAREDES', 'PARRA': 'PARRA',
    'PAZ': 'PAZ', 'PEÑA': 'PEÑA', 'PERALTA': 'PERALTA',
    'PINEDA': 'PINEDA', 'PIÑA': 'PIÑA', 'PLAZA': 'PLAZA',
    'PONCE': 'PONCE', 'PORRAS': 'PORRAS', 'PORTILLO': 'PORTILLO',
    'PRADO': 'PRADO', 'PRIETO': 'PRIETO', 'PUENTE': 'PUENTE',
    'QUINTANA': 'QUINTANA', 'QUINTERO': 'QUINTERO', 'QUIROGA': 'QUIROGA',
    'RAMOS': 'RAMOS', 'RANGEL': 'RANGEL', 'REYES': 'REYES',
    'REYNA': 'REYNA', 'RIVAS': 'RIVAS', 'RIVERA': 'RIVERA',
    'ROBLES': 'ROBLES', 'ROCHA': 'ROCHA', 'ROJAS': 'ROJAS',
    'ROMERO': 'ROMERO', 'ROSALES': 'ROSALES', 'ROSAS': 'ROSAS',
    'RUBIO': 'RUBIO', 'RUIZ': 'RUIZ', 'SAAVEDRA': 'SAAVEDRA',
    'SALAS': 'SALAS', 'SALAZAR': 'SALAZAR', 'SALCEDO': 'SALCEDO',
    'SALINAS': 'SALINAS', 'SAMPERIO': 'SAMPERIO', 'SANABRIA': 'SANABRIA',
    'SANTANA': 'SANTANA', 'SANTIAGO': 'SANTIAGO', 'SANTOS': 'SANTOS',
    'SEGOVIA': 'SEGOVIA', 'SEPULVEDA': 'SEPÚLVEDA', 'SERNA': 'SERNA',
    'SERRANO': 'SERRANO', 'SIERRA': 'SIERRA', 'SILVA': 'SILVA',
    'SOLIS': 'SOLÍS', 'SOTO': 'SOTO', 'SUAREZ': 'SUÁREZ',
    'TAPIA': 'TAPIA', 'TEJEDA': 'TEJEDA', 'TELLEZ': 'TÉLLEZ',
    'TERRAZAS': 'TERRAZAS', 'TOLEDO': 'TOLEDO', 'TORRES': 'TORRES',
    'TOVAR': 'TOVAR', 'TREJO': 'TREJO', 'TREVIÑO': 'TREVIÑO',
    'TRUJILLO': 'TRUJILLO', 'UGALDE': 'UGALDE', 'ULLOA': 'ULLOA',
    'URBINA': 'URBINA', 'URIBE': 'URIBE', 'URRUTIA': 'URRUTIA',
    'VALDEZ': 'VALDEZ', 'VALDIVIA': 'VALDIVIA', 'VALENCIA': 'VALENCIA',
    'VALENZUELA': 'VALENZUELA', 'VALERA': 'VALERA', 'VALLE': 'VALLE',
    'VALLEJO': 'VALLEJO', 'VARELA': 'VARELA', 'VARGAS': 'VARGAS',
    'VEGA': 'VEGA', 'VELASCO': 'VELASCO', 'VELAZQUEZ': 'VELÁZQUEZ',
    'VENEGAS': 'VENEGAS', 'VERA': 'VERA', 'VERDUGO': 'VERDUGO',
    'VERGARA': 'VERGARA', 'VICENTE': 'VICENTE', 'VIDAL': 'VIDAL',
    'VIEYRA': 'VIEYRA', 'VILCHES': 'VILCHES', 'VILLA': 'VILLA',
    'VILLALOBOS': 'VILLALOBOS', 'VILLALPANDO': 'VILLALPANDO', 'VILLANUEVA': 'VILLANUEVA',
    'VILLARREAL': 'VILLARREAL', 'VILLEGAS': 'VILLEGAS', 'VIVEROS': 'VIVEROS',
    'YANEZ': 'YÁÑEZ', 'YAÑEZ': 'YÁÑEZ', 'YBARRA': 'YBARRA',
    'ZAMBRANO': 'ZAMBRANO', 'ZAMORA': 'ZAMORA', 'ZAMUDIO': 'ZAMUDIO',
    'ZAPATA': 'ZAPATA', 'ZARAGOZA': 'ZARAGOZA', 'ZARATE': 'ZÁRATE',
    'ZAVALA': 'ZAVALA', 'ZEPEDA': 'ZEPEDA', 'ZUÑIGA': 'ZÚÑIGA', 'ZUNIGA': 'ZÚÑIGA',
    'CESAR': 'CÉSAR', 'ANGEL': 'ÁNGEL', 'MARIA': 'MARÍA',
    'JOSE': 'JOSÉ', 'JESUS': 'JESÚS', 'VICTOR': 'VÍCTOR',
    'HECTOR': 'HÉCTOR', 'OSCAR': 'ÓSCAR', 'RAMON': 'RAMÓN',
    'MARTIN': 'MARTÍN', 'ANDRES': 'ANDRÉS', 'TOMAS': 'TOMÁS',
    'DAMIAN': 'DAMIÁN', 'FABIAN': 'FABIÁN', 'DARIO': 'DARÍO',
    'IVAN': 'IVÁN', 'GERMAN': 'GERMÁN', 'HERNAN': 'HERNÁN',
    'SIMON': 'SIMÓN', 'AGUSTIN': 'AGUSTÍN', 'BENJAMIN': 'BENJAMÍN',
    'VALENTIN': 'VALENTÍN', 'FERMIN': 'FERMÍN', 'NESTOR': 'NÉSTOR',
    'ALVARO': 'ÁLVARO', 'EDGAR': 'ÉDGAR', 'FELIX': 'FÉLIX', 'RENE': 'RENÉ',
    'EFRAIN': 'EFRAÍN', 'AMERICA': 'AMÉRICA', 'AFRICA': 'ÁFRICA',
    'FATIMA': 'FÁTIMA', 'BARBARA': 'BÁRBARA', 'BELEN': 'BELÉN',
    'ABIGAIL': 'ABIGAÍL', 'JOSAFAT': 'JOSAFÁT', 'MATIAS': 'MATÍAS',
    'TOBIAS': 'TOBÍAS', 'ISAIAS': 'ISAÍAS', 'JEREMIAS': 'JEREMÍAS',
    'ZACARIAS': 'ZACARÍAS', 'NOEMI': 'NOEMÍ', 'NAHUM': 'NAHÚM',
    'ESAU': 'ESAÚ', 'SARAI': 'SARAÍ', 'ANAHI': 'ANAHÍ', 'MARILU': 'MARILÚ',
    'LULU': 'LULÚ', 'ANGELA': 'ÁNGELA', 'AGUEDA': 'ÁGUEDA', 'ASTRID': 'ÁSTRID',
    'ERIKA': 'ÉRIKA', 'URSULA': 'ÚRSULA', 'DAMASO': 'DÁMASO', 
    'PROSPERO': 'PRÓSPERO', 'TELESFORO': 'TÉLESFORO', 'ESTEFANOS': 'ESTÉFANOS',
    'ESTEFANIA': 'ESTEFANÍA', 'ARTEMIO': 'ARTEMIO', 'ARTURO': 'ARTURO',
    'BARTOLOME': 'BARTOLOMÉ', 'BERNABE': 'BERNABÉ', 'BOGAR': 'BOGAR',
    'CANDIDO': 'CÁNDIDO', 'CARMELO': 'CARMELO', 'CASIMIRO': 'CASIMIRO',
    'CELSO': 'CELSO', 'CESAREO': 'CESÁREO', 'CLEMENTE': 'CLEMENTE',
    'CRISTIAN': 'CRISTIAN', 'CRISTOBAL': 'CRISTÓBAL', 'CRUZ': 'CRUZ',
    'CUPERTINO': 'CUPERTINO', 'DARIO': 'DARÍO', 'DAVID': 'DAVID',
    'DELFINO': 'DELFINO', 'DEMETRIO': 'DEMETRIO', 'DIEGO': 'DIEGO',
    'DIONISIO': 'DIONISIO', 'DOMINGO': 'DOMINGO', 'DONATO': 'DONATO',
    'EDMUNDO': 'EDMUNDO', 'EDUARDO': 'EDUARDO', 'ELIAS': 'ELÍAS',
    'ELISEO': 'ELISEO', 'EMILIANO': 'EMILIANO', 'EMILIO': 'EMILIO',
    'ENRIQUE': 'ENRIQUE', 'EPIFANIO': 'EPIFANIO', 'ERASMO': 'ERASMO',
    'ERNESTO': 'ERNESTO', 'ESTEBAN': 'ESTEBAN', 'EUGENIO': 'EUGENIO',
    'EUSEBIO': 'EUSEBIO', 'EUSTAQUIO': 'EUSTAQUIO', 'EVARISTO': 'EVARISTO',
    'EZEQUIEL': 'EZEQUIEL', 'FABRICIO': 'FABRICIO', 'FACUNDO': 'FACUNDO',
    'FAUSTINO': 'FAUSTINO', 'FAUSTO': 'FAUSTO', 'FEDERICO': 'FEDERICO',
    'FELICIANO': 'FELICIANO', 'FELIPE': 'FELIPE', 'FERNANDO': 'FERNANDO',
    'FIDEL': 'FIDEL', 'FLORENCIO': 'FLORENCIO', 'FLORENTINO': 'FLORENTINO',
    'FRANCISCO': 'FRANCISCO', 'FULGENCIO': 'FULGENCIO', 'GABRIEL': 'GABRIEL',
    'GENARO': 'GENARO', 'GERARDO': 'GERARDO', 'GERONIMO': 'GERÓNIMO',
    'GILBERTO': 'GILBERTO', 'GREGORIO': 'GREGORIO', 'GUILLERMO': 'GUILLERMO',
    'GUSTAVO': 'GUSTAVO', 'HERIBERTO': 'HERIBERTO', 'HIGINIO': 'HIGINIO',
    'HILARIO': 'HILARIO', 'HIPOLITO': 'HIPÓLITO', 'HORACIO': 'HORACIO',
    'HUGO': 'HUGO', 'HUMBERTO': 'HUMBERTO', 'IGNACIO': 'IGNACIO',
    'ILDEFONSO': 'ILDEFONSO', 'INOCENCIO': 'INOCENCIO', 'ISAC': 'ISAC',
    'ISIDORO': 'ISIDORO', 'ISIDRO': 'ISIDRO', 'ISMAEL': 'ISMAEL',
    'JACINTO': 'JACINTO', 'JAIME': 'JAIME', 'JAVIER': 'JAVIER',
    'JERONIMO': 'JERÓNIMO', 'JORGE': 'JORGE', 'JOSE': 'JOSÉ',
    'JUAN': 'JUAN', 'JULIO': 'JULIO', 'JUSTINO': 'JUSTINO',
    'JUSTO': 'JUSTO', 'LEANDRO': 'LEANDRO', 'LEOCADIO': 'LEOCADIO',
    'LEONARDO': 'LEONARDO', 'LEONCIO': 'LEONCIO', 'LORENZO': 'LORENZO',
    'LUCAS': 'LUCAS', 'LUIS': 'LUIS', 'MACARIO': 'MACARIO',
    'MANUEL': 'MANUEL', 'MARCELINO': 'MARCELINO', 'MARCELO': 'MARCELO',
    'MARCIAL': 'MARCIAL', 'MARCIANO': 'MARCIANO', 'MARCOS': 'MARCOS',
    'MARGARITO': 'MARGARITO', 'MARIANO': 'MARIANO', 'MARIO': 'MARIO',
    'MATEO': 'MATEO', 'MAURICIO': 'MAURICIO', 'MAXIMILIANO': 'MAXIMILIANO',
    'MAXIMINO': 'MAXIMINO', 'MIGUEL': 'MIGUEL', 'MODESTO': 'MODESTO',
    'NARCISO': 'NARCISO', 'NICOLAS': 'NICOLÁS', 'NORBERTO': 'NORBERTO',
    'OCTAVIO': 'OCTAVIO', 'PABLO': 'PABLO', 'PASCUAL': 'PASCUAL',
    'PATRICIO': 'PATRICIO', 'PEDRO': 'PEDRO', 'PLACIDO': 'PLÁCIDO',
    'PORFIRIO': 'PORFIRIO', 'RAFAEL': 'RAFAEL', 'RAMIRO': 'RAMIRO',
    'RAYMUNDO': 'RAYMUNDO', 'RICARDO': 'RICARDO', 'ROBERTO': 'ROBERTO',
    'RODOLFO': 'RODOLFO', 'RODRIGO': 'RODRIGO', 'ROGELIO': 'ROGELIO',
    'ROLANDO': 'ROLANDO', 'ROMUALDO': 'ROMUALDO', 'ROQUE': 'ROQUE',
    'ROSARIO': 'ROSARIO', 'ROSENDO': 'ROSENDO', 'RUFINO': 'RUFINO',
    'RUPERTO': 'RUPERTO', 'SABINO': 'SABINO', 'SALVADOR': 'SALVADOR',
    'SAMUEL': 'SAMUEL', 'SANTIAGO': 'SANTIAGO', 'SANTOS': 'SANTOS',
    'SEGOVIA': 'SEGOVIA', 'SEPULVEDA': 'SEPÚLVEDA', 'SERNA': 'SERNA',
    'SERRANO': 'SERRANO', 'SIERRA': 'SIERRA', 'SILVA': 'SILVA',
    'SOLIS': 'SOLÍS', 'SOTO': 'SOTO', 'SUAREZ': 'SUÁREZ',
    'TADEO': 'TADEO', 'TEODORO': 'TEODORO', 'TIMOTEO': 'TIMOTEO',
    'TITO': 'TITO', 'TOMAS': 'TOMÁS', 'TRINIDAD': 'TRINIDAD',
    'ULISES': 'ULISES', 'VALERIANO': 'VALERIANO', 'VALERIO': 'VALERIO',
    'VENANCIO': 'VENANCIO', 'VICENTE': 'VICENTE', 'VIRGILIO': 'VIRGILIO',
    'WENCESLAO': 'WENCESLAO', 'XAVIER': 'XAVIER', 'YAIR': 'YAIR',
    'ZACARIAS': 'ZACARÍAS', 'ZENON': 'ZENÓN',
    'LEON': 'LEÓN', 'YUNUEN': 'YUNUÉN', 'IXCHEL': 'IXCHEL',
    'SOCHITL': 'XÓCHITL', 'XOCHITL': 'XÓCHITL', 'YOLOTL': 'YÓLOTL',
    'MATEMATICAS': 'MATEMÁTICAS', 'FISICA': 'FÍSICA', 'QUIMICA': 'QUÍMICA',
    'BIOLOGIA': 'BIOLOGÍA', 'GEOGRAFIA': 'GEOGRAFÍA', 'INGLES': 'INGLÉS',
    'ESPANOL': 'ESPAÑOL', 'FORMACION': 'FORMACIÓN', 'CIVICA': 'CÍVICA',
    'ETICA': 'ÉTICA', 'EDUCACION': 'EDUCACIÓN', 'TECNOLOGIA': 'TECNOLOGÍA',
  };

  let processed = text.toString();
  
  Object.keys(dictionary).forEach(key => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    processed = processed.replace(regex, (match) => {
      if (match === match.toUpperCase()) {
        return dictionary[key];
      }
      if (match[0] === match[0].toUpperCase() && match.slice(1) === match.slice(1).toLowerCase()) {
        const acent = dictionary[key];
        return acent.charAt(0).toUpperCase() + acent.slice(1).toLowerCase();
      }
      return dictionary[key].toLowerCase();
    });
  });

  return processed;
};
