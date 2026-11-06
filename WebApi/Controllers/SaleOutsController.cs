using Microsoft.AspNetCore.Mvc;
using WebApi.Services;

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
}