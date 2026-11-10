import { useState } from 'react'
import { SEARCH_FIELDS } from './saleOutConfig'

const ACTIONS = [
  { key: 'upload', label: 'Tải lên file' },
  { key: 'print', label: 'In phiếu' },
  { key: 'report', label: 'Báo cáo doanh thu' },
]

export default function SaleOutToolbar({ isLoading, onSearch, onOpen }) {
  return (
    <section className="controls-panel" aria-label="Tìm kiếm xuất hàng">
      <h2>Tìm kiếm đơn xuất hàng</h2>
      <SaleOutSearch isLoading={isLoading} onSearch={onSearch} />
      <div className="action-buttons">
        <button type="button" onClick={() => onOpen('create')}>Thêm mới</button>
        <button type="button" onClick={() => { window.location.href = '/api/saleouts/template' }}>Tải file mẫu</button>
        {ACTIONS.map(action => (
          <button key={action.key} type="button" onClick={() => onOpen(action.key)}>{action.label}</button>
        ))}
      </div>
    </section>
  )
}

function SaleOutSearch({ isLoading, onSearch }) {
  const [field, setField] = useState(SEARCH_FIELDS[0].value)
  const [keyword, setKeyword] = useState('')

  function handleSearch(event) {
    event.preventDefault()
    onSearch({ field, keyword: keyword.trim() })
  }

  return (
    <form className="search-form" onSubmit={handleSearch}>
      <label htmlFor="saleout-search-field">Tên trường</label>
      <select id="saleout-search-field" value={field} onChange={event => setField(event.target.value)}>
        {SEARCH_FIELDS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <input id="saleout-search-keyword" type="search" placeholder="Nhập nội dung cần tìm..."
        aria-label="Nội dung tìm kiếm" value={keyword} onChange={event => setKeyword(event.target.value)} />
      <button type="submit" disabled={isLoading}>Tìm kiếm</button>
    </form>
  )
}
