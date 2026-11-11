import i18n from '@/shared/i18n'
import { isValidDecimal, MAX_DECIMAL_VALUE, ceilDecimalRatio } from '@/shared/lib/decimalRules'

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

export function createLine(lineId) {
  return { lineId, productId: '', quantity: '', quantityPerBox: '', price: '' }
}

export function createForm(item) {
  const line = item ? { ...createLine(0), productId: item.productId,
    quantity: item.quantity, quantityPerBox: item.quantityPerBox, price: item.price } : createLine(0)
  return { customerPoNo: item?.customerPoNo ?? '', customerName: item?.customerName ?? '',
    orderDate: item?.orderDate ?? '', items: [line] }
}

export function buildPayload(form) {
  const items = form.items.map(line => ({ productId: line.productId, ...toSaleOutNumbers(line) }))
  return { ...form, items }
}

export function updateFormLine(form, products, lineId, field, value) {
  const items = form.items.map(line => {
    if (line.lineId !== lineId) return line
    if (field !== 'productId') return { ...line, [field]: value }
    const product = products.find(option => option.id === value)
    return { ...line, productId: value, quantityPerBox: product?.quantityPerBox ?? '' }
  })
  return { ...form, items }
}

