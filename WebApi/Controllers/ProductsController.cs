using WebApi.Repositories;
using WebApi.Services.Imports;
using Microsoft.AspNetCore.Mvc;
using WebApi.Services;
using Microsoft.Data.SqlClient;
using WebApi.Models.Products;
using WebApi.Models.Exceptions;

namespace WebApi.Controllers;

// Nhận HTTP request và chuyển nghiệp vụ sản phẩm cho ProductService.
[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(ProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
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
            _logger.LogWarning(ex, "Yêu cầu {Method} {Path} bị từ chối", Request.Method, Request.Path);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("choices")]
    public async Task<IActionResult> GetProductChoices() => Ok(await _productService.GetProductChoicesAsync());

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
        catch (SqlException ex) when (ex.Number == SqlServerErrors.FOREIGN_KEY_CONFLICT)
        {
            _logger.LogWarning(ex, "Yêu cầu {Method} {Path} bị từ chối", Request.Method, Request.Path);
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

            return StatusCode(StatusCodes.Status201Created, new
            {
                newId,
                message = "Tạo sản phẩm thành công."
            });
        }
        catch (SqlException ex) when (SqlServerErrors.IsDuplicateProductCode(ex))
        {
            _logger.LogWarning(ex, "Yêu cầu {Method} {Path} bị từ chối", Request.Method, Request.Path);
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
    public async Task<IActionResult> ExportProducts() => File(
        await _productService.ExportProductsAsync(),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "danh-sach-san-pham.xlsx");

    // POST: api/products/import
    [HttpPost("import")]
    [RequestSizeLimit(ExcelImport.MAX_FILE_SIZE)]
    public async Task<IActionResult> ImportProducts([FromForm] IFormFile? file)
    {
        try
        {
            var count = await _productService.ImportProductsAsync(file);
            return Ok(new { message = $"Đã nhập thành công {count} sản phẩm.", importedCount = count });
        }
        catch (ImportValidationException ex)
        {
            _logger.LogWarning(ex, "Yêu cầu {Method} {Path} bị từ chối", Request.Method, Request.Path);
            return BadRequest(new { message = ex.Message });
        }
        catch (DuplicateProductCodeException ex)
        {
            _logger.LogWarning(ex, "Yêu cầu {Method} {Path} bị từ chối", Request.Method, Request.Path);
            return Conflict(new { message = ex.Message, row = ex.RowNumber, productCode = ex.ProductCode });
        }
    }
}