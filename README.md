# Các lệnh thường dùng

Chạy các lệnh terminal dưới đây từ thư mục gốc của dự án `HDS`.

Yêu cầu: .NET SDK 10, Node.js và npm, cùng SQL Server đã cấu hình kết nối cho WebApi.

## Chạy WebApi

```bash
dotnet run --project WebApi --launch-profile http
```

Giữ terminal này mở trong khi sử dụng API. Nhấn `Ctrl+C` để dừng.

## Chạy WebApp

Trong một terminal khác, cài đặt các gói và chạy giao diện:

```bash
cd WebApp
npm ci
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. WebApp chuyển các yêu cầu `/api` đến WebApi tại `http://localhost:5252`.

Các lệnh khác, chạy trong thư mục `WebApp`:

```bash
npm run lint     # Kiểm tra mã nguồn
npm run build    # Tạo bản dựng production
npm run preview  # Xem thử bản dựng sau khi chạy build
```

## Kiểm tra kết nối database

Khi WebApi đang chạy, mở một terminal khác và chạy:

```bash
curl -i http://localhost:5252/api/database/check
```

Nếu nhận được mã HTTP `200` và `{"connected":true}`, WebApi đã kết nối được database và thực hiện thành công `SELECT 1`. Lệnh này chưa kiểm tra việc đọc bảng sản phẩm.

Nếu kết nối thất bại, kiểm tra SQL Server, database `HDS_Intern` và cấu hình `DefaultConnection` trong `WebApi/appsettings.Development.json`. Không chia sẻ mật khẩu khi gửi thông báo lỗi.

## Kiểm tra dữ liệu sản phẩm

Kết nối SQL Server bằng công cụ quản lý SQL của bạn, chọn database `HDS_Intern` và chạy câu lệnh SQL sau trong cửa sổ truy vấn:

```sql
USE HDS_Intern;

SELECT TOP (20)
    Id,
    ProductCode,
    ProductName,
    Unit,
    Specification,
    QuantityPerBox,
    ProductWeight
FROM dbo.MasterProduct;
```

- Có dòng kết quả: tài khoản trong công cụ SQL đọc được sản phẩm.
- Có cột nhưng không có dòng: bảng tồn tại nhưng chưa có dữ liệu.
- Lỗi `Invalid object name`: kiểm tra database, schema và tên bảng.

Câu lệnh này kiểm tra quyền của tài khoản trong công cụ SQL. Để xác nhận WebApi đọc được sản phẩm, khi WebApi đang chạy, gọi:

```bash
curl -i 'http://localhost:5252/api/products?page=1&pageSize=20'
```

Kết quả thành công chứa `items`, `totalCount`, `page` và `pageSize`.
