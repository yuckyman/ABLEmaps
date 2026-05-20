import type { Place, Office, StopState } from '../types'

interface Props {
  places: Place[]
  office: Office
  orderedIndices: number[]
  stops: Record<number, StopState>
  onToggleVisited: (index: number) => void
  onNotesChange: (index: number, notes: string) => void
  totalDistance: number | null
}

function routeWaypoints(_office: Office, orderedIndices: number[], places: Place[]) {
  return orderedIndices
    .map(i => places[i])
    .filter(p => p.latitude != null && p.longitude != null) as (Place & { latitude: number; longitude: number })[]
}

function googleMapsUrl(office: Office, orderedIndices: number[], places: Place[]) {
  const pts = routeWaypoints(office, orderedIndices, places)
  if (pts.length < 2) return '#'
  const origin = `${office.lat},${office.lng}`
  const dest = `${pts[pts.length - 1].latitude},${pts[pts.length - 1].longitude}`
  const mid = pts.slice(0, -1).map(p => `${p.latitude},${p.longitude}`).join('|')
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&waypoints=${mid}`
}

function appleMapsUrl(office: Office, orderedIndices: number[], places: Place[]) {
  const pts = routeWaypoints(office, orderedIndices, places)
  if (pts.length === 0) return '#'
  const source = `${office.lat},${office.lng}`
  const dest = `${pts[pts.length - 1].latitude},${pts[pts.length - 1].longitude}`
  const waypoints = pts.slice(0, -1).map(p => `waypoint=${p.latitude},${p.longitude}`).join('&')
  return `https://maps.apple.com/directions?source=${source}&destination=${dest}&${waypoints}&mode=driving`
}

function formatDist(m: number | null) {
  if (m === null) return ''
  if (m > 1000) return `${(m / 1000).toFixed(1)} km`
  return `${Math.round(m)} m`
}

export default function StopList({
  places, office, orderedIndices, stops, onToggleVisited, onNotesChange, totalDistance,
}: Props) {
  if (orderedIndices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-400">
        Import places and optimize a route to see stops.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Route Stops</h2>
        {totalDistance !== null && (
          <span className="text-sm font-medium text-blue-600">
            {formatDist(totalDistance)}
          </span>
        )}
      </div>

      <div className="px-4 py-2 border-b border-gray-100 flex gap-3">
        <span className="text-xs text-gray-400 self-center">Open in:</span>
        <a href={googleMapsUrl(office, orderedIndices, places)} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline font-medium">Google Maps</a>
        <a href={appleMapsUrl(office, orderedIndices, places)} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline font-medium">Apple Maps</a>
      </div>

      <div className="divide-y divide-gray-100 overflow-y-auto max-h-[500px]">
        {orderedIndices.map((placeIdx, order) => {
          const place = places[placeIdx]
          const state = stops[placeIdx] || { visited: false, notes: '' }
          const label = `Stop ${order + 1}`

          return (
            <div key={placeIdx} className={`p-3 ${state.visited ? 'bg-green-50' : ''}`}>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={state.visited}
                  onChange={() => onToggleVisited(placeIdx)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">
                      {label}
                    </span>
                    <span className={`text-sm font-medium truncate ${state.visited ? 'line-through text-gray-400' : ''}`}>
                      {place.name}
                    </span>
                  </div>
                  {place.latitude != null && place.longitude != null && (
                    <div className="flex gap-2 mt-1">
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`} target="_blank" rel="noopener" className="text-xs text-blue-500 hover:underline">Google</a>
                      <a href={`https://maps.apple.com/?daddr=${place.latitude},${place.longitude}`} target="_blank" rel="noopener" className="text-xs text-blue-500 hover:underline">Apple</a>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Add notes..."
                    value={state.notes}
                    onChange={e => onNotesChange(placeIdx, e.target.value)}
                    className="mt-1 w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
