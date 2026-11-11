import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TextField from '@mui/material/TextField'
import { setActiveTab, setLanguage } from '../store/preferencesSlice'

export default function TabNav() {
  const { t } = useTranslation()
  const { activeTab, language } = useSelector(state => state.preferences)
  const dispatch = useDispatch()
  return <nav className="screen-nav" aria-label={t('app.navigation')}>
    <div className="screen-nav__inner">
      <span className="screen-nav__title">{t('app.title')}</span>
      <Tabs value={activeTab} onChange={(_, value) => dispatch(setActiveTab(value))} aria-label={t('app.navigation')}>
        <Tab value="product" label={t('product.title')} />
        <Tab value="saleOut" label={t('saleOut.title')} />
      </Tabs>
      <TextField select label={t('app.language')} value={language} sx={{ width: 160 }}
        slotProps={{ select: { native: true } }} onChange={event => dispatch(setLanguage(event.target.value))}>
        <option value="vi">{t('app.vietnamese')}</option><option value="en">{t('app.english')}</option>
      </TextField>
    </div>
  </nav>
}
