/**
 * Haversine distance in kilometers between two coordinates.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in km
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Format a distance in a human friendly way.
 * @param {number} km
 * @returns {string} e.g. "1,2 km" or "850 m"
 */
export function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} km`
}

/**
 * Distance in meters between two points.
 */
export function distanceMeters(lat1, lon1, lat2, lon2) {
  return haversineKm(lat1, lon1, lat2, lon2) * 1000
}

/**
 * Sort an array of customers by distance from a reference point (ascending).
 * @param {Array} customers customers with latitude/longitude
 * @param {{latitude:number, longitude:number}} position
 * @returns {Array} sorted customers with `distanceKm` attached
 */
export function sortCustomersByDistance(customers, position) {
  if (!position || position.latitude == null || position.longitude == null) return customers
  return customers
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((customer) => ({
      ...customer,
      distanceKm: haversineKm(
        position.latitude,
        position.longitude,
        customer.latitude,
        customer.longitude,
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
