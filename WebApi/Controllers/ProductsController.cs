using Microsoft.AspNetCore.Mvc;
using WebApi.Services;
using WebApi.Models;
using Microsoft.Data.SqlClient;
using OfficeOpenXml;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using WebApi.Models.Products;
using WebApi.Models.Exceptions;

namespace WebApi.Controllers;

// Nhận yêu cầu từ giao diện và chuyển công việc truy cập dữ liệu cho DatabaseService.
[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _productService;

    public ProductsController(ProductService productService)
    {
        _productService = productService;
    }

    // GET: trả danh sách theo điều kiện tìm kiếm và thông tin phân trang.
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? field,
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1 || pageSize < 1 || pageSize > 100 ||
            (long)(page - 1) * pageSize > int.MaxValue)
        {
            return BadRequest(new
            {
                message = "Trang phải từ 1; số bản ghi mỗi trang từ 1 đến 100."
            });
        }

        try
        {
            var (items, totalCount) = await _productService.GetProductsAsync(
                field,
                keyword,
                page,
                pageSize);

            return Ok(new
            {
                items,
                totalCount,
                page,
                pageSize
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("choices")]
    public async Task<IActionResult> GetProductChoices() => Ok(await _productService.GetAllProductsAsync());

    // PUT: chỉ cập nhật các trường trong UpdateProductRequest; mã và tên được giữ nguyên.
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProduct(
        Guid id,
        [FromBody] UpdateProductRequest request)
    {
        var updated = await _productService.UpdateProductAsync(id, request);

        if (!updated)
        {
            return NotFound(new { message = "Không tìm thấy sản phẩm." });
        }

        return NoContent();
    }

    // DELETE: trả 404 nếu không có sản phẩm, 204 khi xóa thành công.
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        try
        {
            var deleted = await _productService.DeleteProductAsync(id);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy sản phẩm."
                });
            }

            return NoContent();
        }
        // SQL Server báo lỗi 547 khi một ràng buộc dữ liệu ngăn thao tác xóa.
        catch (SqlException ex) when (ex.Number == 547)
        {
            return Conflict(new
            {
                message = "Không thể xoá sản phẩm vì đang có dữ liệu liên quan."
            });
        }
    }

    // POST: tạo sản phẩm mới và trả về Id của sản phẩm vừa tạo.
    [HttpPost]
    public async Task<IActionResult> CreateProduct(
        [FromBody] CreateProductRequest request)
    {
        try
        {
            var newId = await _productService.CreateProductAsync(request);
            
            return StatusCode(StatusCodes.Status201Created, new { 
                newId, 
                message = "Tạo sản phẩm thành công." });
        } 
        catch (SqlException ex) when (
            (ex.Number == 2627 || ex.Number == 2601) 
            && ex.Message.Contains("UX_MasterProduct_ProductCode", 
            StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(new
            {
                message = $"Mã sản phẩm {request.ProductCode?.Trim()} đã tồn tại."
            });
        }

    }

    [HttpGet("template")]
    public IActionResult DownloadTemplate() => File(_productService.CreateTemplate(),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "mau-san-pham.xlsx");

    // GET: api/products/export
    [HttpGet("export")]
    public async Task<IActionResult> ExportProducts()
    {
        // 1. Lấy toàn bộ sản phẩm từ database.
        var products = await _productService.GetAllProductsAsync();

        // 2. Tạo file Excel và sheet.
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("San pham");

        // 3. Ghi tiêu đề tại hàng 1.
        string[] headers =
        [
            "Mã sản phẩm",
            "Tên sản phẩm",
            "Đơn vị tính",
            "Quy cách",
            "Số lượng/thùng",
            "Trọng lượng"
        ];

        for (var i = 0; i < headers.Length; i++)
        {
            worksheet.Cells[1, i + 1].Value = headers[i];
        }

        // 4. Ghi sản phẩm, bắt đầu từ hàng 2.
        var row = 2;

        foreach (var product in products)
        {
            worksheet.Cells[row, 1].Value = product.ProductCode;
            worksheet.Cells[row, 2].Value = product.ProductName;
            worksheet.Cells[row, 3].Value = product.Unit;
            worksheet.Cells[row, 4].Value = product.Specification;
            worksheet.Cells[row, 5].Value = product.QuantityPerBox;
            worksheet.Cells[row, 6].Value = product.ProductWeight;

            row++;
        }

        // 5. Định dạng hàng tiêu đề và độ rộng cột.
        var headerRange = worksheet.Cells[1, 1, 1, headers.Length];
        headerRange.Style.Font.Bold = true;

        // Bao gồm cả tiêu đề và dữ liệu khi tính độ rộng.
        worksheet.Cells[1, 1, row - 1, headers.Length].AutoFitColumns();

        // 6. Trả file về trình duyệt.
        return File(
            package.GetAsByteArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "danh-sach-san-pham.xlsx");
    }

    // POST: api/products/import
    [HttpPost("import")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> ImportProducts([FromForm] IFormFile? file)
    {
        try
        {
            var count = await _productService.ImportProductsAsync(file);
            return Ok(new { message = $"Đã nhập thành công {count} sản phẩm.", importedCount = count });
        }
        catch (ImportValidationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (DuplicateProductCodeException ex)
        {
            return Conflict(new { message = ex.Message, row = ex.RowNumber, productCode = ex.ProductCode });
        }
    }
}