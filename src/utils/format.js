const FR_MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']
const FR_MONTHS_LONG = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
const FR_DAYS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']

/**
 * Format an ISO date to dd/mm/yyyy.
 */
export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

/**
 * Format an ISO datetime to dd/mm/yyyy HH:mm.
 */
export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${formatDate(value)} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`
}

/**
 * Format an ISO datetime to HH:mm.
 */
export function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/**
 * Short French date like "05 août 2026".
 */
export function formatDateShort(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.getDate()} ${FR_MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Relative friendly date in French: "Aujourd'hui", "Hier", "Il y a 3 jours".
 */
export function formatRelativeDate(value, t) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const daysDiff = Math.round((today - target) / 86400000)

  if (daysDiff === 0) return t ? t('common.today') : "Aujourd'hui"
  if (daysDiff === 1) return t ? t('visits.yesterday') : 'Hier'
  if (daysDiff > 1 && daysDiff <= 7) return `Il y a ${daysDiff} jours`
  if (daysDiff < 0) return 'À venir'
  return formatDate(value)
}

/**
 * Date label from an ISO date (day + short month), used in charts.
 */
export function formatShortDay(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.getDate()} ${FR_MONTHS[date.getMonth()]}`
}

/**
 * Weekday short label.
 */
export function formatWeekday(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return FR_DAYS[date.getDay()]
}

/**
 * Today at 00:00:00 local.
 */
export function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Days ago at 00:00:00 local.
 */
export function startOfDaysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Is an ISO date today (local)?
 */
export function isToday(value) {
  if (!value) return false
  const date = new Date(value)
  return date.toDateString() === new Date().toDateString()
}

/**
 * Is an ISO date today or after?
 */
export function isTodayOrAfter(value) {
  if (!value) return false
  const date = new Date(value)
  const startToday = startOfToday()
  return date >= startToday
}
