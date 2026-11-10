import { useEffect, useRef, useState } from 'react'

export default function UploadDialog({ onClose, onUpload }) {
  const dialogRef = useRef(null)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!file || isUploading) return
    setError('')
    setIsUploading(true)
    try {
      await onUpload(file)
      onClose()
    } catch (err) {
      setError(err.message || 'Không thể tải lên dữ liệu.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="edit-modal upload-dialog" aria-labelledby="upload-title" onCancel={(event) => { event.preventDefault(); if (!isUploading) onClose() }}>
      <form onSubmit={handleSubmit}>
        <h2 id="upload-title">Tải lên tập tin</h2>
        <label className="upload-file-label" htmlFor="upload-file">Chọn tệp</label>
        <input id="upload-file" className="upload-input" type="file" accept=".xlsx" disabled={isUploading} onChange={(event) => { setFile(event.target.files?.[0] || null); setError('') }} />
        <p className="upload-file-name">{file ? file.name : 'Chọn tệp Excel (.xlsx), tối đa 5 MB'}</p>
        {error && <p className="edit-error" role="alert">{error}</p>}
        <div className="edit-actions">
          <button type="button" onClick={onClose} disabled={isUploading}>Đóng</button>
          <button type="submit" disabled={!file || isUploading}>{isUploading ? 'Đang tải lên...' : 'Tải lên'}</button>
        </div>
      </form>
    </dialog>
  )
}
