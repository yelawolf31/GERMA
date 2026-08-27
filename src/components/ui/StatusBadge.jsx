import Badge from './Badge'
import { useTranslation } from '../../i18n'
import { getRefrigeratorStatusKey, getRefrigeratorConditionKey, getCleanlinessKey, getCustomerStatusKey } from '../../utils/statusLabels'

const STATUS_META = {
  // Customer
  active: { tone: 'green' },
  inactive: { tone: 'gray' },
  // Refrigerator
  working: { tone: 'green' },
  needs_maintenance: { tone: 'orange' },
  broken: { tone: 'red' },
  removed: { tone: 'gray' },
  // Cleanliness
  good: { tone: 'green' },
  medium: { tone: 'yellow' },
  bad: { tone: 'red' },
  // Issue status
  open: { tone: 'red' },
  in_progress: { tone: 'orange' },
  resolved: { tone: 'green' },
  // Priority
  low: { tone: 'blue' },
  high: { tone: 'orange' },
  critical: { tone: 'red' },
}

// Warning values overlap with other statuses (active = customer), so tone is type-specific.
const WARNING_TONES = { active: 'orange', dismissed: 'gray' }

const LABEL_KEYS = {
  customer: (value) => getCustomerStatusKey(value),
  refrigerator: (value) => getRefrigeratorStatusKey(value),
  condition: (value) => getRefrigeratorConditionKey(value),
  cleanliness: (value) => getCleanlinessKey(value),
  issueStatus: (value) => `issues.${value}`,
  priority: (value) => `issues.${value}`,
  warning: (value) => `warnings.${value}`,
}

/**
 * Status badge with translated label and color tone.
 * @param {'customer'|'refrigerator'|'condition'|'cleanliness'|'issueStatus'|'priority'|'warning'} type
 * @param {string} value
 */
export default function StatusBadge({ type, value, className = '' }) {
  const { t } = useTranslation()
  if (!value) return null
  const tone = (type === 'warning' && WARNING_TONES[value]) || STATUS_META[value]?.tone || 'gray'
  const key = LABEL_KEYS[type]?.(value)
  return (
    <Badge tone={tone} className={className}>
      {key ? t(key) : value}
    </Badge>
  )
}
