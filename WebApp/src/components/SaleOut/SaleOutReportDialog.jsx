import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import FormDialog from '../common/FormDialog'
import FormField from '../common/FormField'
import { downloadFile, revenueReportUrl } from '../../utils/downloads'
import { notify } from '../../utils/alerts'

export default function SaleOutReportDialog({ onClose }) {
  const { t } = useTranslation()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  function handleExport(event) {
    event.preventDefault()
    const message = !startDate || !endDate ? t('validation.dates') : startDate > endDate ? t('validation.dateOrder') : ''
    if (message) { setError(message); notify(message, 'warning'); return }
    setError('')
    downloadFile(revenueReportUrl(startDate, endDate))
  }
  return <FormDialog title={t('report.title')} titleId="report-title" onClose={onClose}>
    <p>{t('report.description')}</p>
    <form onSubmit={handleExport}>
      <div className="edit-form-grid">
        <FormField label={t('report.start')} required type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
        <FormField label={t('report.end')} required type="date" value={endDate} onChange={event => setEndDate(event.target.value)} />
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      <div className="edit-actions">
        <Button onClick={onClose}>{t('common.close')}</Button>
        <Button variant="contained" type="submit">{t('common.export')}</Button>
      </div>
    </form>
  </FormDialog>
}
