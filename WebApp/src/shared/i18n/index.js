import { savedLanguage, SUPPORTED_LANGUAGES } from '../lib/languagePreferences'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import vi from '@/locales/vi.json'
import en from '@/locales/en.json'

i18n.use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en } },
  lng: savedLanguage(), fallbackLng: 'vi', supportedLngs: SUPPORTED_LANGUAGES,
  keySeparator: false, interpolation: { escapeValue: false }, initAsync: false,
})
export default i18n
