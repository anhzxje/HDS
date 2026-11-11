import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import useProducts from '@/features/products/hooks/useProducts'
import useSaleOuts from '@/features/saleouts/hooks/useSaleOuts'

const response = data => ({ ok: true, status: 200, json: async () => data })
for (const [name, useList, itemsKey] of [['products', useProducts, 'products'], ['saleouts', useSaleOuts, 'saleOuts']]) {
  describe(`${name} list lifecycle`, () => {
    it('aborts obsolete requests and ignores late responses even when transport ignores abort', async () => {
      const requests = []
      vi.stubGlobal('fetch', vi.fn((_url, { signal }) => {
        const pending = Promise.withResolvers()
        requests.push({ ...pending, signal })
        return pending.promise
      }))
      const { result, unmount } = renderHook(useList)
      await waitFor(() => expect(requests).toHaveLength(1))
      act(() => result.current.setPage(2))
      await waitFor(() => expect(requests).toHaveLength(2))
      expect(requests[0].signal.aborted).toBe(true)
      await act(async () => requests[1].resolve(response({ items: [{ id: 'new' }], totalCount: 42 })))
      await act(async () => requests[0].resolve(response({ items: [{ id: 'old' }], totalCount: 1 })))
      expect(result.current[itemsKey]).toEqual([{ id: 'new' }])
      expect(result.current.totalCount).toBe(42)
      expect(result.current.isLoading).toBe(false)
      unmount()
      expect(requests[1].signal.aborted).toBe(true)
    })

    it('clears rows on load failure and recovers through reload', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(response({ items: [{ id: '1' }], totalCount: 100 }))
        .mockRejectedValueOnce(new Error('Backend unavailable'))
        .mockResolvedValueOnce(response({ items: [{ id: '2' }], totalCount: 1 })))
      const { result } = renderHook(useList)
      await waitFor(() => expect(result.current[itemsKey]).toEqual([{ id: '1' }]))
      act(() => result.current.applySearch({ field: 'ProductCode', keyword: 'SP01' }))
      await waitFor(() => expect(result.current.errorMessage).toBe('Backend unavailable'))
      expect(result.current[itemsKey]).toEqual([])
      expect(result.current.totalCount).toBe(0)
      act(() => result.current.reload())
      await waitFor(() => expect(result.current[itemsKey]).toEqual([{ id: '2' }]))
      expect(result.current.errorMessage).toBe('')
      expect(result.current.totalPages).toBe(1)
      expect(fetch.mock.calls.at(-1)[0]).toContain('field=ProductCode&keyword=SP01')
    })
  })
}
