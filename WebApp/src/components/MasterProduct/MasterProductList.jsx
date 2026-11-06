import { useEffect, useState } from 'react'

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100]

const SEARCH_FIELDS = [
  { value: 'ProductCode', label: 'Mã sản phẩm' },
  { value: 'ProductName', label: 'Tên sản phẩm' },
  { value: 'Unit', label: 'Đơn vị tính' },
  { value: 'Specification', label: 'Quy cách' },
  { value: 'QuantityPerBox', label: 'Số lượng/Thùng' },
  { value: 'ProductWeight', label: 'Trọng lượng' },
]

export default function MasterProductList() {
  const [products, setProducts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [field, setField] = useState(SEARCH_FIELDS[0].value)
  const [keyword, setKeyword] = useState('')

  const [search, setSearch] = useState({
    field: SEARCH_FIELDS[0].value,
    keyword: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [deletingId, setDeletingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState({
    unit: '',
    specification: '',
    quantityPerBox: '',
    productWeight: '',
  })
  const [editError, setEditError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const emptyCreateForm = {
    productCode: '',
    productName: '',
    unit: '',
    specification: '',
    quantityPerBox: '',
    productWeight: '',
  }

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createError, setCreateError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setIsLoading(true)
      setErrorMessage('')

      const parameters = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        field: search.field,
        keyword: search.keyword,
      })

      try {
        const response = await fetch(`/api/products?${parameters}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Không tải được dữ liệu. Mã lỗi: ${response.status}`)
        }

        const data = await response.json()

        setProducts(data.items)
        setTotalCount(data.totalCount)
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        setProducts([])
        setTotalCount(0)
        setErrorMessage(error.message || 'Không thể kết nối đến WebApi.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProducts()

    return () => controller.abort()
  }, [page, pageSize, search, reloadKey])

  function handleSearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch({
      field,
      keyword: keyword.trim(),
    })
  }

  function handlePreviousPage() {
    setPage((currentPage) => Math.max(1, currentPage - 1))
  }

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value))
    setPage(1)
  }

  function handleNextPage() {
    setPage((currentPage) => Math.min(totalPages, currentPage + 1))
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xoá sản phẩm "${product.productName}" không?`,
    )

    if (!confirmed) {
      return
    }

    setDeletingId(product.id)
    setErrorMessage('')

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message || `Không thể xoá sản phẩm. Mã lỗi: ${response.status}`)
      }

      if (products.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1)
      } else {
        setReloadKey((currentKey) => currentKey + 1)
      }
    } catch (error) {
      setErrorMessage(error.message || 'Không thể kết nối đến WebApi.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleOpenEdit(product) {
    setEditingProduct(product)
    setEditForm({
      unit: product.unit ?? '',
      specification: product.specification ?? '',
      quantityPerBox: product.quantityPerBox ?? '',
      productWeight: product.productWeight ?? '',
    })
    setEditError('')
  }

  function handleCloseEdit() {
    if (isSaving) {
      return
    }
    setEditingProduct(null)
    setEditError('')
  }

  async function handleSaveEdit(event) {
    event.preventDefault()

    if (isSaving || !editingProduct) {
      return
    }

    const unit = editForm.unit.trim()
    const specification = editForm.specification.trim()

    if (!unit || !specification) {
      setEditError('Đơn vị và quy cách không được để trống.')
      return
    }

    if (
      editForm.quantityPerBox === '' ||
      editForm.productWeight === ''
    ) {
      setEditError('Số lượng/thùng và trọng lượng không được để trống.')
      return
    }

    const quantityPerBox = Number(editForm.quantityPerBox)
    const productWeight = Number(editForm.productWeight)

    if (!Number.isFinite(quantityPerBox) || !Number.isFinite(productWeight)) {
      setEditError('Số lượng/thùng và trọng lượng phải là số hợp lệ.')
      return
    }

    setIsSaving(true)
    setEditError('')

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unit,
          specification,
          quantityPerBox,
          productWeight,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(
          data?.message || `Không thể lưu sản phẩm. Mã lỗi: ${response.status}`,
        )
      }

      setEditingProduct(null)
      setReloadKey((currentKey) => currentKey + 1)
    } catch (error) {
      setEditError(error.message || 'Không thể kết nối đến WebApi.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleOpenCreate() {
    setCreateForm(emptyCreateForm)
    setCreateError('')
    setIsCreateOpen(true)
  }

  function handleCloseCreate() {
    if (isCreating) {
      return
    }
    setIsCreateOpen(false)
    setCreateError('')
  }

  async function handleSaveCreate(event) {
    event.preventDefault()

    if (isCreating) {
      return
    }

    const productCode = createForm.productCode.trim()
    const productName = createForm.productName.trim()
    const unit = createForm.unit.trim()
    const specification = createForm.specification.trim()

    if (!productCode || !productName || !unit || !specification) {
      setCreateError('Vui lòng nhập đầy đủ thông tin sản phẩm.')
      return
    }

    if (
      createForm.quantityPerBox === '' ||
      createForm.productWeight === ''
    ) {
      setCreateError('Vui lòng nhập số lượng/thùng và trọng lượng.')
      return
    }

    const quantityPerBox = Number(createForm.quantityPerBox)
    const productWeight = Number(createForm.productWeight)

    if (!Number.isFinite(quantityPerBox) || !Number.isFinite(productWeight)) {
      setCreateError('Số lượng/thùng và trọng lượng phải là số hợp lệ.')
      return
    }

    setIsCreating(true)
    setCreateError('')

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productCode,
          productName,
          unit,
          specification,
          quantityPerBox,
          productWeight,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const validationMessage = data?.errors
          ? Object.values(data.errors).flat().join(' ')
          : ''

        throw new Error(
          data?.message ||
          validationMessage ||
          `Không thể thêm sản phẩm. Mã lỗi: ${response.status}`,
        )
      }

      setIsCreateOpen(false)
      setReloadKey((currentKey) => currentKey + 1)
      window.alert('Thêm sản phẩm thành công.')
    } catch (error) {
      setCreateError(error.message || 'Không thể kết nối đến WebApi.')
    } finally {
      setIsCreating(false)
    }
  }

  function handleDownloadProducts() {
    window.location.href = '/api/products/export'
  }

  async function handleImportProducts(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setIsImporting(true)

    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(
          data?.message || `Upload thất bại. Mã lỗi: ${response.status}`,
        )
      }

      window.alert(data?.message || 'Upload dữ liệu thành công.')
      setReloadKey((currentKey) => currentKey + 1)
    } catch (error) {
      window.alert(error.message || 'Không thể upload dữ liệu.')
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  return (
    <main className="product-page">
      <header className="page-header">
        <div>
          <p className="page-context">Danh mục sản phẩm</p>
          <h1>Master sản phẩm</h1>
          <p className="page-description">Tra cứu và theo dõi thông tin sản phẩm</p>
        </div>
      </header>

      <section className="controls-panel" aria-label="Tìm kiếm sản phẩm">
        <h2>Tìm kiếm sản phẩm</h2>
        <form className="search-form" onSubmit={handleSearch}>
          <label htmlFor="search-field">Tên trường</label>

          <select
            id="search-field"
            value={field}
            onChange={(event) => setField(event.target.value)}
          >
            {SEARCH_FIELDS.map((searchField) => (
              <option key={searchField.value} value={searchField.value}>
                {searchField.label}
              </option>
            ))}
          </select>

          <label htmlFor="search-keyword">Nội dung tìm kiếm</label>

          <input
            id="search-keyword"
            type="text"
            placeholder="Nội dung tìm kiếm"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <button type="submit" disabled={isLoading}>
            Tìm kiếm
          </button>
        </form>

        <div className="action-buttons">
          <button type="button" onClick={handleOpenCreate}>
            Thêm mới
          </button>
          <button type="button" onClick={handleDownloadProducts}>
            Tải dữ liệu
          </button>
          <label className={`upload-button ${isImporting ? 'is-disabled' : ''}`}>
            <input
              className="upload-input"
              type="file"
              accept=".xlsx"
              onChange={handleImportProducts}
              disabled={isImporting}
            />
            {isImporting ? 'Đang upload...' : 'Upload dữ liệu'}
          </label>
        </div>
      </section>

      <section className="results-panel" aria-label="Danh sách sản phẩm">
        <div className="results-heading">
          <div>
            <h2>Danh sách sản phẩm</h2>
            <p>{isLoading ? 'Đang cập nhật danh sách' : `${totalCount} sản phẩm`}</p>
          </div>
          <div className="page-size">
            <label htmlFor="page-size">Hiển thị</label>
            <select id="page-size" value={pageSize} onChange={handlePageSizeChange}>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>bản ghi trên mỗi trang</span>
          </div>
        </div>

        {errorMessage && (
          <p className="error-message" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Action</th>
                <th>Mã sản phẩm</th>
                <th>Tên sản phẩm</th>
                <th>Đơn vị tính</th>
                <th>Quy cách</th>
                <th>Số lượng/Thùng</th>
                <th>Trọng lượng</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8">Đang tải dữ liệu...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    {errorMessage ? 'Không thể hiển thị dữ liệu.' : 'Không có sản phẩm.'}
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr key={product.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId !== null || isLoading}
                        aria-label={`Xoá sản phẩm ${product.productName}`}
                      >
                        {deletingId === product.id ? 'Đang xoá...' : 'Xoá'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(product)}
                        aria-label={`Sửa sản phẩm ${product.productName}`}
                      >
                        Sửa
                      </button>
                    </td>

                    <td className="product-code">{product.productCode}</td>
                    <td>{product.productName}</td>
                    <td>{product.unit}</td>
                    <td>{product.specification}</td>
                    <td>{product.quantityPerBox}</td>
                    <td>{product.productWeight}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>Tổng số: {totalCount} sản phẩm</span>

          <button
            type="button"
            onClick={handlePreviousPage}
            disabled={page <= 1 || isLoading}
          >
            Previous
          </button>

          <span>
            Trang {page} / {totalPages}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={page >= totalPages || isLoading}
          >
            Next
          </button>
        </div>
      </section>

      {isCreateOpen && (
        <div className="modal-overlay">
          <section
            className="edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-modal-title"
          >
            <h2 id="create-modal-title">Thêm mới sản phẩm</h2>

            <form onSubmit={handleSaveCreate}>
              <div className="edit-form-grid">
                <label>
                  Mã sản phẩm *
                  <input
                    type="text"
                    value={createForm.productCode}
                    maxLength={50}
                    required
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        productCode: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Tên sản phẩm *
                  <input
                    type="text"
                    value={createForm.productName}
                    maxLength={200}
                    required
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        productName: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Đơn vị *
                  <input
                    type="text"
                    value={createForm.unit}
                    maxLength={50}
                    required
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        unit: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Quy cách *
                  <input
                    type="text"
                    value={createForm.specification}
                    maxLength={200}
                    required
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        specification: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Số lượng/Thùng *
                  <input
                    type="number"
                    step="0.001"
                    value={createForm.quantityPerBox}
                    required
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        quantityPerBox: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Trọng lượng *
                  <input
                    type="number"
                    step="0.001"
                    value={createForm.productWeight}
                    required
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        productWeight: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {createError && (
                <p className="edit-error" role="alert">
                  {createError}
                </p>
              )}

              <div className="edit-actions">
                <button
                  type="button"
                  onClick={handleCloseCreate}
                  disabled={isCreating}
                >
                  Đóng
                </button>

                <button type="submit" disabled={isCreating}>
                  {isCreating ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editingProduct && (
        <div className="modal-overlay">
          <section
            className="edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
          >
            <h2 id="edit-modal-title">Chỉnh sửa sản phẩm</h2>

            <form onSubmit={handleSaveEdit}>
              <div className="edit-form-grid">
                <label>
                  Mã sản phẩm *
                  <input
                    value={editingProduct.productCode ?? ''}
                    disabled
                  />
                </label>

                <label>
                  Tên sản phẩm *
                  <input
                    value={editingProduct.productName ?? ''}
                    disabled
                  />
                </label>

                <label>
                  Đơn vị *
                  <input
                    type="text"
                    value={editForm.unit}
                    maxLength={50}
                    required
                    onChange={(event) =>
                      setEditForm({ ...editForm, unit: event.target.value })
                    }
                  />
                </label>

                <label>
                  Quy cách *
                  <input
                    type="text"
                    value={editForm.specification}
                    maxLength={200}
                    required
                    onChange={(event) =>
                      setEditForm({ ...editForm, specification: event.target.value })
                    }
                  />
                </label>

                <label>
                  Số lượng/Thùng *
                  <input
                    type="number"
                    step="0.001"
                    value={editForm.quantityPerBox}
                    required
                    onChange={(event) =>
                      setEditForm({ ...editForm, quantityPerBox: event.target.value })
                    }
                  />
                </label>

                <label>
                  Trọng lượng *
                  <input
                    type="number"
                    step="0.001"
                    value={editForm.productWeight}
                    required
                    onChange={(event) =>
                      setEditForm({ ...editForm, productWeight: event.target.value })
                    }
                  />
                </label>
              </div>

              {editError && (
                <p className="edit-error" role="alert">
                  {editError}
                </p>
              )}

              <div className="edit-actions">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={isSaving}
                >
                  Đóng
                </button>

                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

