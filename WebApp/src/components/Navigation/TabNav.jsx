const tabs = [
  { key: 'masterProduct', label: 'Sản phẩm' },
  { key: 'saleOut', label: 'Xuất hàng' },
]

export default function TabNav({ activeTab, onTabChange }) {
  return (
    <nav className="screen-nav" aria-label="Điều hướng các màn hình">
      <div className="screen-nav__inner">
        <span className="screen-nav__title">Quản lý bán hàng & Kho</span>
        <div className="screen-nav__buttons">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`screen-nav__button${activeTab === tab.key ? ' is-active' : ''}`}
              aria-current={activeTab === tab.key ? 'page' : undefined}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
