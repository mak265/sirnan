export type QuoteItemMath = {
  qty: number
  unitPricePhp: number
}

export function calcLineTotalPhp(qty: number, unitPricePhp: number): number {
  const q = Number.isFinite(qty) ? qty : 0
  const p = Number.isFinite(unitPricePhp) ? unitPricePhp : 0
  return roundMoney(q * p)
}

export function calcGrandTotalPhp(items: QuoteItemMath[]): number {
  return roundMoney(items.reduce((sum, it) => sum + calcLineTotalPhp(it.qty, it.unitPricePhp), 0))
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

