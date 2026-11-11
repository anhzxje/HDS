import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import SearchForm from '@/shared/components/SearchForm'
import { SEARCH_FIELDS } from '../saleOutConfig'

export default function SaleOutToolbar({ isLoading, onSearch, onOpen }) {
  const { t } = useTranslation()
  return <section className="controls-panel" aria-label={t('saleOut.search')}>
    <h2>{t('saleOut.search')}</h2>
    <SearchForm fields={SEARCH_FIELDS} isLoading={isLoading} onSearch={onSearch} />
    <div className="action-buttons">
      <Button onClick={() => onOpen('create')}>{t('common.create')}</Button>
      <Button component="a" href="/api/saleouts/template">{t('common.template')}</Button>
      <Button onClick={() => onOpen('upload')}>{t('common.uploadFile')}</Button>
      <Button onClick={() => onOpen('print')}>{t('print.title')}</Button>
      <Button onClick={() => onOpen('report')}>{t('report.title')}</Button>
    </div>
  </section>
}
