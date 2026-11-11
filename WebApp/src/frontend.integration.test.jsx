import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import App from './App'
import { createAppStore } from './store'
import AppProviders from './AppProviders'

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [], totalCount: 0 }) }))
})

it('shares language across navigation, page and an open form without losing input', async () => {
  const user = userEvent.setup()
  const store = createAppStore()
  render(<Provider store={store}><AppProviders><App /></AppProviders></Provider>)
  await user.click(screen.getByRole('tab', { name: 'Sản phẩm' }))
  await user.click(await screen.findByRole('button', { name: 'Thêm mới' }))
  await user.type(screen.getByRole('textbox', { name: /Mã sản phẩm/ }), 'SP01')
  // Redux preferences can change while a modal is open (e.g. another shared consumer).
  const { setLanguage } = await import('./store/preferencesSlice')
  const { act } = await import('@testing-library/react')
  await act(async () => { store.dispatch(setLanguage('en')) })
  expect(await screen.findByRole('dialog', { name: 'New product' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: /Product code/ })).toHaveValue('SP01')
  await user.click(screen.getByRole('button', { name: 'Close' }))
  expect(screen.getByRole('tab', { name: 'Products', selected: true })).toBeInTheDocument()
  expect(document.documentElement.lang).toBe('en')
  expect(localStorage.getItem('hds.language')).toBe('en')
  fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'vi' } })
  expect(await screen.findByRole('heading', { level: 1, name: 'Sản phẩm' })).toBeInTheDocument()
})

for (const [tab, field, size] of [['Sản phẩm', 'ProductCode', '5'], ['Xuất hàng', 'CustomerPoNo', '10']]) {
  it(`keeps ${field} search, page size and next-page API parameters`, async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [], totalCount: 120 }) })
    const user = userEvent.setup()
    const store = createAppStore()
    render(<Provider store={store}><AppProviders><App /></AppProviders></Provider>)
    await user.click(screen.getByRole('tab', { name: tab }))
    await user.type(await screen.findByRole('textbox', { name: 'Nội dung tìm kiếm' }), ' SP01 ')
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm' }))
    await waitFor(() => expect(fetch.mock.calls.some(([url]) => url.includes('keyword=SP01') && url.includes(`field=${field}`))).toBe(true))
    fireEvent.change(screen.getByLabelText('Số bản ghi mỗi trang'), { target: { value: size } })
    await waitFor(() => expect(fetch.mock.calls.at(-1)[0]).toContain(`pageSize=${size}`))
    expect(screen.getByRole('navigation', { name: 'Phân trang' })).toBeInTheDocument()
    const next = screen.getByRole('button', { name: 'Trang sau' })
    await waitFor(() => expect(next).toBeEnabled())
    await user.click(next)
    await waitFor(() => expect(fetch.mock.calls.at(-1)[0]).toContain('page=2'))
    expect(fetch.mock.calls.at(-1)[0]).toContain(`field=${field}&keyword=SP01`)
  })
}
