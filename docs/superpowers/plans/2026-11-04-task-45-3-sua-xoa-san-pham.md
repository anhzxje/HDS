# Task 45.3: Sửa và xoá sản phẩm — Kế hoạch thực hiện

**Mục tiêu:** Cho phép sửa và xoá từng sản phẩm trên màn Master sản phẩm.

**Kiến trúc:** React gọi API ASP.NET Core; API dùng Dapper và SQL có tham số để cập nhật hoặc xoá theo `Id`. Danh sách được tải lại với bộ lọc và phân trang hiện tại sau khi thao tác thành công.

**Công nghệ:** React/Vite, ASP.NET Core, Dapper, SQL Server.

**Nguồn yêu cầu:** `HDS_Intern.xlsx`, sheet `Plan` dòng 327; sheet `Màn Master sản phẩm` dòng 46–51 và 70–83; sheet `Cấu trúc Database` dòng 2–10, 12–18.

## Quyết định cần xác nhận

Tài liệu dòng 48 yêu cầu khoá cả mã và tên sản phẩm khi sửa; dòng 72 chỉ yêu cầu khoá mã và cho sửa các trường còn lại. Kế hoạch tạm chọn khoá cả mã và tên theo mô tả thao tác cụ thể tại dòng 48. Cần xác nhận trước khi triển khai. API cũng phải giữ nguyên các trường bị khoá, kể cả khi client gửi dữ liệu khác.

## Công việc

1. **Xác định ràng buộc dữ liệu thực tế.** Kiểm tra schema SQL Server và quan hệ `SaleOut.ProductId` trước khi sửa dữ liệu. Dùng sáu trường theo mô tả màn hình; các chuỗi có độ dài tối đa 50, 200, 50, 200 tương ứng; hai số là `decimal(18,3)`. Kiểm tra yêu cầu bắt buộc và định dạng phía máy chủ, hiển thị lỗi rõ ràng. Không tự đặt quy tắc dương hoặc duy nhất khi tài liệu chưa quy định.
2. **API sửa.** Thêm `PUT /api/products/{id}` trong `WebApi/Controllers/ProductsController.cs` và phương thức cập nhật trong `WebApi/Services/DatabaseService.cs`. Body gồm `unit`, `specification`, `quantityPerBox`, `productWeight`; không cập nhật mã/tên. Trả lỗi 400 cho dữ liệu sai, 404 khi không tìm thấy, và 200 hoặc 204 khi thành công. Dùng truy vấn có tham số và kiểm tra số dòng được cập nhật.
3. **API xoá.** Thêm `DELETE /api/products/{id}` và phương thức xoá theo `Id`; trả 404 nếu không có sản phẩm. Nếu ràng buộc tham chiếu ngăn xoá, trả 409 với thông báo dễ hiểu, không tự xoá dữ liệu liên quan. Xác nhận hành vi bằng schema thực tế; xử lý lỗi database khác theo cơ chế lỗi hiện có.
4. **Màn hình sửa.** Trong `WebApp/src/App.jsx` thêm nút Sửa ở mỗi dòng, mở hộp thoại điền sẵn thông tin, khoá mã/tên theo giả định, cho sửa bốn trường còn lại. Có Lưu và Đóng, thông báo lỗi tại biểu mẫu và ngăn gửi lặp khi đang xử lý. Bổ sung CSS trong `WebApp/src/App.css` theo giao diện hiện có.
5. **Màn hình xoá và làm mới.** Nút Xoá mở hộp xác nhận có tên hoặc mã sản phẩm; Huỷ không thay đổi dữ liệu, xác nhận gọi API. Khi thành công, tải lại danh sách theo tìm kiếm hiện tại, cập nhật tổng số; nếu trang cuối rỗng sau xoá, chuyển về trang trước. Báo lỗi và giữ trạng thái phù hợp khi thao tác thất bại.
6. **Kiểm tra.** Chạy `dotnet build WebApi/WebApi.csproj` và `npm --prefix WebApp run build`. Kiểm tra API và giao diện với dữ liệu thử: sửa thành công, dữ liệu trống/sai, ID không tồn tại, không thể thay đổi trường bị khoá, huỷ và xác nhận xoá, xoá bản ghi có tham chiếu, lọc/phân trang và xoá dòng cuối trang. Chỉ thực hiện các thao tác ghi trên dữ liệu thử được phép; nếu không có SQL Server hoặc dữ liệu thử, báo rõ phần chưa kiểm chứng.

## Phạm vi

Không bao gồm chức năng thêm mới (45.2), tải mẫu (45.4) hay upload (45.5). Mã hiện tại chỉ có API GET và nút Thêm mới đang bị vô hiệu hoá, nên không dựa vào việc 45.2 đã hoàn thành.
