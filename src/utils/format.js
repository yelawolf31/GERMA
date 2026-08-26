const FR_MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']
const FR_MONTHS_LONG = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
const FR_DAYS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']

function getLocale() {
  try {
    return document.documentElement.lang || 'fr'
  } catch {
    return 'fr'
  }
}

function shortMonth(locale, monthIndex) {
  try {
    const d = new Date(2024, monthIndex, 1)
    return d.toLocaleString(locale, { month: 'short' })
  } catch {
    return FR_MONTHS[monthIndex]
  }
}

function longMonth(locale, monthIndex) {
  try {
    const d = new Date(2024, monthIndex, 1)
    return d.toLocaleString(locale, { month: 'long' })
  } catch {
    return FR_MONTHS_LONG[monthIndex]
  }
}

const TZ = 'Africa/Algiers'

function tzDateParts(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const get = (type) => Number(parts.find((p) => p.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') }
}

/**
 * Format an ISO date to dd/mm/yyyy.
 */
export function formatDate(value) {
  if (!value) return '—'
  const p = tzDateParts(value)
  if (!p) return '—'
  return `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year}`
}

/**
 * Format an ISO datetime to dd/mm/yyyy HH:mm.
 */
export function formatDateTime(value) {
  if (!value) return '—'
  const p = tzDateParts(value)
  if (!p) return '—'
  return `${formatDate(value)} ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}

/**
 * Format an ISO datetime to HH:mm.
 */
export function formatTime(value) {
  if (!value) return '—'
  const p = tzDateParts(value)
  if (!p) return '—'
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}

/**
 * Short French date like "05 août 2026".
 */
export function formatDateShort(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const locale = getLocale()
  return `${date.getDate()} ${longMonth(locale, date.getMonth())} ${date.getFullYear()}`
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

  if (daysDiff === 0) return t ? t('common.today') : 'Today'
  if (daysDiff === 1) return t ? t('visits.yesterday') : 'Yesterday'
  if (daysDiff > 1 && daysDiff <= 7) return t ? `${daysDiff} ${t('common.previous').toLowerCase()}` : `${daysDiff} days ago`
  if (daysDiff < 0) return t ? t('common.next') : 'Upcoming'
  return formatDate(value)
}

/**
 * Date label from an ISO date (day + short month), used in charts.
 */
export function formatShortDay(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const locale = getLocale()
  return `${date.getDate()} ${shortMonth(locale, date.getMonth())}`
}

/**
 * Weekday short label.
 */
export function formatWeekday(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const locale = getLocale()
  try {
    return date.toLocaleString(locale, { weekday: 'short' })
  } catch {
    return FR_DAYS[date.getDay()]
  }
}

/**
 * Today at 00:00:00 Africa/Algiers.
 */
export function startOfToday() {
  const now = new Date()
  const p = tzDateParts(now)
  if (!p) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }
  return new Date(`${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}T00:00:00+01:00`)
}

/**
 * Days ago at 00:00:00 Africa/Algiers.
 */
export function startOfDaysAgo(days) {
  const now = new Date()
  const p = tzDateParts(now)
  if (!p) {
    const d = new Date()
    d.setDate(d.getDate() - days)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const d = new Date(`${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}T00:00:00+01:00`)
  d.setDate(d.getDate() - days)
  return d
}

/**
 * Is an ISO date today (Africa/Algiers)?
 */
export function isToday(value) {
  if (!value) return false
  const now = new Date()
  const target = new Date(value)
  const np = tzDateParts(now)
  const tp = tzDateParts(target)
  if (!np || !tp) return false
  return np.year === tp.year && np.month === tp.month && np.day === tp.day
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
