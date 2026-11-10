import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchProductChoices } from '../../api/productApi'
import { createSaleOut, updateSaleOut } from '../../api/saleOutApi'
import useSaleOutForm from './useSaleOutForm'

vi.mock('../../api/productApi', () => ({ fetchProductChoices: vi.fn() }))
vi.mock('../../api/saleOutApi', () => ({ createSaleOut: vi.fn(), updateSaleOut: vi.fn() }))
const products = [{ id: 'product-1', quantityPerBox: 12 }, { id: 'product-2', quantityPerBox: 6 }]
const event = () => ({ preventDefault: vi.fn() })

beforeEach(() => {
  fetchProductChoices.mockReset().mockResolvedValue(products)
  createSaleOut.mockReset()
  updateSaleOut.mockReset()
})

async function renderCreate(onSaved = vi.fn()) {
  const hook = renderHook(() => useSaleOutForm(null, onSaved))
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  return hook
}

function fillForm(result) {
  act(() => {
    result.current.updateHeader('customerPoNo', 'PO01')
    result.current.updateHeader('customerName', 'Khách hàng')
    result.current.updateHeader('orderDate', '2026-11-10')
    result.current.updateLine(0, 'productId', 'product-1')
    result.current.updateLine(0, 'quantity', '13')
    result.current.updateLine(0, 'price', '2.345')
  })
}

describe('useSaleOutForm', () => {
  it('does not save while product choices are still loading', async () => {
    fetchProductChoices.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useSaleOutForm(null, vi.fn()))
    expect(result.current.loading).toBe(true)
    await act(async () => { await result.current.save(event()) })
    expect(createSaleOut).not.toHaveBeenCalled()
  })

  it('copies packing quantity from the selected product', async () => {
    const { result } = await renderCreate()
    act(() => result.current.updateLine(0, 'productId', 'product-2'))
    expect(result.current.form.items[0]).toMatchObject({ productId: 'product-2', quantityPerBox: 6 })
    act(() => result.current.updateLine(0, 'productId', ''))
    expect(result.current.form.items[0].quantityPerBox).toBe('')
  })

  it('adds/removes lines but retains at least one input line', async () => {
    const { result } = await renderCreate()
    act(() => result.current.addLine())
    expect(result.current.form.items).toHaveLength(2)
    act(() => result.current.removeLine(0))
    expect(result.current.form.items[0].lineId).toBe(1)
    act(() => result.current.removeLine(1))
    expect(result.current.form.items).toHaveLength(1)
  })

  it('blocks duplicate products before calling the API', async () => {
    const { result } = await renderCreate()
    fillForm(result)
    act(() => result.current.addLine())
    act(() => result.current.updateLine(1, 'productId', 'product-1'))
    await act(async () => { await result.current.save(event()) })
    expect(result.current.error).toMatch(/trùng/)
    expect(createSaleOut).not.toHaveBeenCalled()
  })

  it('creates a document with numeric values and no UI line IDs', async () => {
    createSaleOut.mockResolvedValue({ saleOutNo: 'STO2026110001' })
    const onSaved = vi.fn()
    const { result } = await renderCreate(onSaved)
    fillForm(result)
    await act(async () => { await result.current.save(event()) })
    expect(createSaleOut).toHaveBeenCalledWith({
      customerPoNo: 'PO01', customerName: 'Khách hàng', orderDate: '2026-11-10',
      items: [{ productId: 'product-1', quantity: 13, quantityPerBox: 12, price: 2.345 }],
    })
    expect(onSaved).toHaveBeenCalledWith({ saleOutNo: 'STO2026110001' })
    expect(result.current.saving).toBe(false)
  })

  it('edits line numbers without fetching choices or changing the header', async () => {
    updateSaleOut.mockResolvedValue(undefined)
    const item = { id: 'line-1', productId: 'product-1', quantity: 3, quantityPerBox: 2, price: 1 }
    const { result } = renderHook(() => useSaleOutForm(item, vi.fn()))
    act(() => result.current.updateLine(0, 'quantity', '4'))
    await act(async () => { await result.current.save(event()) })
    expect(fetchProductChoices).not.toHaveBeenCalled()
    expect(updateSaleOut).toHaveBeenCalledWith('line-1', { quantity: 4, quantityPerBox: 2, price: 1 })
    expect(createSaleOut).not.toHaveBeenCalled()
  })

  it('displays API rejection and releases the saving state', async () => {
    createSaleOut.mockRejectedValue(new Error('PO đã tồn tại.'))
    const onSaved = vi.fn()
    const { result } = await renderCreate(onSaved)
    fillForm(result)
    await act(async () => { await result.current.save(event()) })
    expect(result.current.error).toBe('PO đã tồn tại.')
    expect(result.current.saving).toBe(false)
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('displays a product choice loading error', async () => {
    fetchProductChoices.mockRejectedValue(new Error('Không tải được sản phẩm.'))
    const { result } = await renderCreate()
    expect(result.current.error).toBe('Không tải được sản phẩm.')
  })

  it('aborts product loading when the form unmounts', () => {
    fetchProductChoices.mockReturnValue(new Promise(() => {}))
    const { unmount } = renderHook(() => useSaleOutForm(null, vi.fn()))
    const signal = fetchProductChoices.mock.calls[0][0]
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
  })
})
