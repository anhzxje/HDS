export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100]
export const SEARCH_FIELDS = [
  { value: 'ProductCode', label: 'Mã sản phẩm' },
  { value: 'ProductName', label: 'Tên sản phẩm' },
  { value: 'Unit', label: 'Đơn vị tính' },
  { value: 'Specification', label: 'Quy cách' },
  { value: 'QuantityPerBox', label: 'Số lượng/Thùng' },
  { value: 'ProductWeight', label: 'Trọng lượng' },
]
export const PRODUCT_FIELDS = [
  { name: 'productCode', label: 'Mã sản phẩm', maxLength: 50 },
  { name: 'productName', label: 'Tên sản phẩm', maxLength: 200 },
  { name: 'unit', label: 'Đơn vị', maxLength: 50 },
  { name: 'specification', label: 'Quy cách', maxLength: 200 },
  { name: 'quantityPerBox', label: 'Số lượng/Thùng', type: 'number' },
  { name: 'productWeight', label: 'Trọng lượng', type: 'number' },
]
