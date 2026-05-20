export interface Place {
  name: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  google_place_id?: string | null
  google_maps_url?: string | null
}

export interface Office {
  name: string
  lat: number
  lng: number
}

export interface StopState {
  visited: boolean
  notes: string
}

export interface RouteResult {
  orderedIndices: number[]
  totalDistance: number
}

export type Status =
  | { type: 'idle' }
  | { type: 'matrix'; step: number; total: number }
  | { type: 'solving' }
  | { type: 'route' }
  | { type: 'done' }
  | { type: 'error'; message: string }
