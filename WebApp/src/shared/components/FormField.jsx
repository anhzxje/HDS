import TextField from '@mui/material/TextField'

// Keep native numeric validation attributes on the actual input in MUI v9.
export default function FormField({ min, max, step, maxLength, ...props }) {
  return <TextField {...props} slotProps={{ htmlInput: { min, max, step, maxLength },
    inputLabel: props.type === 'date' ? { shrink: true } : undefined }} />
}
