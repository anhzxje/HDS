export const DEFAULT_PAGE_SIZE = 10 
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100]
export const SEARCH_FIELDS = [
  { value: 'ProductCode', label: 'fields.productCode' },
  { value: 'ProductName', label: 'fields.productName' },
  { value: 'Unit', label: 'fields.unit' },
  { value: 'Specification', label: 'fields.specification' },
  { value: 'QuantityPerBox', label: 'fields.quantityPerBox' },
  { value: 'ProductWeight', label: 'fields.productWeight' },
]
export const PRODUCT_FIELDS = [
  { name: 'productCode', label: 'fields.productCode', maxLength: 50 },
  { name: 'productName', label: 'fields.productName', maxLength: 200 },
  { name: 'unit', label: 'fields.unit', maxLength: 50 },
  { name: 'specification', label: 'fields.specification', maxLength: 200 },
  { name: 'quantityPerBox', label: 'fields.quantityPerBox', type: 'number' },
  { name: 'productWeight', label: 'fields.productWeight', type: 'number' },
]
