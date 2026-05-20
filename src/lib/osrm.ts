const OSRM_URL = 'https://router.project-osrm.org'

interface Waypoint {
  lat: number
  lng: number
}

export async function fetchDistanceMatrix(waypoints: Waypoint[]): Promise<number[][]> {
  const n = waypoints.length
  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';')
  const url = `${OSRM_URL}/table/v1/driving/${coords}?annotations=duration`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM table failed: ${res.statusText}`)
  const data = await res.json()

  if (!data.durations) throw new Error('OSRM response missing durations')

  const matrix: number[][] = []
  for (let i = 0; i < n; i++) {
    matrix[i] = []
    for (let j = 0; j < n; j++) {
      const val = data.durations[i][j]
      matrix[i][j] = val != null ? Math.round(val) : 999999
    }
  }
  return matrix
}

export async function fetchRoute(waypoints: Waypoint[]): Promise<[number, number][]> {
  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';')
  const url = `${OSRM_URL}/route/v1/driving/${coords}?geometries=geojson&overview=full`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM route failed: ${res.statusText}`)
  const data = await res.json()

  if (!data.routes || !data.routes.length) throw new Error('OSRM returned no routes')

  const coordsList: [number, number][] = data.routes[0].geometry.coordinates.map(
    (c: number[]) => [c[1], c[0]] as [number, number]
  )
  return coordsList
}
