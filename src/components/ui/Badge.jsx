const TONES = {
  gray: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  blue: 'bg-sky-100 text-sky-700',
  teal: 'bg-teal-100 text-teal-700',
  yellow: 'bg-amber-100 text-amber-800',
  purple: 'bg-purple-100 text-purple-700',
}

export default function Badge({ tone = 'gray', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
