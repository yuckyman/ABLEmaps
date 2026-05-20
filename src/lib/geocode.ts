import type { Place } from '../types'

const CACHE_KEY = 'ablemaps_geocode'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

interface CacheEntry {
  lat: number
  lng: number
  address: string | null
  ts: number
}

function getCache(): Record<string, CacheEntry> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function setCache(id: string, entry: CacheEntry) {
  const cache = getCache()
  cache[id] = entry
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

async function geocodeNominatim(query: string): Promise<{ lat: number; lng: number; address: string | null } | null> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'ABLEmaps/1.0' } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data.length) return null
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    address: data[0].display_name || null,
  }
}

export async function resolvePlace(place: Place): Promise<Place> {
  if (place.latitude != null && place.longitude != null) return place

  const id = place.google_place_id || place.name
  if (!id) return place

  const cache = getCache()
  const cached = cache[id]
  if (cached) {
    return { ...place, latitude: cached.lat, longitude: cached.lng, address: cached.address }
  }

  const result = await geocodeNominatim(place.name)
  if (result) {
    setCache(id, { ...result, ts: Date.now() })
    return { ...place, latitude: result.lat, longitude: result.lng, address: result.address }
  }

  return place
}

export async function resolvePlaces(places: Place[]): Promise<Place[]> {
  const needsGeocoding = places.filter(p => p.latitude == null || p.longitude == null)
  if (needsGeocoding.length === 0) return places

  const resolved: Place[] = []
  for (const place of places) {
    resolved.push(await resolvePlace(place))
    if (place.latitude == null || place.longitude == null) {
      await new Promise(r => setTimeout(r, 1100))
    }
  }
  return resolved
}
