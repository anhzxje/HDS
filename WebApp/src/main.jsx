import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@/app/store'
import AppProviders from '@/app/providers/AppProviders'
import '@/index.css'
import App from '@/app/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode><Provider store={store}><AppProviders><App /></AppProviders></Provider></StrictMode>,
)
