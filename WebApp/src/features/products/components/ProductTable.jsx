import { useTranslation } from 'react-i18next'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Button from '@mui/material/Button'
export default function ProductTable({ list, onEdit }) {
  const { t } = useTranslation()
  const { isLoading, products, errorMessage, page, pageSize, deletingId, remove } = list
  let emptyMessage = t('product.empty')
  if (isLoading) emptyMessage = t('common.loading')
  else if (errorMessage) emptyMessage = t('common.loadFailed')
  return (
    <TableContainer>
      <Table className="wide-table product-table">
        <TableHead><TableRow>
          <TableCell>{t('common.rowNumber')}</TableCell><TableCell>{t('common.actions')}</TableCell><TableCell>{t('fields.productCode')}</TableCell><TableCell>{t('fields.productName')}</TableCell>
          <TableCell>{t('fields.unit')}</TableCell><TableCell>{t('fields.specification')}</TableCell><TableCell>{t('fields.quantityPerBox')}</TableCell><TableCell>{t('fields.productWeight')}</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {isLoading || products.length === 0 ? <TableRow><TableCell colSpan={8}>{emptyMessage}</TableCell></TableRow> : products.map((product, index) => (
            <ProductRow key={product.id} product={product} number={(page - 1) * pageSize + index + 1}
              deletingId={deletingId} onDelete={remove} onEdit={onEdit} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function ProductRow({ product, number, deletingId, onDelete, onEdit }) {
  const { t } = useTranslation()
  return (
    <TableRow>
      <TableCell>{number}</TableCell>
      <TableCell>
        <Button type="button" onClick={() => onEdit(product)} disabled={deletingId !== null}
          aria-label={`${t('common.edit')} ${product.productName}`}>{t('common.edit')}</Button>
        <Button type="button" onClick={() => onDelete(product)} disabled={deletingId !== null}
          aria-label={`${t('common.delete')} ${product.productName}`}>{deletingId === product.id ? t('common.deleting') : t('common.delete')}</Button>
      </TableCell>
      <TableCell className="product-code">{product.productCode}</TableCell><TableCell>{product.productName}</TableCell>
      <TableCell>{product.unit}</TableCell><TableCell>{product.specification}</TableCell>
      <TableCell>{product.quantityPerBox}</TableCell><TableCell>{product.productWeight}</TableCell>
    </TableRow>
  )
}
