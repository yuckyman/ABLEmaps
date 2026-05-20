import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'
import { parseSharedList } from './server/parse-list'

function parseListPlugin(): Plugin {
  return {
    name: 'parse-list',
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
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), parseListPlugin()],
})
