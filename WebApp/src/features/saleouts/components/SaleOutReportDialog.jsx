import useRevenueReport from '../hooks/useRevenueReport'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import FormDialog from '@/shared/components/FormDialog'
import FormField from '@/shared/components/FormField'

export default function SaleOutReportDialog({ onClose }) {
  const { t } = useTranslation()
  const { startDate, setStartDate, endDate, setEndDate, error, handleExport } = useRevenueReport()
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
