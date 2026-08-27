const fs = require('fs');

let file = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');

// The file has some weird chars. Let's just fix the whole string matching for the text blocks.

file = file.replace(/Clave .*?nica de Registro de Poblaci.*?n/g, 'Clave Única de Registro de Población');
file = file.replace(/matr.*?cula escolar/g, 'matrícula escolar');
file = file.replace(/concluy.*? satisfactoriamente/g, 'concluyó satisfactoriamente');
file = file.replace(/Educaci.*?n Secundaria/g, 'Educación Secundaria');
file = file.replace(/Instituci.*?n Educativa/g, 'Institución Educativa');
file = file.replace(/Terminaci.*?n de Estudios/g, 'Terminación de Estudios');
file = file.replace(/en tr.*?mite\./g, 'en trámite.');
file = file.replace(/educaci.*?n secundaria/g, 'educación secundaria');
file = file.replace(/instituci.*?n durante/g, 'institución durante');
file = file.replace(/Generaci.*?n 2023/g, 'Generación 2023');
file = file.replace(/present.*? y aprob.*? el examen/g, 'presentó y aprobó el examen');
file = file.replace(/calificaci.*?n de/g, 'calificación de');
file = file.replace(/el d.*?a <strong/g, 'el día <strong');
file = file.replace(/terminaci.*?n de estudios/g, 'terminación de estudios');
file = file.replace(/A continuaci.*?n se detalla/g, 'A continuación se detalla');
file = file.replace(/historial acad.*?mico/g, 'historial académico');
file = file.replace(/expedici.*?n de este/g, 'expedición de este');
file = file.replace(/Calificaci.*?n obtenida/g, 'Calificación obtenida');
file = file.replace(/regularizaci.*?n\./g, 'regularización.');
file = file.replace(/A petici.*?n de la/g, 'A petición de la');
file = file.replace(/a los 15 d.*?as/g, 'a los 15 días');
file = file.replace(/a.*?o 2026/g, 'año 2026');
file = file.replace(/a los \{new Date\(\)\.getDate\(\)\} d.*?as/g, 'a los {new Date().getDate()} días');
file = file.replace(/del a.*?o \{new Date/g, 'del año {new Date');
file = file.replace(/Instituci.*?n<\/p>/g, 'Institución</p>');
file = file.replace(/Subsecretar.*?a de Educaci.*?n B.*?sica/g, 'Subsecretaría de Educación Básica');
file = file.replace(/T.*?cnica N.*? 68/g, 'Técnica N° 68');
file = file.replace(/A.*?o de Margarita Maza/g, 'Año de Margarita Maza');
file = file.replace(/Generaci.*?n de:/g, 'Generación de:');

fs.writeFileSync('src/components/ConstanciaPrint.jsx', file);
console.log('Fixed regex replacements');
