import { useState } from 'react'
import './App.css'
import TabNav from './components/Navigation/TabNav'
import MasterProductList from './components/MasterProduct/MasterProductList'
import SaleOutList from './components/SaleOut/SaleOutList'

function App() {
  const [activeTab, setActiveTab] = useState('saleOut')

  return (
    <div className="app-root">
      {/* THANH ĐIỀU HƯỚNG CHUYỂN ĐỔI GIỮA CÁC MÀN HÌNH */}
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* RENDER MÀN HÌNH TƯƠNG ỨNG */}
      {activeTab === 'saleOut' ? <SaleOutList /> : <MasterProductList />}
    </div>
  )
}

export default App
