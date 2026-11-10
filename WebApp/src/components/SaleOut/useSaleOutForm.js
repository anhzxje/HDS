import { useEffect, useState } from 'react'
import { fetchProductChoices } from '../../api/productApi'
import { createSaleOut, updateSaleOut } from '../../api/saleOutApi'
import { toSaleOutNumbers, validateSaleOut, validateSaleOutNumbers } from '../../utils/saleOutForm'

export default function useSaleOutForm(item, onSaved) {
  const choices = useProductChoices(!item)
  const [form, setForm] = useState(() => createForm(item))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(item)
  const titleId = isEditing ? 'saleout-edit-title' : 'saleout-create-title'
  function updateHeader(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }
  function updateLine(lineId, field, value) {
    setForm(current => updateFormLine(current, choices.products, lineId, field, value))
  }
  function addLine() {
    setForm(current => ({ ...current, items: [...current.items, createLine(current.items.at(-1).lineId + 1)] }))
  }
  function removeLine(lineId) {
    setForm(current => current.items.length === 1 ? current :
      { ...current, items: current.items.filter(line => line.lineId !== lineId) })
  }
  async function save(event) {
    event.preventDefault()
    if (saving || choices.loading) return
    const message = isEditing ? validateSaleOutNumbers(form.items[0]) : validateSaleOut(form)
    if (message) { setError(message); return }
    setSaving(true)
    setError('')
    try {
      const result = isEditing
        ? await updateSaleOut(item.id, toSaleOutNumbers(form.items[0]))
        : await createSaleOut(buildPayload(form))
      onSaved(result)
    } catch (exception) {
      setError(exception.message)
    } finally {
      setSaving(false)
    }
  }
  return {
    form, products: choices.products, loading: choices.loading, error: error || choices.error,
    saving, isEditing, titleId, updateHeader, updateLine, addLine, removeLine, save,
  }
}

function createLine(lineId) {
  return { lineId, productId: '', quantity: '', quantityPerBox: '', price: '' }
}

function createForm(item) {
  const line = item ? { ...createLine(0), productId: item.productId,
    quantity: item.quantity, quantityPerBox: item.quantityPerBox, price: item.price } : createLine(0)
  return { customerPoNo: item?.customerPoNo ?? '', customerName: item?.customerName ?? '',
    orderDate: item?.orderDate ?? '', items: [line] }
}

function buildPayload(form) {
  const items = form.items.map(line => ({ productId: line.productId, ...toSaleOutNumbers(line) }))
  return { ...form, items }
}

function updateFormLine(form, products, lineId, field, value) {
  const items = form.items.map(line => {
    if (line.lineId !== lineId) return line
    if (field !== 'productId') return { ...line, [field]: value }
    const product = products.find(option => option.id === value)
    return { ...line, productId: value, quantityPerBox: product?.quantityPerBox ?? '' }
  })
  return { ...form, items }
}

function useProductChoices(enabled) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!enabled) return undefined
    const controller = new AbortController()
    async function load() {
      try {
        const items = await fetchProductChoices(controller.signal)
        if (!controller.signal.aborted) setProducts(items)
      } catch (exception) {
        if (!controller.signal.aborted && exception.name !== 'AbortError') setError(exception.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [enabled])
  return { products, loading, error }
}
