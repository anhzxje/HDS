import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import FormDialog from '../common/FormDialog'
import FormField from '../common/FormField'
import useProductForm from './useProductForm'
import { DECIMAL_STEP, MAX_DECIMAL_VALUE } from '../../utils/decimalRules'
import { PRODUCT_FIELDS } from './productConfig'

export default function ProductFormDialog({ item, onClose, onSaved }) {
  const { t } = useTranslation()
  const { form, setForm, error, saving, isEditing, titleId, save } = useProductForm(item, onSaved)
  return <FormDialog title={t(isEditing ? 'product.edit' : 'product.new')} titleId={titleId} onClose={onClose} busy={saving}>
    <form onSubmit={save}>
      <div className="edit-form-grid">
        {PRODUCT_FIELDS.map(({ name, label, type = 'text', maxLength }) => (
          <FormField key={name} label={t(label)} type={type} value={form[name]} maxLength={maxLength} required
            min={type === 'number' ? 0 : undefined} step={type === 'number' ? DECIMAL_STEP : undefined}
            max={type === 'number' ? MAX_DECIMAL_VALUE : undefined}
            disabled={saving || (isEditing && ['productCode', 'productName'].includes(name))}
            onChange={event => setForm(current => ({ ...current, [name]: event.target.value }))} />
        ))}
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      <div className="edit-actions">
        <Button onClick={onClose} disabled={saving}>{t('common.close')}</Button>
        <Button variant="contained" type="submit" disabled={saving}>{t(saving ? 'common.saving' : 'common.save')}</Button>
      </div>
    </form>
  </FormDialog>
}
