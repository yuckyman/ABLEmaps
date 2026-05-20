import type { Place } from '../types'

export interface SavedList {
  id: number
  name: string
  url: string
  place_count: number
  created_at: string
}

export interface SavedListDetail {
  id: number
  name: string
  url: string
  places: Place[]
}

interface LocalList {
  id: number
  name: string
  url: string
  places: Place[]
  place_count: number
  created_at: string
}

const LOCAL_KEY = 'ablemaps-saved-lists'

function loadLocal(): LocalList[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveLocal(lists: LocalList[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(lists))
}

let nextLocalId = 0

export async function fetchLists(): Promise<SavedList[]> {
  return loadLocal().map(l => ({
    id: l.id, name: l.name, url: l.url, place_count: l.place_count, created_at: l.created_at,
  }))
}

export async function saveList(name: string, url: string, places: Place[]): Promise<boolean> {
  const lists = loadLocal()
  const existing = lists.find(l => l.url === url)
  if (existing) {
    existing.places = places
    existing.place_count = places.length
    existing.name = name
  } else {
    lists.unshift({ id: --nextLocalId, name, url, places, place_count: places.length, created_at: new Date().toISOString() })
  }
  saveLocal(lists)

  try {
    await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, places }),
    })
  } catch { /* D1 unavailable — localStorage is sufficient */ }
  return true
}

export async function loadList(id: number): Promise<SavedListDetail | null> {
  const local = loadLocal().find(l => l.id === id)
  return local ? { id: local.id, name: local.name, url: local.url, places: local.places } : null
}

export async function deleteList(id: number): Promise<boolean> {
  const lists = loadLocal().filter(l => l.id !== id)
  saveLocal(lists)
  try {
    await fetch(`/api/lists?id=${id}`, { method: 'DELETE' })
  } catch { /* ignore */ }
  return true
}
