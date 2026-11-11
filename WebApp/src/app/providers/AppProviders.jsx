import { persistLanguage } from '@/shared/lib/languagePreferences'
import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { enUS, viVN } from '@mui/material/locale'
import i18n from '@/shared/i18n'

export default function AppProviders({ children }) {
  const language = useSelector(state => state.preferences.language)
  useEffect(() => {
    i18n.changeLanguage(language)
    document.documentElement.lang = language
    document.title = `HDS — ${i18n.t('app.title')}`
    persistLanguage(language)
  }, [language])
  const theme = useMemo(() => createTheme({
    palette: { primary: { main: '#286b4b' }, background: { default: '#f4f8f5' } },
    typography: { fontFamily: "'Segoe UI', 'Noto Sans', sans-serif", button: { textTransform: 'none' } },
    components: {
      MuiButton: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { minHeight: 44 } } },
      MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
      MuiTableCell: { styleOverrides: { head: { backgroundColor: '#eff5f0', fontWeight: 700 } } },
    },
  }, language === 'en' ? enUS : viVN), [language])
  return <I18nextProvider i18n={i18n}><ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider></I18nextProvider>
}
