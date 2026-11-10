import { calculateLine } from '../../utils/saleOutForm'
import { formatNumber, formatOrderDate } from '../../utils/formatters'
import { DECIMAL_STEP, MAX_DECIMAL_VALUE } from '../../utils/decimalRules'
import useSaleOutForm from './useSaleOutForm'

const NUMBER_FIELDS = [
  { name: 'quantity', label: 'Số lượng', min: DECIMAL_STEP },
  { name: 'quantityPerBox', label: 'Số lượng/thùng', min: DECIMAL_STEP },
  { name: 'price', label: 'Đơn giá', min: '0' },
]

export default function SaleOutFormDialog({ item, onClose, onSaved }) {
  const editor = useSaleOutForm(item, onSaved)
  return (
    <div className="modal-overlay">
      <section className="edit-modal saleout-modal" role="dialog" aria-modal="true" aria-labelledby={editor.titleId}>
        <h2 id={editor.titleId}>{editor.isEditing ? 'Chỉnh sửa xuất hàng' : 'Thêm mới phiếu xuất hàng'}</h2>
        <form onSubmit={editor.save}>
          {editor.error && <p className="error-message" role="alert">{editor.error}</p>}
          <SaleOutHeader item={item} form={editor.form} onChange={editor.updateHeader} />
          <SaleOutLines editor={editor} item={item} />
          <div className="saleout-actions">
            {!editor.isEditing && <button type="button" onClick={editor.addLine} disabled={editor.saving}>Thêm sản phẩm</button>}
            <button type="button" onClick={onClose} disabled={editor.saving}>Đóng</button>
            <button type="submit" disabled={editor.loading || editor.saving}>{editor.saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function SaleOutHeader({ item, form, onChange }) {
  return (
    <div className="edit-form-grid">
      <label>Mã số phiếu<input value={item?.saleOutNo ?? 'Tự sinh khi lưu'} disabled /></label>
      <label>Số PO khách hàng *
        <input required maxLength={50} value={form.customerPoNo} disabled={Boolean(item)}
          onChange={event => onChange('customerPoNo', event.target.value)} />
      </label>
      <label>Khách hàng *
        <input required maxLength={200} value={form.customerName} disabled={Boolean(item)}
          onChange={event => onChange('customerName', event.target.value)} />
      </label>
      <label>Ngày đặt hàng *
        {item ? <input value={formatOrderDate(item.orderDate)} disabled /> : (
          <input required type="date" value={form.orderDate}
            onChange={event => onChange('orderDate', event.target.value)} />
        )}
      </label>
    </div>
  )
}

function SaleOutLines({ editor, item }) {
  if (item) {
    return (
      <div className="edit-form-grid">
        <label>Sản phẩm<input value={`${item.productCode} (${item.productName})`} disabled /></label>
        <label>Đơn vị tính<input value={item.unit ?? ''} disabled /></label>
        <SaleOutNumberFields values={editor.form.items[0]}
          onChange={(field, value) => editor.updateLine(editor.form.items[0].lineId, field, value)} />
      </div>
    )
  }
  return (
    <>
      <h3>Danh sách sản phẩm</h3>
      {editor.form.items.map((line, index) => (
        <SaleOutLine key={line.lineId} item={line} number={index + 1} products={editor.products}
          onChange={(field, value) => editor.updateLine(line.lineId, field, value)}
          onRemove={editor.form.items.length > 1 ? () => editor.removeLine(line.lineId) : null} />
      ))}
    </>
  )
}

function SaleOutLine({ item, number, products, onChange, onRemove }) {
  const product = products.find(option => option.id === item.productId)
  const calculated = calculateLine(item)
  return (
    <fieldset className="saleout-line">
      <legend>Sản phẩm {number}</legend>
      <div className="edit-form-grid">
        <label>Sản phẩm *
          <select required value={item.productId} onChange={event => onChange('productId', event.target.value)}>
            <option value="">-- Chọn sản phẩm --</option>
            {products.map(option => (
              <option key={option.id} value={option.id}>{option.productCode} ({option.productName})</option>
            ))}
          </select>
        </label>
        <label>Đơn vị tính<input value={product?.unit || ''} disabled /></label>
        <SaleOutNumberFields values={item} onChange={onChange} />
        <label>Số thùng<input value={formatNumber(calculated.boxQuantity, 3)} disabled /></label>
        <label>Thành tiền<input value={formatNumber(calculated.amount, 3)} disabled /></label>
      </div>
      {onRemove && <button type="button" onClick={onRemove}>Xóa dòng</button>}
    </fieldset>
  )
}

function SaleOutNumberFields({ values, onChange }) {
  return NUMBER_FIELDS.map(({ name, label, min }) => (
    <label key={name}>{label} *
      <input required type="number" min={min} max={MAX_DECIMAL_VALUE} step={DECIMAL_STEP}
        value={values[name]} onChange={event => onChange(name, event.target.value)} />
    </label>
  ))
}
