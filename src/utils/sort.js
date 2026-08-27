/**
 * Sort rows by a column key.
 * - numeric values compare as numbers
 * - date-looking strings compare by Date
 * - everything else falls back to localeCompare
 */
export function sortRows(rows, key, dir = 'asc') {
  const direction = dir === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * direction
    }
    if (isDateLike(av) && isDateLike(bv)) {
      return (new Date(av) - new Date(bv)) * direction
    }
    return String(av).localeCompare(String(bv), undefined, { numeric: true }) * direction
  })
}

function isDateLike(value) {
  return value instanceof Date || (typeof value === 'string' && !Number.isNaN(Date.parse(value)))
}