import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import FormDialog from './FormDialog'
import { notify } from '../lib/alerts'

export default function UploadDialog({ onClose, onUpload }) {
  const { t } = useTranslation()
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  async function handleSubmit(event) {
    event.preventDefault()
    if (!file || isUploading) return
    setError('')
    setIsUploading(true)
    try {
      await onUpload(file)
      onClose()
    } catch (err) {
      const message = err.message || t('error.upload')
      setError(message)
      notify(message, 'error')
    } finally { setIsUploading(false) }
  }
  return <FormDialog title={t('upload.title')} titleId="upload-title" onClose={onClose} busy={isUploading}>
    <form onSubmit={handleSubmit}>
      <Button component="label" htmlFor="upload-file" disabled={isUploading}>{t('upload.choose')}</Button>
      <input id="upload-file" className="upload-input" type="file" accept=".xlsx" disabled={isUploading}
        onChange={event => { setFile(event.target.files?.[0] || null); setError('') }} />
      <p className="upload-file-name">{file ? file.name : t('upload.hint')}</p>
      {error && <Alert severity="error">{error}</Alert>}
      <div className="edit-actions">
        <Button onClick={onClose} disabled={isUploading}>{t('common.close')}</Button>
        <Button variant="contained" type="submit" disabled={!file || isUploading}>
          {t(isUploading ? 'upload.uploading' : 'upload.upload')}</Button>
      </div>
    </form>
  </FormDialog>
}
