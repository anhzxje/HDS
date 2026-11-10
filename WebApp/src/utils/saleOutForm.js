import { isValidDecimal, MAX_DECIMAL_VALUE, ceilDecimalRatio } from './decimalRules'

export function calculateLine({ quantity, quantityPerBox, price }) {
  return {
    boxQuantity: ceilDecimalRatio(quantity, quantityPerBox),
    amount: Number(quantity) * Number(price),
  }
}

export function validateSaleOutNumbers(item) {
  if (!isValidDecimal(item.quantity, false)) return 'Số lượng phải dương, đúng giới hạn và tối đa 3 chữ số thập phân.'
  if (!isValidDecimal(item.quantityPerBox, false)) return 'Số lượng/thùng phải dương, đúng giới hạn và tối đa 3 chữ số thập phân.'
  if (!isValidDecimal(item.price)) return 'Đơn giá phải không âm, đúng giới hạn và tối đa 3 chữ số thập phân.'
  const calculated = calculateLine(item)
  if (!isValidDecimal(calculated.boxQuantity) || !Number.isFinite(calculated.amount)) {
    return 'Số thùng hoặc thành tiền vượt giới hạn cho phép.'
  }
  if (calculated.amount >= Number(MAX_DECIMAL_VALUE)) return 'Thành tiền vượt giới hạn cho phép.'
  return ''
}

export function validateSaleOut({ customerPoNo, customerName, orderDate, items }) {
  if (!customerPoNo.trim() || !customerName.trim() || !orderDate) return 'Vui lòng nhập đầy đủ thông tin chung.'
  if (!items.length) return 'Vui lòng thêm ít nhất một sản phẩm.'
  const seen = new Set()
  for (const item of items) {
    if (!item.productId) return 'Vui lòng chọn sản phẩm.'
    if (seen.has(item.productId)) return 'Sản phẩm bị trùng trong phiếu.'
    seen.add(item.productId)
    const error = validateSaleOutNumbers(item)
    if (error) return error
  }
  return ''
}

export function toSaleOutNumbers(item) {
  return { quantity: Number(item.quantity), quantityPerBox: Number(item.quantityPerBox), price: Number(item.price) }
}
