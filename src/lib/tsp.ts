/**
 * Held-Karp DP for exact TSP.
 * Matrix is N×N distance in meters. Index 0 is the start/fixed origin.
 * Returns minimal route [0, ..., 0] and total distance in meters.
 */
export function solveTsp(dist: number[][]): { route: number[]; cost: number } {
  const n = dist.length
  if (n <= 1) return { route: [0], cost: 0 }

  const C: (number | null)[][] = Array.from({ length: n }, () => Array(1 << n).fill(null))
  const parent: (number | null)[][] = Array.from({ length: n }, () => Array(1 << n).fill(null))

  for (let i = 0; i < n; i++) {
    C[i][1 << i] = dist[0][i]
  }

  for (let mask = 1; mask < 1 << n; mask++) {
    for (let i = 0; i < n; i++) {
      if (!(mask & (1 << i))) continue
      if (mask === 1 << i) continue
      let best: number | null = null
      let bestPrev: number | null = null
      const prevMask = mask ^ (1 << i)
      for (let j = 0; j < n; j++) {
        if (!(prevMask & (1 << j))) continue
        const val = C[j][prevMask]
        if (val === null) continue
        const candidate = val + dist[j][i]
        if (best === null || candidate < best) {
          best = candidate
          bestPrev = j
        }
      }
      C[i][mask] = best
      parent[i][mask] = bestPrev
    }
  }

  const fullMask = (1 << n) - 1
  let bestCost: number | null = null
  let bestLast: number | null = null
  for (let i = 1; i < n; i++) {
    const val = C[i][fullMask]
    if (val === null) continue
    const cost = val + dist[i][0]
    if (bestCost === null || cost < bestCost) {
      bestCost = cost
      bestLast = i
    }
  }

  if (bestLast === null || bestCost === null) {
    throw new Error('TSP solver failed')
  }

  const route: number[] = [0]
  let mask = fullMask
  let last = bestLast
  while (last !== 0) {
    route.push(last)
    const prev = parent[last][mask]
    mask ^= 1 << last
    last = prev!
  }
  route.push(0)

  return { route, cost: bestCost }
}
