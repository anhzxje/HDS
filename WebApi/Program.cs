using WebApi.Services;
using WebApi.Repositories;
using OfficeOpenXml;
using QuestPDF.Infrastructure;

// Cấu hình cho trường hợp sử dụng cá nhân phi thương mại.
ExcelPackage.License.SetNonCommercialPersonal("Anhzxje");

// Tạo builder để đọc cấu hình và đăng ký các dịch vụ cho ứng dụng.
var builder = WebApplication.CreateBuilder(args);

// Mỗi yêu cầu HTTP dùng một instance Service riêng.
builder.Services.AddScoped<DatabaseRepository>();
builder.Services.AddScoped<SaleOutRepository>();
builder.Services.AddScoped<DatabaseService>();
builder.Services.AddScoped<ProductRepository>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<SaleOutService>();
builder.Services.AddScoped<SaleOutPdfService>();
builder.Services.AddScoped<SaleOutReportService>();

// Đăng ký controller và dịch vụ tạo tài liệu OpenAPI.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

QuestPDF.Settings.License = LicenseType.Community;

// Tạo ứng dụng từ cấu hình và các dịch vụ đã đăng ký.
var app = builder.Build();

// Chỉ cung cấp tài liệu OpenAPI trong môi trường phát triển.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Ghi lại các lỗi không được xử lý, sau đó để middleware của framework trả response.
app.Use(async (context, next) =>
{
    try
    {
        await next(context);
    }
    catch (Exception exception)
    {
        app.Logger.LogError(exception, "Yêu cầu {Method} {Path} thất bại", context.Request.Method, context.Request.Path);
        throw;
    }
});

// Chuyển hướng sang HTTPS khi có cấu hình cổng HTTPS.
app.UseHttpsRedirection();

// Bật middleware kiểm tra quyền truy cập cho các endpoint có yêu cầu.
app.UseAuthorization();

// Ánh xạ các route được khai báo trong controller và chạy ứng dụng.
app.MapControllers();

app.Run();
