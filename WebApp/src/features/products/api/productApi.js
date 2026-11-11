import i18n from '@/shared/i18n'
import { buildPageQuery, requestJson, sendJson, uploadFile } from '@/shared/api/http'

export function fetchProducts({ field, keyword, page = 1, pageSize = 20, signal }) {
  const query = buildPageQuery({ field, keyword, page, pageSize })
  return requestJson(`/api/products?${query}`, { signal }, i18n.t('error.products'))
}

export function createProduct(payload) {
  return sendJson('/api/products', 'POST', payload, i18n.t('error.productCreate'))
}

export function updateProduct(id, payload) {
  return sendJson(`/api/products/${encodeURIComponent(id)}`, 'PUT', payload, i18n.t('error.productUpdate'))
}

export function deleteProduct(id) {
  return sendJson(`/api/products/${encodeURIComponent(id)}`, 'DELETE', undefined, i18n.t('error.productDelete'))
}

export function importProducts(file) {
  return uploadFile('/api/products/import', file, i18n.t('error.productImport'))
}

export function fetchProductChoices(signal) {
  return requestJson('/api/products/choices', { signal }, i18n.t('error.products'))
}
