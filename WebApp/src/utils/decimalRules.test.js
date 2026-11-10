import { describe, expect, it } from 'vitest'
import { ceilDecimalRatio, isValidDecimal, MAX_DECIMAL_VALUE } from './decimalRules'

describe('isValidDecimal', () => {
  it.each(['0', '0.001', '12.345', ' 12.3 ', 10, '999999999999999'])('accepts %s', value => {
    expect(isValidDecimal(value)).toBe(true)
  })

  it.each(['', ' ', null, undefined, '-1', '0.0001', '1.2345', 'abc', 'Infinity', NaN, MAX_DECIMAL_VALUE, '1000000000000000'])('rejects %s', value => {
    expect(isValidDecimal(value)).toBe(false)
  })

  it('requires a positive value when zero is forbidden', () => {
    expect(isValidDecimal('0', false)).toBe(false)
    expect(isValidDecimal('0.001', false)).toBe(true)
  })
})

describe('ceilDecimalRatio', () => {
  it.each([
    ['10', '3', 4],
    ['12', '3', 4],
    ['0.07', '0.01', 7],
    ['0.071', '0.01', 8],
    ['0.001', '3', 1],
  ])('calculates %s / %s without an extra box from floating point error', (quantity, perBox, expected) => {
    expect(ceilDecimalRatio(quantity, perBox)).toBe(expected)
  })

  it.each([['', '1'], ['1', '0'], ['-1', '2']])('returns zero for incomplete or invalid input %s / %s', (quantity, perBox) => {
    expect(ceilDecimalRatio(quantity, perBox)).toBe(0)
  })
})
