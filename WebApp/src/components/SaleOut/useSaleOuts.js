import i18n from '../../i18n'
import { confirmDelete, notify } from '../../utils/alerts'
import { useEffect, useRef, useState } from 'react'
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
    if (message) notify(message)
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
    reload(i18n.t('saleOut.created', { number }))
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
        setErrorMessage(exception.message || i18n.t('error.saleOuts'))
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
  const deletePending = useRef(false)
  async function remove(item) {
    if (deletePending.current) return
    deletePending.current = true
    setDeletingId(item.id)
    try {
      if (!await confirmDelete(i18n.t('saleOut.confirmDelete', { code: item.productCode, number: item.saleOutNo }))) return
      data.setErrorMessage('')
      setNotice('')
      await deleteSaleOut(item.id)
      if (data.saleOuts.length === 1 && page > 1) {
        setNotice(i18n.t('saleOut.deleted'))
        notify(i18n.t('saleOut.deleted'))
        setPage(current => current - 1)
      } else {
        reload(i18n.t('saleOut.deleted'))
      }
    } catch (exception) {
      data.setErrorMessage(exception.message)
      notify(exception.message, 'error')
    } finally {
      setDeletingId(null)
      deletePending.current = false
    }
  }
  async function importFile(file) {
    data.setErrorMessage('')
    setNotice('')
    const result = await importSaleOuts(file)
    setPage(1)
    reload(i18n.t('saleOut.imported', { count: result.importedCount }))
  }
  return { deletingId, remove, importFile }
}
