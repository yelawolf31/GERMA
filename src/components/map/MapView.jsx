import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN } from '../../lib/supabase'
import { useTranslation } from '../../i18n'
import Spinner from '../ui/Spinner'

mapboxgl.accessToken = MAPBOX_TOKEN

const DEFAULT_CENTER = [0.9897, 35.6036] // Oran
const DEFAULT_ZOOM = 10.5

function buildGeoJson(customers) {
  const features = customers
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      type: 'Feature',
      properties: {
        id: c.id,
        markerColor: c.markerColor || '#3b82f6',
        markerStatus: c.markerStatus || 'no_refrigerator',
        name: c.name || '',
      },
      geometry: { type: 'Point', coordinates: [c.longitude, c.latitude] },
    }))
  return { type: 'FeatureCollection', features }
}

/**
 * Mapbox map with clustered customer markers.
 *
 * @param {object} props
 * @param {Array} props.customers enriched customers (latitude/longitude/markerColor)
 * @param {(customer: object) => void} props.onSelectCustomer
 * @param {string|null} props.selectedCustomerId
 * @param {object} props.focusCustomer triggers a flyTo when its id changes
 * @param {boolean} props.showUserLocation
 * @param {boolean} props.locationPicker enables click-to-pick mode
 * @param {{lng:number, lat:number}|null} props.pickedLocation
 * @param {(loc: {lng:number, lat:number}) => void} props.onPickLocation
 * @param {React.RefObject} props.mapRef exposed map instance
 */
