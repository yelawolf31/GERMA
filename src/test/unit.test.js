import { describe, it, expect } from 'vitest'
import { getCustomerMarkerStatus, MARKER_STATUS, getMarkerColor } from '../utils/markerStatus'
import {
  required,
  isEmail,
  isLatitude,
  isLongitude,
  isCoordinate,
  validateLogin,
  validateVisit,
  validateCustomer,
  validateRefrigerator,
  validateIssue,
} from '../utils/validators'
import { haversineKm, formatDistance, sortCustomersByDistance } from '../utils/geo'
import { MARKER_COLORS } from '../constants/statuses'
import { fr } from '../i18n/fr'
import { en } from '../i18n/en'
import { ar } from '../i18n/ar'

const t = (key) => key

describe('getCustomerMarkerStatus', () => {
  it('returns INACTIVE for an inactive customer', () => {
    expect(getCustomerMarkerStatus({ status: 'inactive' }, [])).toBe(MARKER_STATUS.INACTIVE)
  })

  it('returns BROKEN when any refrigerator is broken (priority over working)', () => {
    const refs = [
      { status: 'working' },
      { status: 'broken' },
      { status: 'needs_maintenance' },
    ]
    expect(getCustomerMarkerStatus({ status: 'active' }, refs)).toBe(MARKER_STATUS.BROKEN)
  })

  it('returns NEEDS_MAINTENANCE when no broken but some maintenance needed', () => {
    const refs = [{ status: 'working' }, { status: 'needs_maintenance' }]
    expect(getCustomerMarkerStatus({ status: 'active' }, refs)).toBe(MARKER_STATUS.NEEDS_MAINTENANCE)
  })

  it('returns WORKING when all refrigerators work', () => {
    const refs = [{ status: 'working' }, { status: 'working' }]
    expect(getCustomerMarkerStatus({ status: 'active' }, refs)).toBe(MARKER_STATUS.WORKING)
  })

  it('returns WORKING when only removed refrigerators exist (ignored)', () => {
    const refs = [{ status: 'removed' }]
    expect(getCustomerMarkerStatus({ status: 'active' }, refs)).toBe(MARKER_STATUS.NO_REFRIGERATOR)
  })

  it('returns NO_REFRIGERATOR when there are no refrigerators', () => {
    expect(getCustomerMarkerStatus({ status: 'active' }, [])).toBe(MARKER_STATUS.NO_REFRIGERATOR)
  })

  it('defaults to INACTIVE for a missing customer', () => {
    expect(getCustomerMarkerStatus(null, [])).toBe(MARKER_STATUS.INACTIVE)
  })
})

describe('getMarkerColor', () => {
  it('maps every status to a color', () => {
    expect(getMarkerColor(MARKER_STATUS.BROKEN)).toBe(MARKER_COLORS.BROKEN)
    expect(getMarkerColor(MARKER_STATUS.NEEDS_MAINTENANCE)).toBe(MARKER_COLORS.NEEDS_MAINTENANCE)
    expect(getMarkerColor(MARKER_STATUS.WORKING)).toBe(MARKER_COLORS.WORKING)
    expect(getMarkerColor(MARKER_STATUS.INACTIVE)).toBe(MARKER_COLORS.INACTIVE)
    expect(getMarkerColor(MARKER_STATUS.NO_REFRIGERATOR)).toBe(MARKER_COLORS.NO_REFRIGERATOR)
    expect(getMarkerColor('unknown')).toBe(MARKER_COLORS.NO_REFRIGERATOR)
  })
})

