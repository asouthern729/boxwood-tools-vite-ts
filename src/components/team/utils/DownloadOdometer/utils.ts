export const MIN_DIGITS = 4

export const toDigits = (count: number) =>
  String(Math.max(0, Math.floor(count))).padStart(MIN_DIGITS, "0").split("").map(Number)

export const WHEEL_TRANSITION = { type: "spring", stiffness: 120, damping: 20 } as const

// Leading zeros are dimmed, except the final digit so a zero count still reads as 0
export const isDimmed = (digits: number[], i: number) => {
  const firstSignificant = digits.findIndex((digit) => digit !== 0)
  return firstSignificant === -1 ? i < digits.length - 1 : i < firstSignificant
}
