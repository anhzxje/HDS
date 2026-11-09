import { useState } from 'react'
import { updateSaleOut } from '../../api/saleOutApi'
import { formatOrderDate } from '../../utils/formatters'

export default function EditSaleOut({ item, onClose, onSaved }) {
  const [form, setForm] = useState({ quantity: item.quantity, quantityPerBox: item.quantityPerBox, price: item.price })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateSaleOut(item.id, Object.fromEntries(Object.entries(form).map(([key, value]) => [key, Number(value)])))
      onSaved()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  return <div className="modal-overlay">
    <section className="edit-modal saleout-modal" role="dialog" aria-modal="true" aria-labelledby="saleout-edit-title">
      <h2 id="saleout-edit-title">Chỉnh sửa xuất hàng</h2>
      <form onSubmit={submit}>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="edit-form-grid">
          <label>Mã số phiếu<input value={item.saleOutNo} disabled /></label>
          <label>Số PO khách hàng<input value={item.customerPoNo} disabled /></label>
          <label>Ngày đặt hàng<input value={formatOrderDate(item.orderDate)} disabled /></label>
          <label>Khách hàng<input value={item.customerName} disabled /></label>
          <label>Sản phẩm<input value={`${item.productCode} (${item.productName})`} disabled /></label>
          <label>Đơn vị tính<input value={item.unit || ''} disabled /></label>
          {[[ 'quantity', 'Số lượng', '1' ], [ 'quantityPerBox', 'Số lượng/thùng', '1' ], [ 'price', 'Đơn giá', '0' ]].map(([field, label, min]) =>
            <label key={field}>{label} *<input required type="number" min={min} max="999999999999999.999" step="1" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} /></label>
          )}
        </div>
        <div className="saleout-actions">
          <button type="button" onClick={onClose} disabled={saving}>Hủy</button>
          <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
        </div>
      </form>
    </section>
  </div>
}