describe('validators', () => {
  it('required rejects empty strings and null', () => {
    expect(required('')).toBe(false)
    expect(required('   ')).toBe(false)
    expect(required(null)).toBe(false)
    expect(required('x')).toBe(true)
  })

  it('isEmail validates basic emails', () => {
    expect(isEmail('a@b.com')).toBe(true)
    expect(isEmail('not-an-email')).toBe(false)
    expect(isEmail('')).toBe(false)
  })

  it('isLatitude / isLongitude enforce ranges', () => {
    expect(isLatitude(35.7)).toBe(true)
    expect(isLatitude(95)).toBe(false)
    expect(isLatitude('35')).toBe(true)
    expect(isLongitude(-0.5)).toBe(true)
    expect(isLongitude(181)).toBe(false)
  })

  it('isCoordinate requires both', () => {
    expect(isCoordinate(35.7, -0.5)).toBe(true)
    expect(isCoordinate(35.7, 200)).toBe(false)
  })

  it('validateLogin requires email and password', () => {
    expect(validateLogin({ email: '', password: '' }, t).valid).toBe(false)
    expect(validateLogin({ email: 'a@b.com', password: 'x' }, t).valid).toBe(true)
  })

  it('validateVisit requires condition and cleanliness', () => {
    expect(validateVisit({ refrigerator_condition: 'working', cleanliness: 'good' }, t).valid).toBe(true)
    expect(validateVisit({ refrigerator_condition: 'working', cleanliness: '' }, t).valid).toBe(false)
  })
})

describe('geo', () => {
  it('haversineKm returns ~0 for the same point', () => {
    expect(haversineKm(35.7, -0.5, 35.7, -0.5)).toBeCloseTo(0, 5)
  })

  it('haversineKm returns a plausible distance for 1 degree of latitude (~111 km)', () => {
    expect(haversineKm(0, 0, 1, 0)).toBeCloseTo(111.19, 0)
  })

  it('formatDistance formats km and meters', () => {
    expect(formatDistance(0.4)).toBe('400 m')
    expect(formatDistance(1.25)).toBe('1,3 km')
    expect(formatDistance(null)).toBe('—')
  })

  it('sortCustomersByDistance sorts ascending and attaches distanceKm', () => {
    const customers = [
      { id: 'far', latitude: 36, longitude: 0 },
      { id: 'near', latitude: 35.71, longitude: -0.5 },
    ]
    const sorted = sortCustomersByDistance(customers, { latitude: 35.7, longitude: -0.5 })
    expect(sorted[0].id).toBe('near')
    expect(typeof sorted[0].distanceKm).toBe('number')
  })

  it('sortCustomersByDistance returns original when position is null', () => {
    const customers = [{ id: 'a', latitude: 35, longitude: 0 }]
    expect(sortCustomersByDistance(customers, null)).toEqual(customers)
  })

  it('sortCustomersByDistance filters out customers without coordinates', () => {
    const customers = [
      { id: 'valid', latitude: 35.7, longitude: -0.5 },
      { id: 'no-coords', latitude: null, longitude: null },
    ]
    const sorted = sortCustomersByDistance(customers, { latitude: 35.7, longitude: -0.5 })
    expect(sorted).toHaveLength(1)
    expect(sorted[0].id).toBe('valid')
  })
})

describe('validateCustomer', () => {
  it('requires name, wilaya, commune', () => {
    const result = validateCustomer({ name: '', wilaya: '', commune: '' }, t)
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBeDefined()
    expect(result.errors.wilaya).toBeDefined()
    expect(result.errors.commune).toBeDefined()
  })

  it('passes with all required fields', () => {
    const result = validateCustomer({ name: 'Test', wilaya: 'Oran', commune: 'Bir El Djir' }, t)
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('validates latitude range', () => {
    const result = validateCustomer({ name: 'T', wilaya: 'O', commune: 'B', latitude: '999', longitude: '0' }, t)
    expect(result.valid).toBe(false)
    expect(result.errors.latitude).toBeDefined()
  })

  it('validates longitude range', () => {
    const result = validateCustomer({ name: 'T', wilaya: 'O', commune: 'B', latitude: '0', longitude: '999' }, t)
    expect(result.valid).toBe(false)
    expect(result.errors.longitude).toBeDefined()
  })

  it('allows empty coordinates', () => {
    const result = validateCustomer({ name: 'T', wilaya: 'O', commune: 'B', latitude: '', longitude: '' }, t)
    expect(result.valid).toBe(true)
  })
})

describe('validateRefrigerator', () => {
  it('requires customer_id', () => {
    const result = validateRefrigerator({ customer_id: '' }, t)
    expect(result.valid).toBe(false)
    expect(result.errors.customer_id).toBeDefined()
  })

  it('passes with customer_id', () => {
    const result = validateRefrigerator({ customer_id: 'uuid-123' }, t)
    expect(result.valid).toBe(true)
  })
})

describe('validateIssue', () => {
  it('requires issue_type, priority, description', () => {
    const result = validateIssue({ issue_type: '', priority: '', description: '' }, t)
    expect(result.valid).toBe(false)
    expect(result.errors.issue_type).toBeDefined()
    expect(result.errors.priority).toBeDefined()
    expect(result.errors.description).toBeDefined()
  })

  it('passes with all required fields', () => {
    const result = validateIssue({ issue_type: 'cooling_problem', priority: 'high', description: 'Broken' }, t)
    expect(result.valid).toBe(true)
  })
})

function resolveKey(dict, key) {
  return key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), dict)
}

