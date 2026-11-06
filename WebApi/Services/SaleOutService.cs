using Dapper;
using Microsoft.Data.SqlClient;
using WebApi.Models.SaleOuts;

namespace WebApi.Services;

public class SaleOutService
{
    private readonly string _connectionString;

    public SaleOutService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Chưa cấu hình DefaultConnection.");
    }

    /// <summary>
    /// Lấy danh sách xuất hàng kèm tìm kiếm và phân trang trực tiếp từ SQL Server.
    /// </summary>
    public async Task<(IEnumerable<SaleOutItemDto> Items, int TotalCount)> GetSaleOutsAsync(
        string? field,
        string? keyword,
        int page,
        int pageSize)
    {
        // 1. Chỉ cho phép các trường tìm kiếm hợp lệ để bảo mật và chống SQL Injection
        var allowedFields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "CustomerPoNo", "so.CustomerPoNo" },
            { "OrderDate", "so.OrderDate" },
            { "CustomerName", "so.CustomerName" },
            { "ProductCode", "mp.ProductCode" },
            { "ProductName", "mp.ProductName" }
        };

        string whereClause = "";

        // 2. Xử lý điều kiện lọc (WHERE)
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            if (string.IsNullOrWhiteSpace(field) || !allowedFields.TryGetValue(field, out var columnExpr))
            {
                throw new ArgumentException("Trường tìm kiếm không hợp lệ.", nameof(field));
            }

            // Trường OrderDate là kiểu int (yyyyMMdd) -> so sánh bằng; các trường chữ -> dùng LIKE
            bool isDateField = field.Equals("OrderDate", StringComparison.OrdinalIgnoreCase);
            whereClause = isDateField
                ? $"WHERE {columnExpr} = TRY_CONVERT(int, @Keyword)"
                : $"WHERE {columnExpr} LIKE @SearchTerm";
        }

        // 3. Câu SQL kết hợp: đếm tổng số dòng và phân trang dữ liệu trong 1 lần truy vấn
        var sql = $"""
            SELECT COUNT(*)
            FROM dbo.SaleOut so
            INNER JOIN dbo.MasterProduct mp ON so.ProductId = mp.Id
            {whereClause};

            SELECT 
                so.Id,
                so.SaleOutNo,
                so.CustomerPoNo,
                so.OrderDate,
                so.CustomerName,
                so.ProductId,
                mp.ProductCode,
                mp.ProductName,
                mp.Unit,
                so.Quantity,
                so.QuantityPerBox,
                so.BoxQuantity,
                so.Price,
                so.Amount
            FROM dbo.SaleOut so
            INNER JOIN dbo.MasterProduct mp ON so.ProductId = mp.Id
            {whereClause}
            ORDER BY so.OrderDate DESC, so.SaleOutNo DESC, so.Id
            OFFSET @Offset ROWS
            FETCH NEXT @PageSize ROWS ONLY;
            """;

        var parameters = new
        {
            SearchTerm = $"%{keyword?.Trim()}%",
            Keyword = keyword?.Trim(),
            Offset = (page - 1) * pageSize,
            PageSize = pageSize
        };

        // 4. Thực thi bằng Dapper (dùng QueryMultipleAsync để tối ưu hiệu năng)
        await using var connection = new SqlConnection(_connectionString);
        using var result = await connection.QueryMultipleAsync(sql, parameters);

        var totalCount = await result.ReadSingleAsync<int>();
        var items = await result.ReadAsync<SaleOutItemDto>();

        return (items, totalCount);
    }
}