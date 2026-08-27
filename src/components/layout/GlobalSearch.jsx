import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Store, Refrigerator, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useDebounce } from '../../hooks/useDebounce'
import { searchCustomers } from '../../services/customers'
import { searchRefrigerators } from '../../services/refrigerators'

export default function GlobalSearch({ className = '' }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [refrigerators, setRefrigerators] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  const debouncedQuery = useDebounce(query, 300)
  const hasQuery = debouncedQuery.trim().length >= 2

  useEffect(() => {
    let cancelled = false
    if (!hasQuery) {
      setCustomers([])
      setRefrigerators([])
      setLoading(false)
      return
    }
    setLoading(true)
    const run = async () => {
      try {
        const [customerResults, refrigeratorResults] = await Promise.all([
          searchCustomers(debouncedQuery),
          searchRefrigerators(debouncedQuery),
        ])
        if (cancelled) return
        setCustomers(customerResults)
        setRefrigerators(refrigeratorResults)
      } catch {
        if (!cancelled) {
          setCustomers([])
          setRefrigerators([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, hasQuery])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const go = (path) => {
    setOpen(false)
    setQuery('')
    navigate(path)
  }

  const clear = () => {
    setQuery('')
    setOpen(false)
  }

  const resultCount = customers.length + refrigerators.length

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t('search.placeholder')}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            aria-label={t('common.close')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && hasQuery && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-4 py-3 text-sm text-slate-500">{t('common.loading')}</p>
          ) : resultCount === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">{t('search.noResults')}</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {customers.length > 0 && (
                <div>
                  <p className="bg-slate-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('search.customers')}
                  </p>
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onMouseDown={() => go(`/customers/${customer.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50/60"
                    >
                      <Store className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{customer.name}</span>
                        <span className="block truncate text-xs text-slate-500" dir="ltr">
                          {customer.phone || ''}
                          {customer.phone && (customer.commune || customer.wilaya) ? ' · ' : ''}
                          {[customer.commune, customer.wilaya].filter(Boolean).join(', ')}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {refrigerators.length > 0 && (
                <div>
                  <p className="bg-slate-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('search.refrigerators')}
                  </p>
                  {refrigerators.map((ref) => (
                    <button
                      key={ref.id}
                      type="button"
                      onMouseDown={() => go(`/refrigerators/${ref.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50/60"
                    >
                      <Refrigerator className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800" dir="ltr">
                          {ref.serial_number || '—'}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {ref.customer?.name || '—'}
                          {ref.model ? ` · ${ref.model}` : ''}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}