using WebApi.Repositories;
using WebApi.Models.SaleOuts;

namespace WebApi.Services;

public class SaleOutService
{
    private readonly SaleOutRepository _saleOutRepository;

    public SaleOutService(SaleOutRepository saleOutRepository)
    {
        _saleOutRepository = saleOutRepository;
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

        string? columnExpr = null;
        if (!string.IsNullOrWhiteSpace(keyword) &&
            (string.IsNullOrWhiteSpace(field) || !allowedFields.TryGetValue(field, out columnExpr)))
        {
            throw new ArgumentException("Trường tìm kiếm không hợp lệ.", nameof(field));
        }

        return await _saleOutRepository.GetSaleOutsAsync(columnExpr, keyword, page, pageSize);
    }

    public Task<string> CreateSaleOutAsync(CreateSaleOutRequest request) =>
        _saleOutRepository.CreateSaleOutAsync(request);
}
