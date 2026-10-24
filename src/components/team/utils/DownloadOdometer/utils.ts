export const MIN_DIGITS = 4

export const toDigits = (count: number) =>
  String(Math.max(0, Math.floor(count))).padStart(MIN_DIGITS, "0").split("").map(Number)
