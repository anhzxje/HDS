import { useEffect, useState } from 'react'
import { deleteProduct, fetchProducts, importProducts } from '../../api/productApi'
import { DEFAULT_PAGE_SIZE, SEARCH_FIELDS } from './productConfig'

export default function useProducts() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState({ field: SEARCH_FIELDS[0].value, keyword: '' })
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState('')
  const data = useProductData({ page, pageSize, search, revision })

  function reload(message) {
    setNotice(message)
    setRevision(current => current + 1)
  }
  function applySearch(value) {
    setPage(1)
    setSearch(value)
  }
  function changePageSize(value) {
    setPage(1)
    setPageSize(value)
  }
  function created() {
    setPage(1)
    reload('Đã thêm sản phẩm thành công.')
  }

  const actions = useProductActions({ data, page, setPage, reload, setNotice })
  return {
    ...data, ...actions, page, pageSize, setPage, notice, reload, created, applySearch, changePageSize,
    totalPages: Math.max(1, Math.ceil(data.totalCount / pageSize)),
  }
}

function useProductData({ page, pageSize, search, revision }) {
  const [products, setProducts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await fetchProducts({ ...search, page, pageSize, signal: controller.signal })
        if (controller.signal.aborted) return
        setProducts(data.items ?? [])
        setTotalCount(data.totalCount ?? 0)
      } catch (exception) {
        if (controller.signal.aborted || exception.name === 'AbortError') return
        setProducts([])
        setTotalCount(0)
        setErrorMessage(exception.message || 'Không thể tải danh sách sản phẩm.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [page, pageSize, search, revision])
  return { products, totalCount, isLoading, errorMessage, setErrorMessage }
}

function useProductActions({ data, page, setPage, reload, setNotice }) {
  const [deletingId, setDeletingId] = useState(null)
  async function remove(item) {
    if (deletingId !== null) return
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${item.productName}" không?`)) return
    setDeletingId(item.id)
    data.setErrorMessage('')
    setNotice('')
    try {
      await deleteProduct(item.id)
      if (data.products.length === 1 && page > 1) {
        setNotice('Đã xóa sản phẩm.')
        setPage(current => current - 1)
      } else {
        reload('Đã xóa sản phẩm.')
      }
    } catch (exception) {
      data.setErrorMessage(exception.message)
    } finally {
      setDeletingId(null)
    }
  }
  async function importFile(file) {
    data.setErrorMessage('')
    setNotice('')
    const result = await importProducts(file)
    setPage(1)
    reload(result.message || `Đã tải lên ${result.importedCount} sản phẩm.`)
  }
  return { deletingId, remove, importFile }
}
