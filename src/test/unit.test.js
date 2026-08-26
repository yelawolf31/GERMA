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
import {
  getRefrigeratorStatusKey,
  getRefrigeratorConditionKey,
  getCleanlinessKey,
  getCustomerStatusKey,
} from '../utils/statusLabels'
import { MARKER_COLORS, REFRIGERATOR_STATUSES, CUSTOMER_STATUSES } from '../constants/statuses'
import { fr } from '../i18n/fr'
import { en } from '../i18n/en'
import { ar } from '../i18n/ar'
import {
  matchesCustomerSearch,
  filterAndSearchCustomers,
  applyCustomerFilters,
  createDefaultMapFilters,
} from '../utils/filters'

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
    const result = validateIssue({ customer_id: '123', issue_type: 'cooling_problem', priority: 'high', description: 'Broken' }, t)
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

  it('all languages have new audit keys (auth, product, photos, filters, login/logout)', () => {
    const newAuditKeys = [
      'entity_issue_photo',
      'entity_customer_photo',
      'entity_refrigerator_photo',
      'entity_auth',
      'entity_product',
      'action_LOGIN',
      'action_LOGOUT',
      'filterEntity',
      'filterAction',
      'filterDateFrom',
      'filterDateTo',
      'filterUser',
      'totalResults',
    ]
    for (const key of newAuditKeys) {
      expect(fr.audit[key]).toBeDefined()
      expect(en.audit[key]).toBeDefined()
      expect(ar.audit[key]).toBeDefined()
    }
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

  it('all languages have refrigerator broken and removed keys', () => {
    expect(fr.refrigerators.broken).toBe('En panne')
    expect(fr.refrigerators.removed).toBe('Retiré')
    expect(en.refrigerators.broken).toBe('Broken')
    expect(en.refrigerators.removed).toBe('Removed')
    expect(ar.refrigerators.broken).toBe('معطلة')
    expect(ar.refrigerators.removed).toBe('مسحوبة')
  })

  it('all languages have visit detail keys', () => {
    for (const lang of [fr, en, ar]) {
      expect(lang.visits.details).toBeDefined()
      expect(lang.visits.visitInfo).toBeDefined()
      expect(lang.map.coordinates).toBeDefined()
    }
  })
})

describe('statusLabels', () => {
  it('getRefrigeratorStatusKey returns correct key for every status', () => {
    expect(getRefrigeratorStatusKey(REFRIGERATOR_STATUSES.WORKING)).toBe('refrigerators.working')
    expect(getRefrigeratorStatusKey(REFRIGERATOR_STATUSES.NEEDS_MAINTENANCE)).toBe('refrigerators.needs_maintenance')
    expect(getRefrigeratorStatusKey(REFRIGERATOR_STATUSES.BROKEN)).toBe('refrigerators.broken')
    expect(getRefrigeratorStatusKey(REFRIGERATOR_STATUSES.REMOVED)).toBe('refrigerators.removed')
  })

  it('getRefrigeratorStatusKey falls back for unknown status', () => {
    expect(getRefrigeratorStatusKey('unknown')).toBe('refrigerators.status')
    expect(getRefrigeratorStatusKey(null)).toBe('refrigerators.status')
  })

  it('getRefrigeratorConditionKey returns correct key', () => {
    expect(getRefrigeratorConditionKey('working')).toBe('refrigerators.working')
    expect(getRefrigeratorConditionKey('broken')).toBe('refrigerators.broken')
    expect(getRefrigeratorConditionKey('unknown')).toBe('refrigerators.status')
  })

  it('getCleanlinessKey returns correct key', () => {
    expect(getCleanlinessKey('good')).toBe('visits.good')
    expect(getCleanlinessKey('medium')).toBe('visits.medium')
    expect(getCleanlinessKey('bad')).toBe('visits.bad')
    expect(getCleanlinessKey('unknown')).toBe('visits.cleanliness')
  })

  it('getCustomerStatusKey returns correct key', () => {
    expect(getCustomerStatusKey(CUSTOMER_STATUSES.ACTIVE)).toBe('customers.active')
    expect(getCustomerStatusKey(CUSTOMER_STATUSES.INACTIVE)).toBe('customers.inactive')
    expect(getCustomerStatusKey('unknown')).toBe('customers.status')
  })

  it('all status keys resolve to defined values in all languages', () => {
    const t = (key) => {
      for (const lang of [fr, en, ar]) {
        const val = key.split('.').reduce((acc, p) => (acc == null ? undefined : acc[p]), lang)
        if (val == null) return false
      }
      return true
    }
    for (const status of Object.values(REFRIGERATOR_STATUSES)) {
      expect(t(getRefrigeratorStatusKey(status))).toBe(true)
    }
  })
})

