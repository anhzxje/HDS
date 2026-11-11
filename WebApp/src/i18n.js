import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import vi from './locales/vi.json'
import en from './locales/en.json'

export function savedLanguage() {
  try { return localStorage.getItem('hds.language') === 'en' ? 'en' : 'vi' }
  catch { return 'vi' }
}

i18n.use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en } },
  lng: savedLanguage(), fallbackLng: 'vi', supportedLngs: ['vi', 'en'],
  keySeparator: false, interpolation: { escapeValue: false }, initAsync: false,
})
export default i18n
