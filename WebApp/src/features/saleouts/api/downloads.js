export function saleOutPdfUrl(number) { return `/api/saleouts/${encodeURIComponent(number)}/pdf` }
export function revenueReportUrl(startDate, endDate) {
  return `/api/saleouts/revenue-report?${new URLSearchParams({ startDate, endDate })}`
}
