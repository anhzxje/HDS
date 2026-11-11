# Báo cáo Frontend HDS — 11/11/2026

Đã tích hợp và sử dụng thực tế React + Material UI + i18next/react-i18next + SweetAlert2 + Redux Toolkit trong `WebApp/`. Không thêm dependency, không sửa Backend hoặc API contract. Các API services, custom hooks, phép tính và quy tắc validation hiện có được giữ lại; thay đổi ở services chỉ là dịch thông báo dự phòng do Frontend tạo.

## Công nghệ và bằng chứng sử dụng

### React

Giữ cấu trúc component và custom hooks; state nhập liệu, dialog, dòng đang sửa và bộ lọc tiếp tục là local state. Hai màn hình được tải bằng `lazy`/`Suspense` trong [App.jsx](src/App.jsx).

[ProductList.jsx](src/components/Product/ProductList.jsx):

```jsx
const [dialog, setDialog] = useState(null)
const [editing, setEditing] = useState(null)
```

Các hook tiếp tục sử dụng: `useProducts`, `useProductForm`, `useSaleOuts`, `useSaleOutForm`. Giữ AbortController khi tải danh sách/lựa chọn sản phẩm.

### Material UI

- Bảng: [ProductTable.jsx](src/components/Product/ProductTable.jsx), [SaleOutTable.jsx](src/components/SaleOut/SaleOutTable.jsx) dùng `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`, `TableContainer`.
- Form: [ProductFormDialog.jsx](src/components/Product/ProductFormDialog.jsx), [SaleOutFormDialog.jsx](src/components/SaleOut/SaleOutFormDialog.jsx) dùng `Button`, `TextField` thông qua `FormField` và thông báo `Alert`.
- Dialog dùng chung: [FormDialog.jsx](src/components/common/FormDialog.jsx); được dùng cho tạo/sửa, import, in PDF và báo cáo. MUI quản lý focus; khi đang lưu/upload, `onClose` chặn Escape/backdrop.
- Input: [FormField.jsx](src/components/common/FormField.jsx) đặt `min`, `max`, `step`, `maxLength` lên input thật qua `slotProps.htmlInput` của MUI v9.
- Phân trang dùng chung: [ResultsPagination.jsx](src/components/common/ResultsPagination.jsx).
- Theme, `CssBaseline`, locale MUI Việt/Anh: [AppProviders.jsx](src/AppProviders.jsx). CSS cũ của control/modal được bỏ, CSS bố cục được giữ gọn để không ghi đè MUI.

```jsx
<Pagination count={list.totalPages} page={list.page} disabled={list.isLoading}
  onChange={(_, page) => list.setPage(page)} aria-label={t('common.pagination')}
  getItemAriaLabel={/* nhãn tiếng Việt/Anh */} />
```

