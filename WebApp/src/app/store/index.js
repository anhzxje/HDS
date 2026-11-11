import { configureStore } from '@reduxjs/toolkit'
import preferences from './preferencesSlice'

export const createAppStore = () => configureStore({ reducer: { preferences } })
export const store = createAppStore()
