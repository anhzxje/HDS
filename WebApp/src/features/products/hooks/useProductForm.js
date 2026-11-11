import i18n from '@/shared/i18n'
import { notify } from '@/shared/lib/alerts'
import { useState } from 'react'
import { createProduct, updateProduct } from '../api/productApi'
import { buildProductPayload, createProductForm } from '../utils/productForm'

export default function useProductForm(item, onSaved) {
  const [form, setForm] = useState(() => createProductForm(item))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(item)
  const titleId = isEditing ? 'product-edit-title' : 'product-create-title'

  async function save(event) {
    event.preventDefault()
    if (saving) return
    setError('')
    let requestStarted = false
    try {
      const payload = buildProductPayload(form, isEditing)
      setSaving(true)
      requestStarted = true
      const result = isEditing
        ? await updateProduct(item.id, payload)
        : await createProduct(payload)
      onSaved(result)
    } catch (exception) {
      const message = exception.message || i18n.t('error.connection')
      setError(message)
      notify(message, requestStarted ? 'error' : 'warning')
    } finally {
      setSaving(false)
    }
  }

  return { form, setForm, error, saving, isEditing, titleId, save }
}
