import { useRef, useState } from 'react'
import usePaginatedList from '@/shared/hooks/usePaginatedList'
import i18n from '@/shared/i18n'
import { confirmDelete, notify } from '@/shared/lib/alerts'
import { deleteSaleOut, fetchSaleOuts, importSaleOuts } from '../api/saleOutApi'
import { DEFAULT_PAGE_SIZE, SEARCH_FIELDS } from '../saleOutConfig'

export default function useSaleOuts() {
  const { items, setNotice, ...list } = usePaginatedList({
    fetchPage: fetchSaleOuts, defaultPageSize: DEFAULT_PAGE_SIZE,
    defaultSearchField: SEARCH_FIELDS[0].value, errorKey: 'error.saleOuts',
  })
  function created(number) {
    list.setPage(1)
    list.reload(i18n.t('saleOut.created', { number }))
  }
  const data = { saleOuts: items, ...list }
  const actions = useSaleOutActions({ data, page: list.page, setPage: list.setPage, reload: list.reload, setNotice })
  return { ...data, ...actions, created }
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
