export const SUPPORTED_LANGUAGES = ['vi', 'en']
const STORAGE_KEY = 'hds.language'

export function savedLanguage() {
  try { return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'vi' }
  catch { return 'vi' }
}

export function persistLanguage(language) {
  try { localStorage.setItem(STORAGE_KEY, language) }
  catch { /* Storage may be disabled. */ }
}
