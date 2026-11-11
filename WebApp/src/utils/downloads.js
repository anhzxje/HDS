// Keep Backend-generated files and existing URL/query contracts.
export function downloadFile(url) { window.location.href = url }
export function saleOutPdfUrl(number) { return `/api/saleouts/${encodeURIComponent(number)}/pdf` }
export function revenueReportUrl(startDate, endDate) {
  return `/api/saleouts/revenue-report?${new URLSearchParams({ startDate, endDate })}`
}
