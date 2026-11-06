using WebApi.Services;
using OfficeOpenXml;

// Cấu hình cho trường hợp sử dụng cá nhân phi thương mại.
ExcelPackage.License.SetNonCommercialPersonal("Anhzxje");

// Tạo builder để đọc cấu hình và đăng ký các dịch vụ cho ứng dụng.
var builder = WebApplication.CreateBuilder(args);

// Mỗi yêu cầu HTTP dùng một instance Service riêng.
builder.Services.AddScoped<DatabaseService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<SaleOutService>();

// Đăng ký controller và dịch vụ tạo tài liệu OpenAPI.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Tạo ứng dụng từ cấu hình và các dịch vụ đã đăng ký.
var app = builder.Build();

// Chỉ cung cấp tài liệu OpenAPI trong môi trường phát triển.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Chuyển hướng sang HTTPS khi có cấu hình cổng HTTPS.
app.UseHttpsRedirection();

// Bật middleware kiểm tra quyền truy cập cho các endpoint có yêu cầu.
app.UseAuthorization();

// Ánh xạ các route được khai báo trong controller và chạy ứng dụng.
app.MapControllers();

app.Run();
