import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import SearchForm from '@/shared/components/SearchForm'
import { SEARCH_FIELDS } from '../productConfig'

export default function ProductToolbar({ isLoading, onSearch, onOpen }) {
  const { t } = useTranslation()
  return <section className="controls-panel" aria-label={t('product.search')}>
    <h2>{t('product.search')}</h2>
    <SearchForm fields={SEARCH_FIELDS} isLoading={isLoading} onSearch={onSearch} />
    <div className="action-buttons">
      <Button onClick={() => onOpen('create')}>{t('common.create')}</Button>
      <Button component="a" href="/api/products/template">{t('common.template')}</Button>
      <Button onClick={() => onOpen('upload')}>{t('common.uploadFile')}</Button>

    </div>
  </section>
}
