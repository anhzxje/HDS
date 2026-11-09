/**
 * Module API cho nghiệp vụ Xuất hàng (SaleOut)
 */

export async function fetchSaleOuts({ field, keyword, page = 1, pageSize = 50, signal }) {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  })

  if (keyword && keyword.trim()) {
    params.set('field', field)
    params.set('keyword', keyword.trim())
  }

  const res = await fetch(`/api/saleouts?${params.toString()}`, { signal })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || 'Lỗi khi tải danh sách xuất hàng.')
  }

  return await res.json()
}


export async function fetchProductChoices(signal) {
  const res = await fetch('/api/products/choices', { signal })
  if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm.')
  return res.json()
}

export async function createSaleOut(payload) {
  const res = await fetch('/api/saleouts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || Object.values(data.errors || {}).flat().join(' ') || 'Không thể tạo phiếu xuất hàng.')
  return data
}

async function changeSaleOut(id, method, payload) {
  const res = await fetch(`/api/saleouts/${encodeURIComponent(id)}`, {
    method,
    ...(payload && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || Object.values(data.errors || {}).flat().join(' ') || 'Không thể cập nhật xuất hàng.')
  }
}

export const updateSaleOut = (id, payload) => changeSaleOut(id, 'PUT', payload)
export const deleteSaleOut = (id) => changeSaleOut(id, 'DELETE')

export async function importSaleOuts(file) {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/saleouts/import', { method: 'POST', body })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Không thể tải lên dữ liệu xuất hàng.')
  return data
}
