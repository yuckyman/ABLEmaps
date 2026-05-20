interface Env {
  ablemaps_db: D1Database
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const db = ctx.env.ablemaps_db

  if (ctx.request.method === 'GET') {
    let row = await db.prepare('SELECT places, stops, stop_count FROM session WHERE id = 1').first()
    if (!row) {
      await db.prepare('INSERT INTO session (id, places, stops, stop_count) VALUES (1, \'[]\', \'{}\', 10)').run()
      row = { places: '[]', stops: '{}', stop_count: 10 }
    }
    return Response.json({
      places: JSON.parse(row.places as string),
      stops: JSON.parse(row.stops as string),
      stopCount: (row.stop_count as number) ?? 10,
    })
  }

  if (ctx.request.method === 'POST') {
    const { places, stops, stopCount } = await ctx.request.json()
    await db.prepare(
      'UPDATE session SET places = ?, stops = ?, stop_count = ?, updated_at = datetime(\'now\') WHERE id = 1',
    ).bind(JSON.stringify(places), JSON.stringify(stops), stopCount).run()
    return Response.json({ ok: true })
  }

  return new Response('Method not allowed', { status: 405 })
}
