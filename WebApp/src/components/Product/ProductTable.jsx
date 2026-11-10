export default function ProductTable({ list, onEdit }) {
  const { isLoading, products, errorMessage, page, pageSize, deletingId, remove } = list
  let emptyMessage = 'Không có sản phẩm.'
  if (isLoading) emptyMessage = 'Đang tải dữ liệu...'
  else if (errorMessage) emptyMessage = 'Không thể hiển thị dữ liệu.'
  return (
    <div className="table-container">
      <table className="wide-table">
        <thead><tr>
          <th>STT</th><th>Thao tác</th><th>Mã sản phẩm</th><th>Tên sản phẩm</th>
          <th>Đơn vị tính</th><th>Quy cách</th><th>Số lượng/Thùng</th><th>Trọng lượng</th>
        </tr></thead>
        <tbody>
          {isLoading || products.length === 0 ? <tr><td colSpan="8">{emptyMessage}</td></tr> : products.map((product, index) => (
            <ProductRow key={product.id} product={product} number={(page - 1) * pageSize + index + 1}
              deletingId={deletingId} onDelete={remove} onEdit={onEdit} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProductRow({ product, number, deletingId, onDelete, onEdit }) {
  return (
    <tr>
      <td>{number}</td>
      <td>
        <button type="button" onClick={() => onEdit(product)} disabled={deletingId !== null}
          aria-label={`Sửa sản phẩm ${product.productName}`}>Sửa</button>
        <button type="button" onClick={() => onDelete(product)} disabled={deletingId !== null}
          aria-label={`Xóa sản phẩm ${product.productName}`}>{deletingId === product.id ? 'Đang xóa...' : 'Xóa'}</button>
      </td>
      <td className="product-code">{product.productCode}</td><td>{product.productName}</td>
      <td>{product.unit}</td><td>{product.specification}</td>
      <td>{product.quantityPerBox}</td><td>{product.productWeight}</td>
    </tr>
  )
}
