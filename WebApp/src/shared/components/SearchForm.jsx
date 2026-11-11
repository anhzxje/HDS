import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

export default function SearchForm({ fields, isLoading, onSearch }) {
  const { t } = useTranslation()
  const [field, setField] = useState(fields[0].value)
  const [keyword, setKeyword] = useState('')
  function handleSearch(event) {
    event.preventDefault()
    onSearch({ field, keyword: keyword.trim() })
  }
  return (
    <form className="search-form" onSubmit={handleSearch}>
      <TextField select label={t('common.field')} value={field} sx={{ width: 240 }}
        slotProps={{ select: { native: true } }} onChange={event => setField(event.target.value)}>
        {fields.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
      </TextField>
      <TextField label={t('common.keyword')} value={keyword} sx={{ flex: 1, minWidth: 180 }}
        onChange={event => setKeyword(event.target.value)} />
      <Button variant="contained" type="submit" disabled={isLoading}>{t('common.search')}</Button>
    </form>
  )
}
