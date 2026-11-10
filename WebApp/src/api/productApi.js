import { buildPageQuery, requestJson, sendJson, uploadFile } from './http'

export function fetchProducts({ field, keyword, page = 1, pageSize = 20, signal }) {
  const query = buildPageQuery({ field, keyword, page, pageSize })
  return requestJson(`/api/products?${query}`, { signal }, 'Không thể tải danh sách sản phẩm.')
}

export function createProduct(payload) {
  return sendJson('/api/products', 'POST', payload, 'Không thể tạo sản phẩm.')
}

export function updateProduct(id, payload) {
  return sendJson(`/api/products/${encodeURIComponent(id)}`, 'PUT', payload, 'Không thể cập nhật sản phẩm.')
}

export function deleteProduct(id) {
  return sendJson(`/api/products/${encodeURIComponent(id)}`, 'DELETE', undefined, 'Không thể xoá sản phẩm.')
}

export function importProducts(file) {
  return uploadFile('/api/products/import', file, 'Không thể upload dữ liệu.')
}

export function fetchProductChoices(signal) {
  return requestJson('/api/products/choices', { signal }, 'Không thể tải danh sách sản phẩm.')
}
