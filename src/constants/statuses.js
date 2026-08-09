export const CUSTOMER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

export const REFRIGERATOR_STATUSES = {
  WORKING: 'working',
  NEEDS_MAINTENANCE: 'needs_maintenance',
  BROKEN: 'broken',
  REMOVED: 'removed',
}

export const REFRIGERATOR_CONDITIONS = {
  WORKING: 'working',
  NEEDS_MAINTENANCE: 'needs_maintenance',
  BROKEN: 'broken',
}

export const CLEANLINESS_LEVELS = {
  GOOD: 'good',
  MEDIUM: 'medium',
  BAD: 'bad',
}

// Marker colors for customers (priority broken > needs_maintenance > working)
export const MARKER_COLORS = {
  BROKEN: '#dc2626', // red
  NEEDS_MAINTENANCE: '#f97316', // orange
  WORKING: '#16a34a', // green
  NO_REFRIGERATOR: '#3b82f6', // blue
  INACTIVE: '#9ca3af', // gray
}

export const MARKER_PRIORITY = [
  'broken',
  'needs_maintenance',
  'working',
]
