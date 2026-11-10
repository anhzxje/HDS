import { buildPageQuery, requestJson, sendJson, uploadFile } from './http'

export function fetchSaleOuts({ field, keyword, page = 1, pageSize = 50, signal }) {
  const query = buildPageQuery({ field, keyword, page, pageSize })
  return requestJson(`/api/saleouts?${query}`, { signal }, 'Không thể tải danh sách xuất hàng.')
}

export function createSaleOut(payload) {
  return sendJson('/api/saleouts', 'POST', payload, 'Không thể tạo phiếu xuất hàng.')
}

export function updateSaleOut(id, payload) {
  return sendJson(`/api/saleouts/${encodeURIComponent(id)}`, 'PUT', payload, 'Không thể cập nhật xuất hàng.')
}

export function deleteSaleOut(id) {
  return sendJson(`/api/saleouts/${encodeURIComponent(id)}`, 'DELETE', undefined, 'Không thể xóa xuất hàng.')
}

export function importSaleOuts(file) {
  return uploadFile('/api/saleouts/import', file, 'Không thể tải lên dữ liệu xuất hàng.')
}

export function fetchSaleOutNumbers(signal) {
  return requestJson('/api/saleouts/choices', { signal }, 'Không thể tải danh sách mã số phiếu.')
}
