interface Env {
  DB: D1Database
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const db = ctx.env.DB
  const url = new URL(ctx.request.url)
  const id = url.searchParams.get('id')

  if (ctx.request.method === 'GET') {
    if (id) {
      const row = await db.prepare('SELECT id, name, url, places FROM saved_lists WHERE id = ?').bind(Number(id)).first()
      if (!row) return new Response('Not found', { status: 404 })
      return Response.json({
        id: row.id,
        name: row.name,
        url: row.url,
        places: JSON.parse(row.places as string),
      })
    }
    const { results } = await db.prepare(
      'SELECT id, name, url, place_count, created_at FROM saved_lists ORDER BY updated_at DESC'
    ).all()
    return Response.json(results)
  }

  if (ctx.request.method === 'POST') {
    const { name, url, places } = await ctx.request.json()
    const placesJson = JSON.stringify(places)
    await db.prepare(
      `INSERT INTO saved_lists (name, url, places, place_count)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(url) DO UPDATE SET name = ?, places = ?, place_count = ?, updated_at = datetime('now')`
    ).bind(name, url, placesJson, places.length, name, placesJson, places.length).run()
    return Response.json({ ok: true })
  }

  if (ctx.request.method === 'DELETE') {
    if (!id) return new Response('id required', { status: 400 })
    await db.prepare('DELETE FROM saved_lists WHERE id = ?').bind(Number(id)).run()
    return Response.json({ ok: true })
  }

  return new Response('Method not allowed', { status: 405 })
}
