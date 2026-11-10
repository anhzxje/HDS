import { useEffect, useState } from 'react'
import { deleteSaleOut, fetchSaleOuts, importSaleOuts } from '../../api/saleOutApi'
import { DEFAULT_PAGE_SIZE, SEARCH_FIELDS } from './saleOutConfig'

export default function useSaleOuts() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState({ field: SEARCH_FIELDS[0].value, keyword: '' })
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState('')
  const data = useSaleOutData({ page, pageSize, search, revision })

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
  function created(number) {
    setPage(1)
    reload(`Đã tạo phiếu ${number}.`)
  }

  const actions = useSaleOutActions({ data, page, setPage, reload, setNotice })
  return {
    ...data, ...actions, page, pageSize, setPage, notice, reload, created, applySearch, changePageSize,
    totalPages: Math.max(1, Math.ceil(data.totalCount / pageSize)),
  }
}

function useSaleOutData({ page, pageSize, search, revision }) {
  const [saleOuts, setSaleOuts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await fetchSaleOuts({ ...search, page, pageSize, signal: controller.signal })
        if (controller.signal.aborted) return
        setSaleOuts(data.items ?? [])
        setTotalCount(data.totalCount ?? 0)
      } catch (exception) {
        if (controller.signal.aborted || exception.name === 'AbortError') return
        setSaleOuts([])
        setTotalCount(0)
        setErrorMessage(exception.message || 'Không thể tải danh sách xuất hàng.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [page, pageSize, search, revision])
  return { saleOuts, totalCount, isLoading, errorMessage, setErrorMessage }
}

function useSaleOutActions({ data, page, setPage, reload, setNotice }) {
  const [deletingId, setDeletingId] = useState(null)
  async function remove(item) {
    if (deletingId !== null) return
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dòng xuất hàng ${item.productCode} của phiếu ${item.saleOutNo}?`)) return
    setDeletingId(item.id)
    data.setErrorMessage('')
    setNotice('')
    try {
      await deleteSaleOut(item.id)
      if (data.saleOuts.length === 1 && page > 1) {
        setNotice('Đã xóa dòng xuất hàng.')
        setPage(current => current - 1)
      } else {
        reload('Đã xóa dòng xuất hàng.')
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
    const result = await importSaleOuts(file)
    setPage(1)
    reload(`Đã tải lên ${result.importedCount} dòng xuất hàng.`)
  }
  return { deletingId, remove, importFile }
}
