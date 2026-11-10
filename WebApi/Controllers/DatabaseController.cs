using Microsoft.AspNetCore.Mvc;
using WebApi.Services;

namespace WebApi.Controllers;

// Cung cấp API kiểm tra kết nối giữa ứng dụng và cơ sở dữ liệu.
[ApiController]
[Route("api/database")]
public class DatabaseController : ControllerBase
{
    private readonly DatabaseService _databaseService;

    public DatabaseController(DatabaseService databaseService)
    {
        _databaseService = databaseService;
    }

    // GET /api/database/check: chạy truy vấn kiểm tra thông qua DatabaseService.
    [HttpGet("check")]
    public async Task<IActionResult> CheckConnection()
    {
        // SELECT 1 trả về 1 khi kết nối và truy vấn thành công.
        var result = await _databaseService.CheckConnectionAsync();
        return Ok(new { connected = result == 1 });
    }
}
