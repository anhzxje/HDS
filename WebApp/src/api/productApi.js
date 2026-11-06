/**
 * Module API cho nghiệp vụ Master Sản phẩm (MasterProduct)
 */

export async function fetchProducts({ field, keyword, page = 1, pageSize = 20, signal }) {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  })

  if (keyword && keyword.trim()) {
    params.set('field', field)
    params.set('keyword', keyword.trim())
  }

  const res = await fetch(`/api/products?${params.toString()}`, { signal })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || 'Không thể tải danh sách sản phẩm.')
  }

  return await res.json()
}

export async function createProduct(payload) {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tạo sản phẩm.')
  }

  return data
}

export async function updateProduct(id, payload) {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Không thể cập nhật sản phẩm.')
  }
}

export async function deleteProduct(id) {
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Không thể xoá sản phẩm.')
  }
}

export async function importProductsExcel(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/products/import', {
    method: 'POST',
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Không thể upload dữ liệu.')
  }

  return data
}

