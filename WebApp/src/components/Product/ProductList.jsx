import { useState } from 'react'
import UploadDialog from '../Upload/UploadDialog'
import ProductFormDialog from './ProductFormDialog'
import ProductResults from './ProductResults'
import ProductToolbar from './ProductToolbar'
import useProducts from './useProducts'

export default function ProductList() {
  const list = useProducts()
  const [dialog, setDialog] = useState(null)
  const [editing, setEditing] = useState(null)

  function handleClose() {
    setDialog(null)
    setEditing(null)
  }
  function handleSaved(result) {
    if (result?.newId) list.created()
    else list.reload('Đã cập nhật sản phẩm.')
    handleClose()
  }

  return (
    <main className="product-page wide">
      <header className="page-header">
        <div>
          <h1>Sản phẩm</h1>
          <p className="page-description">Tra cứu và theo dõi thông tin sản phẩm</p>
        </div>
      </header>
      <ProductToolbar isLoading={list.isLoading} onSearch={list.applySearch} onOpen={setDialog} />
      {list.notice && <p role="status">{list.notice}</p>}
      <ProductResults list={list} onEdit={setEditing} />
      {(dialog === 'create' || editing) && <ProductFormDialog key={editing?.id ?? 'create'}
        item={editing} onClose={handleClose} onSaved={handleSaved} />}
      {dialog === 'upload' && <UploadDialog onClose={handleClose} onUpload={list.importFile} />}
    </main>
  )
}
