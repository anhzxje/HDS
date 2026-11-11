import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { notify } from '@/shared/lib/alerts'
import { downloadFile } from '@/shared/lib/downloads'
import { revenueReportUrl } from '../api/downloads'

export default function useRevenueReport() {
  const { t } = useTranslation()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  function handleExport(event) {
    event.preventDefault()
    let message = ''
    if (!startDate || !endDate) message = t('validation.dates')
    else if (startDate > endDate) message = t('validation.dateOrder')
    if (message) {
      setError(message)
      notify(message, 'warning')
      return
    }
    setError('')
    downloadFile(revenueReportUrl(startDate, endDate))
  }
  return { startDate, setStartDate, endDate, setEndDate, error, handleExport }
}
