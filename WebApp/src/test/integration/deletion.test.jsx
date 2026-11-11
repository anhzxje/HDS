import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Swal from 'sweetalert2'
import useProducts from '@/features/products/hooks/useProducts'
import useSaleOuts from '@/features/saleouts/hooks/useSaleOuts'

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }))
const item = { id: 'id/1', productName: '<b>Product</b>', productCode: 'SP01', saleOutNo: 'STO01' }
beforeEach(() => {
  Swal.fire.mockReset().mockResolvedValue({ isConfirmed: true })
  vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
    if (options?.method === 'DELETE') return { ok: true, status: 204 }
    return { ok: true, status: 200, json: async () => ({ items: [item], totalCount: 21 }) }
  }))
})
for (const [name, hook, endpoint] of [['products', useProducts, 'products'], ['saleouts', useSaleOuts, 'saleouts']]) {
  describe(name, () => {
    it('cancels deletion without sending DELETE and passes text without HTML', async () => {
      Swal.fire.mockResolvedValue({ isConfirmed: false })
      const { result } = renderHook(hook)
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await act(async () => result.current.remove(item))
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'warning', showCancelButton: true }))
      expect(Swal.fire.mock.calls[0][0]).not.toHaveProperty('html')
      expect(fetch.mock.calls.some(([, options]) => options.method === 'DELETE')).toBe(false)
      expect(result.current.deletingId).toBe(null)
    })
    it('confirms once, encodes the id and retreats after deleting the last row', async () => {
      const { result } = renderHook(hook)
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      act(() => result.current.setPage(2))
      await waitFor(() => expect(fetch.mock.calls.at(-1)[0]).toContain('page=2'))
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await act(async () => result.current.remove(item))
      expect(fetch).toHaveBeenCalledWith(`/api/${endpoint}/id%2F1`, { method: 'DELETE' })
      expect(result.current.page).toBe(1)
      expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'success' }))
    })
    it('locks repeated clicks while confirmation is pending', async () => {
      const pending = Promise.withResolvers()
      Swal.fire.mockReturnValueOnce(pending.promise)
      const { result } = renderHook(hook)
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      let deletion
      act(() => { deletion = result.current.remove(item) })
      await act(async () => result.current.remove(item))
      expect(Swal.fire).toHaveBeenCalledTimes(1)
      await act(async () => { pending.resolve({ isConfirmed: false }); await deletion })
      expect(result.current.deletingId).toBe(null)
    })
    it('preserves Backend errors and releases deletion state for retry', async () => {
      const { result } = renderHook(hook)
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Không thể xóa: đang được sử dụng.' }) })
      await act(async () => result.current.remove(item))
      expect(result.current.errorMessage).toBe('Không thể xóa: đang được sử dụng.')
      expect(result.current.deletingId).toBe(null)
      expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'error', text: 'Không thể xóa: đang được sử dụng.' }))
    })
  })
}
