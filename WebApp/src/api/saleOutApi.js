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

