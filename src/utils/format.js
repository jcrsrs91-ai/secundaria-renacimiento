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
