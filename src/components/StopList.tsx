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

interface Point {
  name: string
  lat: number
  lng: number
}

const MAX_GOOGLE_STOPS = 10
const MAX_APPLE_STOPS = 15

function routePoints(office: Office, orderedIndices: number[], places: Place[]): Point[] {
  return [
    { name: office.name, lat: office.lat, lng: office.lng },
    ...orderedIndices
      .map(i => places[i])
      .filter(p => p.latitude != null && p.longitude != null)
      .map(p => ({ name: p.name, lat: p.latitude!, lng: p.longitude! })),
  ]
}

function chunkRoute(pts: Point[], maxStops: number): Point[][] {
  if (pts.length <= maxStops) return [pts]
  const chunks: Point[][] = []
  let start = 0
  while (start < pts.length) {
    const end = Math.min(start + maxStops, pts.length)
    if (end - start < 2) break
    chunks.push(pts.slice(start, end))
    start = end - 1
  }
  return chunks
}

function googleMapsUrls(office: Office, orderedIndices: number[], places: Place[]) {
  const pts = routePoints(office, orderedIndices, places)
  const chunks = chunkRoute(pts, MAX_GOOGLE_STOPS)
  return chunks.map(chunk => {
    const origin = `${chunk[0].lat},${chunk[0].lng}`
    const dest = `${chunk[chunk.length - 1].lat},${chunk[chunk.length - 1].lng}`
    const mids = chunk.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|')
    const base = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`
    return mids ? `${base}&waypoints=${mids}` : base
  })
}

function appleMapsUrls(office: Office, orderedIndices: number[], places: Place[]) {
  const pts = routePoints(office, orderedIndices, places)
  const chunks = chunkRoute(pts, MAX_APPLE_STOPS)
  return chunks.map(chunk => {
    const source = `${chunk[0].lat},${chunk[0].lng}`
    const dest = `${chunk[chunk.length - 1].lat},${chunk[chunk.length - 1].lng}`
    const waypoints = chunk.slice(1, -1).map(p => `waypoint=${p.lat},${p.lng}`).join('&')
    const base = `https://maps.apple.com/directions?source=${source}&destination=${dest}&mode=driving`
    return waypoints ? `${base}&${waypoints}` : base
  })
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

  const pts = routePoints(office, orderedIndices, places)
  const gmUrls = googleMapsUrls(office, orderedIndices, places)
  const amUrls = appleMapsUrls(office, orderedIndices, places)
  const gmChunks = chunkRoute(pts, MAX_GOOGLE_STOPS)
  const amChunks = chunkRoute(pts, MAX_APPLE_STOPS)

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

      <div className="px-4 py-2 border-b border-gray-100">
        <span className="text-xs text-gray-400 block mb-1">Open in:</span>
        <div className="flex gap-4">
          {gmChunks.length === 1 ? (
            <a href={gmUrls[0]} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline font-medium">Google Maps</a>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500 font-medium">Google Maps</span>
              {gmUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline">
                  Seg {i + 1} ({gmChunks[i][0].name} → {gmChunks[i][gmChunks[i].length - 1].name})
                </a>
              ))}
            </div>
          )}
          {amChunks.length === 1 ? (
            <a href={amUrls[0]} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline font-medium">Apple Maps</a>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500 font-medium">Apple Maps</span>
              {amUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline">
                  Seg {i + 1} ({amChunks[i][0].name} → {amChunks[i][amChunks[i].length - 1].name})
                </a>
              ))}
            </div>
          )}
        </div>
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