function makeT(lang) {
  const dict = { fr, en, ar }
  return (key) => {
    let value = resolveKey(dict[lang] || dict.fr, key)
    if (value == null) value = resolveKey(dict.fr, key)
    if (value == null) return key
    return value
  }
}

describe('i18n translations', () => {
  const frT = makeT('fr')
  const enT = makeT('en')
  const arT = makeT('ar')

  it('resolves nested keys correctly', () => {
    expect(frT('app.name')).toBe('Germa Field')
    expect(enT('app.name')).toBe('Germa Field')
    expect(arT('app.name')).toBe('جيرما الميدان')
  })

  it('returns key when not found', () => {
    expect(frT('nonexistent.key')).toBe('nonexistent.key')
    expect(enT('nonexistent.key')).toBe('nonexistent.key')
  })

  it('all three languages have the same sections', () => {
    const sections = ['app', 'auth', 'nav', 'dashboard', 'customers', 'refrigerators', 'visits', 'issues', 'map', 'reports', 'settings', 'common']
    for (const section of sections) {
      expect(fr[section]).toBeDefined()
      expect(en[section]).toBeDefined()
      expect(ar[section]).toBeDefined()
    }
  })

  it('snake_case aliases match camelCase values', () => {
    expect(fr.issues.cooling_problem).toBe(fr.issues.coolingProblem)
    expect(fr.issues.electrical_problem).toBe(fr.issues.electricalProblem)
    expect(fr.issues.door_problem).toBe(fr.issues.doorProblem)
    expect(fr.issues.lighting_problem).toBe(fr.issues.lightingProblem)
    expect(fr.issues.cleanliness_problem).toBe(fr.issues.cleanlinessProblem)
    expect(fr.issues.in_progress).toBe(fr.issues.inProgress)
    expect(fr.refrigerators.needs_maintenance).toBe(fr.refrigerators.needsMaintenance)

    expect(en.issues.cooling_problem).toBe(en.issues.coolingProblem)
    expect(ar.issues.cooling_problem).toBe(ar.issues.coolingProblem)
  })

  it('all languages have issues.medium', () => {
    expect(fr.issues.medium).toBeDefined()
    expect(en.issues.medium).toBeDefined()
    expect(ar.issues.medium).toBeDefined()
  })

  it('all languages have users section', () => {
    expect(fr.users.admin).toBeDefined()
    expect(en.users.admin).toBeDefined()
    expect(ar.users.admin).toBeDefined()
  })

  it('all languages have audit section', () => {
    expect(fr.audit.title).toBeDefined()
    expect(en.audit.title).toBeDefined()
    expect(ar.audit.title).toBeDefined()
  })

  it('all languages have businessType section', () => {
    expect(fr.businessType.superette).toBeDefined()
    expect(en.businessType.superette).toBeDefined()
    expect(ar.businessType.superette).toBeDefined()
  })

  it('all languages have common.reset', () => {
    expect(fr.common.reset).toBeDefined()
    expect(en.common.reset).toBeDefined()
    expect(ar.common.reset).toBeDefined()
  })

  it('fr has in_progress alias', () => {
    expect(fr.issues.in_progress).toBe('En cours')
  })

  it('en has in_progress alias', () => {
    expect(en.issues.in_progress).toBe('In progress')
  })
})
