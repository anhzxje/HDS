import { useState } from 'react'
import { createProduct, updateProduct } from '../../api/productApi'
import { buildProductPayload, createProductForm } from '../../utils/productForm'

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
    try {
      const payload = buildProductPayload(form, isEditing)
      setSaving(true)
      const result = isEditing
        ? await updateProduct(item.id, payload)
        : await createProduct(payload)
      onSaved(result)
    } catch (exception) {
      setError(exception.message || 'Không thể kết nối đến WebApi.')
    } finally {
      setSaving(false)
    }
  }

  return { form, setForm, error, saving, isEditing, titleId, save }
}
