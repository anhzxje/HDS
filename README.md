# HDS Management System

Hệ thống quản lý danh mục sản phẩm (**Master Product**) và phiếu chỉ thị xuất kho (**Sale Out**) được tổ chức theo các tầng Controller, Service và Repository.

---

## 🚀 Tính năng nổi bật

### 1. Quản lý Master Sản phẩm (`MasterProduct`)
* **Tra cứu & Tìm kiếm:** Lọc sản phẩm theo nhiều trường dữ liệu (*Mã SP, Tên SP, Đơn vị tính, Quy cách, Trọng lượng...*).
* **Phân trang tối ưu:** Phân trang trực tiếp từ SQL Server (`OFFSET - FETCH NEXT`) với 20 bản ghi/trang.
* **Quản trị CRUD:** Thêm mới (validate trùng mã), Chỉnh sửa (khóa mã & tên sản phẩm), Xóa an toàn kèm hộp thoại xác nhận.
* **Tương tác Excel:** Tải file mẫu trống và upload hàng loạt sản phẩm từ file `.xlsx`. Dữ liệu được kiểm tra trước khi lưu trong transaction.

### 2. Quản lý Xuất hàng (`SaleOut`)
* **Theo dõi phiếu xuất:** Quản lý mã phiếu tự sinh dạng `STO<yyyyMMxxxx>`, số PO khách hàng, ngày đặt hàng, khách hàng.
* **Thêm, sửa, xóa:** Một phiếu có thể gồm nhiều dòng sản phẩm; khi tạo, hệ thống tính số thùng và thành tiền.
* **Excel:** Tải file mẫu trống và upload nhiều dòng xuất hàng. Các dòng cùng PO, ngày đặt hàng và khách hàng được nhóm thành một phiếu.
* **Hiển thị:** Bảng xuất hàng có tìm kiếm, phân trang và định dạng ngày, số tiền.
* **Chưa triển khai:** Nút In phiếu và Báo cáo doanh thu hiện chỉ hiển thị thông báo, chưa tạo PDF hoặc báo cáo.

### Nhập dữ liệu từ Excel

Ở mỗi màn hình, chọn **Tải file mẫu**, điền dữ liệu từ dòng thứ hai rồi chọn **Upload dữ liệu** hoặc **Tải lên file**. Chỉ hỗ trợ `.xlsx`, tối đa 5 MB; giữ nguyên tên và thứ tự các cột.

| Màn hình | Các cột trong file mẫu |
| :--- | :--- |
| Sản phẩm | Mã sản phẩm, Tên sản phẩm, Đơn vị tính, Quy cách, Số lượng/thùng, Trọng lượng |
| Xuất hàng | Số PO khách hàng, Ngày đặt hàng, Khách hàng, Mã sản phẩm, Số lượng, Số lượng/thùng, Đơn giá |

Với xuất hàng, nhập ngày theo `yyyy-MM-dd`, `dd/MM/yyyy` hoặc định dạng ngày Excel. Mã sản phẩm phải có trong Master sản phẩm. Không được lặp cặp PO + mã sản phẩm trong file hoặc với dữ liệu đã lưu. Server sinh mã phiếu, lấy thông tin sản phẩm và tính số thùng, thành tiền; toàn bộ lần upload được lưu trong một transaction.

**Lưu ý:** Khi tạo hoặc upload, số thùng được làm tròn đến ba chữ số thập phân; khi sửa dòng xuất hàng, code hiện dùng làm tròn lên số nguyên. Hai cách tính này chưa thống nhất.

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
| | **QuestPDF & QRCoder** | Đã khai báo thư viện; chức năng in phiếu chưa triển khai |
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
│       │   ├── MasterProduct/       # Màn hình & popup Master Sản phẩm
│       │   └── SaleOut/             # Màn hình & bảng Màn Xuất hàng
│       ├── App.jsx                  # Root Layout điều phối Tab
│       └── App.css                  # Toàn bộ theme và bảng kiểu dáng
│
```

### Luồng xử lý backend

1. **Controller** nhận HTTP request, gọi Service và trả HTTP response.
2. **Service** xử lý điều kiện tìm kiếm, đọc và kiểm tra file import, sau đó gọi Repository tương ứng.
3. **Repository** tạo kết nối, thực thi SQL qua Dapper và trả dữ liệu về Service.
4. Các Service và Repository được đăng ký bằng `AddScoped` trong `WebApi/Program.cs` và được cung cấp qua constructor injection.

Ví dụ: `GET /api/products?page=1&pageSize=20` đi qua `ProductsController.GetProducts`, `ProductService.GetProductsAsync`, rồi `ProductRepository.GetProductsAsync`. Repository đọc danh sách và tổng số bản ghi; Controller dùng kết quả để tạo response.

Khi tạo phiếu xuất, `SaleOutRepository` giữ transaction và một số kiểm tra nghiệp vụ liên quan đến dữ liệu trong cùng luồng xử lý. Không phải mọi quy tắc nghiệp vụ hiện đều nằm ở Service.

---

## ⚙️ Yêu cầu môi trường (Prerequisites)

* **.NET SDK:** Phiên bản 10.0 trở lên
* **Node.js:** 20.19+ trong nhánh 20 hoặc 22.12+ & **npm** (theo yêu cầu của Vite 8)
* **SQL Server:** 2019 / 2022 (khuyến nghị chạy qua Docker)

---

## 🚦 Hướng dẫn cài đặt & Khởi chạy

### 1. Cấu hình Cơ sở dữ liệu
Đảm bảo SQL Server đang hoạt động, database `HDS` cùng các bảng cần thiết đã được tạo và cấu hình chuỗi kết nối trong `WebApi/appsettings.Development.json`. Repository hiện không kèm script tạo schema:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=127.0.0.1,1433;Database=HDS;User Id=sa;Password=YourPassword;TrustServerCertificate=True"
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
* **Nguyễn Việt Anh** - HDS Developer
