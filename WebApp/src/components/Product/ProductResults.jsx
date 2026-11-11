import { useTranslation } from 'react-i18next'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import ProductTable from './ProductTable'
import ResultsPagination from '../common/ResultsPagination'

export default function ProductResults({ list, onEdit }) {
  const { t } = useTranslation()
  return <section className="results-panel" aria-label={t('product.list')}>
    <div className="results-heading">
      <div><h2>{t('product.list')}</h2></div>
      <TextField select label={t('common.pageSize')} value={list.pageSize} sx={{ width: 210 }}
        slotProps={{ select: { native: true } }} onChange={event => list.changePageSize(Number(event.target.value))}>
        {[5, 10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
      </TextField>
    </div>
    {list.errorMessage && <Alert severity="error">{list.errorMessage}</Alert>}
    <ProductTable list={list} onEdit={onEdit} />
    <ResultsPagination list={list} />
  </section>
}
