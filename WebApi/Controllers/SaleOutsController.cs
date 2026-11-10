using WebApi.Services.Imports;
using Microsoft.AspNetCore.Mvc;
using WebApi.Services;
using WebApi.Models.SaleOuts;

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
    [HttpPost]
    public async Task<IActionResult> CreateSaleOut([FromBody] CreateSaleOutRequest request)
    {
        var saleOutNo = await _saleOutService.CreateSaleOutAsync(request);
        return StatusCode(StatusCodes.Status201Created, new { saleOutNo });
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
    [RequestSizeLimit(ExcelImport.MAX_FILE_SIZE)]
    public async Task<IActionResult> ImportSaleOuts([FromForm] IFormFile? file)
    {
        return Ok(new { importedCount = await _saleOutService.ImportSaleOutsAsync(file) });
    }

    // GET: api/saleouts/export
    [HttpGet("export")]
    public async Task<IActionResult> ExportSaleOuts() => File(
        await _saleOutService.ExportSaleOutsAsync(),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "du-lieu-xuat-hang.xlsx");

    [HttpGet("choices")]
    public async Task<IActionResult> GetSaleOutNumbers()
    {
        var saleOutNumbers = await _saleOutService.GetSaleOutNumbersAsync();
        return Ok(saleOutNumbers);
    }

    [HttpGet("{saleOutNo}/pdf")]
    public async Task<IActionResult> DownloadPdf(string saleOutNo)
    {
        if (string.IsNullOrWhiteSpace(saleOutNo))
        {
            return BadRequest(new
            {
                message = "Mã số phiếu không hợp lệ."
            });
        }

        var pdf = await _saleOutService.CreatePdfAsync(saleOutNo);

        if (pdf is null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy phiếu xuất hàng."
            });
        }

        return File(
            pdf,
            "application/pdf",
            $"phieu-xuat-{saleOutNo}.pdf");
    }

    [HttpGet("revenue-report")]
    public async Task<IActionResult> DownloadRevenueReport(
        [FromQuery] DateOnly startDate,
        [FromQuery] DateOnly endDate)
    {
        if (startDate == default ||
            endDate == default ||
            startDate > endDate)
        {
            return BadRequest(new
            {
                message = "Vui lòng chọn khoảng ngày hợp lệ."
            });
        }

        var file = await _saleOutService.CreateRevenueReportAsync(
            startDate,
            endDate);

        return File(
            file,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"bao-cao-doanh-thu-{startDate:yyyyMMdd}-{endDate:yyyyMMdd}.xlsx");
    }
}