Đối chiếu API input với [tài liệu TextField MUI](https://mui.com/material-ui/react-text-field/).

### i18next và react-i18next

Khởi tạo trong [i18n.js](src/i18n.js); từ điển [vi.json](src/locales/vi.json), [en.json](src/locales/en.json). Dùng key cho nhãn, tiêu đề, lựa chọn tìm kiếm, bảng, nút, aria-label, xác nhận, validation và thông báo lỗi dự phòng. Tên/mã sản phẩm và nội dung Backend không bị dịch.

```js
// src/i18n.js
resources: { vi: { translation: vi }, en: { translation: en } },
lng: savedLanguage(), fallbackLng: 'vi', supportedLngs: ['vi', 'en'],
```

```jsx
// src/components/Product/ProductFormDialog.jsx
const { t } = useTranslation()
<Button onClick={onClose} disabled={saving}>{t('common.close')}</Button>
```

Bộ chọn ngôn ngữ trong [TabNav.jsx](src/components/Navigation/TabNav.jsx) dispatch `setLanguage`; `AppProviders` cập nhật i18next, MUI locale, `html.lang`, tiêu đề trang và `localStorage`. Đổi ngôn ngữ không remount form đang nhập. Định dạng số theo locale; đơn vị tiền vẫn là VNĐ.

Cấu hình dựa trên [tài liệu i18next](https://www.i18next.com/overview/configuration-options).

### SweetAlert2

[alerts.js](src/utils/alerts.js) tải SweetAlert2 khi cần. Cả [useProducts.js](src/components/Product/useProducts.js) và [useSaleOuts.js](src/components/SaleOut/useSaleOuts.js) gọi xác nhận trước DELETE; không còn `window.confirm`.

```js
const { default: Swal } = await import('sweetalert2')
return Swal.fire({ title: i18n.t('alert.confirm'), text, icon: 'warning',
  showCancelButton: true, confirmButtonText: i18n.t('common.delete'),
  cancelButtonText: i18n.t('alert.cancel'), focusCancel: true,
}).then(result => result.isConfirmed)
```

`deletePending` dùng `useRef` khóa bấm liên tiếp ngay trước khi chờ xác nhận. Chỉ gửi DELETE khi người dùng đồng ý; xóa dòng cuối trang sẽ lùi một trang. Toast `success` cho tạo/sửa/xóa/import; `error` cho lỗi lưu/xóa/import; `warning` cho validation và xác nhận xóa. Thông báo Backend truyền bằng `text`, vẫn hiện inline để sửa và thử lại. CSS đặt SweetAlert phía trên MUI Dialog.

API được đối chiếu với [SweetAlert2](https://sweetalert2.github.io/).

### Redux Toolkit

Store: [store/index.js](src/store/index.js). Slice: [preferencesSlice.js](src/store/preferencesSlice.js). Provider được gắn tại [main.jsx](src/main.jsx).

```js
export const createAppStore = () => configureStore({ reducer: { preferences } })
```

```jsx
<StrictMode><Provider store={store}><AppProviders><App /></AppProviders></Provider></StrictMode>
```

Redux giữ `activeTab` dùng chung giữa `TabNav`/`App` và `language` dùng chung giữa `TabNav`/`AppProviders` cùng các consumer i18next/MUI. Reducer chỉ chấp nhận tab/ngôn ngữ được hỗ trợ. Chỉ lưu ngôn ngữ vào localStorage; nếu storage bị chặn, ứng dụng vẫn dùng được. Không đưa dữ liệu nhập, trạng thái dialog hoặc mọi request vào Redux.

Mẫu slice theo [tài liệu Redux Toolkit](https://redux-toolkit.js.org/api/createSlice).

## Kiểm thử

Chạy từ thư mục gốc dự án:

```sh
npm run lint --prefix WebApp
npm test --prefix WebApp
npm run build --prefix WebApp
git diff --check
```

Kết quả cuối: lint đạt; **10 file test, 109 test đạt**; production build thành công; `git diff --check` sạch. Trước thay đổi có 7 file/89 test đạt.

| Phạm vi | Bằng chứng |
|---|---|
| Tạo/sửa sản phẩm, giữ nguyên mã/tên khi sửa, payload và lỗi API | `src/components/Product/useProductForm.test.js`, `src/utils/productForm.test.js`, `src/workflows.integration.test.jsx` |
| Tạo/sửa xuất hàng, header không đổi khi sửa, chọn sản phẩm, copy số lượng/thùng, thêm/xóa dòng, chặn trùng, tính toán và payload | `src/components/SaleOut/useSaleOutForm.test.js`, `src/utils/saleOutForm.test.js`, `src/utils/decimalRules.test.js`, `src/workflows.integration.test.jsx` |
| Hủy/đồng ý xóa, khóa xác nhận lặp, encode ID, lùi trang cuối, lỗi Backend giữ nguyên | `src/components/common/deletion.test.jsx` cho cả hai màn hình |
| Tìm kiếm trim keyword, giữ tên field, đổi page size và sang trang sau | `src/frontend.integration.test.jsx` cho cả hai màn hình |
| Import Excel, khóa upload, chặn đóng khi đang chạy, lỗi và thử lại, multipart tên `file`, về trang 1 | `src/components/Upload/UploadDialog.test.jsx`, `src/workflows.integration.test.jsx` |
| URL Excel mẫu, số phiếu PDF được encode, report giữ `startDate`/`endDate`, chặn khoảng ngày ngược | `src/workflows.integration.test.jsx` |
| VI/EN, giữ dữ liệu form khi đổi ngôn ngữ, ngôn ngữ lưu lại, bộ từ điển có cùng key/placeholder, dịch validation nhưng giữ thông báo Backend | `src/frontend.integration.test.jsx`, `src/workflows.integration.test.jsx` |
| HTTP errors/validation response và query contract | `src/api/http.test.js` |

Ngoài Vitest, đã chạy Chromium headless ở desktop 1440px và mobile 390px với toàn bộ API được chặn bằng fixture. Đã thao tác CRUD trên cả hai màn hình, SweetAlert2 thật (hủy/đồng ý/toast), chọn file import, đổi ngôn ngữ và reload, khởi tạo tải PDF/báo cáo; kiểm tra không tràn chiều ngang trang ở mobile và không có lỗi JavaScript chưa xử lý.

Ảnh kiểm tra tạm thời: `/tmp/hds-desktop.png`, `/tmp/hds-mobile.png`; script chạy trong phiên: `/tmp/hds-browser.mjs`. Browser test dùng Playwright có sẵn trong môi trường, không thêm package vào HDS. Test Vitest mock SweetAlert2 và assert options; browser test dùng thư viện thật.

## Giới hạn còn lại

- Build có cảnh báo chunk chính khoảng **525.27 kB** minified (**167.78 kB gzip**), vượt ngưỡng cảnh báo 500 kB. Các màn hình và SweetAlert2 đã được tải động; cảnh báo không làm build thất bại.
- Kiểm thử Frontend dùng API giả lập, chưa kiểm thử end-to-end với Backend/cơ sở dữ liệu thật. Không khẳng định đã kiểm tra nội dung file PDF/Excel hoặc xử lý workbook phía Backend; mới xác minh giao diện, multipart request, URL và việc bắt đầu tải file.
- Các thông báo đã tạo trước khi đổi ngôn ngữ giữ ngôn ngữ tại thời điểm thao tác; nhãn/form/bảng và thông báo phát sinh tiếp theo dùng ngôn ngữ mới. Thông báo Backend luôn giữ nguyên nội dung theo yêu cầu.
- Bảng nhiều cột cuộn ngang trong vùng `TableContainer` ở màn hình nhỏ. Input file và thẻ `form` vẫn dùng HTML native phù hợp; các control chính đã dùng MUI.

Không phát hiện lỗi chặn chức năng trong phạm vi kiểm thử trên. Không thay đổi package.json/package-lock.json, không chạy thao tác ghi vào dữ liệu Backend thật.
