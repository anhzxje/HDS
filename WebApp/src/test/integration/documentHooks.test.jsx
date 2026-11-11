import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import Swal from 'sweetalert2'
import useSaleOutPrint from '@/features/saleouts/hooks/useSaleOutPrint'
import useRevenueReport from '@/features/saleouts/hooks/useRevenueReport'
import { downloadFile } from '@/shared/lib/downloads'
import i18n from '@/shared/i18n'

vi.mock('@/shared/lib/downloads', () => ({ downloadFile: vi.fn() }))
const event = () => ({ preventDefault: vi.fn() })

it('rejects PDF export without a selection and shows a warning', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
  const { result } = renderHook(useSaleOutPrint)
  await waitFor(() => expect(result.current.loading).toBe(false))
  act(() => result.current.handleExport(event()))
  expect(result.current.error).toBe(i18n.t('validation.number'))
  await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'warning' })))
  expect(downloadFile).not.toHaveBeenCalled()
})

it('shows the backend PDF-choice error and releases loading', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unavailable')))
  const { result } = renderHook(useSaleOutPrint)
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.error).toBe('Unavailable')
  await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: 'Unavailable' })))
})

it('aborts choices on unmount and ignores a late response', async () => {
  let resolve
  vi.stubGlobal('fetch', vi.fn(() => new Promise(done => { resolve = done })))
  const { unmount } = renderHook(useSaleOutPrint)
  const signal = fetch.mock.calls[0][1].signal
  unmount()
  expect(signal.aborted).toBe(true)
  await act(async () => { resolve({ ok: true, json: async () => ['STO'] }) })
  expect(downloadFile).not.toHaveBeenCalled()
})

it('ignores an aborted PDF-choice request without an error toast', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')))
  const { result } = renderHook(useSaleOutPrint)
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.error).toBe('')
  expect(Swal.fire).not.toHaveBeenCalled()
})

it.each([['', ''], ['2026-11-01', ''], ['', '2026-11-30']])('blocks report export with incomplete dates (%s, %s)', (start, end) => {
  const { result } = renderHook(useRevenueReport)
  act(() => { result.current.setStartDate(start); result.current.setEndDate(end) })
  act(() => result.current.handleExport(event()))
  expect(result.current.error).toBe(i18n.t('validation.dates'))
  expect(downloadFile).not.toHaveBeenCalled()
})
