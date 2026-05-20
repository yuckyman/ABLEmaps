export interface Place {
  name: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
}

export async function parseSharedList(url: string): Promise<{ listName: string; owner: string | null; places: Place[] }> {
  const pageHtml = await fetchWithRetry(() => fetchHtml(url), 'list page')
  const apiUrl = extractGetlistUrl(pageHtml)
  const raw = await fetchWithRetry(() => fetchRaw(apiUrl), 'list data')
  return parseResponse(raw)
}

async function fetchWithRetry<T>(fn: () => Promise<T>, label: string, retries = 3, delay = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('Too Many Requests') && i < retries - 1) {
        console.log(`[parse-list] ${label} rate limited, retrying in ${delay * (i + 1)}ms...`)
        await new Promise(r => setTimeout(r, delay * (i + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error(`Max retries exceeded fetching ${label}`)
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`Failed to fetch list page: ${res.statusText}`)
  return res.text()
}

async function fetchRaw(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  })
  if (!res.ok) throw new Error(`Failed to fetch list data: ${res.statusText}`)
  return res.text()
}

function extractGetlistUrl(html: string): string {
  const match = html.match(/href="([^"]*entitylist\/getlist[^"]*)"/)
  if (!match) throw new Error('Could not find entitylist/getlist endpoint. The link may be private or invalid.')
  const raw = match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#([0-9]+);/g, (_, n) => String.fromCharCode(Number(n)))
  if (raw.startsWith('/')) return 'https://www.google.com' + raw
  return raw
}

function parseResponse(raw: string): { listName: string; owner: string | null; places: Place[] } {
  const stripped = stripXssi(raw)
  const data = JSON.parse(stripped)

  if (!Array.isArray(data) || !data.length) throw new Error('Unexpected response structure')
  const root = data[0]
  if (!Array.isArray(root)) throw new Error('Unexpected response structure')

  const listName = root[4] && typeof root[4] === 'string' ? root[4] : 'Imported'
  const owner = root[3] && Array.isArray(root[3]) && root[3][0] ? String(root[3][0]) : null
  const items = root[8]
  if (!Array.isArray(items)) throw new Error('Unexpected response structure')

  const places: Place[] = []
  for (const item of items) {
    if (!Array.isArray(item) || item.length <= 2) continue
    const name = item[2]
    if (!name || typeof name !== 'string') continue

    const info = item[1]
    const place: Place = { name }

    if (Array.isArray(info)) {
      if (info[2] && typeof info[2] === 'string') place.address = info[2]
      else if (info[4] && typeof info[4] === 'string') place.address = info[4]

      if (Array.isArray(info[5]) && info[5].length > 3) {
        if (typeof info[5][2] === 'number') place.latitude = info[5][2]
        if (typeof info[5][3] === 'number') place.longitude = info[5][3]
      }
    }

    places.push(place)
  }

  return { listName, owner, places }
}

function stripXssi(raw: string): string {
  const idx = raw.search(/[\[{]/)
  return idx >= 0 ? raw.slice(idx) : raw
}
