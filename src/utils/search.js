export const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const searchIncludes = (source, query) => {
  if (!source) return false;
  const normSource = normalizeText(source);
  const normQuery = normalizeText(query);
  if (!normQuery) return true;
  
  const queryWords = normQuery.split(/\s+/);
  return queryWords.every(word => normSource.includes(word));
};
