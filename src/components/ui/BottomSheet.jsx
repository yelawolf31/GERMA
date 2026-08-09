import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Mobile bottom sheet. On desktop it behaves like a side panel.
 */
export default function BottomSheet({ open, onClose, title, children, maxHeight = '80vh' }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="safe-bottom absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:bottom-auto sm:left-4 sm:right-auto sm:top-16 sm:w-96 sm:rounded-2xl"
        style={{ maxHeight }}
      >
        <div className="flex items-center justify-between px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-6">{children}</div>
      </div>
    </div>
  )
}
