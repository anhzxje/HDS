import { useTranslation } from 'react-i18next'
import Pagination from '@mui/material/Pagination'

export default function ResultsPagination({ list }) {
  const { t } = useTranslation()
  return <div className="pagination">
    <span>{t('common.total', { count: list.totalCount })}</span>
    <span>{t('common.page', { page: list.page, total: list.totalPages })}</span>
    <Pagination count={list.totalPages} page={list.page} disabled={list.isLoading}
      onChange={(_, page) => list.setPage(page)} aria-label={t('common.pagination')}
      getItemAriaLabel={(type, page) => type === 'page' ? t('common.pageItem', { page }) :
        t(type === 'previous' ? 'common.previous' : 'common.next')} />
  </div>
}
