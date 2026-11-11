import i18n from '../i18n'
import { isValidDecimal, MAX_DECIMAL_VALUE, ceilDecimalRatio } from './decimalRules'

export function calculateLine({ quantity, quantityPerBox, price }) {
  return {
    boxQuantity: ceilDecimalRatio(quantity, quantityPerBox),
    amount: Number(quantity) * Number(price),
  }
}

export function validateSaleOutNumbers(item) {
  if (!isValidDecimal(item.quantity, false)) return i18n.t('validation.quantity')
  if (!isValidDecimal(item.quantityPerBox, false)) return i18n.t('validation.quantityPerBox')
  if (!isValidDecimal(item.price)) return i18n.t('validation.price')
  const calculated = calculateLine(item)
  if (!isValidDecimal(calculated.boxQuantity) || !Number.isFinite(calculated.amount)) {
    return i18n.t('validation.calculation')
  }
  if (calculated.amount >= Number(MAX_DECIMAL_VALUE)) return i18n.t('validation.amount')
  return ''
}

export function validateSaleOut({ customerPoNo, customerName, orderDate, items }) {
  if (!customerPoNo.trim() || !customerName.trim() || !orderDate) return i18n.t('validation.header')
  if (!items.length) return i18n.t('validation.lines')
  const seen = new Set()
  for (const item of items) {
    if (!item.productId) return i18n.t('validation.product')
    if (seen.has(item.productId)) return i18n.t('validation.duplicate')
    seen.add(item.productId)
    const error = validateSaleOutNumbers(item)
    if (error) return error
  }
  return ''
}

export function toSaleOutNumbers(item) {
  return { quantity: Number(item.quantity), quantityPerBox: Number(item.quantityPerBox), price: Number(item.price) }
}
