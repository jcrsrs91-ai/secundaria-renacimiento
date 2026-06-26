# Reglas de Cálculo Matemático y Calificaciones

Al procesar calificaciones y generar promedios en este proyecto, SIEMPRE se debe adherir a la siguiente norma, basada en las directrices de la SEP:

1. **Promedio de Asignatura (Materia)**: El promedio final de una materia se calcula promediando los 3 trimestres y **TRUNCANDO el resultado a 1 décima**. Este es el valor legal de la materia.
2. **Promedio General**: El promedio general del alumno se calcula sumando los **promedios de asignatura YA TRUNCADOS**, dividiendo entre el número de materias, y finalmente **TRUNCANDO a 1 décima**.
3. **Sin redondeo**: La plataforma NUNCA redondea calificaciones hacia arriba o hacia abajo. Si un cálculo resulta en 5.99, se trunca a 5.9.
4. **Materias sin cursar**: Si un alumno no tiene calificaciones en una materia, NO se debe contar como un cero en el promedio general. Se debe ignorar esa materia en el divisor.

**Ejemplo CORRECTO (Cálculo tipo SEP)**:
``javascript
// 1. Promedio de materia truncado a 1 decimal
const promMateria = parseFloat(truncateTo1Dec(sumTrim / 3));
// 2. Se suma el valor ya truncado al total
sumaGeneral += promMateria;
// 3. Promedio general truncado a 1 decimal
const promedioGeneral = truncateTo1Dec(sumaGeneral / totalMaterias);
``

## Exportación a CSV

Al exportar datos a formato CSV usando Papa Parse o cualquier otra librería, SIEMPRE se debe usar la coma (,) como delimitador explícito y agregar el BOM (\uFEFF) al inicio del archivo para garantizar la correcta visualización de caracteres especiales y la correcta separación por columnas en Excel con configuración regional estándar (México/US).


## SEP Grading Rules (Secretaría de Educación Pública)
- **Internal Calculations**: Always calculate averages with exact precision (no truncation or rounding in intermediate steps) to properly break ties.
- **Honor Roll / Merits**: Any student with a failing grade (score < 6) or missing grades in any subject MUST be strictly excluded from honor rolls and merit lists, regardless of their overall average.
- **Display Truncation**: When displaying final averages, NEVER round up. Always truncate strictly to 1 decimal place. Do not use standard \.toFixed(1)\ or \Math.round\ for display. Use the SEP-compliant truncation: \(Math.floor((value + 0.00001) * 10) / 10).toFixed(1)\.
