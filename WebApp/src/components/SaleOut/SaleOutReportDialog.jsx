import { useState } from 'react'

export default function SaleOutReportDialog({ onClose }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')

  function handleExport(event) {
    event.preventDefault()

    if (!startDate || !endDate) {
      setError('Vui lòng nhập đầy đủ từ ngày và đến ngày.')
      return
    }

    if (startDate > endDate) {
      setError('Từ ngày không được lớn hơn đến ngày.')
      return
    }

    setError('')

    const params = new URLSearchParams({
      startDate,
      endDate,
    })

    window.location.href = `/api/saleouts/revenue-report?${params}`
  }

  return (
    <div className="modal-overlay">
      <div
        className="edit-modal report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
      >
        <h2 id="report-dialog-title">Báo cáo doanh thu</h2>

        <p className="report-dialog-description">
          Chọn khoảng thời gian để xuất báo cáo sản phẩm.
        </p>

        <form onSubmit={handleExport}>
          <div className="report-date-fields">
            <label htmlFor="report-start-date">
              <span>
                Từ ngày <span className="report-required">*</span>
              </span>

              <input
                id="report-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </label>

            <label htmlFor="report-end-date">
              <span>
                Đến ngày <span className="report-required">*</span>
              </span>

              <input
                id="report-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
            </label>
          </div>

          {error && (
            <p className="report-dialog-error" role="alert">
              {error}
            </p>
          )}

          <div className="report-dialog-actions">
            <button type="button" onClick={onClose}>
              Đóng
            </button>

            <button className="report-dialog-submit" type="submit">
              Xuất dữ liệu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}