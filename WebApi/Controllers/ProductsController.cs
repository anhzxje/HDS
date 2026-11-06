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

    // // GET: api/products/template
    // [HttpGet("template")]
    // public IActionResult DownloadTemplate()
    // {
    //     // 1. Tạo một file Excel trong bộ nhớ.
    //     using var package = new ExcelPackage();

    //     // 2. Tạo một sheet có tên "San pham".
    //     var worksheet = package.Workbook.Worksheets.Add("San pham");

    //     // 3. Khai báo tên các cột ở hàng đầu tiên.
    //     string[] headers =
    //     [
    //         "Mã sản phẩm",
    //         "Tên sản phẩm",
    //         "Đơn vị tính",
    //         "Quy cách",
    //         "Số lượng/thùng",
    //         "Trọng lượng"
    //     ];

    //     // 4. Ghi từng tên cột vào hàng 1.
    //     for (var i = 0; i < headers.Length; i++)
    //     {
    //         worksheet.Cells[1, i + 1].Value = headers[i];
    //     }

    //     // 5. In đậm hàng tiêu đề.
    //     var headerRange = worksheet.Cells[1, 1, 1, headers.Length];
    //     headerRange.Style.Font.Bold = true;

    //     // 6. Điều chỉnh độ rộng cột theo nội dung tiêu đề.
    //     headerRange.AutoFitColumns();

    //     // 7. Chuyển file Excel thành mảng byte.
    //     byte[] fileBytes = package.GetAsByteArray();

    //     // 8. Trả file về cho client tải xuống.
    //     return File(
    //         fileBytes,
    //         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //         "mau-san-pham.xlsx");
    // }

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
        // 1. Kiểm tra file.
        if (file == null || file.Length == 0)
        {
            return BadRequest(new
            {
                message = "Vui lòng chọn file Excel có dữ liệu."
            });
        }

        if (!string.Equals(
            Path.GetExtension(file.FileName),
            ".xlsx",
            StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = "Chỉ hỗ trợ file Excel có định dạng .xlsx."
            });
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new
            {
                message = "Dung lượng file không được vượt quá 5 MB."
            });
        }

        // Danh sách giữ cả số dòng Excel để thông báo lỗi chính xác.
        var products =
            new List<(int RowNumber, CreateProductRequest Product)>();

        // 2. Đọc file Excel.
        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;

            using var package = new ExcelPackage(stream);

            if (package.Workbook.Worksheets.Count == 0)
            {
                return BadRequest(new
                {
                    message = "File Excel không có sheet dữ liệu."
                });
            }

            // Đọc sheet đầu tiên.
            var worksheet = package.Workbook.Worksheets[0];

            if (worksheet.Dimension == null)
            {
                return BadRequest(new
                {
                    message = "Sheet Excel đang trống."
                });
            }

            // 3. Kiểm tra tên và thứ tự các cột.
            string[] expectedHeaders =
            [
                "Mã sản phẩm",
                "Tên sản phẩm",
                "Đơn vị tính",
                "Quy cách",
                "Số lượng/thùng",
                "Trọng lượng"
            ];

            for (var column = 1; column <= expectedHeaders.Length; column++)
            {
                var actualHeader = worksheet.Cells[1, column].Text.Trim();

                if (!string.Equals(
                    actualHeader,
                    expectedHeaders[column - 1],
                    StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        message =
                            $"Tiêu đề cột {column} không đúng. " +
                            $"Cần là '{expectedHeaders[column - 1]}'."
                    });
                }
            }

            // 4. Đọc từng dòng dữ liệu, bắt đầu từ hàng 2.
            var lastRow = worksheet.Dimension.End.Row;

            for (var row = 2; row <= lastRow; row++)
            {
                // Bỏ qua dòng hoàn toàn trống trong 6 cột.
                var isEmptyRow = Enumerable.Range(1, 6)
                    .All(column =>
                        string.IsNullOrWhiteSpace(
                            worksheet.Cells[row, column].Text));

                if (isEmptyRow)
                {
                    continue;
                }

                string productCode = worksheet.Cells[row, 1].Text.Trim();
                string productName = worksheet.Cells[row, 2].Text.Trim();
                string unit = worksheet.Cells[row, 3].Text.Trim();
                string specification = worksheet.Cells[row, 4].Text.Trim();

                // Đọc giá trị số theo định dạng không phụ thuộc ngôn ngữ máy chủ.
                string quantityText = Convert.ToString(
                    worksheet.Cells[row, 5].Value,
                    CultureInfo.InvariantCulture) ?? "";

                string weightText = Convert.ToString(
                    worksheet.Cells[row, 6].Value,
                    CultureInfo.InvariantCulture) ?? "";

                if (!decimal.TryParse(
                    quantityText,
                    NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
                    CultureInfo.InvariantCulture,
                    out var quantityPerBox))
                {
                    return BadRequest(new
                    {
                        message = $"Dòng {row}: Số lượng/thùng phải là số hợp lệ."
                    });
                }

                if (!decimal.TryParse(
                    weightText,
                    NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
                    CultureInfo.InvariantCulture,
                    out var productWeight))
                {
                    return BadRequest(new
                    {
                        message = $"Dòng {row}: Trọng lượng phải là số hợp lệ."
                    });
                }

                var product = new CreateProductRequest
                {
                    ProductCode = productCode,
                    ProductName = productName,
                    Unit = unit,
                    Specification = specification,
                    QuantityPerBox = quantityPerBox,
                    ProductWeight = productWeight
                };

                // 5. Dùng lại các quy tắc Required, StringLength, Range
                // đã khai báo trong CreateProductRequest.
                var validationResults = new List<ValidationResult>();

                bool isValid = Validator.TryValidateObject(
                    product,
                    new ValidationContext(product),
                    validationResults,
                    validateAllProperties: true);

                if (!isValid)
                {
                    var errors = validationResults
                        .Select(result => result.ErrorMessage)
                        .Where(message => !string.IsNullOrWhiteSpace(message));

                    return BadRequest(new
                    {
                        message = $"Dòng {row}: {string.Join(" ", errors)}"
                    });
                }

                products.Add((row, product));
            }
        }
        catch (InvalidDataException)
        {
            return BadRequest(new
            {
                message = "Không đọc được file Excel. Hãy kiểm tra lại định dạng file."
            });
        }

        if (products.Count == 0)
        {
            return BadRequest(new
            {
                message = "File không có dòng sản phẩm để nhập."
            });
        }

        // 6. Lưu dữ liệu vào database.
        try
        {
            await _productService.ImportProductsAsync(products);

            return Ok(new
            {
                message = $"Đã nhập thành công {products.Count} sản phẩm.",
                importedCount = products.Count
            });
        }
        catch (DuplicateProductCodeException ex)
        {
            return Conflict(new
            {
                message = ex.Message,
                row = ex.RowNumber,
                productCode = ex.ProductCode
            });
        }
    }
}
