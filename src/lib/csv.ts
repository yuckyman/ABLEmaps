import Papa from 'papaparse'
import type { Place } from '../types'

const PLACE_ID_RE = /1s([^!]+)/

function extractPlaceId(url: string): string | null {
  const m = url.match(PLACE_ID_RE)
  return m ? m[1] : null
}

function extractPlaceName(url: string): string | null {
  const m = url.match(/\/place\/([^/]+)\/data=/)
  return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null
}

interface CsvRow {
  Title?: string
  Note?: string
  URL?: string
  Tags?: string
  Comment?: string
}

export function parsePlacesCsv(text: string): Place[] {
  const { data, errors } = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
  })

  if (errors.length) {
    console.warn('CSV parse errors:', errors)
  }

  const seen = new Set<string>()
  const places: Place[] = []

  for (const row of data) {
    if (!row.URL) continue

    const placeId = extractPlaceId(row.URL)
    if (!placeId) continue
    if (seen.has(placeId)) continue
    seen.add(placeId)

    places.push({
      name: row.Title || extractPlaceName(row.URL) || 'Unknown',
      google_place_id: placeId,
      google_maps_url: row.URL,
    })
  }

  return places
}
