import { createSlice } from '@reduxjs/toolkit'
import { savedLanguage, SUPPORTED_LANGUAGES } from '@/shared/lib/languagePreferences'

const preferences = createSlice({
  name: 'preferences',
  initialState: () => ({ language: savedLanguage(), activeTab: 'saleOut' }),
  reducers: {
    setLanguage(state, { payload }) {
      if (SUPPORTED_LANGUAGES.includes(payload)) state.language = payload
    },
    setActiveTab(state, { payload }) {
      if (['product', 'saleOut'].includes(payload)) state.activeTab = payload
    },
  },
})
export const { setLanguage, setActiveTab } = preferences.actions
export default preferences.reducer
