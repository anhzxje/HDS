import { useEffect, useState } from 'react'
import { notify } from '@/shared/lib/alerts'
import { fetchProductChoices } from '@/features/products/api'
import { createSaleOut, updateSaleOut } from '../api/saleOutApi'
import {
  toSaleOutNumbers, validateSaleOut, validateSaleOutNumbers,
  createLine, createForm, buildPayload, updateFormLine,
} from '../utils/saleOutForm'

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
    if (message) { setError(message); notify(message, 'warning'); return }
    setSaving(true)
    setError('')
    try {
      const result = isEditing
        ? await updateSaleOut(item.id, toSaleOutNumbers(form.items[0]))
        : await createSaleOut(buildPayload(form))
      onSaved(result)
    } catch (exception) {
      setError(exception.message)
      notify(exception.message, 'error')
    } finally {
      setSaving(false)
    }
  }
  return {
    form, products: choices.products, loading: choices.loading, error: error || choices.error,
    saving, isEditing, titleId, updateHeader, updateLine, addLine, removeLine, save,
  }
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