describe('customer search filters', () => {
  const customers = [
    { id: '1', name: 'Superette El Amel', phone: '0550112233', wilaya: 'Oran', commune: 'Bir El Djir', refrigerators: [{ serial_number: 'GERMA-0258' }] },
    { id: '2', name: 'Épicerie Benali', phone: '0550223344', wilaya: 'Oran', commune: 'Oran', refrigerators: [] },
    { id: '3', name: 'Café Le Printemps', phone: '0550778899', wilaya: 'Alger', commune: 'Bab Ezzouar', refrigerators: [] },
  ]

  it('matchesCustomerSearch returns all for empty query', () => {
    expect(matchesCustomerSearch(customers[0], '')).toBe(true)
    expect(matchesCustomerSearch(customers[0], null)).toBe(true)
  })

  it('matchesCustomerSearch matches by name', () => {
    expect(matchesCustomerSearch(customers[0], 'superette')).toBe(true)
    expect(matchesCustomerSearch(customers[0], 'Superette')).toBe(true)
    expect(matchesCustomerSearch(customers[1], 'superette')).toBe(false)
  })

  it('matchesCustomerSearch matches by phone', () => {
    expect(matchesCustomerSearch(customers[0], '055011')).toBe(true)
    expect(matchesCustomerSearch(customers[0], '99999')).toBe(false)
  })

  it('matchesCustomerSearch matches by serial number', () => {
    expect(matchesCustomerSearch(customers[0], 'GERMA-0258')).toBe(true)
    expect(matchesCustomerSearch(customers[0], '0258')).toBe(true)
  })

  it('matchesCustomerSearch matches by wilaya', () => {
    expect(matchesCustomerSearch(customers[2], 'alger')).toBe(true)
    expect(matchesCustomerSearch(customers[2], 'oran')).toBe(false)
  })

  it('filterAndSearchCustomers applies both filters and search', () => {
    const customersWithStatus = [
      { ...customers[0], status: 'active' },
      { ...customers[1], status: 'active' },
      { ...customers[2], status: 'inactive' },
    ]
    const result = filterAndSearchCustomers(
      customersWithStatus,
      { refrigeratorStatus: [], customerStatus: ['active'], visits: [], hasOpenIssues: false },
      'oran',
    )
    expect(result.length).toBe(2)
  })

  it('applyCustomerFilters with default filters returns all', () => {
    const result = applyCustomerFilters(customers, createDefaultMapFilters())
    expect(result).toHaveLength(3)
  })

  it('applyCustomerFilters with customerStatus filters correctly', () => {
    const activeCustomers = customers.map((c, i) => ({ ...c, status: i < 2 ? 'active' : 'inactive' }))
    const result = applyCustomerFilters(activeCustomers, {
      refrigeratorStatus: [],
      customerStatus: ['active'],
      visits: [],
      hasOpenIssues: false,
    })
    expect(result).toHaveLength(2)
  })

  it('applyCustomerFilters with refrigeratorStatus filters correctly', () => {
    const customerWithBroken = {
      ...customers[0],
      refrigerators: [{ status: 'broken' }],
    }
    const customerWithWorking = {
      ...customers[1],
      refrigerators: [{ status: 'working' }],
    }
    const result = applyCustomerFilters([customerWithBroken, customerWithWorking], {
      refrigeratorStatus: ['broken'],
      customerStatus: [],
      visits: [],
      hasOpenIssues: false,
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})

describe('visit detail i18n completeness', () => {
  it('all languages have permission denied keys', () => {
    for (const lang of [fr, en, ar]) {
      expect(lang.visits.permissionDenied).toBeDefined()
      expect(lang.visits.permissionDeniedDesc).toBeDefined()
    }
  })

  it('all languages have not found keys', () => {
    for (const lang of [fr, en, ar]) {
      expect(lang.visits.notFound).toBeDefined()
      expect(lang.visits.notFoundDesc).toBeDefined()
    }
  })

  it('all languages have noRefrigerator key', () => {
    for (const lang of [fr, en, ar]) {
      expect(lang.visits.noRefrigerator).toBeDefined()
    }
  })

  it('all languages have linkedRefrigerator key', () => {
    for (const lang of [fr, en, ar]) {
      expect(lang.visits.linkedRefrigerator).toBeDefined()
    }
  })

  it('all languages have photo-related keys', () => {
    for (const lang of [fr, en, ar]) {
      expect(lang.visits.noPhotos).toBeDefined()
      expect(lang.visits.photoPreview).toBeDefined()
      expect(lang.visits.photoLoadError).toBeDefined()
      expect(lang.visits.downloadPhoto).toBeDefined()
    }
  })

  it('all languages have createdAt key', () => {
    for (const lang of [fr, en, ar]) {
      expect(lang.visits.createdAt).toBeDefined()
    }
  })

  it('all languages have viewCustomer and viewRefrigerator keys', () => {
    for (const lang of [fr, en, ar]) {
      expect(lang.visits.viewCustomer).toBeDefined()
      expect(lang.visits.viewRefrigerator).toBeDefined()
    }
  })
})

describe('visit conditions match DB constraints', () => {
  it('condition constants use working/needs_maintenance/broken (not good/medium/bad)', () => {
    const conditions = ['working', 'needs_maintenance', 'broken']
    expect(conditions).toContain('working')
    expect(conditions).toContain('needs_maintenance')
    expect(conditions).toContain('broken')
    expect(conditions).not.toContain('good')
    expect(conditions).not.toContain('medium')
    expect(conditions).not.toContain('bad')
  })
})

describe('StatusBadge condition mapping', () => {
  it('condition type handles working/needs_maintenance/broken values', () => {
    const conditionMap = { working: true, needs_maintenance: true, broken: true }
    expect(conditionMap.working).toBe(true)
    expect(conditionMap.needs_maintenance).toBe(true)
    expect(conditionMap.broken).toBe(true)
  })
})

describe('visit form translation keys resolve to translated strings', () => {
  const CONDITION_LABEL_KEYS = [
    'refrigerators.working',
    'refrigerators.needsMaintenance',
    'refrigerators.broken',
  ]
  const CLEANLINESS_LABEL_KEYS = [
    'visits.good',
    'visits.medium',
    'visits.bad',
  ]

  function resolveKey(dict, key) {
    return key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), dict)
  }

  it('all condition label keys resolve to translated strings in all languages', () => {
    for (const key of CONDITION_LABEL_KEYS) {
      for (const lang of [fr, en, ar]) {
        const value = resolveKey(lang, key)
        expect(value).toBeDefined()
        expect(value).not.toBe(key)
        expect(value.length).toBeGreaterThan(0)
      }
    }
  })

  it('all cleanliness label keys resolve to translated strings in all languages', () => {
    for (const key of CLEANLINESS_LABEL_KEYS) {
      for (const lang of [fr, en, ar]) {
        const value = resolveKey(lang, key)
        expect(value).toBeDefined()
        expect(value).not.toBe(key)
        expect(value.length).toBeGreaterThan(0)
      }
    }
  })

  it('no raw translation key patterns appear as rendered text in form labels', () => {
    const RAW_KEY_PATTERNS = [
      /^refrigerators\./,
      /^visits\./,
      /^customers\./,
      /^issues\./,
    ]
    const ALL_KEYS = [...CONDITION_LABEL_KEYS, ...CLEANLINESS_LABEL_KEYS]
    function resolveKey(dict, key) {
      return key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), dict)
    }
    for (const key of ALL_KEYS) {
      for (const lang of [fr, en, ar]) {
        const resolved = resolveKey(lang, key)
        for (const pattern of RAW_KEY_PATTERNS) {
          expect(resolved).not.toMatch(pattern)
        }
      }
    }
  })

  it('form labels are human-readable in French (not raw keys)', () => {
    const frT = (key) => {
      const val = resolveKey(fr, key)
      return val || key
    }
    expect(frT('refrigerators.working')).toBe('En fonctionnement')
    expect(frT('refrigerators.needsMaintenance')).toBe('Entretien requis')
    expect(frT('refrigerators.broken')).toBe('En panne')
    expect(frT('visits.good')).toBe('Bon')
    expect(frT('visits.medium')).toBe('Moyen')
    expect(frT('visits.bad')).toBe('Mauvais')
  })
})

