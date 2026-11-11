import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { useTranslation } from 'react-i18next'
import Swal from 'sweetalert2'
import { createAppStore } from '@/app/store'
import { setActiveTab, setLanguage } from '@/app/store/preferencesSlice'
import AppProviders from '@/app/providers/AppProviders'
import i18n from '@/shared/i18n'
import { savedLanguage, persistLanguage } from '@/shared/lib/languagePreferences'
import { confirmDelete, notify } from '@/shared/lib/alerts'
import { formatNumber, formatCurrency, formatOrderDate } from '@/shared/lib/formatters'

function Consumer() { const { t } = useTranslation(); return <p>{t('product.title')}</p> }

describe('Redux preferences and storage boundaries', () => {
  it('dispatches supported tabs and ignores unsupported navigation without changing old snapshots', () => {
    const store = createAppStore(), previous = store.getState()
    store.dispatch(setActiveTab('product'))
    expect(store.getState().preferences.activeTab).toBe('product')
    expect(previous.preferences.activeTab).toBe('saleOut')
    store.dispatch(setActiveTab('unknown'))
    expect(store.getState().preferences.activeTab).toBe('product')
    store.dispatch(setActiveTab('saleOut'))
    expect(store.getState().preferences.activeTab).toBe('saleOut')
  })

  it('creates independent stores and falls back from unsupported stored language', () => {
    localStorage.setItem('hds.language', 'fr')
    const a = createAppStore(), b = createAppStore()
    a.dispatch(setLanguage('en'))
    expect(a.getState().preferences.language).toBe('en')
    expect(b.getState().preferences.language).toBe('vi')
    a.dispatch(setLanguage(null))
    expect(a.getState().preferences.language).toBe('en')
  })

  it('survives blocked browser storage without failing app startup or language changes', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage denied') })
    expect(savedLanguage()).toBe('vi')
    expect(createAppStore().getState().preferences.language).toBe('vi')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage denied') })
    expect(() => persistLanguage('en')).not.toThrow()
  })

  it('updates the rendered language, document metadata and persistence from Redux', async () => {
    const store = createAppStore()
    render(<Provider store={store}><AppProviders><Consumer /></AppProviders></Provider>)
    expect(screen.getByText('Sản phẩm')).toBeInTheDocument()
    await act(async () => { store.dispatch(setLanguage('en')) })
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toContain(i18n.t('app.title'))
    expect(localStorage.getItem('hds.language')).toBe('en')
  })
})

it('falls back to Vietnamese when an English key is missing and exposes unknown keys', async () => {
  const original = i18n.getResource('en', 'translation', 'product.title')
  try {
    delete i18n.getResourceBundle('en', 'translation')['product.title']
    await i18n.changeLanguage('en')
    expect(i18n.t('product.title')).toBe('Sản phẩm')
    expect(i18n.t('missing.audit.key')).toBe('missing.audit.key')
  } finally { i18n.addResource('en', 'translation', 'product.title', original) }
})

it('formats numbers according to UI language while preserving VND and date display rules', async () => {
  expect(formatOrderDate(20261111)).toBe('11/11/2026')
  expect(formatOrderDate(null)).toBe('')
  expect(formatOrderDate(123)).toBe('123')
  expect(formatNumber(null)).toBe('0')
  expect(formatNumber(undefined)).toBe('0')
  expect(formatNumber(1234.5, 2)).toBe('1.234,50')
  await i18n.changeLanguage('en')
  expect(formatNumber(1234.5, 2)).toBe('1,234.50')
  expect(formatCurrency(1234)).toBe('1,234 đ')
})

it.each(['success', 'error', 'warning'])('uses the translated %s toast and preserves backend text', async icon => {
  await i18n.changeLanguage('en')
  await notify('Thông báo từ Backend', icon)
  expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({
    title: i18n.t(`alert.${icon}`), text: 'Thông báo từ Backend', icon,
    toast: true, showConfirmButton: false, timer: 4000,
  }))
})

it('localizes deletion controls and treats dismissal as cancellation', async () => {
  await i18n.changeLanguage('en')
  Swal.fire.mockResolvedValueOnce({ isDismissed: true })
  expect(await confirmDelete('<script>unsafe</script>')).toBeUndefined()
  expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({
    text: '<script>unsafe</script>', confirmButtonText: 'Delete', cancelButtonText: 'Cancel', focusCancel: true,
  }))
  expect(Swal.fire.mock.calls.at(-1)[0]).not.toHaveProperty('html')
})
