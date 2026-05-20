import { useState, useEffect } from 'react'
import type { Place } from '../types'
import { fetchLists, saveList, loadList, type SavedList } from '../lib/lists'

interface Props {
  onImport: (places: Place[]) => void
}

export default function ImportPanel({ onImport }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listUrl, setListUrl] = useState('')
  const [savedLists, setSavedLists] = useState<SavedList[]>([])

  useEffect(() => { fetchLists().then(setSavedLists) }, [])

  const refreshLists = () => fetchLists().then(setSavedLists)

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

      await saveList(result.listName || 'Imported', url, result.places)
      await refreshLists()
      onImport(result.places)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse list')
    }
    setLoading(false)
  }

  const handleSelectSaved = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value)
    if (!id) return

    setLoading(true)
    setError(null)
    try {
      const detail = await loadList(id)
      if (!detail) throw new Error('Failed to load list')
      onImport(detail.places)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load list')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 className="text-lg font-semibold">Import Places</h2>

      {savedLists.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Saved Maps</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            defaultValue=""
            onChange={handleSelectSaved}
          >
            <option value="" disabled>Choose a saved map...</option>
            {savedLists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name} ({list.place_count} places)
              </option>
            ))}
          </select>
        </div>
      )}

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

      {loading && <div className="flex items-center gap-2 text-sm text-blue-700"><span className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" /> Loading...</div>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
