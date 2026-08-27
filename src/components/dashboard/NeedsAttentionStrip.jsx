import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

const TONES = {
  red: {
    chip: 'bg-red-50 text-red-700 ring-red-200 hover:bg-red-100',
    badge: 'bg-red-100 text-red-700',
  },
  amber: {
    chip: 'bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100',
    badge: 'bg-amber-100 text-amber-800',
  },
}

/** Highlighted strip summarizing what needs attention.
 * @param {Array<{key: string, icon: Component, label: string, count: number, to: string, tone: 'red'|'amber'}>} items
 */
export default function NeedsAttentionStrip({ title, clearLabel, items }) {
  const visible = items.filter((item) => item.count > 0)

  if (visible.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {clearLabel}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {visible.map((item) => {
          const Icon = item.icon
          const tone = TONES[item.tone] || TONES.amber
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors ${tone.chip}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
              <span className={`rounded-full px-1.5 text-xs font-bold ${tone.badge}`}>{item.count}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}