import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import UploadDialog from './UploadDialog'

const workbook = () => new File(['workbook'], 'data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

function setup(props = {}) {
  const onClose = vi.fn()
  const onUpload = vi.fn().mockResolvedValue({ importedCount: 1 })
  render(<UploadDialog onClose={onClose} onUpload={onUpload} {...props} />)
  return { user: userEvent.setup(), onClose, onUpload }
}

describe('UploadDialog', () => {
  it('opens a modal and disables submission until a file is selected', () => {
    setup()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Tải lên' })).toBeDisabled()
    expect(screen.getByLabelText('Chọn tệp')).toHaveAttribute('accept', '.xlsx')
  })

  it('uploads the selected file and closes only after success', async () => {
    const { user, onClose, onUpload } = setup()
    const file = workbook()
    await user.upload(screen.getByLabelText('Chọn tệp'), file)
    expect(screen.getByText('data.xlsx')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tải lên' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(onUpload).toHaveBeenCalledWith(file)
  })

  it('locks the input and buttons and prevents cancellation while uploading', async () => {
    const pending = Promise.withResolvers()
    const onUpload = vi.fn().mockReturnValue(pending.promise)
    const { user, onClose } = setup({ onUpload })
    await user.upload(screen.getByLabelText('Chọn tệp'), workbook())
    await user.click(screen.getByRole('button', { name: 'Tải lên' }))
    expect(screen.getByRole('button', { name: 'Đang tải lên...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeDisabled()
    expect(screen.getByLabelText('Chọn tệp')).toBeDisabled()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    pending.resolve({ importedCount: 1 })
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(onUpload).toHaveBeenCalledOnce()
  })

  it('keeps the dialog open on API validation error and allows retry', async () => {
    const onUpload = vi.fn().mockRejectedValueOnce(new Error('Dòng 3: Mã sản phẩm bị trùng.')).mockResolvedValueOnce({ importedCount: 1 })
    const { user, onClose } = setup({ onUpload })
    await user.upload(screen.getByLabelText('Chọn tệp'), workbook())
    await user.click(screen.getByRole('button', { name: 'Tải lên' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Dòng 3: Mã sản phẩm bị trùng.')
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Tải lên' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Tải lên' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(onUpload).toHaveBeenCalledTimes(2)
  })

  it('clears the old upload error when selecting another file', async () => {
    const { user } = setup({ onUpload: vi.fn().mockRejectedValue(new Error('File lỗi.')) })
    await user.upload(screen.getByLabelText('Chọn tệp'), workbook())
    await user.click(screen.getByRole('button', { name: 'Tải lên' }))
    await screen.findByRole('alert')
    await user.upload(screen.getByLabelText('Chọn tệp'), new File(['new'], 'other.xlsx'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('other.xlsx')).toBeInTheDocument()
  })

  it('allows cancellation when no upload is pending', () => {
    const { onClose } = setup()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
