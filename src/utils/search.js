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
  const normQuery = normalizeText(query);
  if (!normQuery) return true; // If no query, everything matches
  if (!source) return false; // If there is a query but no source, no match
  
  const normSource = normalizeText(source);
  const queryWords = normQuery.split(/\s+/);
  return queryWords.every(word => normSource.includes(word));
};
