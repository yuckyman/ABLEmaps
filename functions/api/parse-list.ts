import { parseSharedList } from '../../server/parse-list'

interface Env {}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method !== 'POST') {
    return new Response('POST only', { status: 405 })
  }

  try {
    const { url } = await ctx.request.json()
    if (!url) throw new Error('url required')

    const result = await parseSharedList(url)
    return Response.json(result)
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to parse list' },
      { status: 400 },
    )
  }
}
