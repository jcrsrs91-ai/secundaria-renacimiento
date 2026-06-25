# Reglas de Cálculo Matemático y Calificaciones

Al procesar calificaciones y generar promedios en este proyecto, SIEMPRE se debe adherir a la siguiente norma, basada en las directrices de la SEP:

1. **Cálculos con precisión completa**: Durante cualquier suma, división o cálculo intermedio (ej. promediar trimestres para sacar la calificación final de una materia, o promediar materias para sacar el promedio general), debes utilizar los valores matemáticos de punto flotante completos (sin truncar ni redondear).
2. **Sin redondeo**: La plataforma NUNCA redondea calificaciones hacia arriba o hacia abajo. Si un cálculo resulta en 5.99, sigue siendo 5.9, no 6.0.
3. **Truncamiento a 1 décima solo para presentación**: Únicamente en el paso final (cuando se va a renderizar en pantalla, o cuando se va a comparar el promedio final de la materia para ver si aprueba o reprueba), se trunca el valor a un decimal usando la función 	runcateTo1Dec.

**Ejemplo INCORRECTO** (Truncamiento prematuro):
``javascript
const promMateria = truncateTo1Dec(sumTrim / 3);
sumaGeneral += parseFloat(promMateria); // MAL: Se perdieron decimales antes de sumar.
``

**Ejemplo CORRECTO** (Cálculos exactos, truncamiento al final):
``javascript
const promMateriaRaw = sumTrim / 3;
sumaGeneral += promMateriaRaw; // BIEN: Se suman todos los decimales.
const promedioGeneralRaw = sumaGeneral / totalMaterias;
const promedioGeneralParaMostrar = truncateTo1Dec(promedioGeneralRaw);
``


## Exportación a CSV

Al exportar datos a formato CSV usando Papa Parse o cualquier otra librería, SIEMPRE se debe usar la coma (,) como delimitador explícito y agregar el BOM (\uFEFF) al inicio del archivo para garantizar la correcta visualización de caracteres especiales y la correcta separación por columnas en Excel con configuración regional estándar (México/US).

**Ejemplo CORRECTO:**
``javascript
const csv = Papa.unparse(dataToExport, { delimiter: , });
const BOM = \uFEFF;
const blob = new Blob([BOM + csv], { type: text/csv;charset=utf-8; });
``
