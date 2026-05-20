import { useState } from 'react'
import type { Place } from '../types'

const MAP_FILES = [
  { label: 'DORAVILLE / CHAMBLEE / TUCKER', file: 'DORAVILLE CHAMBLEE TUCKER.json' },
  { label: 'ITP SOUTH EAST ATL', file: 'ITP SOUTH EAST ATL.json' },
  { label: 'JOHNS CREEK / DULUTH / LAWRENCEVILLE', file: 'JOHNS CREEK DULUTH LAWRENCEVILLE.json' },
  { label: 'MARIETTA / KENNESAW', file: 'MARIETTA KENNESAW.json' },
  { label: 'ROSWELL / ALPHARETTA', file: 'ROSWELL ALPHARETTA.json' },
  { label: 'SANDY SPRINGS / DUNWOODY', file: 'SANDY SPRINGS DUNWOOD.json' },
  { label: 'WEST METRO', file: 'WEST METRO.json' },
]

interface Props {
  onImport: (places: Place[]) => void
}

export default function ImportPanel({ onImport }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listUrl, setListUrl] = useState('')

  const handleSelect = async (file: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/maps/${file}`)
      if (!res.ok) throw new Error(`Failed to load ${file}`)
      const data: Place[] = await res.json()
      if (!data.length) throw new Error('No places found')
      onImport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    }
    setLoading(false)
  }

  const handleParseUrl = async () => {
    const url = listUrl.trim()
    if (!url) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/parse-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to parse list')
      }
      const result = await res.json()
      if (!result.places?.length) throw new Error('No places found')
      onImport(result.places)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse list')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 className="text-lg font-semibold">Import Places</h2>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Select a region</label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          defaultValue=""
          onChange={e => e.target.value && handleSelect(e.target.value)}
        >
          <option value="" disabled>Choose region...</option>
          {MAP_FILES.map(m => (
            <option key={m.file} value={m.file}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="relative border-t border-gray-200 pt-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Paste a Google Maps shared list link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={listUrl}
            onChange={e => setListUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={handleParseUrl}
            disabled={!listUrl.trim() || loading}
            className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            Parse
          </button>
        </div>
      </div>



      {loading && <div className="flex items-center gap-2 text-sm text-blue-700"><span className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" /> Parsing...</div>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
