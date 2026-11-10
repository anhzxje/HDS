# HDS Management System

Hệ thống quản lý danh mục sản phẩm (**Master Product**) và phiếu chỉ thị xuất kho (**Sale Out**) được tổ chức theo các tầng Controller, Service và Repository.

---

## 🚀 Tính năng nổi bật

### 1. Quản lý Master Sản phẩm (`MasterProduct`)
* **Tra cứu & Tìm kiếm:** Lọc sản phẩm theo nhiều trường dữ liệu (*Mã SP, Tên SP, Đơn vị tính, Quy cách, Trọng lượng...*).
* **Phân trang tối ưu:** Phân trang trực tiếp từ SQL Server (`OFFSET - FETCH NEXT`) với 20 bản ghi/trang.
* **Quản trị CRUD:** Thêm mới (validate trùng mã), Chỉnh sửa (khóa mã & tên sản phẩm), Xóa an toàn kèm hộp thoại xác nhận.
* **Tương tác Excel:** Tải file mẫu, xuất danh sách và upload hàng loạt sản phẩm từ file `.xlsx`. Dữ liệu được kiểm tra trước khi lưu trong transaction.

### 2. Quản lý Xuất hàng (`SaleOut`)
* **Theo dõi phiếu xuất:** Quản lý mã phiếu tự sinh dạng `STO<yyyyMMxxxx>`, số PO khách hàng, ngày đặt hàng, khách hàng.
* **Thêm, sửa, xóa:** Một phiếu có thể gồm nhiều dòng sản phẩm; khi tạo, hệ thống tính số thùng và thành tiền.
* **Excel:** Tải file mẫu, xuất dữ liệu và upload nhiều dòng xuất hàng. Các dòng cùng PO, ngày đặt hàng và khách hàng được nhóm thành một phiếu.
* **Hiển thị:** Bảng xuất hàng có tìm kiếm, phân trang và định dạng ngày, số tiền.
* **In phiếu và báo cáo:** Chọn mã phiếu để xuất PDF; chọn khoảng ngày để xuất báo cáo doanh thu Excel.

### Nhập dữ liệu từ Excel

Ở mỗi màn hình, chọn **Tải file mẫu**, điền dữ liệu từ dòng thứ hai rồi chọn **Upload dữ liệu** hoặc **Tải lên file**. Chỉ hỗ trợ `.xlsx`, tối đa 5 MB; giữ nguyên tên và thứ tự các cột.

| Màn hình | Các cột trong file mẫu |
| :--- | :--- |
| Sản phẩm | Mã sản phẩm, Tên sản phẩm, Đơn vị tính, Quy cách, Số lượng/thùng, Trọng lượng |
| Xuất hàng | Số PO khách hàng, Ngày đặt hàng, Khách hàng, Mã sản phẩm, Số lượng, Số lượng/thùng, Đơn giá |

Với xuất hàng, nhập ngày theo `yyyy-MM-dd`, `dd/MM/yyyy` hoặc định dạng ngày Excel. Mã sản phẩm phải có trong Master sản phẩm. Không được lặp cặp PO + mã sản phẩm trong file hoặc với dữ liệu đã lưu. Server sinh mã phiếu, lấy thông tin sản phẩm và tính số thùng, thành tiền; toàn bộ lần upload được lưu trong một transaction.

**Tính toán xuất hàng:** Số thùng được làm tròn lên thống nhất khi tạo, sửa và import. Năm/tháng trong mã phiếu được lấy từ ngày đặt hàng.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Tầng | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | **ReactJS 19**, **Vite** | Nền tảng giao diện SPA tốc độ cao |
| | **Material-UI (MUI)**, **SweetAlert2** | Giao diện người dùng và thông báo trực quan |
| | **CSS** | Giao diện và bố cục |
| **Backend** | **ASP.NET Core WebApi (.NET 10)** | Cung cấp RESTful API hiệu năng cao |
| | **Dapper** | Micro-ORM tối ưu câu lệnh truy vấn SQL Server |
| | **EPPlus** | Đọc, ghi và xử lý dữ liệu Excel nhiều sheet |
| | **QuestPDF & QRCoder** | Tạo phiếu xuất hàng PDF và mã QR chứa mã phiếu |
| **Database** | **Microsoft SQL Server 2022** | Hệ quản trị cơ sở dữ liệu quan hệ |

---

## 📁 Cấu trúc thư mục (Architecture)

Backend được tổ chức theo luồng `Controller → Service → Repository → SQL Server`:

