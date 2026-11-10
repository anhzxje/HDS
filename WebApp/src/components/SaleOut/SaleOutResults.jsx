import SaleOutTable from './SaleOutTable'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export default function SaleOutResults({ list, onEdit }) {
  return (
    <section className="results-panel" aria-label="Danh sách xuất hàng">
      <div className="results-heading">
        <div>
          <h2>Danh sách đơn xuất hàng</h2>
          <p>Dữ liệu phiếu xuất kho và thông tin giao nhận thực tế</p>
        </div>
        <div className="page-size">
          <label htmlFor="saleout-page-size">Số bản ghi mỗi trang</label>
          <select id="saleout-page-size" value={list.pageSize}
            onChange={event => list.changePageSize(Number(event.target.value))}>
            {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
      </div>
      {list.errorMessage && <p className="error-message" role="alert">{list.errorMessage}</p>}
      <SaleOutTable list={list} onEdit={onEdit} />
      <SaleOutPagination list={list} />
    </section>
  )
}

function SaleOutPagination({ list }) {
  const { page, totalCount, totalPages, isLoading, setPage } = list
  return (
    <div className="pagination">
      <span>Tổng số: <strong>{totalCount}</strong> bản ghi</span>
      <button type="button" disabled={page <= 1 || isLoading}
        onClick={() => setPage(current => Math.max(current - 1, 1))}>Trang trước</button>
      <span>Trang <strong>{page}</strong> / {totalPages}</span>
      <button type="button" disabled={page >= totalPages || isLoading}
        onClick={() => setPage(current => Math.min(current + 1, totalPages))}>Trang sau</button>
    </div>
  )
}
