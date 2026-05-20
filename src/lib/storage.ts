import type { Place, StopState } from '../types'

export interface Session {
  places: Place[]
  stops: Record<number, StopState>
  stopCount: number
}

export async function loadSession(): Promise<Session | null> {
  try {
    const res = await fetch('/api/session')
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function saveSession(places: Place[], stops: Record<number, StopState>, stopCount: number): Promise<void> {
  try {
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ places, stops, stopCount }),
    })
  } catch {
    /* D1 unavailable — localStorage handles local persistence */
  }
}