```text
HDS/
├── WebApi/                          # Backend .NET Core API
│   ├── Controllers/                 # Điều hướng API (Database, Products, SaleOuts)
│   ├── Services/                    # Kiểm tra điều kiện và gọi repository
│   ├── Repositories/                # Truy cập SQL Server bằng Dapper
│   ├── Models/
│   │   ├── Products/                # Entity & Request Model sản phẩm
│   │   ├── SaleOuts/                # DTO hiển thị & Request Model xuất hàng
│   │   └── Exceptions/              # Ngoại lệ nghiệp vụ tùy biến
│   └── Program.cs                   # Đăng ký Dependency Injection & Middleware
│
├── WebApp/                          # Frontend React SPA
│   └── src/
│       ├── api/                     # Tầng gọi API tập trung (productApi, saleOutApi)
│       ├── utils/                   # Tiện ích format tiền tệ, số, ngày tháng
│       ├── components/              # Các module màn hình độc lập
│       │   ├── Navigation/          # Thanh Tab điều hướng
│       │   ├── Product/             # Màn hình & popup Master Sản phẩm
│       │   └── SaleOut/             # Màn hình & bảng Màn Xuất hàng
│       ├── App.jsx                  # Root Layout điều phối Tab
│       └── App.css                  # Toàn bộ theme và bảng kiểu dáng
│
└── README.md
```

### Phân chia module

* `ProductList` điều phối màn hình; `ProductToolbar`, `ProductResults`, `ProductFormDialog` phụ trách từng phần giao diện. `useProducts` quản lý tải dữ liệu, phân trang và xóa; `productForm` chuẩn bị và kiểm tra dữ liệu biểu mẫu.
* Các component gọi API sản phẩm qua `productApi`.
* `ProductImportReader` và `SaleOutImportReader` đọc và kiểm tra dữ liệu theo nghiệp vụ. `ExcelImport` dùng chung phần kiểm tra file, tiêu đề, số và validation model.
* Service điều phối nghiệp vụ và xuất Excel qua `ExcelExport`; Repository thực thi SQL. Controller trả HTTP response và ghi log các exception đã xử lý.

### Cấu trúc hai màn frontend

Hai thư mục `components/Product` và `components/SaleOut` dùng cùng quy ước:

| Trách nhiệm | Sản phẩm | Xuất hàng |
| --- | --- | --- |
| Điều phối màn hình | `ProductList` | `SaleOutList` |
| Tìm kiếm và thao tác | `ProductToolbar` | `SaleOutToolbar` |
| Kết quả và phân trang | `ProductResults` | `SaleOutResults` |
| Bảng dữ liệu | `ProductTable` | `SaleOutTable` |
| Form thêm/sửa | `ProductFormDialog` | `SaleOutFormDialog` |
| Quản lý danh sách | `useProducts` | `useSaleOuts` |
| Quản lý form | `useProductForm` | `useSaleOutForm` |
| Cấu hình màn hình | `productConfig` | `saleOutConfig` |

Xuất hàng có thêm `SaleOutPrintDialog` và `SaleOutReportDialog` cho in phiếu và báo cáo doanh thu. Hai màn dùng chung `UploadDialog`, xử lý HTTP và quy tắc số thập phân.

### Luồng xử lý backend

1. **Controller** nhận HTTP request, gọi Service và trả HTTP response.
2. **Service** xử lý điều kiện tìm kiếm, đọc và kiểm tra file import, sau đó gọi Repository tương ứng.
3. **Repository** tạo kết nối, thực thi SQL qua Dapper và trả dữ liệu về Service.
4. Các Service và Repository được đăng ký bằng `AddScoped` trong `WebApi/Program.cs` và được cung cấp qua constructor injection.

Ví dụ: `GET /api/products?page=1&pageSize=20` đi qua `ProductsController.GetProducts`, `ProductService.GetProductsAsync`, rồi `ProductRepository.GetProductsAsync`. Repository đọc danh sách và tổng số bản ghi; Controller dùng kết quả để tạo response.

`SaleOutService` chuẩn bị ngày đặt hàng, tiền tố mã phiếu và các giá trị tính toán theo `SaleOutRules`. `SaleOutRepository` giữ transaction, đối chiếu sản phẩm, kiểm tra trùng bằng một truy vấn cho mỗi phiếu và cấp số thứ tự dưới khóa để tránh trùng mã khi có yêu cầu đồng thời.

---

## ⚙️ Yêu cầu môi trường (Prerequisites)

* **.NET SDK:** Phiên bản 10.0 trở lên
* **Node.js:** 20.19+ trong nhánh 20 hoặc 22.12+ & **npm** (theo yêu cầu của Vite 8)
* **SQL Server:** 2019 / 2022 (khuyến nghị chạy qua Docker)

---

## 🚦 Hướng dẫn cài đặt & Khởi chạy

