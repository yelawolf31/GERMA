/**
 * Build a CSV string (Excel-friendly: BOM + CRLF).
 * Semicolon separator works better with French/Arabic Excel locales.
 */
export function toCsv(headers, rows, separator = ';') {
  const escape = (value) => {
    const s = value == null ? '' : String(value)
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.map(escape).join(separator)]
  for (const row of rows) {
    lines.push(row.map(escape).join(separator))
  }
  return `\uFEFF${lines.join('\r\n')}`
}

/** Trigger a browser download of the CSV.
 * @returns {boolean} true when the download started
 */
export function exportCsv(filename, headers, rows, separator = ';') {
  const csv = toCsv(headers, rows, separator)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}