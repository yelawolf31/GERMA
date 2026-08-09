export default function Checkbox({ label, checked, onChange, disabled = false }) {
  return (
    <label className={`flex items-center gap-2.5 py-1 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}
