type LinkSegment = { url: string }

export const linkify = (text: string): (string | LinkSegment)[] => {
  const matches = [...text.matchAll(URL_REGEX)]
  if(matches.length === 0) return [text]

  const segments: (string | LinkSegment)[] = []
  let cursor = 0

  for(const match of matches) {
    const rawUrl = match[0]
    const trailing = rawUrl.match(TRAILING_PUNCTUATION_REGEX)?.[0] ?? ""
    const url = trailing ? rawUrl.slice(0, -trailing.length) : rawUrl
    const start = match.index

    segments.push(text.slice(cursor, start))
    segments.push({ url })
    cursor = start + url.length
  }

  segments.push(text.slice(cursor))
  return segments
}

const URL_REGEX = /https?:\/\/[^\s]+/g
const TRAILING_PUNCTUATION_REGEX = /[.,;:!?)\]]+$/