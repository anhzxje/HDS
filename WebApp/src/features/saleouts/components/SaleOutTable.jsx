import { useTranslation } from 'react-i18next'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Button from '@mui/material/Button'
import { formatOrderDate, formatNumber, formatCurrency } from '@/shared/lib/formatters'

const TEXT_HEADERS = ['common.rowNumber', 'common.actions', 'fields.saleOutNo', 'fields.customerPoNo', 'fields.orderDate',
  'fields.customerName', 'fields.productCode', 'fields.productName', 'fields.unit']
const NUMBER_HEADERS = ['fields.quantity', 'fields.quantityPerBox', 'fields.boxQuantity', 'fields.price', 'fields.amount']
const NUMBER_STYLE = { textAlign: 'right' }
const AMOUNT_STYLE = { ...NUMBER_STYLE, fontWeight: 700, color: '#286b4b' }

export default function SaleOutTable({ list, onEdit }) {
  const { t } = useTranslation()
  const { saleOuts, page, pageSize, isLoading, errorMessage, deletingId, remove } = list
  let emptyMessage = t('saleOut.empty')
  if (isLoading) emptyMessage = t('common.loading')
  else if (errorMessage) emptyMessage = t('common.loadFailed')

  return (
    <TableContainer>
      <Table className="wide-table">
        <TableHead>
          <TableRow>
            {TEXT_HEADERS.map(label => <TableCell key={label}>{t(label)}</TableCell>)}
            {NUMBER_HEADERS.map(label => <TableCell key={label} style={NUMBER_STYLE}>{t(label)}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading || saleOuts.length === 0 ? (
            <TableRow><TableCell colSpan={TEXT_HEADERS.length + NUMBER_HEADERS.length}>{emptyMessage}</TableCell></TableRow>
          ) : saleOuts.map((item, index) => (
            <SaleOutRow key={item.id} item={item} number={(page - 1) * pageSize + index + 1}
              deletingId={deletingId} onEdit={onEdit} onDelete={remove} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function SaleOutRow({ item, number, deletingId, onEdit, onDelete }) {
  const { t } = useTranslation()
  return (
    <TableRow>
      <TableCell>{number}</TableCell>
      <TableCell>
        <Button type="button" style={{ marginRight: '6px' }}
          onClick={() => onEdit(item)} disabled={deletingId !== null}>{t('common.edit')}</Button>
        <Button type="button" onClick={() => onDelete(item)} disabled={deletingId !== null}>{t('common.delete')}</Button>
      </TableCell>
      <TableCell><strong>{item.saleOutNo}</strong></TableCell>
      <TableCell>{item.customerPoNo}</TableCell>
      <TableCell>{formatOrderDate(item.orderDate)}</TableCell>
      <TableCell>{item.customerName}</TableCell>
      <TableCell className="product-code">{item.productCode}</TableCell>
      <TableCell>{item.productName}</TableCell>
      <TableCell>{item.unit}</TableCell>
      <TableCell style={NUMBER_STYLE}>{formatNumber(item.quantity, 3)}</TableCell>
      <TableCell style={NUMBER_STYLE}>{formatNumber(item.quantityPerBox, 3)}</TableCell>
      <TableCell style={NUMBER_STYLE}>{formatNumber(item.boxQuantity, 3)}</TableCell>
      <TableCell style={NUMBER_STYLE}>{formatCurrency(item.price)}</TableCell>
      <TableCell style={AMOUNT_STYLE}>{formatCurrency(item.amount)}</TableCell>
    </TableRow>
  )
}
