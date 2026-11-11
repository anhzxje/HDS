import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { createAppStore } from '@/app/store'
import AppProviders from '@/app/providers/AppProviders'
import ProductList from '@/features/products/components/ProductList'
import SaleOutList from '@/features/saleouts/components/SaleOutList'
import Swal from 'sweetalert2'

const json = data => ({ ok: true, status: 200, json: async () => data })
const mount = component => render(<Provider store={createAppStore()}><AppProviders>{component}</AppProviders></Provider>)

it('product UI creates, refreshes, preserves failed edits for retry, updates and deletes the row', async () => {
  const user = userEvent.setup()
  let records = [], rejectUpdate = true
  vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
    if (options?.method === 'POST') {
      records = [{ ...JSON.parse(options.body), id: 'p1' }]
      return json({ newId: 'p1' })
    }
    if (options?.method === 'PUT') {
      if (rejectUpdate) return { ok: false, status: 409, json: async () => ({ message: 'Backend conflict' }) }
      records = [{ ...records[0], ...JSON.parse(options.body) }]
      return { ok: true, status: 204 }
    }
    if (options?.method === 'DELETE') { records = []; return { ok: true, status: 204 } }
    return json({ items: records, totalCount: records.length })
  }))
  mount(<ProductList />)
  await user.click(await screen.findByRole('button', { name: 'Thêm mới' }))
  for (const [label, value] of [[/Mã sản phẩm/, 'SP-UI'], [/Tên sản phẩm/, 'Product UI'], [/Đơn vị tính/, 'Box'], [/Quy cách/, 'A']]) {
    await user.type(screen.getByRole('textbox', { name: label }), value)
  }
  fireEvent.change(screen.getByRole('spinbutton', { name: /Số lượng\/Thùng/ }), { target: { value: '2' } })
  fireEvent.change(screen.getByRole('spinbutton', { name: /Trọng lượng/ }), { target: { value: '1.005' } })
  await user.click(screen.getByRole('button', { name: 'Lưu' }))
  await screen.findByRole('cell', { name: 'SP-UI' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent(/thành công/)
  await user.click(screen.getByRole('button', { name: 'Sửa Product UI' }))
  fireEvent.change(screen.getByRole('spinbutton', { name: /Trọng lượng/ }), { target: { value: '2.125' } })
  await user.click(screen.getByRole('button', { name: 'Lưu' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Backend conflict')
  expect(screen.getByRole('spinbutton', { name: /Trọng lượng/ })).toHaveValue(2.125)
  rejectUpdate = false
  await user.click(screen.getByRole('button', { name: 'Lưu' }))
  await screen.findByRole('cell', { name: '2.125' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Xóa Product UI' }))
  await screen.findByText('Không có sản phẩm.')
  expect(fetch.mock.calls.filter(([, options]) => options?.method === 'DELETE')).toHaveLength(1)
  await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success', toast: true })))
})

it('sale-out UI creates a document, refreshes its row, edits only line values and deletes it', async () => {
  const user = userEvent.setup()
  let records = []
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    if (url === '/api/products/choices') return json([{ id: 'p1', productCode: 'SP-UI', productName: 'Product UI', unit: 'Box', quantityPerBox: 2 }])
    if (options?.method === 'POST') {
      const payload = JSON.parse(options.body)
      records = [{ ...payload, ...payload.items[0], id: 's1', productCode: 'SP-UI', productName: 'Product UI', unit: 'Box', saleOutNo: 'STO2026110001', orderDate: 20261111, amount: 3, boxQuantity: 2 }]
      return json({ saleOutNo: 'STO2026110001' })
    }
    if (options?.method === 'PUT') {
      records = [{ ...records[0], ...JSON.parse(options.body) }]
      return { ok: true, status: 204 }
    }
    if (options?.method === 'DELETE') { records = []; return { ok: true, status: 204 } }
    return json({ items: records, totalCount: records.length })
  }))
  mount(<SaleOutList />)
  await user.click(await screen.findByRole('button', { name: 'Thêm mới' }))
  await user.type(screen.getByRole('textbox', { name: /Số PO khách hàng/ }), 'PO-UI')
  await user.type(screen.getByRole('textbox', { name: /Khách hàng/ }), 'Customer UI')
  fireEvent.change(screen.getByLabelText(/Ngày đặt hàng/), { target: { value: '2026-11-11' } })
  const product = screen.getByRole('combobox', { name: /Sản phẩm/ })
  await waitFor(() => expect(product).toBeEnabled())
  await user.selectOptions(product, 'p1')
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Số lượng' }), { target: { value: '3' } })
  fireEvent.change(screen.getByRole('spinbutton', { name: /Đơn giá/ }), { target: { value: '1' } })
  await user.click(screen.getByRole('button', { name: 'Lưu' }))
  await screen.findByRole('cell', { name: 'STO2026110001' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Sửa' }))
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Số lượng' }), { target: { value: '4' } })
  await user.click(screen.getByRole('button', { name: 'Lưu' }))
  await screen.findByRole('cell', { name: '4,000' })
  const [url, options] = fetch.mock.calls.find(([, options]) => options?.method === 'PUT')
  expect(url).toBe('/api/saleouts/s1')
  expect(JSON.parse(options.body)).toEqual({ quantity: 4, quantityPerBox: 2, price: 1 })
  await user.click(screen.getByRole('button', { name: 'Xóa' }))
  await screen.findByText('Không có dữ liệu xuất hàng.')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
