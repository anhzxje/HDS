/**
 * Tiện ích định dạng ngày tháng và số liệu cho toàn bộ ứng dụng
 */

/**
 * Định dạng ngày từ số nguyên yyyyMMdd (ví dụ: 20261106 -> 06/11/2026)
 */
export function formatOrderDate(dateInt) {
  if (!dateInt) return ''
  const str = dateInt.toString()
  if (str.length !== 8) return str
  const yyyy = str.substring(0, 4)
  const mm = str.substring(4, 6)
  const dd = str.substring(6, 8)
  return `${dd}/${mm}/${yyyy}`
}

/**
 * Định dạng số với số chữ số thập phân tùy chọn
 */
export function formatNumber(num, fractionDigits = 0) {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('vi-VN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

/**
 * Định dạng số tiền VNĐ (ví dụ: 12.000.000 đ)
 */
export function formatCurrency(num) {
  return `${formatNumber(num)} đ`
}

