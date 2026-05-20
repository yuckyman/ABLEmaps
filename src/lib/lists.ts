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

export async function fetchLists(): Promise<SavedList[]> {
  try {
    const res = await fetch('/api/lists')
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function saveList(name: string, url: string, places: Place[]): Promise<boolean> {
  try {
    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, places }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function loadList(id: number): Promise<SavedListDetail | null> {
  try {
    const res = await fetch(`/api/lists?id=${id}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function deleteList(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/lists?id=${id}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}
