export function calculateLine({ quantity, quantityPerBox, price }) {
  return {
    boxQuantity: Number(quantityPerBox) > 0 ? Number(quantity) / Number(quantityPerBox) : 0,
    amount: Number(quantity) * Number(price),
  }
}

export function validateSaleOut({ customerPoNo, customerName, orderDate, items }) {
  if (!customerPoNo.trim() || !customerName.trim() || !orderDate) return 'Vui lòng nhập đầy đủ thông tin chung.'
  if (!items.length) return 'Vui lòng thêm ít nhất một sản phẩm.'
  const seen = new Set()
  for (const item of items) {
    if (!item.productId) return 'Vui lòng chọn sản phẩm.'
    if (seen.has(item.productId)) return 'Sản phẩm bị trùng trong phiếu.'
    seen.add(item.productId)
    if (!item.quantity || Number(item.quantity) <= 0) return 'Số lượng phải lớn hơn 0.'
    if (!item.quantityPerBox || Number(item.quantityPerBox) <= 0) return 'Số lượng/thùng phải lớn hơn 0.'
    if (item.price === '' || Number(item.price) < 0) return 'Đơn giá phải lớn hơn hoặc bằng 0.'
  }
  return ''
}
