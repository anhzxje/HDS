import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { SEARCH_FIELDS } from './productConfig'

export default function ProductToolbar({ isLoading, onSearch, onOpen }) {
  const { t } = useTranslation()
  const [field, setField] = useState(SEARCH_FIELDS[0].value)
  const [keyword, setKeyword] = useState('')
  function handleSearch(event) {
    event.preventDefault()
    onSearch({ field, keyword: keyword.trim() })
  }
  return <section className="controls-panel" aria-label={t('product.search')}>
    <h2>{t('product.search')}</h2>
    <form className="search-form" onSubmit={handleSearch}>
      <TextField select label={t('common.field')} value={field} sx={{ width: 240 }}
        slotProps={{ select: { native: true } }} onChange={event => setField(event.target.value)}>
        {SEARCH_FIELDS.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
      </TextField>
      <TextField label={t('common.keyword')} value={keyword} sx={{ flex: 1, minWidth: 180 }}
        onChange={event => setKeyword(event.target.value)} />
      <Button variant="contained" type="submit" disabled={isLoading}>{t('common.search')}</Button>
    </form>
    <div className="action-buttons">
      <Button onClick={() => onOpen('create')}>{t('common.create')}</Button>
      <Button component="a" href="/api/products/template">{t('common.template')}</Button>
      <Button onClick={() => onOpen('upload')}>{t('common.uploadFile')}</Button>

    </div>
  </section>
}
