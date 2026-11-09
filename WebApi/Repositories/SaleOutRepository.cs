using Dapper;
using Microsoft.Data.SqlClient;
using WebApi.Models.SaleOuts;

namespace WebApi.Repositories;

public class SaleOutRepository
{
    private readonly string _connectionString;

    public SaleOutRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Chưa cấu hình DefaultConnection.");
    }

    internal async Task<(IEnumerable<SaleOutItemDto> Items, int TotalCount)> GetSaleOutsAsync(
        string? columnExpr, string? keyword, int page, int pageSize)
    {
        string whereClause = "";
        if (columnExpr is not null)
        {
            bool isDateField = columnExpr == "so.OrderDate";
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
    public async Task<string> CreateSaleOutAsync(CreateSaleOutRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var lockResult = await connection.ExecuteScalarAsync<int>("""
            DECLARE @result int;
            EXEC @result = sp_getapplock @Resource = 'SaleOutCreate', @LockMode = 'Exclusive',
                @LockOwner = 'Transaction', @LockTimeout = 10000;
            SELECT @result;
            """, transaction: transaction);
        if (lockResult < 0) throw new InvalidOperationException("Không thể tạo phiếu lúc này, vui lòng thử lại.");

        var po = request.CustomerPoNo.Trim();
        var products = (await connection.QueryAsync<WebApi.Models.Products.Product>(
            "SELECT Id, ProductCode FROM dbo.MasterProduct WHERE Id IN @Ids", new { Ids = request.Items.Select(x => x.ProductId) }, transaction)).ToDictionary(x => x.Id, x => x.ProductCode ?? "");
        foreach (var item in request.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var productCode)) throw new ArgumentException("Sản phẩm không tồn tại.");
            var duplicate = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM dbo.SaleOut WHERE CustomerPoNo = @Po AND ProductId = @ProductId", new { Po = po, item.ProductId }, transaction);
            if (duplicate > 0) throw new InvalidOperationException($"Số PO khách hàng: {po}; Mã sản phẩm: {productCode} đã có trên hệ thống");
            if ((item.Price > 0 && item.Quantity > 999999999999999.999m / item.Price) || item.Quantity / item.QuantityPerBox > 999999999999999.999m)
                throw new ArgumentException("Thành tiền hoặc số thùng vượt giới hạn cho phép.");
        }

        var prefix = "STO" + DateTime.Now.ToString("yyyyMM");
        var lastNumber = await connection.ExecuteScalarAsync<int>("""
            SELECT COALESCE(MAX(TRY_CONVERT(int, RIGHT(SaleOutNo, 4))), 0)
            FROM dbo.SaleOut WHERE SaleOutNo LIKE @Pattern AND LEN(SaleOutNo) = 13
            """, new { Pattern = prefix + "[0-9][0-9][0-9][0-9]" }, transaction);
        if (lastNumber >= 9999) throw new InvalidOperationException("Đã hết mã phiếu trong tháng.");
        var saleOutNo = prefix + (lastNumber + 1).ToString("D4");
        var orderDate = int.Parse(request.OrderDate.Replace("-", ""), System.Globalization.CultureInfo.InvariantCulture);
        foreach (var item in request.Items)
        {
            await connection.ExecuteAsync("""
                INSERT INTO dbo.SaleOut (Id, SaleOutNo, CustomerPoNo, OrderDate, CustomerName, ProductId, Quantity, Price, Amount, QuantityPerBox, BoxQuantity)
                VALUES (@Id, @SaleOutNo, @CustomerPoNo, @OrderDate, @CustomerName, @ProductId, @Quantity, @Price, @Amount, @QuantityPerBox, @BoxQuantity)
                """, new { Id = Guid.NewGuid(), SaleOutNo = saleOutNo, CustomerPoNo = po, OrderDate = orderDate, CustomerName = request.CustomerName.Trim(), item.ProductId, item.Quantity, item.Price, Amount = decimal.Round(item.Quantity * item.Price, 3, MidpointRounding.AwayFromZero), item.QuantityPerBox, BoxQuantity = decimal.Round(item.Quantity / item.QuantityPerBox, 3, MidpointRounding.AwayFromZero) }, transaction);
        }
        await transaction.CommitAsync();
        return saleOutNo;
    }
}
