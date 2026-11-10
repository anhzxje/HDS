import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProduct, updateProduct } from '../../api/productApi'
import useProductForm from './useProductForm'

vi.mock('../../api/productApi', () => ({ createProduct: vi.fn(), updateProduct: vi.fn() }))
const form = { productCode: ' SP01 ', productName: ' Sản phẩm ', unit: ' Cái ', specification: ' Hộp ', quantityPerBox: '12', productWeight: '0.5' }
const event = () => ({ preventDefault: vi.fn() })

beforeEach(() => {
  createProduct.mockReset()
  updateProduct.mockReset()
})

describe('useProductForm', () => {
  it('blocks saving an incomplete form before calling the API', async () => {
    const onSaved = vi.fn()
    const { result } = renderHook(() => useProductForm(null, onSaved))
    await act(async () => { await result.current.save(event()) })
    expect(result.current.error).toMatch(/đầy đủ/)
    expect(createProduct).not.toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()
    expect(result.current.saving).toBe(false)
  })

  it('submits a valid creation and notifies the parent', async () => {
    createProduct.mockResolvedValue({ newId: 'new-product' })
    const onSaved = vi.fn()
    const { result } = renderHook(() => useProductForm(null, onSaved))
    act(() => result.current.setForm(form))
    await act(async () => { await result.current.save(event()) })
    expect(createProduct).toHaveBeenCalledWith({ productCode: 'SP01', productName: 'Sản phẩm', unit: 'Cái', specification: 'Hộp', quantityPerBox: 12, productWeight: 0.5 })
    expect(updateProduct).not.toHaveBeenCalled()
    expect(onSaved).toHaveBeenCalledWith({ newId: 'new-product' })
    expect(result.current.saving).toBe(false)
  })

  it('updates only editable product fields', async () => {
    updateProduct.mockResolvedValue(undefined)
    const { result } = renderHook(() => useProductForm({ ...form, id: 'existing' }, vi.fn()))
    await act(async () => { await result.current.save(event()) })
    expect(updateProduct).toHaveBeenCalledWith('existing', { unit: 'Cái', specification: 'Hộp', quantityPerBox: 12, productWeight: 0.5 })
    expect(createProduct).not.toHaveBeenCalled()
  })

  it('prevents a second save while the first request is pending', async () => {
    const pending = Promise.withResolvers()
    createProduct.mockReturnValue(pending.promise)
    const { result } = renderHook(() => useProductForm(null, vi.fn()))
    act(() => result.current.setForm(form))
    let saving
    act(() => { saving = result.current.save(event()) })
    expect(result.current.saving).toBe(true)
    await act(async () => { await result.current.save(event()) })
    expect(createProduct).toHaveBeenCalledTimes(1)
    await act(async () => { pending.resolve({ newId: 'new' }); await saving })
    expect(result.current.saving).toBe(false)
  })

  it('preserves input and displays API errors so the user can retry', async () => {
    createProduct.mockRejectedValueOnce(new Error('Mã đã tồn tại.')).mockResolvedValueOnce({ newId: 'new' })
    const onSaved = vi.fn()
    const { result } = renderHook(() => useProductForm(null, onSaved))
    act(() => result.current.setForm(form))
    await act(async () => { await result.current.save(event()) })
    expect(result.current.error).toBe('Mã đã tồn tại.')
    expect(result.current.form).toEqual(form)
    expect(onSaved).not.toHaveBeenCalled()
    expect(result.current.saving).toBe(false)
    await act(async () => { await result.current.save(event()) })
    expect(result.current.error).toBe('')
    expect(onSaved).toHaveBeenCalledOnce()
  })
})
