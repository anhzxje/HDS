import { isValidDecimal } from './decimalRules'

export function createProductForm(product) {
  return {
    productCode: product?.productCode ?? '',
    productName: product?.productName ?? '',
    unit: product?.unit ?? '',
    specification: product?.specification ?? '',
    quantityPerBox: product?.quantityPerBox ?? '',
    productWeight: product?.productWeight ?? '',
  }
}

export function buildProductPayload(form, isEditing) {
  const textFields = isEditing
    ? ['unit', 'specification']
    : ['productCode', 'productName', 'unit', 'specification']
  const payload = Object.fromEntries(textFields.map(field => [field, form[field].trim()]))
  if (Object.values(payload).some(value => !value)) {
    throw new Error('Vui lòng nhập đầy đủ thông tin sản phẩm.')
  }
  for (const field of ['quantityPerBox', 'productWeight']) {
    const value = String(form[field]).trim()
    if (!isValidDecimal(value)) {
      throw new Error('Số lượng/thùng và trọng lượng phải không âm, đúng giới hạn và tối đa 3 chữ số thập phân.')
    }
    payload[field] = Number(value)
  }
  return payload
}
