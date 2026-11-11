import useSaleOutPrint from '../hooks/useSaleOutPrint'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import FormDialog from '@/shared/components/FormDialog'

export default function SaleOutPrintDialog({ onClose }) {
  const { t } = useTranslation()
  const { numbers, selectedNumber, setSelectedNumber, loading, error, handleExport } = useSaleOutPrint()
  return <FormDialog title={t('print.title')} titleId="print-title" onClose={onClose}>
    <p>{t('print.description')}</p>
    <form onSubmit={handleExport}>
      <TextField select label={t('fields.saleOutNo')} required value={selectedNumber} disabled={loading}
        slotProps={{ select: { native: true } }} onChange={event => setSelectedNumber(event.target.value)}>
        <option value="">{t(loading ? 'common.loading' : 'print.choose')}</option>
        {numbers.map(number => <option key={number} value={number}>{number}</option>)}
      </TextField>
      {!loading && numbers.length === 0 && !error && <p>{t('print.empty')}</p>}
      {error && <Alert severity="error">{error}</Alert>}
      <div className="edit-actions">
        <Button onClick={onClose}>{t('common.close')}</Button>
        <Button variant="contained" type="submit" disabled={loading || numbers.length === 0}>{t('common.export')}</Button>
      </div>
    </form>
  </FormDialog>
}
