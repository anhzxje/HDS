import { useTranslation } from 'react-i18next'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import SaleOutTable from './SaleOutTable'
import ResultsPagination from '@/shared/components/ResultsPagination'

export default function SaleOutResults({ list, onEdit }) {
  const { t } = useTranslation()
  return <section className="results-panel" aria-label={t('saleOut.list')}>
    <div className="results-heading">
      <div><h2>{t('saleOut.list')}</h2><p>{t('saleOut.listDescription')}</p></div>
      <TextField select label={t('common.pageSize')} value={list.pageSize} sx={{ width: 210 }}
        slotProps={{ select: { native: true } }} onChange={event => list.changePageSize(Number(event.target.value))}>
        {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
      </TextField>
    </div>
    {list.errorMessage && <Alert severity="error">{list.errorMessage}</Alert>}
    <SaleOutTable list={list} onEdit={onEdit} />
    <ResultsPagination list={list} />
  </section>
}
