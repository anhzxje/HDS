import CreateSaleOut from './CreateSaleOut'
import { useEffect, useState } from 'react'
import { fetchSaleOuts } from '../../api/saleOutApi'
import { formatOrderDate, formatNumber, formatCurrency } from '../../utils/formatters'

const DEFAULT_PAGE_SIZE = 50
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const SEARCH_FIELDS = [
  { value: 'CustomerPoNo', label: 'Số PO khách hàng' },
  { value: 'OrderDate', label: 'Ngày đặt hàng' },
  { value: 'CustomerName', label: 'Khách hàng' },
  { value: 'ProductCode', label: 'Mã sản phẩm' },
  { value: 'ProductName', label: 'Tên sản phẩm' },
]

export default function SaleOutList() {
  const [showCreate, setShowCreate] = useState(false)
  const [notice, setNotice] = useState('')
  const [revision, setRevision] = useState(0)
  const [saleOuts, setSaleOuts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [field, setField] = useState(SEARCH_FIELDS[0].value)
  const [keyword, setKeyword] = useState('')

  const [appliedSearch, setAppliedSearch] = useState({
    field: SEARCH_FIELDS[0].value,
    keyword: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const data = await fetchSaleOuts({
          field: appliedSearch.field,
          keyword: appliedSearch.keyword,
          page,
          pageSize,
          signal: controller.signal,
        })

        setSaleOuts(data.items || [])
        setTotalCount(data.totalCount || 0)
      } catch (err) {
        if (err.name === 'AbortError') return
        setErrorMessage(err.message || 'Không thể tải danh sách xuất hàng.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => controller.abort()
  }, [page, pageSize, appliedSearch, revision])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setAppliedSearch({ field, keyword })
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <main className="product-page wide">
      <header className="page-header">
        <div>
          <p className="page-context">Quản lý bán hàng & Kho</p>
          <h1>Màn Xuất hàng</h1>
          <p className="page-description">Tra cứu, theo dõi và quản lý các chỉ thị xuất hàng</p>
        </div>
      </header>

      <section className="controls-panel" aria-label="Tìm kiếm xuất hàng">
        <h2>Tìm kiếm đơn xuất hàng</h2>

        <form className="search-form" onSubmit={handleSearch}>
          <label htmlFor="saleout-search-field">Tên trường</label>

          <select
            id="saleout-search-field"
            value={field}
            onChange={(e) => setField(e.target.value)}
          >
            {SEARCH_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <input
            id="saleout-search-keyword"
            type="search"
            placeholder="Nhập nội dung cần tìm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <button type="submit" disabled={isLoading}>
            Tìm kiếm
          </button>
        </form>

        <div className="action-buttons">
          <button type="button" onClick={() => setShowCreate(true)}>
            Thêm mới
          </button>
          <button type="button" onClick={() => window.alert('Chức năng Tải file mẫu (Task 46.4)')}>
            Tải file mẫu
          </button>
          <button type="button" onClick={() => window.alert('Chức năng Tải lên file (Task 46.5)')}>
            Tải lên file
          </button>
          <button type="button" onClick={() => window.alert('Chức năng In phiếu (Task 46.6)')}>
            In phiếu
          </button>
          <button type="button" onClick={() => window.alert('Chức năng Báo cáo doanh thu (Task 46.7)')}>
            Báo cáo doanh thu
          </button>
        </div>
      </section>

      {notice && <p role="status">{notice}</p>}
      {showCreate && <CreateSaleOut onClose={() => setShowCreate(false)} onCreated={(number) => { setShowCreate(false); setNotice(`Đã tạo phiếu ${number}.`); setPage(1); setRevision(value => value + 1) }} />}

      <section className="results-panel" aria-label="Danh sách xuất hàng">
        <div className="results-heading">
          <div>
            <h2>Danh sách đơn xuất hàng</h2>
            <p>Dữ liệu phiếu xuất kho và thông tin giao nhận thực tế</p>
          </div>

          <div className="page-size">
            <label htmlFor="saleout-page-size">Số bản ghi mỗi trang</label>
            <select
              id="saleout-page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMessage && (
          <p className="error-message" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="table-container">
          <table className="wide-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Thao tác</th>
                <th>Mã số phiếu</th>
                <th>Số PO khách hàng</th>
                <th>Ngày đặt hàng</th>
                <th>Khách hàng</th>
                <th>Mã sản phẩm</th>
                <th>Tên sản phẩm</th>
                <th>Đơn vị tính</th>
                <th style={{ textAlign: 'right' }}>Số lượng</th>
                <th style={{ textAlign: 'right' }}>Số lượng/thùng</th>
                <th style={{ textAlign: 'right' }}>Số thùng</th>
                <th style={{ textAlign: 'right' }}>Đơn giá</th>
                <th style={{ textAlign: 'right' }}>Thành tiền</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="14">Đang tải dữ liệu...</td>
                </tr>
              ) : saleOuts.length === 0 ? (
                <tr>
                  <td colSpan="14">
                    {errorMessage ? 'Không thể hiển thị dữ liệu.' : 'Không có dữ liệu xuất hàng.'}
                  </td>
                </tr>
              ) : (
                saleOuts.map((item, index) => (
                  <tr key={item.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>
                      <button
                        type="button"
                        style={{ marginRight: '6px' }}
                        onClick={() => window.alert(`Sửa đơn hàng: ${item.customerPoNo}`)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => window.alert(`Xoá đơn hàng: ${item.customerPoNo}`)}
                      >
                        Xoá
                      </button>
                    </td>
                    <td><strong>{item.saleOutNo}</strong></td>
                    <td>{item.customerPoNo}</td>
                    <td>{formatOrderDate(item.orderDate)}</td>
                    <td>{item.customerName}</td>
                    <td className="product-code">{item.productCode}</td>
                    <td>{item.productName}</td>
                    <td>{item.unit}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(item.quantity, 3)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(item.quantityPerBox, 3)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(item.boxQuantity, 3)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#286b4b' }}>
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>Tổng số: <strong>{totalCount}</strong> bản ghi</span>

          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Trang trước
          </button>

          <span>
            Trang <strong>{page}</strong> / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Trang sau
          </button>
        </div>
      </section>
    </main>
  )
}
