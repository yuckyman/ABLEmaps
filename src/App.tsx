import { useState, useCallback } from 'react'
import type { Place, StopState, Status } from './types'
import { resolvePlaces } from './lib/geocode'
import { fetchDistanceMatrix, fetchRoute } from './lib/osrm'
import { solveTsp } from './lib/tsp'
import CollapsibleSection from './components/CollapsibleSection'
import ImportPanel from './components/ImportPanel'
import MapView from './components/MapView'
import ControlPanel, { DEFAULT_OFFICE } from './components/ControlPanel'
import StopList from './components/StopList'

export default function App() {
  const [places, setPlaces] = useState<Place[]>([])
  const [stopCount, setStopCount] = useState(10)
  const [stops, setStops] = useState<Record<number, StopState>>({})
  const [orderedIndices, setOrderedIndices] = useState<number[]>([])
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const [totalDistance, setTotalDistance] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [resolving, setResolving] = useState(false)
  const [routeVersion, setRouteVersion] = useState(0)

  const handleImport = useCallback(async (raw: Place[]) => {
    setPlaces([])
    setOrderedIndices([])
    setRouteCoords([])
    setTotalDistance(null)
    setStops({})
    setStatus({ type: 'idle' })
    setResolving(true)
    const resolved = await resolvePlaces(raw)
    setPlaces(resolved)
    setResolving(false)
  }, [])

  const handleOptimize = useCallback(async () => {
    if (places.length === 0) return

    setOrderedIndices([])
    setRouteCoords([])
    setTotalDistance(null)
    setStatus({ type: 'idle' })

    const validIndices = places
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.latitude != null && p.longitude != null)
      .map(({ i }) => i)

    if (validIndices.length === 0) return

    const n = Math.min(stopCount, validIndices.length)
    const chosenIndices = validIndices.slice(0, n)
    const waypoints = [
      { lat: DEFAULT_OFFICE.lat, lng: DEFAULT_OFFICE.lng },
      ...chosenIndices.map(i => ({ lat: places[i].latitude!, lng: places[i].longitude! })),
    ]

    console.log('[optimize] waypoints:', waypoints.length)

    try {
      setStatus({ type: 'matrix', step: 0, total: waypoints.length })
      const dist = await fetchDistanceMatrix(waypoints)

      setStatus({ type: 'solving' })
      const { route, cost } = solveTsp(dist)
      console.log('[optimize] tsp route:', route, 'cost:', cost)

      setStatus({ type: 'route' })
      const ordered = route.slice(1, -1).map(i => chosenIndices[i - 1])
      console.log('[optimize] ordered indices:', ordered)

      const coords = await fetchRoute(route.map(i => waypoints[i]))
      console.log('[optimize] route coords:', coords.length, 'points')

      setOrderedIndices(ordered)
      setRouteCoords(coords)
      setTotalDistance(cost)
      setRouteVersion(v => v + 1)
      setStatus({ type: 'done' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[optimize] FAILED:', err)
      setStatus({ type: 'error', message })
    }
  }, [places, stopCount])

  const handleToggleVisited = useCallback((index: number) => {
    setStops(prev => ({
      ...prev,
      [index]: { ...prev[index] || { visited: false, notes: '' }, visited: !(prev[index]?.visited) },
    }))
  }, [])

  const handleNotesChange = useCallback((index: number, notes: string) => {
    setStops(prev => ({
      ...prev,
      [index]: { ...prev[index] || { visited: false, notes: '' }, notes },
    }))
  }, [])

  const validCount = places.filter(p => p.latitude != null && p.longitude != null).length

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-blue-600">ABLEmaps</h1>
        <span className="text-sm text-gray-400">{places.length} places loaded ({validCount} with coords)</span>
      </header>

      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <div className="w-80 shrink-0 flex flex-col h-full overflow-y-auto">
          <CollapsibleSection key={`import-${routeVersion}`} title="Import Places" defaultOpen={routeVersion === 0}>
            <ImportPanel onImport={handleImport} />
            {resolving && (
              <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg mt-3">
                Geocoding places via Nominatim (1 req/s)...
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection key={`controls-${routeVersion}`} title="Route Controls" defaultOpen={routeVersion === 0}>
            <ControlPanel
              stopCount={stopCount}
              onStopCountChange={setStopCount}
              placeCount={validCount}
              onOptimize={handleOptimize}
              status={status}
            />
          </CollapsibleSection>

          <StopList
            places={places}
            office={DEFAULT_OFFICE}
            orderedIndices={orderedIndices}
            stops={stops}
            onToggleVisited={handleToggleVisited}
            onNotesChange={handleNotesChange}
            totalDistance={totalDistance}
          />
          {orderedIndices.length > 0 && (
            <div className="bg-gray-50 rounded-lg shadow p-3 text-xs text-gray-500 font-mono">
              <div>Stops: {orderedIndices.length} &middot; Route points: {routeCoords.length}</div>
              <div>Status: {status.type}{status.type === 'error' ? `: ${status.message}` : ''}</div>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <MapView
            places={places}
            office={DEFAULT_OFFICE}
            routeCoords={routeCoords}
            selectedIndices={orderedIndices}
          />
        </div>
      </div>
    </div>
  )
}
