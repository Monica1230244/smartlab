export function downloadCsv(filename, rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) return false;
  const headers = Array.from(list.reduce((set, row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!['payload', '__syncError'].includes(key)) set.add(key);
    });
    return set;
  }, new Set()));
  const escapeCell = (value) => {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [headers.join(';'), ...list.map((row) => headers.map((key) => escapeCell(row[key])).join(';'))].join('\n');
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
