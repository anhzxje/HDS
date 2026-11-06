export default function TabNav({ activeTab, onTabChange }) {
  const tabs = [
    { key: 'masterProduct', label: 'Master Sản phẩm' },
    { key: 'saleOut', label: 'Màn Xuất hàng' },
  ]

  return (
    <nav
      style={{
        display: 'flex',
        gap: '12px',
        padding: '16px 20px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #d9e5de',
        maxWidth: '98%',
        width: '98%',
        margin: '0 auto',
      }}
      aria-label="Điều hướng các màn hình"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            style={{
              padding: '10px 22px',
              borderRadius: '6px',
              border: isActive ? '1px solid #286b4b' : '1px solid #cbdad1',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
              backgroundColor: isActive ? '#286b4b' : '#fff',
              color: isActive ? '#fff' : '#345b47',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}

