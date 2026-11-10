export async function requestJson(url, options, fallbackMessage) {
  const response = await fetch(url, options)
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const validationMessage = Object.values(data?.errors ?? {}).flat().join(' ')
    throw new Error(data?.message || validationMessage || fallbackMessage)
  }
  if (response.status === 204) return undefined
  return response.json()
}

export function buildPageQuery({ field, keyword, page, pageSize }) {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (keyword?.trim()) {
    query.set('field', field)
    query.set('keyword', keyword.trim())
  }
  return query
}

export function sendJson(url, method, payload, fallbackMessage) {
  const options = { method }
  if (payload !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(payload)
  }
  return requestJson(url, options, fallbackMessage)
}

export function uploadFile(url, file, fallbackMessage) {
  const body = new FormData()
  body.append('file', file)
  return requestJson(url, { method: 'POST', body }, fallbackMessage)
}
