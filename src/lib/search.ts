/** Small fuzzy matcher: exact/prefix/substring beat in-order subsequence matches. Returns 0 for no match. */
export function fuzzyScore(query: string, target: string): number {
  const q = query.trim().toLowerCase()
  const t = target.toLowerCase()
  if (!q) return 1
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  const idx = t.indexOf(q)
  if (idx >= 0) return 60 - Math.min(idx, 30) / 2 + (t[idx - 1] === ' ' ? 5 : 0)
  let ti = 0, score = 0, streak = 0
  for (const ch of q) {
    const found = t.indexOf(ch, ti)
    if (found < 0) return 0
    streak = found === ti ? streak + 1 : 0
    score += 1 + streak
    ti = found + 1
  }
  return Math.max(1, Math.min(40, (score / (t.length + q.length)) * 40))
}

export function rank<T>(items: T[], query: string, fields: (item: T) => { text: string; weight: number }[]): T[] {
  if (!query.trim()) return items
  const terms = query.trim().split(/\s+/)
  return items
    .map((item) => {
      const total = terms.reduce((acc, term) => {
        const best = Math.max(0, ...fields(item).map((f) => fuzzyScore(term, f.text) * f.weight))
        return acc === 0 || best === 0 ? 0 : acc + best
      }, 1)
      return { item, score: total === 1 ? 0 : total }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)
}
