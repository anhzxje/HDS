# HDS Intern Management System

Hệ thống quản lý danh mục sản phẩm (**Master Product**) và phiếu chỉ thị xuất kho (**Sale Out**) được xây dựng theo kiến trúc phân lớp sạch (Clean Architecture & Modular Design).

---

## 🚀 Tính năng nổi bật

### 1. Quản lý Master Sản phẩm (`MasterProduct`)
* **Tra cứu & Tìm kiếm:** Lọc sản phẩm theo nhiều trường dữ liệu (*Mã SP, Tên SP, Đơn vị tính, Quy cách, Trọng lượng...*).
* **Phân trang tối ưu:** Phân trang trực tiếp từ SQL Server (`OFFSET - FETCH NEXT`) với 20 bản ghi/trang.
* **Quản trị CRUD:** Thêm mới (validate trùng mã), Chỉnh sửa (khóa mã & tên sản phẩm), Xóa an toàn kèm hộp thoại xác nhận.
* **Tương tác Excel:** Tải file mẫu chuẩn, upload hàng loạt sản phẩm từ file Excel (EPPlus) với cơ chế kiểm tra dữ liệu nghiêm ngặt và Transaction an toàn.

### 2. Quản lý Xuất hàng (`SaleOut`)
* **Theo dõi phiếu xuất:** Quản lý mã phiếu tự sinh dạng `STO<yyyyMMxxxx>`, số PO khách hàng, ngày đặt hàng, khách hàng.
* **Tính toán tự động:** Tự động tính **Số thùng** và **Thành tiền** dựa trên số lượng, quy cách và đơn giá.
* **Hiển thị trực quan:** Giao diện bảng rộng (`wide-table`), chống rớt dòng dữ liệu, định dạng tiền tệ và ngày tháng chuẩn tiếng Việt.
* **Báo cáo & In ấn:**
  * Xuất phiếu xuất kho dạng PDF kèm mã **QR Code** (QuestPDF & QRCoder).
  * Báo cáo doanh thu sản phẩm theo khoảng thời gian qua Table-valued Function SQL.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Tầng | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | **ReactJS 19**, **Vite** | Nền tảng giao diện SPA tốc độ cao |
| | **Material-UI (MUI)**, **SweetAlert2** | Giao diện người dùng và thông báo trực quan |
| | **Modular CSS** | Thiết kế đồng bộ theo phong cách Forest Green thanh lịch |
| **Backend** | **ASP.NET Core WebApi (.NET 10)** | Cung cấp RESTful API hiệu năng cao |
| | **Dapper** | Micro-ORM tối ưu câu lệnh truy vấn SQL Server |
| | **EPPlus** | Đọc, ghi và xử lý dữ liệu Excel nhiều sheet |
| | **QuestPDF & QRCoder** | Tạo tài liệu PDF và sinh mã QR động |
| **Database** | **Microsoft SQL Server 2022** | Hệ quản trị cơ sở dữ liệu quan hệ |

---

## 📁 Cấu trúc thư mục (Architecture)

Dự án được phân chia module rõ ràng theo nguyên tắc **Single Responsibility Principle (SRP)**:

```text
HDS/
├── WebApi/                          # Backend .NET Core API
│   ├── Controllers/                 # Điều hướng API (Database, Products, SaleOuts)
│   ├── Services/                    # Xử lý logic nghiệp vụ (Database, Product, SaleOut)
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
│       │   ├── MasterProduct/       # Màn hình & popup Master Sản phẩm
│       │   └── SaleOut/             # Màn hình & bảng Màn Xuất hàng
│       ├── App.jsx                  # Root Layout điều phối Tab
│       └── App.css                  # Toàn bộ theme và bảng kiểu dáng
│
└── HDS_Intern.xlsx                  # Tài liệu đặc tả yêu cầu & Plan dự án
```

---

## ⚙️ Yêu cầu môi trường (Prerequisites)

* **.NET SDK:** Phiên bản 10.0 trở lên
* **Node.js:** Phiên bản 18+ & **npm**
* **SQL Server:** 2019 / 2022 (khuyến nghị chạy qua Docker)

---

## 🚦 Hướng dẫn cài đặt & Khởi chạy

### 1. Cấu hình Cơ sở dữ liệu
Đảm bảo SQL Server đang hoạt động và database `HDS_Intern` đã được cấu hình chuỗi kết nối trong `WebApi/appsettings.Development.json`:

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
> Mở trình duyệt truy cập: `http://localhost:5173`

---

## 📌 Quy chuẩn phát triển (Coding Conventions)

* **Clean Code:** Áp dụng nguyên tắc KISS, DRY, YAGNI, Guard Clauses (Fail Fast).
* **Tối ưu SQL:** Chỉ JOIN dữ liệu với bảng Master, luôn truy vấn kèm phân trang (`OFFSET ... FETCH NEXT`), không lấy thừa dữ liệu.
* **Naming Conventions:**
  * C#: Biến `camelCase`, Class/Method/Property `PascalCase`.
  * TypeScript/React: Component `PascalCase`, biến/hàm `camelCase`.
  * SQL: Tên bảng/cột `PascalCase`, Stored Procedure tiền tố `sp`, Function tiền tố `fn`.

---

## 👤 Tác giả
* **Nguyễn Việt Anh** - HDS Intern Developer
