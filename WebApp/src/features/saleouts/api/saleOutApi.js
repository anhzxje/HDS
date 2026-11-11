import i18n from '@/shared/i18n'
import { buildPageQuery, requestJson, sendJson, uploadFile } from '@/shared/api/http'

export function fetchSaleOuts({ field, keyword, page = 1, pageSize = 50, signal }) {
  const query = buildPageQuery({ field, keyword, page, pageSize })
  return requestJson(`/api/saleouts?${query}`, { signal }, i18n.t('error.saleOuts'))
}

export function createSaleOut(payload) {
  return sendJson('/api/saleouts', 'POST', payload, i18n.t('error.saleOutCreate'))
}

export function updateSaleOut(id, payload) {
  return sendJson(`/api/saleouts/${encodeURIComponent(id)}`, 'PUT', payload, i18n.t('error.saleOutUpdate'))
}

export function deleteSaleOut(id) {
  return sendJson(`/api/saleouts/${encodeURIComponent(id)}`, 'DELETE', undefined, i18n.t('error.saleOutDelete'))
}

export function importSaleOuts(file) {
  return uploadFile('/api/saleouts/import', file, i18n.t('error.saleOutImport'))
}

export function fetchSaleOutNumbers(signal) {
  return requestJson('/api/saleouts/choices', { signal }, i18n.t('error.numbers'))
}
