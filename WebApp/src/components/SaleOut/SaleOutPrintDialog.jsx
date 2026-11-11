import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import FormDialog from '../common/FormDialog'
import { fetchSaleOutNumbers } from '../../api/saleOutApi'
import { downloadFile, saleOutPdfUrl } from '../../utils/downloads'
import { notify } from '../../utils/alerts'

export default function SaleOutPrintDialog({ onClose }) {
  const { t } = useTranslation()
  const [numbers, setNumbers] = useState([])
  const [selectedNumber, setSelectedNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const data = await fetchSaleOutNumbers(controller.signal)
        if (!controller.signal.aborted) setNumbers(data)
      } catch (err) {
        if (!controller.signal.aborted && err.name !== 'AbortError') { setError(err.message); notify(err.message, 'error') }
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }
    load()
    return () => controller.abort()
  }, [])
  function handleExport(event) {
    event.preventDefault()
    if (!selectedNumber) { setError(t('validation.number')); notify(t('validation.number'), 'warning'); return }
    setError('')
    downloadFile(saleOutPdfUrl(selectedNumber))
  }
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
