import { useEffect, useState } from 'react'
import { createSaleOut, fetchProductChoices } from '../../api/saleOutApi'
import { calculateLine, validateSaleOut } from '../../utils/saleOutForm'
import { formatNumber } from '../../utils/formatters'

const newLine = () => ({ productId: '', quantity: '', quantityPerBox: '', price: '' })

export default function CreateSaleOut({ onClose, onCreated }) {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ customerPoNo: '', customerName: '', orderDate: '', items: [newLine()] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchProductChoices(controller.signal).then(setProducts).catch(err => {
      if (err.name !== 'AbortError') setError(err.message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  function updateLine(index, field, value) {
    setForm(current => ({ ...current, items: current.items.map((item, i) => {
      if (i !== index) return item
      if (field === 'productId') {
        const product = products.find(p => p.id === value)
        return { ...item, productId: value, quantityPerBox: product?.quantityPerBox ?? '' }
      }
      return { ...item, [field]: value }
    }) }))
  }

  async function submit(event) {
    event.preventDefault()
    const message = validateSaleOut(form)
    if (message) { setError(message); return }
    setSaving(true)
    setError('')
    try {
      const result = await createSaleOut({ ...form, items: form.items.map(item => ({ ...item, quantity: Number(item.quantity), quantityPerBox: Number(item.quantityPerBox), price: Number(item.price) })) })
      onCreated(result.saleOutNo)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  return <div className="modal-overlay">
    <section className="edit-modal saleout-modal" role="dialog" aria-modal="true" aria-labelledby="saleout-create-title">
      <h2 id="saleout-create-title">Thêm mới phiếu xuất hàng</h2>
      <form onSubmit={submit}>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="edit-form-grid">
          <label>Mã số phiếu<input value="Tự sinh khi lưu" disabled /></label>
          <label>Số PO khách hàng *<input required maxLength={50} value={form.customerPoNo} onChange={e => setForm({ ...form, customerPoNo: e.target.value })} /></label>
          <label>Khách hàng *<input required maxLength={200} value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></label>
          <label>Ngày đặt hàng *<input required type="date" value={form.orderDate} onChange={e => setForm({ ...form, orderDate: e.target.value })} /></label>
        </div>
        <h3>Danh sách sản phẩm</h3>
        {form.items.map((item, index) => {
          const product = products.find(p => p.id === item.productId)
          const calculated = calculateLine(item)
          return <fieldset className="saleout-line" key={index}>
            <legend>Sản phẩm {index + 1}</legend>
            <div className="edit-form-grid">
              <label>Sản phẩm *<select required value={item.productId} onChange={e => updateLine(index, 'productId', e.target.value)}><option value="">-- Chọn sản phẩm --</option>{products.map(p => <option key={p.id} value={p.id}>{p.productCode} ({p.productName})</option>)}</select></label>
              <label>Đơn vị tính<input value={product?.unit || ''} disabled /></label>
              {[['quantity', 'Số lượng', '0.001'], ['quantityPerBox', 'Số lượng/thùng', '0.001'], ['price', 'Đơn giá', '0']].map(([field, label, min]) => <label key={field}>{label} *<input required type="number" min={min} max="999999999999999.999" step="0.001" value={item[field]} onChange={e => updateLine(index, field, e.target.value)} /></label>)}
              <label>Số thùng<input value={formatNumber(calculated.boxQuantity, 3)} disabled /></label>
              <label>Thành tiền<input value={formatNumber(calculated.amount, 3)} disabled /></label>
            </div>
            {form.items.length > 1 && <button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}>Xóa dòng</button>}
          </fieldset>
        })}
        <div className="saleout-actions">
          <button type="button" onClick={() => setForm({ ...form, items: [...form.items, newLine()] })}>Thêm sản phẩm</button>
          <button type="button" onClick={onClose} disabled={saving}>Hủy</button>
          <button type="submit" disabled={loading || saving}>{saving ? 'Đang lưu...' : 'Lưu phiếu'}</button>
        </div>
      </form>
    </section>
  </div>
}
