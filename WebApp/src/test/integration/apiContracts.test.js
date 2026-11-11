import { expect, it, vi } from 'vitest'
import * as products from '@/features/products/api/productApi'
import * as saleouts from '@/features/saleouts/api/saleOutApi'
import { requestJson } from '@/shared/api/http'

for (const [resource, api, names] of [
  ['products', products, ['fetchProducts', 'createProduct', 'updateProduct', 'deleteProduct', 'fetchProductChoices']],
  ['saleouts', saleouts, ['fetchSaleOuts', 'createSaleOut', 'updateSaleOut', 'deleteSaleOut', 'fetchSaleOutNumbers']],
]) {
  it(`${resource} service preserves CRUD, encoded IDs, choices and default paging contracts`, async () => {
    const response = { items: [], totalCount: 0 }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => response }))
    const controller = new AbortController()
    expect(await api[names[0]]({ signal: controller.signal })).toBe(response)
    const [url, options] = fetch.mock.calls.at(-1)
    expect(url).toBe(`/api/${resource}?page=1&pageSize=${resource === 'products' ? 20 : 50}`)
    expect(options.signal).toBe(controller.signal)
    const payload = { customerPoNo: 'PO', quantity: 1.005 }
    await api[names[1]](payload)
    expect(fetch).toHaveBeenLastCalledWith(`/api/${resource}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    await api[names[2]]('id/ #', payload)
    expect(fetch.mock.calls.at(-1)).toEqual([`/api/${resource}/id%2F%20%23`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }])
    await api[names[3]]('id/ #')
    expect(fetch).toHaveBeenLastCalledWith(`/api/${resource}/id%2F%20%23`, { method: 'DELETE' })
    await api[names[4]](controller.signal)
    expect(fetch).toHaveBeenLastCalledWith(`/api/${resource}/choices`, { signal: controller.signal })
  })
}

it.each([400, 404, 409, 500])('preserves the ProblemDetails message for HTTP %i', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status, json: async () => ({ message: `Backend ${status}` }) }))
  await expect(requestJson('/api/products', {}, 'Fallback')).rejects.toThrow(`Backend ${status}`)
})

it('uses the fallback for an empty JSON error and preserves cancellation identity', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }))
  await expect(requestJson('/api/products', {}, 'Fallback')).rejects.toThrow('Fallback')
  const error = new DOMException('Request aborted', 'AbortError')
  fetch.mockRejectedValueOnce(error)
  await expect(products.fetchProducts({ signal: AbortSignal.abort() })).rejects.toBe(error)
})
