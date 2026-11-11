import { useEffect, useState } from 'react'
import i18n from '../i18n'
import { notify } from '../lib/alerts'

// Shared mechanics only. Each feature owns mutations, import policy and messages.
export default function usePaginatedList({ fetchPage, defaultPageSize, defaultSearchField, errorKey }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [search, setSearch] = useState({ field: defaultSearchField, keyword: '' })
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState('')
  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await fetchPage({ ...search, page, pageSize, signal: controller.signal })
        if (controller.signal.aborted) return
        setItems(data.items ?? [])
        setTotalCount(data.totalCount ?? 0)
      } catch (exception) {
        if (controller.signal.aborted || exception.name === 'AbortError') return
        setItems([])
        setTotalCount(0)
        setErrorMessage(exception.message || i18n.t(errorKey))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [fetchPage, errorKey, page, pageSize, search, revision])

  return {
    items, totalCount, isLoading, errorMessage, setErrorMessage,
    page, pageSize, setPage, notice, setNotice, reload, applySearch, changePageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  }
}
