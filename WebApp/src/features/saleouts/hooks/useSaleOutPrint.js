import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { notify } from '@/shared/lib/alerts'
import { downloadFile } from '@/shared/lib/downloads'
import { saleOutPdfUrl } from '../api/downloads'
import { fetchSaleOutNumbers } from '../api/saleOutApi'

export default function useSaleOutPrint() {
  const { t } = useTranslation()
  const [numbers, setNumbers] = useState([])
  const [selectedNumber, setSelectedNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const data = await fetchSaleOutNumbers(controller.signal)
        if (!controller.signal.aborted) setNumbers(data)
      } catch (err) {
        if (!controller.signal.aborted && err.name !== 'AbortError') {
          setError(err.message)
          notify(err.message, 'error')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])
  function handleExport(event) {
    event.preventDefault()
    if (!selectedNumber) {
      setError(t('validation.number'))
      notify(t('validation.number'), 'warning')
      return
    }
    setError('')
    downloadFile(saleOutPdfUrl(selectedNumber))
  }
  return { numbers, selectedNumber, setSelectedNumber, loading, error, handleExport }
}
