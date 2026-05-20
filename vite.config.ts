import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'
import { parseSharedList } from './server/parse-list'

interface PlaceStub { name: string; latitude?: number | null; longitude?: number | null }

function apiPlugin(): Plugin {
  const savedLists = new Map<number, { name: string; url: string; places: PlaceStub[] }>()
  let listIdCounter = 0

  return {
    name: 'api',
    configureServer(server) {
      server.middlewares.use('/api/parse-list', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('POST only')
          return
        }

        let body = ''
        for await (const chunk of req) body += chunk

        try {
          const { url } = JSON.parse(body)
          if (!url) throw new Error('url required')

          const result = await parseSharedList(url)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to parse list' }))
        }
      })

      server.middlewares.use('/api/lists', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const url = new URL(req.url || '', 'http://localhost')
        const id = url.searchParams.get('id')

        if (req.method === 'GET') {
          if (id) {
            const list = savedLists.get(Number(id))
            if (!list) { res.statusCode = 404; res.end('Not found'); return }
            res.end(JSON.stringify({ id: Number(id), ...list }))
          } else {
            res.end(JSON.stringify(
              Array.from(savedLists.entries()).map(([id, data]) => ({
                id, name: data.name, url: data.url, place_count: data.places.length, created_at: new Date().toISOString(),
              }))
            ))
          }
        } else if (req.method === 'POST') {
          let body = ''
          for await (const chunk of req) body += chunk
          const { name, url, places } = JSON.parse(body)
          const id = ++listIdCounter
          savedLists.set(id, { name, url, places })
          res.end(JSON.stringify({ ok: true }))
        } else if (req.method === 'DELETE') {
          if (!id) { res.statusCode = 400; res.end('id required'); return }
          savedLists.delete(Number(id))
          res.end(JSON.stringify({ ok: true }))
        } else {
          res.statusCode = 405
          res.end('Method not allowed')
        }
      })

      server.middlewares.use('/api/session', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method === 'GET') {
          res.end(JSON.stringify({ places: [], stops: {}, stopCount: 10 }))
        } else if (req.method === 'POST') {
          res.end(JSON.stringify({ ok: true }))
        } else {
          res.statusCode = 405
          res.end('POST only')
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
})