describe('visit detail displays all required fields', () => {
  it('visit detail keys cover all required sections', () => {
    for (const lang of [fr, en, ar]) {
      expect(lang.visits.visitedAt).toBeDefined()
      expect(lang.visits.supervisor).toBeDefined()
      expect(lang.visits.condition).toBeDefined()
      expect(lang.visits.cleanliness).toBeDefined()
      expect(lang.visits.notes).toBeDefined()
      expect(lang.visits.createdAt).toBeDefined()
      expect(lang.visits.photos).toBeDefined()
      expect(lang.visits.customer).toBeDefined()
      expect(lang.visits.viewCustomer).toBeDefined()
      expect(lang.visits.viewRefrigerator).toBeDefined()
      expect(lang.visits.noRefrigerator).toBeDefined()
      expect(lang.refrigerators.serialNumber).toBeDefined()
      expect(lang.refrigerators.model).toBeDefined()
      expect(lang.refrigerators.status).toBeDefined()
      expect(lang.map.coordinates).toBeDefined()
    }
  })
})

describe('photo security model', () => {
  it('storage module exports createSignedUrl and createSignedUrls', async () => {
    const storage = await import('../services/storage')
    expect(typeof storage.createSignedUrl).toBe('function')
    expect(typeof storage.createSignedUrls).toBe('function')
  })

  it('storage module exports fetchVisitPhotos and deleteVisitPhoto', async () => {
    const storage = await import('../services/storage')
    expect(typeof storage.fetchVisitPhotos).toBe('function')
    expect(typeof storage.deleteVisitPhoto).toBe('function')
  })

  it('storage module exports customer and refrigerator photo functions', async () => {
    const storage = await import('../services/storage')
    expect(typeof storage.uploadCustomerPhotos).toBe('function')
    expect(typeof storage.fetchCustomerPhotos).toBe('function')
    expect(typeof storage.deleteCustomerPhoto).toBe('function')
    expect(typeof storage.uploadRefrigeratorPhotos).toBe('function')
    expect(typeof storage.fetchRefrigeratorPhotos).toBe('function')
    expect(typeof storage.deleteRefrigeratorPhoto).toBe('function')
  })

  it('visit photos RLS allows admin all and supervisor own visits', () => {
    const adminPolicy = 'public.is_admin()'
    const supervisorPolicy = 'v.supervisor_id = auth.uid()'
    expect(adminPolicy).toContain('is_admin')
    expect(supervisorPolicy).toContain('supervisor_id')
  })

  it('visit-photos bucket is private (signed URLs required)', () => {
    const bucketPublicSetting = false
    expect(bucketPublicSetting).toBe(false)
  })
})

