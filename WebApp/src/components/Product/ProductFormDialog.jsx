import useProductForm from './useProductForm'
import { DECIMAL_STEP, MAX_DECIMAL_VALUE } from '../../utils/decimalRules'
import { PRODUCT_FIELDS } from './productConfig'

export default function ProductFormDialog({ item, onClose, onSaved }) {
  const { form, setForm, error, saving, isEditing, titleId, save } = useProductForm(item, onSaved)

  return (
    <div className="modal-overlay">
      <section className="edit-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm mới sản phẩm'}</h2>
        <form onSubmit={save}>
          <ProductFields form={form} setForm={setForm} isEditing={isEditing} saving={saving} />
          {error && <p className="edit-error" role="alert">{error}</p>}
          <div className="edit-actions">
            <button type="button" onClick={onClose} disabled={saving}>Đóng</button>
            <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ProductFields({ form, setForm, isEditing, saving }) {
  return (
    <div className="edit-form-grid">
      {PRODUCT_FIELDS.map(({ name, label, type = 'text', maxLength }) => (
        <label key={name}>
          {label} *
          <input
            type={type} value={form[name]} maxLength={maxLength} required
            min={type === 'number' ? 0 : undefined}
            step={type === 'number' ? DECIMAL_STEP : undefined}
            max={type === 'number' ? MAX_DECIMAL_VALUE : undefined}
            disabled={saving || (isEditing && ['productCode', 'productName'].includes(name))}
            onChange={event => setForm(current => ({ ...current, [name]: event.target.value }))}
          />
        </label>
      ))}
    </div>
  )
}
