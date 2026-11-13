import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import FormDialog from '@/shared/components/FormDialog'
import FormField from '@/shared/components/FormField'
import { calculateLine } from '../utils/saleOutForm'
import { formatNumber, formatOrderDate } from '@/shared/lib/formatters'
import { DECIMAL_STEP, MAX_DECIMAL_VALUE } from '@/shared/lib/decimalRules'
import useSaleOutForm from '../hooks/useSaleOutForm'

export default function SaleOutFormDialog({ item, onClose, onSaved }) {
  const { t } = useTranslation()
  const editor = useSaleOutForm(item, onSaved)
  return <FormDialog wide title={t(editor.isEditing ? 'saleOut.edit' : 'saleOut.new')}
    titleId={editor.titleId} onClose={onClose} busy={editor.saving}>
    <form onSubmit={editor.save}>
      {editor.error && <Alert severity="error">{editor.error}</Alert>}
      <div className="edit-form-grid">
        <FormField label={t('fields.saleOutNo')} value={item?.saleOutNo ?? t('saleOut.autoNumber')} disabled />
        <FormField label={t('fields.customerPoNo')} required maxLength={50} value={editor.form.customerPoNo}
          disabled={Boolean(item) || editor.saving} onChange={event => editor.updateHeader('customerPoNo', event.target.value)} />
        <FormField label={t('fields.customerName')} required maxLength={200} value={editor.form.customerName}
          disabled={Boolean(item) || editor.saving} onChange={event => editor.updateHeader('customerName', event.target.value)} />
        <FormField label={t('fields.orderDate')} type={item ? 'text' : 'date'} required
          value={item ? formatOrderDate(item.orderDate) : editor.form.orderDate} disabled={Boolean(item) || editor.saving}
          onChange={event => editor.updateHeader('orderDate', event.target.value)} />
      </div>
      {item ? <div className="edit-form-grid saleout-edit-line">
        <FormField label={t('saleOut.product')} value={`${item.productCode} (${item.productName})`} disabled />
        <FormField label={t('fields.unit')} value={item.unit ?? ''} disabled />
        <NumberFields values={editor.form.items[0]} saving={editor.saving}
          onChange={(field, value) => editor.updateLine(editor.form.items[0].lineId, field, value)} />
      </div> : <>
        <h3>{t('product.list')}</h3>
        {editor.form.items.map((line, index) => <SaleOutLine key={line.lineId} item={line} number={index + 1}
          products={editor.products} disabled={editor.saving || editor.loading}
          onChange={(field, value) => editor.updateLine(line.lineId, field, value)}
          onRemove={editor.form.items.length > 1 ? () => editor.removeLine(line.lineId) : null} />)}
      </>}
      <div className="saleout-actions">
        {!editor.isEditing && <Button onClick={editor.addLine} disabled={editor.saving}>{t('saleOut.addProduct')}</Button>}
        <Button onClick={onClose} disabled={editor.saving}>{t('common.close')}</Button>
        <Button variant="contained" type="submit" disabled={editor.loading || editor.saving}>
          {t(editor.saving ? 'common.saving' : 'common.save')}</Button>
      </div>
    </form>
  </FormDialog>
}

function SaleOutLine({ item, number, products, onChange, onRemove, disabled }) {
  const { t } = useTranslation()
  const product = products.find(option => option.id === item.productId)
  const calculated = calculateLine(item)
  return <fieldset className="saleout-line">
    <legend>{t('saleOut.productLine', { number })}</legend>
    <div className="edit-form-grid">
      <TextField select required label={t('saleOut.product')} value={item.productId} disabled={disabled}
        slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} onChange={event => onChange('productId', event.target.value)}>
        <option value="">{t('saleOut.chooseProduct')}</option>
        {products.map(option => <option key={option.id} value={option.id}>{option.productCode} ({option.productName})</option>)}
      </TextField>
      <FormField label={t('fields.unit')} value={product?.unit || ''} disabled />
      <NumberFields values={item} onChange={onChange} saving={disabled} />
      <FormField label={t('fields.boxQuantity')} value={formatNumber(calculated.boxQuantity, 3)} disabled />
      <FormField label={t('fields.amount')} value={formatNumber(calculated.amount, 3)} disabled />
    </div>
    {onRemove && <Button onClick={onRemove} disabled={disabled}>{t('saleOut.removeLine')}</Button>}
  </fieldset>
}

function NumberFields({ values, onChange, saving }) {
  const { t } = useTranslation()
  return ['quantity', 'quantityPerBox', 'price'].map(name => <FormField key={name} label={t(`fields.${name}`)}
    required type="number" min={name === 'price' ? '0' : DECIMAL_STEP} max={MAX_DECIMAL_VALUE}
    step={DECIMAL_STEP} disabled={saving} value={values[name]} onChange={event => onChange(name, event.target.value)} />)
}
