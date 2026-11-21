/** Word statistics, kept apart from the build script so they can be tested. */

export const STOP = new Set(
  "a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself let me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up us very was we were what when where which while who whom why will with would you your yours yourself yourselves unto thou thee thy thine ye hath doth shall shalt art wilt hast saith said say lo yea nay o oh also upon thereof therefore wherefore neither whose whosoever whoso".split(" "),
);

export function tokenize(text: string): string[] {
  return (
    text
      .replace(/[-]/g, "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .match(/[a-z]+(?:'[a-z]+)?/g) ?? []
  );
}

export function topWords(counts: Map<string, number>, n: number): [string, number][] {
  return [...counts].filter(([w]) => !STOP.has(w) && w.length > 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}

/**
 * Words a book uses far more than the rest of the Bible: term frequency in the book times
 * log(books / books containing the word). Scores are scaled by 100 and rounded to two places.
 */
export function distinctiveWords(counts: Map<string, number>, total: number, docFreq: Map<string, number>, books: number, minCount: number, n = 20): [string, number, number][] {
  return [...counts]
    .filter(([w, c]) => !STOP.has(w) && w.length > 2 && c >= minCount)
    .map(([w, c]) => [w, c, (c / total) * Math.log(books / (docFreq.get(w) ?? 1))] as [string, number, number])
    .sort((a, b) => b[2] - a[2] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([w, c, s]) => [w, c, Math.round(s * 1e6) / 100]);
}
