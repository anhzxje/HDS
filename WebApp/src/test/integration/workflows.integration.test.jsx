import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { createAppStore } from '@/app/store'
import { setLanguage } from '@/app/store/preferencesSlice'
import AppProviders from '@/app/providers/AppProviders'
import ProductFormDialog from '@/features/products/components/ProductFormDialog'
import SaleOutFormDialog from '@/features/saleouts/components/SaleOutFormDialog'
import SaleOutPrintDialog from '@/features/saleouts/components/SaleOutPrintDialog'
import SaleOutReportDialog from '@/features/saleouts/components/SaleOutReportDialog'
import ProductToolbar from '@/features/products/components/ProductToolbar'
import SaleOutToolbar from '@/features/saleouts/components/SaleOutToolbar'
import useProducts from '@/features/products/hooks/useProducts'
import useSaleOuts from '@/features/saleouts/hooks/useSaleOuts'
import { downloadFile } from '@/shared/lib/downloads'
import i18n from '@/shared/i18n'
import viDictionary from '@/locales/vi.json'
import enDictionary from '@/locales/en.json'

vi.mock('@/shared/lib/downloads', async importOriginal => ({ ...await importOriginal(), downloadFile: vi.fn() }))
const json = data => ({ ok: true, status: 200, json: async () => data })
function mount(component) {
  render(<Provider store={createAppStore()}><AppProviders>{component}</AppProviders></Provider>)
}

it('keeps product identity read-only and numeric input constraints on the real inputs', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }))
  const onSaved = vi.fn()
  mount(<ProductFormDialog item={{ id: 'p1', productCode: 'SP01', productName: 'Product', unit: 'Box', specification: 'A', quantityPerBox: 12, productWeight: 0.5 }} onClose={vi.fn()} onSaved={onSaved} />)
  expect(screen.getByRole('textbox', { name: /Mã sản phẩm/ })).toBeDisabled()
  expect(screen.getByRole('textbox', { name: /Tên sản phẩm/ })).toBeDisabled()
  const quantity = screen.getByRole('spinbutton', { name: /Số lượng\/Thùng/ })
  expect(quantity).toHaveAttribute('step', '0.001')
  expect(quantity).toHaveAttribute('min', '0')
  expect(quantity).toHaveAttribute('max', '999999999999999.999')
  await user.clear(quantity)
  await user.type(quantity, '5.125')
  await user.click(screen.getByRole('button', { name: 'Lưu' }))
  await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
  const [url, options] = fetch.mock.calls[0]
  expect(url).toBe('/api/products/p1')
  expect(options.method).toBe('PUT')
  expect(JSON.parse(options.body)).toEqual({ unit: 'Box', specification: 'A', quantityPerBox: 5.125, productWeight: 0.5 })
})

it('creates sale outs through the MUI form with calculated packing quantity and original payload', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn(async (url, options) => options?.method === 'POST' ? json({ saleOutNo: 'STO01' }) :
    json([{ id: 'p1', productCode: 'SP01', productName: 'Product', unit: 'Box', quantityPerBox: 12 }])))
  const onSaved = vi.fn()
  mount(<SaleOutFormDialog onSaved={onSaved} onClose={vi.fn()} />)
  await user.type(screen.getByRole('textbox', { name: /Số PO khách hàng/ }), 'PO1')
  await user.type(screen.getByRole('textbox', { name: /Khách hàng/ }), 'Customer')
  fireEvent.change(screen.getByLabelText(/Ngày đặt hàng/), { target: { value: '2026-11-11' } })
  const product = screen.getByRole('combobox', { name: /Sản phẩm/ })
  await waitFor(() => expect(product).toBeEnabled())
  expect(product.labels[0]).toHaveAttribute('data-shrink', 'true')
  await user.selectOptions(product, 'p1')
  expect(product.labels[0]).toHaveAttribute('data-shrink', 'true')
  expect(screen.getByRole('spinbutton', { name: /Số lượng\/thùng/i })).toHaveValue(12)
  await user.type(screen.getByRole('spinbutton', { name: 'Số lượng' }), '13')
  await user.type(screen.getByRole('spinbutton', { name: /Đơn giá/ }), '2.345')
  await user.click(screen.getByRole('button', { name: 'Lưu' }))
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ saleOutNo: 'STO01' }))
  const [, options] = fetch.mock.calls.find(([url]) => url === '/api/saleouts')
  expect(JSON.parse(options.body)).toEqual({ customerPoNo: 'PO1', customerName: 'Customer', orderDate: '2026-11-11',
    items: [{ productId: 'p1', quantity: 13, quantityPerBox: 12, price: 2.345 }] })
})

