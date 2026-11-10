import { formatOrderDate, formatNumber, formatCurrency } from '../../utils/formatters'

const TEXT_HEADERS = ['STT', 'Thao tác', 'Mã số phiếu', 'Số PO khách hàng', 'Ngày đặt hàng',
  'Khách hàng', 'Mã sản phẩm', 'Tên sản phẩm', 'Đơn vị tính']
const NUMBER_HEADERS = ['Số lượng', 'Số lượng/thùng', 'Số thùng', 'Đơn giá', 'Thành tiền']
const NUMBER_STYLE = { textAlign: 'right' }
const AMOUNT_STYLE = { ...NUMBER_STYLE, fontWeight: 700, color: '#286b4b' }

export default function SaleOutTable({ list, onEdit }) {
  const { saleOuts, page, pageSize, isLoading, errorMessage, deletingId, remove } = list
  let emptyMessage = 'Không có dữ liệu xuất hàng.'
  if (isLoading) emptyMessage = 'Đang tải dữ liệu...'
  else if (errorMessage) emptyMessage = 'Không thể hiển thị dữ liệu.'

  return (
    <div className="table-container">
      <table className="wide-table">
        <thead>
          <tr>
            {TEXT_HEADERS.map(label => <th key={label}>{label}</th>)}
            {NUMBER_HEADERS.map(label => <th key={label} style={NUMBER_STYLE}>{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {isLoading || saleOuts.length === 0 ? (
            <tr><td colSpan={TEXT_HEADERS.length + NUMBER_HEADERS.length}>{emptyMessage}</td></tr>
          ) : saleOuts.map((item, index) => (
            <SaleOutRow key={item.id} item={item} number={(page - 1) * pageSize + index + 1}
              deletingId={deletingId} onEdit={onEdit} onDelete={remove} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SaleOutRow({ item, number, deletingId, onEdit, onDelete }) {
  return (
    <tr>
      <td>{number}</td>
      <td>
        <button type="button" style={{ marginRight: '6px' }}
          onClick={() => onEdit(item)} disabled={deletingId !== null}>Sửa</button>
        <button type="button" onClick={() => onDelete(item)} disabled={deletingId !== null}>Xóa</button>
      </td>
      <td><strong>{item.saleOutNo}</strong></td>
      <td>{item.customerPoNo}</td>
      <td>{formatOrderDate(item.orderDate)}</td>
      <td>{item.customerName}</td>
      <td className="product-code">{item.productCode}</td>
      <td>{item.productName}</td>
      <td>{item.unit}</td>
      <td style={NUMBER_STYLE}>{formatNumber(item.quantity, 3)}</td>
      <td style={NUMBER_STYLE}>{formatNumber(item.quantityPerBox, 3)}</td>
      <td style={NUMBER_STYLE}>{formatNumber(item.boxQuantity, 3)}</td>
      <td style={NUMBER_STYLE}>{formatCurrency(item.price)}</td>
      <td style={AMOUNT_STYLE}>{formatCurrency(item.amount)}</td>
    </tr>
  )
}
