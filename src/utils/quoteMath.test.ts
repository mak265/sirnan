import { describe, expect, it } from 'vitest'
import { calcGrandTotalPhp, calcLineTotalPhp } from './quoteMath'

describe('quoteMath', () => {
  it('calculates line totals', () => {
    expect(calcLineTotalPhp(2, 12000)).toBe(24000)
    expect(calcLineTotalPhp(1, 50000)).toBe(50000)
  })

  it('calculates grand total', () => {
    expect(
      calcGrandTotalPhp([
        { qty: 1, unitPricePhp: 12000 },
        { qty: 1, unitPricePhp: 50000 },
      ]),
    ).toBe(62000)
  })
})

