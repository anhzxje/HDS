import { createSlice } from '@reduxjs/toolkit'
import { savedLanguage } from '../i18n'

const preferences = createSlice({
  name: 'preferences',
  initialState: () => ({ language: savedLanguage(), activeTab: 'saleOut' }),
  reducers: {
    setLanguage(state, { payload }) {
      if (['vi', 'en'].includes(payload)) state.language = payload
    },
    setActiveTab(state, { payload }) {
      if (['product', 'saleOut'].includes(payload)) state.activeTab = payload
    },
  },
})
export const { setLanguage, setActiveTab } = preferences.actions
export default preferences.reducer
