import { useState } from 'react'
import { SEARCH_FIELDS } from './productConfig'

export default function ProductToolbar({ isLoading, onSearch, onOpen }) {
  const [field, setField] = useState(SEARCH_FIELDS[0].value)
  const [keyword, setKeyword] = useState('')

  function handleSearch(event) {
    event.preventDefault()
    onSearch({ field, keyword: keyword.trim() })
  }

  return (
    <section className="controls-panel" aria-label="Tìm kiếm sản phẩm">
      <h2>Tìm kiếm sản phẩm</h2>
      <form className="search-form" onSubmit={handleSearch}>
        <label htmlFor="search-field">Tên trường</label>
        <select id="search-field" value={field} onChange={event => setField(event.target.value)}>
          {SEARCH_FIELDS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <label htmlFor="search-keyword">Nội dung tìm kiếm</label>
        <input id="search-keyword" placeholder="Nội dung tìm kiếm" value={keyword}
          onChange={event => setKeyword(event.target.value)} />
        <button type="submit" disabled={isLoading}>Tìm kiếm</button>
      </form>
      <div className="action-buttons">
        <button type="button" onClick={() => onOpen('create')}>Thêm mới</button>
        <button type="button" onClick={() => { window.location.href = '/api/products/template' }}>Tải file mẫu</button>
        <button type="button" onClick={() => onOpen('upload')}>Tải lên file</button>
      </div>
    </section>
  )
}
