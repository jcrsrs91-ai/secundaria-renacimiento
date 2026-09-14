export const sortStudents = (a, b) => {
  // Manejo de estructuras donde el alumno viene envuelto en { student: { ... } }
  const stA = a.student || a;
  const stB = b.student || b;

  const getVal = (val) => (val || '').toString().trim();

  // 1. Primer apellido (Paterno)
  const apA = getVal(stA.apellidoPaterno);
  const apB = getVal(stB.apellidoPaterno);
  const compAp = apA.localeCompare(apB, 'es', { sensitivity: 'base' });
  if (compAp !== 0) return compAp;

  // 2. Segundo apellido (Materno)
  const amA = getVal(stA.apellidoMaterno);
  const amB = getVal(stB.apellidoMaterno);
  const compAm = amA.localeCompare(amB, 'es', { sensitivity: 'base' });
  if (compAm !== 0) return compAm;

  // 3. Nombre(s)
  const nomA = getVal(stA.nombres || stA.nombre);
  const nomB = getVal(stB.nombres || stB.nombre);
  return nomA.localeCompare(nomB, 'es', { sensitivity: 'base' });
};
