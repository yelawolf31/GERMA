export default function Spinner({ className = 'h-8 w-8', label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div
        className={`${className} animate-spin rounded-full border-4 border-slate-200 border-t-brand-700`}
        role="status"
        aria-label={label || 'Chargement'}
      />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  )
}
