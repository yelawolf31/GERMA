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
} from '../utils/validators'
import { haversineKm, formatDistance, sortCustomersByDistance } from '../utils/geo'
import { MARKER_COLORS } from '../constants/statuses'

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
})
