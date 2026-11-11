import { describe, expect, it } from 'vitest'
import { buildProductPayload, createProductForm } from './productForm'

const validForm = () => ({
  productCode: ' SP01 ', productName: ' Sản phẩm ', unit: ' Cái ',
  specification: ' Hộp ', quantityPerBox: '12.345', productWeight: '0',
})

describe('product form', () => {
  it('initializes a blank creation form', () => {
    expect(Object.values(createProductForm())).toEqual(['', '', '', '', '', ''])
  })

  it('keeps existing zero values when editing', () => {
    expect(createProductForm({ quantityPerBox: 0, productWeight: 0 }))
      .toMatchObject({ quantityPerBox: 0, productWeight: 0 })
  })

  it('trims text and sends decimal inputs as numbers', () => {
    expect(buildProductPayload(validForm(), false)).toEqual({
      productCode: 'SP01', productName: 'Sản phẩm', unit: 'Cái',
      specification: 'Hộp', quantityPerBox: 12.345, productWeight: 0,
    })
  })

  it('omits immutable code and name when editing', () => {
    const payload = buildProductPayload({ ...validForm(), productCode: '', productName: '' }, true)
    expect(payload).not.toHaveProperty('productCode')
    expect(payload).not.toHaveProperty('productName')
    expect(payload.unit).toBe('Cái')
  })

  it.each(['productCode', 'productName', 'unit', 'specification'])('rejects blank required text: %s', field => {
    expect(() => buildProductPayload({ ...validForm(), [field]: ' ' }, false)).toThrow(/đầy đủ/)
  })

  it.each([
    ['quantityPerBox', ''], ['quantityPerBox', '-1'], ['quantityPerBox', '1.0001'],
    ['productWeight', 'abc'], ['productWeight', '1000000000000000'],
  ])('rejects invalid %s: %s', (field, value) => {
    expect(() => buildProductPayload({ ...validForm(), [field]: value }, false)).toThrow(/3 chữ số thập phân/)
  })
})