### 1. Cấu hình Cơ sở dữ liệu
Đảm bảo SQL Server đang hoạt động. Các lệnh trong `WebApi/Sql/schema.sql` và `WebApi/Sql/fnSaleOutReport.sql` hiện đều được comment, nên chạy trực tiếp các file sẽ không tạo đối tượng nào. Với database mới, bỏ tiền tố comment `--` khỏi các lệnh cần dùng trong bản sao của `schema.sql`, rồi thực thi để tạo database `HDS_Intern`, bảng và index. Tiếp theo, bỏ comment và chạy `fnSaleOutReport.sql` trên database đó để tạo hàm báo cáo. Với database đã tồn tại, kiểm tra schema trước khi thực thi các lệnh tạo đối tượng.

Cấu hình chuỗi kết nối trong `WebApi/appsettings.Development.json` hoặc biến môi trường `ConnectionStrings__DefaultConnection`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=127.0.0.1,1433;Database=HDS_Intern;User Id=sa;Password=YourPassword;TrustServerCertificate=True"
}
```

### 2. Khởi chạy Backend (WebApi)

```bash
# Di chuyển vào thư mục backend và khởi chạy
dotnet run --project WebApi --launch-profile http
```
> API sẽ lắng nghe tại: `http://localhost:5252`
> Kiểm tra kết nối: `curl http://localhost:5252/api/database/check`

### 3. Khởi chạy Frontend (WebApp)

Mở một cửa sổ terminal mới:

```bash
cd WebApp

# Cài đặt thư viện phụ thuộc
npm install

# Chạy môi trường phát triển (Dev Server)
npm run dev
```
> Mở trình duyệt truy cập: `http://localhost:5173`. Vite chuyển các yêu cầu `/api` tới `http://localhost:5252`; nếu đổi địa chỉ backend, cập nhật `WebApp/vite.config.js`.

Kiểm tra frontend bằng `npm run lint` và tạo bản build bằng `npm run build` trong thư mục `WebApp`.

---

## API chính

Các endpoint dùng tiền tố `/api`:

| Phương thức | Đường dẫn | Chức năng |
| --- | --- | --- |
| GET | `/database/check` | Kiểm tra kết nối cơ sở dữ liệu |
| GET, POST | `/products` | Danh sách phân trang, tạo sản phẩm |
| PUT, DELETE | `/products/{id}` | Sửa hoặc xóa sản phẩm theo GUID |
| GET | `/products/choices`, `/products/template`, `/products/export` | Danh sách lựa chọn, file mẫu, xuất Excel |
| POST | `/products/import` | Nhập Excel qua multipart form, trường `file` |
| GET, POST | `/saleouts` | Danh sách phân trang, tạo phiếu xuất |
| PUT, DELETE | `/saleouts/{id}` | Sửa hoặc xóa dòng xuất hàng theo GUID |
| GET | `/saleouts/choices`, `/saleouts/template`, `/saleouts/export` | Danh sách mã phiếu, file mẫu, xuất Excel |
| POST | `/saleouts/import` | Nhập Excel qua multipart form, trường `file` |
| GET | `/saleouts/{saleOutNo}/pdf` | Tải phiếu xuất PDF |
| GET | `/saleouts/revenue-report?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd` | Tải báo cáo doanh thu Excel theo khoảng ngày |

Danh sách hỗ trợ `page`, `pageSize`, `field` và `keyword`; kích thước trang tối đa là 100. Mặc định sản phẩm dùng 20 dòng/trang, xuất hàng dùng 50 dòng/trang.

---

## 📌 Quy chuẩn phát triển (Coding Conventions)

Các nguyên tắc chính:

* **Clean Code:** Áp dụng nguyên tắc KISS, DRY, YAGNI, Guard Clauses (Fail Fast).
* **Tối ưu SQL:** Chỉ JOIN dữ liệu với bảng Master; danh sách màn hình phân trang trực tiếp bằng `OFFSET ... FETCH NEXT`. Truy vấn xuất dữ liệu và danh sách lựa chọn lấy các cột phục vụ đúng chức năng.
* **Naming Conventions:**
  * C#: Biến `camelCase`, Class/Method/Property `PascalCase`; hằng số và biến static `UPPER_SNAKE_CASE`.
  * TypeScript/React: Component `PascalCase`, biến/hàm `camelCase`, hằng số `UPPER_SNAKE_CASE`, custom hook bắt đầu bằng `use`.
  * SQL: Tên bảng/cột `PascalCase`, Stored Procedure tiền tố `sp`, Function tiền tố `fn`.

---

## 👤 Tác giả
* **Nguyễn Việt Anh** - HDS Developer
