import { describe, expect, it, vi } from 'vitest'
import { buildPageQuery, requestJson, sendJson } from '@/shared/api/http'
import { importProducts } from '@/features/products/api/productApi'
import { importSaleOuts } from '@/features/saleouts/api/saleOutApi'

function mockResponse({ ok = true, status = 200, data = {} } = {}) {
  const fetch = vi.fn().mockResolvedValue({ ok, status, json: vi.fn().mockResolvedValue(data) })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

describe('HTTP requests and imports', () => {
  it('returns successful JSON', async () => {
    mockResponse({ data: { items: [] } })
    await expect(requestJson('/api/products')).resolves.toEqual({ items: [] })
  })

  it('handles 204 without trying to decode a body', async () => {
    const json = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json }))
    await expect(requestJson('/api/products/1')).resolves.toBeUndefined()
    expect(json).not.toHaveBeenCalled()
  })

  it('displays the API ProblemDetails message', async () => {
    mockResponse({ ok: false, status: 409, data: { message: 'Mã sản phẩm đã tồn tại.', traceId: 'trace-1' } })
    await expect(requestJson('/api/products', {}, 'Fallback')).rejects.toThrow('Mã sản phẩm đã tồn tại.')
  })

  it('uses field validation errors when there is no top-level message', async () => {
    mockResponse({ ok: false, status: 400, data: { errors: { name: ['Thiếu tên.'], code: ['Thiếu mã.'] } } })
    await expect(requestJson('/api/products', {}, 'Fallback')).rejects.toThrow('Thiếu tên. Thiếu mã.')
  })

  it('uses a safe fallback when the error response is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: vi.fn().mockRejectedValue(new SyntaxError()) }))
    await expect(requestJson('/api/products', {}, 'Không thể kết nối.')).rejects.toThrow('Không thể kết nối.')
  })

  it('preserves network rejection so the form can display it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')))
    await expect(requestJson('/api/products')).rejects.toThrow('Network error')
  })

  it.each([
    ['products', importProducts], ['saleouts', importSaleOuts],
  ])('sends %s imports as multipart with the field name file', async (resource, upload) => {
    const fetch = mockResponse({ data: { importedCount: 2 } })
    const file = new File(['workbook'], 'data.xlsx')
    await expect(upload(file)).resolves.toEqual({ importedCount: 2 })
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe(`/api/${resource}/import`)
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('file')).toBe(file)
    expect(options.headers).toBeUndefined() // Browser tự thêm multipart boundary.
  })

  it('serializes JSON payloads with the appropriate header', async () => {
    const fetch = mockResponse()
    await sendJson('/api/products', 'POST', { productCode: 'SP01' })
    expect(fetch).toHaveBeenCalledWith('/api/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"productCode":"SP01"}',
    })
  })

  it('encodes and trims search text', () => {
    const query = buildPageQuery({ field: 'ProductName', keyword: ' A&B ', page: 2, pageSize: 20 })
    expect(new URLSearchParams(query).get('keyword')).toBe('A&B')
    expect(query.get('page')).toBe('2')
    expect(query.toString()).toContain('A%26B')
  })

  it('omits search fields for blank keywords', () => {
    expect(buildPageQuery({ field: 'ProductName', keyword: ' ', page: 1, pageSize: 20 }).toString())
      .toBe('page=1&pageSize=20')
  })
})
