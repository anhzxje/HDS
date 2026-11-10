import { useEffect, useState } from 'react'
import { fetchSaleOutNumbers } from '../../api/saleOutApi'

export default function SaleOutPrintDialog({ onClose }) {
  const [numbers, setNumbers] = useState([])
  const [selectedNumber, setSelectedNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadNumbers() {
      try {
        const data = await fetchSaleOutNumbers(controller.signal)
        setNumbers(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadNumbers()

    return () => controller.abort()
  }, [])

  function handleExport(event) {
    event.preventDefault()

    if (!selectedNumber) {
      setError('Vui lòng chọn mã số phiếu.')
      return
    }

    setError('')

    window.location.href =
      `/api/saleouts/${encodeURIComponent(selectedNumber)}/pdf`
  }

  return (
    <div className="modal-overlay">
      <div
        className="edit-modal print-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-saleout-title"
      >
        <h2 id="print-saleout-title">In phiếu</h2>
        <p className="print-dialog-description">Chọn phiếu xuất hàng để tải xuống bản PDF.</p>

        <form onSubmit={handleExport}>
          <label className="print-dialog-label" htmlFor="saleout-number">
            Mã số phiếu <span aria-hidden="true">*</span>
          </label>

          <select
            id="saleout-number"
            value={selectedNumber}
            onChange={(event) => setSelectedNumber(event.target.value)}
            disabled={loading}
            required
          >
            <option value="">
              {loading ? 'Đang tải...' : '-- Chọn mã số phiếu --'}
            </option>

            {numbers.map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>

          {!loading && numbers.length === 0 && !error && (
            <p>Chưa có phiếu xuất hàng.</p>
          )}

          {error && <p role="alert">{error}</p>}

          <div className="print-dialog-actions">
            <button type="button" onClick={onClose}>
              Đóng
            </button>

            <button className="print-dialog-submit" type="submit" disabled={loading || numbers.length === 0}>
              Xuất dữ liệu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
