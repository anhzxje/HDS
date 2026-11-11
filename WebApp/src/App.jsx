import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import './App.css'
import TabNav from './components/Navigation/TabNav'
const ProductList = lazy(() => import('./components/Product/ProductList'))
const SaleOutList = lazy(() => import('./components/SaleOut/SaleOutList'))

export default function App() {
  const { t } = useTranslation()
  const activeTab = useSelector(state => state.preferences.activeTab)
  return <div className="app-root"><TabNav />
    <Suspense fallback={<p role="status">{t('common.loading')}</p>}>
      {activeTab === 'saleOut' ? <SaleOutList /> : <ProductList />}
    </Suspense>
  </div>
}
