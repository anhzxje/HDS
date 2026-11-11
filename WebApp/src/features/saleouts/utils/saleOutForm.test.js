import { describe, expect, it } from 'vitest'
import { calculateLine, toSaleOutNumbers, validateSaleOut, validateSaleOutNumbers } from './saleOutForm'

const validLine = () => ({ productId: 'product-1', quantity: '10', quantityPerBox: '3', price: '12.345' })
const validForm = () => ({ customerPoNo: 'PO01', customerName: 'Khách hàng', orderDate: '2026-11-10', items: [validLine()] })

describe('sale-out form', () => {
  it('accepts complete input, including a zero price', () => {
    expect(validateSaleOut(validForm())).toBe('')
    expect(validateSaleOutNumbers({ ...validLine(), price: '0' })).toBe('')
  })

  it.each(['customerPoNo', 'customerName', 'orderDate'])('requires header field %s', field => {
    expect(validateSaleOut({ ...validForm(), [field]: '' })).toMatch(/thông tin chung/)
  })

  it('requires at least one product', () => {
    expect(validateSaleOut({ ...validForm(), items: [] })).toMatch(/ít nhất một sản phẩm/)
  })

  it('requires a selected product', () => {
    expect(validateSaleOut({ ...validForm(), items: [{ ...validLine(), productId: '' }] })).toMatch(/chọn sản phẩm/)
  })

  it('rejects duplicate product IDs in the same document', () => {
    expect(validateSaleOut({ ...validForm(), items: [validLine(), validLine()] })).toMatch(/trùng/)
  })

  it.each([
    ['quantity', '0'], ['quantity', '-1'], ['quantity', '1.0001'],
    ['quantityPerBox', '0'], ['quantityPerBox', ''], ['price', '-1'], ['price', 'abc'],
  ])('rejects invalid %s: %s', (field, value) => {
    expect(validateSaleOutNumbers({ ...validLine(), [field]: value })).not.toBe('')
  })

  it('rejects a calculated amount beyond the database limit', () => {
    expect(validateSaleOutNumbers({ ...validLine(), quantity: '999999999999999', price: '2' })).toMatch(/Thành tiền vượt/)
  })

  it('rejects a calculated box count beyond the database limit', () => {
    expect(validateSaleOutNumbers({ ...validLine(), quantity: '999999999999999', quantityPerBox: '0.001', price: '0' })).toMatch(/Số thùng/)
  })

  it('calculates preview boxes without floating point over-rounding', () => {
    expect(calculateLine({ quantity: '0.07', quantityPerBox: '0.01', price: '2' }))
      .toEqual({ boxQuantity: 7, amount: 0.14 })
  })

  it('serializes only numeric line fields', () => {
    expect(toSaleOutNumbers({ ...validLine(), lineId: 10 })).toEqual({ quantity: 10, quantityPerBox: 3, price: 12.345 })
  })
})
