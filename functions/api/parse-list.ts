import { parseSharedList } from '../../server/parse-list'

interface Env {
  ablemaps_db: D1Database
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method !== 'POST') {
    return new Response('POST only', { status: 405 })
  }

  try {
    const { url } = await ctx.request.json()
    if (!url) throw new Error('url required')

    const db = ctx.env.ablemaps_db

    const cached = await db.prepare('SELECT result FROM parsed_lists_cache WHERE url = ?').bind(url).first()
    if (cached) {
      return Response.json(JSON.parse(cached.result as string))
    }

    const result = await parseSharedList(url)

    await db.prepare(
      'INSERT OR REPLACE INTO parsed_lists_cache (url, result) VALUES (?, ?)'
    ).bind(url, JSON.stringify(result)).run()

    return Response.json(result)
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to parse list' },
      { status: 400 },
    )
  }
}
