export const MAX_DECIMAL_VALUE = '999999999999999.999'
export const DECIMAL_SCALE = 3
export const DECIMAL_STEP = '0.001'

export function isValidDecimal(value, allowZero = true) {
  if (value === null || value === undefined || String(value).trim() === '') return false
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0 || (!allowZero && number === 0)) return false
  // Number làm tròn giới hạn decimal(18,3) thành 10^15; không gửi giá trị vượt giới hạn đó.
  if (number >= Number(MAX_DECIMAL_VALUE)) return false
  if (number !== 0 && number < Number(DECIMAL_STEP)) return false
  const fraction = number.toString().split('.')[1] ?? ''
  return fraction.length <= DECIMAL_SCALE
}

export function ceilDecimalRatio(quantity, quantityPerBox) {
  if (!isValidDecimal(quantity, false) || !isValidDecimal(quantityPerBox, false)) return 0
  // Chia theo đơn vị 0.001 để tránh làm tròn lên sai do sai số số thực, ví dụ 0.07 / 0.01.
  const quantityUnits = BigInt(Number(quantity).toFixed(DECIMAL_SCALE).replace('.', ''))
  const boxUnits = BigInt(Number(quantityPerBox).toFixed(DECIMAL_SCALE).replace('.', ''))
  return Number((quantityUnits + boxUnits - 1n) / boxUnits)
}
