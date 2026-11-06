import { describe, expect, it } from 'vitest'
import { formatVnd } from './money'

describe('formatVnd', () => {
  it('formats integer VND amounts with Vietnamese grouping and currency', () => {
    expect(formatVnd(0)).toBe('0 ₫')
    expect(formatVnd(1_250_000)).toBe('1.250.000 ₫')
  })
})
