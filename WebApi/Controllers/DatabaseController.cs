using Microsoft.AspNetCore.Mvc;
using WebApi.Services;

namespace WebApi.Controllers;

// Cung cấp API kiểm tra kết nối giữa ứng dụng và cơ sở dữ liệu.
[ApiController]
[Route("api/database")]
public class DatabaseController : ControllerBase
{
    private readonly DatabaseService _databaseService;
    private readonly ILogger<DatabaseController> _logger;

    public DatabaseController(DatabaseService databaseService, ILogger<DatabaseController> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    // GET /api/database/check: chạy truy vấn kiểm tra thông qua DatabaseService.
    [HttpGet("check")]
    public async Task<IActionResult> CheckConnection()
    {
        try
        {
            // SELECT 1 trả về 1 khi kết nối và truy vấn thành công.
            var result = await _databaseService.CheckConnectionAsync();
            return Ok(new { connected = result == 1 });
        }
        // Trả mã lỗi SQL để hỗ trợ xác định nguyên nhân kết nối thất bại.
        catch (Microsoft.Data.SqlClient.SqlException ex)
        {
            _logger.LogError(ex, "Không kiểm tra được kết nối database");
            return StatusCode(500, new
            {
                message = "Không kết nối được database.",
                sqlErrorNumber = ex.Number
            });
        }
    }
}
