export type TableAlign = "left" | "center" | "right" | undefined

export type ChatSegment =
  | { type: "text", text: string }
  | { type: "table", header: string[], align: TableAlign[], rows: string[][] }

export const parseChatSegments = (text: string): ChatSegment[] => {
  const lines = text.split("\n")
  const segments: ChatSegment[] = []
  let textLines: string[] = []

  const flushText = () => {
    if(textLines.length > 0) segments.push({ type: "text", text: textLines.join("\n") })
    textLines = []
  }

  let i = 0
  while(i < lines.length) {
    const isTableStart = i + 1 < lines.length && lines[i].includes("|") && SEPARATOR_REGEX.test(lines[i + 1])
    if(!isTableStart) {
      textLines.push(lines[i])
      i++
      continue
    }

    const header = splitRow(lines[i])
    const align = splitRow(lines[i + 1]).map(parseAlign)
    const rows: string[][] = []
    i += 2
    while(i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
      const cells = splitRow(lines[i])
      rows.push(header.map((_, col) => cells[col] ?? ""))
      i++
    }

    if(textLines.at(-1)?.trim() === "") textLines.pop()
    flushText()
    segments.push({ type: "table", header, align, rows })
    if(lines[i]?.trim() === "") i++
  }

  flushText()
  return segments
}

const splitRow = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, "|"))

const parseAlign = (cell: string): TableAlign => {
  const left = cell.startsWith(":")
  const right = cell.endsWith(":")
  if(left && right) return "center"
  if(right) return "right"
  if(left) return "left"
  return undefined
}

const SEPARATOR_REGEX = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/
