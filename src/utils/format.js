export const truncateTo1Dec = (val, fallback = '-') => {
  if (val === null || val === undefined || isNaN(val) || val === '') return fallback;
  const v = parseFloat(val);
  if (isNaN(v)) return fallback;
  return (Math.floor((v + 0.00001) * 10) / 10).toFixed(1);
};