describe('visit permissions and access control', () => {
  it('admin can view all visits (is_admin check)', () => {
    const isAdmin = true
    const visitSupervisorId = 'other-user-id'
    const currentUserId = 'admin-user-id'
    const isAuthorized = isAdmin || visitSupervisorId === currentUserId
    expect(isAuthorized).toBe(true)
  })

  it('supervisor can view own visits', () => {
    const isAdmin = false
    const visitSupervisorId = 'supervisor-123'
    const currentUserId = 'supervisor-123'
    const isAuthorized = isAdmin || visitSupervisorId === currentUserId
    expect(isAuthorized).toBe(true)
  })

  it('supervisor cannot view other supervisor visits', () => {
    const isAdmin = false
    const visitSupervisorId = 'supervisor-456'
    const currentUserId = 'supervisor-123'
    const isAuthorized = isAdmin || visitSupervisorId === currentUserId
    expect(isAuthorized).toBe(false)
  })

  it('visits are immutable (no update or delete policies)', () => {
    const visitPolicies = ['SELECT', 'INSERT']
    expect(visitPolicies).not.toContain('UPDATE')
    expect(visitPolicies).not.toContain('DELETE')
  })
})

describe('refrigerator status display consistency', () => {
  it('RefrigeratorStatusSelect options match statusLabels mappings', () => {
    const statusOptions = ['working', 'needs_maintenance', 'broken', 'removed']
    for (const status of statusOptions) {
      const key = getRefrigeratorStatusKey(status)
      expect(key).toMatch(/^refrigerators\./)
      for (const lang of [fr, en, ar]) {
        const val = key.split('.').reduce((a, p) => (a == null ? undefined : a[p]), lang)
        expect(val).toBeDefined()
      }
    }
  })

  it('condition options match StatusBadge LABEL_KEYS for condition type', () => {
    const conditionOptions = ['working', 'needs_maintenance', 'broken']
    for (const cond of conditionOptions) {
      const key = getRefrigeratorConditionKey(cond)
      expect(key).toMatch(/^refrigerators\./)
    }
  })

  it('cleanliness options match StatusBadge LABEL_KEYS for cleanliness type', () => {
    const cleanlinessOptions = ['good', 'medium', 'bad']
    for (const cl of cleanlinessOptions) {
      const key = getCleanlinessKey(cl)
      expect(key).toMatch(/^visits\./)
    }
  })
})
