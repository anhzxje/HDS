import ProductTable from './ProductTable'
import { PAGE_SIZE_OPTIONS } from './productConfig'

export default function ProductResults({ list, onEdit }) {
  const { isLoading, totalCount, pageSize, changePageSize, errorMessage, page, totalPages, setPage } = list
  return (
    <section className="results-panel" aria-label="Danh sách sản phẩm">
      <div className="results-heading">
        <div><h2>Danh sách sản phẩm</h2><p>{isLoading ? 'Đang cập nhật danh sách' : `${totalCount} sản phẩm`}</p></div>
        <div className="page-size">
          <label htmlFor="page-size">Hiển thị</label>
          <select id="page-size" value={pageSize} onChange={event => changePageSize(Number(event.target.value))}>
            {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
          </select>
          <span>bản ghi trên mỗi trang</span>
        </div>
      </div>
      {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
      <ProductTable list={list} onEdit={onEdit} />
      <div className="pagination">
        <span>Tổng số: {totalCount} sản phẩm</span>
        <button type="button" onClick={() => setPage(current => Math.max(1, current - 1))}
          disabled={page <= 1 || isLoading}>Trang trước</button>
        <span>Trang {page} / {totalPages}</span>
        <button type="button" onClick={() => setPage(current => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages || isLoading}>Trang sau</button>
      </div>
    </section>
  )
}
