import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatDateShort,
  formatRelativeDate,
  formatShortDay,
  formatWeekday,
  startOfToday,
  startOfDaysAgo,
  isToday,
  isTodayOrAfter,
} from '../utils/format'

describe('formatDate', () => {
  it('returns — for null/undefined', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
  })

  it('returns — for invalid date strings', () => {
    expect(formatDate('not-a-date')).toBe('—')
    expect(formatDate('xyz')).toBe('—')
  })

  it('formats a valid ISO date to dd/mm/yyyy', () => {
    expect(formatDate('2026-01-15')).toBe('15/01/2026')
    expect(formatDate('2026-12-01T10:30:00Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('pads day and month with leading zeros', () => {
    expect(formatDate('2026-03-05')).toBe('05/03/2026')
    expect(formatDate('2026-09-09')).toBe('09/09/2026')
  })
})

describe('formatDateTime', () => {
  it('returns — for null/invalid', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime('bad')).toBe('—')
  })

  it('returns dd/mm/yyyy HH:mm format', () => {
    const result = formatDateTime('2026-06-15T14:30:00Z')
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
  })
})

describe('formatTime', () => {
  it('returns — for null/invalid', () => {
    expect(formatTime(null)).toBe('—')
    expect(formatTime('nope')).toBe('—')
  })

  it('returns HH:mm format', () => {
    const result = formatTime('2026-06-15T09:05:00Z')
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })
})

describe('formatDateShort', () => {
  it('returns — for null/invalid', () => {
    expect(formatDateShort(null)).toBe('—')
    expect(formatDateShort('bad-date')).toBe('—')
  })

  it('returns a date string with day, month, and year', () => {
    const result = formatDateShort('2026-08-15')
    expect(result).toMatch(/^\d{1,2} \S+ \d{4}$/)
  })
})

describe('formatRelativeDate', () => {
  const t = (key) => {
    const map = { 'common.today': 'Today', 'visits.yesterday': 'Yesterday', 'common.previous': 'Previous', 'common.next': 'Next' }
    return map[key] || key
  }

  it('returns — for null/invalid', () => {
    expect(formatRelativeDate(null, t)).toBe('—')
    expect(formatRelativeDate('bad', t)).toBe('—')
  })

  it('returns Today for current date', () => {
    const today = new Date().toISOString()
    expect(formatRelativeDate(today, t)).toBe('Today')
  })

  it('returns Yesterday for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(formatRelativeDate(yesterday.toISOString(), t)).toBe('Yesterday')
  })

  it('returns relative days for 2-7 days ago', () => {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const result = formatRelativeDate(threeDaysAgo.toISOString(), t)
    expect(result).toContain('3')
  })

  it('returns formatted date for 8+ days ago', () => {
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
    const result = formatRelativeDate(tenDaysAgo.toISOString(), t)
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('returns Next for future dates', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(formatRelativeDate(tomorrow.toISOString(), t)).toBe('Next')
  })

  it('falls back to English without t function', () => {
    const today = new Date().toISOString()
    expect(formatRelativeDate(today)).toBe('Today')
  })
})

describe('formatShortDay', () => {
  it('returns — for null/invalid', () => {
    expect(formatShortDay(null)).toBe('—')
    expect(formatShortDay('bad')).toBe('—')
  })

  it('returns a short date string', () => {
    const result = formatShortDay('2026-07-04')
    expect(result).toMatch(/^\d{1,2} \S+$/)
  })
})

describe('formatWeekday', () => {
  it('returns — for null/invalid', () => {
    expect(formatWeekday(null)).toBe('—')
    expect(formatWeekday('xyz')).toBe('—')
  })

  it('returns a weekday string', () => {
    const result = formatWeekday('2026-07-06')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('startOfToday', () => {
  it('returns a Date at midnight', () => {
    const result = startOfToday()
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Algiers',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(result)
    const hour = Number(parts.find((p) => p.type === 'hour')?.value)
    expect(hour).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
  })

  it('returns today date components', () => {
    const result = startOfToday()
    const now = new Date()
    const fmt = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
    expect(fmt(result)).toBe(fmt(now))
  })
})

describe('startOfDaysAgo', () => {
  it('returns midnight of N days ago', () => {
    const result = startOfDaysAgo(3)
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Algiers',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(result)
    const hour = Number(parts.find((p) => p.type === 'hour')?.value)
    expect(hour).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
  })

  it('for 0 returns today at midnight', () => {
    const today = startOfToday()
    const result = startOfDaysAgo(0)
    expect(result.toDateString()).toBe(today.toDateString())
  })

  it('for 1 returns yesterday at midnight', () => {
    const result = startOfDaysAgo(1)
    const today = startOfDaysAgo(0)
    const expected = new Date(today)
    expected.setDate(expected.getDate() - 1)
    expect(result.toDateString()).toBe(expected.toDateString())
  })
})

describe('isToday', () => {
  it('returns false for null/undefined', () => {
    expect(isToday(null)).toBe(false)
    expect(isToday(undefined)).toBe(false)
    expect(isToday('')).toBe(false)
  })

  it('returns true for today', () => {
    expect(isToday(new Date().toISOString())).toBe(true)
  })

  it('returns false for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isToday(yesterday.toISOString())).toBe(false)
  })

  it('returns false for invalid date', () => {
    expect(isToday('not-a-date')).toBe(false)
  })
})

describe('isTodayOrAfter', () => {
  it('returns false for null', () => {
    expect(isTodayOrAfter(null)).toBe(false)
  })

  it('returns true for today', () => {
    expect(isTodayOrAfter(new Date().toISOString())).toBe(true)
  })

  it('returns true for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isTodayOrAfter(tomorrow.toISOString())).toBe(true)
  })

  it('returns false for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isTodayOrAfter(yesterday.toISOString())).toBe(false)
  })
})
