import i18n from '../i18n'

export async function confirmDelete(text) {
  const { default: Swal } = await import('sweetalert2')
  return Swal.fire({ title: i18n.t('alert.confirm'), text, icon: 'warning',
    showCancelButton: true, confirmButtonText: i18n.t('common.delete'),
    cancelButtonText: i18n.t('alert.cancel'), focusCancel: true,
  }).then(result => result.isConfirmed)
}

export async function notify(text, icon = 'success') {
  const { default: Swal } = await import('sweetalert2')
  // Toasts leave form input and Backend inline validation available for retry.
  return Swal.fire({ title: i18n.t(`alert.${icon}`), text, icon, toast: true,
    position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true,
  })
}
