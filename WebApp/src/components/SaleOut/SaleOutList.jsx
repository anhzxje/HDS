import { useState } from 'react'
import UploadDialog from '../Upload/UploadDialog'
import SaleOutFormDialog from './SaleOutFormDialog'
import SaleOutPrintDialog from './SaleOutPrintDialog'
import SaleOutReportDialog from './SaleOutReportDialog'
import SaleOutResults from './SaleOutResults'
import SaleOutToolbar from './SaleOutToolbar'
import useSaleOuts from './useSaleOuts'

export default function SaleOutList() {
  const list = useSaleOuts()
  const [dialog, setDialog] = useState(null)
  const [editing, setEditing] = useState(null)

  function handleClose() {
    setDialog(null)
    setEditing(null)
  }
  function handleSaved(result) {
    if (result?.saleOutNo) list.created(result.saleOutNo)
    else list.reload('Đã cập nhật dòng xuất hàng.')
    handleClose()
  }

  return (
    <main className="product-page wide">
      <header className="page-header">
        <div>
          <h1>Xuất hàng</h1>
          <p className="page-description">Tra cứu, theo dõi và quản lý các chỉ thị xuất hàng</p>
        </div>
      </header>
      <SaleOutToolbar isLoading={list.isLoading} onSearch={list.applySearch} onOpen={setDialog} />
      {list.notice && <p role="status">{list.notice}</p>}
      <SaleOutResults list={list} onEdit={setEditing} />
      {(dialog === 'create' || editing) && <SaleOutFormDialog key={editing?.id ?? 'create'}
        item={editing} onClose={handleClose} onSaved={handleSaved} />}
      {dialog === 'upload' && <UploadDialog onClose={handleClose} onUpload={list.importFile} />}
      {dialog === 'print' && <SaleOutPrintDialog onClose={handleClose} />}
      {dialog === 'report' && <SaleOutReportDialog onClose={handleClose} />}
    </main>
  )
}