it('exports PDF using the selected encoded number', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(['STO/01 #'])))
  mount(<SaleOutPrintDialog onClose={vi.fn()} />)
  const select = screen.getByRole('combobox', { name: /Mã số phiếu/ })
  await waitFor(() => expect(select).toBeEnabled())
  await user.selectOptions(select, 'STO/01 #')
  await user.click(screen.getByRole('button', { name: 'Xuất dữ liệu' }))
  expect(downloadFile).toHaveBeenCalledWith('/api/saleouts/STO%2F01%20%23/pdf')
})

it('blocks reversed report dates then exports the original query contract', async () => {
  const user = userEvent.setup()
  mount(<SaleOutReportDialog onClose={vi.fn()} />)
  fireEvent.change(screen.getByLabelText(/Từ ngày/), { target: { value: '2026-11-11' } })
  fireEvent.change(screen.getByLabelText(/Đến ngày/), { target: { value: '2026-11-01' } })
  await user.click(screen.getByRole('button', { name: 'Xuất dữ liệu' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Từ ngày không được lớn hơn đến ngày.')
  expect(downloadFile).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText(/Đến ngày/), { target: { value: '2026-11-30' } })
  await user.click(screen.getByRole('button', { name: 'Xuất dữ liệu' }))
  expect(downloadFile).toHaveBeenCalledWith('/api/saleouts/revenue-report?startDate=2026-11-11&endDate=2026-11-30')
})

it('retains both Excel template URLs', () => {
  mount(<><ProductToolbar onOpen={vi.fn()} onSearch={vi.fn()} /><SaleOutToolbar onOpen={vi.fn()} onSearch={vi.fn()} /></>)
  expect(screen.getAllByRole('link', { name: 'Tải file mẫu' }).map(link => link.getAttribute('href'))).toEqual(['/api/products/template', '/api/saleouts/template'])
})

for (const [name, hook] of [['products', useProducts], ['saleouts', useSaleOuts]]) {
  describe(name, () => {
    it('imports Excel with the existing multipart contract and returns to page one', async () => {
      vi.stubGlobal('fetch', vi.fn(async (_url, options) => json(options?.method === 'POST' ? { importedCount: 2 } : { items: [], totalCount: 100 })))
      const { result } = renderHook(hook)
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      act(() => result.current.setPage(2))
      const file = new File(['test'], 'data.xlsx')
      await act(async () => result.current.importFile(file))
      const [url, options] = fetch.mock.calls.find(([, options]) => options?.method === 'POST')
      expect(url).toBe(`/api/${name}/import`)
      expect(options.body.get('file')).toBe(file)
      expect(options.headers).toBeUndefined()
      expect(result.current.page).toBe(1)
      expect(result.current.notice).toContain('2')
    })
  })
}

it('has matching dictionary keys and placeholders and translates validation without changing Backend errors', async () => {
  expect(Object.keys(viDictionary).sort()).toEqual(Object.keys(enDictionary).sort())
  for (const key of Object.keys(viDictionary)) {
    expect(viDictionary[key].match(/{{\w+}}/g) || []).toEqual(enDictionary[key].match(/{{\w+}}/g) || [])
  }
  await i18n.changeLanguage('en')
  const { buildProductPayload, createProductForm } = await import('@/features/products/utils/productForm')
  expect(() => buildProductPayload(createProductForm(), false)).toThrow('Please complete all product fields.')
  const { createProduct } = await import('@/features/products/api/productApi')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: 'Mã đã tồn tại.' }) }))
  await expect(createProduct({})).rejects.toThrow('Mã đã tồn tại.')
})

it('restores a saved language and ignores unsupported languages in Redux', () => {
  localStorage.setItem('hds.language', 'en')
  const store = createAppStore()
  expect(store.getState().preferences.language).toBe('en')
  store.dispatch(setLanguage('fr'))
  expect(store.getState().preferences.language).toBe('en')
})
