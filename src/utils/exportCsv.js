export function downloadExcelFriendlyCsv(filename, csvString) {
  // Excel always reads UTF-16LE correctly with tabs, ignoring regional settings
  const buf = new ArrayBuffer(csvString.length * 2 + 2);
  const view = new Uint16Array(buf);
  view[0] = 0xFEFF; // UTF-16LE BOM
  for (let i = 0; i < csvString.length; i++) {
    view[i + 1] = csvString.charCodeAt(i);
  }
  
  const blob = new Blob([view], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}