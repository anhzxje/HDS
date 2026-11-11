import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import ProductTable from '@/features/products/components/ProductTable'
import SaleOutTable from '@/features/saleouts/components/SaleOutTable'
import FormDialog from '@/shared/components/FormDialog'
import i18n from '@/shared/i18n'

for (const [feature, Component, key] of [['product', ProductTable, 'products'], ['saleOut', SaleOutTable, 'saleOuts']]) {
  const base = { page: 2, pageSize: 10, isLoading: false, errorMessage: '', deletingId: null, remove: vi.fn() }
  it.each(['loading', 'empty', 'error'])(`${feature} table renders the %s state`, state => {
    render(<Component list={{ ...base, [key]: [], isLoading: state === 'loading', errorMessage: state === 'error' ? 'Backend error' : '' }} onEdit={vi.fn()} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText(i18n.t(state === 'loading' ? 'common.loading' : state === 'error' ? 'common.loadFailed' : `${feature}.empty`))).toBeInTheDocument()
  })
  it(`${feature} row actions receive the correct row and lock while a delete is pending`, async () => {
    const user = userEvent.setup(), onEdit = vi.fn(), remove = vi.fn()
    const item = { id: 'row1', productName: 'Name', productCode: 'SP01', saleOutNo: 'STO01', orderDate: 20261111, quantity: 1.005, quantityPerBox: 1, boxQuantity: 2, price: 1, amount: 1.005 }
    const list = { ...base, [key]: [item], remove }
    const { rerender } = render(<Component list={list} onEdit={onEdit} />)
    expect(screen.getByRole('cell', { name: '11' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Sửa/ }))
    expect(onEdit).toHaveBeenCalledWith(item)
    await user.click(screen.getByRole('button', { name: new RegExp(`^${i18n.t('common.delete')}`) }))
    expect(remove).toHaveBeenCalledWith(item)
    rerender(<Component list={{ ...list, deletingId: 'row1' }} onEdit={onEdit} />)
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()
  })
}

it('prevents Escape from closing a busy MUI dialog and permits closing once idle', async () => {
  const user = userEvent.setup(), onClose = vi.fn()
  const { rerender } = render(<FormDialog title="Test" titleId="test-dialog" onClose={onClose} busy>Body</FormDialog>)
  expect(screen.getByRole('dialog', { name: 'Test' })).toBeInTheDocument()
  await user.keyboard('{Escape}')
  expect(onClose).not.toHaveBeenCalled()
  rerender(<FormDialog title="Test" titleId="test-dialog" onClose={onClose}>Body</FormDialog>)
  await user.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledOnce()
})
