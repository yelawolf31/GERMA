import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Store, LocateFixed } from 'lucide-react'
import MapView from '../components/map/MapView'
import MapFilters from '../components/map/MapFilters'
import CustomerBottomSheet from '../components/map/CustomerBottomSheet'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { useMapData } from '../hooks/useMapData'
import { useDebounce } from '../hooks/useDebounce'
import { useTranslation } from '../i18n'
import { createDefaultMapFilters, filterAndSearchCustomers } from '../utils/filters'
import { useGeolocation } from '../hooks/useGeolocation'

function buildDirectionsUrl(customer) {
  if (customer.latitude == null || customer.longitude == null) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}`
}

export default function MapPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()

  const { customers, loading, error } = useMapData()
  const { getCurrentPosition, loading: locating } = useGeolocation()

  const [filters, setFilters] = useState(createDefaultMapFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [focusCustomer, setFocusCustomer] = useState(null)
  const mapInstanceRef = useRef(null)

  const debouncedQuery = useDebounce(searchInput, 300)

  const filteredCustomers = useMemo(
    () => filterAndSearchCustomers(customers, filters, debouncedQuery),
    [customers, filters, debouncedQuery],
  )

  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return []
    return filteredCustomers.slice(0, 8)
  }, [filteredCustomers, debouncedQuery])

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setSheetOpen(true)
  }

  const handleOpenDetails = (customer) => {
    setSheetOpen(false)
    navigate(`/customers/${customer.id}`)
  }

  const handleDirections = (customer) => {
    const url = buildDirectionsUrl(customer)
    if (url) window.open(url, '_blank', 'noopener')
  }

  const handleRecordVisit = (customer) => {
    setSheetOpen(false)
    navigate(`/visits/record/${customer.id}`)
  }

  const handlePickResult = (customer) => {
    setSearchInput('')
    setSearchFocused(false)
    setFocusCustomer(customer)
    setSelectedCustomer(customer)
    setSheetOpen(true)
    setSearchParams({ customer: customer.id })
  }

  const flyToUser = async () => {
    const pos = await getCurrentPosition()
    if (pos && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [pos.longitude, pos.latitude],
        zoom: 14,
        duration: 900,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label={t('map.loading')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState title={t('common.error')} description={error.message} />
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <MapView
        customers={filteredCustomers}
        onSelectCustomer={handleSelectCustomer}
        selectedCustomerId={selectedCustomer?.id || null}
        focusCustomer={focusCustomer}
        showUserLocation
        mapRef={mapInstanceRef}
      />

      {/* Top overlay: search */}
      <div className="absolute left-3 right-3 top-3 z-10 sm:left-4 sm:right-auto sm:w-96">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder={t('map.searchPlaceholder')}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-lg placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        {searchFocused && debouncedQuery.trim() && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            {searchResults.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">{t('customers.noResults')}</p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {searchResults.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onMouseDown={() => handlePickResult(customer)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: customer.markerColor }}
                    >
                      <Store className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{customer.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {[customer.commune, customer.wilaya].filter(Boolean).join(', ') || t('common.unknown')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top overlay: filters + location buttons */}
      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2 sm:right-4">
        <Button variant="secondary" size="icon" onClick={flyToUser} loading={locating} disabled={locating} aria-label={t('map.currentLocation')}>
          <LocateFixed className="h-4 w-4" />
        </Button>
        <MapFilters filters={filters} onChange={setFilters} open={filtersOpen} onToggle={() => setFiltersOpen((open) => !open)} />
      </div>

      {/* Bottom sheet */}
      <CustomerBottomSheet
        customer={selectedCustomer}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onOpenDetails={handleOpenDetails}
        onDirections={handleDirections}
        onRecordVisit={handleRecordVisit}
      />

      {/* Selection via URL (map links from dashboard) */}
      <UrlSelectionHandler
        customers={customers}
        onPick={(customer) => {
          setFocusCustomer(customer)
          setSelectedCustomer(customer)
          setSheetOpen(true)
        }}
      />
    </div>
  )
}

function UrlSelectionHandler({ customers, onPick }) {
  const [searchParams] = useSearchParams()
  const handledRef = useRef(null)
  const customerId = searchParams.get('customer')

  if (customerId && handledRef.current !== customerId) {
    handledRef.current = customerId
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      // Defer so the map is ready
      setTimeout(() => onPick(customer), 100)
    }
  }

  return null
}
