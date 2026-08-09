import { AlertCircle } from 'lucide-react'

export function Field({ label, required = false, error, hint, children, htmlFor }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

const BASE_INPUT =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:bg-slate-100'

export function Input({ error, className = '', ...props }) {
  return <input className={`${BASE_INPUT} ${error ? 'border-red-400' : ''} ${className}`} {...props} />
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select className={`${BASE_INPUT} appearance-none ${error ? 'border-red-400' : ''} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ error, className = '', ...props }) {
  return <textarea className={`${BASE_INPUT} resize-y ${error ? 'border-red-400' : ''} ${className}`} {...props} />
}