export default function MapView({
  customers = [],
  onSelectCustomer,
  selectedCustomerId,
  focusCustomer,
  showUserLocation = false,
  locationPicker = false,
  pickedLocation = null,
  onPickLocation,
  mapRef,
}) {
  const containerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)
  const { t } = useTranslation()

  // Track latest customers for click handling
  const customersRef = useRef(customers)
  customersRef.current = customers

  // Keep an external handle to the map instance
  const exposeMap = (map) => {
    mapInstanceRef.current = map
    if (mapRef) mapRef.current = map
  }

  // Initialize the map once
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setLoaded(false)
      return
    }
    if (!containerRef.current || mapInstanceRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    })
    exposeMap(map)

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('error', (e) => {
      console.error('Mapbox error:', e.error?.message || e)
      setMapError(e.error?.message || 'Map failed to load')
    })

    let geolocate = null
    if (showUserLocation) {
      geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true, timeout: 10000 },
        trackUserLocation: true,
        showUserHeading: true,
      })
      map.addControl(geolocate, 'top-right')
      geolocate.on('error', (err) => {
        console.warn('Geolocation unavailable:', err?.message)
      })
    }

    map.on('load', () => {
      if (geolocate) geolocate.trigger().catch(() => {})

      // Customer source with clustering
      map.addSource('customers', {
        type: 'geojson',
        data: buildGeoJson(customersRef.current),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      })

      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'customers',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#dc2626',
            10,
            '#b91c1c',
            30,
            '#7f1d1d',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 28, 30, 36],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      // Cluster count label
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'customers',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 13,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      })

      // Unclustered customer points
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'customers',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'markerColor'],
          'circle-radius': 9,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      })

      setLoaded(true)
    })

    // Click on cluster → zoom in
    // Click on point → open customer
    map.on('click', 'clusters', (event) => {
      const features = map.queryRenderedFeatures(event.point, { layers: ['clusters'] })
      const clusterId = features[0].properties.cluster_id
      map.getSource('customers').getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return
        map.easeTo({ center: features[0].geometry.coordinates, zoom })
      })
    })

    map.on('click', 'unclustered-point', (event) => {
      const feature = event.features[0]
      const customerId = feature.properties.id
      const customer = customersRef.current.find((c) => c.id === customerId)
      if (customer) onSelectCustomer?.(customer)
    })

    map.on('mouseenter', 'clusters', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'clusters', () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('mouseenter', 'unclustered-point', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'unclustered-point', () => {
      map.getCanvas().style.cursor = ''
    })

    // Location picker mode
    map.on('click', (event) => {
      if (!locationPicker) return
      const { lng, lat } = event.lngLat
      onPickLocation?.({ lng, lat })
    })

    return () => {
      map.remove()
      mapInstanceRef.current = null
      if (mapRef) mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update source data when customers change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !map.isStyleLoaded() || !map.getSource('customers')) return
    map.getSource('customers').setData(buildGeoJson(customers))
  }, [customers])

  // Auto-fit bounds when customers with coordinates change
  const hasFitRef = useRef(false)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !loaded) return
    const withCoords = customers.filter((c) => c.latitude != null && c.longitude != null)
    if (withCoords.length === 0) return
    const bounds = new mapboxgl.LngLatBounds()
    withCoords.forEach((c) => bounds.extend([c.longitude, c.latitude]))
    const padding = hasFitRef.current ? 40 : 80
    map.fitBounds(bounds, { padding, maxZoom: 15, duration: hasFitRef.current ? 600 : 0 })
    hasFitRef.current = true
  }, [customers, loaded])

  // Fly to the focused customer
  const lastFocusedRef = useRef(null)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !focusCustomer) return
    const id = focusCustomer.id
    if (lastFocusedRef.current === id) return
    lastFocusedRef.current = id
    if (focusCustomer.latitude == null || focusCustomer.longitude == null) return
    map.flyTo({ center: [focusCustomer.longitude, focusCustomer.latitude], zoom: 14, duration: 900 })
  }, [focusCustomer])

  // Selected customer marker ring
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !map.isStyleLoaded()) return
    if (!selectedCustomerId) {
      if (map.getLayer('selected-ring')) map.removeLayer('selected-ring')
      return
    }
    const customer = customersRef.current.find((c) => c.id === selectedCustomerId)
    if (!customer || customer.latitude == null) return

    if (!map.getSource('selected-source')) {
      map.addSource('selected-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
    }
    map.getSource('selected-source').setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [customer.longitude, customer.latitude],
          },
        },
      ],
    })
    if (!map.getLayer('selected-ring')) {
      map.addLayer({
        id: 'selected-ring',
        type: 'circle',
        source: 'selected-source',
        paint: {
          'circle-radius': 16,
          'circle-color': '#b91c1c',
          'circle-opacity': 0.25,
          'circle-stroke-width': 0,
        },
      })
    }
  }, [selectedCustomerId])

  // Picked location marker (location picker)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !map.isStyleLoaded()) return
    if (!pickedLocation) {
      if (map.getLayer('picked-point')) map.removeLayer('picked-point')
      return
    }
    if (!map.getSource('picked-source')) {
      map.addSource('picked-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
    }
    map.getSource('picked-source').setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [pickedLocation.lng, pickedLocation.lat] },
        },
      ],
    })
    if (!map.getLayer('picked-point')) {
      map.addLayer({
        id: 'picked-point',
        type: 'circle',
        source: 'picked-source',
        paint: {
          'circle-radius': 10,
          'circle-color': '#b91c1c',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      })
    }
    map.flyTo({ center: [pickedLocation.lng, pickedLocation.lat], zoom: 14, duration: 700 })
  }, [pickedLocation])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 p-6 text-center">
        <p className="max-w-sm text-sm text-slate-500">
          {t('auth.missingConfig')} — VITE_MAPBOX_ACCESS_TOKEN
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 p-6 text-center">
          <div>
            <p className="mb-2 text-sm font-medium text-red-600">{mapError}</p>
            <button
              onClick={() => { setMapError(null); setLoaded(false); mapInstanceRef.current?.resize() }}
              className="text-xs text-brand-700 underline hover:no-underline"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      )}
      {!loaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <Spinner label={t('map.loading')} />
        </div>
      )}
      {loaded && !mapError && customers.length > 0 && customers.every((c) => c.latitude == null) && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center z-10">
          <div className="rounded-2xl bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-lg backdrop-blur">
            {t('map.noResults')}
          </div>
        </div>
      )}
    </div>
  )
}
