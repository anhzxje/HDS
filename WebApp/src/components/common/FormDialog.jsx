import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'

export default function FormDialog({ title, titleId, onClose, busy = false, wide = false, children }) {
  return <Dialog open fullWidth maxWidth={wide ? 'lg' : 'sm'} aria-labelledby={titleId}
    onClose={() => { if (!busy) onClose() }}>
    <DialogTitle id={titleId}>{title}</DialogTitle>
    <DialogContent dividers>{children}</DialogContent>
  </Dialog>
}
