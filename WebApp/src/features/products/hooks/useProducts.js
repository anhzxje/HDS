import { useRef, useState } from 'react'
import usePaginatedList from '@/shared/hooks/usePaginatedList'
import i18n from '@/shared/i18n'
import { confirmDelete, notify } from '@/shared/lib/alerts'
import { deleteProduct, fetchProducts, importProducts } from '../api/productApi'
import { DEFAULT_PAGE_SIZE, SEARCH_FIELDS } from '../productConfig'

export default function useProducts() {
  const { items, setNotice, ...list } = usePaginatedList({
    fetchPage: fetchProducts, defaultPageSize: DEFAULT_PAGE_SIZE,
    defaultSearchField: SEARCH_FIELDS[0].value, errorKey: 'error.products',
  })
  function created() {
    list.setPage(1)
    list.reload(i18n.t('product.created'))
  }
  const data = { products: items, ...list }
  const actions = useProductActions({ data, page: list.page, setPage: list.setPage, reload: list.reload, setNotice })
  return { ...data, ...actions, created }
}

function useProductActions({ data, page, setPage, reload, setNotice }) {
  const [deletingId, setDeletingId] = useState(null)
  const deletePending = useRef(false)
  async function remove(item) {
    if (deletePending.current) return
    deletePending.current = true
    setDeletingId(item.id)
    try {
      if (!await confirmDelete(i18n.t('product.confirmDelete', { name: item.productName }))) return
      data.setErrorMessage('')
      setNotice('')
      await deleteProduct(item.id)
      if (data.products.length === 1 && page > 1) {
        setNotice(i18n.t('product.deleted'))
        notify(i18n.t('product.deleted'))
        setPage(current => current - 1)
      } else {
        reload(i18n.t('product.deleted'))
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
    const result = await importProducts(file)
    setPage(1)
    reload(result.message || i18n.t('product.imported', { count: result.importedCount }))
  }
  return { deletingId, remove, importFile }
}
