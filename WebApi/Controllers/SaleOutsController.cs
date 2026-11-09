using WebApi.Models.Exceptions;
using System.Globalization;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using WebApi.Services;
using WebApi.Models.SaleOuts;
using OfficeOpenXml;

namespace WebApi.Controllers;

[ApiController]
[Route("api/saleouts")]
public class SaleOutsController : ControllerBase
{
    private readonly SaleOutService _saleOutService;

    // Tiêm phụ thuộc SaleOutService vào Controller
    public SaleOutsController(SaleOutService saleOutService)
    {
        _saleOutService = saleOutService;
    }

    /// <summary>
    /// GET /api/saleouts
    /// Lấy danh sách xuất hàng có lọc và phân trang (mặc định 50 dòng/trang theo đặc tả)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetSaleOuts(
        [FromQuery] string? field,
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        // 1. Validate phân trang (Guard Clause)
        if (page < 1 || pageSize < 1 || pageSize > 100 || (long)(page - 1) * pageSize > int.MaxValue)
        {
            return BadRequest(new
            {
                message = "Trang phải từ 1; số bản ghi mỗi trang từ 1 đến 100."
            });
        }

        try
        {
            // 2. Gọi Service xử lý truy vấn
            var (items, totalCount) = await _saleOutService.GetSaleOutsAsync(
                field,
                keyword,
                page,
                pageSize);

            // 3. Trả về kết quả kèm metadata phân trang
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
    [HttpPost]
    public async Task<IActionResult> CreateSaleOut([FromBody] CreateSaleOutRequest request)
    {
        try
        {
            var saleOutNo = await _saleOutService.CreateSaleOutAsync(request);
            return StatusCode(StatusCodes.Status201Created, new { saleOutNo });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSaleOut(Guid id, [FromBody] UpdateSaleOutRequest request)
    {
        var updated = await _saleOutService.UpdateSaleOutAsync(id, request);
        return updated ? NoContent() : NotFound(new { message = "Không tìm thấy dòng xuất hàng." });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSaleOut(Guid id)
    {
        var deleted = await _saleOutService.DeleteSaleOutAsync(id);
        return deleted ? NoContent() : NotFound(new { message = "Không tìm thấy dòng xuất hàng." });
    }

    [HttpGet("template")]
    public IActionResult DownloadTemplate() => File(_saleOutService.CreateTemplate(),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "mau-xuat-hang.xlsx");

    [HttpPost("import")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> ImportSaleOuts([FromForm] IFormFile? file)
    {
        try { return Ok(new { importedCount = await _saleOutService.ImportSaleOutsAsync(file) }); }
        catch (ImportValidationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    // GET: api/saleouts/export
    [HttpGet("export")]
    public async Task<IActionResult> ExportSaleOuts()
    {
        var saleOuts = await _saleOutService.GetAllSaleOutsAsync();

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Xuat hang");

        string[] headers =
        [
            "Mã số phiếu",
            "Số PO khách hàng",
            "Ngày đặt hàng",
            "Khách hàng",
            "Mã sản phẩm",
            "Tên sản phẩm",
            "Đơn vị tính",
            "Số lượng",
            "Số lượng/thùng",
            "Số thùng",
            "Đơn giá",
            "Thành tiền"
        ];

        for (var i = 0; i < headers.Length; i++)
        {
            worksheet.Cells[1, i + 1].Value = headers[i];
        }

        var row = 2;

        foreach (var item in saleOuts)
        {
            worksheet.Cells[row, 1].Value = item.SaleOutNo;
            worksheet.Cells[row, 2].Value = item.CustomerPoNo;
            worksheet.Cells[row, 3].Value = item.OrderDate;
            worksheet.Cells[row, 4].Value = item.CustomerName;
            worksheet.Cells[row, 5].Value = item.ProductCode;
            worksheet.Cells[row, 6].Value = item.ProductName;
            worksheet.Cells[row, 7].Value = item.Unit;
            worksheet.Cells[row, 8].Value = item.Quantity;
            worksheet.Cells[row, 9].Value = item.QuantityPerBox;
            worksheet.Cells[row, 10].Value = item.BoxQuantity;
            worksheet.Cells[row, 11].Value = item.Price;
            worksheet.Cells[row, 12].Value = item.Amount;

            row++;
        }

        var headerRange = worksheet.Cells[1, 1, 1, headers.Length];
        headerRange.Style.Font.Bold = true;
        worksheet.Cells[1, 1, row - 1, headers.Length].AutoFitColumns();

        return File(
            package.GetAsByteArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "du-lieu-xuat-hang.xlsx");
    }
}